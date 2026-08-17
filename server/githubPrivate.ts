export type GitHubInventoryRepository = { fullName: string; url: string; defaultBranch: string; visibility: "public" | "private" | "internal"; description: string | null };
type GitHubApiRepository = { full_name?: string; html_url?: string; default_branch?: string; private?: boolean; visibility?: string; description?: string | null };

export function mapGitHubInventoryRepository(repository: GitHubApiRepository): GitHubInventoryRepository {
  if (!repository.full_name || !repository.html_url) throw new Error("GitHub returned incomplete repository data");
  return {
    fullName: repository.full_name,
    url: repository.html_url,
    defaultBranch: repository.default_branch || "main",
    visibility: repository.visibility === "internal" ? "internal" : repository.private ? "private" : "public",
    description: repository.description ?? null,
  };
}

export async function fetchAuthenticatedGitHubInventory(accessToken: string) {
  const response = await fetch("https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&visibility=all&per_page=100&sort=updated", { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}`, "X-GitHub-Api-Version": "2022-11-28" } });
  if (!response.ok) throw new Error("GitHub private repository inventory could not be loaded");
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("GitHub returned an invalid repository inventory");
  return payload.map(mapGitHubInventoryRepository);
}

export async function fetchGitHubLogin(accessToken: string) {
  const response = await fetch("https://api.github.com/user", { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}`, "X-GitHub-Api-Version": "2022-11-28" } });
  if (!response.ok) throw new Error("GitHub account lookup failed");
  const payload = await response.json() as { login?: string };
  if (!payload.login) throw new Error("GitHub account login is unavailable");
  return payload.login;
}
