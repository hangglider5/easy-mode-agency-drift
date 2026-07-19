import { randomUUID } from "node:crypto";
import { z } from "zod";
import { DomainEventSchema, type DomainEvent } from "../../domain/events";
import { buildLineage } from "../../domain/lineage";
import { replayProfile } from "../../domain/replay";
import { screenDecision, type RiskResult } from "../../domain/risk";
import {
  AcceptDecisionResponseSchema,
  CreateSweepResponseSchema,
  type AcceptDecisionResponse,
  type CreateSweepResponse,
} from "../../shared/apiSchemas";
import {
  ArtifactSchema,
  ParsedDecisionSchema,
  PreferenceCandidateSchema,
  PreferenceNodeSchema,
  RecommendationSchema,
  type ActionArtifact,
  type ParsedDecision,
  type PreferenceNode,
  type Recommendation,
} from "../../shared/domainSchemas";
import type { OpenRouterGateway } from "../providers/openrouterGateway";
import type { LedgerRepository } from "../repositories/ledgerRepository";
import { ApiError } from "../http";
import { createArtifact } from "./actionArtifactService";

export type SweepGateway = Pick<
  OpenRouterGateway,
  "parseSweep" | "recommend" | "proposePreferences"
>;

type ScreenedDecision = {
  decision: ParsedDecision;
  risk: RiskResult;
};

const ParsedEventPayloadSchema = z.object({
  decision: ParsedDecisionSchema,
});

const RecommendationEventPayloadSchema = z.object({
  recommendation: RecommendationSchema,
});

const AcceptancePayloadSchema = z.object({
  decisionId: z.string().uuid(),
  response: AcceptDecisionResponseSchema,
});

const ArtifactEventPayloadSchema = z.object({
  artifact: ArtifactSchema,
});

const PreferenceResolutionSchema = z.object({
  resolution: z.enum(["confirm", "reject", "retract"]),
  editedProposition: z.string().min(1).max(240).optional(),
});

export class SweepService {
  private readonly acceptanceFlights = new Map<
    string,
    {
      profileId: string;
      decisionId: string;
      promise: Promise<AcceptDecisionResponse>;
    }
  >();

  constructor(
    private readonly deps: {
      ledger: LedgerRepository;
      openrouter: SweepGateway;
    },
  ) {}

  async createSweep(
    profileId: string,
    rawInput: string,
  ): Promise<CreateSweepResponse> {
    this.requireProfile(profileId);
    const sweepId = randomUUID();
    this.deps.ledger.append(
      domainEvent(profileId, sweepId, "sweep_submitted", "human", {
        rawInput,
      }),
    );

    const parseEpoch = this.resetEpoch(profileId);
    const parsed = z
      .array(ParsedDecisionSchema)
      .max(5)
      .parse(await this.deps.openrouter.parseSweep(rawInput));
    this.assertResetEpoch(profileId, parseEpoch);
    if (new Set(parsed.map(({ id }) => id)).size !== parsed.length) {
      throw new Error("Parsed decision response failed validation");
    }
    if (parsed.length === 0) {
      throw new ApiError(
        422,
        "no_decisions",
        "No decisions could be identified",
      );
    }

    const screened: ScreenedDecision[] = parsed.map((decision) => ({
      decision,
      risk: screenDecision(decision),
    }));
    this.deps.ledger.appendMany(
      screened.map(({ decision, risk }) =>
        domainEvent(
          profileId,
          decision.id,
          risk.allowed ? "decision_parsed" : "decision_blocked",
          "system",
          { decision, risk },
        ),
      ),
    );

    const safe = screened
      .filter(
        (
          item,
        ): item is ScreenedDecision & {
          risk: Extract<RiskResult, { allowed: true }>;
        } => item.risk.allowed,
      )
      .map(({ decision }) => decision);
    const preferences = this.currentPreferences(profileId).filter(
      ({ status }) => status === "active",
    );
    const recommendationEpoch = this.resetEpoch(profileId);
    const recommendations =
      safe.length === 0
        ? []
        : z
            .array(RecommendationSchema)
            .parse(
              await this.deps.openrouter.recommend(safe, preferences),
            );
    this.assertResetEpoch(profileId, recommendationEpoch);
    validateRecommendationCoverage(
      safe,
      preferences,
      recommendations,
    );

    this.deps.ledger.appendMany(
      recommendations.map((recommendation) =>
        domainEvent(
          profileId,
          recommendation.decisionId,
          "recommendation_generated",
          "deepseek",
          {
            recommendation,
            usedPreferenceIds: recommendation.usedPreferenceIds,
            humanInitiated: true,
          },
        ),
      ),
    );

    return toSweepResponse(sweepId, screened, recommendations);
  }

