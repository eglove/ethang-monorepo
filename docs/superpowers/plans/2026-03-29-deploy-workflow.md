# Deploy Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `.github/workflows/deploy.yml` that builds and deploys all apps with a `deploy` script whenever a commit lands on `master`.

**Architecture:** A single workflow file with one matrix job (`fail-fast: false`) that runs `pnpm --filter <app> deploy` for each of the 6 deployable apps in parallel. Secrets are exposed at the job level so every matrix entry receives them.

**Tech Stack:** GitHub Actions, pnpm, wrangler (Cloudflare Workers), Sanity CLI

---

### Task 1: Create the deploy workflow file

**Files:**
- Create: `.github/workflows/deploy.yml`

> Note: This is a workflow file, not application code — there is no unit test to write. Verification is done by validating the YAML syntax locally before committing.

- [ ] **Step 1: Verify `actionlint` or `yamllint` is available (or skip to step 2)**

Run:
```bash
yamllint --version
```
If not installed, skip linting — GitHub's own parser will catch syntax errors on push.

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [master]

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        app:
          - ethang-hono
          - sterett-hono
          - auth
          - url-shortener
          - sanity-calendar-sync
          - ethang-admin
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4
      - uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1  # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4
        with:
          node-version: '24'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ${{ matrix.app }} deploy
```

- [ ] **Step 3: Verify YAML is well-formed**

Run:
```bash
cat .github/workflows/deploy.yml
```
Expected: file prints without error, indentation looks correct, no tabs (GitHub Actions requires spaces).

- [ ] **Step 4: Confirm the 6 apps in the matrix each have a `deploy` script**

Run:
```bash
grep -r '"deploy"' apps/*/package.json
```
Expected output (6 matches):
```
apps/auth/package.json:    "deploy": ...
apps/ethang-admin/package.json:    "deploy": ...
apps/ethang-hono/package.json:    "deploy": ...
apps/sanity-calendar-sync/package.json:    "deploy": ...
apps/sterett-hono/package.json:    "deploy": ...
apps/url-shortener/package.json:    "deploy": ...
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add deploy workflow for apps with deploy scripts"
```

- [ ] **Step 6: Verify the workflow appears in GitHub Actions**

Push to master (or open a PR targeting master, merge it), then visit:
`https://github.com/<owner>/ethang-monorepo/actions`

Expected: a "Deploy" workflow run appears, with 6 parallel matrix jobs. Confirm each job reaches the deploy step. Any `wrangler: error` or `sanity: error` at this point indicates a missing or incorrect secret — check **Settings → Secrets and variables → Actions** and confirm `CLOUDFLARE_API_TOKEN` and `SANITY_AUTH_TOKEN` are set.
