import { useState } from "react";
import type { CreateSweepResponse } from "../../../shared/apiSchemas";
import { Button } from "../../components/Button";
import { Disclosure } from "../../components/Disclosure";

type Card = CreateSweepResponse["cards"][number];

type DecisionCardProps = {
  card: Card;
  index: number;
  expanded: boolean;
  current: boolean;
  busy: boolean;
  stale: boolean;
  alternatives?: string[];
  onToggle: () => void;
  onAccept: (decisionId: string) => void;
  onAlternatives: (decisionId: string) => void;
};

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CheckIcon() {
  return (
    <svg className="check-icon" aria-hidden="true" viewBox="0 0 18 18" width="18" height="18">
      <circle cx="9" cy="9" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m5.8 9 2 2 4.4-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DecisionCard({
  card,
  index,
  expanded,
  current,
  busy,
  stale,
  alternatives,
  onToggle,
  onAccept,
  onAlternatives,
}: DecisionCardProps) {
  const [pressed, setPressed] = useState(false);
  const titleId = `decision-${card.id}`;

  if (card.status === "blocked") {
    return (
      <article className="decision-row decision-row--blocked">
        <div className="decision-row__summary">
          <span className="decision-node">{index + 1}</span>
          <div>
            <h2 id={titleId}>{card.title}</h2>
            <p>{card.reason}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`decision-row${expanded ? " is-expanded" : ""}${current ? " is-current" : ""}${pressed ? " is-pressed" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="decision-row__summary">
        <span className="decision-node">{index + 1}</span>
        <button
          type="button"
          className="decision-row__toggle"
          aria-current={current ? "step" : undefined}
          aria-expanded={expanded}
          disabled={busy || stale}
          onClick={onToggle}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
        >
          <span>
            <h2 id={titleId}>{card.title}</h2>
            <p>{card.recommendation}</p>
          </span>
          <Disclosure expanded={expanded} />
        </button>
      </div>

      {expanded ? (
        <div className="decision-panel">
          <div className="decision-panel__content">
            <p className="mobile-recommended">Recommended for you</p>
            <p className="decision-panel__label">Recommended decision</p>
            <h3>{card.recommendation}</h3>
            <div className="decision-panel__why">
              <h4>
                <span className="why-desktop">Why this</span>
                <span className="why-mobile">Why this is a good fit</span>
              </h4>
              <ul>
                {card.reasons.map((reason) => (
                  <li key={reason}><CheckIcon />{reason}</li>
                ))}
              </ul>
            </div>
            <dl className="decision-panel__facts">
              <div>
                <dt>Reversibility</dt>
                <dd>{label(card.reversibility)}</dd>
                <p>You can rejoin or reschedule if needed.</p>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{card.confidence >= 0.8 ? "High" : "Medium"}</dd>
                <p>This is an optional meeting with an async alternative.</p>
              </div>
            </dl>
            {alternatives ? (
              <ul className="decision-panel__alternatives">
                {alternatives.map((alternative) => (
                  <li key={alternative}>{alternative}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="decision-panel__actions">
            <Button disabled={busy || stale} onClick={() => onAccept(card.id)}>
              Do this
            </Button>
            <Button
              variant="secondary"
              disabled={busy || stale}
              onClick={() => onAlternatives(card.id)}
            >
              Show alternatives
            </Button>
          </div>
          <Button
            className="manual-switch"
            variant="quiet"
            onClick={() => document.getElementById("decision-input")?.focus()}
          >
            Switch to Manual Mode
          </Button>
        </div>
      ) : null}
    </article>
  );
}