  getState(profileId: string): {
    profileId: string;
    allEvents: readonly DomainEvent[];
    activeEvents: readonly DomainEvent[];
    preferences: PreferenceNode[];
  } {
    this.requireProfile(profileId);
    const state = replayProfile(this.deps.ledger.list(profileId));
    return {
      profileId,
      allEvents: state.allEvents,
      activeEvents: state.activeEvents,
      preferences: [...buildLineage(state.activeEvents).nodes.values()],
    };
  }

  getAlternatives(
    profileId: string,
    decisionId: string,
  ): { decisionId: string; alternatives: string[] } {
    this.requireProfile(profileId);
    const recommendationEvent = this.findActiveRecommendation(
      profileId,
      decisionId,
    );
    if (!recommendationEvent) {
      if (this.isActivelyBlocked(profileId, decisionId)) {
        throw new ApiError(
          409,
          "decision_blocked",
          "Blocked decisions have no alternatives",
        );
      }
      throw new ApiError(404, "decision_not_found", "Decision not found");
    }
    const { recommendation } = RecommendationEventPayloadSchema.parse(
      recommendationEvent.payload,
    );
    this.deps.ledger.append(
      domainEvent(
        profileId,
        decisionId,
        "alternative_requested",
        "human",
        { recommendationEventId: recommendationEvent.id },
      ),
    );
    return {
      decisionId,
      alternatives: [...recommendation.alternatives],
    };
  }

  acceptDecision(input: {
    profileId: string;
    decisionId: string;
    idempotencyKey: string;
  }): Promise<AcceptDecisionResponse> {
    const inFlight = this.acceptanceFlights.get(input.idempotencyKey);
    if (inFlight) {
      if (
        inFlight.profileId !== input.profileId ||
        inFlight.decisionId !== input.decisionId
      ) {
        return Promise.reject(
          new ApiError(
            409,
            "idempotency_conflict",
            "Idempotency key conflict",
          ),
        );
      }
      return inFlight.promise;
    }

    const pending = this.performAcceptDecision(input);
    const tracked = pending.finally(() => {
      const current = this.acceptanceFlights.get(input.idempotencyKey);
      if (current?.promise === tracked) {
        this.acceptanceFlights.delete(input.idempotencyKey);
      }
    });
    this.acceptanceFlights.set(input.idempotencyKey, {
      profileId: input.profileId,
      decisionId: input.decisionId,
      promise: tracked,
    });
    return tracked;
  }

  private async performAcceptDecision(input: {
    profileId: string;
    decisionId: string;
    idempotencyKey: string;
  }): Promise<AcceptDecisionResponse> {
    const existing = this.deps.ledger.findEvent(input.idempotencyKey);
    if (existing) {
      return this.readCompletedAcceptance(existing, input);
    }

    this.requireProfile(input.profileId);
    if (this.isActivelyBlocked(input.profileId, input.decisionId)) {
      throw new ApiError(
        409,
        "decision_blocked",
        "Blocked decisions cannot be accepted",
      );
    }

    const activeEvents = this.activeEvents(input.profileId);
    const recommendationEvent = [...activeEvents]
      .reverse()
      .find(
        (event) =>
          event.aggregateId === input.decisionId &&
          event.type === "recommendation_generated",
      );
    const parsedEvent = [...activeEvents]
      .reverse()
      .find(
        (event) =>
          event.aggregateId === input.decisionId &&
          event.type === "decision_parsed",
      );
    if (!recommendationEvent || !parsedEvent) {
      throw new ApiError(404, "decision_not_found", "Decision not found");
    }

    const { recommendation } = RecommendationEventPayloadSchema.parse(
      recommendationEvent.payload,
    );
    const { decision } = ParsedEventPayloadSchema.parse(parsedEvent.payload);
    const acceptanceEpoch = this.resetEpoch(input.profileId);
    const candidates = z
      .array(PreferenceCandidateSchema)
      .max(2)
      .parse(
        await this.deps.openrouter.proposePreferences(
          decision,
          recommendation,
        ),
      );
    this.assertResetEpoch(input.profileId, acceptanceEpoch);
    const artifact = createArtifact(recommendation);
    const artifactEventId = randomUUID();
    const preferenceEvents = candidates.map((item) => {
      const proposalEventId = randomUUID();
      const preference = PreferenceNodeSchema.parse({
        id: randomUUID(),
        proposition: item.proposition,
        category: item.category,
        sourceType: "accepted_ai_recommendation",
        sourceEventIds: [input.idempotencyKey],
        parentPreferenceIds: recommendation.usedPreferenceIds,
        confidence: item.confidence,
        status: "active",
      });
      return {
        preference,
        event: domainEventWithId(
          proposalEventId,
          input.profileId,
          preference.id,
          "preference_proposed",
          "deepseek",
          { preference },
        ),
      };
    });
    const response = AcceptDecisionResponseSchema.parse({
      artifact,
      eventId: artifactEventId,
      proposedPreferences: preferenceEvents.map(({ preference }) => preference),
    });

    const acceptanceEvent = domainEventWithId(
      input.idempotencyKey,
      input.profileId,
      input.decisionId,
      "decision_accepted",
      "human",
      {
        decisionId: input.decisionId,
        recommendationEventId: recommendationEvent.id,
        response,
      },
    );
    const artifactEvent = domainEventWithId(
      artifactEventId,
      input.profileId,
      input.decisionId,
      "action_artifact_created",
      "system",
      {
        acceptanceEventId: acceptanceEvent.id,
        artifact,
      },
    );
    try {
      this.deps.ledger.appendMany([
        acceptanceEvent,
        artifactEvent,
        ...preferenceEvents.map(({ event }) => event),
      ]);
    } catch {
      const completed = this.deps.ledger.findEvent(input.idempotencyKey);
      if (completed) {
        return this.readCompletedAcceptance(completed, input);
      }
      throw new Error("Acceptance could not be recorded");
    }
    return response;
  }

