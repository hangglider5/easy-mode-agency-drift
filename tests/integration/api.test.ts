import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/server/app";
import { createMemoryDatabase } from "../../src/server/db/database";
import { DomainEventSchema, type DomainEvent } from "../../src/domain/events";
import { resolveConsent } from "../../src/domain/consent";
import { LedgerRepository } from "../../src/server/repositories/ledgerRepository";
import type {
  ParsedDecision,
  PreferenceCandidate,
  PreferenceNode,
  Recommendation,
} from "../../src/shared/domainSchemas";

const safeDecision = (): ParsedDecision => ({
  id: randomUUID(),
  title: "Work or meetup?",
  rawText: "Finish a small draft or attend a casual meetup tonight",
  category: "scheduling",
  modelRisk: "routine",
  modelRiskReason: "Low-stakes and reversible",
});

const unsafeDecision = (): ParsedDecision => ({
  id: randomUUID(),
  title: "Stop prescription?",
  rawText: "Should I stop taking my prescription medication?",
  category: "unsupported",
  modelRisk: "high_stakes",
  modelRiskReason: "Medical decision",
});

function recommendation(
  decisionId: string,
  overrides: Partial<Recommendation> = {},
): Recommendation {
  return {
    decisionId,
    recommendation: "Finish the minimum deliverable",
    reasons: ["The deadline is tomorrow"],
    confidence: 0.82,
    reversibility: "high",
    usedPreferenceIds: [],
    alternatives: ["Attend for thirty minutes", "Skip both and rest"],
    artifact: {
      kind: "task",
      title: "Finish minimum deliverable",
      dueAt: null,
    },
    ...overrides,
  };
}

function candidate(
  overrides: Partial<PreferenceCandidate> = {},
): PreferenceCandidate {
  return {
    proposition: "Prefers finishing time-sensitive work before social plans",
    category: "scheduling",
    confidence: 0.74,
    ...overrides,
  };
}

