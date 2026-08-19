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
    expect(source).toContain('import { formatErrorMessage, toast } from "@/lib/notifications";');
    expect(source).toContain("formatErrorMessage(error)");
    expect(source).toContain("current === repository.id ? null : repository.id");
    expect(source).toContain("const [hasInitializedSelection, setHasInitializedSelection] = useState(false);");
    expect(source).toContain("trpc.agent.github.status.useQuery()");
    expect(source).toContain("Connect private GitHub");
  });

  it("exposes official integration setup links without moving secrets into the UI", () => {
    const workspaceSource = readFileSync(resolve(process.cwd(), "client/src/pages/AgentWorkspace.tsx"), "utf8");
    const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    for (const url of [
      "https://github.com/settings/developers",
      "https://console.cloud.google.com/apis/credentials",
      "https://aistudio.google.com/apikey",
      "https://antigravity.google/docs/cli/install",
    ]) expect(workspaceSource).toContain(url);
    expect(homeSource).toContain("https://console.cloud.google.com/apis/library/gmail.googleapis.com");
    expect(workspaceSource).toContain('target="_blank" rel="noreferrer"');
    expect(homeSource).toContain('target="_blank" rel="noreferrer"');
    expect(workspaceSource).toContain("never displays or stores provider secrets in the browser");
    expect(homeSource).toContain("Authorization is retained server-side and never exposed here.");
  });
});