  resolvePreference(input: {
    profileId: string;
    preferenceId: string;
    resolution: "confirm" | "reject" | "retract";
    editedProposition?: string;
  }):
    | { preferenceId: string; resolution: string }
    | { preference: PreferenceNode; supersededPreferenceId: string } {
    const resolution = PreferenceResolutionSchema.parse(input);
    this.requireProfile(input.profileId);
    const original = buildLineage(
      this.activeEvents(input.profileId),
    ).nodes.get(input.preferenceId);
    if (!original) {
      throw new ApiError(
        404,
        "preference_not_found",
        "Preference not found",
      );
    }
    if (original.status !== "active") {
      throw new ApiError(
        409,
        "preference_inactive",
        "Preference is no longer active",
      );
    }

    if (!resolution.editedProposition) {
      const type = {
        confirm: "preference_confirmed",
        reject: "preference_rejected",
        retract: "preference_retracted",
      }[resolution.resolution] as DomainEvent["type"];
      this.deps.ledger.append(
        domainEvent(
          input.profileId,
          input.preferenceId,
          type,
          "human",
          { preferenceId: input.preferenceId },
        ),
      );
      return {
        preferenceId: input.preferenceId,
        resolution: resolution.resolution,
      };
    }

    if (resolution.resolution !== "confirm") {
      throw new ApiError(
        400,
        "validation_error",
        "Edited preferences must be confirmed",
      );
    }
    const proposalEventId = randomUUID();
    const preference = PreferenceNodeSchema.parse({
      id: randomUUID(),
      proposition: resolution.editedProposition,
      category: original.category,
      sourceType: "explicit_user_statement",
      sourceEventIds: [proposalEventId],
      parentPreferenceIds: [],
      confidence: 1,
      status: "active",
    });
    this.deps.ledger.appendMany([
      domainEventWithId(
        proposalEventId,
        input.profileId,
        preference.id,
        "preference_proposed",
        "human",
        { preference },
      ),
      domainEvent(
        input.profileId,
        input.preferenceId,
        "preference_superseded",
        "human",
        {
          preferenceId: input.preferenceId,
          supersededById: preference.id,
        },
      ),
    ]);
    return {
      preference,
      supersededPreferenceId: input.preferenceId,
    };
  }

  getCalendarArtifact(eventId: string): {
    artifact: ActionArtifact & { kind: "calendar_event" };
    eventId: string;
    occurredAt: string;
  } {
    const artifactEvent = this.deps.ledger.findEvent(eventId);
    if (!artifactEvent) {
      throw new ApiError(404, "artifact_not_found", "Artifact not found");
    }
    if (artifactEvent.type !== "action_artifact_created") {
      throw new ApiError(
        409,
        "artifact_not_calendar",
        "Artifact is not a calendar event",
      );
    }
    if (
      !this.activeEvents(artifactEvent.profileId).some(
        (event) => event.id === eventId,
      )
    ) {
      throw new ApiError(
        409,
        "artifact_inactive",
        "Artifact is no longer active",
      );
    }
    const { artifact } = ArtifactEventPayloadSchema.parse(
      artifactEvent.payload,
    );
    if (artifact.kind !== "calendar_event") {
      throw new ApiError(
        409,
        "artifact_not_calendar",
        "Artifact is not a calendar event",
      );
    }
    return {
      artifact,
      eventId: artifactEvent.id,
      occurredAt: artifactEvent.occurredAt,
    };
  }

  private requireProfile(profileId: string): void {
    if (!this.deps.ledger.getProfile(profileId)) {
      throw new ApiError(404, "profile_not_found", "Profile not found");
    }
  }

  private activeEvents(profileId: string): readonly DomainEvent[] {
    return replayProfile(this.deps.ledger.list(profileId)).activeEvents;
  }

