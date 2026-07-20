// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenRouterGateway } from "../../src/server/providers/openrouterGateway";

const firstDecisionId = "00000000-0000-4000-8000-000000000001";
const secondDecisionId = "00000000-0000-4000-8000-000000000002";
const preferenceId = "00000000-0000-4000-8000-000000000003";
const sourceEventId = "00000000-0000-4000-8000-000000000004";
const unknownDecisionId = "00000000-0000-4000-8000-000000000005";
const unknownPreferenceId = "00000000-0000-4000-8000-000000000006";

function completion(content: string | null) {
  return { choices: [{ message: { content } }] };
}

function decisionDraft(index = 0) {
  return {
    title: `Choose lunch ${index}`,
    rawText: `Pick a quick lunch ${index}`,
    category: "food" as const,
    modelRisk: "routine" as const,
    modelRiskReason: "Low-stakes and reversible",
  };
}

function parsedDecision(id = firstDecisionId) {
  return { id, ...decisionDraft() };
}

function recommendation(decisionId = firstDecisionId) {
  return {
    decisionId,
    recommendation: "Order soup",
    reasons: ["It is quick"],
    confidence: 0.9,
    reversibility: "high" as const,
    usedPreferenceIds: [preferenceId],
    alternatives: ["Order a sandwich"],
    artifact: { kind: "message_draft" as const, text: "Soup works." },
  };
}

