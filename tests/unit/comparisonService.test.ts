// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { DomainEventSchema, type DomainEvent } from "../../src/domain/events";
import { createMemoryDatabase } from "../../src/server/db/database";
import { LedgerRepository } from "../../src/server/repositories/ledgerRepository";
import { ComparisonService } from "../../src/server/services/comparisonService";
import type {
  ParsedDecision,
  PreferenceNode,
  Recommendation,
} from "../../src/shared/domainSchemas";

function recommendation(
  decisionId: string,
  text: string,
  usedPreferenceIds: string[],
): Recommendation {
  return {
    decisionId,
    recommendation: text,
    reasons: ["This follows the supplied preference evidence."],
    confidence: 0.84,
    reversibility: "high",
    usedPreferenceIds,
    alternatives: [],
    artifact: { kind: "task", title: text, dueAt: null },
  };
}

function decision(): ParsedDecision {
  return {
    id: randomUUID(),
    title: "Dinner or project?",
    rawText: "Attend a casual dinner or finish a small project milestone",
    category: "scheduling",
    modelRisk: "routine",
    modelRiskReason: "Low-stakes and reversible",
  };
}

function preference(
  sourceType: PreferenceNode["sourceType"],
  parentPreferenceIds: string[] = [],
): PreferenceNode {
  return {
    id: randomUUID(),
    proposition:
      sourceType === "explicit_user_statement"
        ? "Values time with close friends"
        : "Tends to prioritize completion under pressure",
    category: "scheduling",
    sourceType,
    sourceEventIds: [randomUUID()],
    parentPreferenceIds,
    confidence: sourceType === "explicit_user_statement" ? 1 : 0.78,
    status: "active",
  };
}

function event(input: {
  profileId: string;
  aggregateId?: string;
  type: DomainEvent["type"];
  actor?: DomainEvent["actor"];
  payload: Record<string, unknown>;
  id?: string;
}): DomainEvent {
  return DomainEventSchema.parse({
    id: input.id ?? randomUUID(),
    profileId: input.profileId,
    aggregateId: input.aggregateId ?? input.profileId,
    type: input.type,
    actor: input.actor ?? "system",
    occurredAt: new Date().toISOString(),
    payload: input.payload,
  });
}

