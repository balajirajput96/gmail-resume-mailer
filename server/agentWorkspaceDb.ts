import { and, desc, eq } from "drizzle-orm";
import { agentJobEvents, agentJobs, agentMediaAssets, agentRepositories } from "../drizzle/schema";
import { getDb } from "./db";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function listAgentRepositories(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(agentRepositories).where(eq(agentRepositories.userId, userId)).orderBy(desc(agentRepositories.updatedAt));
}

export async function listAgentMediaAssets(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(agentMediaAssets).where(eq(agentMediaAssets.userId, userId)).orderBy(desc(agentMediaAssets.createdAt)).limit(24);
}

export async function createAgentMediaAsset(input: { userId: number; prompt: string; model: string; assetUrl: string }) {
  const db = requireDb(await getDb());
  const result = await db.insert(agentMediaAssets).values(input);
  return Number((result as any)[0]?.insertId ?? (result as any).insertId);
}

export async function upsertAgentRepository(input: {
  userId: number;
  fullName: string;
  url: string;
  defaultBranch: string;
  visibility: string;
  description?: string | null;
}) {
  const db = requireDb(await getDb());
  // Persist only the workspace schema fields. GitHub inventory rows also carry
  // `updatedAt` as an ISO string, which must not be forwarded to Drizzle's
  // timestamp mapper (it expects a Date when an explicit value is supplied).
  const values = {
    userId: input.userId,
    fullName: input.fullName,
    url: input.url,
    defaultBranch: input.defaultBranch,
    visibility: input.visibility,
    description: input.description ?? null,
  };
  await db.insert(agentRepositories).values(values).onDuplicateKeyUpdate({
    set: {
      url: input.url,
      defaultBranch: input.defaultBranch,
      visibility: input.visibility,
      description: input.description ?? null,
      updatedAt: new Date(),
    },
  });
  return getAgentRepositoryByName(input.userId, input.fullName);
}

export async function getAgentRepository(userId: number, id: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(agentRepositories).where(and(eq(agentRepositories.userId, userId), eq(agentRepositories.id, id))).limit(1);
  return rows[0];
}

async function getAgentRepositoryByName(userId: number, fullName: string) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(agentRepositories).where(and(eq(agentRepositories.userId, userId), eq(agentRepositories.fullName, fullName))).limit(1);
  return rows[0];
}

export async function createAgentJob(input: {
  id: string;
  userId: number;
  repositoryId: number;
  title: string;
  request: string;
  kind: "repository_analysis" | "implementation_plan";
  model: string;
}) {
  const db = requireDb(await getDb());
  await db.insert(agentJobs).values({ ...input, status: "queued" });
  await addAgentJobEvent(input.id, "created", "Job created and awaiting planning.");
}

export async function getAgentJob(userId: number, jobId: string) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(agentJobs).where(and(eq(agentJobs.userId, userId), eq(agentJobs.id, jobId))).limit(1);
  return rows[0];
}

export async function listAgentJobs(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(agentJobs).where(eq(agentJobs.userId, userId)).orderBy(desc(agentJobs.createdAt)).limit(50);
}

export async function listAgentJobEvents(jobId: string) {
  const db = requireDb(await getDb());
  return db.select().from(agentJobEvents).where(eq(agentJobEvents.jobId, jobId)).orderBy(desc(agentJobEvents.createdAt));
}

export async function markAgentJobPlanning(userId: number, jobId: string) {
  const db = requireDb(await getDb());
  await db.update(agentJobs).set({ status: "planning", updatedAt: new Date() }).where(and(eq(agentJobs.userId, userId), eq(agentJobs.id, jobId)));
  await addAgentJobEvent(jobId, "planning", "AI planning started.");
}

export async function completeAgentJobPlan(userId: number, jobId: string, plan: string, evidence: string) {
  const db = requireDb(await getDb());
  await db.update(agentJobs).set({ status: "awaiting_approval", plan, output: plan, evidence, updatedAt: new Date() }).where(and(eq(agentJobs.userId, userId), eq(agentJobs.id, jobId)));
  await addAgentJobEvent(jobId, "plan_ready", "Plan generated. Explicit approval is required before any external action.");
}

export async function failAgentJob(userId: number, jobId: string, message: string) {
  const db = requireDb(await getDb());
  await db.update(agentJobs).set({ status: "failed", output: message, updatedAt: new Date() }).where(and(eq(agentJobs.userId, userId), eq(agentJobs.id, jobId)));
  await addAgentJobEvent(jobId, "failed", message);
}

export async function approveAgentJob(userId: number, jobId: string, note?: string | null) {
  const db = requireDb(await getDb());
  await db.update(agentJobs).set({ status: "approved", approvalNote: note ?? null, reviewedAt: new Date(), updatedAt: new Date() }).where(and(eq(agentJobs.userId, userId), eq(agentJobs.id, jobId), eq(agentJobs.status, "awaiting_approval")));
  await addAgentJobEvent(jobId, "approved", "Plan approved. No external action is run by this approval alone.");
}

export async function rejectAgentJob(userId: number, jobId: string, note?: string | null) {
  const db = requireDb(await getDb());
  await db.update(agentJobs).set({ status: "rejected", approvalNote: note ?? null, reviewedAt: new Date(), updatedAt: new Date() }).where(and(eq(agentJobs.userId, userId), eq(agentJobs.id, jobId), eq(agentJobs.status, "awaiting_approval")));
  await addAgentJobEvent(jobId, "rejected", "Plan rejected. No external action was run.");
}

async function addAgentJobEvent(jobId: string, kind: string, message: string) {
  const db = requireDb(await getDb());
  await db.insert(agentJobEvents).values({ jobId, kind, message });
}
