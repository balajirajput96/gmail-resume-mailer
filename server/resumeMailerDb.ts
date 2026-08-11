import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { gmailConnections, recipientEntries, resumes, sendRecipients, sendSessions } from "../drizzle/schema";
import { getDb } from "./db";
import type { MailRecipient } from "./mailerCore";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

function affectedRows(result: unknown) {
  const value = (result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0;
  return Number(value);
}

export async function getGmailConnection(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(gmailConnections).where(eq(gmailConnections.userId, userId)).limit(1);
  return rows[0];
}

export async function saveGmailConnection(input: { userId: number; gmailAddress: string; refreshTokenCiphertext: string; scopes: string }) {
  const db = requireDb(await getDb());
  await db.insert(gmailConnections).values(input).onDuplicateKeyUpdate({
    set: { gmailAddress: input.gmailAddress, refreshTokenCiphertext: input.refreshTokenCiphertext, scopes: input.scopes, updatedAt: new Date() },
  });
}

export async function listResumes(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt));
}

export async function getResume(userId: number, resumeId: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(resumes).where(and(eq(resumes.userId, userId), eq(resumes.id, resumeId))).limit(1);
  return rows[0];
}

export async function createResume(input: { userId: number; originalName: string; storageKey: string; mimeType: string; sizeBytes: number }) {
  const db = requireDb(await getDb());
  const result = await db.insert(resumes).values(input);
  return Number((result as any)[0]?.insertId ?? (result as any).insertId);
}

export async function listRecipients(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(recipientEntries).where(eq(recipientEntries.userId, userId)).orderBy(desc(recipientEntries.updatedAt));
}

export async function createRecipient(input: { userId: number; email: string; firstName?: string | null; company?: string | null }) {
  const db = requireDb(await getDb());
  const result = await db.insert(recipientEntries).values(input);
  return Number((result as any)[0]?.insertId ?? (result as any).insertId);
}

export async function updateRecipient(input: { userId: number; id: number; email: string; firstName?: string | null; company?: string | null }) {
  const db = requireDb(await getDb());
  const result = await db.update(recipientEntries).set({
    email: input.email,
    firstName: input.firstName ?? null,
    company: input.company ?? null,
    updatedAt: new Date(),
  }).where(and(eq(recipientEntries.userId, input.userId), eq(recipientEntries.id, input.id)));
  return affectedRows(result) > 0;
}

export async function deleteRecipient(userId: number, id: number) {
  const db = requireDb(await getDb());
  const result = await db.delete(recipientEntries).where(and(eq(recipientEntries.userId, userId), eq(recipientEntries.id, id)));
  return affectedRows(result) > 0;
}

export async function createReviewSession(input: {
  id: string;
  userId: number;
  subject: string;
  messageTemplate: string;
  resumeId: number;
  attachmentName: string;
  recipients: Array<MailRecipient & { renderedBody: string }>;
}) {
  const db = requireDb(await getDb());
  const now = new Date();
  await db.insert(sendSessions).values({
    id: input.id,
    userId: input.userId,
    subject: input.subject,
    messageTemplate: input.messageTemplate,
    resumeId: input.resumeId,
    attachmentName: input.attachmentName,
    status: "review",
    reviewedAt: now,
  });
  await db.insert(sendRecipients).values(input.recipients.map(recipient => ({
    sessionId: input.id,
    email: recipient.email,
    firstName: recipient.firstName ?? null,
    company: recipient.company ?? null,
    renderedBody: recipient.renderedBody,
    status: "pending" as const,
  })));
}

export async function getSessionDetail(userId: number, sessionId: string) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(sendSessions).where(and(eq(sendSessions.userId, userId), eq(sendSessions.id, sessionId))).limit(1);
  const session = rows[0];
  if (!session) return undefined;
  const recipients = await db.select().from(sendRecipients).where(eq(sendRecipients.sessionId, sessionId));
  return { session, recipients };
}

export async function markSessionReviewOpened(userId: number, sessionId: string) {
  const db = requireDb(await getDb());
  await db.update(sendSessions).set({ reviewOpenedAt: new Date() })
    .where(and(eq(sendSessions.userId, userId), eq(sendSessions.id, sessionId), eq(sendSessions.status, "review")));
}

export async function markSessionSending(userId: number, sessionId: string) {
  const db = requireDb(await getDb());
  const result = await db.update(sendSessions).set({ status: "sending", confirmedAt: new Date(), startedAt: new Date() })
    .where(and(eq(sendSessions.userId, userId), eq(sendSessions.id, sessionId), eq(sendSessions.status, "review"), isNotNull(sendSessions.reviewedAt)));
  return affectedRows(result) > 0;
}

export async function markRecipientSent(id: number, gmailMessageId: string) {
  const db = requireDb(await getDb());
  await db.update(sendRecipients).set({ status: "sent", gmailMessageId, sentAt: new Date(), failureCode: null }).where(eq(sendRecipients.id, id));
}

export async function markRecipientFailed(id: number, failureCode: string) {
  const db = requireDb(await getDb());
  await db.update(sendRecipients).set({ status: "failed", failureCode }).where(eq(sendRecipients.id, id));
}

export async function completeSession(userId: number, sessionId: string, status: "completed" | "completed_with_errors" | "failed") {
  const db = requireDb(await getDb());
  await db.update(sendSessions).set({ status, finishedAt: new Date() }).where(and(eq(sendSessions.userId, userId), eq(sendSessions.id, sessionId)));
}

export function groupHistoryRows<TSession extends { id: string }, TRecipient extends { sessionId: string }>(sessions: TSession[], recipientRows: TRecipient[]) {
  return sessions.map(session => ({ ...session, recipients: recipientRows.filter(recipient => recipient.sessionId === session.id) }));
}

export async function listHistory(userId: number) {
  const db = requireDb(await getDb());
  const sessions = await db.select().from(sendSessions).where(eq(sendSessions.userId, userId)).orderBy(desc(sendSessions.createdAt)).limit(30);
  if (sessions.length === 0) return [];
  const recipientRows = await db.select().from(sendRecipients).where(inArray(sendRecipients.sessionId, sessions.map(session => session.id)));
  return groupHistoryRows(sessions, recipientRows);
}
