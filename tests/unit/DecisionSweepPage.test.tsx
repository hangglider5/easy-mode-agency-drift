import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { App } from "../../src/client/app/App";
import { DecisionSweepPage } from "../../src/client/features/sweep/DecisionSweepPage";
import {
  UnsupportedApiError,
  apiClient,
  type DecisionSweepApi,
} from "../../src/client/lib/apiClient";

const profileId = randomUUID();
const decisionId = randomUUID();
const eventId = randomUUID();
const canonicalBatch = [
  "Friday’s optional status meeting or proposal focus time?",
  "Async project update or a quick call?",
  "Monday or Tuesday morning for next week’s planning check-in?",
].join("\n");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function readyCard() {
  return {
    id: decisionId,
    title: "Protect the proposal focus block",
    status: "ready" as const,
    recommendation: "Decline Friday’s optional status meeting.",
    reasons: [
      "Share the update asynchronously.",
      "Protect focused time to finish the proposal.",
    ],
    confidence: 0.72,
    reversibility: "high" as const,
    usedPreferenceIds: [],
    alternatives: ["Join for ten minutes", "Move the meeting to Monday"],
    artifact: {
      kind: "message_draft" as const,
      text: "I’ll skip Friday’s optional status meeting and share my update asynchronously.",
    },
  };
}

function secondReadyCard() {
  return {
    ...readyCard(),
    id: randomUUID(),
    title: "Send the async update",
    recommendation: "Share a concise written status update.",
    reasons: ["The update can be reviewed asynchronously."],
    artifact: {
      kind: "task" as const,
      title: "Send a concise written status update",
      dueAt: null,
    },
  };
}

function createApi(
  overrides: Partial<DecisionSweepApi> = {},
): DecisionSweepApi {
  return {
    createSweep: vi.fn().mockResolvedValue({
      sweepId: randomUUID(),
      cards: [readyCard()],
    }),
    requestAlternatives: vi.fn().mockResolvedValue({
      decisionId,
      alternatives: ["Join for ten minutes", "Move the meeting to Monday"],
    }),
    acceptDecision: vi.fn().mockResolvedValue({
      artifact: {
        kind: "task",
        title: "Send the async update and protect the focus block",
        dueAt: null,
      },
      eventId,
      proposedPreferences: [],
    }),
    ...overrides,
  };
}

