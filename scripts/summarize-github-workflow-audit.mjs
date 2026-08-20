import { readFileSync, writeFileSync } from "node:fs";
import { classifyWorkflowEntry } from "./githubWorkflowTriage.mjs";

const source = "/home/ubuntu/gmail-resume-mailer/docs/github-actions-inventory-2026-08-18.json";
const destination = "/home/ubuntu/gmail-resume-mailer/docs/github-actions-actionable-summary-2026-08-18.md";
const audit = JSON.parse(readFileSync(source, "utf8"));

const rows = audit.repositories.flatMap(repo => {
  const latestByName = new Map(repo.latestRunsByWorkflowName.map(run => [run.name, run]));
  const historicalByName = new Map();
  for (const run of repo.recentConcerningRuns) {
    if (!historicalByName.has(run.name)) historicalByName.set(run.name, run);
  }

  return [...historicalByName.values()].map(historical => {
    const classified = classifyWorkflowEntry(repo, historical, latestByName.get(historical.name));
    const latest = classified.latest;
    return {
      repository: repo.fullName,
      workflow: historical.name,
      historicalConclusion: historical.conclusion,
      latestOutcome: latest?.conclusion ?? latest?.status ?? "not found",
      latestCreatedAt: latest?.createdAt ?? "—",
      latestUrl: latest?.htmlUrl ?? historical.htmlUrl,
      resolution: classified.resolution,
      status: classified.status,
    };
  });
});

const recovered = rows.filter(row => row.status.startsWith("Recovered"));
const canceled = rows.filter(row => row.status === "Canceled dependency automation");
const external = rows.filter(row => row.status.includes("GitHub-managed") || row.status.includes("GitHub dynamic"));
const needsDiagnosis = rows.filter(row => row.status === "Needs diagnosis");

const table = entries => entries.length
  ? entries.map(row => `| \`${row.repository}\` | ${row.workflow.replaceAll("|", "\\|")} | ${row.historicalConclusion} | [${row.latestOutcome}](${row.latestUrl}) | ${row.resolution} |`).join("\n")
  : "| — | — | — | — | — |";

const markdown = `# GitHub Actions Current Triage — 20 August 2026

The authenticated audit covered **${audit.repositoriesScanned} non-fork, non-archived repositories** and classified each historical concern using the newest relevant run plus documented GitHub-managed exceptions.

| Classification | Workflow count |
|---|---:|
| Recovered through a newer successful run | ${recovered.length} |
| Canceled dependency automation run | ${canceled.length} |
| GitHub-managed dynamic or queued event | ${external.length} |
| Still needs diagnosis | ${needsDiagnosis.length} |

## Still Needs Diagnosis

| Repository | Workflow | Historical outcome | Latest outcome | Resolution |
|---|---|---|---|---|
${table(needsDiagnosis)}

## Resolved and Recovered Workflows

| Repository | Workflow | Historical outcome | Latest outcome | Resolution |
|---|---|---|---|---|
${table(recovered)}

## GitHub-managed Dynamic and Dependency Events

| Repository | Workflow | Historical outcome | Latest outcome | Resolution |
|---|---|---|---|---|
${table([...external, ...canceled])}

> A zero count under **Still needs diagnosis** means no reproducible repository-code or workflow configuration failure remains in this audit pass. GitHub-managed dynamic workflow metadata and Dependabot queue events remain monitored but are not altered through unrelated repository changes.
`;

writeFileSync(destination, markdown);
console.log(JSON.stringify({ recovered: recovered.length, canceled: canceled.length, external: external.length, needsDiagnosis: needsDiagnosis.length, output: destination }));
