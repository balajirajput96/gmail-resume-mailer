import crypto from "crypto";
import { parse as parseCookies } from "cookie";
import type { Express, Request } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { fetchGitHubLogin } from "./githubPrivate";
import { getGitHubConnection, saveGitHubConnection } from "./githubOAuthDb";
import { encryptServerSecret, hasValidSignature, signValue } from "./security";

const STATE_COOKIE = "github_oauth_state";
const GITHUB_SCOPES = ["repo", "read:user"];
function config() { if (!ENV.githubClientId || !ENV.githubClientSecret) throw new Error("GitHub OAuth is not configured"); return { clientId: ENV.githubClientId, clientSecret: ENV.githubClientSecret }; }
function appBaseUrl(req: Request) { if (ENV.githubRedirectUrl) return new URL(ENV.githubRedirectUrl).origin; const protocol = String(req.headers["x-forwarded-proto"] ?? req.protocol).split(",")[0] || "https"; const host = req.get("host"); if (!host) throw new Error("Application origin is unavailable"); return `${protocol}://${host}`; }
function redirectUri(req: Request) { return ENV.githubRedirectUrl || `${appBaseUrl(req)}/api/github/oauth/callback`; }
export function createGitHubOAuthState(userId: number) { const payload = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomBytes(24).toString("base64url"), exp: Date.now() + 10 * 60 * 1000 })).toString("base64url"); return `${payload}.${signValue(payload)}`; }
export function parseGitHubOAuthState(value: string) { const [payload, signature] = value.split("."); if (!payload || !signature || !hasValidSignature(payload, signature)) return null; try { const state = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: number; nonce?: string; exp?: number }; return Number.isInteger(state.userId) && state.nonce && state.exp && state.exp >= Date.now() ? state as { userId: number; nonce: string; exp: number } : null; } catch { return null; } }
export async function exchangeGitHubOAuthCode(code: string, redirect: string) { const { clientId, clientSecret } = config(); const response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirect }) }); if (!response.ok) throw new Error("GitHub OAuth exchange failed"); const payload = await response.json() as { access_token?: string; scope?: string; error?: string }; if (!payload.access_token || payload.error) throw new Error("GitHub OAuth response is incomplete"); return payload; }

export function registerGitHubOAuthRoutes(app: Express) {
  app.get("/api/github/oauth/start", async (req, res) => {
    let clientId: string;
    try { ({ clientId } = config()); } catch { res.status(503).send("GitHub connection is not configured yet."); return; }
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
    try { user = await sdk.authenticateRequest(req); } catch { res.status(401).send("Sign in is required before connecting GitHub."); return; }
    try {
      const state = createGitHubOAuthState(user.id);
      const parsed = parseGitHubOAuthState(state);
      res.cookie(STATE_COOKIE, parsed?.nonce ?? "", { httpOnly: true, secure: ENV.isProduction, sameSite: "lax", maxAge: 10 * 60 * 1000, path: "/api/github/oauth" });
      const url = new URL("https://github.com/login/oauth/authorize");
      url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri(req), scope: GITHUB_SCOPES.join(" "), state }).toString();
      res.redirect(url.toString());
    } catch { res.status(503).send("GitHub connection could not be started."); }
  });
  app.get("/api/github/oauth/callback", async (req, res) => { const baseUrl = appBaseUrl(req); try { const state = typeof req.query.state === "string" ? parseGitHubOAuthState(req.query.state) : null; const code = typeof req.query.code === "string" ? req.query.code : null; const cookies = parseCookies(req.headers.cookie ?? ""); if (!state || !code || cookies[STATE_COOKIE] !== state.nonce) throw new Error("OAuth state validation failed"); const token = await exchangeGitHubOAuthCode(code, redirectUri(req)); const accessToken = token.access_token; if (!accessToken) throw new Error("GitHub OAuth response is incomplete"); await saveGitHubConnection({ userId: state.userId, githubLogin: await fetchGitHubLogin(accessToken), accessTokenCiphertext: encryptServerSecret(accessToken), scopes: token.scope || GITHUB_SCOPES.join(" ") }); res.clearCookie(STATE_COOKIE, { path: "/api/github/oauth" }); res.redirect(`${baseUrl}/?github=connected`); } catch { res.clearCookie(STATE_COOKIE, { path: "/api/github/oauth" }); res.redirect(`${baseUrl}/?github=error`); } });
}
