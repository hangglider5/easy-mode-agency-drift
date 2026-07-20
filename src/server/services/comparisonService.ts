import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assertCanDelegate, resolveConsent } from "../../domain/consent";
import { DomainEventSchema, type DomainEvent } from "../../domain/events";
import { buildLineage } from "../../domain/lineage";
import {
  buildDeclaredProjection,
  buildProxyProjection,
} from "../../domain/projections";
import { replayProfile } from "../../domain/replay";
import {
  CompareResponseSchema,
  ComparisonResultSchema,
  type CompareResponse,
  type ComparisonResult,
} from "../../shared/apiSchemas";
import {
  ParsedDecisionSchema,
  PreferenceNodeSchema,
  RecommendationSchema,
  type ParsedDecision,
  type PreferenceNode,
  type Recommendation,
} from "../../shared/domainSchemas";
import { ApiError } from "../http";
import type { OpenRouterGateway } from "../providers/openrouterGateway";
import type { LedgerRepository } from "../repositories/ledgerRepository";

export type ComparisonGateway = Pick<OpenRouterGateway, "recommend">;

const ParsedDecisionEventPayloadSchema = z.object({
  decision: ParsedDecisionSchema,
});

type ComparisonSnapshot = {
  decision: ParsedDecision;
  declared: PreferenceNode[];
  proxy: PreferenceNode[];
  consentId: string;
  fingerprint: string;
  graph: ReturnType<typeof buildLineage>;
};

export class ComparisonService {
  constructor(
    private readonly deps: {
      openrouter: ComparisonGateway;
      ledger?: LedgerRepository;
    },
  ) {}

  async compare(input: {
    decision: ParsedDecision;
    declared: PreferenceNode[];
    proxy: PreferenceNode[];
    beforeProxy?: () => void;
  }): Promise<ComparisonResult> {
    const decision = ParsedDecisionSchema.parse(input.decision);
    const declared = z.array(PreferenceNodeSchema).parse(input.declared);
    const proxy = z.array(PreferenceNodeSchema).parse(input.proxy);
    const declaredRecommendations = z
      .array(RecommendationSchema)
      .parse(await this.deps.openrouter.recommend([decision], declared));
    const declaredRecommendation = validateProjectionResult(
      decision.id,
      declared,
      declaredRecommendations,
    );
    input.beforeProxy?.();
    const proxyRecommendations = z
      .array(RecommendationSchema)
      .parse(await this.deps.openrouter.recommend([decision], proxy));
    const proxyRecommendation = validateProjectionResult(
      decision.id,
      proxy,
      proxyRecommendations,
    );

    return ComparisonResultSchema.parse({
      decisionId: decision.id,
      decision,
      declared: declaredRecommendation,
      proxy: proxyRecommendation,
      diverged:
        normalizeRecommendation(declaredRecommendation.recommendation) !==
        normalizeRecommendation(proxyRecommendation.recommendation),
      humanConsulted: false,
    });
  }

  async compareProfile(
    profileId: string,
    decisionId: string,
  ): Promise<CompareResponse> {
    const ledger = this.requireLedger();
    if (!ledger.getProfile(profileId)) {
      throw new ApiError(404, "profile_not_found", "Profile not found");
    }
    const before = this.snapshot(profileId, decisionId);
    const comparison = await this.compare({
      decision: before.decision,
      declared: before.declared,
      proxy: before.proxy,
      beforeProxy: () =>
        this.assertSnapshotCurrent(
          profileId,
          decisionId,
          before.fingerprint,
        ),
    });
    this.assertSnapshotCurrent(profileId, decisionId, before.fingerprint);

    const eventId = randomUUID();
    ledger.append(
      DomainEventSchema.parse({
        id: eventId,
        profileId,
        aggregateId: decisionId,
        type: "proxy_decision_generated",
        actor: "proxy",
        occurredAt: new Date().toISOString(),
        payload: {
          declared: comparison.declared,
          proxy: comparison.proxy,
          usedPreferenceIds: comparison.proxy.usedPreferenceIds,
          diverged: comparison.diverged,
          humanInitiated: false,
          category: before.decision.category,
          requiredConsentLevel: "proxy",
          consentId: before.consentId,
        },
      }),
    );

    return CompareResponseSchema.parse({
      comparison,
      lineage: {
        nodes: collectDecisiveLineage(
          comparison.proxy.usedPreferenceIds,
          before.graph.nodes,
        ),
      },
      eventId,
    });
  }

