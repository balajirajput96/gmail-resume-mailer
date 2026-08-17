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

export const githubConnections = mysqlTable(
  "github_connections",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    githubLogin: varchar("githubLogin", { length: 255 }).notNull(),
    accessTokenCiphertext: text("accessTokenCiphertext").notNull(),
    scopes: text("scopes").notNull(),
    connectedAt: timestamp("connectedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("github_connections_user_unique").on(table.userId)],
);

export type GitHubConnection = typeof githubConnections.$inferSelect;

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

export const agentRepositories = mysqlTable(
  "agent_repositories",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    defaultBranch: varchar("defaultBranch", { length: 255 }).notNull().default("main"),
    visibility: varchar("visibility", { length: 32 }).notNull().default("private"),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("agent_repositories_user_name_unique").on(table.userId, table.fullName)],
);

export const agentJobs = mysqlTable(
  "agent_jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: int("userId").notNull(),
    repositoryId: int("repositoryId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    request: text("request").notNull(),
    kind: mysqlEnum("kind", ["repository_analysis", "implementation_plan"]).notNull(),
    status: mysqlEnum("status", ["queued", "planning", "awaiting_approval", "approved", "rejected", "failed"]).default("queued").notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    plan: text("plan"),
    output: text("output"),
    evidence: text("evidence"),
    approvalNote: text("approvalNote"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("agent_jobs_user_created_idx").on(table.userId, table.createdAt), index("agent_jobs_repository_idx").on(table.repositoryId)],
);

export const agentJobEvents = mysqlTable(
  "agent_job_events",
  {
    id: int("id").autoincrement().primaryKey(),
    jobId: varchar("jobId", { length: 36 }).notNull(),
    kind: varchar("kind", { length: 64 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("agent_job_events_job_created_idx").on(table.jobId, table.createdAt)],
);

export const agentMediaAssets = mysqlTable(
  "agent_media_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    prompt: text("prompt").notNull(),
    model: varchar("model", { length: 120 }).notNull(),
    assetUrl: varchar("assetUrl", { length: 2048 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("agent_media_assets_user_created_idx").on(table.userId, table.createdAt)],
);
