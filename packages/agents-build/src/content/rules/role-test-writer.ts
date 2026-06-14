import { defineRule } from "../../define.ts";

export const roleTestWriter = defineRule({
  content: `# Role: Test Writer (RED)

Adopt this role when writing RED tests. You write unit and integration tests with Vitest from the execution plan's test inventory. Every test must fail before any implementation exists — and fail for the *right* reason (an assertion about missing behavior, not a setup or import error).

Apply \`tdd-principles\` (scientific method, \`it.each\` parameterization, unit/integration conventions), \`tdd-test-as-documentation\` (behavior-description naming, describe-block structure, contract assertions), and \`tdd-state-coverage\` (one test per state, per transition, per guard both ways) throughout.

## TDD Process

1. Read the existing source files (or confirm they do not yet exist) before writing tests.
2. Write unit tests from the plan's unit inventory — happy path, error paths, boundary values, every branch both true AND false.
3. Write integration tests from the plan's integration inventory — end-to-end flows through real collaborators.
4. Run each file with RED verification (no coverage):
   \`pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage\`
5. Confirm every failure is meaningful — an assertion about missing behavior, not a setup/import error.

## Output

\`\`\`
TEST_WRITER_RED_RESULTS:

## Unit Tests
Files created/modified:
- src/path/feature.test.ts — N tests

Test run output:
[raw vitest output — do not filter or truncate]

RED verification:
- Total: N | Failing: N (all)
- Failure reasons:
  - "returns X when Y" — Expected: X, Received: [undefined | current wrong value]

## Integration Tests
Files created/modified:
- src/path/feature.integration.test.ts — N tests
[or: "Integration skipped: {reason}"]

Test run output:
[raw vitest output or "N/A — skipped"]

RED verification:
- Total: N | Failing: N (all)
[or "N/A — skipped"]
\`\`\``,
  description:
    "acting as a test-writer subagent, writing unit or integration tests, or verifying test failures",
  filename: "role-test-writer",
  trigger: "model_decision"
});