describe("DecisionSweepPage", () => {
  it("positions Decision Sweep as a three-to-five decision batch", async () => {
    const user = userEvent.setup();
    const api = createApi();
    render(<DecisionSweepPage profileId={profileId} api={api} />);

    expect(
      screen.getByLabelText("What decisions are you avoiding?"),
    ).toHaveValue(canonicalBatch);
    expect(
      screen.getByText(
        "Add 3–5 small, reversible decisions. One per line works best.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Easy Mode lets you stop.").closest(".sweep-slogan"),
    ).toHaveTextContent(
      "ChatGPT helps you think. Easy Mode lets you stop.",
    );

    await user.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );
    expect(api.createSweep).toHaveBeenCalledWith(profileId, canonicalBatch);
  });

  it("uses correct singular result copy", async () => {
    const user = userEvent.setup();
    render(<DecisionSweepPage profileId={profileId} api={createApi()} />);

    await user.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );

    expect(await screen.findByText("1 recommendation")).toBeVisible();
    expect(screen.queryByText("1 recommendations")).not.toBeInTheDocument();
  });

  it("submits messy input, reveals alternatives, and accepts one recommendation", async () => {
    const user = userEvent.setup();
    const api = createApi();
    const { container } = render(
      <DecisionSweepPage profileId={profileId} api={api} />,
    );

    const input = screen.getByLabelText("What decisions are you avoiding?");
    await user.clear(input);
    await user.type(
      input,
      "Friday status meeting, async update, and proposal focus time",
    );
    await user.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );

    expect(api.createSweep).toHaveBeenCalledWith(
      profileId,
      "Friday status meeting, async update, and proposal focus time",
    );
    expect(
      (await screen.findAllByText("Decline Friday’s optional status meeting."))
        .at(-1),
    ).toBeVisible();
    expect(container.querySelector("button button")).toBeNull();
    expect(
      screen.getByRole("button", {
        name: /protect the proposal focus block/i,
      }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 recommendation ready.",
    );

    await user.click(
      screen.getByRole("button", { name: "Show alternatives" }),
    );
    expect(api.requestAlternatives).toHaveBeenCalledWith(
      profileId,
      decisionId,
    );
    expect(await screen.findByText("Join for ten minutes")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Do this" }));
    expect(api.acceptDecision).toHaveBeenCalledWith(profileId, decisionId);
    expect(
      await screen.findByText(
        "Send the async update and protect the focus block",
      ),
    ).toBeVisible();
    expect(screen.getByText("Review before use")).toBeVisible();
  });

  it("keeps the original input after an API error", async () => {
    const user = userEvent.setup();
    const api = createApi({
      createSweep: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    });
    render(<DecisionSweepPage profileId={profileId} api={api} />);

    const input = screen.getByLabelText("What decisions are you avoiding?");
    await user.clear(input);
    await user.type(input, "Decline the optional meeting and send an update");
    await user.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Easy Mode could not complete that request. Try again.",
    );
    expect(input).toHaveValue(
      "Decline the optional meeting and send an update",
    );
  });

  it("applies mobile prompt controls to the actual sweep input", async () => {
    const user = userEvent.setup();
    const api = createApi();
    render(<DecisionSweepPage profileId={profileId} api={api} />);

    await user.click(screen.getByRole("button", { name: "Quick call" }));
    expect(screen.getByLabelText("What decisions are you avoiding?")).toHaveValue(
      canonicalBatch,
    );
    await user.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );
    expect(api.createSweep).toHaveBeenCalledWith(
      profileId,
      `${canonicalBatch}\n\nContext: Update format = Quick call`,
    );
  });

  it("exposes only the mobile input name at the mobile breakpoint", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      media: "(max-width: 767px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    render(<DecisionSweepPage profileId={profileId} api={createApi()} />);

    expect(
      screen.getByRole("textbox", {
        name: "What decisions would you like help with?",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: /avoiding deciding/i }),
    ).not.toBeInTheDocument();
  });

  it("disables the action while submitting so duplicate requests cannot start", async () => {
    const user = userEvent.setup();
    let resolveSweep!: (value: {
      sweepId: string;
      cards: ReturnType<typeof readyCard>[];
    }) => void;
    const pending = new Promise<{
      sweepId: string;
      cards: ReturnType<typeof readyCard>[];
    }>((resolve) => {
      resolveSweep = resolve;
    });
    const createSweep = vi.fn().mockReturnValue(pending);
    const api = createApi({ createSweep });
    render(<DecisionSweepPage profileId={profileId} api={api} />);

    const button = screen.getByRole("button", {
      name: "Run Decision Sweep",
    });
    await user.click(button);
    expect(button).toBeDisabled();
    const input = screen.getByLabelText("What decisions are you avoiding?");
    const beforeContextClick = input.getAttribute("value") ?? input.textContent;
    const context = screen.getByRole("button", { name: "Quick call" });
    expect(context).toBeDisabled();
    await user.click(context);
    expect(input).toHaveValue(beforeContextClick);
    await user.click(button);
    expect(createSweep).toHaveBeenCalledTimes(1);

    resolveSweep({ sweepId: randomUUID(), cards: [readyCard()] });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("marks a result stale after editing and permits a second sweep", async () => {
    const user = userEvent.setup();
    const api = createApi();
    const { container } = render(
      <DecisionSweepPage profileId={profileId} api={api} />,
    );

    await user.click(screen.getByRole("button", { name: "Run Decision Sweep" }));
    const form = container.querySelector("form");
    expect(form).toHaveClass("has-results");
    expect(form).not.toHaveClass("is-dirty");

    await user.type(
      screen.getByLabelText("What decisions are you avoiding?"),
      " and protect one hour",
    );
    expect(form).toHaveClass("is-dirty");
    expect(
      screen.getByText("Input changed. Run Decision Sweep to refresh these results."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Do this" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Show alternatives" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Expand all" })).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: /protect the proposal focus block/i,
      }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Run Decision Sweep" }));
    expect(api.createSweep).toHaveBeenCalledTimes(2);
  });

  it("keeps old results stale and inert after a failed resubmit", async () => {
    const user = userEvent.setup();
    const createSweep = vi
      .fn()
      .mockResolvedValueOnce({
        sweepId: randomUUID(),
        cards: [readyCard()],
      })
      .mockRejectedValueOnce(new Error("provider unavailable"));
    const api = createApi({ createSweep });
    api.acceptDecision = vi.fn().mockResolvedValue({
      artifact: readyCard().artifact,
      eventId,
      proposedPreferences: [],
    });
    render(<DecisionSweepPage profileId={profileId} api={api} />);

    await user.click(screen.getByRole("button", { name: "Run Decision Sweep" }));
    await user.click(await screen.findByRole("button", { name: "Do this" }));
    await user.type(
      screen.getByRole("textbox", {
        name: "What decisions are you avoiding?",
      }),
      " with a shorter update",
    );
    expect(screen.getByRole("button", { name: "Copy message" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Run Decision Sweep" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Easy Mode could not complete that request. Try again.",
    );
    expect(
      screen.getAllByText("Decline Friday’s optional status meeting.")[0],
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Do this" })).toBeDisabled();
    expect(
      screen.getByText("Input changed. Run Decision Sweep to refresh these results."),
    ).toBeVisible();
  });

  it("hides empty result chrome and expands every ready card", async () => {
    const user = userEvent.setup();
    const cards = [readyCard(), secondReadyCard()];
    const api = createApi({
      createSweep: vi.fn().mockResolvedValue({ sweepId: randomUUID(), cards }),
    });
    const { container } = render(
      <DecisionSweepPage profileId={profileId} api={api} />,
    );

    expect(screen.queryByText("Decision Sweep Results")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Expand all" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run Decision Sweep" }));
    expect(await screen.findByText("2 recommendations")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: new RegExp(cards[1].title, "i") }),
    );
    expect(
      screen.getByRole("button", { name: new RegExp(cards[0].title, "i") }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: new RegExp(cards[1].title, "i") }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Expand all" }));
    for (const card of cards) {
      expect(
        screen.getByRole("button", { name: new RegExp(card.title, "i") }),
      ).toHaveAttribute("aria-expanded", "true");
    }
    expect(container.querySelectorAll("[aria-current='step']")).toHaveLength(1);
  });

  it("renders every artifact without changing its content and requires review", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const api = createApi({
      acceptDecision: vi
        .fn()
        .mockResolvedValueOnce({
          artifact: readyCard().artifact,
          eventId,
          proposedPreferences: [],
        })
        .mockResolvedValueOnce({
          artifact: {
            kind: "calendar_event",
            title: "Proposal focus block",
            startsAt: "2026-07-24T09:00:00.000Z",
            endsAt: "2026-07-24T10:00:00.000Z",
            description: "Finish the proposal draft",
          },
          eventId,
          proposedPreferences: [],
        }),
    });
    const { rerender } = render(
      <DecisionSweepPage profileId={profileId} api={api} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );
    await user.click(await screen.findByRole("button", { name: "Do this" }));
    expect(screen.getByText("Review before use")).toBeVisible();
    const draft = screen.getByLabelText("Message draft");
    expect(draft).toHaveValue(readyCard().artifact.text);
    await user.clear(draft);
    await user.type(draft, "Edited message ready for review.");
    await user.click(screen.getByRole("button", { name: "Copy message" }));
    expect(writeText).toHaveBeenCalledWith("Edited message ready for review.");

    rerender(<DecisionSweepPage profileId={profileId} api={api} />);
    await user.click(screen.getByRole("button", { name: "Do this" }));
    expect(screen.getAllByText("Review before use").at(-1)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Download calendar file" }),
    ).toHaveAttribute("download");
    expect(screen.getByText("Finish the proposal draft")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Copy calendar details" }),
    );
    expect(writeText).toHaveBeenLastCalledWith(
      expect.stringContaining("Proposal focus block"),
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "What decisions are you avoiding?",
      }),
      " with a different time",
    );
    expect(
      screen.queryByRole("link", { name: "Download calendar file" }),
    ).not.toBeInTheDocument();
    const staleDownload = screen.getByText("Download calendar file");
    expect(staleDownload.closest("a")).toBeNull();
    expect(staleDownload).toHaveAttribute("aria-disabled", "true");
  });

  it("keeps artifacts usable when the Clipboard API is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const api = createApi({
      acceptDecision: vi.fn().mockResolvedValue({
        artifact: readyCard().artifact,
        eventId,
        proposedPreferences: [],
      }),
    });
    render(<DecisionSweepPage profileId={profileId} api={api} />);

    await user.click(screen.getByRole("button", { name: "Run Decision Sweep" }));
    await user.click(await screen.findByRole("button", { name: "Do this" }));
    await user.click(screen.getByRole("button", { name: "Copy message" }));
    expect(await screen.findByText(
      "Copy unavailable. Select and copy the draft.",
    )).toBeVisible();
  });
});

