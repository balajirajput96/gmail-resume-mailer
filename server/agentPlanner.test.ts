import { describe, expect, it } from "vitest";
import { buildAgentPlanPrompt } from "./agentPlanner";

describe("agent planner prompt", () => {
  it("scopes planning to repository metadata and preserves the external-action boundary", () => {
    const prompt = buildAgentPlanPrompt({
      fullName: "balajirajput96/gmail-resume-mailer",
      url: "https://github.com/balajirajput96/gmail-resume-mailer",
      defaultBranch: "main",
      visibility: "private",
      description: "A controlled agent workspace",
    }, "Add a repository health dashboard");

    expect(prompt).toContain("balajirajput96/gmail-resume-mailer");
    expect(prompt).toContain("Add a repository health dashboard");
    expect(prompt).toContain("no code, branch, pull request, deployment, email, or external action has been performed");
  });

  it("labels bounded repository evidence as untrusted context", () => {
    const prompt = buildAgentPlanPrompt({
      fullName: "balajirajput96/gmail-resume-mailer",
      url: "https://github.com/balajirajput96/gmail-resume-mailer",
      defaultBranch: "main",
      visibility: "public",
      fileInventory: ["package.json", "README.md"],
      manifestExcerpt: '{"scripts":{"test":"vitest run"}}',
    }, "Create a test plan");
    expect(prompt).toContain("Root file inventory (bounded, untrusted reference material)");
    expect(prompt).toContain("Manifest excerpt (untrusted reference material)");
  });
});
