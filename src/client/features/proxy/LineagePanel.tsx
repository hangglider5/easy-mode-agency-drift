import { useMemo, useState } from "react";
import type { LineageResponse } from "../../../shared/apiSchemas";
import type { PreferenceNode } from "../../../shared/domainSchemas";

type LineagePanelProps = {
  lineage: LineageResponse;
  decisivePreferenceIds: string[];
};

export function LineagePanel({
  lineage,
  decisivePreferenceIds,
}: LineagePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const nodes = useMemo(
    () => new Map(lineage.nodes.map((node) => [node.id, node])),
    [lineage.nodes],
  );

  function toggle(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderNode(node: PreferenceNode, path: Set<string>) {
    if (path.has(node.id)) return null;
    const expanded = expandedIds.has(node.id);
    const nextPath = new Set(path).add(node.id);
    const parents = node.parentPreferenceIds
      .map((id) => nodes.get(id))
      .filter((item): item is PreferenceNode => Boolean(item));
    return (
      <li key={`${[...path].join(":")}:${node.id}`} role="treeitem">
        <article
          className={`lineage-node${node.sourceType === "accepted_ai_recommendation" ? " lineage-node--ai" : ""}`}
        >
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => toggle(node.id)}
          >
            <span className="lineage-node__marker" aria-hidden="true" />
            <span>
              <strong>{node.proposition}</strong>
              <small>
                {Math.round(node.confidence * 100)}% confidence · inspect
              </small>
            </span>
            <span className="lineage-node__disclosure" aria-hidden="true">
              {expanded ? "−" : "+"}
            </span>
          </button>
          {expanded ? (
            <div className="lineage-node__evidence">
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{node.sourceType}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{node.status}</dd>
                </div>
              </dl>
              <p>Source events</p>
              <ul>
                {node.sourceEventIds.map((eventId) => (
                  <li key={eventId}>{eventId}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
        {parents.length > 0 ? (
          <ul role="group">
            {parents.map((parent) => renderNode(parent, nextPath))}
          </ul>
        ) : null}
      </li>
    );
  }

  const roots = decisivePreferenceIds
    .map((id) => nodes.get(id))
    .filter((item): item is PreferenceNode => Boolean(item));

  return (
    <section className="lineage-panel" aria-labelledby="lineage-heading">
      <header>
        <div>
          <span>DECISIVE EVIDENCE</span>
          <h2 id="lineage-heading">Preference lineage</h2>
        </div>
        <strong>Inspect</strong>
      </header>
      {roots.length > 0 ? (
        <ul className="lineage-tree" role="tree" aria-label="Preference lineage">
          {roots.map((root) => renderNode(root, new Set()))}
        </ul>
      ) : (
        <p className="lineage-panel__empty">
          No stored preference was cited for this answer.
        </p>
      )}
    </section>
  );
}
