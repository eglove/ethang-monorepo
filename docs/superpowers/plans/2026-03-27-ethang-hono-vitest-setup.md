# ethang-hono Vitest Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Vitest with v8 coverage to `apps/ethang-hono`, following the `sterett-hono` monorepo convention.

**Architecture:** Add `vitest` and `@vitest/coverage-v8` as devDependencies, create `vitest.config.ts` with v8 provider and auto-updating thresholds starting at 0, add `test` and `test:vitest` scripts. A minimal smoke test verifies the infrastructure runs end-to-end.

**Tech Stack:** Vitest 4.1.2, @vitest/coverage-v8 4.1.2, Node environment (no DOM), TypeScript

---

## File Map

| Action   | File                                      | Purpose                                      |
|----------|-------------------------------------------|----------------------------------------------|
| Modify   | `apps/ethang-hono/package.json`           | Add devDependencies + test scripts           |
| Create   | `apps/ethang-hono/vitest.config.ts`       | Vitest + v8 coverage configuration           |
| Create   | `apps/ethang-hono/src/routes.test.ts`     | Smoke test to verify infrastructure runs     |

---

### Task 1: Add devDependencies and scripts to package.json

**Files:**
- Modify: `apps/ethang-hono/package.json`

- [ ] **Step 1: Add vitest devDependencies**

In `apps/ethang-hono/package.json`, add two entries to `devDependencies` (keep keys sorted alphabetically):

```json
"@vitest/coverage-v8": "^4.1.2",
"vitest": "^4.1.2"
```

The `devDependencies` block becomes:

```json
"devDependencies": {
  "@ethang/eslint-config": "^25.6.0",
  "@tailwindcss/cli": "^4.2.2",
  "@types/lodash": "^4.17.24",
  "@types/luxon": "^3.7.1",
  "@types/node": "^25.5.0",
  "@vitest/coverage-v8": "^4.1.2",
  "browserslist-config-baseline": "^0.5.0",
  "drizzle-kit": "^0.31.10",
  "eslint": "^10.1.0",
  "fast-glob": "^3.3.3",
  "npm-run-all": "^4.1.5",
  "tsup": "^8.5.1",
  "tsx": "^4.21.0",
  "vitest": "^4.1.2",
  "wrangler": "^4.77.0"
}
```

- [ ] **Step 2: Add test scripts**

In `apps/ethang-hono/package.json`, add to `scripts` (keep sorted):

```json
"test": "vitest run --coverage",
"test:vitest": "vitest run --coverage"
```

The full `scripts` block becomes:

```json
"scripts": {
  "cf-typegen": "wrangler types --env-interface CloudflareBindings",
  "deploy": "bun ./build.ts && bun scripts/stamp-sw.ts && wrangler deploy --minify",
  "dev": "run-p tailwind wrangler:dev",
  "drizzle:generate": "drizzle-kit generate",
  "lint": "eslint . --fix",
  "tailwind": "tailwindcss -i ./src/index.css -o ./public/index.css --watch",
  "test": "vitest run --coverage",
  "test:vitest": "vitest run --coverage",
  "wrangler:dev": "wrangler dev"
}
```

- [ ] **Step 3: Install dependencies**

From the monorepo root:

```bash
pnpm install
```

Expected: lock file updates, no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/ethang-hono/package.json
git commit -m "chore(ethang-hono): add vitest and coverage-v8 dependencies"
```

---

### Task 2: Create vitest.config.ts

**Files:**
- Create: `apps/ethang-hono/vitest.config.ts`

- [ ] **Step 1: Create the config file**

Create `apps/ethang-hono/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        autoUpdate: true,
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/ethang-hono/vitest.config.ts
git commit -m "chore(ethang-hono): add vitest config with v8 coverage"
```

---

### Task 3: Write smoke test and verify the setup

**Files:**
- Create: `apps/ethang-hono/src/routes.test.ts`

`routes.ts` exports a plain object with no external dependencies — ideal for a smoke test that verifies the infrastructure runs without needing any mocks.

- [ ] **Step 1: Write the failing test**

Create `apps/ethang-hono/src/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { routes } from "../routes.ts";

describe("routes", () => {
  it("exports blog route", () => {
    expect(routes.blog).toBe("/blog");
  });

  it("exports courses route", () => {
    expect(routes.courses).toBe("/courses");
  });

  it("exports tips route", () => {
    expect(routes.tips).toBe("/tips");
  });
});
```

- [ ] **Step 2: Run to verify it fails before implementation exists**

From `apps/ethang-hono`:

```bash
pnpm test:vitest
```

Expected: test runner starts, tests FAIL or report "cannot find module" — confirming the test is wired to real code, not a phantom.

> Note: Since `routes.ts` already exists with the correct values, the tests will likely PASS immediately. That's fine — the point is confirming the runner itself works end-to-end with coverage output.

- [ ] **Step 3: Verify coverage report is generated**

After the run, confirm:
- Terminal shows a coverage table (branches, functions, lines, statements)
- A `coverage/` directory is created in `apps/ethang-hono/`

- [ ] **Step 4: Commit**

```bash
git add apps/ethang-hono/src/routes.test.ts
git commit -m "test(ethang-hono): add smoke test to verify vitest infrastructure"
```
