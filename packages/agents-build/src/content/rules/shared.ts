import { defineRule, type RuleDefinition } from "../../define.ts";

const philosophy = defineRule({
  content: `# Working Philosophy

These rules apply to every task in this workspace:

1. **Follow every step** of any workflow you are executing, regardless of how simple the change appears. Even a one-line fix gets the full treatment. Do not skip or abbreviate steps.
2. **Tests are executable documentation** — someone reading only the test file must understand the feature.
3. **User checkpoints are mandatory.** When a workflow declares a checkpoint, present the decision to the user, ask, and wait for an explicit answer before continuing — even when operating autonomously.
4. **Stream full output** from test runs. Do not filter or truncate test output; the user wants to see real-time progress.
5. **Never commit, push, or comment on pull requests** unless the user explicitly asks.

## Parallelization

**Default: fan out.** Issue all independent tool calls together in a single step. Go sequential only when one call consumes the output of another.

Batch together: reading multiple files, running multiple searches with different terms, fetching multiple independent resources. Chain sequentially: fetch a resource, extract references from it, then fetch what it references.`,
  filename: "philosophy",
  trigger: "always_on"
});

const tddDiscipline = defineRule({
  content: `# Test-Driven Development (Red -> Green -> Refactor)

This is the highest-priority rule for ALL code changes. No exceptions.

1. **Red** — Write a failing test FIRST that proves the problem exists or specifies the new behavior. The test is a hypothesis. Do NOT touch production code yet.
2. **Green** — Write the minimum production code to make the test pass. The code is the conclusion.
3. **Refactor** — Improve the code while keeping tests green: simplify logic, reduce change surface, eliminate duplication, improve naming, remove dead code.

## Scientific method

Treat every test as an experiment:

- **Hypothesis** — the test describes expected behavior before code exists.
- **Experiment** — run the test; it MUST fail (red) to confirm the hypothesis is testable.
- **Conclusion** — production code makes it pass (green), proving the hypothesis.
- If a test passes before you write the code, it proves nothing — investigate why before continuing.

## State coverage

Line coverage is not the goal — **state coverage** is. Tests must cover all states a unit can receive:

- Valid inputs, invalid inputs, boundary values, empty/null/undefined states
- Error states, loading states, race conditions
- Use parameterized tests (Vitest \`it.each\`) to cover many input-output cases in a single block. Prefer them over copy-pasted test bodies.

## Test placement

- Unit tests live next to or near the code under test and run with Vitest.
- Never weaken an existing test to make a change pass. If a test blocks you, the test is telling you something — read it.`,
  filename: "tdd-discipline",
  trigger: "always_on"
});

const verification = defineRule({
  content: `# Verification Commands

How to build, test, and lint in this monorepo (pnpm workspaces; Bun runs build scripts).

## Whole repo (from the root)

| Goal | Command |
|---|---|
| Build everything | \`pnpm build\` (fans out to \`pnpm -r build\`) |
| Test everything | \`pnpm test\` (fans out to \`pnpm -r test\`) |
| Lint everything | \`pnpm lint\` (fans out to \`pnpm -r lint\`) |
| Full health sweep | \`./repo-check.ps1\` (cf-typegen, build, test, lint, dedupe, store prune) |

## Single package

| Goal | Command |
|---|---|
| Test one package | \`pnpm --filter <package-name> test\` (runs \`vitest run --coverage\`) |
| Watch mode | \`pnpm --filter <package-name> exec vitest\` |
| One test file | \`pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage\` |
| Build one package | \`pnpm --filter <package-name> build\` (runs \`bun build.ts\`) |
| Lint one package | \`pnpm --filter <package-name> lint\` (runs \`eslint . --fix && pnpm tsc --noEmit\`) |

## Cloudflare Workers apps

- Local dev server: \`pnpm --filter <app-name> dev\` (wrangler).
- Regenerate Worker types after wrangler.jsonc changes: \`pnpm -r cf-typegen\`.

## Rules of engagement

- Run the narrowest command that answers your question, but always finish a change by running the affected package's full \`test\` and \`lint\`.
- Coverage thresholds auto-ratchet (\`autoUpdate: true\`); never lower them by hand.
- Lint must produce no diff — CI runs \`eslint --fix\` and fails on \`git diff --exit-code\`.`,
  description: "running tests, builds, or lint in this monorepo",
  filename: "verification",
  trigger: "model_decision"
});

/** Bundled into every plugin's rules/ directory, ahead of plugin-local rules. */
export const SHARED_RULES: RuleDefinition[] = [
  philosophy,
  tddDiscipline,
  verification
];
