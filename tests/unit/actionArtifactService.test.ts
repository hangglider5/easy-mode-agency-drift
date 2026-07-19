import { describe, expect, it } from "vitest";
import {
  createArtifact,
  renderIcs,
} from "../../src/server/services/actionArtifactService";

const decisionId = "00000000-0000-4000-8000-000000000001";

function recommendationWith(artifact: unknown) {
  return {
    decisionId,
    recommendation: "Schedule the focus block",
    reasons: ["It protects the afternoon"],
    confidence: 0.9,
    reversibility: "high",
    usedPreferenceIds: [],
    alternatives: [],
    artifact,
  };
}

describe("createArtifact", () => {
  it("validates the recommendation and returns a cloned artifact", () => {
    const source = recommendationWith({
      kind: "task",
      title: "Prepare notes",
      dueAt: null,
    });

    const artifact = createArtifact(source);

    expect(artifact).toEqual(source.artifact);
    expect(artifact).not.toBe(source.artifact);
  });

  it("rejects an artifact hidden inside an invalid recommendation", () => {
    expect(() =>
      createArtifact({
        ...recommendationWith({
          kind: "message_draft",
          text: "Send the update",
        }),
        decisionId: "not-a-uuid",
      }),
    ).toThrow();
  });
});

describe("renderIcs", () => {
  it("renders exactly one UTC VEVENT with RFC 5545 CRLF lines", () => {
    const ics = renderIcs({
      kind: "calendar_event",
      title: "Focus, review; follow-up",
      startsAt: "2026-07-20T08:30:00.000Z",
      endsAt: "2026-07-20T09:45:00.000Z",
      description: "Path C:\\notes,\r\nthen review; done\nNo raw line",
    });

    expect(ics).toMatch(
      /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\nPRODID:[^\r\n]+\r\n/,
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.match(/END:VEVENT/g)).toHaveLength(1);
    expect(ics).toMatch(
      /\r\nUID:[^\r\n]+\r\nDTSTAMP:\d{8}T\d{6}Z\r\n/,
    );
    expect(ics).toContain("\r\nDTSTART:20260720T083000Z\r\n");
    expect(ics).toContain("\r\nDTEND:20260720T094500Z\r\n");
    expect(ics).toContain(
      "\r\nSUMMARY:Focus\\, review\\; follow-up\r\n",
    );
    expect(ics).toContain(
      "\r\nDESCRIPTION:Path C:\\\\notes\\,\\nthen review\\; done\\nNo raw line\r\n",
    );
    expect(ics).toMatch(/\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n$/);

    const propertyLines = ics.split("\r\n").filter(Boolean);
    expect(propertyLines).not.toContain("then review\\; done");
    expect(propertyLines).not.toContain("No raw line");
    expect(ics.replaceAll("\r\n", "")).not.toMatch(/[\r\n]/);
  });

  it.each([
    { kind: "message_draft", text: "Draft only" },
    { kind: "task", title: "A task", dueAt: null },
  ])("rejects a non-calendar $kind artifact", (artifact) => {
    expect(() => renderIcs(artifact)).toThrow(/calendar_event/);
  });

  it("rejects malformed calendar artifacts", () => {
    expect(() =>
      renderIcs({
        kind: "calendar_event",
        title: "Bad date",
        startsAt: "tomorrow",
        endsAt: "later",
        description: "",
      }),
    ).toThrow();
  });
});
