import { describe, expect, it } from "vitest";
import { CreateSweepResponseSchema } from "../../src/shared/apiSchemas";

const id = "00000000-0000-4000-8000-000000000000";

function readyCard() {
  return {
    id,
    title: "Choose lunch",
    status: "ready" as const,
    recommendation: "Order soup",
    reasons: ["It is quick"],
    confidence: 0.9,
    reversibility: "high" as const,
    usedPreferenceIds: [],
    artifact: { kind: "message_draft" as const, text: "Soup works." },
  };
}

function blockedCard() {
  return {
    id,
    title: "Choose an investment",
    status: "blocked" as const,
    reason: "High-stakes decisions are not supported.",
  };
}

describe("CreateSweepResponseSchema", () => {
  it("parses both ready and blocked cards by their status", () => {
    const parsed = CreateSweepResponseSchema.parse({
      sweepId: id,
      cards: [readyCard(), blockedCard()],
    });

    expect(parsed.cards.map((card) => card.status)).toEqual([
      "ready",
      "blocked",
    ]);
  });

  it("applies the recommendation alternatives default to ready cards", () => {
    const parsed = CreateSweepResponseSchema.parse({
      sweepId: id,
      cards: [readyCard()],
    });

    const [card] = parsed.cards;
    expect(card.status).toBe("ready");
    if (card.status === "ready") {
      expect(card.alternatives).toEqual([]);
    }
  });

  it.each([
    ["zero", []],
    ["six", Array.from({ length: 6 }, () => blockedCard())],
  ])("rejects %s cards", (_count, cards) => {
    expect(CreateSweepResponseSchema.safeParse({ sweepId: id, cards }).success).toBe(
      false,
    );
  });

  it("rejects an unknown card discriminator", () => {
    expect(
      CreateSweepResponseSchema.safeParse({
        sweepId: id,
        cards: [{ ...blockedCard(), status: "pending" }],
      }).success,
    ).toBe(false);
  });
});
