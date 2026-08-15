import { describe, expect, it } from "vitest";
import { buildEvidenceSummary } from "./agentEvidence";

describe("agent evidence summary", () => {
  it("persists only bounded evidence metadata for a planning job", () => {
    const parsed = JSON.parse(buildEvidenceSummary({
      fileInventory: ["README.md", "package.json", "src"],
      readmeExcerpt: "# Project",
      manifestExcerpt: '{"name":"project"}',
    }));
    expect(parsed).toEqual({ rootFiles: ["README.md", "package.json", "src"], readmeAvailable: true, manifestAvailable: true });
  });
});

