import { describe, expect, it } from "vitest";
import { classifyWorkflowEntry } from "./githubWorkflowTriage.mjs";

const run = (name, conclusion = "success") => ({ name, conclusion, htmlUrl: "https://example.test/run", createdAt: "2026-08-20T00:00:00Z" });

describe("classifyWorkflowEntry", () => {
  it("recognizes renamed workflow replacements", () => {
    const repo = { fullName: "balajirajput96/ai-automation-platform", latestRunsByWorkflowName: [run("Verify AstraFlow")] };
    const result = classifyWorkflowEntry(repo, { name: ".github/workflows/ci.yml", conclusion: "failure" });
    expect(result.status).toBe("Recovered by renamed workflow");
    expect(result.latest.name).toBe("Verify AstraFlow");
  });

  it("keeps dynamic GitHub workflows out of repository-code failure remediation", () => {
    const repo = { fullName: "balajirajput96/vscode-copilot-cha", latestRunsByWorkflowName: [] };
    const result = classifyWorkflowEntry(repo, { name: "Running Copilot cloud agent", conclusion: "failure" });
    expect(result.status).toBe("GitHub dynamic workflow unavailable");
  });
});