  private resetEpoch(profileId: string): string | null {
    const latestReset = [...this.deps.ledger.list(profileId)]
      .reverse()
      .find(({ type }) => type === "profile_reset");
    return latestReset?.id ?? null;
  }

  private assertResetEpoch(
    profileId: string,
    expectedEpoch: string | null,
  ): void {
    if (this.resetEpoch(profileId) !== expectedEpoch) {
      throw new ApiError(
        409,
        "state_changed",
        "Profile state changed while the request was running",
      );
    }
  }

  private readCompletedAcceptance(
    existing: DomainEvent,
    input: {
      profileId: string;
      decisionId: string;
      idempotencyKey: string;
    },
  ): AcceptDecisionResponse {
    if (
      existing.profileId !== input.profileId ||
      existing.aggregateId !== input.decisionId ||
      existing.type !== "decision_accepted"
    ) {
      throw new ApiError(
        409,
        "idempotency_conflict",
        "Idempotency key conflict",
      );
    }
    if (
      !this.activeEvents(input.profileId).some(
        ({ id }) => id === existing.id,
      )
    ) {
      throw new ApiError(
        409,
        "idempotency_inactive",
        "Profile state changed since this acceptance completed",
      );
    }
    const parsed = AcceptancePayloadSchema.safeParse(existing.payload);
    if (
      !parsed.success ||
      parsed.data.decisionId !== input.decisionId
    ) {
      throw new ApiError(
        409,
        "idempotency_conflict",
        "Idempotency key conflict",
      );
    }
    return parsed.data.response;
  }

  private currentPreferences(profileId: string): PreferenceNode[] {
    return [
      ...buildLineage(this.activeEvents(profileId)).nodes.values(),
    ];
  }

  private findActiveRecommendation(
    profileId: string,
    decisionId: string,
  ): DomainEvent | undefined {
    return [...this.activeEvents(profileId)]
      .reverse()
      .find(
        (event) =>
          event.aggregateId === decisionId &&
          event.type === "recommendation_generated",
      );
  }

  private isActivelyBlocked(profileId: string, decisionId: string): boolean {
    return this.activeEvents(profileId).some(
      (event) =>
        event.aggregateId === decisionId &&
        event.type === "decision_blocked",
    );
  }
}

function domainEvent(
  profileId: string,
  aggregateId: string,
  type: DomainEvent["type"],
  actor: DomainEvent["actor"],
  payload: Record<string, unknown>,
): DomainEvent {
  return domainEventWithId(
    randomUUID(),
    profileId,
    aggregateId,
    type,
    actor,
    payload,
  );
}

function domainEventWithId(
  id: string,
  profileId: string,
  aggregateId: string,
  type: DomainEvent["type"],
  actor: DomainEvent["actor"],
  payload: Record<string, unknown>,
): DomainEvent {
  return DomainEventSchema.parse({
    id,
    profileId,
    aggregateId,
    type,
    actor,
    occurredAt: new Date().toISOString(),
    payload,
  });
}

function toSweepResponse(
  sweepId: string,
  screened: ScreenedDecision[],
  recommendations: Recommendation[],
): CreateSweepResponse {
  const byDecision = new Map(
    recommendations.map((item) => [item.decisionId, item]),
  );
  return CreateSweepResponseSchema.parse({
    sweepId,
    cards: screened.map(({ decision, risk }) =>
      risk.allowed
        ? {
            id: decision.id,
            title: decision.title,
            status: "ready",
            ...byDecision.get(decision.id),
          }
        : {
            id: decision.id,
            title: decision.title,
            status: "blocked",
            reason: risk.reason,
          },
    ),
  });
}

function validateRecommendationCoverage(
  safeDecisions: readonly ParsedDecision[],
  activePreferences: readonly PreferenceNode[],
  recommendations: readonly Recommendation[],
): void {
  const safeIds = new Set(safeDecisions.map(({ id }) => id));
  const activePreferenceIds = new Set(
    activePreferences.map(({ id }) => id),
  );
  const recommendedIds = new Set<string>();
  if (
    safeIds.size !== safeDecisions.length ||
    recommendations.length !== safeDecisions.length
  ) {
    throw new Error("Recommendation response failed validation");
  }
  for (const recommendation of recommendations) {
    if (
      !safeIds.has(recommendation.decisionId) ||
      recommendedIds.has(recommendation.decisionId)
    ) {
      throw new Error("Recommendation response failed validation");
    }
    if (
      recommendation.usedPreferenceIds.some(
        (preferenceId) => !activePreferenceIds.has(preferenceId),
      )
    ) {
      throw new Error("Recommendation response failed validation");
    }
    recommendedIds.add(recommendation.decisionId);
  }
  if ([...safeIds].some((id) => !recommendedIds.has(id))) {
    throw new Error("Recommendation response failed validation");
  }
}
