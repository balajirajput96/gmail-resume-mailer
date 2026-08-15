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
- [x] Evaluate all available relevant connected services for a safe autonomous source of the required Google Web OAuth client credentials.
- [x] Assess supported background automation options without attempting to fabricate, scrape, or expose OAuth credentials.
- [x] Audit available GitHub, Google/Antigravity, Hugging Face and automation-related integrations without exposing credentials.
- [x] Define a lawful reference-analysis policy for user-owned repositories and explicitly selected public repositories.
- [x] Add secure agent-workspace data models for repository metadata, user-initiated jobs, approvals and execution history.
- [x] Build a GitHub repository inventory and selected-repository analysis workflow.
- [ ] Implement authenticated GitHub inventory for private repositories through a dedicated production server-side OAuth integration when credentials are provisioned.
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

- [ ] Browser-test post-fix Agent Workspace error states for invalid GitHub import input, no-repository planning, and invalid image prompt messaging.

- [ ] Allow a selected repository to be deselected so users can intentionally return to the no-repository planning state.

- [ ] Preserve manual repository deselection instead of auto-selecting the first repository again.

- [ ] Render global toast notifications so Agent Workspace validation and mutation errors are visible to users.

- [ ] Replace non-rendering production Sonner notifications with a tested in-app notification viewport for active workflows.

- [x] Add inline Agent Workspace validation messages as a reliable visible fallback for import, planning, and image errors.
