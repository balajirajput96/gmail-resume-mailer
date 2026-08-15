import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

describe("session cookie options", () => {
  it("always uses a secure SameSite=None cookie for managed deployment hosts", () => {
    const options = getSessionCookieOptions({ hostname: "gmailresume-8yxz3tt7.manus.space", protocol: "http", headers: {} } as any);
    expect(options).toMatchObject({ httpOnly: true, path: "/", sameSite: "none", secure: true });
  });

  it("does not force the secure flag for a plain local HTTP request", () => {
    const options = getSessionCookieOptions({ hostname: "localhost", protocol: "http", headers: {} } as any);
    expect(options.secure).toBe(false);
  });
});

