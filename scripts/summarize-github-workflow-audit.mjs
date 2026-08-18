import { readFileSync, writeFileSync } from "node:fs";

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
    const latest = latestByName.get(historical.name);
    const latestOutcome = latest?.conclusion ?? latest?.status ?? "not found";
    const status = latestOutcome === "success"
      ? "Recovered"
      : historical.conclusion === "cancelled" && latestOutcome === "cancelled"
        ? "Canceled dependency automation"
        : "Needs diagnosis";
    return {
      repository: repo.fullName,
      workflow: historical.name,
      historicalConclusion: historical.conclusion,
      historicalCreatedAt: historical.createdAt,
      latestOutcome,
      latestCreatedAt: latest?.createdAt ?? "—",
      status,
      latestUrl: latest?.htmlUrl ?? historical.htmlUrl,
    };
  });
});

const byStatus = {
  recovered: rows.filter(row => row.status === "Recovered"),
  canceled: rows.filter(row => row.status === "Canceled dependency automation"),
  needsDiagnosis: rows.filter(row => row.status === "Needs diagnosis"),
};

const table = entries => entries.length
  ? entries.map(row => `| \`${row.repository}\` | ${row.workflow.replaceAll("|", "\\|")} | ${row.historicalConclusion} | [${row.latestOutcome}](${row.latestUrl}) | ${row.latestCreatedAt} |`).join("\n")
  : "| — | — | — | — | — |";

const markdown = `# GitHub Actions Current Triage — 18 August 2026

The authenticated audit covered **${audit.repositoriesScanned} non-fork, non-archived repositories** and found historical concerning runs in **${audit.repositoriesWithConcerningRuns} repositories**. This report compares each distinct affected workflow with its newest available run of the same workflow name.

| Classification | Workflow count |
|---|---:|
| Recovered through a newer successful run | ${byStatus.recovered.length} |
| Canceled dependency automation run | ${byStatus.canceled.length} |
| Still needs diagnosis | ${byStatus.needsDiagnosis.length} |

## Still Needs Diagnosis

| Repository | Workflow | Historical outcome | Latest outcome | Latest run time |
|---|---|---|---|---|
${table(byStatus.needsDiagnosis)}

## Recovered Workflows

| Repository | Workflow | Historical outcome | Latest outcome | Latest run time |
|---|---|---|---|---|
${table(byStatus.recovered)}

## Canceled Dependency Automation

| Repository | Workflow | Historical outcome | Latest outcome | Latest run time |
|---|---|---|---|---|
${table(byStatus.canceled)}

> Canceled dynamic dependency-update jobs are recorded separately from code failures. They are not altered unless a reproducible workflow configuration issue is evidenced.
`;

writeFileSync(destination, markdown);
console.log(JSON.stringify({
  recovered: byStatus.recovered.length,
  canceled: byStatus.canceled.length,
  needsDiagnosis: byStatus.needsDiagnosis.length,
  output: destination,
}));
