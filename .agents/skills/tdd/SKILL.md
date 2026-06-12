---
description: "End-to-end Red-Green-Refactor pipeline: task intake, optional bug RCA, planning with a state table, a mandatory plan-approval gate, RED tests, GREEN implementation, refactor, and summary. Use when the user asks to TDD a feature or bug, work an issue red-green-refactor, or build a change test-first."
name: tdd
---

# TDD

A single-agent Red-Green-Refactor pipeline. You execute every step yourself, wearing a different
"hat" at each stage by loading the matching role resource — there are no separate agents. Follow every
step in order; do not skip or abbreviate, even for a one-line change.

The mandatory user gate is **Step 3 (plan approval)**. You must stop there and wait for explicit
approval before writing any code.

## Step 1: Task Intake (Interview via /grill-me)

Interview the user about every aspect of their task using the `/grill-me` command workflow to establish a shared understanding.

Guidelines:
- Ask questions one at a time using the `ask_question` tool.
- For each question, provide a recommended option first.
- If a question can be answered by exploring the codebase, explore the codebase instead of asking.
- Walk down each branch of the design tree, resolving dependencies between decisions.

Once the interview is complete, summarize back to the user: task title, whether it is a feature or a bug, the final acceptance criteria, and the target package (the `pnpm --filter <package>` name). Confirm this understanding and obtain explicit approval before proceeding to Step 2.

## Step 2: Root Cause Analysis (bug-shaped tasks only)

**Skip unless** the task is a bug, or its description contains "defect", "regression", or "fix".

Load and follow the [rca](resources/rca.md) resource. Separate the problem from any proposed solution, run the 5-Whys,
scan the package source for the defect pattern, and check git history for the introducing commit using the [rca-five-whys](resources/rca-five-whys.md) resource.
Carry the resulting `RCA_FINDINGS` into Step 3 — plan against the root cause, not the symptom.

## Step 3: Plan + Approval Gate (MANDATORY)

Load and follow the [planner](resources/planner.md) resource, consulting the [SWEBOK glossary](../swebok/SKILL.md) for terminology. Produce an `EXECUTION_PLAN`: the state machine table
(see [tdd-state-coverage](resources/tdd-state-coverage.md)), the unit and integration test inventories (following [ddd-strategic](resources/ddd-strategic.md)), and the minimal implementation
plan. For bug tasks, feed `RCA_FINDINGS` into the plan's Context section.

Before presenting, verify the plan lists at least one test. If it does not, re-plan.

**This is a hard gate.** Present the `EXECUTION_PLAN` to the user verbatim, ask for approval, and
**wait for an explicit "yes" before writing anything**. Everything up to this point has been read-only;
the first write happens only after approval.

- On approval → continue to Step 4.
- On rejection → take the feedback, revise the plan, and present again. Repeat until approved.

## Step 4: RED — Write Failing Tests

Load and follow the [test-writer](resources/test-writer.md) resource. Write the unit and integration tests from the approved
plan's inventory under the target package, co-located with the source, using the [tdd-principles](resources/tdd-principles.md) and [tdd-test-as-documentation](resources/tdd-test-as-documentation.md) resources.

Run each new test file with RED verification:
`pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage`

Every test must fail, and fail for the *right* reason — an assertion about missing behavior, not a
setup or import error. Produce `TEST_WRITER_RED_RESULTS` (file list, raw output, failure reasons).

## Step 5: GREEN — Implement

**Checkpoint:** confirm the RED results show tests failing for the right reason, not setup errors,
before writing any production code.

Load and follow the [implementer](resources/implementer.md) resource. Write the minimum source to make the failing tests pass, per
the plan's implementation section. Then run the affected files with coverage and the full package
suite:

- `pnpm --filter <package> exec vitest run <path/to/file.test.ts>`
- `pnpm --filter <package> test`

All new/changed code must reach 100% coverage (statements, branches, functions, lines). Produce
`GREEN_RESULTS`.

## Step 6: Refactor

With tests green, improve the code while keeping them green: simplify logic, reduce the change surface,
eliminate duplication, improve naming, and remove dead code. Apply [ddd-tactical](resources/ddd-tactical.md) to check CQRS
(mutations vs queries), the Specification Pattern for 3+ condition guards, branded-type Value Objects,
and past-tense Domain Event naming.

Re-run `pnpm --filter <package> test` after every change. Repeat until the suite is green with no
findings left to address.

## Step 7: Summary

Report to the user:
- Task summary (and root cause, for bug tasks)
- Tests written (files and what they cover)
- Changes made (files and what changed)
- Final coverage on new/changed code
- Any technical debt or follow-ups discovered along the way

---
