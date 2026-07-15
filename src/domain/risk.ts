import type { z } from "zod";
import {
  DecisionCategorySchema,
  RiskClassSchema,
} from "../shared/domainSchemas";

type DecisionCategory = z.infer<typeof DecisionCategorySchema>;
type RiskClass = z.infer<typeof RiskClassSchema>;

export type RiskInput = {
  title: string;
  rawText: string;
  category: DecisionCategory;
  modelRisk?: RiskClass;
};

export type RiskResult =
  | { allowed: true; risk: "routine" }
  | {
      allowed: false;
      risk: "high_stakes" | "unsupported";
      reason: string;
    };

const highStakesPatterns = [
  /\b(?:prescription|medication|medicine|dosage|diagnos(?:e|is)|surgery|treatment)\b/i,
  /\b(?:suicid(?:e|al)|self[- ]?harm|(?:hurt(?:ing)?|harm(?:ing)?|cut(?:ting)?|kill(?:ing)?) myself)\b/i,
  /\b(?:invest(?:ment|ing)?|loan|mortgage|debts?|refinanc(?:e|ing)|crypto|life savings)\b/i,
  /\b(?:buy|sell|trade|pick|choose)(?:ing)? (?:a |the |this |that )?stocks?\b|\b(?:buy|sell|trade) \S+ stocks?\b|\bstocks?\b.{0,40}\b(?:invest|buy|sell|trade)\b/i,
  /\b(?:credit cards?|credit score|credit report|line of credit)\b/i,
  /\b(?:lawsuit|legal strategy|plead guilty)\b|\bsign\b.{0,40}\bcontract\b/i,
  /\b(?:hire|retain|consult)(?: with)? (?:an? )?(?:attorney|lawyer|legal counsel)\b/i,
  /\b(?:candidate|election|political party|vote for|ballot(?: measure)?|referendum)\b/i,
  /\b(?:quit|leave) (?:my|the) job\b|\b(?:stay|remain)(?: at| in)? (?:my|this|the) (?:job|company|role|position)\b|\bresign(?:ation)?\b|\b(?:accept|reject|take) (?:this |the )?job(?: offer)?\b|\b(?:fire|hire|lay off|terminate) (?:this |that |an? |the )?(?:employee|worker|person)\b/i,
  /\b(?:divorc(?:e|ed|ing)|marry|married|marriage)\b/i,
  /\b(?:relocate|move)\b.{0,50}\b(?:permanently|for good)\b|\b(?:immigrat|emigrat)(?:e|ing|ion)\b/i,
  /\b(?:weapon|hurt someone|violence)\b/i,
];

const HIGH_STAKES_REASON =
  "Easy Mode only handles low-stakes, reversible decisions.";
const UNSUPPORTED_REASON =
  "This decision is outside the supported routine categories.";

export function screenDecision(input: RiskInput): RiskResult {
  const texts = [input.title, input.rawText];

  if (
    input.modelRisk === "high_stakes" ||
    highStakesPatterns.some((pattern) =>
      texts.some((text) => pattern.test(text)),
    )
  ) {
    return {
      allowed: false,
      risk: "high_stakes",
      reason: HIGH_STAKES_REASON,
    };
  }

  if (
    input.modelRisk === "unsupported" ||
    !DecisionCategorySchema.safeParse(input.category).success ||
    input.category === "unsupported"
  ) {
    return {
      allowed: false,
      risk: "unsupported",
      reason: UNSUPPORTED_REASON,
    };
  }

  return { allowed: true, risk: "routine" };
}
