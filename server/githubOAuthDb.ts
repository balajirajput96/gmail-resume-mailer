import { eq } from "drizzle-orm";
import { githubConnections } from "../drizzle/schema";
import { getDb } from "./db";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function getGitHubConnection(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(githubConnections).where(eq(githubConnections.userId, userId)).limit(1);
  return rows[0];
}

export async function saveGitHubConnection(input: { userId: number; githubLogin: string; accessTokenCiphertext: string; scopes: string }) {
  const db = requireDb(await getDb());
  await db.insert(githubConnections).values(input).onDuplicateKeyUpdate({
    set: { githubLogin: input.githubLogin, accessTokenCiphertext: input.accessTokenCiphertext, scopes: input.scopes, updatedAt: new Date() },
  });
  return getGitHubConnection(input.userId);
}
