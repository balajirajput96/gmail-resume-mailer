# Dependency Security Triage — 19 August 2026

The stable application lockfile was reviewed with the package manager’s advisory report. The report includes vulnerable transitive packages beneath `streamdown`, `vite`, `@tailwindcss/vite`, and Express-related dependencies, including `tar`, `dompurify`, `mermaid`, `qs`, `fast-xml-parser`, and `esbuild`.

| Classification | Finding | Decision |
|---|---|---|
| Broad automated update | The package manager’s automatic security update rewrote a large portion of the dependency graph, including Vite, Vitest, esbuild, tRPC, and other transitive packages. | Rejected. This exceeds a minimal security patch and changed runtime resolution behavior. |
| Runtime compatibility risk | The broad update resolved `path-to-regexp` incompatibly with the current Express 4 runtime, producing `TypeError: pathRegexp is not a function` during server startup. | Restored the verified lockfile and reinstalled dependencies from it. The server now starts successfully, with 31 passing tests and a clean TypeScript check. |
| Candidate targeted updates | The vulnerable packages are mostly transitive. Any patch must be made through the owning direct dependency or a compatibility-tested scoped override. | Deferred until each candidate can be changed individually, tested with the complete suite, and validated by server startup. No global override is permitted. |

> The security report is evidence for future package work, not permission to replace the production dependency graph in bulk. Stability of the Gmail sending safeguards and server-side GitHub OAuth takes priority over an untested transitive dependency rewrite.
