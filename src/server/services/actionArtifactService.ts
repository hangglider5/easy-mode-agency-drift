import { randomUUID } from "node:crypto";
import {
  ArtifactSchema,
  RecommendationSchema,
  type ActionArtifact,
} from "../../shared/domainSchemas";

type CalendarArtifact = Extract<
  ActionArtifact,
  { kind: "calendar_event" }
>;

const PRODID = "-//Easy Mode Agency Drift//Decision Sweep//EN";

export function createArtifact(recommendation: unknown): ActionArtifact {
  const parsedRecommendation = RecommendationSchema.parse(recommendation);
  return ArtifactSchema.parse(parsedRecommendation.artifact);
}

export function renderIcs(
  artifact: unknown,
  identity?: { eventId: string; occurredAt: string },
): string {
  const parsedArtifact = ArtifactSchema.parse(artifact);
  if (parsedArtifact.kind !== "calendar_event") {
    throw new TypeError("renderIcs requires a calendar_event artifact");
  }

  return renderCalendarEvent(parsedArtifact, identity);
}

function renderCalendarEvent(
  artifact: CalendarArtifact,
  identity?: { eventId: string; occurredAt: string },
): string {
  const uid = identity?.eventId ?? randomUUID();
  const createdAt = identity?.occurredAt
    ? new Date(identity.occurredAt)
    : new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "BEGIN:VEVENT",
    `UID:${uid}@easy-mode-agency-drift`,
    `DTSTAMP:${formatUtcDate(createdAt)}`,
    `DTSTART:${formatUtcDate(new Date(artifact.startsAt))}`,
    `DTEND:${formatUtcDate(new Date(artifact.endsAt))}`,
    `SUMMARY:${escapeTextProperty(artifact.title)}`,
    `DESCRIPTION:${escapeTextProperty(artifact.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

function formatUtcDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeTextProperty(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n/g, "\\n")
    .replace(/\r/g, "\\n")
    .replace(/\n/g, "\\n");
}
