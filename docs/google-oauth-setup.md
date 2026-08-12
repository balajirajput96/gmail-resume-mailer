# Gmail OAuth Production Setup

The application implements a server-side Google OAuth 2.0 web flow using the minimum Gmail send scope. The Google Cloud browser session was authenticated on 2026-08-11. The **Gmail API is already enabled** in the selected `stable-device-464409-r7` project. Google Cloud intermittently did not retain the active project selection while opening the newer Google Auth Platform client-creation page, so client credential creation has not yet completed.

Before production email sending can be enabled, a Google Cloud project administrator must select or create a project, enable **Gmail API**, configure the OAuth consent screen, and create a **Web application** OAuth client. The authorized redirect URI must be the deployed app URL followed by `/api/gmail/oauth/callback`.

Store only these values as server-side environment secrets: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, and `GMAIL_OAUTH_REDIRECT_URL`. The source code never exposes OAuth tokens to the browser; OAuth refresh tokens are encrypted before persistence.

## Current Console Finding

The selected project currently lists one existing **Desktop** OAuth client (`Desktop client 1`). A Desktop client cannot safely serve the published browser redirect flow. A new **Web application** client with the published callback URL is therefore required.

## Autonomous Integration Assessment

The existing Gmail connector can search, read, label, and send messages during an authenticated agent session, but it does not expose a reusable OAuth refresh token or a Web OAuth client secret to this published application. The connector’s own send action also requires interactive confirmation.

The published application therefore cannot safely reuse that connector as a 24x7 backend mail sender. A task-based connector route would require a separately provisioned account-level API credential and would still be inappropriate for high-frequency polling. Repeated background attempts cannot create or recover Google-owned OAuth client credentials, so no 24x7 retry job has been enabled.
