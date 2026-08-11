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
- [ ] Verify mobile and desktop rendering, then checkpoint the completed app.
- [ ] Provide the access link and Google OAuth setup instructions.
- [x] Use only Gmail/Google OAuth, built-in storage, database, user sign-in, and GitHub integrations that are necessary for this application; do not expose unrelated connectors to users.
- [x] Enforce a server-side review-opened marker and require it before the bulk-send confirmation can proceed.
- [x] Add compose loading/error states and explicit accessibility labels for dynamic recipient inputs.
- [x] Add automated coverage for send-session history and recipient-level delivery-status persistence.
