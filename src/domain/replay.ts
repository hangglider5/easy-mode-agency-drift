import type { DomainEvent } from "./events";

export type ProfileState = {
  allEvents: readonly DomainEvent[];
  activeEvents: readonly DomainEvent[];
};

export function replayProfile(events: readonly DomainEvent[]): ProfileState {
  const ordered = [...events];
  const resetIndex = ordered
    .map((event) => event.type)
    .lastIndexOf("profile_reset");

  return {
    allEvents: ordered,
    activeEvents: resetIndex < 0 ? ordered : ordered.slice(resetIndex),
  };
}
