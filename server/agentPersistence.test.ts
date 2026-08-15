import { describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  updates: [] as Array<Record<string, unknown>>,
  events: [] as Array<Record<string, unknown>>,
}));

const fakeDb = vi.hoisted(() => ({
  update: () => ({
    set: (values: Record<string, unknown>) => ({
      where: async () => {
        store.updates.push(values);
        return [{ affectedRows: 1 }];
      },
    }),
  }),
  insert: () => ({
    values: async (values: Record<string, unknown>) => {
      store.events.push(values);
      return [{ affectedRows: 1 }];
    },
  }),
}));

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

import { completeAgentJobPlan } from "./agentWorkspaceDb";

describe("agent job evidence persistence", () => {
  it("stores the bounded evidence summary with the generated plan", async () => {
    store.updates.length = 0;
    store.events.length = 0;
    const evidence = JSON.stringify({ rootFiles: ["README.md", "package.json"], readmeAvailable: true, manifestAvailable: true });

    await completeAgentJobPlan(7, "agent-job-1", "Safe implementation plan", evidence);

    expect(store.updates[0]).toMatchObject({ status: "awaiting_approval", plan: "Safe implementation plan", output: "Safe implementation plan", evidence });
    expect(store.events[0]).toMatchObject({ jobId: "agent-job-1", kind: "plan_ready" });
  });
});
