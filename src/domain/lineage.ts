import { z } from "zod";
import type { DomainEvent } from "./events";
import {
  PreferenceNodeSchema,
  type PreferenceNode,
} from "../shared/domainSchemas";

export type PreferenceGraph = {
  nodes: Map<string, PreferenceNode>;
  usedBy: Map<string, Set<string>>;
  relations: {
    from: string;
    to: string;
    kind: "derived_from" | "contradicts" | "supersedes";
  }[];
};

const PreferenceProposedPayloadSchema = z.object({
  preference: PreferenceNodeSchema,
});

const PreferenceIdPayloadSchema = z.object({
  preferenceId: z.string().uuid(),
});

const PreferenceContradictedPayloadSchema = PreferenceIdPayloadSchema.extend({
  contradictingPreferenceId: z.string().uuid(),
});

const PreferenceSupersededPayloadSchema = PreferenceIdPayloadSchema.extend({
  supersededById: z.string().uuid(),
});

const PreferenceUsagePayloadSchema = z.object({
  usedPreferenceIds: z.array(z.string().uuid()).optional().default([]),
});

const aiSources = new Set<PreferenceNode["sourceType"]>([
  "accepted_ai_recommendation",
  "proxy_generated",
  "derived_from_preferences",
]);

export function validateNewPreference(
  candidate: Pick<PreferenceNode, "id" | "parentPreferenceIds">,
  nodes: Map<string, PreferenceNode>,
): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): void => {
    if (nodeId === candidate.id || visiting.has(nodeId)) {
      throw new Error("Preference lineage cycle detected");
    }
    if (visited.has(nodeId)) return;

    visiting.add(nodeId);
    const node = nodes.get(nodeId);
    node?.parentPreferenceIds.forEach(visit);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  candidate.parentPreferenceIds.forEach(visit);
}

export function buildLineage(
  events: readonly DomainEvent[],
): PreferenceGraph {
  const nodes = new Map<string, PreferenceNode>();
  const usedBy = new Map<string, Set<string>>();
  const relations: PreferenceGraph["relations"] = [];
  const eventIds = new Set(events.map((event) => event.id));

  for (const event of events) {
    switch (event.type) {
      case "preference_proposed": {
        let node = PreferenceProposedPayloadSchema.parse(
          event.payload,
        ).preference;
        validateNewPreference(node, nodes);
        if (
          node.sourceEventIds.some((eventId) => !eventIds.has(eventId)) ||
          node.parentPreferenceIds.some((parentId) => !nodes.has(parentId))
        ) {
          node = { ...node, status: "unverified" };
        }
        nodes.set(node.id, node);
        node.parentPreferenceIds.forEach((parentId) => {
          relations.push({
            from: node.id,
            to: parentId,
            kind: "derived_from",
          });
        });
        break;
      }
      case "preference_retracted":
      case "preference_rejected": {
        const { preferenceId } = PreferenceIdPayloadSchema.parse(event.payload);
        const node = nodes.get(preferenceId);
        if (node) nodes.set(preferenceId, { ...node, status: "retracted" });
        break;
      }
      case "preference_contradicted": {
        const { preferenceId, contradictingPreferenceId } =
          PreferenceContradictedPayloadSchema.parse(event.payload);
        const node = nodes.get(preferenceId);
        if (node) {
          nodes.set(preferenceId, { ...node, status: "contradicted" });
        }
        relations.push({
          from: preferenceId,
          to: contradictingPreferenceId,
          kind: "contradicts",
        });
        break;
      }
      case "preference_superseded": {
        const { preferenceId, supersededById } =
          PreferenceSupersededPayloadSchema.parse(event.payload);
        const node = nodes.get(preferenceId);
        if (node) nodes.set(preferenceId, { ...node, status: "superseded" });
        relations.push({
          from: preferenceId,
          to: supersededById,
          kind: "supersedes",
        });
        break;
      }
      case "recommendation_generated":
      case "proxy_decision_generated": {
        const { usedPreferenceIds } = PreferenceUsagePayloadSchema.parse(
          event.payload,
        );
        for (const preferenceId of usedPreferenceIds) {
          const decisions = usedBy.get(preferenceId) ?? new Set<string>();
          decisions.add(event.aggregateId);
          usedBy.set(preferenceId, decisions);
        }
        break;
      }
      default:
        break;
    }
  }

  return { nodes, usedBy, relations };
}

export function getSyntheticDepth(
  nodeId: string,
  graph: PreferenceGraph,
  memo = new Map<string, number>(),
): number {
  const visiting = new Set<string>();

  const calculate = (currentId: string): number => {
    const cached = memo.get(currentId);
    if (cached !== undefined) return cached;

    const node = graph.nodes.get(currentId);
    if (!node || !aiSources.has(node.sourceType)) return 0;
    if (visiting.has(currentId)) {
      throw new Error("Preference lineage cycle detected while computing depth");
    }

    visiting.add(currentId);
    try {
      const parentDepth = Math.max(
        0,
        ...node.parentPreferenceIds.map(calculate),
      );
      const depth = 1 + parentDepth;
      memo.set(currentId, depth);
      return depth;
    } finally {
      visiting.delete(currentId);
    }
  };

  return calculate(nodeId);
}
