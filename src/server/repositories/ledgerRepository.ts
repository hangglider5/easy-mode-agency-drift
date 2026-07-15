import { randomUUID } from "node:crypto";
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
    const validated = DomainEventSchema.parse(event);
    this.database
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

    return rows.map((row) =>
      DomainEventSchema.parse({
        id: row.id,
        profileId: row.profile_id,
        aggregateId: row.aggregate_id,
        type: row.type,
        actor: row.actor,
        occurredAt: row.occurred_at,
        payload: JSON.parse(row.payload_json) as unknown,
      }),
    );
  }

  deleteProfile(profileId: string): void {
    this.database.transaction((id: string) => {
      this.database.prepare("DELETE FROM profiles WHERE id = ?").run(id);
    })(profileId);
  }
}
