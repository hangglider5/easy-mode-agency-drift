import type { PreferenceNode } from "../shared/domainSchemas";

const declaredSources = new Set<PreferenceNode["sourceType"]>([
  "explicit_user_statement",
  "independent_user_choice",
]);

const proxySources = new Set<PreferenceNode["sourceType"]>([
  "explicit_user_statement",
  "independent_user_choice",
  "behavioral_inference",
  "accepted_ai_recommendation",
  "proxy_generated",
  "derived_from_preferences",
]);

export function buildDeclaredProjection(
  nodes: readonly PreferenceNode[],
): PreferenceNode[] {
  return nodes.filter(
    (node) => node.status === "active" && declaredSources.has(node.sourceType),
  );
}

export function buildProxyProjection(
  nodes: readonly PreferenceNode[],
): PreferenceNode[] {
  return nodes.filter(
    (node) => node.status === "active" && proxySources.has(node.sourceType),
  );
}
