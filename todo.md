# Project TODO

- [x] Define server-side Gmail OAuth without exposing or logging tokens.
- [x] Add schema for Gmail connections, recipient lists, resume uploads, send sessions, and statuses.
- [x] Implement secure PDF and DOCX resume uploads using object storage.
- [x] Implement recipient management with validation and duplicate prevention.
- [x] Implement subject and personalized email-draft composition.
- [x] Require a review-and-confirmation screen before every bulk send.
- [x] Send each confirmed email through Gmail API with the required resume attachment.
- [x] Add send history with recipients, subject, time, and recipient-level statuses.
- [x] Build a premium mobile-first responsive interface with accessible states.
- [x] Add automated tests for authorization, confirmation, attachments, validation, and history.
- [x] Verify mobile and desktop rendering, then checkpoint the completed app.
- [ ] Provide the access link and Google OAuth setup instructions.
- [x] Use only Gmail/Google OAuth, built-in storage, database, user sign-in, and GitHub integrations that are necessary for this application; do not expose unrelated connectors to users.
- [x] Enforce a server-side review-opened marker and require it before the bulk-send confirmation can proceed.
- [x] Add compose loading/error states and explicit accessibility labels for dynamic recipient inputs.
- [x] Add automated coverage for send-session history and recipient-level delivery-status persistence.
- [ ] Configure the Google Web OAuth Client ID and secret as server-side values, then verify the published Gmail connect flow.

- [ ] Replace invalid Gmail OAuth credentials with a valid Google OAuth 2.0 Web client pair when credential setup resumes.
- [x] Evaluate all available relevant connected services for a safe autonomous source of the required Google Web OAuth client credentials.
- [x] Assess supported background automation options without attempting to fabricate, scrape, or expose OAuth credentials.
- [x] Audit available GitHub, Google/Antigravity, Hugging Face and automation-related integrations without exposing credentials.
- [x] Define a lawful reference-analysis policy for user-owned repositories and explicitly selected public repositories.
- [x] Add secure agent-workspace data models for repository metadata, user-initiated jobs, approvals and execution history.
- [x] Build a GitHub repository inventory and selected-repository analysis workflow.
- [ ] Implement authenticated GitHub inventory for private repositories through a dedicated production server-side OAuth integration when credentials are provisioned.

- [ ] Add encrypted server-side GitHub OAuth token storage, connect/callback routes, private inventory import, and regression coverage.
- [x] Upgrade public selected-repository analysis to inspect a bounded root file inventory and safe manifest excerpts, then display evidence-informed findings.
- [x] Add tests for public GitHub analysis helpers, including invalid input and empty/error response behavior.
- [x] Add mocked GitHub fetch tests for non-OK inventory/evidence responses and missing README or package manifest handling.
- [x] Add an automated test that verifies persisted agent job evidence matches bounded repository evidence metadata.
- [x] Add a mocked agent job repository test verifying that plan completion persists evidence metadata in the agent_jobs update.
- [x] Build user-controlled agent job creation with review/approval gates before code changes, publishing or external actions.
- [x] Add a clickable AI-agent workspace UI with repository selection, job controls, status and history.
- [x] Evaluate only relevant free/authorized AI and media integrations; document any credentials or paid-service dependencies instead of embedding keys.
- [x] Re-run validation after final AI/media integration boundary documentation updates.
- [x] Test the agent workspace, publish a checkpoint and push the updated source to the private GitHub repository.
- [x] Browser-test published Agent Workspace repository import, AI plan creation, approval/rejection, image generation, and relevant error states.
- [x] Fix published tRPC mutation authentication so protected Agent Workspace requests include the signed-in session cookie.
- [x] Assess whether a safe, useful scheduled background job is possible without polling or attempting credential recovery.

- [x] Fix production repository inventory import so external GitHub timestamps cannot be persisted as database timestamp values.

- [x] Browser-test post-fix Agent Workspace error states for invalid GitHub import input, no-repository planning, and invalid image prompt messaging.

- [x] Allow a selected repository to be deselected so users can intentionally return to the no-repository planning state.

- [x] Preserve manual repository deselection instead of auto-selecting the first repository again.

- [x] Render global toast notifications so Agent Workspace validation and mutation errors are visible to users.

- [x] Browser-test a published Agent Workspace server mutation failure and confirm its returned error is shown in the in-app notification viewport.

- [x] Normalize structured server validation errors into concise user-facing in-app notification messages.

- [x] Replace non-rendering production Sonner notifications with a tested in-app notification viewport for active workflows.

- [x] Add inline Agent Workspace validation messages as a reliable visible fallback for import, planning, and image errors.

- [x] Audit owned GitHub repositories and recent workflow failures before making any targeted repairs.
- [x] Reproduce, test, and repair the four concrete audited workflow cases without rebasing, force-pushing, or broad unverified edits.

- [x] Fix duplicated pnpm version configuration in automation-control-center-app validation workflow.
- [x] Fix missing Docker image namespace/tag construction in github-mcp-serve build workflow.

- [x] Audit the remaining recent failed GitHub Actions runs in owned repositories and record each final disposition.

- [x] Resolve or document stale queued Dependabot runs in github-dashboard and sellbuilding-ai-agent without modifying application code unnecessarily.

- [x] Document that a canceled stale Dependabot run cannot be restarted by GitHub API and requires a future compatible Dependabot event or workflow dispatch trigger.

- [x] Record a final disposition for every remaining recent workflow failure, including explicit exclusion of upstream fork repositories from direct modification.

- [x] Verify that every reviewed non-fork, non-stale failure either has a newer successful main-branch run or a dedicated audited recovery action.

- [x] Re-inventory all recent failed GitHub Actions runs in user-owned repositories and exclude upstream forks from direct modification.
- [x] Diagnose and repair each reproducible owned-repository workflow failure without rebasing or force-pushing.
- [x] Trigger or monitor replacement workflow runs and record verification status for every repaired workflow.
- [ ] Keep Gmail Web OAuth credential validation deferred until the user resumes that setup.

- [x] Replace the daily job scanner's rebase-based push retry with a rebase-free artifact snapshot and retry strategy.
- [ ] Recheck GitHub-managed queued Dependabot events in gmail-resume-mailer and pharma-qa-job-tracker when GitHub scheduler capacity advances.
