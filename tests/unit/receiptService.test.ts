// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { DomainEventSchema, type DomainEvent } from "../../src/domain/events";
import {
  ReceiptService,
  calculateReceiptFromEvents,
} from "../../src/server/services/receiptService";
import type {
  ConsentGrant,
  PreferenceNode,
} from "../../src/shared/domainSchemas";

const profileId = "00000000-0000-4000-8000-000000000001";
const preferenceId = "00000000-0000-4000-8000-000000000010";
const preferenceEventId = "00000000-0000-4000-8000-000000000100";
const firstDecisionId = "00000000-0000-4000-8000-000000000200";
const secondDecisionId = "00000000-0000-4000-8000-000000000201";
const consentId = "00000000-0000-4000-8000-000000000300";
const consentEventId = "00000000-0000-4000-8000-000000000301";

function id(suffix: number) {
  return `00000000-0000-4000-8000-${suffix.toString().padStart(12, "0")}`;
}

function event(input: {
  id: string;
  type: DomainEvent["type"];
  aggregateId?: string;
  actor?: DomainEvent["actor"];
  payload?: Record<string, unknown>;
  occurredAt?: string;
}): DomainEvent {
  return DomainEventSchema.parse({
    id: input.id,
    profileId,
    aggregateId: input.aggregateId ?? profileId,
    type: input.type,
    actor: input.actor ?? "system",
    occurredAt: input.occurredAt ?? "2026-07-14T00:00:00.000Z",
    payload: input.payload ?? {},
  });
}

function preference(
  overrides: Partial<PreferenceNode> = {},
): PreferenceNode {
  return {
    id: preferenceId,
    proposition: "Prefers completion under pressure",
    category: "scheduling",
    sourceType: "accepted_ai_recommendation",
    sourceEventIds: [preferenceEventId],
    parentPreferenceIds: [],
    confidence: 0.8,
    status: "active",
    ...overrides,
  };
}

function consent(
  overrides: Partial<ConsentGrant> = {},
): ConsentGrant {
  return {
    id: consentId,
    profileId,
    category: "scheduling",
    level: "proxy",
    grantedAt: "2026-07-14T00:01:00.000Z",
    revokedAt: null,
    sourceEventId: consentEventId,
    ...overrides,
  };
}

function canonicalEvents(): DomainEvent[] {
  return [
    event({
      id: preferenceEventId,
      aggregateId: preferenceId,
      type: "preference_proposed",
      payload: { preference: preference() },
    }),
    event({
      id: consentEventId,
      aggregateId: consentId,
      type: "consent_granted",
      actor: "human",
      occurredAt: "2026-07-14T00:01:00.000Z",
      payload: { consent: consent() },
    }),
    event({
      id: id(401),
      aggregateId: firstDecisionId,
      type: "recommendation_generated",
      actor: "deepseek",
      occurredAt: "2026-07-14T00:02:00.000Z",
      payload: {
        usedPreferenceIds: [preferenceId],
        humanInitiated: true,
      },
    }),
    event({
      id: id(402),
      aggregateId: secondDecisionId,
      type: "proxy_decision_generated",
      actor: "proxy",
      occurredAt: "2026-07-14T00:03:00.000Z",
      payload: {
        usedPreferenceIds: [preferenceId],
        humanInitiated: false,
        diverged: true,
        category: "scheduling",
        requiredConsentLevel: "proxy",
      },
    }),
  ];
}

