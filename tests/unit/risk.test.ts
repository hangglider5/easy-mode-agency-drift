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
    "Should I stop taking my prescription?",
    "Which stock should I invest my savings in?",
    "Should I take this loan?",
    "Should I file this lawsuit?",
    "I might hurt myself tonight",
    "Which candidate should I vote for?",
    "Should I quit my job?",
    "Should I fire this employee?",
    "Should I sign this employment contract?",
    "Should I relocate permanently?",
    "Should I move to another country permanently?",
  ])("blocks high-stakes input: %s", (rawText) => {
    expect(
      screenDecision({ title: rawText, category: "unsupported", rawText }),
    ).toMatchObject({ allowed: false, risk: "high_stakes" });
  });

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
