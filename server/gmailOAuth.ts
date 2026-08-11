import crypto from "crypto";
import { parse as parseCookies } from "cookie";
import type { Express, Request } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { getGmailConnection, saveGmailConnection } from "./resumeMailerDb";
import { encryptServerSecret, hasValidSignature, signValue } from "./security";

const STATE_COOKIE = "gmail_oauth_state";
const GMAIL_SCOPES = ["openid", "email", "https://www.googleapis.com/auth/gmail.send"];

function gmailConfig() {
  if (!ENV.gmailClientId || !ENV.gmailClientSecret) throw new Error("Gmail OAuth is not configured");
  return { clientId: ENV.gmailClientId, clientSecret: ENV.gmailClientSecret };
}

function appBaseUrl(req: Request) {
  if (ENV.gmailRedirectUrl) return new URL(ENV.gmailRedirectUrl).origin;
  const protocol = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0] || "https";
  const host = req.get("host");
  if (!host) throw new Error("Application origin is unavailable");
  return `${protocol}://${host}`;
}

function redirectUri(req: Request) {
  return ENV.gmailRedirectUrl || `${appBaseUrl(req)}/api/gmail/oauth/callback`;
}

function createState(userId: number) {
  const payload = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomBytes(24).toString("base64url"), exp: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  return `${payload}.${signValue(payload)}`;
}

function parseState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature || !hasValidSignature(payload, signature)) return null;
  try {
    const result = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: number; nonce?: string; exp?: number };
    if (!Number.isInteger(result.userId) || !result.nonce || !result.exp || result.exp < Date.now()) return null;
    return result as { userId: number; nonce: string; exp: number };
  } catch {
    return null;
  }
}

async function exchangeCode(code: string, redirect: string) {
  const { clientId, clientSecret } = gmailConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  if (!response.ok) throw new Error("OAuth exchange failed");
  const payload = (await response.json()) as { access_token?: string; refresh_token?: string; scope?: string };
  if (!payload.access_token) throw new Error("OAuth response is incomplete");
  return { ...payload, access_token: payload.access_token };
}

async function googleEmail(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error("Google account lookup failed");
  const payload = (await response.json()) as { email?: string; email_verified?: boolean };
  if (!payload.email || payload.email_verified === false) throw new Error("Google email is unavailable");
  return payload.email.toLowerCase();
}

export function registerGmailOAuthRoutes(app: Express) {
  app.get("/api/gmail/oauth/start", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const state = createState(user.id);
      const parsed = parseState(state);
      res.cookie(STATE_COOKIE, parsed?.nonce ?? "", { httpOnly: true, secure: ENV.isProduction, sameSite: "lax", maxAge: 10 * 60 * 1000, path: "/api/gmail/oauth" });
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: gmailConfig().clientId,
        redirect_uri: redirectUri(req),
        response_type: "code",
        scope: GMAIL_SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      }).toString();
      res.redirect(url.toString());
    } catch {
      res.status(503).send("Gmail connection is not configured yet.");
    }
  });

  app.get("/api/gmail/oauth/callback", async (req, res) => {
    const baseUrl = appBaseUrl(req);
    try {
      const state = typeof req.query.state === "string" ? parseState(req.query.state) : null;
      const code = typeof req.query.code === "string" ? req.query.code : null;
      const cookies = parseCookies(req.headers.cookie ?? "");
      if (!state || !code || cookies[STATE_COOKIE] !== state.nonce) throw new Error("OAuth state validation failed");
      const token = await exchangeCode(code, redirectUri(req));
      const existing = await getGmailConnection(state.userId);
      const refreshTokenCiphertext = token.refresh_token ? encryptServerSecret(token.refresh_token) : existing?.refreshTokenCiphertext;
      if (!refreshTokenCiphertext) throw new Error("Google did not return a refresh token");
      await saveGmailConnection({
        userId: state.userId,
        gmailAddress: await googleEmail(token.access_token),
        refreshTokenCiphertext,
        scopes: token.scope || GMAIL_SCOPES.join(" "),
      });
      res.clearCookie(STATE_COOKIE, { path: "/api/gmail/oauth" });
      res.redirect(`${baseUrl}/?gmail=connected`);
    } catch {
      res.clearCookie(STATE_COOKIE, { path: "/api/gmail/oauth" });
      res.redirect(`${baseUrl}/?gmail=error`);
    }
  });
}
