# Vitest → SonarCloud Coverage Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Vitest unit test coverage from all 8 packages/apps into SonarCloud using LCOV reports and a dedicated CI job.

**Architecture:** Add `lcov` to vitest reporter arrays in all packages, create vitest configs for packages that lack them, add a root-level `sonar-project.properties`, and extend the GitHub Actions CI with a `sonar` job that runs tests then uploads results via `sonarqube-scan-action@v7.0.0`.

**Tech Stack:** Vitest, `@vitest/coverage-v8`, SonarCloud, `SonarSource/sonarqube-scan-action@v7.0.0`, GitHub Actions

---

### Task 1: Create worktree

**Files:**
- No file changes — sets up isolated working environment

- [ ] **Step 1: Create a new branch and worktree**

Run from the monorepo root:
```bash
git worktree add ../ethang-monorepo-sonar feature/vitest-sonarcloud-coverage
cd ../ethang-monorepo-sonar
```

- [ ] **Step 2: Verify worktree is on the correct branch**

```bash
git branch --show-current
```
Expected output: `feature/vitest-sonarcloud-coverage`

---

### Task 2: Add `lcov` reporter to existing vitest configs

**Files:**
- Modify: `apps/ethang-hono/vitest.config.ts`
- Modify: `apps/sterett-hono/vitest.config.ts`
- Modify: `apps/url-shortener/vitest.config.ts`
- Modify: `packages/eslint-config/vitest.config.ts`

- [ ] **Step 1: Verify no lcov.info files exist yet**

```bash
find . -name "lcov.info" -not -path "*/node_modules/*"
```
Expected: no output.

- [ ] **Step 2: Update apps/ethang-hono/vitest.config.ts**

Change the `reporter` array from:
```ts
reporter: ["text", "json", "html"],
```
to:
```ts
reporter: ["text", "json", "html", "lcov"],
```

- [ ] **Step 3: Update apps/sterett-hono/vitest.config.ts**

Change the `reporter` array from:
```ts
reporter: ["text", "json", "html"],
```
to:
```ts
reporter: ["text", "json", "html", "lcov"],
```

- [ ] **Step 4: Update apps/url-shortener/vitest.config.ts**

Change the `reporter` array from:
```ts
reporter: ["text", "json", "html"],
```
to:
```ts
reporter: ["text", "json", "html", "lcov"],
```

- [ ] **Step 5: Update packages/eslint-config/vitest.config.ts**

Change the `reporter` array from:
```ts
reporter: ["text", "json", "html"],
```
to:
```ts
reporter: ["text", "json", "html", "lcov"],
```

- [ ] **Step 6: Run ethang-hono tests to confirm lcov.info is generated**

```bash
cd apps/ethang-hono && pnpm test && cd ../..
```
Expected: tests pass, then:
```bash
ls apps/ethang-hono/coverage/lcov.info
```
Expected: file exists.

- [ ] **Step 7: Commit**

```bash
git add apps/ethang-hono/vitest.config.ts apps/sterett-hono/vitest.config.ts apps/url-shortener/vitest.config.ts packages/eslint-config/vitest.config.ts
git commit -m "chore: add lcov reporter to existing vitest coverage configs"
```

---

### Task 3: Add coverage config to packages/leetcode, packages/markdown-generator, packages/store

These three packages have no vitest config and no `@vitest/coverage-v8` dependency.

**Files:**
- Modify: `packages/leetcode/package.json`
- Create: `packages/leetcode/vitest.config.ts`
- Modify: `packages/markdown-generator/package.json`
- Create: `packages/markdown-generator/vitest.config.ts`
- Modify: `packages/store/package.json`
- Create: `packages/store/vitest.config.ts`

- [ ] **Step 1: Add @vitest/coverage-v8 devDependency to leetcode**

In `packages/leetcode/package.json`, add to `devDependencies`:
```json
"@vitest/coverage-v8": "^4.1.2"
```

- [ ] **Step 2: Update test script in packages/leetcode/package.json**

Change:
```json
"test": "vitest run"
```
to:
```json
"test": "vitest run --coverage"
```

- [ ] **Step 3: Create packages/leetcode/vitest.config.ts**

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

- [ ] **Step 4: Add @vitest/coverage-v8 devDependency to markdown-generator**

In `packages/markdown-generator/package.json`, add to `devDependencies`:
```json
"@vitest/coverage-v8": "^4.1.2"
```

- [ ] **Step 5: Update test script in packages/markdown-generator/package.json**

Change:
```json
"test": "vitest run"
```
to:
```json
"test": "vitest run --coverage"
```

- [ ] **Step 6: Create packages/markdown-generator/vitest.config.ts**

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

- [ ] **Step 7: Add @vitest/coverage-v8 devDependency to store**

In `packages/store/package.json`, add to `devDependencies`:
```json
"@vitest/coverage-v8": "^4.1.2"
```

- [ ] **Step 8: Update test script in packages/store/package.json**

