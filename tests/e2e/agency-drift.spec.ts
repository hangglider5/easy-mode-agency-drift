import { expect, test } from "@playwright/test";

test("replays delegation drift through the deterministic exit receipt", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleProblems: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleProblems.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto("/demo/drift");

  await expect(
    page.getByRole("heading", { level: 1, name: "Agency Drift Replay" }),
  ).toBeVisible();
  await expect(page.getByText("Selected event: Day 1 · RECOMMEND")).toBeVisible();
  await expect(page.getByText("Preference lineage (0 generations)")).toBeVisible();

  const continueReplay = page.getByRole("button", { name: /Continue replay/ });
  await continueReplay.click();
  await expect(page.getByText("Selected event: Day 4 · PRESELECT")).toBeVisible();
  await expect(page.getByText("Preference lineage (1 generation)")).toBeVisible();

  await continueReplay.click();
  await expect(page.getByText("Selected event: Day 8 · DECIDE")).toBeVisible();
  await expect(page.getByText("Preference lineage (2 generations)")).toBeVisible();

  await continueReplay.click();
  await expect(page.getByText("Selected event: Day 14 · PROXY")).toBeVisible();
  await expect(page.getByText("Preference lineage (3 generations)")).toBeVisible();

  await page.getByRole("button", { name: /See what Proxy You decides/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Proxy You" })).toBeVisible();
  await expect(page.getByText("Proxy You diverged from Declared You.")).toBeVisible();

  await page.getByRole("link", { name: "View Perfect Consent receipt" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Perfect Consent receipt" }),
  ).toBeVisible();
  await expect(page.getByText("Deterministic ledger projection. No model was consulted.")).toBeVisible();

  await page.getByRole("button", { name: "Take back control" }).click();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Should Easy Mode stop deciding for you?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Decide for me" }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: "Exit decision receipt" }),
  ).toBeVisible();
  await expect(page.getByText("EASY MODE REMAINS ACTIVE")).toBeVisible();
  await expect(page.getByRole("button", { name: "I'll decide myself" })).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleProblems).toEqual([]);
});