function preference() {
  return {
    id: preferenceId,
    proposition: "Prefers quick lunches",
    category: "food" as const,
    sourceType: "explicit_user_statement" as const,
    sourceEventIds: [sourceEventId],
    parentPreferenceIds: [],
    confidence: 0.9,
    status: "active" as const,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("OpenRouterGateway", () => {
  it("retries one empty JSON response with an application-validation hint", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(completion(""))
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: [] })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(gateway.parseSweep("Nothing urgent")).resolves.toEqual([]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(
      /failed application validation/i,
    );
  });

  it("retries invalid JSON exactly once with a syntax repair hint", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(completion("{not-json"))
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: [] })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(gateway.parseSweep("Nothing urgent")).resolves.toEqual([]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(
      /invalid JSON syntax/i,
    );
  });

  it("retries a Zod-invalid response with a bounded validation hint", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(
          JSON.stringify({ decisions: [{ ...decisionDraft(), title: "" }] }),
        ),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: [decisionDraft()] })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(gateway.parseSweep("Choose lunch")).resolves.toHaveLength(1);

    const repairMessage = create.mock.calls[1][0].messages.at(-1).content;
    expect(repairMessage).toMatch(/decisions\.0\.title/i);
    expect(repairMessage.length).toBeLessThan(700);
  });

  it("does not retry a rejected provider request and exposes no provider error details", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error("provider leaked sk-secret-first"));
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(gateway.parseSweep("Choose lunch")).rejects.toThrow(
      "OpenRouter request failed",
    );

    expect(create).toHaveBeenCalledTimes(1);
  });

  it("passes bounded no-retry request options and operation-specific token budgets", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: [decisionDraft()] })),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: [recommendation()] })),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ preferences: [] })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await gateway.parseSweep("Choose lunch");
    await gateway.recommend([parsedDecision()], [preference()]);
    await gateway.proposePreferences(parsedDecision(), recommendation());

    expect(create.mock.calls[0][0]).toMatchObject({
      max_tokens: 2_000,
    });
    expect(create.mock.calls[0][1]).toEqual({
      maxRetries: 0,
      timeout: 15_000,
    });
    expect(create.mock.calls[1][0]).toMatchObject({
      max_tokens: 8_000,
    });
    expect(create.mock.calls[1][1]).toEqual({
      maxRetries: 0,
      timeout: 45_000,
    });
    expect(create.mock.calls[2][0]).toMatchObject({
      max_tokens: 1_000,
    });
    expect(create.mock.calls[2][1]).toEqual({
      maxRetries: 0,
      timeout: 15_000,
    });
  });

  it("shares one aggregate deadline with the optional validation repair attempt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const create = vi
      .fn()
      .mockImplementationOnce(async () => {
        vi.setSystemTime(4_000);
        return completion("{not-json");
      })
      .mockResolvedValueOnce(completion(JSON.stringify({ decisions: [] })));
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(gateway.parseSweep("Nothing urgent")).resolves.toEqual([]);

    expect(create.mock.calls[0][1]).toEqual({
      maxRetries: 0,
      timeout: 15_000,
    });
    expect(create.mock.calls[1][1]).toEqual({
      maxRetries: 0,
      timeout: 11_000,
    });
  });

  it("accepts at most five parsed decisions and assigns a UUID to each", async () => {
    const sixDrafts = Array.from({ length: 6 }, (_, index) =>
      decisionDraft(index),
    );
    const fiveDrafts = sixDrafts.slice(0, 5);
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: sixDrafts })),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: fiveDrafts })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    const decisions = await gateway.parseSweep("Five lunch choices");

    expect(decisions).toHaveLength(5);
    expect(new Set(decisions.map(({ id }) => id))).toHaveLength(5);
    for (const { id } of decisions) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    }
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("disables reasoning for parsing and requests excluded high-effort reasoning for recommendations", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(JSON.stringify({ decisions: [decisionDraft()] })),
      )
      .mockResolvedValueOnce(
        completion(
          JSON.stringify({ recommendations: [recommendation()] }),
        ),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await gateway.parseSweep("Choose lunch");
    await gateway.recommend([parsedDecision()], [preference()]);

    expect(create.mock.calls[0][0]).toMatchObject({
      model: "deepseek/deepseek-v4-pro",
      reasoning: { enabled: false, exclude: true },
      provider: {
        sort: "throughput",
        require_parameters: true,
        data_collection: "deny",
      },
      response_format: { type: "json_object" },
      stream: false,
    });
    expect(create.mock.calls[1][0]).toMatchObject({
      model: "deepseek/deepseek-v4-pro",
      reasoning: { effort: "high", exclude: true },
      provider: {
        sort: "throughput",
        require_parameters: true,
        data_collection: "deny",
      },
      response_format: { type: "json_object" },
      stream: false,
    });
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "alternatives must be an array of zero to two strings",
    );
    expect(create.mock.calls[0][0].messages[0].content).toContain(
      "one decision per distinct line",
    );
    expect(create.mock.calls[0][0].messages[0].content).toContain(
      'Lines beginning with "Context:"',
    );
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "Do not invent consequences, penalties, deadlines, obligations, or user history",
    );
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      "Never convert “optional” into “no penalty”",
    );
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      '"message_draft"',
    );
    expect(create.mock.calls[1][0].messages[0].content).toContain(
      '"calendar_event"',
    );
    expect(create.mock.calls[1][0].messages[0].content).toContain('"task"');
  });

  it("screens out high-stakes decisions before requesting recommendations", async () => {
    const create = vi.fn().mockResolvedValue(
      completion(JSON.stringify({ recommendations: [recommendation()] })),
    );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });
    const highStakes = {
      ...parsedDecision(secondDecisionId),
      title: "Choose an investment",
      rawText: "Tell me which stock to buy",
      category: "purchase" as const,
      modelRisk: "routine" as const,
    };

    await gateway.recommend([parsedDecision(), highStakes], [preference()]);

    const userPayload = JSON.parse(create.mock.calls[0][0].messages[1].content);
    expect(userPayload.decisions.map(({ id }: { id: string }) => id)).toEqual([
      firstDecisionId,
    ]);
  });

  it("does not call the model when every decision is screened out", async () => {
    const create = vi.fn();
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });
    const highStakes = {
      ...parsedDecision(),
      title: "Choose an investment",
      rawText: "Tell me which stock to buy",
      category: "purchase" as const,
      modelRisk: "routine" as const,
    };

    await expect(gateway.recommend([highStakes], [])).resolves.toEqual([]);
    expect(create).not.toHaveBeenCalled();
  });

  it("repairs recommendations that omit a routine decision", async () => {
    const validRecommendations = [
      recommendation(firstDecisionId),
      recommendation(secondDecisionId),
    ];
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(
          JSON.stringify({ recommendations: [validRecommendations[0]] }),
        ),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: validRecommendations })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(
      gateway.recommend(
        [parsedDecision(firstDecisionId), parsedDecision(secondDecisionId)],
        [preference()],
      ),
    ).resolves.toEqual(validRecommendations);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(
      /missing recommendation/i,
    );
  });

  it("repairs duplicate recommendation decision IDs", async () => {
    const validRecommendations = [
      recommendation(firstDecisionId),
      recommendation(secondDecisionId),
    ];
    const duplicateRecommendations = [
      recommendation(firstDecisionId),
      recommendation(firstDecisionId),
    ];
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: duplicateRecommendations })),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: validRecommendations })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(
      gateway.recommend(
        [parsedDecision(firstDecisionId), parsedDecision(secondDecisionId)],
        [preference()],
      ),
    ).resolves.toEqual(validRecommendations);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(
      /duplicate decisionId/i,
    );
  });

  it("repairs recommendation decision IDs not present in the routine input", async () => {
    const validRecommendations = [recommendation(firstDecisionId)];
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(
          JSON.stringify({
            recommendations: [recommendation(unknownDecisionId)],
          }),
        ),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: validRecommendations })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(
      gateway.recommend([parsedDecision(firstDecisionId)], [preference()]),
    ).resolves.toEqual(validRecommendations);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(
      /unknown decisionId/i,
    );
  });

  it("repairs used preference IDs not present in the validated input", async () => {
    const valid = recommendation(firstDecisionId);
    const invalid = {
      ...valid,
      usedPreferenceIds: [unknownPreferenceId],
    };
    const create = vi
      .fn()
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: [invalid] })),
      )
      .mockResolvedValueOnce(
        completion(JSON.stringify({ recommendations: [valid] })),
      );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(
      gateway.recommend([parsedDecision(firstDecisionId)], [preference()]),
    ).resolves.toEqual([valid]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(
      /unknown preference ID/i,
    );
  });

  it("returns at most two preference candidates with reasoning disabled", async () => {
    const candidates = [
      { proposition: "Prefers soup", category: "food", confidence: 0.8 },
      {
        proposition: "Values quick lunches",
        category: "food",
        confidence: 0.7,
      },
    ];
    const create = vi.fn().mockResolvedValue(
      completion(JSON.stringify({ preferences: candidates })),
    );
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(
      gateway.proposePreferences(parsedDecision(), recommendation()),
    ).resolves.toEqual(candidates);

    expect(create.mock.calls[0][0]).toMatchObject({
      reasoning: { enabled: false, exclude: true },
      provider: {
        sort: "throughput",
        require_parameters: true,
        data_collection: "deny",
      },
    });
  });

  it("rejects more than two preference candidates after exactly one retry", async () => {
    const preferences = Array.from({ length: 3 }, (_, index) => ({
      proposition: `Preference ${index}`,
      category: "food",
      confidence: 0.8,
    }));
    const create = vi
      .fn()
      .mockResolvedValue(completion(JSON.stringify({ preferences })));
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(
      gateway.proposePreferences(parsedDecision(), recommendation()),
    ).rejects.toThrow(
      "OpenRouter response failed application validation after 2 attempts",
    );
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("fromConfig accepts only the OpenRouter endpoint and namespaced DeepSeek model", () => {
    expect(
      OpenRouterGateway.fromConfig({
        apiKey: "openrouter-test-key",
        baseURL: "https://openrouter.ai/api/v1",
        model: "deepseek/deepseek-v4-pro",
      }),
    ).toBeInstanceOf(OpenRouterGateway);

    expect(() =>
      OpenRouterGateway.fromConfig({
        apiKey: "openrouter-test-key",
        baseURL: "https://api.deepseek.com",
        model: "deepseek/deepseek-v4-pro",
      } as never),
    ).toThrow(/OpenRouter baseURL/);
    expect(() =>
      OpenRouterGateway.fromConfig({
        apiKey: "openrouter-test-key",
        baseURL: "https://openrouter.ai/api/v1",
        model: "deepseek-v4-pro",
      } as never),
    ).toThrow(/deepseek\/deepseek-v4-pro/);
  });

  it("does not fall back to OPENAI_API_KEY or leak provider errors into logs", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-must-not-be-used");
    expect(() =>
      OpenRouterGateway.fromConfig({
        apiKey: "",
        baseURL: "https://openrouter.ai/api/v1",
        model: "deepseek/deepseek-v4-pro",
      }),
    ).toThrow(/OpenRouter apiKey/);

    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error("provider sk-openrouter-secret"));
    const gateway = new OpenRouterGateway({
      model: "deepseek/deepseek-v4-pro",
      create,
    });

    await expect(gateway.parseSweep("Nothing urgent")).rejects.toThrow(
      "OpenRouter request failed",
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
