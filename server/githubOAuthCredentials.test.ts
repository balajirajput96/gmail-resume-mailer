import { describe, expect, it } from "vitest";

describe("GitHub OAuth credentials", () => {
  it("are accepted by GitHub before a user authorization code is supplied", async () => {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();
    const response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId!, client_secret: clientSecret!, code: "credential-validation-without-user-code" }) });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { error?: string };
    expect(payload.error).toBe("bad_verification_code");
  }, 20_000);
});
