import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const gmailConnections = mysqlTable(
  "gmail_connections",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    gmailAddress: varchar("gmailAddress", { length: 320 }).notNull(),
    refreshTokenCiphertext: text("refreshTokenCiphertext").notNull(),
    scopes: text("scopes").notNull(),
    connectedAt: timestamp("connectedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("gmail_connections_user_unique").on(table.userId)],
);

export type GmailConnection = typeof gmailConnections.$inferSelect;

export const resumes = mysqlTable(
  "resumes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    originalName: varchar("originalName", { length: 255 }).notNull(),
    storageKey: varchar("storageKey", { length: 1024 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("resumes_user_created_idx").on(table.userId, table.createdAt)],
);

export const recipientEntries = mysqlTable(
  "recipient_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("firstName", { length: 120 }),
    company: varchar("company", { length: 180 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("recipient_entries_user_email_unique").on(table.userId, table.email),
    index("recipient_entries_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const sendSessions = mysqlTable(
  "send_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId").notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    messageTemplate: text("messageTemplate").notNull(),
    resumeId: int("resumeId").notNull(),
    attachmentName: varchar("attachmentName", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["review", "sending", "completed", "completed_with_errors", "failed"]).default("review").notNull(),
    reviewedAt: timestamp("reviewedAt"),
    reviewOpenedAt: timestamp("reviewOpenedAt"),
    confirmedAt: timestamp("confirmedAt"),
    startedAt: timestamp("startedAt"),
    finishedAt: timestamp("finishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("send_sessions_user_created_idx").on(table.userId, table.createdAt)],
);

export const sendRecipients = mysqlTable(
  "send_recipients",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: varchar("sessionId", { length: 36 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("firstName", { length: 120 }),
    company: varchar("company", { length: 180 }),
    renderedBody: text("renderedBody").notNull(),
    status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
    gmailMessageId: varchar("gmailMessageId", { length: 255 }),
    failureCode: varchar("failureCode", { length: 80 }),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("send_recipients_session_idx").on(table.sessionId)],
);
