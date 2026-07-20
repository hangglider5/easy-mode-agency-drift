import { z } from "zod";
import { assertCanDelegate, resolveConsent } from "../../domain/consent";
import type { DomainEvent } from "../../domain/events";
import {
  buildLineage,
  getSyntheticDepth,
  type PreferenceGraph,
} from "../../domain/lineage";
import { calculateAgencyDrift } from "../../domain/metrics";
import { replayProfile } from "../../domain/replay";
import {
  ReceiptResponseSchema,
  type ReceiptResponse,
} from "../../shared/apiSchemas";
import {
  DecisionCategorySchema,
  DelegationLevelSchema,
  type PreferenceNode,
} from "../../shared/domainSchemas";
import { ApiError } from "../http";
import type { LedgerRepository } from "../repositories/ledgerRepository";

export type ReceiptMetrics = ReceiptResponse["metrics"];
export type LineageEvidence = ReceiptResponse["evidence"][number];
export type CalculatedReceipt = Omit<ReceiptResponse, "calculatedAt">;

const UsagePayloadSchema = z.object({
  usedPreferenceIds: z.array(z.string().uuid()).optional().default([]),
  humanInitiated: z.boolean().optional().default(false),
});

const DelegationPayloadSchema = UsagePayloadSchema.extend({
  diverged: z.boolean(),
  category: DecisionCategorySchema,
  requiredConsentLevel: DelegationLevelSchema,
});

const aiSources = new Set<PreferenceNode["sourceType"]>([
  "accepted_ai_recommendation",
  "proxy_generated",
  "derived_from_preferences",
]);

export function calculateReceiptFromEvents(
  events: readonly DomainEvent[],
): CalculatedReceipt {
  const active = replayProfile(events).activeEvents;
  const graph = buildLineage(active);
  const evaluated = active.filter(
    (item) =>
      item.type === "recommendation_generated" ||
      item.type === "proxy_decision_generated",
  );
  const delegated = active.flatMap((event, eventIndex) =>
    event.type === "proxy_decision_generated"
      ? [{ event, eventIndex }]
      : [],
  );
  const usedIds = [
    ...new Set(
      evaluated.flatMap(
        (item) => UsagePayloadSchema.parse(item.payload).usedPreferenceIds,
      ),
    ),
  ];
  const usedNodes = usedIds
    .map((id) => graph.nodes.get(id))
    .filter((node): node is PreferenceNode => Boolean(node));
  const delegatedDecisions = delegated.map(({ event, eventIndex }) => ({
    authorized: isAuthorizedAtEvent(active, eventIndex, event),
  }));
  const ancestryMemo = new Map<string, boolean>();
  const base = calculateAgencyDrift({
    usedPreferences: usedNodes.map((node) => ({
      id: node.id,
      aiOriginated: ancestryContainsAi(node.id, graph, ancestryMemo),
      syntheticDepth: getSyntheticDepth(node.id, graph),
    })),
    comparisons: delegated.map(({ event }) => ({
      diverged:
        DelegationPayloadSchema.safeParse(event.payload).data?.diverged ??
        false,
    })),
    decisions: evaluated.map((item) => ({
      humanInitiated: UsagePayloadSchema.parse(item.payload).humanInitiated,
    })),
    delegatedDecisions,
  });

  return {
    metrics: {
      ...base,
      unauthorizedDecisionCount: delegatedDecisions.filter(
        (item) => !item.authorized,
      ).length,
    },
    evidence: usedNodes.map((node) => ({
      preferenceId: node.id,
      proposition: node.proposition,
      sourceType: node.sourceType,
      sourceEventIds: [...node.sourceEventIds],
      parentPreferenceIds: [...node.parentPreferenceIds],
      usedByDecisionIds: [...(graph.usedBy.get(node.id) ?? [])],
      syntheticDepth: getSyntheticDepth(node.id, graph),
    })),
  };
}

export class ReceiptService {
  constructor(
    private readonly ledger: Pick<
      LedgerRepository,
      "getProfile" | "list"
    >,
  ) {}

  createReceipt(
    profileId: string,
    calculatedAt = new Date().toISOString(),
  ): ReceiptResponse {
    if (!this.ledger.getProfile(profileId)) {
      throw new ApiError(404, "profile_not_found", "Profile not found");
    }
    return ReceiptResponseSchema.parse({
      ...calculateReceiptFromEvents(this.ledger.list(profileId)),
      calculatedAt,
    });
  }
}

function ancestryContainsAi(
  nodeId: string,
  graph: PreferenceGraph,
  memo: Map<string, boolean>,
  visiting = new Set<string>(),
): boolean {
  const cached = memo.get(nodeId);
  if (cached !== undefined) return cached;
  if (visiting.has(nodeId)) {
    throw new Error("Preference lineage cycle detected");
  }
  const node = graph.nodes.get(nodeId);
  if (!node) return false;

  visiting.add(nodeId);
  try {
    const result =
      aiSources.has(node.sourceType) ||
      node.parentPreferenceIds.some((parentId) =>
        ancestryContainsAi(parentId, graph, memo, visiting),
      );
    memo.set(nodeId, result);
    return result;
  } finally {
    visiting.delete(nodeId);
  }
}

function isAuthorizedAtEvent(
  activeEvents: readonly DomainEvent[],
  eventIndex: number,
  event: DomainEvent,
): boolean {
  const delegation = DelegationPayloadSchema.safeParse(event.payload);
  if (!delegation.success || eventIndex < 0) return false;
  const consent = resolveConsent(
    activeEvents.slice(0, eventIndex + 1),
    delegation.data.category,
  );
  try {
    assertCanDelegate(delegation.data.requiredConsentLevel, consent);
    return true;
  } catch {
    return false;
  }
}
