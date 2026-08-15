import { describe, expect, it } from "vitest";
import { normalizeImagePrompt } from "./agentMedia";

describe("agent image prompt validation", () => {
  it("trims a valid prompt", () => {
    expect(normalizeImagePrompt("  a refined editorial product hero image  ")).toBe("a refined editorial product hero image");
  });

  it("rejects empty, short, and overly long prompts", () => {
    expect(() => normalizeImagePrompt("too short")).toThrow();
    expect(() => normalizeImagePrompt("x".repeat(2_001))).toThrow();
  });
});
