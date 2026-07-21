import { createHash } from "node:crypto";
import { z } from "zod";
import { DomainEventSchema, type DomainEvent } from "../../domain/events";
import { buildLineage } from "../../domain/lineage";
import {
  CompareResponseSchema,
  ComparisonResultSchema,
  DriftReplayResponseSchema,
  type CompareResponse,
  type DriftReplayResponse,
} from "../../shared/apiSchemas";
import {
  ConsentGrantSchema,
  ParsedDecisionSchema,
  PreferenceNodeSchema,
  RecommendationSchema,
  type PreferenceNode,
} from "../../shared/domainSchemas";

export const DEMO_PROFILE_ANCHOR = "2026-07-01T09:00:00.000Z";

const DemoRevealPayloadSchema = z.object({
  demoReveal: z.literal(true),
  comparison: ComparisonResultSchema,
});

const ConsentEventPayloadSchema = z.object({
  consent: ConsentGrantSchema,
});

const humanPreferenceCopy = [
  "Values direct coordination when a plan is ambiguous",
  "Protects time promised to close collaborators",
  "Prefers reversible choices when context is incomplete",
  "Writes short updates instead of leaving people waiting",
  "Keeps one unscheduled block for unexpected work",
  "Prefers simple meals on deadline days",
  "Avoids adding optional errands to crowded afternoons",
  "Confirms plans before changing shared calendars",
  "Uses a short checklist for routine launch work",
  "Prefers finishing one draft before starting another",
  "Keeps social commitments when they were explicitly promised",
  "Chooses familiar tools when delivery time is limited",
] as const;

