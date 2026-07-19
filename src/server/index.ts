import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { openDatabase } from "./db/database";
import { OpenRouterGateway } from "./providers/openrouterGateway";
import { LedgerRepository } from "./repositories/ledgerRepository";

const config = loadConfig(process.env);
const databasePath = resolve(config.databasePath);
mkdirSync(dirname(databasePath), { recursive: true });

const ledger = new LedgerRepository(openDatabase(databasePath));
const openrouter = OpenRouterGateway.fromConfig(config.openrouter);
const app = createApp({
  ledger,
  openrouter,
  clientDistPath: resolve(process.cwd(), "dist/client"),
});

app.listen(config.port, () => {
  console.log(`Easy Mode API listening on port ${config.port}`);
});
