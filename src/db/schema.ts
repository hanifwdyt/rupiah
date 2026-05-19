import { sqliteTable, integer, real, text, index } from "drizzle-orm/sqlite-core";

export const rates = sqliteTable(
  "rates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: integer("timestamp").notNull(),
    rate: real("rate").notNull(),
    source: text("source").notNull(),
  },
  (table) => ({
    timestampIdx: index("rates_timestamp_idx").on(table.timestamp),
  }),
);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at").notNull(),
  active: integer("active").notNull().default(1),
});

export const emailSubscriptions = sqliteTable("email_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  verified: integer("verified").notNull().default(0),
  verifyToken: text("verify_token"),
  createdAt: integer("created_at").notNull(),
  active: integer("active").notNull().default(1),
});

export const newsArticles = sqliteTable(
  "news_articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    excerpt: text("excerpt"),
    publishedAt: integer("published_at").notNull(),
    fetchedAt: integer("fetched_at").notNull(),
  },
  (table) => ({
    publishedIdx: index("news_published_idx").on(table.publishedAt),
  }),
);

export const notificationsLog = sqliteTable(
  "notifications_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sentAt: integer("sent_at").notNull(),
    slot: text("slot").notNull(),
    rate: real("rate").notNull(),
    rateChangePct: real("rate_change_pct"),
    pushSentCount: integer("push_sent_count").notNull().default(0),
    emailSentCount: integer("email_sent_count").notNull().default(0),
  },
  (table) => ({
    sentAtIdx: index("notifications_sent_at_idx").on(table.sentAt),
  }),
);
