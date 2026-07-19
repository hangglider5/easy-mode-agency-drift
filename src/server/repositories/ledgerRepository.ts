import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type Database from "better-sqlite3";
import {
  DomainEventSchema,
  type DomainEvent,
} from "../../domain/events";

type EventRow = {
  id: string;
  profile_id: string;
  aggregate_id: string;
  type: string;
  actor: string;
  occurred_at: string;
  payload_json: string;
};

type ProfileRow = {
  id: string;
  name: string;
  created_at: string;
};

export class LedgerRepository {
  constructor(private readonly database: Database.Database) {}

  createProfile(name: string): string {
    const profileId = randomUUID();
    this.database
      .prepare(
        "INSERT INTO profiles (id, name, created_at) VALUES (?, ?, ?)",
      )
      .run(profileId, name, new Date().toISOString());
    return profileId;
  }

  append(event: DomainEvent): void {
    this.insertEvent(DomainEventSchema.parse(event));
  }

  appendMany(events: readonly DomainEvent[]): void {
    const validated = events.map((event) => DomainEventSchema.parse(event));
    this.database.transaction((batch: readonly DomainEvent[]) => {
      batch.forEach((event) => this.insertEvent(event));
    })(validated);
  }

  private insertEvent(validated: DomainEvent): void {
    const result = this.database
      .prepare(
        `INSERT OR IGNORE INTO events (
          id, profile_id, aggregate_id, type, actor, occurred_at, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        validated.id,
        validated.profileId,
        validated.aggregateId,
        validated.type,
        validated.actor,
        validated.occurredAt,
        JSON.stringify(validated.payload),
      );

    if (result.changes === 0) {
      const existingRow = this.database
        .prepare(
          `SELECT id, profile_id, aggregate_id, type, actor, occurred_at, payload_json
           FROM events
           WHERE id = ?`,
        )
        .get(validated.id) as EventRow | undefined;
      const existing = existingRow ? parseEventRow(existingRow) : undefined;

      if (!existing || !isDeepStrictEqual(existing, validated)) {
        throw new Error(`Event ID conflict: ${validated.id}`);
      }
    }
  }

  getProfile(
    profileId: string,
  ): { id: string; name: string; createdAt: string } | undefined {
    const row = this.database
      .prepare("SELECT id, name, created_at FROM profiles WHERE id = ?")
      .get(profileId) as ProfileRow | undefined;

    return row
      ? { id: row.id, name: row.name, createdAt: row.created_at }
      : undefined;
  }

  findEvent(eventId: string): DomainEvent | undefined {
    const row = this.database
      .prepare(
        `SELECT id, profile_id, aggregate_id, type, actor, occurred_at, payload_json
         FROM events
         WHERE id = ?`,
      )
      .get(eventId) as EventRow | undefined;

    return row ? parseEventRow(row) : undefined;
  }

  list(profileId: string): readonly DomainEvent[] {
    const rows = this.database
      .prepare(
        `SELECT id, profile_id, aggregate_id, type, actor, occurred_at, payload_json
         FROM events
         WHERE profile_id = ?
         ORDER BY sequence ASC`,
      )
      .all(profileId) as EventRow[];

    return rows.map(parseEventRow);
  }

  deleteProfile(profileId: string): void {
    this.database.transaction((id: string) => {
      this.database.prepare("DELETE FROM profiles WHERE id = ?").run(id);
    })(profileId);
  }
}

function parseEventRow(row: EventRow): DomainEvent {
  return DomainEventSchema.parse({
    id: row.id,
    profileId: row.profile_id,
    aggregateId: row.aggregate_id,
    type: row.type,
    actor: row.actor,
    occurredAt: row.occurred_at,
    payload: JSON.parse(row.payload_json) as unknown,
  });
}
