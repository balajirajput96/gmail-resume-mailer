import { describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  updates: [] as Array<Record<string, unknown>>,
  sessions: [{ id: "session-1", userId: 7, status: "sending", createdAt: new Date("2026-08-11T10:00:00Z") }],
  recipients: [
    { id: 11, sessionId: "session-1", email: "first@example.com", status: "pending", gmailMessageId: null, failureCode: null },
    { id: 12, sessionId: "session-1", email: "second@example.com", status: "pending", gmailMessageId: null, failureCode: null },
  ],
  updateCount: 0,
  selectCount: 0,
}));

const fakeDb = vi.hoisted(() => ({
  update: () => ({
    set: (values: Record<string, unknown>) => ({
      where: async () => {
        store.updates.push(values);
        const index = store.updateCount++;
        if (index === 0) Object.assign(store.recipients[0], values);
        if (index === 1) Object.assign(store.recipients[1], values);
        if (index === 2) Object.assign(store.sessions[0], values);
        return [{ affectedRows: 1 }];
      },
    }),
  }),
  select: () => {
    const call = store.selectCount++;
    return {
      from: () => ({
        where: () => call === 0
          ? { orderBy: () => ({ limit: async () => store.sessions }) }
          : Promise.resolve(store.recipients),
      }),
    };
  },
}));

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

import { completeSession, listHistory, markRecipientFailed, markRecipientSent } from "./resumeMailerDb";

describe("send-session persistence workflow", () => {
  it("persists recipient outcomes and exposes them through send history", async () => {
    store.updates.length = 0;
    store.updateCount = 0;
    store.selectCount = 0;
    Object.assign(store.sessions[0], { status: "sending", finishedAt: undefined });
    Object.assign(store.recipients[0], { status: "pending", gmailMessageId: null, failureCode: null });
    Object.assign(store.recipients[1], { status: "pending", gmailMessageId: null, failureCode: null });

    await markRecipientSent(11, "gmail-message-1");
    await markRecipientFailed(12, "gmail_send_failed");
    await completeSession(7, "session-1", "completed_with_errors");

    const history = await listHistory(7);

    expect(store.updates[0]).toMatchObject({ status: "sent", gmailMessageId: "gmail-message-1", failureCode: null });
    expect(store.updates[1]).toMatchObject({ status: "failed", failureCode: "gmail_send_failed" });
    expect(store.updates[2]).toMatchObject({ status: "completed_with_errors" });
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe("completed_with_errors");
    expect(history[0].recipients).toMatchObject([
      { email: "first@example.com", status: "sent", gmailMessageId: "gmail-message-1" },
      { email: "second@example.com", status: "failed", failureCode: "gmail_send_failed" },
    ]);
  });
});
