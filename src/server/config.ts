import { z } from "zod";

const EnvSchema = z.object({
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_BASE_URL: z
    .literal("https://api.deepseek.com")
    .default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.literal("deepseek-v4-pro").default("deepseek-v4-pro"),
  DATABASE_PATH: z.string().default("./data/easy-mode.sqlite"),
  PORT: z.coerce.number().int().positive().default(8787),
});

export type AppConfig = {
  deepseek: {
    apiKey: string;
    baseURL: "https://api.deepseek.com";
    model: "deepseek-v4-pro";
  };
  databasePath: string;
  port: number;
};

export function loadConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): AppConfig {
  const parsed = EnvSchema.parse(env);
  return {
    deepseek: {
      apiKey: parsed.DEEPSEEK_API_KEY,
      baseURL: parsed.DEEPSEEK_BASE_URL,
      model: parsed.DEEPSEEK_MODEL,
    },
    databasePath: parsed.DATABASE_PATH,
    port: parsed.PORT,
  };
}
