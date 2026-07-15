import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");
const schema = readFileSync(schemaPath, "utf8");

function initializeDatabase(database: Database.Database): Database.Database {
  database.exec(schema);
  return database;
}

export function openDatabase(path: string): Database.Database {
  return initializeDatabase(new Database(path));
}

export function createMemoryDatabase(): Database.Database {
  return initializeDatabase(new Database(":memory:"));
}
