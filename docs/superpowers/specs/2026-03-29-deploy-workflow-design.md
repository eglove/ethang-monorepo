# Deploy Workflow Design

**Date:** 2026-03-29
**Topic:** GitHub CI deploy workflow on merge to master

## Overview

Add a new `.github/workflows/deploy.yml` that automatically builds and deploys all apps that have a `deploy` script whenever a branch merges into `master`.

## Trigger

```yaml
on:
  push:
    branches: [master]
```

PR builds are already handled by `ci.yml`. This workflow only runs after a merge.

## Job Structure

A single `deploy` job uses a matrix strategy with `fail-fast: false` so each app deploys independently — a failure in one does not cancel the others.

**Matrix apps (all currently have a `deploy` script):**
- `ethang-hono`
- `sterett-hono`
- `auth`
- `url-shortener`
- `sanity-calendar-sync`
- `ethang-admin`

## Steps (per matrix entry)

1. `actions/checkout` — pinned SHA matching `ci.yml`
2. `pnpm/action-setup` — pinned SHA matching `ci.yml`
3. `actions/setup-node` (Node 24, pnpm cache) — pinned SHA matching `ci.yml`
4. `pnpm install --frozen-lockfile`
5. `pnpm --filter ${{ matrix.app }} deploy`

`bun` is a root devDependency so it is available on PATH after install. No additional setup step is needed for apps whose deploy scripts invoke `bun` directly (`ethang-hono`, `sterett-hono`).

## Secrets

Two repository secrets must be added under **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Used by |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | All wrangler-based apps (5 apps) |
| `SANITY_AUTH_TOKEN` | `ethang-admin` (`sanity deploy`) |

Both are exposed at the job level via `env:` so all matrix entries receive them.

## Adding New Deployable Apps

When a new app gains a `deploy` script, add its package name to the matrix list. No other changes required.

## File to Create

- `.github/workflows/deploy.yml`
