# Design: Vitest Coverage Reporting to SonarCloud

**Date:** 2026-03-29
**Branch:** feature/vitest-sonarcloud-coverage (worktree)

## Overview

Wire Vitest unit test coverage from all packages/apps that have a `test` script into SonarCloud, using a centralized `sonar-project.properties` file and a dedicated CI job.

## Scope

8 packages/apps in the monorepo have a `test` script:

| Package | Has vitest config? | Has coverage? |
|---|---|---|
| apps/ethang-hono | yes | yes (thresholds set) |
| apps/sterett-hono | yes | yes (thresholds set) |
| apps/url-shortener | yes | yes (no thresholds) |
| packages/eslint-config | yes | yes (thresholds set) |
| packages/leetcode | no | no |
| packages/markdown-generator | no | no |
| packages/store | no | no |
| packages/toolbelt | no | no |

## Section 1: Vitest Coverage Changes

### Packages with existing coverage config

Add `"lcov"` to the `reporter` array in the vitest config for:
- `apps/ethang-hono/vitest.config.ts`
- `apps/sterett-hono/vitest.config.ts`
- `apps/url-shortener/vitest.config.ts`
- `packages/eslint-config/vitest.config.ts`

All other settings (thresholds, includes, excludes) remain unchanged.

### Packages without vitest config

Create `vitest.config.ts` for each of: `packages/leetcode`, `packages/markdown-generator`, `packages/store`, `packages/toolbelt`.

Each config follows this template:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  },
});
```

Update each package's `test` script to include `--coverage`:

```json
"test": "vitest run --coverage"
```

## Section 2: sonar-project.properties

Create a `sonar-project.properties` file at the monorepo root:

```properties
sonar.projectKey=eglove_ethang-monorepo
sonar.organization=eglove

sonar.sources=\
  apps/ethang-hono/src,\
  apps/sterett-hono/src,\
  apps/url-shortener/src,\
  packages/eslint-config/src,\
  packages/leetcode/src,\
  packages/markdown-generator/src,\
  packages/store/src,\
  packages/toolbelt/src

sonar.exclusions=\
  **/node_modules/**,\
  **/*.test.ts,\
  **/*.test.tsx,\
  **/*.spec.ts,\
  **/e2e/**,\
  **/vitest.config.ts,\
  **/coverage/**

sonar.javascript.lcov.reportPaths=\
  apps/ethang-hono/coverage/lcov.info,\
  apps/sterett-hono/coverage/lcov.info,\
  apps/url-shortener/coverage/lcov.info,\
  packages/eslint-config/coverage/lcov.info,\
  packages/leetcode/coverage/lcov.info,\
  packages/markdown-generator/coverage/lcov.info,\
  packages/store/coverage/lcov.info,\
  packages/toolbelt/coverage/lcov.info
```

## Section 3: CI Workflow

Add a `sonar` job to `.github/workflows/ci.yml` after the existing `test` job:

```yaml
sonar:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@<pinned-sha>  # v4, fetch-depth: 0
      with:
        fetch-depth: 0
    - uses: pnpm/action-setup@<pinned-sha>  # v4
    - uses: actions/setup-node@<pinned-sha>  # v4
      with:
        node-version: '24'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm test
    - uses: SonarSource/sonarcloud-github-action@v3
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Note:** `fetch-depth: 0` is required by SonarCloud for accurate blame analysis and new code detection. The `SONAR_TOKEN` secret must be added to the repository's GitHub Actions secrets manually before this workflow will succeed.

Action SHA pins must follow the existing repo convention (pinned to commit SHAs, not floating tags).

## Prerequisites (Manual Steps)

- Add `SONAR_TOKEN` secret to the GitHub repository Actions secrets.
  - Obtain from SonarCloud → My Account → Security → Generate Token.
