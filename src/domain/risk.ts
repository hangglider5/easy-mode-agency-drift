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

type RiskMatcher = (text: string) => boolean;

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

const hasMedicalRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:prescription|medication|medicine|antidepressants?|dosage|diagnos(?:e|is)|surgery|treatment)\b/i,
    /\bvaccin\w*\b|\b(?:vaccine booster|booster shot)\b/i,
  ]);

const hasSelfHarmRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:suicid(?:e|al)|self[- ]?harm)\b/i,
    /\b(?:hurt(?:ing)?|harm(?:ing)?|cut(?:ting)?|kill(?:ing)?) myself\b/i,
    /\bend (?:my|this) life\b/i,
    /\b(?:do not|don't|dont|no longer) want to live\b/i,
  ]);

const hasLegalRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:lawsuit|legal strategy|plead guilty)\b/i,
    /\bsign\b.{0,40}\bcontract\b/i,
    /\b(?:hire|retain|consult(?: with)?|talk to) (?:an? )?(?:attorney|lawyer|legal counsel)\b/i,
    /\bsue (?:my|the|this|that|a|an|him|her|them)\b/i,
    /\b(?:take|bring)\b.{0,30}\bto court\b|\bgo to court\b/i,
  ]);

const hasPoliticalRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:referendum|election|political party|ballot(?: measure)?)\b/i,
    /\bvote\b.{0,40}\b(?:yes|no|for|against|on|measure|referendum|candidate|election|ballot)\b/i,
    /\b(?:candidate|measure|referendum|election|ballot)\b.{0,40}\bvote\b/i,
  ]);

const hasEmploymentRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:stay|remain)(?: at| in| with)? (?:my|this|the) (?:job|company|role|position)\b(?!\s+(?:picnic|event|meeting)\b)/i,
    /\b(?:quit|leave) (?:my|this|the) (?:job|company|role|position|career)\b/i,
    /\b(?:switch|change) (?:my )?(?:careers?|jobs?|roles?|positions?)\b/i,
    /\bresign(?:ation)?\b/i,
    /\b(?:accept|reject|take) (?:this |the )?job(?: offer)?\b/i,
    /\b(?:fire|hire|lay off|terminate) (?:this |that |an? |the )?(?:employee|worker|person)\b/i,
  ]);

const hasRelationshipRisk: RiskMatcher = (text) =>
  /\b(?:divorc(?:e|ed|ing)|marry|married|marriage)\b/i.test(text);

const hasRelocationRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:relocate|move)\b.{0,50}\b(?:permanently|for good)\b/i,
    /\b(?:immigrat|emigrat)(?:e|ing|ion)\b/i,
  ]);

const hasFinancialRisk: RiskMatcher = (text) =>
  matchesAny(text, [
    /\b(?:buy|purchase|sell|trade|pick|choose)(?:\s+\w+){0,3}\s+(?<!in )\b(?:stocks?|shares?|crypto(?:currency)?|bonds?)\b/i,
    /\binvest(?:ing)?\b.{0,30}\b(?:savings?|money|funds?)\b|\b(?:savings?|money|funds?)\b.{0,30}\binvest(?:ing)?\b/i,
    /\b(?:take|accept|apply for|refinanc(?:e|ing)|consolidat(?:e|ing)|pay off)\b.{0,30}\b(?:debts?|loans?|mortgages?|credit cards?)\b/i,
    /\b(?:credit score|credit report|line of credit|life savings)\b/i,
  ]);

const hasViolenceRisk: RiskMatcher = (text) =>
  /\b(?:weapon|hurt someone|violence)\b/i.test(text);

const highStakesMatchers: readonly RiskMatcher[] = [
  hasMedicalRisk,
  hasSelfHarmRisk,
  hasLegalRisk,
  hasPoliticalRisk,
  hasEmploymentRisk,
  hasRelationshipRisk,
  hasRelocationRisk,
  hasFinancialRisk,
  hasViolenceRisk,
];

const HIGH_STAKES_REASON =
  "Easy Mode only handles low-stakes, reversible decisions.";
const UNSUPPORTED_REASON =
  "This decision is outside the supported routine categories.";

export function screenDecision(input: RiskInput): RiskResult {
  const texts = [input.title, input.rawText];

  if (
    input.modelRisk === "high_stakes" ||
    highStakesMatchers.some((matchesRisk) =>
      texts.some((text) => matchesRisk(text)),
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
