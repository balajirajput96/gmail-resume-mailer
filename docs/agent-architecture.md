# Agent Workspace Architecture

## Product Direction

The workspace will use an **orchestrator with bounded, inspectable jobs** rather than an unrestricted autonomous loop. Each job has a repository scope, requested outcome, generated plan, status, audit log, and an explicit approval boundary before any external write action.

## Patterns Adopted

The design borrows three high-level patterns from workflow and agent platforms without copying their source code:

1. **Orchestrator plus specialized job stages.** An AI planning stage prepares repository analysis or code guidance, then isolated deterministic stages persist results and status.
2. **Human approval at the read/write boundary.** Repository inventory and analysis are read-only. Branch creation, pull request creation, deployment, publishing, email, and external API writes require a separate confirmation.
3. **Execution observability.** Each job stores the user request, scoped repository, plan, output, status transitions, and approval decision.

## Initial Capability Scope

The first production slice focuses on GitHub inventory, repository summary, AI-generated implementation planning, and draft code guidance. It does not silently clone all repositories, commit source changes, invoke external coding agents, publish code, or spend on media generation.

## Implemented Capability Boundaries

| Capability | Implemented behavior | Explicit boundary |
| --- | --- | --- |
| GitHub public inventory | Imports public repository metadata through GitHub’s public API and can inspect a bounded root file inventory, README excerpt, and package manifest excerpt. | Private repository inventory requires a dedicated production GitHub OAuth integration; terminal credentials are never transferred into the application. |
| AI planning | Uses `gpt-5-mini` server-side only for a user-initiated, evidence-informed implementation plan. | Every plan is saved with an approval record and cannot create branches, pull requests, deployments, emails, or external changes. |
| Image assets | Uses GPT Image 2 at medium quality for user-initiated creative assets and stores returned asset URLs in the user-scoped history. | Image calls use project credits and are never scheduled in the background. |
| Antigravity and Jules | Both are authenticated external coding workspaces available to the project owner. | They are not embedded as an unrestricted production backend; any code-changing task must remain explicitly scoped and reviewed. |

Video generation and arbitrary third-party API execution are not added to the published application because they require a separately provisioned provider, cost controls, and an explicit approval boundary.

## Sources

- n8n, “AI Agent Architecture Patterns: From Prototype To Production” — https://blog.n8n.io/ai-agent-architecture-patterns/
- Activepieces, “Why your AI agents need human approval gates” — https://www.activepieces.com/blog/why-your-ai-agents-need-human-approval-gates
- Flowise product overview — https://flowiseai.com/
