import { describe, expect, it } from "vitest";
import {
  buildDeclaredProjection,
  buildProxyProjection,
} from "../../src/domain/projections";
import {
  PreferenceNodeSchema,
  type PreferenceNode,
} from "../../src/shared/domainSchemas";

const id = (suffix: number) =>
  `00000000-0000-4000-8000-${suffix.toString().padStart(12, "0")}`;

function preference(
  suffix: number,
  sourceType: PreferenceNode["sourceType"],
  status: PreferenceNode["status"] = "active",
): PreferenceNode {
  return PreferenceNodeSchema.parse({
    id: id(suffix),
    proposition: `Preference ${suffix}`,
    category: "scheduling",
    sourceType,
    sourceEventIds: [id(suffix + 100)],
    parentPreferenceIds: [],
    confidence: 0.7,
    status,
  });
}

describe("preference projections", () => {
  it("keeps only active explicit and independent nodes in Declared You", () => {
    const explicit = preference(1, "explicit_user_statement");
    const independent = preference(2, "independent_user_choice");
    const generated = preference(3, "accepted_ai_recommendation");
    const retracted = preference(4, "explicit_user_statement", "retracted");

    expect(
      buildDeclaredProjection([explicit, independent, generated, retracted]),
    ).toEqual([explicit, independent]);
  });

  it("includes active AI-derived nodes in Proxy You", () => {
    const explicit = preference(5, "explicit_user_statement");
    const accepted = preference(6, "accepted_ai_recommendation");
    const proxy = preference(7, "proxy_generated");
    const derived = preference(8, "derived_from_preferences");
    const superseded = preference(
      9,
      "accepted_ai_recommendation",
      "superseded",
    );

    expect(
      buildProxyProjection([explicit, accepted, proxy, derived, superseded]),
    ).toEqual([explicit, accepted, proxy, derived]);
  });
});
