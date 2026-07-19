import { useState } from "react";
import type { ActionArtifact } from "../../../shared/domainSchemas";
import { Button } from "../../components/Button";

type ActionArtifactViewProps = {
  artifact: ActionArtifact;
  eventId: string;
  disabled?: boolean;
};

export function ActionArtifactView({
  artifact,
  eventId,
  disabled = false,
}: ActionArtifactViewProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [draft, setDraft] = useState(
    artifact.kind === "message_draft" ? artifact.text : "",
  );

  async function copyText(text: string) {
    if (disabled) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  async function copyMessage() {
    if (artifact.kind !== "message_draft") return;
    await copyText(draft);
  }

  async function copyCalendar() {
    if (artifact.kind !== "calendar_event") return;
    await copyText(
      [
        artifact.title,
        `${artifact.startsAt} – ${artifact.endsAt}`,
        artifact.description,
      ].join("\n"),
    );
  }

  return (
    <section className="artifact" aria-labelledby={`artifact-${eventId}`}>
      <div className="artifact__review">
        <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20">
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m6.8 10 2 2 4.4-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h2 id={`artifact-${eventId}`}>Review before use</h2>
          <p>Check this action before you send, save, or follow it.</p>
        </div>
      </div>

      {artifact.kind === "message_draft" ? (
        <div className="artifact__body">
          <label className="sr-only" htmlFor={`message-${eventId}`}>Message draft</label>
          <textarea
            id={`message-${eventId}`}
            className="artifact__message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button variant="secondary" disabled={disabled} onClick={copyMessage}>
            Copy message
          </Button>
          <p className={copyError ? "artifact__copy-status" : "sr-only"} role="status" aria-live="polite">
            {copyError ? "Copy unavailable. Select and copy the draft." : copied ? "Message copied." : ""}
          </p>
        </div>
      ) : null}

      {artifact.kind === "task" ? (
        <div className="artifact__body artifact__task">
          <p>{artifact.title}</p>
          {artifact.dueAt ? <time dateTime={artifact.dueAt}>{artifact.dueAt}</time> : null}
        </div>
      ) : null}

      {artifact.kind === "calendar_event" ? (
        <div className="artifact__body artifact__calendar">
          <h3>{artifact.title}</h3>
          <p>{artifact.description}</p>
          <p>
            <time dateTime={artifact.startsAt}>{artifact.startsAt}</time>
            {" – "}
            <time dateTime={artifact.endsAt}>{artifact.endsAt}</time>
          </p>
          {disabled ? (
            <span
              className="button button--secondary is-disabled"
              aria-disabled="true"
            >
              Download calendar file
            </span>
          ) : (
            <a
              className="button button--secondary"
              href={`/api/artifacts/${encodeURIComponent(eventId)}/calendar.ics`}
              download={`easy-mode-${eventId}.ics`}
            >
              Download calendar file
            </a>
          )}
          <Button variant="secondary" disabled={disabled} onClick={copyCalendar}>
            Copy calendar details
          </Button>
          <p className={copyError ? "artifact__copy-status" : "sr-only"} role="status" aria-live="polite">
            {copyError ? "Copy unavailable. Select and copy the calendar details." : copied ? "Calendar details copied." : ""}
          </p>
        </div>
      ) : null}
    </section>
  );
}
