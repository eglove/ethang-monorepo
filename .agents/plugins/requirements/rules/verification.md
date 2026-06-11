---
trigger: model_decision
description: running tests, builds, or lint in this monorepo
---

# Verification Commands

How to build, test, and lint in this monorepo (pnpm workspaces; Bun runs build scripts).

## Whole repo (from the root)

| Goal | Command |
|---|---|
| Build everything | `pnpm build` (fans out to `pnpm -r build`) |
| Test everything | `pnpm test` (fans out to `pnpm -r test`) |
| Lint everything | `pnpm lint` (fans out to `pnpm -r lint`) |
| Full health sweep | `./repo-check.ps1` (cf-typegen, build, test, lint, dedupe, store prune) |

## Single package

| Goal | Command |
|---|---|
| Test one package | `pnpm --filter <package-name> test` (runs `vitest run --coverage`) |
| Watch mode | `pnpm --filter <package-name> exec vitest` |
| One test file | `pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage` |
| Build one package | `pnpm --filter <package-name> build` (runs `bun build.ts`) |
| Lint one package | `pnpm --filter <package-name> lint` (runs `eslint . --fix && pnpm tsc --noEmit`) |

## Cloudflare Workers apps

- Local dev server: `pnpm --filter <app-name> dev` (wrangler).
- Regenerate Worker types after wrangler.jsonc changes: `pnpm -r cf-typegen`.

## Rules of engagement

- Run the narrowest command that answers your question, but always finish a change by running the affected package's full `test` and `lint`.
- Coverage thresholds auto-ratchet (`autoUpdate: true`); never lower them by hand.
- Lint must produce no diff — CI runs `eslint --fix` and fails on `git diff --exit-code`.
