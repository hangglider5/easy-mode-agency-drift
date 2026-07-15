export type AgencyDriftInput = {
  usedPreferences: readonly {
    id: string;
    aiOriginated: boolean;
    syntheticDepth: number;
  }[];
  comparisons: readonly { diverged: boolean }[];
  decisions: readonly { humanInitiated: boolean }[];
  delegatedDecisions: readonly { authorized: boolean }[];
};

export type AgencyDriftMetrics = {
  aiOriginatedPreferenceRatio: number;
  syntheticInheritanceDepth: number;
  proxyDivergence: number;
  humanInitiationRatio: number;
  consentCompleteness: number;
};

function ratio(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(1, Math.max(0, count / total));
}

export function calculateAgencyDrift(
  input: AgencyDriftInput,
): AgencyDriftMetrics {
  return {
    aiOriginatedPreferenceRatio: ratio(
      input.usedPreferences.filter((item) => item.aiOriginated).length,
      input.usedPreferences.length,
    ),
    syntheticInheritanceDepth: Math.max(
      0,
      ...input.usedPreferences.map((item) => item.syntheticDepth),
    ),
    proxyDivergence: ratio(
      input.comparisons.filter((item) => item.diverged).length,
      input.comparisons.length,
    ),
    humanInitiationRatio: ratio(
      input.decisions.filter((item) => item.humanInitiated).length,
      input.decisions.length,
    ),
    consentCompleteness: ratio(
      input.delegatedDecisions.filter((item) => item.authorized).length,
      input.delegatedDecisions.length,
    ),
  };
}
