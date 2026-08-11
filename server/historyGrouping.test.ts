import { describe, expect, it } from "vitest";
import { groupHistoryRows } from "./resumeMailerDb";

describe("send history grouping", () => {
  it("keeps recipient-level sent and failed statuses with their send session", () => {
    const history = groupHistoryRows(
      [
        { id: "session-one", status: "completed_with_errors" },
        { id: "session-two", status: "completed" },
      ],
      [
        { sessionId: "session-one", email: "first@example.com", status: "sent", gmailMessageId: "gmail-1" },
        { sessionId: "session-one", email: "second@example.com", status: "failed", failureCode: "gmail_send_failed" },
        { sessionId: "session-two", email: "third@example.com", status: "sent", gmailMessageId: "gmail-2" },
      ],
    );

    expect(history[0].recipients).toEqual([
      { sessionId: "session-one", email: "first@example.com", status: "sent", gmailMessageId: "gmail-1" },
      { sessionId: "session-one", email: "second@example.com", status: "failed", failureCode: "gmail_send_failed" },
    ]);
    expect(history[1].recipients).toEqual([
      { sessionId: "session-two", email: "third@example.com", status: "sent", gmailMessageId: "gmail-2" },
    ]);
  });
});

