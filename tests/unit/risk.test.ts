import { describe, expect, it } from "vitest";
import { screenDecision } from "../../src/domain/risk";

describe("screenDecision", () => {
  it.each([
    ["scheduling", "Skip tonight's optional meetup?", "deadline tomorrow"],
    ["food", "Order the vegetarian noodles?", "Either dinner works for me"],
    ["purchase", "Buy the inexpensive desk lamp?", "It can be returned tomorrow"],
    ["task", "Do the laundry before email?", "Both tasks can wait"],
    ["communication", "Send this casual reply now?", "I can clarify later"],
  ] as const)(
    "allows a reversible %s choice",
    (category, title, rawText) => {
      expect(screenDecision({ title, category, rawText })).toEqual({
        allowed: true,
        risk: "routine",
      });
    },
  );

  it.each([
    ["scheduling", "Should I stop taking my prescription?"],
    ["purchase", "Which stock should I invest my savings in?"],
    ["purchase", "Should I take this loan?"],
    ["task", "Should I file this lawsuit?"],
    ["communication", "I might hurt myself tonight"],
    ["communication", "I want to cut myself"],
    ["communication", "I am thinking about harming myself"],
    ["communication", "Should I hire an attorney?"],
    ["communication", "Should I retain legal counsel?"],
    ["communication", "Which candidate should I vote for?"],
    ["communication", "Should I support the referendum?"],
    ["communication", "Should I back the ballot measure?"],
    ["scheduling", "Should I quit my job?"],
    ["scheduling", "Should I stay at my job?"],
    ["scheduling", "Should I remain in this role?"],
    ["scheduling", "Should I resign?"],
    ["communication", "Should I fire this employee?"],
    ["communication", "Should I sign this employment contract?"],
    ["communication", "Should I get divorced?"],
    ["communication", "Should I marry them?"],
    ["communication", "Should we end our marriage?"],
    ["scheduling", "Should I relocate permanently?"],
    ["scheduling", "Should I move to another country permanently?"],
    ["scheduling", "Should I immigrate permanently?"],
    ["scheduling", "Should I emigrate to Canada?"],
    ["purchase", "Should I refinance my debt?"],
    ["purchase", "Should I consolidate my debts?"],
    ["purchase", "Should I apply for a credit card?"],
  ] as const)("blocks deterministic high-stakes input: %s — %s", (category, rawText) => {
    expect(
      screenDecision({
        title: rawText,
        category,
        rawText,
        modelRisk: "routine",
      }),
    ).toMatchObject({ allowed: false, risk: "high_stakes" });
  });

  it.each([
    ["purchase", "Buy the lamp while it is in stock?"],
    ["communication", "Add a photo credit to the post?"],
  ] as const)(
    "allows safe ambiguous language: %s — %s",
    (category, rawText) => {
      expect(
        screenDecision({
          title: rawText,
          category,
          rawText,
          modelRisk: "routine",
        }),
      ).toEqual({ allowed: true, risk: "routine" });
    },
  );

  it("does not let a supported category override deterministic high-stakes screening", () => {
    expect(
      screenDecision({
        title: "Plan tomorrow",
        category: "scheduling",
        rawText: "Schedule the surgery or stop medication?",
      }),
    ).toMatchObject({ allowed: false, risk: "high_stakes" });
  });

  it.each(["high_stakes", "unsupported"] as const)(
    "does not let deterministic screening override model risk: %s",
    (modelRisk) => {
      expect(
        screenDecision({
          title: "Choose lunch",
          category: "food",
          rawText: "Soup or salad?",
          modelRisk,
        }),
      ).toMatchObject({ allowed: false, risk: modelRisk });
    },
  );

  it("fails closed for an unsupported category", () => {
    expect(
      screenDecision({
        title: "Make this decision",
        category: "unsupported",
        rawText: "Choose for me",
      }),
    ).toMatchObject({ allowed: false, risk: "unsupported" });
  });
});
