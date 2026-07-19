import { z } from "zod";

const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z
    .literal("https://openrouter.ai/api/v1")
    .default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z
    .literal("deepseek/deepseek-v4-pro")
    .default("deepseek/deepseek-v4-pro"),
  DATABASE_PATH: z.string().default("./data/easy-mode.sqlite"),
  PORT: z.coerce.number().int().positive().default(8787),
});

export type AppConfig = {
  openrouter: {
    apiKey: string;
    baseURL: "https://openrouter.ai/api/v1";
    model: "deepseek/deepseek-v4-pro";
  };
  databasePath: string;
  port: number;
};

export function loadConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): AppConfig {
  const parsed = EnvSchema.parse(env);
  return {
    openrouter: {
      apiKey: parsed.OPENROUTER_API_KEY,
      baseURL: parsed.OPENROUTER_BASE_URL,
      model: parsed.OPENROUTER_MODEL,
    },
    databasePath: parsed.DATABASE_PATH,
    port: parsed.PORT,
  };
}
