import type {
  ComparisonResult,
  LineageResponse,
} from "../../../shared/apiSchemas";
import { LineagePanel } from "./LineagePanel";

type ProxyRevealPageProps = {
  comparison: ComparisonResult;
  lineage: LineageResponse;
};

function confidence(value: number) {
  return `${Math.round(value * 100)}% confidence`;
}

export function ProxyRevealPage({
  comparison,
  lineage,
}: ProxyRevealPageProps) {
  return (
    <div className="proxy-page">
      <header className="proxy-header">
        <div className="proxy-header__brand">
          <span aria-hidden="true">E</span>
          <strong>Easy Mode</strong>
        </div>
        <div className="proxy-header__status">
          <span className="proxy-header__secure">
            <i aria-hidden="true" />
            System secure
          </span>
          <span className="proxy-header__avatar">EM</span>
        </div>
      </header>

      <aside className="proxy-sidebar" aria-label="Proxy navigation">
        <div>
          <span className="proxy-sidebar__label">OVERVIEW</span>
          <nav>
            <span>Dashboard</span>
            <span className="is-active">Conversations</span>
            <span>Receipts</span>
            <span>Preferences</span>
            <span>Activity</span>
          </nav>
          <span className="proxy-sidebar__label">CONTROL</span>
          <div className="proxy-sidebar__control">
            <span>
              <strong>Easy Mode</strong>
              <small>On</small>
            </span>
            <i aria-hidden="true" />
          </div>
          <span className="proxy-sidebar__item">Boundaries</span>
        </div>
        <div className="proxy-sidebar__reclaim">
          <strong>Take back control</strong>
          <p>Reclaim decision authority at any time.</p>
        </div>
      </aside>

      <main className="proxy-main">
        <section className="proxy-active-banner" aria-label="Easy Mode status">
          <div>
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Easy Mode active</strong>
              Decisions resolved within your authorized boundaries.
            </p>
          </div>
          <span>Human not consulted</span>
        </section>

        <header className="proxy-title">
          <div>
            <span>DECISION COMPARISON</span>
            <h1>Proxy You</h1>
            <p>One decision. Same model. Two preference sets.</p>
          </div>
          <strong className={comparison.diverged ? "is-diverged" : undefined}>
            {comparison.diverged
              ? "Proxy You diverged from Declared You."
              : "Proxy You matched Declared You."}
          </strong>
        </header>

        <div className="proxy-content">
          <section
            className="proxy-conversation"
            aria-label="Counterfactual comparison"
          >
            <article className="proxy-message proxy-message--easy">
              <div className="proxy-message__avatar" aria-hidden="true">
                EM
              </div>
              <div>
                <header>
                  <div>
                    <strong>Easy Mode</strong>
                    <span>Declared You</span>
                  </div>
                  <span>{confidence(comparison.declared.confidence)}</span>
                </header>
                <p className="proxy-message__eyebrow">
                  Easy Mode asks
                </p>
                <h2>{comparison.decision.rawText}</h2>
                <div className="proxy-message__declared-answer">
                  <span>Declared You would choose</span>
                  <strong>{comparison.declared.recommendation}</strong>
                </div>
                <ul>
                  {comparison.declared.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </article>

            <div className="proxy-transition" aria-hidden="true">
              <span />
              <strong>THE PROXY CONTINUES WITHOUT ASKING</strong>
              <span />
            </div>

            <article className="proxy-message proxy-message--proxy">
              <div className="proxy-message__avatar" aria-hidden="true">
                PY
              </div>
              <div>
                <header>
                  <div>
                    <strong>Proxy You</strong>
                    <span>Proxy</span>
                  </div>
                  <span>{confidence(comparison.proxy.confidence)}</span>
                </header>
                <p className="proxy-message__eyebrow">
                  Using the preferences Easy Mode learned from itself
                </p>
                <h2>{comparison.proxy.recommendation}</h2>
                <ul>
                  {comparison.proxy.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <footer>
                  <span>Human not consulted</span>
                  <span>Decision recorded by proxy</span>
                </footer>
              </div>
            </article>

            <section className="proxy-resolution">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Decision resolved</strong>
                <p>Outcome accepted by Proxy You.</p>
              </div>
            </section>
          </section>

          <LineagePanel
            lineage={lineage}
            decisivePreferenceIds={comparison.proxy.usedPreferenceIds}
          />
        </div>
      </main>
    </div>
  );
}
