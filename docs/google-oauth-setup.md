# Gmail OAuth Production Setup

The application implements a server-side Google OAuth 2.0 web flow using the minimum Gmail send scope. The Google Cloud browser session was authenticated on 2026-08-11. The **Gmail API is already enabled** in the selected `stable-device-464409-r7` project. Google Cloud intermittently did not retain the active project selection while opening the newer Google Auth Platform client-creation page, so client credential creation has not yet completed.

Before production email sending can be enabled, a Google Cloud project administrator must select or create a project, enable **Gmail API**, configure the OAuth consent screen, and create a **Web application** OAuth client. The authorized redirect URI must be the deployed app URL followed by `/api/gmail/oauth/callback`.

Store only these values as server-side environment secrets: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, and `GMAIL_OAUTH_REDIRECT_URL`. The source code never exposes OAuth tokens to the browser; OAuth refresh tokens are encrypted before persistence.