Change:
```json
"test": "vitest run"
```
to:
```json
"test": "vitest run --coverage"
```

- [ ] **Step 9: Create packages/store/vitest.config.ts**

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

- [ ] **Step 10: Install new dependencies**

```bash
pnpm install
```
Expected: lockfile updated, no errors.

- [ ] **Step 11: Run tests for all three packages to verify lcov.info is generated**

```bash
cd packages/leetcode && pnpm test && cd ../..
cd packages/markdown-generator && pnpm test && cd ../..
cd packages/store && pnpm test && cd ../..
```
Expected: all pass, then:
```bash
ls packages/leetcode/coverage/lcov.info packages/markdown-generator/coverage/lcov.info packages/store/coverage/lcov.info
```
Expected: all three files exist.

- [ ] **Step 12: Commit**

```bash
git add packages/leetcode/package.json packages/leetcode/vitest.config.ts
git add packages/markdown-generator/package.json packages/markdown-generator/vitest.config.ts
git add packages/store/package.json packages/store/vitest.config.ts
git add pnpm-lock.yaml
git commit -m "chore: add vitest coverage config to leetcode, markdown-generator, store"
```

---

### Task 4: Add coverage config to packages/toolbelt

`toolbelt` already has `@vitest/coverage-v8` but no `vitest.config.ts`. Its test script uses `--coverage.enabled=true` (a CLI flag) rather than a config file.

**Files:**
- Create: `packages/toolbelt/vitest.config.ts`
- Modify: `packages/toolbelt/package.json`

- [ ] **Step 1: Create packages/toolbelt/vitest.config.ts**

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

- [ ] **Step 2: Update test script in packages/toolbelt/package.json**

Change:
```json
"test": "vitest run --coverage.enabled=true"
```
to:
```json
"test": "vitest run --coverage"
```

- [ ] **Step 3: Run tests to verify lcov.info is generated**

```bash
cd packages/toolbelt && pnpm test && cd ../..
```
Expected: tests pass, then:
```bash
ls packages/toolbelt/coverage/lcov.info
```
Expected: file exists.

- [ ] **Step 4: Commit**

```bash
git add packages/toolbelt/vitest.config.ts packages/toolbelt/package.json
git commit -m "chore: add vitest coverage config to toolbelt"
```

---

### Task 5: Create sonar-project.properties

**Files:**
- Create: `sonar-project.properties`

- [ ] **Step 1: Create sonar-project.properties at the monorepo root**

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
  **/*.spec.tsx,\
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

- [ ] **Step 2: Commit**

```bash
git add sonar-project.properties
git commit -m "chore: add sonar-project.properties for SonarCloud monorepo coverage"
```

---

### Task 6: Add sonar job to CI

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the sonar job to .github/workflows/ci.yml**

Add the following job at the end of the `jobs:` section. Use the same pinned SHA format as the rest of the file:

```yaml
  sonar:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1  # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4
        with:
          node-version: '24'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - uses: SonarSource/sonarqube-scan-action@a31c9398be7ace6bbfaf30c0bd5d415f843d45e9  # v7.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

**Note on `fetch-depth: 0`:** SonarCloud requires the full git history to calculate blame information and identify new vs. existing code. Without this, SonarCloud cannot accurately report on new code in pull requests.

**Note on re-running tests:** GitHub Actions jobs do not share filesystem state. The coverage reports from the `test` job are not available in the `sonar` job. Re-running `pnpm test` here regenerates all `lcov.info` files in the same job before the scan runs.

- [ ] **Step 2: Verify CI file is valid YAML**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```
Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add sonar job for SonarCloud coverage reporting"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run all tests from the monorepo root**

```bash
pnpm test
```
Expected: all packages pass with exit code 0.

- [ ] **Step 2: Verify all 8 lcov.info files exist**

```bash
ls \
  apps/ethang-hono/coverage/lcov.info \
  apps/sterett-hono/coverage/lcov.info \
  apps/url-shortener/coverage/lcov.info \
  packages/eslint-config/coverage/lcov.info \
  packages/leetcode/coverage/lcov.info \
  packages/markdown-generator/coverage/lcov.info \
  packages/store/coverage/lcov.info \
  packages/toolbelt/coverage/lcov.info
```
Expected: all 8 files listed with no errors.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feature/vitest-sonarcloud-coverage
```

- [ ] **Step 4: Open a pull request**

```bash
gh pr create \
  --title "chore: wire vitest coverage to SonarCloud" \
  --body "Adds lcov coverage reporting to all 8 packages/apps and configures SonarCloud to pick them up via a new CI job. Requires SONAR_TOKEN secret to be set in GitHub Actions secrets."
```

**Prerequisite reminder:** Before the CI sonar job can succeed, a `SONAR_TOKEN` secret must be added to the repository's GitHub Actions secrets. Obtain it from SonarCloud → My Account → Security → Generate Token.
