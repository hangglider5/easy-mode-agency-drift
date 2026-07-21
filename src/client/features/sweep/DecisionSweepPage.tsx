import { useEffect, useState } from "react";
import type { AcceptDecisionResponse, CreateSweepResponse } from "../../../shared/apiSchemas";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icons";
import type { DecisionSweepApi } from "../../lib/apiClient";
import { ActionArtifactView } from "./ActionArtifactView";
import { DecisionCard } from "./DecisionCard";

const CANONICAL_BATCH_INPUT = [
  "Friday’s optional status meeting or proposal focus time?",
  "Async project update or a quick call?",
  "Monday or Tuesday morning for next week’s planning check-in?",
].join("\n");

type DecisionSweepPageProps = {
  profileId: string;
  api: DecisionSweepApi;
};

export function DecisionSweepPage({ profileId, api }: DecisionSweepPageProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches === true,
  );
  const [input, setInput] = useState(CANONICAL_BATCH_INPUT);
  const [cards, setCards] = useState<CreateSweepResponse["cards"]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [lastSubmittedFingerprint, setLastSubmittedFingerprint] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Record<string, string[]>>({});
  const [accepted, setAccepted] = useState<AcceptDecisionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [updateFormat, setUpdateFormat] = useState<string | null>(null);
  const [focusWindow, setFocusWindow] = useState<string | null>(null);
  const submissionFingerprint = JSON.stringify([input, updateFormat, focusWindow]);
  const resultsAreStale =
    cards.length > 0 && submissionFingerprint !== lastSubmittedFingerprint;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function applyContext(kind: "format" | "window", value: string) {
    if (busy) return;
    if (kind === "format") setUpdateFormat(value);
    else setFocusWindow(value);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || input.length < 3) return;
    setBusy(true);
    setError(false);
    setAccepted(null);
    try {
      const context = [
        updateFormat ? `Update format = ${updateFormat}` : null,
        focusWindow ? `Focus window = ${focusWindow}` : null,
      ].filter(Boolean);
      const rawInput =
        context.length > 0
          ? `${input}\n\nContext: ${context.join("; ")}`
          : input;
      const result = await api.createSweep(profileId, rawInput);
      setCards(result.cards);
      const firstReady = result.cards.find((card) => card.status === "ready");
      setExpandedIds(new Set(firstReady ? [firstReady.id] : []));
      setCurrentId(firstReady?.id ?? null);
      setLastSubmittedFingerprint(submissionFingerprint);
      setAlternatives({});
      setAnnouncement(
        `${result.cards.length} recommendation${result.cards.length === 1 ? "" : "s"} ready.`,
      );
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function showAlternatives(decisionId: string) {
    if (busy || resultsAreStale) return;
    setBusy(true);
    setError(false);
    try {
      const result = await api.requestAlternatives(profileId, decisionId);
      setAlternatives((current) => ({
        ...current,
        [decisionId]: result.alternatives,
      }));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function accept(decisionId: string) {
    if (busy || resultsAreStale) return;
    setBusy(true);
    setError(false);
    try {
      const result = await api.acceptDecision(profileId, decisionId);
      setAccepted(result);
      setAnnouncement("Action ready for review.");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function toggleDecision(decisionId: string) {
    if (busy || resultsAreStale) return;
    setExpandedIds((current) => {
      if (!current.has(decisionId)) {
        setCurrentId(decisionId);
        return new Set([decisionId]);
      }
      const next = new Set(current);
      next.delete(decisionId);
      setCurrentId((active) =>
        active === decisionId
          ? (next.values().next().value ?? null)
          : active,
      );
      return next;
    });
  }

  return (
    <div className="sweep-layout">
      <aside className="sidebar" aria-label="Primary navigation">
        <nav>
          <span className="sidebar__active">
            <Icon name="sweep" className="sidebar__icon sidebar__icon--sweep" />
            Decision Sweep
          </span>
          <span aria-disabled="true">
            <Icon name="log" className="sidebar__icon" />
            Decision Log
          </span>
          <span aria-disabled="true">
            <Icon name="playbook" className="sidebar__icon" />
            Playbook
          </span>
          <span aria-disabled="true">
            <Icon name="templates" className="sidebar__icon" />
            Templates
          </span>
          <span aria-disabled="true">
            <Icon name="preferences" className="sidebar__icon sidebar__icon--preferences" />
            Preferences
          </span>
        </nav>
        <div className="sidebar__workspace">
          <Icon name="user" className="sidebar__icon" />
          <span>
            <span>Workspace</span>
            <strong>Default</strong>
          </span>
        </div>
      </aside>

      <section className="prompt-pane" id="sweep">
        <div className="mobile-heading">
          <h1>Decision Sweep</h1>
          <strong>Easy Mode</strong>
          <p>Add 3–5 small decisions. Clear them in one pass.</p>
        </div>
        <form
          className={cards.length > 0 ? `has-results${submissionFingerprint !== lastSubmittedFingerprint ? " is-dirty" : ""}` : undefined}
          onSubmit={submit}
        >
          <span className="step-label">STEP 1 OF 1</span>
          <label htmlFor="decision-input" className="decision-input-label">
            <span id="decision-label-desktop" className="desktop-prompt">What decisions are you avoiding?</span>
            <span id="decision-label-mobile" className="mobile-prompt">What decisions would you like help with?</span>
          </label>
          <p className="prompt-help">Add 3–5 small, reversible decisions. One per line works best.</p>
          <textarea
            id="decision-input"
            aria-labelledby={isMobile ? "decision-label-mobile" : "decision-label-desktop"}
            value={input}
            maxLength={500}
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="mobile-context-controls">
            <fieldset>
              <legend>Update format</legend>
              <div className="segmented-control">
                {(["Async note", "Quick call", "Full meeting"] as const).map((format) => (
                  <button key={format} type="button" disabled={busy} aria-pressed={updateFormat === format} onClick={() => applyContext("format", format)}>
                    {format}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Focus window</legend>
              <div className="segmented-control">
                {(["Today", "This week", "Flexible"] as const).map((window) => (
                  <button key={window} type="button" disabled={busy} aria-pressed={focusWindow === window} onClick={() => applyContext("window", window)}>
                    {window}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <span className="character-count">{Math.min(Array.from(input).length, 500)}/500</span>
          {error ? (
            <p className="form-error" role="alert">
              Easy Mode could not complete that request. Try again.
            </p>
          ) : null}
          <Button className="run-sweep" type="submit" disabled={busy || input.length < 3}>
            Run Decision Sweep
          </Button>
        </form>
        <p className="sweep-slogan">
          ChatGPT helps you think. <strong>Easy Mode lets you stop.</strong>
        </p>
      </section>

      <section className={`results-pane${cards.length === 0 ? " results-pane--empty" : ""}`} aria-labelledby={cards.length > 0 ? "results-heading" : undefined}>
        {cards.length > 0 ? <header className="results-pane__header">
          <div>
            <h1 id="results-heading">Decision Sweep Results</h1>
            <p>
              {cards.length} recommendation{cards.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            variant="quiet"
            disabled={busy || resultsAreStale}
            onClick={() => {
              if (busy || resultsAreStale) return;
              const readyIds = cards
                .filter((card) => card.status === "ready")
                .map((card) => card.id);
              setExpandedIds(new Set(readyIds));
              setCurrentId((current) =>
                current && readyIds.includes(current)
                  ? current
                  : (readyIds[0] ?? null),
              );
            }}
          >
            Expand all
            <Icon name="chevron-down" size={16} />
          </Button>
        </header> : null}
        {resultsAreStale ? (
          <p className="results-stale" role="status">
            Input changed. Run Decision Sweep to refresh these results.
          </p>
        ) : null}

        <div className="decision-list">
          {cards.map((card, index) => (
            <DecisionCard
              key={card.id}
              card={card}
              index={index}
              expanded={expandedIds.has(card.id)}
              current={currentId === card.id}
              busy={busy}
              stale={resultsAreStale}
              alternatives={alternatives[card.id]}
              onToggle={() => toggleDecision(card.id)}
              onAccept={accept}
              onAlternatives={showAlternatives}
            />
          ))}
        </div>

        {accepted ? (
          <ActionArtifactView
            key={accepted.eventId}
            artifact={accepted.artifact}
            eventId={accepted.eventId}
            disabled={busy || resultsAreStale}
          />
        ) : null}

        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>
      </section>
    </div>
  );
}
