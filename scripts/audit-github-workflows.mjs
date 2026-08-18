import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const owner = "balajirajput96";
const cutoff = new Date("2026-02-18T00:00:00.000Z");
const token = execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function request(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status}`);
  }
  return response.json();
}

async function requestPaginated(path) {
  const allItems = [];
  for (let page = 1; ; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const pageItems = await request(`${path}${separator}per_page=100&page=${page}`);
    allItems.push(...pageItems);
    if (pageItems.length < 100) return allItems;
  }
}

const repositories = await requestPaginated(`/user/repos?affiliation=owner&sort=updated&direction=desc`);
const ownedRepositories = repositories.filter(repo => !repo.fork && !repo.archived);
const conclusionsToReview = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
  "startup_failure",
  "stale",
]);

const results = [];
const concurrency = 5;
for (let index = 0; index < ownedRepositories.length; index += concurrency) {
  const batch = ownedRepositories.slice(index, index + concurrency);
  const batchResults = await Promise.all(
    batch.map(async repo => {
      const data = await request(`/repos/${repo.full_name}/actions/runs?per_page=100`);
      const concerningRuns = data.workflow_runs
        .filter(run => run.created_at && new Date(run.created_at) >= cutoff)
        .filter(run => conclusionsToReview.has(run.conclusion) || run.status === "failure")
        .map(run => ({
          id: run.id,
          name: run.name,
          displayTitle: run.display_title,
          event: run.event,
          status: run.status,
          conclusion: run.conclusion,
          createdAt: run.created_at,
          updatedAt: run.updated_at,
          headBranch: run.head_branch,
          headSha: run.head_sha,
          htmlUrl: run.html_url,
        }));
      const latestRunsByWorkflowName = Object.values(
        data.workflow_runs.reduce((latest, run) => {
          if (!latest[run.name]) latest[run.name] = run;
          return latest;
        }, {}),
      ).map(run => ({
        id: run.id,
        name: run.name,
        event: run.event,
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        headBranch: run.head_branch,
        headSha: run.head_sha,
        htmlUrl: run.html_url,
      }));
      return {
        name: repo.name,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        recentConcerningRuns: concerningRuns,
        latestRunsByWorkflowName,
      };
    }),
  );
  results.push(...batchResults.filter(repo => repo.recentConcerningRuns.length > 0));
}

const output = {
  generatedAt: new Date().toISOString(),
  cutoff: cutoff.toISOString(),
  owner,
  repositoriesScanned: ownedRepositories.length,
  repositoriesWithConcerningRuns: results.length,
  repositories: results,
};

writeFileSync(
  "/home/ubuntu/gmail-resume-mailer/docs/github-actions-inventory-2026-08-18.json",
  `${JSON.stringify(output, null, 2)}\n`,
);

console.log(
  JSON.stringify({
    repositoriesScanned: output.repositoriesScanned,
    repositoriesWithConcerningRuns: output.repositoriesWithConcerningRuns,
    output: "docs/github-actions-inventory-2026-08-18.json",
  }),
);
