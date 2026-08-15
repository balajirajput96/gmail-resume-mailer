const ownerPattern = /^[A-Za-z0-9-]{1,39}$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export type PublicRepository = {
  fullName: string;
  url: string;
  defaultBranch: string;
  visibility: "public";
  description: string | null;
  language: string | null;
  updatedAt: string | null;
};

export type PublicRepositoryEvidence = {
  fileInventory: string[];
  readmeExcerpt: string | null;
  manifestExcerpt: string | null;
};

export function validateGitHubOwner(owner: string) {
  if (!ownerPattern.test(owner)) throw new Error("Enter a valid GitHub owner name");
  return owner;
}

export function validateGitHubRepository(fullName: string) {
  if (!repositoryPattern.test(fullName)) throw new Error("Repository must use owner/repository format");
  return fullName;
}

export function selectRootFileInventory(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .filter(entry => entry.type === "file" || entry.type === "dir")
    .map(entry => typeof entry.name === "string" ? entry.name : "")
    .filter(Boolean)
    .slice(0, 80);
}

async function githubFetch(path: string, accept = "application/vnd.github+json") {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      "User-Agent": "agent-workspace",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(response.status === 404 ? "GitHub resource was not found" : "GitHub public API request failed");
  return response;
}

export async function fetchPublicRepositoryInventory(owner: string): Promise<PublicRepository[]> {
  const safeOwner = validateGitHubOwner(owner);
  const response = await githubFetch(`/users/${encodeURIComponent(safeOwner)}/repos?per_page=100&sort=updated`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows
    .filter(row => typeof row.full_name === "string" && typeof row.html_url === "string")
    .map(row => ({
      fullName: String(row.full_name),
      url: String(row.html_url),
      defaultBranch: typeof row.default_branch === "string" ? row.default_branch : "main",
      visibility: "public" as const,
      description: typeof row.description === "string" ? row.description : null,
      language: typeof row.language === "string" ? row.language : null,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    }));
}

export async function fetchPublicReadmeExcerpt(fullName: string) {
  const safeFullName = validateGitHubRepository(fullName);
  const response = await githubFetch(`/repos/${safeFullName}/readme`, "application/vnd.github.raw+json");
  const text = await response.text();
  return text.slice(0, 16_000);
}

export async function fetchPublicRepositoryEvidence(fullName: string): Promise<PublicRepositoryEvidence> {
  const safeFullName = validateGitHubRepository(fullName);
  const contentResponse = await githubFetch(`/repos/${safeFullName}/contents`);
  const fileInventory = selectRootFileInventory(await contentResponse.json());
  const [readmeResult, manifestResult] = await Promise.allSettled([
    fetchPublicReadmeExcerpt(safeFullName),
    fileInventory.includes("package.json")
      ? githubFetch(`/repos/${safeFullName}/contents/package.json`, "application/vnd.github.raw+json").then(response => response.text()).then(text => text.slice(0, 12_000))
      : Promise.resolve(null),
  ]);
  return {
    fileInventory,
    readmeExcerpt: readmeResult.status === "fulfilled" ? readmeResult.value : null,
    manifestExcerpt: manifestResult.status === "fulfilled" ? manifestResult.value : null,
  };
}
