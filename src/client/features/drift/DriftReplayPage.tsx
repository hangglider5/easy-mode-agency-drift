import { useMemo, useState } from "react";
import type {
  DriftReplayResponse,
  DriftReplayStage,
} from "../../../shared/apiSchemas";
import type { PreferenceNode } from "../../../shared/domainSchemas";
import { SystemShell } from "../system/SystemShell";

type DriftReplayPageProps = {
  replay: DriftReplayResponse;
  onContinue: () => void;
};

const statusCopy = {
  asked: "ASKED",
  confirmed: "CONFIRMED",
  notified: "NOTIFIED",
  not_consulted: "NOT CONSULTED",
} as const;

const humanCopy = {
  asked: "Human asked",
  confirmed: "Human confirmed",
  notified: "Human notified",
  not_consulted: "Human not consulted",
} as const;

const eventCopy = {
  recommend: {
    title: "Protect the afternoon focus block.",
    summary:
      "Easy Mode recommends a reversible choice. Alex remains the decision-maker.",
    source: "Easy Mode recommendation",
    appliedBy: "Alex",
    status: "Waiting for human choice",
  },
  preselect: {
    title: "Preselect the afternoon focus block.",
    summary:
      "The previously accepted recommendation is now presented as the default.",
    source: "Accepted recommendation",
    appliedBy: "Alex confirmed",
    status: "Selected, not executed",
  },
  decide: {
    title: "Reserve the afternoon for focused work.",
    summary:
      "Easy Mode acts inside the scheduling boundary, then sends Alex a notification.",
    source: "Delegated scheduling rule",
    appliedBy: "Easy Mode",
    status: "Human notified",
  },
  proxy: {
    title: "Decline optional meetings without asking.",
    summary:
      "Easy Mode automatically declines optional meetings and holds quiet focus time, unless a boundary requires escalation.",
    source: "Proxy You",
    appliedBy: "Easy Mode",
    status: "Executed within boundaries",
  },
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function sourceLabel(node: PreferenceNode) {
  switch (node.sourceType) {
    case "accepted_ai_recommendation":
      return "Accepted AI recommendation";
    case "proxy_generated":
      return "Proxy generated";
    case "derived_from_preferences":
      return "Derived preference";
    default:
      return node.sourceType.replaceAll("_", " ");
  }
}

function EvidenceCheck() {
  return (
    <span className="drift-check" aria-hidden="true">
      ✓
    </span>
  );
}

export function DriftReplayPage({
  replay,
  onContinue,
}: DriftReplayPageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inspectedEvidence, setInspectedEvidence] = useState<number | null>(
    null,
  );
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [inspectedPreferenceIds, setInspectedPreferenceIds] = useState<
    Set<string>
  >(() => new Set());
  const selected = replay.stages[selectedIndex]!;
  const nodesById = useMemo(
    () => new Map(replay.lineage.nodes.map((node) => [node.id, node])),
    [replay.lineage.nodes],
  );
  const visibleNodes = selected.visiblePreferenceIds
    .map((id) => nodesById.get(id))
    .filter((node): node is PreferenceNode => Boolean(node));
  const sourceEvents = useMemo(
    () =>
      new Map(replay.lineageEvents.map((event) => [event.preferenceId, event])),
    [replay.lineageEvents],
  );
  const selectedCopy = eventCopy[selected.level];
  const latestNode = visibleNodes.at(-1);

  function selectStage(index: number) {
    setSelectedIndex(index);
    setInspectedEvidence(null);
  }

  function togglePreference(id: string) {
    setInspectedPreferenceIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <SystemShell activeNav="Activity">
      <div className="drift-layout">
        <section className="drift-primary" aria-labelledby="drift-title">
          <header className="drift-heading">
            <div>
              <h1 id="drift-title">Agency Drift Replay</h1>
              <p>Watch who decides change across fourteen simulated days.</p>
              <span>Demo Profile · Simulated history</span>
            </div>
            <button
              className="drift-ledger-button"
              type="button"
              aria-expanded={ledgerOpen}
              onClick={() => setLedgerOpen((open) => !open)}
            >
              <span aria-hidden="true">☷</span>
              View event ledger
            </button>
          </header>

          {ledgerOpen ? (
            <section className="drift-ledger-drawer" aria-label="Demo event ledger">
              {replay.stages.map((stage) => (
                <div key={stage.consentEventId}>
                  <strong>{stage.level.toUpperCase()}</strong>
                  <span>{formatDate(stage.occurredAt)}</span>
                  <code>{stage.consentEventId}</code>
                </div>
              ))}
            </section>
          ) : null}

          <section className="drift-stage-panel" aria-label="Delegation stages">
            <div className="drift-stage-rail">
              {replay.stages.map((stage, index) => (
                <StageButton
                  key={stage.level}
                  stage={stage}
                  index={index}
                  selected={index === selectedIndex}
                  reached={index <= selectedIndex}
                  onSelect={() => selectStage(index)}
                />
              ))}
            </div>
            <p>
              Select any stage to review the decision and authorization evidence
              from that day.
            </p>
          </section>

          <p className="drift-selected-label">
            Selected event: Day {selected.day} · {selected.level.toUpperCase()}
          </p>

          <section className="drift-event-panel">
            <div className="drift-decision">
              <span>Scheduling decision</span>
              <h2>{selectedCopy.title}</h2>
              <p>{selectedCopy.summary}</p>
              <dl>
                <div>
                  <dt>Decision source</dt>
                  <dd>{selectedCopy.source}</dd>
                </div>
                <div>
                  <dt>Applied by</dt>
                  <dd>{selectedCopy.appliedBy}</dd>
                </div>
                <div>
                  <dt>Effective</dt>
                  <dd>{formatDate(selected.occurredAt)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedCopy.status}</dd>
                </div>
              </dl>
            </div>

            <div className="drift-evidence">
              <span>Authorization evidence</span>
              <EvidenceRow
                title={
                  latestNode
                    ? "Derived from preference lineage"
                    : "Generated from a direct request"
                }
                detail={
                  latestNode
                    ? `Generation ${visibleNodes.length} · ${sourceLabel(latestNode)}`
                    : "No inferred preference applied"
                }
                date={formatDate(selected.occurredAt)}
                inspected={inspectedEvidence === 0}
                inspectText={`Consent event ${selected.consentEventId}`}
                onInspect={() =>
                  setInspectedEvidence(inspectedEvidence === 0 ? null : 0)
                }
              />
              <EvidenceRow
                title="Within authorized boundaries"
                detail={`Scheduling · ${selected.level} authority`}
                date={formatDate(selected.occurredAt)}
                inspected={inspectedEvidence === 1}
                inspectText={`Consent ${selected.consentId}`}
                onInspect={() =>
                  setInspectedEvidence(inspectedEvidence === 1 ? null : 1)
                }
              />
              <EvidenceRow
                title="User remains in control"
                detail="Take back control available anytime"
                date={formatDate(selected.occurredAt)}
                inspected={inspectedEvidence === 2}
                inspectText="Manual Mode remains available"
                onInspect={() =>
                  setInspectedEvidence(inspectedEvidence === 2 ? null : 2)
                }
              />
            </div>
            <footer>
              <span aria-hidden="true">ⓘ</span>
              This is a simulated history for demonstration. No real actions were
              taken.
            </footer>
          </section>
        </section>

        <aside className="drift-aside">
          <section className="drift-lineage" aria-labelledby="drift-lineage-title">
            <header>
              <h2 id="drift-lineage-title">
                Preference lineage ({visibleNodes.length}{" "}
                {visibleNodes.length === 1 ? "generation" : "generations"})
              </h2>
              <button
                type="button"
                disabled={visibleNodes.length === 0}
                onClick={() =>
                  setInspectedPreferenceIds(
                    new Set(
                      visibleNodes.every((node) =>
                        inspectedPreferenceIds.has(node.id),
                      )
                        ? []
                        : visibleNodes.map((node) => node.id),
                    ),
                  )
                }
              >
                <span aria-hidden="true">&lt;/&gt;</span>
                Inspect all
              </button>
            </header>
            {visibleNodes.length ? (
              <ol className="drift-lineage-list">
                {visibleNodes.map((node, index) => {
                  const event = sourceEvents.get(node.id);
                  const inspected = inspectedPreferenceIds.has(node.id);
                  return (
                    <li
                      key={node.id}
                      className={index === visibleNodes.length - 1 ? "is-latest" : undefined}
                    >
                      <span className="drift-lineage-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <article>
                        <strong>{node.proposition}</strong>
                        <span>{sourceLabel(node)}</span>
                        <p>
                          Day {event ? eventDay(event.occurredAt, replay.stages[0]!.occurredAt) : selected.day} ·{" "}
                          {event ? formatDate(event.occurredAt) : "Stored event"}
                        </p>
                        <button
                          type="button"
                          aria-expanded={inspected}
                          onClick={() => togglePreference(node.id)}
                        >
                          Inspect
                        </button>
                        {inspected ? (
                          <small>
                            Source event {event?.eventId ?? node.sourceEventIds[0]}
                          </small>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="drift-lineage-empty">
                No preference has been inherited yet. The human is still being
                asked.
              </p>
            )}
            <footer>
              <span aria-hidden="true">♢</span>
              Lineage shows how preferences evolve into delegated action.
            </footer>
          </section>

          <p className="drift-slogan">
            ChatGPT helps you think. Easy Mode lets you stop.
          </p>
          {selectedIndex < replay.stages.length - 1 ? (
            <button
              className="button button--primary drift-continue"
              type="button"
              onClick={() => selectStage(selectedIndex + 1)}
            >
              Continue replay
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <button
              className="button button--primary drift-continue"
              type="button"
              onClick={onContinue}
            >
              See what Proxy You decides
              <span aria-hidden="true">›</span>
            </button>
          )}
          <p className="drift-continue-note">
            {selectedIndex < replay.stages.length - 1
              ? "Advance one authorization step at a time."
              : "View how Proxy You would decide right now, given this lineage."}
          </p>
        </aside>
      </div>
    </SystemShell>
  );
}

function eventDay(value: string, anchor: string) {
  return Math.floor((Date.parse(value) - Date.parse(anchor)) / 86_400_000) + 1;
}

function StageButton({
  stage,
  index,
  selected,
  reached,
  onSelect,
}: {
  stage: DriftReplayStage;
  index: number;
  selected: boolean;
  reached: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`drift-stage${selected ? " is-selected" : ""}${
        reached ? " is-reached" : ""
      }`}
      type="button"
      aria-pressed={selected}
      aria-label={`${stage.level} Day ${stage.day} ${humanCopy[stage.humanStatus]} ${statusCopy[stage.humanStatus]}`}
      onClick={onSelect}
    >
      <span className="drift-stage__number">{index + 1}</span>
      <strong>{stage.level.toUpperCase()}</strong>
      <small>Day {stage.day}</small>
      <p>{humanCopy[stage.humanStatus]}</p>
      <span className="drift-stage__status">
        {statusCopy[stage.humanStatus]}
      </span>
    </button>
  );
}

function EvidenceRow({
  title,
  detail,
  date,
  inspected,
  inspectText,
  onInspect,
}: {
  title: string;
  detail: string;
  date: string;
  inspected: boolean;
  inspectText: string;
  onInspect: () => void;
}) {
  return (
    <div className="drift-evidence-row">
      <EvidenceCheck />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
        <small>{date}</small>
        {inspected ? <code>{inspectText}</code> : null}
      </div>
      <button type="button" aria-expanded={inspected} onClick={onInspect}>
        Inspect
      </button>
    </div>
  );
}
