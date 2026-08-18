import { describe, expect, it } from "vitest";

const tokenEndpoint = "https://oauth2.googleapis.com/token";

describe("Google Web OAuth credential configuration", () => {
  it("accepts the configured client pair before Gmail consent begins", async () => {
    const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_OAUTH_REDIRECT_URL;

    expect(clientId).toMatch(/^[\w-]+\.apps\.googleusercontent\.com$/);
    expect(clientSecret).toBeTruthy();
    expect(redirectUri).toMatch(/^https:\/\//);

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: "credential-validation-code-not-issued",
        grant_type: "authorization_code",
        redirect_uri: redirectUri!,
      }),
    });

    const payload = (await response.json()) as { error?: string };

    // Google returns invalid_grant after it has authenticated a valid client pair
    // but rejects the intentionally non-issued authorization code.
    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_grant");
  });
});
