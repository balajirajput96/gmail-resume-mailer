import type { GmailConnection } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { decryptServerSecret } from "./security";

function gmailClientConfig() {
  if (!ENV.gmailClientId || !ENV.gmailClientSecret) throw new Error("Gmail OAuth is not configured");
  return { clientId: ENV.gmailClientId, clientSecret: ENV.gmailClientSecret };
}

export async function getGmailAccessToken(connection: GmailConnection) {
  const { clientId, clientSecret } = gmailClientConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptServerSecret(connection.refreshTokenCiphertext),
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error("Gmail authorization needs to be reconnected");
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("Gmail authorization needs to be reconnected");
  return payload.access_token;
}

export async function sendRawGmailMessage(accessToken: string, raw: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!response.ok) return { ok: false as const, failureCode: response.status === 401 ? "authorization_expired" : "gmail_send_failed" };
  const payload = (await response.json()) as { id?: string };
  return payload.id ? { ok: true as const, messageId: payload.id } : { ok: false as const, failureCode: "gmail_send_failed" };
}
