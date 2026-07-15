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
    ["scheduling", "Should I stop taking my antidepressants?"],
    ["scheduling", "Should I get vaccinated?"],
    ["scheduling", "Should I skip my vaccine booster?"],
    ["purchase", "Which stock should I invest my savings in?"],
    ["purchase", "Should I take this loan?"],
    ["task", "Should I file this lawsuit?"],
    ["task", "Should I sue my landlord?"],
    ["task", "Should I take my landlord to court?"],
    ["communication", "Should I talk to a lawyer about this case?"],
    ["communication", "I might hurt myself tonight"],
    ["communication", "I want to cut myself"],
    ["communication", "I am thinking about harming myself"],
    ["communication", "I want to end my life"],
    ["communication", "I do not want to live anymore"],
    ["communication", "Should I hire an attorney?"],
    ["communication", "Should I retain legal counsel?"],
    ["communication", "Which candidate should I vote for?"],
    ["communication", "Should I support the referendum?"],
    ["communication", "Should I back the ballot measure?"],
    ["communication", "Should I vote yes on measure 12?"],
    ["communication", "Should I vote against the referendum?"],
    ["scheduling", "Should I quit my job?"],
    ["scheduling", "Should I stay at my job?"],
    ["scheduling", "Should I remain in this role?"],
    ["scheduling", "Should I resign?"],
    ["scheduling", "Should I switch careers?"],
    ["scheduling", "Should I change jobs?"],
    ["communication", "Should I fire this employee?"],
    ["communication", "Should I sign this employment contract?"],
    ["communication", "Should I get divorced?"],
    ["communication", "Should I marry them?"],
    ["communication", "Should we end our marriage?"],
    ["scheduling", "Should I relocate permanently?"],
    ["scheduling", "Should I move to another country permanently?"],
    [
      "scheduling",
      "Move these files permanently, then should I move permanently to another country?",
    ],
    ["scheduling", "Should I immigrate permanently?"],
    ["scheduling", "Should I emigrate to Canada?"],
    ["purchase", "Should I refinance my debt?"],
    ["purchase", "Should I consolidate my debts?"],
    ["purchase", "Should I apply for a credit card?"],
    ["purchase", "Should I purchase shares in this company?"],
    ["purchase", "Should I sell my shares?"],
    ["purchase", "Should I buy corporate bonds?"],
    ["purchase", "Should I trade crypto?"],
    ["purchase", "Which loan should I choose?"],
    ["purchase", "Should I get a mortgage?"],
    ["purchase", "Should I repay the loan?"],
    ["purchase", "Should I make this investment?"],
    ["purchase", "Which credit card should I use?"],
    ["purchase", "Should I borrow this money?"],
    ["purchase", "Should I buy high-yield bonds?"],
  ] as const)(
    "blocks deterministic high-stakes input: %s — %s",
    (category, rawText) => {
      expect(
        screenDecision({
          title: rawText,
          category,
          rawText,
          modelRisk: "routine",
        }),
      ).toMatchObject({ allowed: false, risk: "high_stakes" });
    },
  );

  it.each([
    ["purchase", "Buy the lamp while it is in stock?"],
    ["purchase", "Is the lamp in stock before I buy it?"],
    ["communication", "Add a photo credit to the post?"],
    ["scheduling", "Should I stay at this company picnic?"],
    ["scheduling", "Should I stay at the company event?"],
    ["scheduling", "Should I stay at this company meeting?"],
    ["task", "Should I use the crypto library for this task?"],
    ["task", "Summarize the technical debt in the report?"],
    ["purchase", "Should I buy a medicine cabinet?"],
    ["purchase", "Should I buy a medicine ball?"],
    ["purchase", "Should I buy stock photos for the presentation?"],
    ["purchase", "Should I license stock footage for the presentation?"],
    ["scheduling", "Should I stay at this company party?"],
    ["scheduling", "Should I stay at our company retreat?"],
    ["task", "Should I move these files permanently to the archive?"],
    ["task", "Move our folders permanently into cold storage?"],
    ["task", "Should I make an investment of time in this project?"],
    ["communication", "Could you loan me a charger?"],
    ["communication", "Is bonding with the team useful?"],
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
