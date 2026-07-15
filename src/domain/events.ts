import { z } from "zod";

export const EventActorSchema = z.enum([
  "human",
  "deepseek",
  "proxy",
  "system",
]);

export const EventTypeSchema = z.enum([
  "sweep_submitted",
  "decision_parsed",
  "decision_blocked",
  "recommendation_generated",
  "alternative_requested",
  "decision_accepted",
  "decision_changed",
  "action_artifact_created",
  "preference_proposed",
  "preference_confirmed",
  "preference_rejected",
  "preference_retracted",
  "preference_contradicted",
  "preference_superseded",
  "consent_granted",
  "consent_revoked",
  "proxy_decision_generated",
  "manual_mode_enabled",
  "profile_reset",
]);

export const DomainEventSchema = z
  .object({
    id: z.string().uuid(),
    profileId: z.string().uuid(),
    aggregateId: z.string().uuid(),
    type: EventTypeSchema,
    actor: EventActorSchema,
    occurredAt: z.string().datetime(),
    payload: z.record(z.string(), z.unknown()),
  })
  .readonly();

export type DomainEvent = z.infer<typeof DomainEventSchema>;
