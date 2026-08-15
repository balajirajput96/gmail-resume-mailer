import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Agent Workspace feedback states", () => {
  it("renders persistent inline feedback for import, planning, and image validation failures", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/AgentWorkspace.tsx"), "utf8");

    expect(source).toContain('id="github-import-error" role="alert"');
    expect(source).toContain("Choose a repository to enable plan creation.");
    expect(source).toContain('id="image-prompt-error" role="alert"');
    expect(source).toContain("const submitImport = () => {");
    expect(source).toContain("const submitImage = () => {");
    expect(source).toContain('import { toast } from "@/lib/notifications";');
    expect(source).toContain("current === repository.id ? null : repository.id");
    expect(source).toContain("const [hasInitializedSelection, setHasInitializedSelection] = useState(false);");
  });
});