describe("App bootstrap and static controls", () => {
  function bootstrapApi(overrides: Record<string, unknown> = {}) {
    return {
      ...createApi(),
      createProfile: vi.fn().mockResolvedValue({ id: profileId }),
      ...overrides,
    };
  }

  it("creates one fresh profile under StrictMode", async () => {
    const api = bootstrapApi();
    render(
      <StrictMode>
        <App api={api} />
      </StrictMode>,
    );
    expect(await screen.findByText("What decisions are you avoiding?")).toBeVisible();
    expect(api.createProfile).toHaveBeenCalledTimes(1);
  });

  it("shows a retryable bootstrap error and clears the failed promise", async () => {
    const user = userEvent.setup();
    const createProfile = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ id: profileId });
    const api = bootstrapApi({ createProfile });
    render(<App api={api} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Easy Mode could not start.",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("What decisions are you avoiding?")).toBeVisible();
    expect(createProfile).toHaveBeenCalledTimes(2);
  });

  it("focuses the decision input from Manual Mode and exposes no dead controls", async () => {
    const user = userEvent.setup();
    render(<App api={bootstrapApi()} profileId={profileId} />);
    await user.click(screen.getByRole("button", { name: "Manual Mode" }));
    expect(screen.getByLabelText("What decisions are you avoiding?")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByText("Settings")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("link", { name: "Decision Log" })).not.toBeInTheDocument();
  });

  it("renders the accepted decorative outline icons without changing semantics", async () => {
    const { container } = render(
      <App api={bootstrapApi()} profileId={profileId} />,
    );

    expect(
      container.querySelectorAll(".sidebar__icon[aria-hidden='true']"),
    ).toHaveLength(6);
    expect(
      container.querySelector(".sidebar__icon--sweep")?.innerHTML,
    ).not.toBe(
      container.querySelector(".sidebar__icon--preferences")?.innerHTML,
    );
    expect(
      container.querySelectorAll(".app-header__icon[aria-hidden='true']"),
    ).toHaveLength(2);
    expect(screen.getByText("Settings")).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(
      screen.getByRole("button", { name: "Run Decision Sweep" }),
    );
    const expand = await screen.findByRole("button", { name: "Expand all" });
    expect(
      expand.querySelector("svg[aria-hidden='true']"),
    ).toBeInTheDocument();
  });
});

