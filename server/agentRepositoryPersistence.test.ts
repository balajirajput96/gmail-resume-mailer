import { describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  inserts: [] as Array<Record<string, unknown>>,
}));

const fakeDb = vi.hoisted(() => ({
  insert: () => ({
    values: (values: Record<string, unknown>) => {
      store.inserts.push(values);
      return {
        onDuplicateKeyUpdate: async () => [{ affectedRows: 1 }],
      };
    },
  }),
  select: () => ({
    from: () => ({
      where: () => ({
        limit: async () => [{ id: 18, fullName: "owner/repository" }],
      }),
    }),
  }),
}));

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

import { upsertAgentRepository } from "./agentWorkspaceDb";

describe("agent repository persistence", () => {
  it("does not pass public GitHub metadata timestamps into the database timestamp column", async () => {
    store.inserts.length = 0;

    await upsertAgentRepository({
      userId: 7,
      fullName: "owner/repository",
      url: "https://github.com/owner/repository",
      defaultBranch: "main",
      visibility: "public",
      description: "Public repository",
      // Runtime data from the GitHub inventory can contain extra fields.
      updatedAt: "2026-08-15T00:00:00Z",
      language: "TypeScript",
    } as Parameters<typeof upsertAgentRepository>[0] & Record<string, unknown>);

    expect(store.inserts[0]).toEqual({
      userId: 7,
      fullName: "owner/repository",
      url: "https://github.com/owner/repository",
      defaultBranch: "main",
      visibility: "public",
      description: "Public repository",
    });
  });
});
