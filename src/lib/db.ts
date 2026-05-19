import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "@/db/schema";

export { schema };

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;
let _migrated = false;

function isBuildPhase(): boolean {
  // Skip DB initialization during Next.js build / page data collection
  return process.env.NEXT_PHASE === "phase-production-build";
}

function init() {
  if (_db) return;
  if (isBuildPhase()) {
    // Return a stub that throws — pages should not hit DB at build time
    throw new Error("DB access during build phase is disallowed. Mark route as force-dynamic.");
  }
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "rupiah.db");
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  _sqlite = new Database(dbPath);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.pragma("busy_timeout = 5000");
  _sqlite.pragma("foreign_keys = ON");
  _db = drizzle(_sqlite, { schema });
}

export const db: BetterSQLite3Database<typeof schema> = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    init();
    return Reflect.get(_db as object, prop, _db);
  },
});

export function ensureMigrated() {
  if (_migrated) return;
  init();
  if (!_sqlite) return;
  _sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      rate REAL NOT NULL,
      source TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rates_timestamp_idx ON rates(timestamp);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS email_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      verified INTEGER NOT NULL DEFAULT 0,
      verify_token TEXT,
      created_at INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      published_at INTEGER NOT NULL,
      fetched_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS news_published_idx ON news_articles(published_at);

    CREATE TABLE IF NOT EXISTS notifications_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sent_at INTEGER NOT NULL,
      slot TEXT NOT NULL,
      rate REAL NOT NULL,
      rate_change_pct REAL,
      push_sent_count INTEGER NOT NULL DEFAULT 0,
      email_sent_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS notifications_sent_at_idx ON notifications_log(sent_at);
  `);
  _migrated = true;
}
