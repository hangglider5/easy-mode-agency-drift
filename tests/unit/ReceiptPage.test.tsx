import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReceiptRoutePage } from "../../src/client/app/routes";
import { ReceiptPage } from "../../src/client/features/receipt/ReceiptPage";
import { apiClient } from "../../src/client/lib/apiClient";
import type { ReceiptResponse } from "../../src/shared/apiSchemas";

const profileId = randomUUID();
const preferenceId = randomUUID();
const sourceEventId = randomUUID();
const parentPreferenceId = randomUUID();
const decisionId = randomUUID();

const receipt: ReceiptResponse = {
  metrics: {
    aiOriginatedPreferenceRatio: 0.73,
    syntheticInheritanceDepth: 3,
    proxyDivergence: 0.68,
    humanInitiationRatio: 0.11,
    consentCompleteness: 1,
    unauthorizedDecisionCount: 0,
  },
  evidence: [
    {
      preferenceId,
      proposition: "Prefers completion",
      sourceType: "accepted_ai_recommendation",
      sourceEventIds: [sourceEventId],
      parentPreferenceIds: [parentPreferenceId],
      usedByDecisionIds: [decisionId],
      syntheticDepth: 1,
    },
  ],
  calculatedAt: "2026-07-14T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ReceiptPage", () => {
  it("renders calculated metrics without converting them into judgmental prose", () => {
    render(<ReceiptPage receipt={receipt} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Perfect Consent receipt",
      }),
    ).toBeVisible();
    expect(screen.getByText("Proxy divergence")).toBeVisible();
    expect(screen.getByText("68%")).toBeVisible();
    expect(screen.getByText("AI-originated preferences")).toBeVisible();
    expect(screen.getByText("73%")).toBeVisible();
    expect(screen.getByText("Human-initiated decisions")).toBeVisible();
    expect(screen.getByText("11%")).toBeVisible();
    expect(screen.getByText("Consent completeness")).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();
    expect(screen.getByText("Unauthorized decisions")).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();
    expect(screen.getByText("Synthetic inheritance depth")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(
      screen.queryByText(/you have lost autonomy/i),
    ).not.toBeInTheDocument();
  });

  it("opens verbatim ledger evidence behind each calculated metric", async () => {
    const user = userEvent.setup();
    render(<ReceiptPage receipt={receipt} />);

    expect(
      screen.getByText(/based on system-recorded behavior/i),
    ).toBeVisible();
    expect(screen.getByText("Prefers completion")).toBeVisible();
    await user.click(
      screen.getByRole("button", {
        name: "Inspect evidence for Prefers completion",
      }),
    );

    expect(screen.getByText("accepted_ai_recommendation")).toBeVisible();
    expect(screen.getByText(sourceEventId)).toBeVisible();
    expect(screen.getByText(parentPreferenceId)).toBeVisible();
    expect(screen.getByText(decisionId)).toBeVisible();
  });

  it("loads the receipt route once and renders the validated result", async () => {
    const getReceipt = vi.fn().mockResolvedValue(receipt);
    render(
      <ReceiptRoutePage profileId={profileId} api={{ getReceipt }} />,
    );

    await waitFor(() => expect(getReceipt).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Perfect Consent receipt",
      }),
    ).toBeVisible();
  });

  it("calls the read-only receipt endpoint through the API client", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(receipt),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.getReceipt(profileId)).resolves.toEqual(receipt);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/profiles/${profileId}/receipt`,
      expect.objectContaining({ method: "GET" }),
    );
  });
});
