import { afterEach, describe, expect, it, vi } from "vitest";
vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-jwt-secret";
  process.env.GITHUB_OAUTH_CLIENT_ID ??= "test-github-client-id";
  process.env.GITHUB_OAUTH_CLIENT_SECRET ??= "test-github-client-secret";
});

import {
  createGitHubOAuthState,
  exchangeGitHubOAuthCode,
  parseGitHubOAuthState,
} from "./githubOAuth";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("GitHub OAuth signed state", () => {
  it("accepts an untampered, unexpired state only", () => {
    const state = createGitHubOAuthState(42);
    expect(parseGitHubOAuthState(state)).toMatchObject({ userId: 42 });
    expect(parseGitHubOAuthState(`${state}tampered`)).toBeNull();

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 11 * 60 * 1000);
    expect(parseGitHubOAuthState(state)).toBeNull();
  });
});

describe("GitHub OAuth code exchange", () => {
  it("sends server credentials only to GitHub and returns an access token", async () => {
    const mockedFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "gho_server_token",
          scope: "repo read:user",
        }),
        { status: 200 }
      )
    );
    global.fetch = mockedFetch as typeof fetch;

    await expect(
      exchangeGitHubOAuthCode(
        "one-time-code",
        "https://app.example/api/github/oauth/callback"
      )
    ).resolves.toEqual({
      access_token: "gho_server_token",
      scope: "repo read:user",
    });
    const options = mockedFetch.mock.calls[0][1] as RequestInit;
    expect(mockedFetch.mock.calls[0][0]).toBe(
      "https://github.com/login/oauth/access_token"
    );
    expect(options.method).toBe("POST");
    expect(String(options.body)).toContain("code=one-time-code");
  });

  it("rejects missing tokens and non-successful exchanges", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "bad_verification_code" }), {
        status: 200,
      })
    ) as typeof fetch;
    await expect(
      exchangeGitHubOAuthCode("bad", "https://app.example/callback")
    ).rejects.toThrow("incomplete");

    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("unavailable", { status: 503 })
      ) as typeof fetch;
    await expect(
      exchangeGitHubOAuthCode("bad", "https://app.example/callback")
    ).rejects.toThrow("exchange failed");
  });
});
