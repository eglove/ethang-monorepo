import { defineSkill } from "../../../define.ts";

export const tddPipelineSkill = defineSkill({
  content: `# TDD Pipeline

A single-agent Red-Green-Refactor pipeline. You execute every step yourself, wearing a different
"hat" at each stage by loading the matching role skill — there are no separate agents. Follow every
step in order; do not skip or abbreviate, even for a one-line change.

The mandatory user gate is **Step 3 (plan approval)**. You must stop there and wait for explicit
approval before writing any code.

## Step 1: Task Intake

Establish what you are building.

- If the user gives you prose (a feature description or a bug report), treat that as the task directly.
- If the user gives you a GitHub issue number (e.g. \`#42\` or \`gh issue 42\`), fetch it:
  \`gh issue view <n>\` — and use the title + body as the task.

Determine the target package (the \`pnpm --filter <package>\` name) from the task and the affected paths.

Summarize back to the user: task title, whether it is a feature or a bug, the acceptance criteria you
inferred, and the target package. Confirm this understanding before continuing. If the task is
ambiguous, ask now — do not guess.

## Step 2: Root Cause Analysis (bug-shaped tasks only)

**Skip unless** the task is a bug, or its description contains "defect", "regression", or "fix".

Load and follow the \`rca\` skill. Separate the problem from any proposed solution, run the 5-Whys,
scan the package source for the defect pattern, and check git history for the introducing commit.
Carry the resulting \`RCA_FINDINGS\` into Step 3 — plan against the root cause, not the symptom.

## Step 3: Plan + Approval Gate (MANDATORY)

Load and follow the \`planner\` skill. Produce an \`EXECUTION_PLAN\`: the state machine table
(see \`tdd-state-coverage\`), the unit and integration test inventories, and the minimal implementation
plan. For bug tasks, feed \`RCA_FINDINGS\` into the plan's Context section.

Before presenting, verify the plan lists at least one test. If it does not, re-plan.

**This is a hard gate.** Present the \`EXECUTION_PLAN\` to the user verbatim, ask for approval, and
**wait for an explicit "yes" before writing anything**. Everything up to this point has been read-only;
the first write happens only after approval.

- On approval → continue to Step 4.
- On rejection → take the feedback, revise the plan, and present again. Repeat until approved.

## Step 4: RED — Write Failing Tests

Load and follow the \`test-writer\` skill. Write the unit and integration tests from the approved
plan's inventory under the target package, co-located with the source.

Run each new test file with RED verification:
\`pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage\`

Every test must fail, and fail for the *right* reason — an assertion about missing behavior, not a
setup or import error. Produce \`TEST_WRITER_RED_RESULTS\` (file list, raw output, failure reasons).

## Step 5: GREEN — Implement

**Checkpoint:** confirm the RED results show tests failing for the right reason, not setup errors,
before writing any production code.

Load and follow the \`implementer\` skill. Write the minimum source to make the failing tests pass, per
the plan's implementation section. Then run the affected files with coverage and the full package
suite:

- \`pnpm --filter <package> exec vitest run <path/to/file.test.ts>\`
- \`pnpm --filter <package> test\`

All new/changed code must reach 100% coverage (statements, branches, functions, lines). Produce
\`GREEN_RESULTS\`.

## Step 6: Refactor

With tests green, improve the code while keeping them green: simplify logic, reduce the change surface,
eliminate duplication, improve naming, and remove dead code. Apply \`ddd-tactical\` to check CQRS
(mutations vs queries), the Specification Pattern for 3+ condition guards, branded-type Value Objects,
and past-tense Domain Event naming.

Re-run \`pnpm --filter <package> test\` after every change. Repeat until the suite is green with no
findings left to address.

## Step 7: Summary

Report to the user:
- Task summary (and root cause, for bug tasks)
- Tests written (files and what they cover)
- Changes made (files and what changed)
- Final coverage on new/changed code
- Any technical debt or follow-ups discovered along the way

---

{{sections}}`,
  description:
    "End-to-end Red-Green-Refactor pipeline: task intake, optional bug RCA, planning with a state table, a mandatory plan-approval gate, RED tests, GREEN implementation, refactor, and summary. Use when the user asks to TDD a feature or bug, work an issue red-green-refactor, or build a change test-first.",
  name: "tdd-pipeline",
  skillRefs: [
    {
      description:
        "Adopt at Step 2 for bug-shaped tasks. Separates problem from proposed solution, runs the 5-Whys, scans for the defect pattern, and checks git for regressions.",
      skill: "rca"
    },
    {
      description:
        "Adopt at Step 3 to produce the EXECUTION_PLAN: state machine, completeness check, unit + integration test inventories, and the minimal implementation plan.",
      skill: "planner"
    },
    {
      description:
        "Adopt at Step 4 to write the failing Vitest unit and integration tests (React + TanStack, Hono + Drizzle) that fail for the right reason.",
      skill: "test-writer"
    },
    {
      description:
        "Adopt at Step 5 to write the minimum source that turns the RED tests GREEN and to verify 100% coverage on new/changed code.",
      skill: "implementer"
    },
    {
      description:
        "Read before building the Step 3 test inventory: FSM enumeration, the state table template, the completeness checklist, and it.each generation from state tables.",
      skill: "tdd-state-coverage"
    },
    {
      description:
        "Read before writing any tests in Step 4: Red-Green-Refactor scientific method, it.each parameterization, and trust-the-problem discipline.",
      skill: "tdd-principles"
    },
    {
      description:
        "Read while writing tests in Step 4: behavior-description naming, state-machine describe structure, contract assertions, and mocks as dependency docs.",
      skill: "tdd-test-as-documentation"
    },
    {
      description:
        "Read during Step 3 planning to identify the bounded context, ubiquitous-language delta, and domain events the feature touches.",
      skill: "ddd-strategic"
    },
    {
      description:
        "Read during Step 5 implementation and Step 6 refactor: CQRS (mutations vs queries), Specification Pattern, branded Value Objects, past-tense Domain Event naming.",
      skill: "ddd-tactical"
    },
    {
      description:
        "Read at Step 2 for the full bug RCA procedure and the RCA_FINDINGS output contract.",
      skill: "rca-five-whys"
    }
  ]
});
