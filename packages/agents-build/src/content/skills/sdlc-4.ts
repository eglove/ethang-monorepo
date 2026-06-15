import { defineSkill } from "../../define.ts";

export const sdlc4 = defineSkill({
  content: `# Standalone SDLC Phase 4 (sdlc-4) - Verification & Testing Director

This skill guides an AI agent through verifying a package or feature using a formal verification loop and automated gap remediation.

---

## Phase 4 Reference & Alignment
This skill aligns with the following Phase 4 (Verification) and Phase 3 (Implementation) guidelines:
- [philosophy](file:///.agents/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints.
- [workspace-tools](file:///.agents/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use \`rtk\` command prefixes.
- [eslint-self-learning](file:///.agents/rules/eslint-self-learning.md) - Resolving lint issues, TypeScript check violations, and syntax errors.
- [maintainability-clean-code](file:///.agents/rules/maintainability-clean-code.md) - Descriptive naming, single responsibility.
- [tdd-discipline](file:///.agents/rules/tdd-discipline.md) - Red-Green-Refactor method.
- [tdd-principles](file:///.agents/rules/tdd-principles.md) - Parameterized tests, RED/GREEN validation, and trust-the-problem discipline.
- [tdd-state-coverage](file:///.agents/rules/tdd-state-coverage.md) - State tables, FSM enumerations, and async/form/auth scenarios.
- [tdd-test-as-documentation](file:///.agents/rules/tdd-test-as-documentation.md) - Descriptive naming, mock setups, and contract validation.
- [boundary-value-analysis](file:///.agents/rules/boundary-value-analysis.md) - Test design for boundary and off-by-one errors.
- [equivalence-partitioning](file:///.agents/rules/equivalence-partitioning.md) - Input domain partitions to optimize testing coverage.
- [mutation-testing-adequacy](file:///.agents/rules/mutation-testing-adequacy.md) - Verifying assertion adequacy via mutation analysis.
- [regression-testing-strategy](file:///.agents/rules/regression-testing-strategy.md) - Running regression suites on modification.
- [verification](file:///.agents/rules/verification.md) - Executing builds, tests, and lint checks.
- [verification-vs-validation](file:///.agents/rules/verification-vs-validation.md) - Conformance to specs vs. user correctness.
- [linter-quality-gates](file:///.agents/rules/linter-quality-gates.md) - Static analysis checks.

---

## Verification & Remediation State Machine (FSM)

The agent MUST follow this state machine when executing the verification loop:

1. **Idle**: Waiting for invocation command.
2. **GraphCheck**: Validate baseline graph using \`rtk sara check\`. If check fails, halt.
3. **CoverageRun**: Run unit tests with coverage enabled: \`rtk pnpm --filter <package> test --coverage\`.
4. **ParseCoverage**: Inspect the generated \`coverage/coverage-summary.json\` (or equivalent JSON reports) to identify statements or branches with less than 100% coverage.
5. **StateSpaceAnalysis**: Perform static analysis on the source code surrounding uncovered lines to map out the logical state space using the following partitions:
   - *Empty/Zero State*: \`""\`, \`0\`, \`[]\`, \`{}\`.
   - *Null/Missing State*: \`null\`, \`undefined\` (sanitized conforming to Yoda comparison rules).
   - *Extreme/Overflow Bounds*: Max integers, large buffers.
   - *Exceptional Path*: DB errors, network timeouts (caught by try/catch and logged cleanly).
   - *Asynchronous State*: Racing conditions, slow API response.
6. **DecideRemediation**: If state-space gaps or uncovered lines are found, enter the **TDDFixLoop**. Otherwise, transition to **RunLinter**.
7. **TDDFixLoop**: Remediation cycle:
   - *Red Phase*: Write a unit test verifying the specific boundary or exception path in \`*.test.ts\`. Wrap void method calls in \`expect(() => ...).not.toThrow()\`. Assert correctness using bracket notation on index-signature properties (e.g. \`res["isValid"]\`). Verify the test fails.
   - *Green Phase*: Implement the minimal changes in the source file to make the test pass.
   - *Refactor Phase*: Clean up the code. Enforce coding standards (arrow functions, explicit accessibility modifiers, no explicit return types, Yoda comparisons, no native Date).
   - Loop back to **CoverageRun**.
8. **RunLinter**: Run linter checks. If errors are found and autofix iteration < 3:
   - Run \`rtk pnpm --filter <package> lint --fix\`.
   - Increment iteration and re-run linter.
   - If iteration >= 3, halt and request human intervention.
9. **RunBuild**: Run package build: \`rtk pnpm --filter <package> build\`. If build fails, halt.
10. **FinalGraphCheck**: Run final SARA check: \`rtk sara check\`. If check fails, halt.
11. **Halt**: Suspend execution, print status, and await developer intervention.
12. **Complete**: Verification completed successfully.

---

## Safety & Security Safeguards

1. **Targeted Code Restores**: If a remediation cycle fails, run \`rtk git restore <path/to/modified/file>\`. Do NOT perform global resets (\`git reset --hard\` or \`git checkout -- .\`).
2. **Path Traversal Shield**: Validate package names and target file paths to reject any containing \`..\` or path traversal sequences.
3. **No Elevated Privileges**: Execute all commands in the context of the user-approved terminal without administrative overrides.
4. **Scoped Performance**: Restrict test and build commands to the target package using pnpm filters to minimize monorepo execution latency.
`,
  description:
    "Phase 4 Verification and gap remediation FSM enforcing test coverage, lint, build, and SARA checks.",
  name: "sdlc-4"
});