function createProfileState() {
  const ledger = new LedgerRepository(createMemoryDatabase());
  const profileId = ledger.createProfile("Alex");
  const parsed = decision();
  const declared = preference("explicit_user_statement");
  const proxy = preference("accepted_ai_recommendation", [declared.id]);
  const declaredEvent = event({
    id: declared.sourceEventIds[0],
    profileId,
    aggregateId: declared.id,
    type: "preference_proposed",
    actor: "human",
    payload: { preference: declared },
  });
  const proxyEvent = event({
    id: proxy.sourceEventIds[0],
    profileId,
    aggregateId: proxy.id,
    type: "preference_proposed",
    actor: "deepseek",
    payload: { preference: proxy },
  });
  const consentId = randomUUID();
  const consentEventId = randomUUID();
  ledger.appendMany([
    event({
      profileId,
      aggregateId: parsed.id,
      type: "decision_parsed",
      payload: { decision: parsed },
    }),
    declaredEvent,
    proxyEvent,
    event({
      id: consentEventId,
      profileId,
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
  ]);
  return { ledger, profileId, parsed, declared, proxy, consentId };
}

describe("ComparisonService", () => {
  it("uses the same gateway with different allowed preference sets", async () => {
    const parsed = decision();
    const declared = preference("explicit_user_statement");
    const proxy = preference("accepted_ai_recommendation");
    const recommend = vi
      .fn()
      .mockResolvedValueOnce([
        recommendation(parsed.id, "Attend dinner", [declared.id]),
      ])
      .mockResolvedValueOnce([
        recommendation(parsed.id, "Finish project", [proxy.id]),
      ]);
    const service = new ComparisonService({ openrouter: { recommend } });

    const result = await service.compare({
      decision: parsed,
      declared: [declared],
      proxy: [declared, proxy],
    });

    expect(recommend).toHaveBeenCalledTimes(2);
    expect(recommend.mock.calls[0][0]).toEqual([parsed]);
    expect(recommend.mock.calls[0][1]).toEqual([declared]);
    expect(recommend.mock.calls[1][0]).toEqual([parsed]);
    expect(recommend.mock.calls[1][1]).toEqual([declared, proxy]);
    expect(result.diverged).toBe(true);
  });

  it("requires proxy consent, appends one normalized event, and returns decisive lineage", async () => {
    const state = createProfileState();
    const recommend = vi
      .fn()
      .mockResolvedValueOnce([
        recommendation(
          state.parsed.id,
          "Attend dinner",
          [state.declared.id],
        ),
      ])
      .mockResolvedValueOnce([
        recommendation(
          state.parsed.id,
          "Finish project",
          [state.proxy.id],
        ),
      ]);
    const service = new ComparisonService({
      ledger: state.ledger,
      openrouter: { recommend },
    });

    const result = await service.compareProfile(
      state.profileId,
      state.parsed.id,
    );

    expect(result.comparison).toMatchObject({
      decisionId: state.parsed.id,
      diverged: true,
      humanConsulted: false,
      declared: { recommendation: "Attend dinner" },
      proxy: { recommendation: "Finish project" },
    });
    expect(result.lineage.nodes.map(({ id }) => id)).toEqual([
      state.proxy.id,
      state.declared.id,
    ]);
    const proxyEvents = state.ledger
      .list(state.profileId)
      .filter(({ type }) => type === "proxy_decision_generated");
    expect(proxyEvents).toHaveLength(1);
    expect(proxyEvents[0].payload).toMatchObject({
      declared: { recommendation: "Attend dinner" },
      proxy: { recommendation: "Finish project" },
      usedPreferenceIds: [state.proxy.id],
      diverged: true,
      humanInitiated: false,
      category: "scheduling",
      requiredConsentLevel: "proxy",
      consentId: state.consentId,
    });
  });

  it("fails before any model call when proxy consent is missing", async () => {
    const state = createProfileState();
    state.ledger.append(
      event({
        profileId: state.profileId,
        type: "consent_revoked",
        actor: "human",
        payload: { consentId: state.consentId },
      }),
    );
    const recommend = vi.fn();
    const service = new ComparisonService({
      ledger: state.ledger,
      openrouter: { recommend },
    });

    await expect(
      service.compareProfile(state.profileId, state.parsed.id),
    ).rejects.toMatchObject({
      status: 409,
      code: "proxy_consent_required",
    });
    expect(recommend).not.toHaveBeenCalled();
  });

  it("rejects model citations outside each supplied projection", async () => {
    const state = createProfileState();
    const unknownPreferenceId = randomUUID();
    const recommend = vi
      .fn()
      .mockResolvedValueOnce([
        recommendation(
          state.parsed.id,
          "Attend dinner",
          [unknownPreferenceId],
        ),
      ])
      .mockResolvedValueOnce([
        recommendation(
          state.parsed.id,
          "Finish project",
          [state.proxy.id],
        ),
      ]);
    const service = new ComparisonService({
      ledger: state.ledger,
      openrouter: { recommend },
    });

    await expect(
      service.compareProfile(state.profileId, state.parsed.id),
    ).rejects.toThrow(/comparison response failed validation/i);
    expect(
      state.ledger
        .list(state.profileId)
        .filter(({ type }) => type === "proxy_decision_generated"),
    ).toHaveLength(0);
  });

  it("does not append stale results when consent changes during comparison", async () => {
    const state = createProfileState();
    const recommend = vi
      .fn()
      .mockImplementationOnce(async () => {
        state.ledger.append(
          event({
            profileId: state.profileId,
            type: "consent_revoked",
            actor: "human",
            payload: { consentId: state.consentId },
          }),
        );
        return [
          recommendation(
            state.parsed.id,
            "Attend dinner",
            [state.declared.id],
          ),
        ];
      })
      .mockResolvedValueOnce([
          recommendation(
            state.parsed.id,
            "Finish project",
            [state.proxy.id],
          ),
        ]);
    const service = new ComparisonService({
      ledger: state.ledger,
      openrouter: { recommend },
    });

    await expect(
      service.compareProfile(state.profileId, state.parsed.id),
    ).rejects.toMatchObject({ status: 409, code: "state_changed" });
    expect(recommend).toHaveBeenCalledTimes(1);
    expect(
      state.ledger
        .list(state.profileId)
        .filter(({ type }) => type === "proxy_decision_generated"),
    ).toHaveLength(0);
  });
});