function event(input: {
  id?: string;
  profileId: string;
  aggregateId?: string;
  type: DomainEvent["type"];
  actor?: DomainEvent["actor"];
  payload?: Record<string, unknown>;
}): DomainEvent {
  return DomainEventSchema.parse({
    id: input.id ?? randomUUID(),
    profileId: input.profileId,
    aggregateId: input.aggregateId ?? input.profileId,
    type: input.type,
    actor: input.actor ?? "system",
    occurredAt: new Date().toISOString(),
    payload: input.payload ?? {},
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function resetProfile(
  ledger: LedgerRepository,
  profileId: string,
): DomainEvent {
  const reset = event({ profileId, type: "profile_reset" });
  ledger.append(reset);
  return reset;
}

function createHarness(options?: {
  decisions?: ParsedDecision[];
  recommendationFor?: (decision: ParsedDecision) => Recommendation;
  candidates?: PreferenceCandidate[];
  recommendError?: Error;
}) {
  const ledger = new LedgerRepository(createMemoryDatabase());
  const decisions = options?.decisions ?? [safeDecision()];
  const openrouter = {
    parseSweep: vi.fn(async () => decisions),
    recommend: vi.fn(async (safe: ParsedDecision[]) => {
      if (options?.recommendError) throw options.recommendError;
      return safe.map(
        options?.recommendationFor ??
          ((decision) => recommendation(decision.id)),
      );
    }),
    proposePreferences: vi.fn(
      async () => options?.candidates ?? [candidate()],
    ),
  };
  const app = createApp({ ledger, openrouter });
  return { app, ledger, openrouter, decisions };
}

async function createProfile(
  app: ReturnType<typeof createApp>,
  name = "Alex",
): Promise<string> {
  const response = await request(app)
    .post("/api/profiles")
    .send({ name })
    .expect(201);
  return response.body.id as string;
}

async function createSweep(
  app: ReturnType<typeof createApp>,
  profileId: string,
) {
  return request(app)
    .post("/api/sweeps")
    .send({ profileId, rawInput: "Help me clear this small decision" })
    .expect(201);
}

describe("Decision Sweep API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes health and request IDs, and validates profile creation", async () => {
    const { app } = createHarness();

    const health = await request(app).get("/api/health").expect(200);
    expect(health.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(health.body).toEqual({
      ok: true,
      requestId: health.headers["x-request-id"],
    });

    const profile = await request(app)
      .post("/api/profiles")
      .send({ name: "Alex" })
      .expect(201);
    expect(profile.body).toEqual({
      id: expect.any(String),
      name: "Alex",
      mode: "fresh",
      datesAreSimulated: false,
    });

    const invalid = await request(app)
      .post("/api/profiles")
      .send({ name: "" })
      .expect(400);
    expect(invalid.body).toEqual({
      error: {
        code: "validation_error",
        message: "Invalid request",
        requestId: invalid.headers["x-request-id"],
      },
    });
  });

  it("screens every decision and never sends blocked IDs to recommend", async () => {
    const safe = safeDecision();
    const unsafe = unsafeDecision();
    const { app, ledger, openrouter } = createHarness({
      decisions: [safe, unsafe],
    });
    const profileId = await createProfile(app);

    const response = await createSweep(app, profileId);

    expect(response.body.cards).toHaveLength(2);
    expect(response.body.cards.map((card: { status: string }) => card.status))
      .toEqual(["ready", "blocked"]);
    expect(response.body.cards[0]).toMatchObject({
      id: safe.id,
      title: safe.title,
      status: "ready",
      recommendation: "Finish the minimum deliverable",
    });
    expect(response.body.cards[1]).toMatchObject({
      id: unsafe.id,
      title: unsafe.title,
      status: "blocked",
      reason: "Easy Mode only handles low-stakes, reversible decisions.",
    });
    expect(openrouter.recommend).toHaveBeenCalledTimes(1);
    expect(openrouter.recommend.mock.calls[0]?.[0]).toEqual([safe]);
    expect(openrouter.recommend.mock.calls[0]?.[0]).not.toContainEqual(unsafe);

    expect(ledger.list(profileId).map(({ type }) => type)).toEqual([
      "sweep_submitted",
      "decision_parsed",
      "decision_blocked",
      "recommendation_generated",
    ]);
  });

  it("compares Declared You and Proxy You through the profile route", async () => {
    const { app, ledger, openrouter } = createHarness();
    const profileId = await createProfile(app);
    const parsed = safeDecision();
    const consentId = randomUUID();
    const consentEventId = randomUUID();
    ledger.appendMany([
      event({
        profileId,
        aggregateId: parsed.id,
        type: "decision_parsed",
        payload: { decision: parsed },
      }),
      event({
        id: consentEventId,
        profileId,
        type: "consent_granted",
        actor: "human",
        payload: {
          consent: {
            id: consentId,
            profileId,
            category: parsed.category,
            level: "proxy",
            grantedAt: new Date().toISOString(),
            revokedAt: null,
            sourceEventId: consentEventId,
          },
        },
      }),
    ]);

    const response = await request(app)
      .post(`/api/profiles/${profileId}/compare`)
      .send({ decisionId: parsed.id })
      .expect(200);

    expect(openrouter.recommend).toHaveBeenCalledTimes(2);
    expect(response.body).toMatchObject({
      comparison: {
        decisionId: parsed.id,
        diverged: false,
        humanConsulted: false,
      },
      lineage: { nodes: [] },
      eventId: expect.any(String),
    });
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "proxy_decision_generated"),
    ).toHaveLength(1);
  });

  it("returns a deterministic read-only receipt without calling the model", async () => {
    const { app, ledger, openrouter } = createHarness();
    const profileId = await createProfile(app);
    const preferenceId = randomUUID();
    const preferenceEventId = randomUUID();
    const consentId = randomUUID();
    const consentEventId = randomUUID();
    const decisionId = randomUUID();
    ledger.appendMany([
      event({
        id: preferenceEventId,
        profileId,
        aggregateId: preferenceId,
        type: "preference_proposed",
        payload: {
          preference: {
            id: preferenceId,
            proposition: "Prefers completion under pressure",
            category: "scheduling",
            sourceType: "accepted_ai_recommendation",
            sourceEventIds: [preferenceEventId],
            parentPreferenceIds: [],
            confidence: 0.8,
            status: "active",
          },
        },
      }),
      event({
        id: consentEventId,
        profileId,
        aggregateId: consentId,
        type: "consent_granted",
        actor: "human",
        payload: {
          consent: {
            id: consentId,
            profileId,
            category: "scheduling",
            level: "proxy",
            grantedAt: new Date().toISOString(),
            revokedAt: null,
            sourceEventId: consentEventId,
          },
        },
      }),
      event({
        profileId,
        aggregateId: decisionId,
        type: "proxy_decision_generated",
        actor: "proxy",
        payload: {
          usedPreferenceIds: [preferenceId],
          humanInitiated: false,
          diverged: true,
          category: "scheduling",
          requiredConsentLevel: "proxy",
        },
      }),
    ]);
    const eventCount = ledger.list(profileId).length;

    const first = await request(app)
      .get(`/api/profiles/${profileId}/receipt`)
      .expect(200);
    const second = await request(app)
      .get(`/api/profiles/${profileId}/receipt`)
      .expect(200);

    expect(first.body).toMatchObject({
      metrics: {
        aiOriginatedPreferenceRatio: 1,
        syntheticInheritanceDepth: 1,
        proxyDivergence: 1,
        humanInitiationRatio: 0,
        consentCompleteness: 1,
        unauthorizedDecisionCount: 0,
      },
      evidence: [
        {
          preferenceId,
          usedByDecisionIds: [decisionId],
        },
      ],
      calculatedAt: expect.any(String),
    });
    expect(second.body.metrics).toEqual(first.body.metrics);
    expect(second.body.evidence).toEqual(first.body.evidence);
    expect(ledger.list(profileId)).toHaveLength(eventCount);
    expect(openrouter.parseSweep).not.toHaveBeenCalled();
    expect(openrouter.recommend).not.toHaveBeenCalled();
    expect(openrouter.proposePreferences).not.toHaveBeenCalled();
  });

  it("creates a model-free Demo Profile and preserves a real manual exit", async () => {
    const { app, ledger, openrouter } = createHarness();

    const demo = await request(app).post("/api/profiles/demo").expect(201);
    const profileId = demo.body.id as string;
    expect(demo.body).toMatchObject({
      name: "Alex",
      mode: "demo",
      datesAreSimulated: true,
      decisionId: expect.any(String),
      reveal: {
        comparison: {
          diverged: true,
          humanConsulted: false,
        },
        lineage: { nodes: expect.any(Array) },
      },
    });

    const receipt = await request(app)
      .get(`/api/profiles/${profileId}/receipt`)
      .expect(200);
    expect(receipt.body.metrics).toEqual({
      aiOriginatedPreferenceRatio: 0.73,
      syntheticInheritanceDepth: 3,
      proxyDivergence: 0.68,
      humanInitiationRatio: 12 / 112,
      consentCompleteness: 1,
      unauthorizedDecisionCount: 0,
    });

    const manual = await request(app)
      .post(`/api/profiles/${profileId}/manual-mode`)
      .expect(200);
    expect(manual.body).toEqual({
      manualMode: true,
      revokedConsentIds: [expect.any(String)],
    });
    const events = ledger.list(profileId);
    expect(events.at(-2)?.type).toBe("consent_revoked");
    expect(events.at(-1)?.type).toBe("manual_mode_enabled");
    expect(resolveConsent(events, "scheduling")).toBeNull();
    expect(openrouter.parseSweep).not.toHaveBeenCalled();
    expect(openrouter.recommend).not.toHaveBeenCalled();
    expect(openrouter.proposePreferences).not.toHaveBeenCalled();
  });

  it("validates sweep input and rejects unknown profiles", async () => {
    const { app, openrouter } = createHarness();

    await request(app)
      .post("/api/sweeps")
      .send({ profileId: randomUUID(), rawInput: "ok" })
      .expect(400);
    expect(openrouter.parseSweep).not.toHaveBeenCalled();

    await request(app)
      .post("/api/sweeps")
      .send({ profileId: randomUUID(), rawInput: "A valid input" })
      .expect(404);
    expect(openrouter.parseSweep).not.toHaveBeenCalled();
  });

  it("returns only stored alternatives and appends an audit event", async () => {
    const safe = safeDecision();
    const stored = recommendation(safe.id, {
      alternatives: ["Stored A", "Stored B"],
    });
    const { app, ledger, openrouter } = createHarness({
      decisions: [safe],
      recommendationFor: () => stored,
    });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    openrouter.recommend.mockClear();

    const response = await request(app)
      .post(`/api/decisions/${safe.id}/alternatives`)
      .send({ profileId })
      .expect(200);

    expect(response.body).toEqual({
      decisionId: safe.id,
      alternatives: ["Stored A", "Stored B"],
    });
    expect(openrouter.recommend).not.toHaveBeenCalled();
    expect(ledger.list(profileId).at(-1)).toMatchObject({
      type: "alternative_requested",
      aggregateId: safe.id,
      actor: "human",
    });
  });

  it("accepts atomically and returns the identical stored response on retry", async () => {
    const parentPreferenceId = randomUUID();
    const parentEventId = randomUUID();
    const safe = safeDecision();
    const stored = recommendation(safe.id, {
      usedPreferenceIds: [parentPreferenceId],
    });
    const { app, ledger, openrouter } = createHarness({
      decisions: [safe],
      recommendationFor: () => stored,
      candidates: [candidate()],
    });
    const profileId = await createProfile(app);
    ledger.append(
      event({
        id: parentEventId,
        profileId,
        type: "preference_proposed",
        payload: {
          preference: {
            id: parentPreferenceId,
            proposition: "Prefers short work sessions",
            category: "task",
            sourceType: "explicit_user_statement",
            sourceEventIds: [parentEventId],
            parentPreferenceIds: [],
            confidence: 1,
            status: "active",
          },
        },
      }),
    );
    await createSweep(app, profileId);
    const idempotencyKey = randomUUID();

    const first = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(200);
    const eventsAfterFirst = ledger.list(profileId);

    const second = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(200);

    expect(second.body).toEqual(first.body);
    expect(ledger.list(profileId)).toEqual(eventsAfterFirst);
    expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1);
    expect(first.body).toMatchObject({
      artifact: stored.artifact,
      eventId: expect.any(String),
      proposedPreferences: [
        {
          proposition: candidate().proposition,
          sourceType: "accepted_ai_recommendation",
          sourceEventIds: [idempotencyKey],
          parentPreferenceIds: [parentPreferenceId],
          status: "active",
        },
      ],
    });
    expect(eventsAfterFirst.slice(-3).map(({ type }) => type)).toEqual([
      "decision_accepted",
      "action_artifact_created",
      "preference_proposed",
    ]);
    expect(eventsAfterFirst.at(-3)?.id).toBe(idempotencyKey);
  });

  it("conflicts when an idempotency key is reused for another decision", async () => {
    const firstDecision = safeDecision();
    const secondDecision = safeDecision();
    const { app } = createHarness({
      decisions: [firstDecision, secondDecision],
    });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const idempotencyKey = randomUUID();

    await request(app)
      .post(`/api/decisions/${firstDecision.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(200);
    const conflict = await request(app)
      .post(`/api/decisions/${secondDecision.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(409);
    expect(conflict.body.error.message).toBe("Idempotency key conflict");
  });

  it("rejects blocked and missing decisions without proposing preferences", async () => {
    const blocked = unsafeDecision();
    const { app, openrouter } = createHarness({ decisions: [blocked] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);

    await request(app)
      .post(`/api/decisions/${blocked.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(409);
    await request(app)
      .post(`/api/decisions/${randomUUID()}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(404);
    expect(openrouter.proposePreferences).not.toHaveBeenCalled();
  });

  it("resolves preferences without rewriting ancestry and edits by superseding", async () => {
    const safe = safeDecision();
    const { app } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const acceptance = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(200);
    const original = acceptance.body.proposedPreferences[0] as PreferenceNode;

    await request(app)
      .post(`/api/preferences/${original.id}/resolve`)
      .send({ profileId, resolution: "confirm" })
      .expect(200);

    const edited = await request(app)
      .post(`/api/preferences/${original.id}/resolve`)
      .send({
        profileId,
        resolution: "confirm",
        editedProposition: "I prefer completing brief focused work first",
      })
      .expect(200);

    expect(edited.body.preference).toMatchObject({
      id: expect.not.stringMatching(original.id),
      proposition: "I prefer completing brief focused work first",
      category: original.category,
      sourceType: "explicit_user_statement",
      parentPreferenceIds: [],
      status: "active",
    });

    const state = await request(app)
      .get(`/api/profiles/${profileId}/state`)
      .expect(200);
    const originalState = state.body.preferences.find(
      (preference: PreferenceNode) => preference.id === original.id,
    );
    const editedState = state.body.preferences.find(
      (preference: PreferenceNode) =>
        preference.id === edited.body.preference.id,
    );
    expect(originalState).toMatchObject({
      sourceType: "accepted_ai_recommendation",
      sourceEventIds: original.sourceEventIds,
      parentPreferenceIds: original.parentPreferenceIds,
      status: "superseded",
    });
    expect(editedState).toMatchObject({
      sourceType: "explicit_user_statement",
      status: "active",
    });
    expect(
      state.body.activeEvents.filter(
        (entry: DomainEvent) => entry.type === "preference_superseded",
      ),
    ).toHaveLength(1);
  });

  it.each([
    ["reject", "preference_rejected"],
    ["retract", "preference_retracted"],
  ] as const)("maps %s resolution to %s", async (resolution, eventType) => {
    const safe = safeDecision();
    const { app, ledger } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const accepted = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(200);
    const preferenceId = accepted.body.proposedPreferences[0].id as string;

    await request(app)
      .post(`/api/preferences/${preferenceId}/resolve`)
      .send({ profileId, resolution })
      .expect(200);

    expect(ledger.list(profileId).at(-1)).toMatchObject({
      type: eventType,
      payload: { preferenceId },
    });
  });

  it("returns latest-reset active state and current preference nodes", async () => {
    const { app, ledger } = createHarness();
    const profileId = await createProfile(app);
    const oldEventId = randomUUID();
    const activeEventId = randomUUID();
    const activePreferenceId = randomUUID();
    ledger.append(
      event({
        id: oldEventId,
        profileId,
        type: "sweep_submitted",
        payload: { rawInput: "Old" },
      }),
    );
    ledger.append(event({ profileId, type: "profile_reset" }));
    ledger.append(
      event({
        id: activeEventId,
        profileId,
        type: "preference_proposed",
        payload: {
          preference: {
            id: activePreferenceId,
            proposition: "Prefers morning tasks",
            category: "task",
            sourceType: "explicit_user_statement",
            sourceEventIds: [activeEventId],
            parentPreferenceIds: [],
            confidence: 1,
            status: "active",
          },
        },
      }),
    );

    const state = await request(app)
      .get(`/api/profiles/${profileId}/state`)
      .expect(200);

    expect(state.body.allEvents).toHaveLength(3);
    expect(state.body.activeEvents).toHaveLength(2);
    expect(state.body.activeEvents[0].type).toBe("profile_reset");
    expect(state.body.preferences).toEqual([
      expect.objectContaining({ id: activePreferenceId, status: "active" }),
    ]);
  });

  it("downloads only active stored calendar artifacts", async () => {
    const safe = safeDecision();
    const calendar = recommendation(safe.id, {
      artifact: {
        kind: "calendar_event",
        title: "Draft review",
        startsAt: "2026-07-20T09:00:00.000Z",
        endsAt: "2026-07-20T09:30:00.000Z",
        description: "Review the short draft",
      },
    });
    const { app, ledger } = createHarness({
      decisions: [safe],
      recommendationFor: () => calendar,
    });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const accepted = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(200);

    const download = await request(app)
      .get(`/api/artifacts/${accepted.body.eventId}/calendar.ics`)
      .expect(200);
    expect(download.headers["content-type"]).toMatch(/^text\/calendar/);
    expect(download.text).toContain("BEGIN:VCALENDAR");
    expect(download.text).toContain("BEGIN:VEVENT");
    const repeatedDownload = await request(app)
      .get(`/api/artifacts/${accepted.body.eventId}/calendar.ics`)
      .expect(200);
    expect(repeatedDownload.text).toBe(download.text);

    await request(app)
      .get(`/api/artifacts/${randomUUID()}/calendar.ics`)
      .expect(404);

    ledger.append(event({ profileId, type: "profile_reset" }));
    await request(app)
      .get(`/api/artifacts/${accepted.body.eventId}/calendar.ics`)
      .expect(409);
  });

  it("uses distinct stable calendar UIDs for distinct artifact events with identical content", async () => {
    const firstDecision = safeDecision();
    const secondDecision = safeDecision();
    const calendarArtifact = {
      kind: "calendar_event" as const,
      title: "Draft review",
      startsAt: "2026-07-20T09:00:00.000Z",
      endsAt: "2026-07-20T09:30:00.000Z",
      description: "Review the short draft",
    };
    const { app } = createHarness({
      decisions: [firstDecision, secondDecision],
      recommendationFor: (decision) =>
        recommendation(decision.id, { artifact: calendarArtifact }),
    });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const firstAcceptance = await request(app)
      .post(`/api/decisions/${firstDecision.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(200);
    const secondAcceptance = await request(app)
      .post(`/api/decisions/${secondDecision.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(200);

    const firstDownload = await request(app)
      .get(`/api/artifacts/${firstAcceptance.body.eventId}/calendar.ics`)
      .expect(200);
    const secondDownload = await request(app)
      .get(`/api/artifacts/${secondAcceptance.body.eventId}/calendar.ics`)
      .expect(200);
    const firstUid = firstDownload.text.match(/^UID:(.+)$/m)?.[1];
    const secondUid = secondDownload.text.match(/^UID:(.+)$/m)?.[1];
    expect(firstUid).toBeTruthy();
    expect(secondUid).toBeTruthy();
    expect(secondUid).not.toBe(firstUid);
  });

  it("rejects non-calendar artifact downloads", async () => {
    const safe = safeDecision();
    const { app } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const accepted = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(200);

    await request(app)
      .get(`/api/artifacts/${accepted.body.eventId}/calendar.ics`)
      .expect(409);
  });

  it("enforces the 32kb JSON limit and handles malformed JSON centrally", async () => {
    const { app } = createHarness();

    const tooLarge = await request(app)
      .post("/api/profiles")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ name: "x".repeat(33 * 1024) }))
      .expect(413);
    expect(tooLarge.body.error).toEqual({
      code: "payload_too_large",
      message: "Request body is too large",
      requestId: tooLarge.headers["x-request-id"],
    });

    const malformed = await request(app)
      .post("/api/profiles")
      .set("Content-Type", "application/json")
      .send('{"name":')
      .expect(400);
    expect(malformed.body.error).toEqual({
      code: "invalid_json",
      message: "Invalid JSON body",
      requestId: malformed.headers["x-request-id"],
    });
  });

  it("sanitizes model/provider failures in the centralized error response", async () => {
    const { app } = createHarness({
      recommendError: new Error(
        "OpenRouter 401 sk-or-v1-secret upstream response body",
      ),
    });
    const profileId = await createProfile(app);

    const response = await request(app)
      .post("/api/sweeps")
      .send({ profileId, rawInput: "Help with this routine choice" })
      .expect(500);

    expect(JSON.stringify(response.body)).not.toContain("OpenRouter");
    expect(JSON.stringify(response.body)).not.toContain("secret");
    expect(response.body).toEqual({
      error: {
        code: "internal_error",
        message: "The request could not be completed",
        requestId: response.headers["x-request-id"],
      },
    });
  });

  it("rejects a sweep when reset occurs while parsing without reviving stale events", async () => {
    const gate = deferred<ParsedDecision[]>();
    const safe = safeDecision();
    const { app, ledger, openrouter } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    openrouter.parseSweep.mockImplementationOnce(() => gate.promise);

    const pending = request(app)
      .post("/api/sweeps")
      .send({ profileId, rawInput: "Help with this routine choice" })
      .expect(409)
      .then((response) => response);
    await vi.waitFor(() =>
      expect(openrouter.parseSweep).toHaveBeenCalledTimes(1),
    );
    resetProfile(ledger, profileId);
    gate.resolve([safe]);

    const response = await pending;
    expect(response.body.error.code).toBe("state_changed");
    expect(
      ledger.list(profileId).filter(({ type }) =>
        [
          "decision_parsed",
          "decision_blocked",
          "recommendation_generated",
        ].includes(type),
      ),
    ).toEqual([]);
    expect(
      response.body.error.message.toLowerCase(),
    ).toContain("state changed");
    expect(
      ledger.list(profileId).filter(({ type }) => type === "profile_reset"),
    ).toHaveLength(1);
  });

  it("rejects a sweep when reset occurs while recommending without appending stale recommendations", async () => {
    const safe = safeDecision();
    const gate = deferred<Recommendation[]>();
    const { app, ledger, openrouter } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    openrouter.recommend.mockImplementationOnce(() => gate.promise);

    const pending = request(app)
      .post("/api/sweeps")
      .send({ profileId, rawInput: "Help with this routine choice" })
      .expect(409)
      .then((response) => response);
    await vi.waitFor(() =>
      expect(openrouter.recommend).toHaveBeenCalledTimes(1),
    );
    resetProfile(ledger, profileId);
    gate.resolve([recommendation(safe.id)]);

    const response = await pending;
    expect(response.body.error.code).toBe("state_changed");
    const activeEvents = (
      await request(app)
        .get(`/api/profiles/${profileId}/state`)
        .expect(200)
    ).body.activeEvents as DomainEvent[];
    expect(activeEvents.map(({ type }) => type)).toEqual(["profile_reset"]);
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "recommendation_generated"),
    ).toEqual([]);
  });

  it("does not mistake unrelated concurrent events for a reset", async () => {
    const safe = safeDecision();
    const gate = deferred<Recommendation[]>();
    const { app, ledger, openrouter } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    openrouter.recommend.mockImplementationOnce(() => gate.promise);

    const pending = request(app)
      .post("/api/sweeps")
      .send({ profileId, rawInput: "Help with this routine choice" })
      .expect(201)
      .then((response) => response);
    await vi.waitFor(() =>
      expect(openrouter.recommend).toHaveBeenCalledTimes(1),
    );
    ledger.append(
      event({
        profileId,
        type: "manual_mode_enabled",
        actor: "human",
      }),
    );
    gate.resolve([recommendation(safe.id)]);

    const response = await pending;
    expect(response.body.cards).toHaveLength(1);
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "recommendation_generated"),
    ).toHaveLength(1);
  });

  it("rejects acceptance when reset occurs while proposing without writing stale acceptance events", async () => {
    const safe = safeDecision();
    const gate = deferred<PreferenceCandidate[]>();
    const { app, ledger, openrouter } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    openrouter.proposePreferences.mockImplementationOnce(() => gate.promise);

    const pending = request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey: randomUUID() })
      .expect(409)
      .then((response) => response);
    await vi.waitFor(() =>
      expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1),
    );
    resetProfile(ledger, profileId);
    gate.resolve([candidate()]);

    const response = await pending;
    expect(response.body.error.code).toBe("state_changed");
    const activeEvents = (
      await request(app)
        .get(`/api/profiles/${profileId}/state`)
        .expect(200)
    ).body.activeEvents as DomainEvent[];
    expect(activeEvents.map(({ type }) => type)).toEqual(["profile_reset"]);
    expect(
      ledger.list(profileId).filter(({ type }) =>
        [
          "decision_accepted",
          "action_artifact_created",
          "preference_proposed",
        ].includes(type),
      ),
    ).toEqual([]);
  });

  it("single-flights concurrent acceptance with the same target and idempotency key", async () => {
    const safe = safeDecision();
    const gate = deferred<PreferenceCandidate[]>();
    const { app, ledger, openrouter } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    openrouter.proposePreferences.mockImplementationOnce(() => gate.promise);
    const idempotencyKey = randomUUID();
    const sendAccept = () =>
      request(app)
        .post(`/api/decisions/${safe.id}/accept`)
        .send({ profileId, idempotencyKey })
        .expect(200)
        .then((response) => response);

    const first = sendAccept();
    const second = sendAccept();
    await vi.waitFor(() =>
      expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1),
    );
    gate.resolve([candidate()]);
    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1);
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "decision_accepted"),
    ).toHaveLength(1);
  });

  it("conflicts immediately when an in-flight idempotency key targets another decision", async () => {
    const firstDecision = safeDecision();
    const secondDecision = safeDecision();
    const gate = deferred<PreferenceCandidate[]>();
    const { app, openrouter } = createHarness({
      decisions: [firstDecision, secondDecision],
    });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    openrouter.proposePreferences.mockImplementationOnce(() => gate.promise);
    const idempotencyKey = randomUUID();

    const first = request(app)
      .post(`/api/decisions/${firstDecision.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(200)
      .then((response) => response);
    await vi.waitFor(() =>
      expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1),
    );
    const conflict = await request(app)
      .post(`/api/decisions/${secondDecision.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(409);
    expect(conflict.body.error.code).toBe("idempotency_conflict");
    expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1);
    gate.resolve([candidate()]);
    await first;
  });

  it("recovers the winning stored response after a cross-service append race", async () => {
    const safe = safeDecision();
    const firstGate = deferred<PreferenceCandidate[]>();
    const secondGate = deferred<PreferenceCandidate[]>();
    const { app: firstApp, ledger, openrouter: firstGateway } =
      createHarness({ decisions: [safe] });
    const secondGateway = {
      parseSweep: vi.fn(async () => [safe]),
      recommend: vi.fn(async () => [recommendation(safe.id)]),
      proposePreferences: vi.fn(() => secondGate.promise),
    };
    const secondApp = createApp({
      ledger,
      openrouter: secondGateway,
    });
    const profileId = await createProfile(firstApp);
    await createSweep(firstApp, profileId);
    firstGateway.proposePreferences.mockImplementationOnce(
      () => firstGate.promise,
    );
    const idempotencyKey = randomUUID();
    const sendAccept = (app: ReturnType<typeof createApp>) =>
      request(app)
        .post(`/api/decisions/${safe.id}/accept`)
        .send({ profileId, idempotencyKey })
        .expect(200)
        .then((response) => response);

    const first = sendAccept(firstApp);
    const second = sendAccept(secondApp);
    await vi.waitFor(() => {
      expect(firstGateway.proposePreferences).toHaveBeenCalledTimes(1);
      expect(secondGateway.proposePreferences).toHaveBeenCalledTimes(1);
    });
    firstGate.resolve([candidate()]);
    secondGate.resolve([candidate()]);
    const [firstResponse, secondResponse] = await Promise.all([first, second]);

    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "decision_accepted"),
    ).toHaveLength(1);
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "action_artifact_created"),
    ).toHaveLength(1);
  });

  it.each([
    {
      label: "unknown blocked ID",
      decisions: [safeDecision(), unsafeDecision()],
      makeRecommendations: (decisions: ParsedDecision[]) => [
        recommendation(decisions[0]!.id),
        recommendation(decisions[1]!.id),
      ],
    },
    {
      label: "duplicate safe ID",
      decisions: [safeDecision()],
      makeRecommendations: (decisions: ParsedDecision[]) => [
        recommendation(decisions[0]!.id),
        recommendation(decisions[0]!.id),
      ],
    },
    {
      label: "missing safe ID",
      decisions: [safeDecision(), safeDecision()],
      makeRecommendations: (decisions: ParsedDecision[]) => [
        recommendation(decisions[0]!.id),
      ],
    },
  ])(
    "fails closed on malicious recommendation output with $label",
    async ({ decisions, makeRecommendations }) => {
      const { app, ledger, openrouter } = createHarness({ decisions });
      const profileId = await createProfile(app);
      openrouter.recommend.mockResolvedValueOnce(
        makeRecommendations(decisions),
      );

      await request(app)
        .post("/api/sweeps")
        .send({ profileId, rawInput: "Help with these routine choices" })
        .expect(500);

      expect(
        ledger
          .list(profileId)
          .filter(({ type }) => type === "recommendation_generated"),
      ).toEqual([]);
      const blocked = decisions.find(
        ({ modelRisk }) => modelRisk !== "routine",
      );
      if (blocked) {
        await request(app)
          .post(`/api/decisions/${blocked.id}/alternatives`)
          .send({ profileId })
          .expect(409);
        await request(app)
          .post(`/api/decisions/${blocked.id}/accept`)
          .send({ profileId, idempotencyKey: randomUUID() })
          .expect(409);
      }
    },
  );

  it("fails closed on duplicate parsed decision IDs before writing decision events", async () => {
    const duplicateId = randomUUID();
    const safe = { ...safeDecision(), id: duplicateId };
    const blocked = { ...unsafeDecision(), id: duplicateId };
    const { app, ledger, openrouter } = createHarness({
      decisions: [safe, blocked],
    });
    const profileId = await createProfile(app);

    const response = await request(app)
      .post("/api/sweeps")
      .send({ profileId, rawInput: "Help with these choices" })
      .expect(500);

    expect(response.body.error.code).toBe("internal_error");
    expect(openrouter.recommend).not.toHaveBeenCalled();
    expect(
      ledger.list(profileId).filter(({ type }) =>
        [
          "decision_parsed",
          "decision_blocked",
          "recommendation_generated",
        ].includes(type),
      ),
    ).toEqual([]);
  });

  it("fails closed when a recommendation cites a preference outside the active profile", async () => {
    const safe = safeDecision();
    const foreignPreferenceId = randomUUID();
    const foreignProposalEventId = randomUUID();
    const { app, ledger, openrouter } = createHarness({
      decisions: [safe],
    });
    const profileId = await createProfile(app, "Alex");
    const foreignProfileId = await createProfile(app, "Taylor");
    ledger.append(
      event({
        id: foreignProposalEventId,
        profileId: foreignProfileId,
        type: "preference_proposed",
        actor: "human",
        payload: {
          preference: {
            id: foreignPreferenceId,
            proposition: "Prefers morning meetings",
            category: "scheduling",
            sourceType: "explicit_user_statement",
            sourceEventIds: [foreignProposalEventId],
            parentPreferenceIds: [],
            confidence: 1,
            status: "active",
          },
        },
      }),
    );
    openrouter.recommend.mockResolvedValueOnce([
      recommendation(safe.id, {
        usedPreferenceIds: [foreignPreferenceId],
      }),
    ]);

    const response = await request(app)
      .post("/api/sweeps")
      .send({ profileId, rawInput: "Help with this routine choice" })
      .expect(500);

    expect(response.body.error.code).toBe("internal_error");
    expect(
      ledger
        .list(profileId)
        .filter(({ type }) => type === "recommendation_generated"),
    ).toEqual([]);
  });

  it("rejects retrying an acceptance idempotency key after reset", async () => {
    const safe = safeDecision();
    const { app, ledger, openrouter } = createHarness({ decisions: [safe] });
    const profileId = await createProfile(app);
    await createSweep(app, profileId);
    const idempotencyKey = randomUUID();
    await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(200);
    resetProfile(ledger, profileId);

    const retry = await request(app)
      .post(`/api/decisions/${safe.id}/accept`)
      .send({ profileId, idempotencyKey })
      .expect(409);

    expect(retry.body.error.code).toBe("idempotency_inactive");
    expect(openrouter.proposePreferences).toHaveBeenCalledTimes(1);
  });
});