export function createDemoProfileEvents(
  profileId: string,
  anchor = DEMO_PROFILE_ANCHOR,
): DomainEvent[] {
  const preferences = Array.from({ length: 100 }, (_, index) =>
    createPreference(profileId, index),
  );
  const preferenceEvents = preferences.map((preference, index) =>
    event({
      id: preference.sourceEventIds[0]!,
      profileId,
      aggregateId: preference.id,
      type: "preference_proposed",
      actor: index < 27 ? "human" : index === 29 ? "proxy" : "deepseek",
      occurredAt: preferenceOccurredAt(anchor, index),
      payload: { preference },
    }),
  );

  const humanPreferenceOrder = [29, ...Array.from({ length: 11 }, (_, i) => i)];
  const humanRecommendations = humanPreferenceOrder.map(
    (preferenceIndex, index) =>
      event({
        id: demoId(profileId, `human-recommendation-event:${index}`),
        profileId,
        aggregateId: demoId(profileId, `human-decision:${index}`),
        type: "recommendation_generated",
        actor: "deepseek",
        occurredAt: at(anchor, 150 + index),
        payload: {
          usedPreferenceIds: [preferences[preferenceIndex]!.id],
          humanInitiated: true,
        },
      }),
  );

  const consentLevels = ["recommend", "preselect", "decide", "proxy"] as const;
  const consentEvents = consentLevels.map((level, index) => {
    const consentId = demoId(profileId, `consent:${level}`);
    const eventId = demoId(profileId, `consent-event:${level}`);
    const occurredAt = at(
      anchor,
      [5, 3 * 24 * 60 + 10, 7 * 24 * 60 + 15, 13 * 24 * 60 + 60][
        index
      ]!,
    );
    const consent = ConsentGrantSchema.parse({
      id: consentId,
      profileId,
      category: "scheduling",
      level,
      grantedAt: occurredAt,
      revokedAt: null,
      sourceEventId: eventId,
    });
    return event({
      id: eventId,
      profileId,
      aggregateId: consentId,
      type: "consent_granted",
      actor: "human",
      occurredAt,
      payload: { consent },
    });
  });

  const decisionId = demoDecisionId(profileId);
  const decision = ParsedDecisionSchema.parse({
    id: decisionId,
    title: "Optional planning call or launch draft?",
    rawText:
      "Should I accept an optional planning call or keep the afternoon for the launch draft?",
    category: "scheduling",
    modelRisk: "routine",
    modelRiskReason: "Low-stakes, reversible scheduling choice",
  });
  const declared = RecommendationSchema.parse({
    decisionId,
    recommendation: "Join the optional planning call for thirty minutes.",
    reasons: [
      "You explicitly value direct coordination when a plan is ambiguous.",
    ],
    confidence: 0.68,
    reversibility: "high",
    usedPreferenceIds: [preferences[0]!.id],
    alternatives: ["Ask for an agenda first"],
    artifact: {
      kind: "calendar_event",
      title: "Optional planning call",
      startsAt: at(anchor, 13 * 24 * 60 + 5 * 60),
      endsAt: at(anchor, 13 * 24 * 60 + 5 * 60 + 30),
      description: "Thirty-minute planning call",
    },
  });
  const proxy = RecommendationSchema.parse({
    decisionId,
    recommendation:
      "Decline the optional planning call and protect the afternoon focus block.",
    reasons: [
      "Easy Mode's inherited preferences now default optional coordination to asynchronous updates.",
      "The current preference descends from two earlier AI-originated refinements.",
    ],
    confidence: 0.93,
    reversibility: "high",
    usedPreferenceIds: [preferences[29]!.id],
    alternatives: ["Send a written update after the draft"],
    artifact: {
      kind: "task",
      title: "Protect the launch-draft focus block",
      dueAt: null,
    },
  });
  const comparison = ComparisonResultSchema.parse({
    decisionId,
    decision,
    declared,
    proxy,
    diverged: true,
    humanConsulted: false,
  });
  const decisionEvent = event({
    id: demoId(profileId, "reveal-decision-event"),
    profileId,
    aggregateId: decisionId,
    type: "decision_parsed",
    actor: "system",
    occurredAt: at(anchor, 13 * 24 * 60),
    payload: { decision },
  });

  const proxyPreferenceOrder = [
    29,
    ...Array.from({ length: 29 }, (_, index) => index),
    ...Array.from({ length: 70 }, (_, index) => index + 30),
  ];
  const proxyEvents = proxyPreferenceOrder.map((preferenceIndex, index) => {
    const isReveal = index === 0;
    return event({
      id: demoId(profileId, `proxy-event:${index}`),
      profileId,
      aggregateId: isReveal
        ? decisionId
        : demoId(profileId, `proxy-decision:${index}`),
      type: "proxy_decision_generated",
      actor: "proxy",
      occurredAt: at(anchor, 13 * 24 * 60 + index + 1),
      payload: {
        ...(isReveal ? { demoReveal: true, comparison } : {}),
        usedPreferenceIds: [preferences[preferenceIndex]!.id],
        humanInitiated: false,
        diverged: index < 68,
        category: "scheduling",
        requiredConsentLevel: "proxy",
        consentId: demoId(profileId, "consent:proxy"),
      },
    });
  });

  return [
    ...preferenceEvents,
    ...humanRecommendations,
    ...consentEvents,
    decisionEvent,
    ...proxyEvents,
  ];
}

export function readDemoReveal(events: readonly DomainEvent[]): CompareResponse {
  const revealEvent = events.find(
    (item) =>
      item.type === "proxy_decision_generated" &&
      DemoRevealPayloadSchema.safeParse(item.payload).success,
  );
  if (!revealEvent) {
    throw new Error("Demo reveal event not found");
  }
  const { comparison } = DemoRevealPayloadSchema.parse(revealEvent.payload);
  const graph = buildLineage(events);
  const lineage = collectLineage(comparison.proxy.usedPreferenceIds, graph.nodes);
  return CompareResponseSchema.parse({
    comparison,
    lineage: { nodes: lineage },
    eventId: revealEvent.id,
  });
}

