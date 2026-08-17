# GitHub Actions Audit — 17 August 2026

This audit reviewed each owner-account repository with a recent failed GitHub Actions run. The review intentionally avoids rebases, force-pushes, and unverified edits. Forks are excluded from direct modification because their upstream code and workflow policy are outside this workspace’s change scope.

| Repository | Observed recent failure | Final disposition |
|---|---|---|
| `acting-career-automation` | Follow-up reminder run | A newer Toolkit Health Check run completed successfully on `main`; no code repair required. |
| `automation-control-center-app` | Duplicate pnpm version configuration | The current branch contains the version-resolution repair. A fresh manual health workflow run completed successfully. |
| `codex` | `blocking-ci` | Fork; excluded from direct modification. |
| `daily-research-reels-automation` | Daily research reel run | A newer main-branch run completed successfully; no code repair required. |
| `github-dashboard` | Validation run | The current outstanding run was a stale queued Dependabot job. It was canceled; GitHub does not permit rerunning that canceled Dependabot event. |
| `github-mcp-serve` | Docker invalid image tag | The failure occurred before the current workflow fix. A newer run on the current main commit completed successfully. |
| `github-mcp-server-` | Secret scanning | A newer dependency-update workflow completed successfully; no code repair required. |
| `hub-docs` | Comment-trigger workflow | Fork; excluded from direct modification. |
| `microsoft-365-agents-toolkit` | PR comment workflow | Fork; excluded from direct modification. |
| `open-gpu-kernel-modules` | Build and deploy | Fork; excluded from direct modification. |
| `RxLifecycle` | Android CI | Fork; excluded from direct modification. |
| `sellbuilding-ai-agent` | Validation run | The newer item was a stale queued Dependabot job. It was canceled; no application-code fault was evidenced. |
| `supabase-kt` | Dependency update | Fork; excluded from direct modification. |
| `vscode-copilot-cha` | Daily Pharma Job Scan | A newer main-branch run completed successfully; no code repair required. |
| `vscode-copilot-chat` | PR checks | Fork; excluded from direct modification. |

> A canceled Dependabot run does not expose a workflow-dispatch trigger and cannot be restarted through the GitHub Actions API. A later compatible Dependabot event or a workflow redesign with `workflow_dispatch` is required to create a replacement run.
