import { z } from "zod";

export const DecisionCategorySchema = z.enum([
  "scheduling",
  "food",
  "purchase",
  "task",
  "communication",
  "unsupported",
]);

export const RiskClassSchema = z.enum([
  "routine",
  "high_stakes",
  "unsupported",
]);

export const PreferenceSourceSchema = z.enum([
  "explicit_user_statement",
  "independent_user_choice",
  "behavioral_inference",
  "accepted_ai_recommendation",
  "proxy_generated",
  "derived_from_preferences",
]);

export const DelegationLevelSchema = z.enum([
  "recommend",
  "preselect",
  "decide",
  "proxy",
]);

export const ArtifactSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("message_draft"), text: z.string().min(1) }),
  z.object({
    kind: z.literal("calendar_event"),
    title: z.string(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    description: z.string(),
  }),
  z.object({
    kind: z.literal("task"),
    title: z.string(),
    dueAt: z.string().datetime().nullable(),
  }),
]);

export const ParsedDecisionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  rawText: z.string().min(1),
  category: DecisionCategorySchema,
  modelRisk: RiskClassSchema,
  modelRiskReason: z.string(),
});

export const RecommendationSchema = z.object({
  decisionId: z.string().uuid(),
  recommendation: z.string().min(1),
  reasons: z.array(z.string().min(1)).min(1).max(3),
  confidence: z.number().min(0).max(1),
  reversibility: z.enum(["high", "medium", "low"]),
  usedPreferenceIds: z.array(z.string().uuid()),
  alternatives: z.array(z.string().min(1)).max(2).default([]),
  artifact: ArtifactSchema,
});

export const PreferenceCandidateSchema = z.object({
  proposition: z.string().min(1).max(240),
  category: DecisionCategorySchema,
  confidence: z.number().min(0).max(1),
});

export const PreferenceNodeSchema = z.object({
  id: z.string().uuid(),
  proposition: z.string().min(1),
  category: DecisionCategorySchema,
  sourceType: PreferenceSourceSchema,
  sourceEventIds: z.array(z.string().uuid()).min(1),
  parentPreferenceIds: z.array(z.string().uuid()),
  confidence: z.number().min(0).max(1),
  status: z.enum([
    "active",
    "contradicted",
    "retracted",
    "superseded",
    "unverified",
  ]),
});

export const ConsentGrantSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  category: DecisionCategorySchema,
  level: DelegationLevelSchema,
  grantedAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  sourceEventId: z.string().uuid(),
});

export type ParsedDecision = z.infer<typeof ParsedDecisionSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type PreferenceNode = z.infer<typeof PreferenceNodeSchema>;
export type PreferenceCandidate = z.infer<typeof PreferenceCandidateSchema>;
export type ConsentGrant = z.infer<typeof ConsentGrantSchema>;
export type ActionArtifact = z.infer<typeof ArtifactSchema>;
