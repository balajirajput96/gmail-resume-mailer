import { describe, expect, it, vi } from "vitest";
import { fetchAuthenticatedGitHubInventory, mapGitHubInventoryRepository } from "./githubPrivate";

describe("authenticated GitHub inventory", () => {
  it("maps private repository metadata without carrying access tokens into records", () => { expect(mapGitHubInventoryRepository({ full_name: "owner/private-repo", html_url: "https://github.com/owner/private-repo", default_branch: "main", private: true, description: "Private work" })).toEqual({ fullName: "owner/private-repo", url: "https://github.com/owner/private-repo", defaultBranch: "main", visibility: "private", description: "Private work" }); });
  it("rejects non-success inventory responses", async () => { vi.stubGlobal("fetch", vi.fn(async () => new Response("forbidden", { status: 403 }))); await expect(fetchAuthenticatedGitHubInventory("server-only-token")).rejects.toThrow("GitHub private repository inventory could not be loaded"); vi.unstubAllGlobals(); });
});
