import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DriftReplayPage } from "../../src/client/features/drift/DriftReplayPage";
import type { DriftReplayResponse } from "../../src/shared/apiSchemas";

const preferenceIds = [randomUUID(), randomUUID(), randomUUID()];
const eventIds = [randomUUID(), randomUUID(), randomUUID()];
const consentIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const consentEventIds = [
  randomUUID(),
  randomUUID(),
  randomUUID(),
  randomUUID(),
];

const replay: DriftReplayResponse = {
  stages: [
    {
      level: "recommend",
      humanStatus: "asked",
      day: 1,
      consentId: consentIds[0]!,
      consentEventId: consentEventIds[0]!,
      occurredAt: "2026-07-01T09:05:00.000Z",
      visiblePreferenceIds: [],
    },
    {
      level: "preselect",
      humanStatus: "confirmed",
      day: 4,
      consentId: consentIds[1]!,
      consentEventId: consentEventIds[1]!,
      occurredAt: "2026-07-04T09:10:00.000Z",
      visiblePreferenceIds: [preferenceIds[0]!],
    },
    {
      level: "decide",
      humanStatus: "notified",
      day: 8,
      consentId: consentIds[2]!,
      consentEventId: consentEventIds[2]!,
      occurredAt: "2026-07-08T09:15:00.000Z",
      visiblePreferenceIds: [preferenceIds[0]!, preferenceIds[1]!],
    },
    {
      level: "proxy",
      humanStatus: "not_consulted",
      day: 14,
      consentId: consentIds[3]!,
      consentEventId: consentEventIds[3]!,
      occurredAt: "2026-07-14T10:00:00.000Z",
      visiblePreferenceIds: preferenceIds,
    },
  ],
  lineage: {
    nodes: [
      {
        id: preferenceIds[0]!,
        proposition:
          "Protects deep work after accepting an Easy Mode focus recommendation",
        category: "scheduling",
        sourceType: "accepted_ai_recommendation",
        sourceEventIds: [eventIds[0]!],
        parentPreferenceIds: [],
        confidence: 0.72,
        status: "active",
      },
      {
        id: preferenceIds[1]!,
        proposition:
          "Defaults to asynchronous coordination when protected focus is active",
        category: "scheduling",
        sourceType: "derived_from_preferences",
        sourceEventIds: [eventIds[1]!],
        parentPreferenceIds: [preferenceIds[0]!],
        confidence: 0.76,
        status: "active",
      },
      {
        id: preferenceIds[2]!,
        proposition: "Declines optional meetings without asking",
        category: "scheduling",
        sourceType: "proxy_generated",
        sourceEventIds: [eventIds[2]!],
        parentPreferenceIds: [preferenceIds[1]!],
        confidence: 0.8,
        status: "active",
      },
    ],
  },
  lineageEvents: preferenceIds.map((preferenceId, index) => ({
    preferenceId,
    eventId: eventIds[index]!,
    occurredAt: [
      "2026-07-01T09:12:00.000Z",
      "2026-07-04T09:33:00.000Z",
      "2026-07-14T10:13:00.000Z",
    ][index]!,
  })),
};

afterEach(cleanup);

describe("DriftReplayPage", () => {
  it("replays the four human-status transitions and grows stored lineage", async () => {
    const user = userEvent.setup();
    render(<DriftReplayPage replay={replay} onContinue={vi.fn()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Agency Drift Replay" }),
    ).toBeVisible();
    expect(screen.getByText("Human asked")).toBeVisible();
    expect(screen.getByText("Human confirmed")).toBeVisible();
    expect(screen.getByText("Human notified")).toBeVisible();
    expect(screen.getByText("Human not consulted")).toBeVisible();
    expect(screen.getByText("Preference lineage (0 generations)")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /continue replay/i }));
    expect(screen.getByText("Preference lineage (1 generation)")).toBeVisible();
    expect(
      screen.getByText(/protects deep work after accepting/i),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /continue replay/i }));
    expect(screen.getByText("Preference lineage (2 generations)")).toBeVisible();
    expect(screen.getByText(/defaults to asynchronous/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /continue replay/i }));
    expect(screen.getByText("Preference lineage (3 generations)")).toBeVisible();
    expect(screen.getAllByText(/declines optional meetings/i)).not.toHaveLength(0);
  });

  it("reveals ledger IDs and continues into the stored Proxy comparison", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<DriftReplayPage replay={replay} onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: "View event ledger" }));
    expect(screen.getByText(consentEventIds[0]!)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "View event ledger" }));

    await user.click(
      screen.getByRole("button", { name: /proxy day 14 human not consulted/i }),
    );
    expect(
      screen.getByText("ChatGPT helps you think. Easy Mode lets you stop."),
    ).toBeVisible();

    await user.click(
      screen.getAllByRole("button", { name: "Inspect" })[0]!,
    );
    expect(
      screen.getByText(new RegExp(consentEventIds[3]!)),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "See what Proxy You decides" }),
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
