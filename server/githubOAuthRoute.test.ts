import { describe, expect, it, vi } from "vitest";
import type { Express, Request, Response } from "express";

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn().mockRejectedValue(new Error("unauthenticated")) } }));
vi.mock("./githubOAuthDb", () => ({ getGitHubConnection: vi.fn(), saveGitHubConnection: vi.fn() }));
vi.mock("./githubPrivate", () => ({ fetchGitHubLogin: vi.fn() }));

import { registerGitHubOAuthRoutes } from "./githubOAuth";

describe("GitHub OAuth start route", () => {
  it("returns an explicit authentication response when server OAuth configuration exists", async () => {
    const handlers = new Map<string, (req: Request, res: Response) => Promise<void>>();
    const app = { get: vi.fn((path: string, registeredHandler: (req: Request, res: Response) => Promise<void>) => { handlers.set(path, registeredHandler); }) } as unknown as Express;
    const response = { status: vi.fn(), send: vi.fn() };
    response.status.mockReturnValue(response);
    registerGitHubOAuthRoutes(app);
    await handlers.get("/api/github/oauth/start")?.({} as Request, response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith("Sign in is required before connecting GitHub.");
  });
});
