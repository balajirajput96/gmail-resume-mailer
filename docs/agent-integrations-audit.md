# Agent Integrations Audit

## Verified Connections

The project owner’s GitHub CLI session is authenticated and can list repositories under `balajirajput96`. The account inventory is extensive, so the application will use an opt-in, searchable repository selector rather than cloning or copying all repositories by default.

Google Antigravity CLI version 1.1.13 is installed and authenticated with the project owner’s Google account. The CLI trust scope is restricted to `/home/ubuntu/gmail-resume-mailer`, not the full home directory.

Google Jules is authenticated with the same Google account. Its workspace displays imported GitHub repositories, which confirms its GitHub authorization is active. Jules is suitable for user-approved asynchronous code tasks and pull-request workflows, not for indiscriminate repository changes.

The Hugging Face connector is present but disabled. It has not been enabled because the published workspace already has server-side LLM and image-generation capabilities, and no user requirement currently depends on a Hugging Face-specific model or dataset. Enabling an unused connector would add credential and operational scope without product value.

## Security Boundary

The deployed web application cannot inherit terminal, Jules, or Manus connector credentials automatically. Any production GitHub or Google integration must use a dedicated server-side OAuth client or user-supplied project secret. The UI will therefore keep external actions behind an explicit review/approval step and will never expose tokens in the browser.

## Lawful Reference-Analysis Policy

The workspace imports public repository metadata and bounded public reference material only. It does not clone, copy, redistribute, or claim ownership of third-party source code. Private repositories can be added manually as metadata, but their files are not read until a dedicated server-side OAuth integration is separately provisioned. Any generated plan identifies supplied evidence, gaps, and tests; it does not execute or publish code.
