import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Agent Workspace feedback states", () => {
  it("renders persistent inline feedback for import, planning, and image validation failures", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/AgentWorkspace.tsx"),
      "utf8"
    );

    expect(source).toMatch(/id="github-import-error"\s+role="alert"/);
    expect(source).toContain("Choose a repository to enable plan creation.");
    expect(source).toMatch(/id="image-prompt-error"\s+role="alert"/);
    expect(source).toContain("const submitImport = () => {");
    expect(source).toContain("const submitImage = () => {");
    expect(source).toContain(
      'import { formatErrorMessage, toast } from "@/lib/notifications";'
    );
    expect(source).toContain("formatErrorMessage(error)");
    expect(source).toContain(
      "current === repository.id ? null : repository.id"
    );
    expect(source).toContain(
      "const [hasInitializedSelection, setHasInitializedSelection] = useState(false);"
    );
    expect(source).toContain("trpc.agent.github.status.useQuery()");
    expect(source).toContain("Connect private GitHub");
  });

  it("exposes official integration setup links without moving secrets into the UI", () => {
    const workspaceSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/AgentWorkspace.tsx"),
      "utf8"
    );
    const homeSource = readFileSync(
      resolve(process.cwd(), "client/src/pages/Home.tsx"),
      "utf8"
    );
    for (const url of [
      "https://github.com/settings/developers",
      "https://console.cloud.google.com/apis/credentials",
      "https://aistudio.google.com/apikey",
      "https://antigravity.google/docs/cli/install",
    ])
      expect(workspaceSource).toContain(url);
    expect(homeSource).toContain(
      "https://console.cloud.google.com/apis/library/gmail.googleapis.com"
    );
    expect(workspaceSource).toContain('target="_blank"');
    expect(workspaceSource).toContain('rel="noreferrer"');
    expect(homeSource).toContain('target="_blank"');
    expect(homeSource).toContain('rel="noreferrer"');
    expect(workspaceSource).toMatch(
      /terminal and GitHub credentials are never copied into\s+this app\./
    );
    expect(homeSource).toContain(
      "Authorization is retained server-side and never exposed here."
    );
  });
});
