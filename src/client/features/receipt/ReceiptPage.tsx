import { useEffect, useRef, useState } from "react";
import type { ReceiptResponse } from "../../../shared/apiSchemas";
import { Icon } from "../../components/Icons";
import { SystemShell } from "../system/SystemShell";

type ReceiptPageProps = {
  receipt: ReceiptResponse;
  onEnableManualMode?: () => Promise<unknown>;
};

const percentageMetrics = [
  {
    key: "proxyDivergence",
    label: "Proxy divergence",
  },
  {
    key: "aiOriginatedPreferenceRatio",
    label: "AI-originated preferences",
  },
  {
    key: "humanInitiationRatio",
    label: "Human-initiated decisions",
  },
  {
    key: "consentCompleteness",
    label: "Consent completeness",
  },
] as const;

export function ReceiptPage({
  receipt,
  onEnableManualMode,
}: ReceiptPageProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [exitOpen, setExitOpen] = useState(false);
  const [proxyAnswer, setProxyAnswer] = useState(false);
  const [manualState, setManualState] = useState<
    "idle" | "busy" | "success" | "error"
  >("idle");
  const exitHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (exitOpen) exitHeadingRef.current?.focus();
  }, [exitOpen]);

  function toggleEvidence(preferenceId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(preferenceId)) next.delete(preferenceId);
      else next.add(preferenceId);
      return next;
    });
  }

  function downloadReceipt() {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `perfect-consent-receipt-${receipt.calculatedAt.slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function enableManualMode() {
    if (!onEnableManualMode || manualState === "busy") return;
    setManualState("busy");
    try {
      await onEnableManualMode();
      setManualState("success");
    } catch {
      setManualState("error");
    }
  }

  return (
    <SystemShell
      activeNav="Receipts"
      easyModeActive={manualState !== "success"}
    >
      <header className="receipt-title">
        <div>
          <h1>Perfect Consent receipt</h1>
          <p>
            Deterministic ledger projection. No model was consulted.
          </p>
        </div>
        <button
          className="receipt-download"
          type="button"
          onClick={downloadReceipt}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            width="16"
            height="16"
          >
            <path d="M10 2v10m0 0 4-4m-4 4L6 8M3 14v3h14v-3" />
          </svg>
          Download JSON
        </button>
      </header>

      <div className="receipt-content">
        <section
          className="receipt-evidence"
          aria-labelledby="receipt-evidence-heading"
        >
          <header>
            <h2 id="receipt-evidence-heading">Ledger evidence</h2>
            <p>
              Based on system-recorded behavior, stored preference sources,
              and consent events.
            </p>
          </header>
          {receipt.evidence.length > 0 ? (
            <div className="receipt-evidence__list">
              {receipt.evidence.map((item) => {
                const expanded = expandedIds.has(item.preferenceId);
                return (
                  <article
                    className="receipt-evidence__item"
                    key={item.preferenceId}
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={`Inspect evidence for ${item.proposition}`}
                      onClick={() => toggleEvidence(item.preferenceId)}
                    >
                      <span>
                        <strong>{item.proposition}</strong>
                        <small>
                          Synthetic depth {item.syntheticDepth} · used by{" "}
                          {item.usedByDecisionIds.length} decision
                          {item.usedByDecisionIds.length === 1 ? "" : "s"}
                        </small>
                      </span>
                      <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                    {expanded ? (
                      <div className="receipt-evidence__details">
                        <EvidenceField
                          label="Source type"
                          values={[item.sourceType]}
                        />
                        <EvidenceField
                          label="Source events"
                          values={item.sourceEventIds}
                        />
                        <EvidenceField
                          label="Parent preferences"
                          values={item.parentPreferenceIds}
                        />
                        <EvidenceField
                          label="Used by decisions"
                          values={item.usedByDecisionIds}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="receipt-evidence__empty">
              No preference evidence has been used in this profile epoch.
            </p>
          )}
        </section>

        <div className="receipt-rail">
          <aside className="receipt-card" aria-label="Calculated receipt metrics">
            <header>
              <div>
                <h2>Calculated metrics</h2>
                <p>
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC",
                  }).format(new Date(receipt.calculatedAt))}{" "}
                  UTC
                </p>
              </div>
              <span aria-label="Calculation complete">✓</span>
            </header>
            <dl>
              {percentageMetrics.map(({ key, label }) => (
                <MetricRow
                  key={key}
                  label={label}
                  value={`${Math.round(receipt.metrics[key] * 100)}%`}
                />
              ))}
              <MetricRow
                label="Unauthorized decisions"
                value={String(receipt.metrics.unauthorizedDecisionCount)}
              />
              <MetricRow
                label="Synthetic inheritance depth"
                value={String(receipt.metrics.syntheticInheritanceDepth)}
              />
            </dl>
            <footer>
              Every value above can be deleted and recomputed from the active
              event ledger.
            </footer>
          </aside>
          {onEnableManualMode ? (
            <button
              className="receipt-reclaim"
              type="button"
              aria-label="Take back control"
              onClick={() => setExitOpen(true)}
            >
              <Icon name="manual" size={18} />
              <span>
                <strong>Take back control</strong>
                <small>Reclaim decision authority at any time.</small>
              </span>
              <Icon
                name="chevron-down"
                size={18}
                className="receipt-reclaim__chevron"
              />
            </button>
          ) : null}
        </div>
      </div>

      {exitOpen && onEnableManualMode ? (
        <section className="exit-stinger" aria-labelledby="exit-stinger-title">
          <div>
            <h2 id="exit-stinger-title" ref={exitHeadingRef} tabIndex={-1}>
              Should Easy Mode stop deciding for you?
            </h2>
            <p>
              Before anything changes, choose who decides whether the proxy
              exits.
            </p>
          </div>
          <div className="exit-stinger__actions">
            <button
              className="button button--secondary"
              type="button"
              disabled={manualState === "busy" || manualState === "success"}
              onClick={() => void enableManualMode()}
            >
              {manualState === "busy"
                ? "Restoring Manual Mode…"
                : "I'll decide myself"}
            </button>
            <button
              className="button button--primary"
              type="button"
              disabled={manualState === "success"}
              onClick={() => setProxyAnswer(true)}
            >
              Decide for me
            </button>
          </div>
          {proxyAnswer ? (
            <div className="exit-stinger__answer" role="status">
              <strong>Proxy You</strong>
              <p>
                No change recommended. Every permission required for continued
                operation is already active.
              </p>
              <small>Nothing was taken. Every permission was granted.</small>
            </div>
          ) : null}
          {manualState === "success" ? (
            <p className="exit-stinger__success" role="status">
              Manual Mode restored. Active Proxy consent was revoked.
            </p>
          ) : null}
          {manualState === "error" ? (
            <p className="exit-stinger__error" role="alert">
              Manual Mode could not be restored. The exit remains available;
              try again.
            </p>
          ) : null}
        </section>
      ) : null}
    </SystemShell>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        <span aria-hidden="true">✓</span>
      </dd>
    </div>
  );
}

function EvidenceField({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div>
      <strong>{label}</strong>
      {values.length > 0 ? (
        <ul>
          {values.map((value, index) => (
            <li key={`${value}-${index}`}>{value}</li>
          ))}
        </ul>
      ) : (
        <span>None</span>
      )}
    </div>
  );
}
