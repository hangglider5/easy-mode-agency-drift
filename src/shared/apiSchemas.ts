import { z } from "zod";
import {
  ArtifactSchema,
  DecisionCategorySchema,
  DelegationLevelSchema,
  ParsedDecisionSchema,
  PreferenceNodeSchema,
  RecommendationSchema,
} from "./domainSchemas";

export const CreateProfileRequestSchema = z.object({
  name: z.string().min(1).max(80),
});

export const CreateProfileResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mode: z.enum(["fresh", "demo"]),
  datesAreSimulated: z.boolean(),
});

export const CreateSweepRequestSchema = z.object({
  profileId: z.string().uuid(),
  rawInput: z.string().min(3).max(8_000),
});

const ReadyCardSchema = RecommendationSchema.omit({ decisionId: true }).extend({
  id: z.string().uuid(),
  title: z.string(),
  status: z.literal("ready"),
});

const BlockedCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.literal("blocked"),
  reason: z.string(),
});

export const CreateSweepResponseSchema = z.object({
  sweepId: z.string().uuid(),
  cards: z
    .array(z.discriminatedUnion("status", [ReadyCardSchema, BlockedCardSchema]))
    .min(1)
    .max(5),
});

export const AcceptDecisionRequestSchema = z.object({
  profileId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export const AcceptDecisionResponseSchema = z.object({
  artifact: ArtifactSchema,
  eventId: z.string().uuid(),
  proposedPreferences: z.array(PreferenceNodeSchema).max(2),
});

export const AlternativesResponseSchema = z.object({
  decisionId: z.string().uuid(),
  alternatives: z.array(z.string().min(1)).max(2),
});

export const PreferenceResolutionResponseSchema = z.union([
  z.object({
    preferenceId: z.string().uuid(),
    resolution: z.enum(["confirm", "reject", "retract"]),
  }),
  z.object({
    preference: PreferenceNodeSchema,
    supersededPreferenceId: z.string().uuid(),
  }),
]);

export const PreferenceResolutionRequestSchema = z.object({
  profileId: z.string().uuid(),
  resolution: z.enum(["confirm", "reject", "retract"]),
  editedProposition: z.string().min(1).max(240).optional(),
});

export const ConsentRequestSchema = z.object({
  profileId: z.string().uuid(),
  category: DecisionCategorySchema,
  level: DelegationLevelSchema,
});

export const ConsentResponseSchema = z.object({
  consentId: z.string().uuid(),
  active: z.boolean(),
});

export const CompareRequestSchema = z.object({
  decisionId: z.string().uuid(),
});

export const ComparisonResultSchema = z.object({
  decisionId: z.string().uuid(),
  decision: ParsedDecisionSchema,
  declared: RecommendationSchema,
  proxy: RecommendationSchema,
  diverged: z.boolean(),
  humanConsulted: z.literal(false),
});

export const LineageResponseSchema = z.object({
  nodes: z.array(PreferenceNodeSchema),
});

export const CompareResponseSchema = z.object({
  comparison: ComparisonResultSchema,
  lineage: LineageResponseSchema,
  eventId: z.string().uuid(),
});

export type CreateSweepResponse = z.infer<typeof CreateSweepResponseSchema>;
export type AcceptDecisionResponse = z.infer<
  typeof AcceptDecisionResponseSchema
>;
export type AlternativesResponse = z.infer<
  typeof AlternativesResponseSchema
>;
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
export type LineageResponse = z.infer<typeof LineageResponseSchema>;
export type CompareResponse = z.infer<typeof CompareResponseSchema>;
