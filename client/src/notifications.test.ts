import { afterEach, describe, expect, it, vi } from "vitest";
import { clearNotificationsForTest, subscribeToNotifications, toast } from "./lib/notifications";

describe("in-app notifications", () => {
  afterEach(() => {
    clearNotificationsForTest();
    vi.restoreAllMocks();
  });

  it("publishes visible error and success notices to subscribed viewports", () => {
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    const received: string[][] = [];
    const unsubscribe = subscribeToNotifications(items => received.push(items.map(item => item.message)));

    toast.error("Enter a valid GitHub owner name");
    toast.success("Creative asset generated");

    expect(received.at(-1)).toEqual(["Enter a valid GitHub owner name", "Creative asset generated"]);
    unsubscribe();
  });
});
