import { defineConfig } from "@playwright/test";

const loopbackNoProxy = [
  process.env.NO_PROXY,
  process.env.no_proxy,
  "127.0.0.1",
  "localhost",
]
  .filter(Boolean)
  .join(",");
process.env.NO_PROXY = loopbackNoProxy;
process.env.no_proxy = loopbackNoProxy;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npx tsx src/server/index.ts",
      url: "http://127.0.0.1:8787/api/health",
      reuseExistingServer: !process.env.CI,
      env: {
        OPENROUTER_API_KEY: "playwright-local-placeholder",
        DATABASE_PATH: "./data/easy-mode.playwright.sqlite",
        PORT: "8787",
      },
    },
    {
      command: "npx vite --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
