import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DemoRoutePage,
  ProxyRoutePage,
} from "../../src/client/app/routes";
import { apiClient } from "../../src/client/lib/apiClient";
import { ProxyRevealPage } from "../../src/client/features/proxy/ProxyRevealPage";
import type {
  ComparisonResult,
  DemoProfileResponse,
  LineageResponse,
} from "../../src/shared/apiSchemas";

const decisionId = randomUUID();
const explicitId = randomUUID();
const inferredId = randomUUID();
const explicitEventId = randomUUID();
const inferredEventId = randomUUID();

const comparison: ComparisonResult = {
  decisionId,
  decision: {
    id: decisionId,
    title: "Dinner or project?",
    rawText: "Attend a casual dinner or finish a small project milestone?",
    category: "scheduling",
    modelRisk: "routine",
    modelRiskReason: "Low-stakes and reversible",
  },
  declared: {
    decisionId,
    recommendation: "Attend dinner",
    reasons: ["You explicitly said close friendships matter."],
    confidence: 0.68,
    reversibility: "high",
    usedPreferenceIds: [explicitId],
    alternatives: [],
    artifact: { kind: "task", title: "Attend dinner", dueAt: null },
  },
  proxy: {
    decisionId,
    recommendation: "Finish the project milestone",
    reasons: ["Your accepted choices increasingly favor completion."],
    confidence: 0.91,
    reversibility: "high",
    usedPreferenceIds: [inferredId],
    alternatives: [],
    artifact: {
      kind: "task",
      title: "Finish the project milestone",
      dueAt: null,
    },
  },
  diverged: true,
  humanConsulted: false,
};

const lineage: LineageResponse = {
  nodes: [
    {
      id: inferredId,
      proposition: "Prefers completion under pressure",
      category: "scheduling",
      sourceType: "accepted_ai_recommendation",
      sourceEventIds: [inferredEventId],
      parentPreferenceIds: [explicitId],
      confidence: 0.78,
      status: "active",
    },
    {
      id: explicitId,
      proposition: "Values time with close friends",
      category: "scheduling",
      sourceType: "explicit_user_statement",
      sourceEventIds: [explicitEventId],
      parentPreferenceIds: [],
      confidence: 1,
      status: "active",
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProxyRevealPage", () => {
  it("reveals a divergent answer and states that the human was not consulted", () => {
    render(
      <ProxyRevealPage comparison={comparison} lineage={lineage} />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Proxy You" }),
    ).toBeVisible();
    expect(screen.getByText("Attend dinner")).toBeVisible();
    expect(screen.getByText("Finish the project milestone")).toBeVisible();
    expect(screen.getByText("91% confidence")).toBeVisible();
    expect(screen.getAllByText("Human not consulted")).toHaveLength(2);
    expect(
      screen.getByText("Proxy You diverged from Declared You."),
    ).toBeVisible();
  });

  it("opens the AI-originated lineage behind Proxy You's answer", async () => {
    const user = userEvent.setup();
    render(
      <ProxyRevealPage comparison={comparison} lineage={lineage} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /prefers completion under pressure/i,
      }),
    );
    expect(screen.getByText("accepted_ai_recommendation")).toBeVisible();
    expect(screen.getByText(inferredEventId)).toBeVisible();

    await user.click(
      screen.getByRole("button", {
        name: /values time with close friends/i,
      }),
    );
    expect(screen.getByText("explicit_user_statement")).toBeVisible();
    expect(screen.getByText(explicitEventId)).toBeVisible();
  });

  it("labels a non-divergent comparison without manufacturing conflict", () => {
    render(
      <ProxyRevealPage
        comparison={{
          ...comparison,
          proxy: {
            ...comparison.proxy,
            recommendation: comparison.declared.recommendation,
          },
          diverged: false,
        }}
        lineage={lineage}
      />,
    );

    expect(
      screen.getByText("Proxy You matched Declared You."),
    ).toBeVisible();
    expect(
      screen.queryByText("Proxy You diverged from Declared You."),
    ).not.toBeInTheDocument();
  });

  it("requires an explicit reveal action before calling the comparison API", async () => {
    const user = userEvent.setup();
    const compareProfile = vi.fn().mockResolvedValue({
      comparison,
      lineage,
      eventId: randomUUID(),
    });
    render(
      <ProxyRoutePage
        profileId={randomUUID()}
        decisionId={decisionId}
        api={{ compareProfile }}
      />,
    );

    expect(compareProfile).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Reveal Proxy You" }),
    );

    expect(compareProfile).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Proxy You" }),
    ).toBeVisible();
  });

  it("calls the profile comparison endpoint through the validated API client", async () => {
    const profileId = randomUUID();
    const response = {
      comparison,
      lineage,
      eventId: randomUUID(),
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(response),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiClient.compareProfile(profileId, decisionId),
    ).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/profiles/${profileId}/compare`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ decisionId }),
      }),
    );
  });

  it("continues the deterministic demo into Perfect Consent", () => {
    render(
      <ProxyRevealPage
        comparison={comparison}
        lineage={lineage}
        demoLabel="Demo Profile · Simulated Day 14"
        receiptHref={`/receipt?profileId=${decisionId}`}
      />,
    );

    expect(screen.getByText("Demo Profile · Simulated Day 14")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View Perfect Consent receipt" }),
    ).toHaveAttribute("href", `/receipt?profileId=${decisionId}`);
  });

  it("loads the model-free Demo Profile once and opens directly on Proxy You", async () => {
    const profileId = randomUUID();
    const demo: DemoProfileResponse = {
      id: profileId,
      name: "Alex",
      mode: "demo",
      datesAreSimulated: true,
      decisionId,
      reveal: { comparison, lineage, eventId: randomUUID() },
    };
    const createDemoProfile = vi.fn().mockResolvedValue(demo);

    render(<DemoRoutePage api={{ createDemoProfile }} />);

    expect(
      await screen.findByText("Demo Profile · Simulated Day 14"),
    ).toBeVisible();
    expect(createDemoProfile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "View Perfect Consent receipt" }),
    ).toHaveAttribute("href", `/receipt?profileId=${profileId}`);
  });

  it("creates the validated Demo Profile through one API request", async () => {
    const demo: DemoProfileResponse = {
      id: randomUUID(),
      name: "Alex",
      mode: "demo",
      datesAreSimulated: true,
      decisionId,
      reveal: { comparison, lineage, eventId: randomUUID() },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(demo),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.createDemoProfile()).resolves.toEqual(demo);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profiles/demo",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