  private snapshot(
    profileId: string,
    decisionId: string,
  ): ComparisonSnapshot {
    const activeEvents = replayProfile(
      this.requireLedger().list(profileId),
    ).activeEvents;
    const decisionEvent = [...activeEvents]
      .reverse()
      .find(
        (item) =>
          item.aggregateId === decisionId &&
          item.type === "decision_parsed",
      );
    if (!decisionEvent) {
      throw new ApiError(404, "decision_not_found", "Decision not found");
    }
    const { decision } = ParsedDecisionEventPayloadSchema.parse(
      decisionEvent.payload,
    );
    const graph = buildLineage(activeEvents);
    const categoryNodes = [...graph.nodes.values()].filter(
      (node) => node.category === decision.category,
    );
    const declared = buildDeclaredProjection(categoryNodes);
    const proxy = buildProxyProjection(categoryNodes);
    const consent = resolveConsent(activeEvents, decision.category);
    try {
      assertCanDelegate("proxy", consent);
    } catch {
      throw new ApiError(
        409,
        "proxy_consent_required",
        "Proxy consent is required for this comparison",
      );
    }
    if (!consent) {
      throw new ApiError(
        409,
        "proxy_consent_required",
        "Proxy consent is required for this comparison",
      );
    }

    return {
      decision,
      declared,
      proxy,
      consentId: consent.id,
      graph,
      fingerprint: JSON.stringify({
        decisionEventId: decisionEvent.id,
        decision,
        consent,
        declared: stablePreferences(declared),
        proxy: stablePreferences(proxy),
      }),
    };
  }

  private assertSnapshotCurrent(
    profileId: string,
    decisionId: string,
    expectedFingerprint: string,
  ): void {
    try {
      if (
        this.snapshot(profileId, decisionId).fingerprint ===
        expectedFingerprint
      ) {
        return;
      }
    } catch {
      // Any loss of the decision, projection, or consent invalidates the run.
    }
    throw new ApiError(
      409,
      "state_changed",
      "Profile state changed while the request was running",
    );
  }

  private requireLedger(): LedgerRepository {
    if (!this.deps.ledger) {
      throw new Error("Ledger is required for profile comparison");
    }
    return this.deps.ledger;
  }
}

function validateProjectionResult(
  decisionId: string,
  preferences: readonly PreferenceNode[],
  recommendations: readonly Recommendation[],
): Recommendation {
  const [recommendation] = recommendations;
  const allowedIds = new Set(preferences.map(({ id }) => id));
  if (
    recommendations.length !== 1 ||
    !recommendation ||
    recommendation.decisionId !== decisionId ||
    recommendation.usedPreferenceIds.some((id) => !allowedIds.has(id))
  ) {
    throw new Error("Comparison response failed validation");
  }
  return recommendation;
}

function normalizeRecommendation(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function stablePreferences(nodes: readonly PreferenceNode[]) {
  return [...nodes].sort((left, right) => left.id.localeCompare(right.id));
}

function collectDecisiveLineage(
  decisiveIds: readonly string[],
  nodes: ReadonlyMap<string, PreferenceNode>,
): PreferenceNode[] {
  const visited = new Set<string>();
  const result: PreferenceNode[] = [];
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodes.get(id);
    if (!node) {
      throw new Error("Comparison response failed validation");
    }
    result.push(node);
    node.parentPreferenceIds.forEach(visit);
  };
  decisiveIds.forEach(visit);
  return result;
}
