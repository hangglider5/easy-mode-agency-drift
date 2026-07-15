import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/server/config";

describe("loadConfig", () => {
  it("requires only the DeepSeek key and preserves official endpoint defaults", () => {
    expect(() => loadConfig({})).toThrow(/DEEPSEEK_API_KEY/);
    const config = loadConfig({
      DEEPSEEK_API_KEY: "deepseek-test",
    });
    expect(config.deepseek).toEqual({
      apiKey: "deepseek-test",
      baseURL: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
    });
    expect(config).not.toHaveProperty("openai");
  });

  it("rejects alternate DeepSeek endpoints", () => {
    expect(() =>
      loadConfig({
        DEEPSEEK_API_KEY: "deepseek-test",
        DEEPSEEK_BASE_URL: "https://api.openai.com/v1",
      }),
    ).toThrow(/DEEPSEEK_BASE_URL/);
  });
});