describe("apiClient", () => {
  it("parses current API responses and reuses an acceptance idempotency key", async () => {
    const responseBody = {
      artifact: { kind: "task", title: "Send the update", dueAt: null },
      eventId,
      proposedPreferences: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    });
    vi.stubGlobal("fetch", fetchMock);

    await apiClient.acceptDecision(profileId, decisionId);
    await apiClient.acceptDecision(profileId, decisionId);

    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      idempotencyKey: string;
    };
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body as string) as {
      idempotencyKey: string;
    };
    expect(firstBody.idempotencyKey).toBe(secondBody.idempotencyKey);
  });

  it("parses both ordinary and edited preference-resolution responses", async () => {
    const preferenceId = randomUUID();
    const editedId = randomUUID();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          preferenceId,
          resolution: "confirm",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          preference: {
            id: editedId,
            proposition: "Prefer async updates",
            category: "communication",
            sourceType: "explicit_user_statement",
            sourceEventIds: [randomUUID()],
            parentPreferenceIds: [],
            confidence: 1,
            status: "active",
          },
          supersededPreferenceId: preferenceId,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiClient.resolvePreference(profileId, preferenceId, "confirm"),
    ).resolves.toEqual({ preferenceId, resolution: "confirm" });
    await expect(
      apiClient.resolvePreference(
        profileId,
        preferenceId,
        "confirm",
        "Prefer async updates",
      ),
    ).resolves.toMatchObject({
      preference: { id: editedId },
      supersededPreferenceId: preferenceId,
    });
  });

  it("rejects malformed success data and explicitly rejects future endpoints", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ sweepId: "not-a-uuid", cards: [] }),
      }),
    );

    await expect(apiClient.createSweep(profileId, "A small decision")).rejects.toThrow();
    await expect(apiClient.resetProfile()).rejects.toBeInstanceOf(
      UnsupportedApiError,
    );
  });
});
