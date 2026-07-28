---
tags: [backlog, coverage, quality-gates]
status: todo
priority: high
created: 2026-07-28
---

# Coverage Requirements to 80% and Remove v8 Ignore Comments

## Goal

Reduce the enforced coverage threshold from 100% to 80%, remove all `v8 ignore` comments from source code, and update AGENTS.md agent guidance accordingly. The agent rule still requires 100% coverage in principle; only the CI gate changes to 80%.

## Current Context

- Root `vitest.config.ts` enforces 100% across all four metrics (lines, branches, functions, statements).
- ~50 files contain `v8 ignore next`, `v8 ignore start/end`, or `v8 ignore if` comments. Most are defensive guards in the eslint-plugin package and monorepo-tools.
- AGENTS.md item 3 describes the 100% coverage discipline and explains when v8 ignores are acceptable.

## Proposed Approach

Change the threshold values in vitest.config.ts from 100 to 80. Remove every `v8 ignore` comment from source files. Update AGENTS.md to remove all v8-mentioning language while keeping the 100% agent expectation intact.

## Step-by-Step Plan

### Task 1: Lower vitest config thresholds to 80%

**Files:**
- Modify: `vitest.config.ts` (lines 35-41)

**Step 1: Edit coverage thresholds**

Change every `100` in the thresholds block to `80`:

```typescript
thresholds: {
  autoUpdate: true,
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80
}
```

**Step 2: Verify the file compiles**

Run: `pnpm -r lint` from repo root.

Expected: No TypeScript or ESLint errors in vitest.config.ts.

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: lower coverage thresholds to 80%"
```

### Task 2: Remove v8 ignore comments from all source files

**Files affected (confirmed):**

- `apps/auth/src/index.ts` — line 31
- `apps/ethang-rss/src/util/parse-feed-metadata.ts` — lines 99, 106, 134, 148, 156
- `apps/ethang-rss/src/util/extract-icon-url.ts` — line 44
- `apps/ethang-rss/src/test-utilities/mock-apollo-server.ts` — line 6
- `apps/sterett-hono/src/utils/calendar.ts` — lines 117, 172-175
- `packages/eslint-config/src/build/update-rules.ts` — lines 14-18, 197-201
- `packages/eslint-config/src/build/update-readme.ts` — lines 33-41
- `packages/eslint-plugin/src/utils/chain.ts` — lines 24, 42, 57, 125
- `packages/eslint-plugin/src/utils/lodash-map-utilities.ts` — lines 13, 88, 160
- `packages/eslint-plugin/src/utils/prefer-patterns.ts` — many lines (33, 106, 205, 215, 349, 363, 381, 490, 495, 535, 555-560, 617, 708, 731, 737, 742, 792)
- `packages/eslint-plugin/src/utils/prefer-patterns-shape.ts` — lines 179, 458
- `packages/eslint-plugin/src/utils/schema-decode.ts` — line 38
- `packages/markdown-generator/src/markdown-generator.ts` — line 124
- `packages/monorepo-tools/src/cli/file-check.ts` — lines 33-67, 107-139, 142-150
- `packages/monorepo-tools/src/cli/run-webstorm-inspections.ts` — lines 65, 98, 136, 175
- `packages/scripts/sort-json.ts` — line 36

**Step 1: Remove single-line v8 ignore comments**

For each `// v8 ignore next -- ...` or `/* v8 ignore next */`, delete only the comment text, keeping the code line intact.

Examples:
```typescript
// Before:
// v8 ignore next -- defensive guard: callers always pass a schema in tests
return foo;

// After:
return foo;
```

**Step 2: Remove block v8 ignore comments**

For `/* v8 ignore start */` ... `/* v8 ignore stop */` or `// v8 ignore start` ... `// v8 ignore end`, delete the comment markers and the blank lines they sit on, but keep all code between them.

Example:
```typescript
// Before:
// v8 ignore start - stdin infrastructure, tested via hook integration only
const input = await readStdin();
processInput(input);
// v8 ignore end

// After:
const input = await readStdin();
processInput(input);
```

**Step 3: Run lint to verify no syntax errors introduced**

Run: `pnpm -r lint` from repo root.

Expected: No new lint errors. Existing autofixes may apply.

**Step 4: Commit**

```bash
git add <all modified files>
git commit -m "chore: remove all v8 ignore comments"
```

### Task 3: Update AGENTS.md — coverage guidance and v8-mention removal

**Files:**
- Modify: `AGENTS.md` (item 3, lines 29 and surrounding context)

**Step 1: Rewrite the coverage section**

Replace the current item 3 with this text:

```markdown
3. **100% Coverage Discipline**: Every workspace targets 100% line/branch/function/statement coverage as a quality goal. The CI gate is set to 80%. To meet 100%, prefer to extract logic into small, individually testable helper/utility functions and export previously unexported functions and classes so the test suite can reach them.
```

This removes all v8-mentioning language while keeping the agent guidance at 100% target.

**Step 2: Verify the document renders correctly**

Read `AGENTS.md` and confirm item 3 reads cleanly with no orphaned references.

**Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update coverage guidance, remove v8 mention"
```

## Verification

- `pnpm run test` passes (coverage thresholds at 80%).
- `pnpm run lint` passes.
- `rg "v8 ignore"` returns zero matches across the repo.
- AGENTS.md item 3 mentions 100% as a goal and 80% as the gate, with no v8 references.

## Risks and Tradeoffs

- Lowering the CI gate from 100% to 80% means some untested branches may slip through. This is intentional — the goal is feasibility, not regression of quality standards.
- Removing v8 ignore comments exposes previously hidden uncovered branches. If any branch now causes a test failure below 80%, it must be fixed (add a test or refactor), not re-added as an ignore.
- The monorepo-tools package will be removed in a separate task; its v8 ignores should be removed only if that package is deleted first, otherwise the removal must wait until after monorepo-tools deletion to avoid partial cleanup.

## Open Questions

1. Should the `packages/monorepo-tools` directory be included in this task or deferred to the monorepo-tools removal task?
2. Are there any v8 ignore comments in CI config files (`.github/workflows/`) that also need removal?
