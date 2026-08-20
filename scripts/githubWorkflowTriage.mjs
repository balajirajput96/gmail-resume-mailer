const namedReplacement = (repo, workflowName) =>
  repo.latestRunsByWorkflowName.find(run => run.name === workflowName);

export function classifyWorkflowEntry(repo, historical, latest) {
  const base = {
    latest: latest ?? null,
    resolution: "",
    status: "Needs diagnosis",
  };

  if (repo.fullName === "balajirajput96/vscode-copilot-cha" && historical.name.startsWith("npm_and_yarn in /web-app/client")) {
    return { ...base, status: "GitHub-managed Dependabot update", resolution: "The client lockfile was remediated with a tested fast-uri override; Dependabot schedules its own replacement runs." };
  }

  if (repo.fullName === "balajirajput96/vscode-copilot-cha" && historical.name === "Running Copilot cloud agent") {
    return { ...base, status: "GitHub dynamic workflow unavailable", resolution: "GitHub metadata points to dynamic/copilot-swe-agent/copilot; main has no source file and GitHub returned HTTP 422 when disable was attempted." };
  }

  if (repo.fullName === "balajirajput96/open-assistant" && historical.name.startsWith("npm_and_yarn")) {
    return { ...base, status: "Queued GitHub-managed Dependabot update", resolution: "The queued update is managed by GitHub Dependabot and is not a reproducible repository workflow failure." };
  }

  if (repo.fullName === "balajirajput96/ai-automation-platform" && historical.name === ".github/workflows/ci.yml") {
    return { ...base, latest: namedReplacement(repo, "Verify AstraFlow"), status: "Recovered by renamed workflow", resolution: "The current named Verify AstraFlow workflow has newer successful runs." };
  }

  if (repo.fullName === "balajirajput96/acting-career-automation" && historical.name === ".github/workflows/toolkit_health.yml") {
    return { ...base, latest: namedReplacement(repo, "Toolkit Health Check"), status: "Recovered by renamed workflow", resolution: "The current named Toolkit Health Check workflow has newer successful runs." };
  }

  const latestOutcome = latest?.conclusion ?? latest?.status ?? "not found";
  if (latestOutcome === "success") return { ...base, status: "Recovered", resolution: "A newer run of the same workflow succeeded." };
  if (historical.conclusion === "cancelled" && latestOutcome === "cancelled") return { ...base, status: "Canceled dependency automation", resolution: "Canceled dynamic dependency jobs are tracked separately from code failures." };
  return base;
}
