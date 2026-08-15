import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicRepositoryEvidence, fetchPublicRepositoryInventory, selectRootFileInventory, validateGitHubOwner, validateGitHubRepository } from "./githubPublic";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("GitHub public inventory validation", () => {
  it("accepts valid owner and repository identifiers", () => {
    expect(validateGitHubOwner("balajirajput96")).toBe("balajirajput96");
    expect(validateGitHubRepository("balajirajput96/gmail-resume-mailer")).toBe("balajirajput96/gmail-resume-mailer");
  });

  it("rejects a path-like owner or repository value", () => {
    expect(() => validateGitHubOwner("../secrets")).toThrow();
    expect(() => validateGitHubRepository("owner/../../etc")).toThrow();
  });

  it("keeps only a bounded, safe root inventory from an API response", () => {
    expect(selectRootFileInventory([{ name: "README.md", type: "file" }, { name: "server", type: "dir" }, { name: 42, type: "file" }, { name: "submodule", type: "submodule" }])).toEqual(["README.md", "server"]);
    expect(selectRootFileInventory({ message: "not an array" })).toEqual([]);
  });

  it("reports a GitHub 404 without exposing response data", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("not found", { status: 404 }));
    await expect(fetchPublicRepositoryInventory("balajirajput96")).rejects.toThrow("GitHub resource was not found");
  });

  it("keeps partial evidence when README and manifest are unavailable", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/contents") && !url.endsWith("package.json")) {
        return Promise.resolve(new Response(JSON.stringify([{ name: "src", type: "dir" }]), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    });
    await expect(fetchPublicRepositoryEvidence("balajirajput96/example")).resolves.toEqual({ fileInventory: ["src"], readmeExcerpt: null, manifestExcerpt: null });
  });
});
