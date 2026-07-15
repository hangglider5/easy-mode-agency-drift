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

  it("rejects a repeated event ID when the payload differs", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const profileId = repo.createProfile("Fresh Profile");
    const original = sweepEvent(profileId, id(10), "original");
    const conflicting = sweepEvent(profileId, id(10), "different");
    repo.append(original);

    expect(() => repo.append(conflicting)).toThrow(
      `Event ID conflict: ${original.id}`,
    );
    expect(repo.list(profileId)).toEqual([original]);
    database.close();
  });

  it("rejects a repeated event ID used by another profile", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const firstProfileId = repo.createProfile("First Profile");
    const secondProfileId = repo.createProfile("Second Profile");
    const eventId = id(11);
    repo.append(sweepEvent(firstProfileId, eventId, "first profile"));

    expect(() =>
      repo.append(sweepEvent(secondProfileId, eventId, "second profile")),
    ).toThrow(`Event ID conflict: ${eventId}`);
    expect(repo.list(secondProfileId)).toEqual([]);
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
  const arrayWithIgnoredProperty = ["first"];
  Object.defineProperty(arrayWithIgnoredProperty, "01", {
    enumerable: true,
    value: "JSON.stringify would drop this",
  });

  const invalidPayloadCases: ReadonlyArray<readonly [string, unknown]> = [
    ["undefined", { invalid: undefined }],
    ["NaN", { invalid: Number.NaN }],
    ["positive Infinity", { invalid: Number.POSITIVE_INFINITY }],
    ["negative Infinity", { invalid: Number.NEGATIVE_INFINITY }],
    ["BigInt", { invalid: 1n }],
    ["function", { invalid: () => "not JSON" }],
    ["symbol", { invalid: Symbol("not JSON") }],
    ["Date", { invalid: new Date("2026-07-15T00:00:00.000Z") }],
    ["non-plain object", { invalid: new Map([["key", "value"]]) }],
    [
      "array property that JSON would ignore",
      { invalid: arrayWithIgnoredProperty },
    ],
    ["root array", ["not", "an", "object"]],
  ];

  it.each(invalidPayloadCases)("rejects a %s payload value", (_name, payload) => {
    expect(
      DomainEventSchema.safeParse({
        ...sweepEvent(id(12), id(13), "invalid payload"),
        payload,
      }).success,
    ).toBe(false);
  });

  it("rejects a circular payload without overflowing the call stack", () => {
    const payload: Record<string, unknown> = {};
    payload.self = payload;

    expect(() =>
      DomainEventSchema.safeParse({
        ...sweepEvent(id(12), id(14), "circular payload"),
        payload,
      }),
    ).not.toThrow();
    expect(
      DomainEventSchema.safeParse({
        ...sweepEvent(id(12), id(14), "circular payload"),
        payload,
      }).success,
    ).toBe(false);
  });

  it("clones accepted payloads at the schema boundary", () => {
    const payload = { nested: { choice: "original" } };
    const parsed = DomainEventSchema.parse({
      ...sweepEvent(id(12), id(15), "clone payload"),
      payload,
    });

    payload.nested.choice = "mutated";

    expect(parsed.payload).toEqual({ nested: { choice: "original" } });
  });

  it("round-trips nested JSON through the repository without loss", () => {
    const database = createMemoryDatabase();
    const repo = new LedgerRepository(database);
    const profileId = repo.createProfile("Nested Profile");
    const event = DomainEventSchema.parse({
      ...sweepEvent(profileId, id(16), "nested payload"),
      payload: {
        alpha: null,
        nested: {
          enabled: true,
          scores: [1, 2.5, { label: "three" }],
        },
      },
    });

    repo.append(event);
    const [readBack] = repo.list(profileId);

    expect(readBack).toEqual(event);
    expect(Object.isFrozen(readBack)).toBe(true);
    expect(Object.isFrozen(readBack.payload)).toBe(true);
    const readBackPayload = readBack.payload as unknown as {
      nested: { scores: readonly unknown[] };
    };
    expect(Object.isFrozen(readBackPayload.nested)).toBe(true);
    expect(Object.isFrozen(readBackPayload.nested.scores)).toBe(true);
    database.close();
  });

  it("deep-freezes the event and every nested JSON container", () => {
    const event = DomainEventSchema.parse(
      {
        ...sweepEvent(id(8), id(9), "immutable input"),
        payload: {
          nested: {
            choices: [{ label: "first" }, { label: "second" }],
          },
        },
      },
    );
    const payload = event.payload as unknown as {
      nested: { choices: Array<{ label: string }> };
    };

    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
    expect(Object.isFrozen(payload.nested)).toBe(true);
    expect(Object.isFrozen(payload.nested.choices)).toBe(true);
    expect(Object.isFrozen(payload.nested.choices[0])).toBe(true);
    expect(() => {
      payload.nested.choices[0].label = "mutated";
    }).toThrow(TypeError);
  });
});

function count(database: Database.Database, table: "profiles" | "events") {
  const row = database
    .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
    .get() as { count: number };
  return row.count;
}
