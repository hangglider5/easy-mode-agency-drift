import { describe, expect, it } from "vitest";
import type { DomainEvent } from "../../src/domain/events";
import { replayProfile } from "../../src/domain/replay";

const profileId = "00000000-0000-4000-8000-000000000001";
const id = (suffix: number) =>
  `00000000-0000-4000-8000-${suffix.toString().padStart(12, "0")}`;

function event(
  eventId: string,
  type: DomainEvent["type"],
  occurredAt: string,
): DomainEvent {
  return {
    id: eventId,
    profileId,
    aggregateId: profileId,
    type,
    actor: "system",
    occurredAt,
    payload: {},
  };
}

describe("replayProfile", () => {
  it("includes only the latest reset and events appended after it", () => {
    const beforeReset = event(
      id(1),
      "preference_proposed",
      "2026-07-01T00:00:00.000Z",
    );
    const firstReset = event(
      id(2),
      "profile_reset",
      "2026-07-02T00:00:00.000Z",
    );
    const betweenResets = event(
      id(3),
      "sweep_submitted",
      "2026-07-03T00:00:00.000Z",
    );
    const latestReset = event(
      id(4),
      "profile_reset",
      "2026-07-04T00:00:00.000Z",
    );
    const afterReset = event(
      id(5),
      "manual_mode_enabled",
      "2026-07-05T00:00:00.000Z",
    );

    const state = replayProfile([
      beforeReset,
      firstReset,
      betweenResets,
      latestReset,
      afterReset,
    ]);

    expect(state.allEvents).toHaveLength(5);
    expect(state.activeEvents).toEqual([latestReset, afterReset]);
  });

  it("keeps every event active when no reset exists", () => {
    const events = [
      event(id(6), "sweep_submitted", "2026-07-01T00:00:00.000Z"),
      event(id(7), "decision_parsed", "2026-07-02T00:00:00.000Z"),
    ];

    expect(replayProfile(events)).toEqual({
      allEvents: events,
      activeEvents: events,
    });
  });
});
