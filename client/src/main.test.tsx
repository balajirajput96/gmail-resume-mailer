import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("application notifications", () => {
  it("mounts the global toast renderer for mutation feedback", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");

    expect(source).toContain('import { Toaster } from "./components/ui/sonner"');
    expect(source).toContain('<Toaster position="top-right" richColors closeButton />');
  });
});