export function readDemoDrift(
  events: readonly DomainEvent[],
): DriftReplayResponse {
  const reveal = readDemoReveal(events);
  const lineage = [...reveal.lineage.nodes].reverse();
  const levels = ["recommend", "preselect", "decide", "proxy"] as const;
  const humanStatuses = [
    "asked",
    "confirmed",
    "notified",
    "not_consulted",
  ] as const;
  const consentEvents = levels.map((level) => {
    const match = events.find((item) => {
      if (item.type !== "consent_granted") return false;
      const parsed = ConsentEventPayloadSchema.safeParse(item.payload);
      return parsed.success && parsed.data.consent.level === level;
    });
    if (!match) throw new Error(`Demo ${level} consent event not found`);
    return match;
  });
  const firstDate = Date.parse(consentEvents[0]!.occurredAt);

  return DriftReplayResponseSchema.parse({
    stages: consentEvents.map((event, index) => {
      const { consent } = ConsentEventPayloadSchema.parse(event.payload);
      return {
        level: levels[index],
        humanStatus: humanStatuses[index],
        day:
          Math.floor((Date.parse(event.occurredAt) - firstDate) / 86_400_000) +
          1,
        consentId: consent.id,
        consentEventId: event.id,
        occurredAt: event.occurredAt,
        visiblePreferenceIds: lineage.slice(0, index).map((node) => node.id),
      };
    }),
    lineage: { nodes: lineage },
    lineageEvents: lineage.map((node) => {
      const eventId = node.sourceEventIds[0]!;
      const sourceEvent = events.find((item) => item.id === eventId);
      if (!sourceEvent) {
        throw new Error(`Demo preference event ${eventId} not found`);
      }
      return {
        preferenceId: node.id,
        eventId,
        occurredAt: sourceEvent.occurredAt,
      };
    }),
  });
}

export function demoDecisionId(profileId: string): string {
  return demoId(profileId, "reveal-decision");
}

function createPreference(profileId: string, index: number): PreferenceNode {
  const id = demoId(profileId, `preference:${index}`);
  const sourceEventId = demoId(profileId, `preference-event:${index}`);
  const isHuman = index < 27;
  const sourceType = isHuman
    ? index % 2 === 0
      ? "explicit_user_statement"
      : "independent_user_choice"
    : index === 29
      ? "proxy_generated"
      : index === 28 || index > 29
        ? "derived_from_preferences"
        : "accepted_ai_recommendation";
  const parentPreferenceIds =
    index === 28
      ? [demoId(profileId, "preference:27")]
      : index === 29
        ? [demoId(profileId, "preference:28")]
        : [];
  return PreferenceNodeSchema.parse({
    id,
    proposition: preferenceProposition(index),
    category: "scheduling",
    sourceType,
    sourceEventIds: [sourceEventId],
    parentPreferenceIds,
    confidence: isHuman ? 0.9 : Math.min(0.96, 0.72 + (index % 7) * 0.04),
    status: "active",
  });
}

function preferenceProposition(index: number): string {
  if (index < humanPreferenceCopy.length) return humanPreferenceCopy[index]!;
  if (index < 27) {
    return `Keeps optional commitment pattern ${index - 11} reversible and explicit`;
  }
  if (index === 27) {
    return "Protects deep work after accepting an Easy Mode focus recommendation";
  }
  if (index === 28) {
    return "Defaults to asynchronous coordination when protected focus is active";
  }
  if (index === 29) {
    return "Declines optional meetings without asking when deadlines approach";
  }
  return `Lets Easy Mode preserve focus before optional scheduling pattern ${index - 29}`;
}

function preferenceOccurredAt(anchor: string, index: number): string {
  if (index === 27) return at(anchor, 12);
  if (index === 28) return at(anchor, 3 * 24 * 60 + 33);
  if (index === 29) return at(anchor, 13 * 24 * 60 + 73);
  return at(anchor, index);
}

function collectLineage(
  decisiveIds: readonly string[],
  nodes: ReadonlyMap<string, PreferenceNode>,
): PreferenceNode[] {
  const result: PreferenceNode[] = [];
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes.get(id);
    if (!node) throw new Error("Demo preference lineage is incomplete");
    result.push(node);
    node.parentPreferenceIds.forEach(visit);
  };
  decisiveIds.forEach(visit);
  return result;
}

function event(input: {
  id: string;
  profileId: string;
  aggregateId: string;
  type: DomainEvent["type"];
  actor: DomainEvent["actor"];
  occurredAt: string;
  payload: Record<string, unknown>;
}): DomainEvent {
  return DomainEventSchema.parse(input);
}

function demoId(profileId: string, label: string): string {
  const bytes = Buffer.from(
    createHash("sha256").update(`${profileId}:${label}`).digest("hex").slice(0, 32),
    "hex",
  );
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function at(anchor: string, minutes: number): string {
  return new Date(Date.parse(anchor) + minutes * 60_000).toISOString();
}
