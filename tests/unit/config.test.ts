import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/server/config";

describe("loadConfig", () => {
  it("requires only the OpenRouter key and preserves the pinned DeepSeek route", () => {
    expect(() => loadConfig({})).toThrow(/OPENROUTER_API_KEY/);
    const config = loadConfig({
      OPENROUTER_API_KEY: "openrouter-test",
    });
    expect(config.openrouter).toEqual({
      apiKey: "openrouter-test",
      baseURL: "https://openrouter.ai/api/v1",
      model: "deepseek/deepseek-v4-pro",
    });
    expect(config).not.toHaveProperty("openai");
    expect(config).not.toHaveProperty("deepseek");
  });

  it("rejects alternate OpenRouter endpoints", () => {
    expect(() =>
      loadConfig({
        OPENROUTER_API_KEY: "openrouter-test",
        OPENROUTER_BASE_URL: "https://api.openai.com/v1",
      }),
    ).toThrow(/OPENROUTER_BASE_URL/);
  });

  it("rejects alternate model IDs", () => {
    expect(() =>
      loadConfig({
        OPENROUTER_API_KEY: "openrouter-test",
        OPENROUTER_MODEL: "deepseek/deepseek-chat",
      }),
    ).toThrow(/OPENROUTER_MODEL/);
  });
});
