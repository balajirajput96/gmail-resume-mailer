import { beforeEach, describe, expect, it, vi } from "vitest";
vi.hoisted(() => {
  process.env.JWT_SECRET ??= "test-jwt-secret";
});

import { decryptServerSecret, encryptServerSecret } from "./security";

const state = vi.hoisted(() => ({
  row: undefined as Record<string, unknown> | undefined,
  inserted: [] as Record<string, unknown>[],
}));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (state.row ? [state.row] : []) }),
      }),
    }),
    insert: () => ({
      values: (input: Record<string, unknown>) => ({
        onDuplicateKeyUpdate: async () => {
          state.inserted.push(input);
          state.row = input;
        },
      }),
    }),
  })),
}));

import { getGitHubConnection, saveGitHubConnection } from "./githubOAuthDb";

beforeEach(() => {
  state.row = undefined;
  state.inserted = [];
});

describe("GitHub OAuth encrypted persistence", () => {
  it("stores an encrypted access token and returns the connection without plaintext storage", async () => {
    const token = "gho_private_access_token";
    const accessTokenCiphertext = encryptServerSecret(token);
    await saveGitHubConnection({
      userId: 7,
      githubLogin: "balajirajput96",
      accessTokenCiphertext,
      scopes: "repo read:user",
    });

    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0].accessTokenCiphertext).toBe(accessTokenCiphertext);
    expect(String(state.inserted[0].accessTokenCiphertext)).not.toContain(
      token
    );
    expect(decryptServerSecret(accessTokenCiphertext)).toBe(token);
    await expect(getGitHubConnection(7)).resolves.toMatchObject({
      userId: 7,
      githubLogin: "balajirajput96",
      accessTokenCiphertext,
    });
  });
});
