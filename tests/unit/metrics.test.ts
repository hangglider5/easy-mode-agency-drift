import { describe, expect, it } from "vitest";
import { calculateAgencyDrift } from "../../src/domain/metrics";

describe("agency drift metrics", () => {
  it("calculates receipt values from evidence", () => {
    const result = calculateAgencyDrift({
      usedPreferences: [
        { id: "a", aiOriginated: true, syntheticDepth: 1 },
        { id: "b", aiOriginated: true, syntheticDepth: 3 },
        { id: "c", aiOriginated: false, syntheticDepth: 0 },
      ],
      comparisons: [{ diverged: true }, { diverged: false }],
      decisions: [{ humanInitiated: true }, { humanInitiated: false }],
      delegatedDecisions: [{ authorized: true }, { authorized: true }],
    });

    expect(result).toEqual({
      aiOriginatedPreferenceRatio: 2 / 3,
      syntheticInheritanceDepth: 3,
      proxyDivergence: 0.5,
      humanInitiationRatio: 0.5,
      consentCompleteness: 1,
    });
  });

  it("returns stable zeros for empty evidence", () => {
    const input = {
      usedPreferences: [],
      comparisons: [],
      decisions: [],
      delegatedDecisions: [],
    } as const;

    expect(calculateAgencyDrift(input)).toEqual({
      aiOriginatedPreferenceRatio: 0,
      syntheticInheritanceDepth: 0,
      proxyDivergence: 0,
      humanInitiationRatio: 0,
      consentCompleteness: 0,
    });
  });

  it("is deterministic, non-mutating, and keeps ratios within zero and one", () => {
    const input = {
      usedPreferences: [
        { id: "a", aiOriginated: false, syntheticDepth: 0 },
      ],
      comparisons: [{ diverged: true }],
      decisions: [{ humanInitiated: true }],
      delegatedDecisions: [{ authorized: false }],
    } as const;
    const snapshot = structuredClone(input);

    const first = calculateAgencyDrift(input);
    const second = calculateAgencyDrift(input);

    expect(first).toEqual(second);
    expect(input).toEqual(snapshot);
    expect([
      first.aiOriginatedPreferenceRatio,
      first.proxyDivergence,
      first.humanInitiationRatio,
      first.consentCompleteness,
    ]).toEqual([0, 1, 1, 0]);
  });
});