describe("deterministic Perfect Consent receipt", () => {
  it("derives metrics and cited lineage evidence without a model call", () => {
    const receipt = calculateReceiptFromEvents(canonicalEvents());

    expect(receipt.metrics).toEqual({
      aiOriginatedPreferenceRatio: 1,
      syntheticInheritanceDepth: 1,
      proxyDivergence: 1,
      humanInitiationRatio: 0.5,
      consentCompleteness: 1,
      unauthorizedDecisionCount: 0,
    });
    expect(receipt.evidence[0]).toMatchObject({
      preferenceId,
      proposition: "Prefers completion under pressure",
      sourceType: "accepted_ai_recommendation",
      sourceEventIds: [preferenceEventId],
      parentPreferenceIds: [],
      usedByDecisionIds: [firstDecisionId, secondDecisionId],
      syntheticDepth: 1,
    });
  });

  it("evaluates authorization at decision time, not current consent state", () => {
    const revokeEvent = event({
      id: id(403),
      type: "consent_revoked",
      actor: "human",
      occurredAt: "2026-07-14T00:04:00.000Z",
      payload: { consentId },
    });

    const receipt = calculateReceiptFromEvents([
      ...canonicalEvents(),
      revokeEvent,
    ]);

    expect(receipt.metrics.consentCompleteness).toBe(1);
    expect(receipt.metrics.unauthorizedDecisionCount).toBe(0);
  });

  it("counts delegated decisions that exceeded consent at their event time", () => {
    const beforeConsent = canonicalEvents()[3];
    const afterConsent = event({
      id: id(404),
      aggregateId: id(204),
      type: "proxy_decision_generated",
      actor: "proxy",
      occurredAt: "2026-07-14T00:05:00.000Z",
      payload: {
        usedPreferenceIds: [preferenceId],
        humanInitiated: false,
        diverged: false,
        category: "scheduling",
        requiredConsentLevel: "proxy",
      },
    });
    const [preferenceEvent, grantEvent] = canonicalEvents();

    const receipt = calculateReceiptFromEvents([
      preferenceEvent,
      { ...beforeConsent, occurredAt: "2026-07-14T00:00:30.000Z" },
      grantEvent,
      afterConsent,
    ]);

    expect(receipt.metrics.consentCompleteness).toBe(0.5);
    expect(receipt.metrics.unauthorizedDecisionCount).toBe(1);
  });

  it("does not erase historically used AI evidence after retraction", () => {
    const receipt = calculateReceiptFromEvents([
      ...canonicalEvents(),
      event({
        id: id(405),
        aggregateId: preferenceId,
        type: "preference_retracted",
        actor: "human",
        occurredAt: "2026-07-14T00:05:00.000Z",
        payload: { preferenceId },
      }),
    ]);

    expect(receipt.metrics.aiOriginatedPreferenceRatio).toBe(1);
    expect(receipt.evidence).toHaveLength(1);
    expect(receipt.evidence[0].preferenceId).toBe(preferenceId);
  });

  it("uses only the active reset epoch and stays deterministic and non-mutating", () => {
    const events = [
      ...canonicalEvents(),
      event({
        id: id(406),
        type: "profile_reset",
        actor: "human",
        occurredAt: "2026-07-14T00:06:00.000Z",
      }),
    ];
    const snapshot = structuredClone(events);

    const first = calculateReceiptFromEvents(events);
    const second = calculateReceiptFromEvents(events);

    expect(first).toEqual(second);
    expect(events).toEqual(snapshot);
    expect(first).toEqual({
      metrics: {
        aiOriginatedPreferenceRatio: 0,
        syntheticInheritanceDepth: 0,
        proxyDivergence: 0,
        humanInitiationRatio: 0,
        consentCompleteness: 0,
        unauthorizedDecisionCount: 0,
      },
      evidence: [],
    });
  });

  it("creates a read-only response from the ledger with a caller-supplied timestamp", () => {
    const ledger = {
      getProfile: vi.fn().mockReturnValue({ id: profileId }),
      list: vi.fn().mockReturnValue(canonicalEvents()),
    };
    const service = new ReceiptService(ledger);

    const receipt = service.createReceipt(
      profileId,
      "2026-07-20T00:00:00.000Z",
    );

    expect(receipt.calculatedAt).toBe("2026-07-20T00:00:00.000Z");
    expect(receipt.metrics.proxyDivergence).toBe(1);
    expect(ledger.getProfile).toHaveBeenCalledTimes(1);
    expect(ledger.list).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown profiles without reading any events", () => {
    const ledger = {
      getProfile: vi.fn().mockReturnValue(undefined),
      list: vi.fn(),
    };
    const service = new ReceiptService(ledger);

    expect(() => service.createReceipt(profileId)).toThrow(
      /profile not found/i,
    );
    expect(ledger.list).not.toHaveBeenCalled();
  });
});
