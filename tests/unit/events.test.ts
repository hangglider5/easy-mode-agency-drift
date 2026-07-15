import { describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { DomainEventSchema, type DomainEvent } from "../../src/domain/events";
import { createMemoryDatabase } from "../../src/server/db/database";
import { LedgerRepository } from "../../src/server/repositories/ledgerRepository";

const id = (suffix: number) =>
  `00000000-0000-4000-8000-${suffix.toString().padStart(12, "0")}`;

function sweepEvent(profileId: string, eventId: string, rawInput: string) {
  return {
    id: eventId,
    profileId,
    aggregateId: profileId,
    type: "sweep_submitted",
    actor: "human",
    occurredAt: "2026-07-15T00:00:00.000Z",
    payload: { rawInput },
  } as const;
}

describe("LedgerRepository", () => {
  it("treats a repeated event ID as an idempotent append", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const profileId = repo.createProfile("Fresh Profile");
    const event = sweepEvent(profileId, id(1), "Dinner or deadline?");

    repo.append(event);
    repo.append(event);

    expect(repo.list(profileId)).toEqual([event]);
    database.close();
  });

  it("lists events in stable append sequence instead of timestamp order", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const profileId = repo.createProfile("Fresh Profile");
    const first = {
      ...sweepEvent(profileId, id(2), "first append"),
      occurredAt: "2026-07-15T02:00:00.000Z",
    };
    const second = {
      ...sweepEvent(profileId, id(3), "second append"),
      occurredAt: "2026-07-15T01:00:00.000Z",
    };

    repo.append(first);
    repo.append(second);

    expect(repo.list(profileId).map((event) => event.id)).toEqual([
      first.id,
      second.id,
    ]);
    database.close();
  });

  it("validates the domain event schema before writing", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const profileId = repo.createProfile("Fresh Profile");
    const invalidEvent = {
      ...sweepEvent(profileId, id(4), "invalid actor"),
      actor: "robot",
    };

    expect(() => repo.append(invalidEvent as unknown as DomainEvent)).toThrow();
    expect(repo.list(profileId)).toEqual([]);
    database.close();
  });

  it("deletes a profile and its events through the cascade boundary", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const profileId = repo.createProfile("Disposable Profile");
    repo.append(sweepEvent(profileId, id(5), "temporary"));

    repo.deleteProfile(profileId);

    expect(repo.list(profileId)).toEqual([]);
    expect(count(database, "profiles")).toBe(0);
    expect(count(database, "events")).toBe(0);
    database.close();
  });

  it("does not expose an event update API", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);

    expect("update" in repo).toBe(false);
    database.close();
  });
});

describe("DomainEventSchema", () => {
  it("returns an immutable domain event contract", () => {
    const event = DomainEventSchema.parse(
      sweepEvent(id(8), id(9), "immutable input"),
    );

    expect(Object.isFrozen(event)).toBe(true);
  });
});

function count(database: Database.Database, table: "profiles" | "events") {
  const row = database
    .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
    .get() as { count: number };
  return row.count;
}
