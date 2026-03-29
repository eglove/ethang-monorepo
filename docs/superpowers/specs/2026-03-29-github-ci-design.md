# GitHub CI Workflow Design

**Date:** 2026-03-29
**Status:** Approved

## Goal

A GitHub Actions workflow that gates merges to `master` on passing unit tests (Vitest), lint (ESLint + tsc), and builds across all workspaces in the monorepo.

## Scope

- All workspaces run on every PR (no change-detection filtering)
- No e2e tests in CI (Playwright requires a live wrangler dev server)
- Target branch: `master`

## Trigger

```yaml
on:
  pull_request:
    branches: [master]
  push:
    branches: [master]
```

## Job Structure

```
install ──┬── lint
          ├── test
          └── build
```

`lint`, `test`, and `build` declare `needs: install` and run in parallel once `install` completes.

## Caching Strategy (Option B)

`actions/setup-node@v4` with `cache: 'pnpm'` handles pnpm store caching automatically. Cache key: OS + hash of `pnpm-lock.yaml`. On a cache hit, `pnpm install --frozen-lockfile` in each parallel job resolves in seconds.

`pnpm/action-setup@v4` reads the `packageManager` field from the root `package.json` to install the exact pnpm version (including the current `11.0.0-dev` build).

## Lint `--fix` Handling

The existing lint scripts run `eslint . --fix`. In CI, fixable issues are auto-fixed in the runner and exit 0 — so the committed code would pass without the issues being caught. To close this gap, the `lint` job appends a `git diff --exit-code` step. If ESLint modified any file, the step fails with a dirty-tree error. Developers continue to get `--fix` locally; no script changes required.

## Root Scripts Used

| Job   | Script       | Command            |
|-------|--------------|--------------------|
| test  | `pnpm test`  | `pnpm -r test`     |
| lint  | `pnpm lint`  | `pnpm -r lint`     |
| build | `pnpm build` | `pnpm -r build`    |

Workspaces without a given script are skipped by pnpm's `-r` flag.

## Branch Protection

After the workflow merges, configure **Settings → Branches → master**:

- Require status checks to pass before merging
  - Required checks: `lint`, `test`, `build`
- Require branches to be up to date before merging

The `install` job is not a required check (it is a dependency of the three that are).

## File to Create

`.github/workflows/ci.yml`
