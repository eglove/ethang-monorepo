---
description: "End-to-end Red-Green-Refactor pipeline using native CLI tools: /grill-me intake, research subagent fan-out, native artifact approval gates with RequestFeedback, define_subagent for specialized RED/GREEN agents, send_message coordination, and schedule reminders. Use when the user asks to TDD a feature or bug, work an issue red-green-refactor, or build a change test-first."
name: tdd
---

# TDD

A multi-agent Red-Green-Refactor pipeline powered by native Antigravity CLI tools. The main agent
orchestrates specialized subagents (via `define_subagent` and `invoke_subagent`), produces native
artifacts for approval gates (via `write_to_file` with `ArtifactMetadata`), and coordinates work
through `send_message`. Follow every step in order; do not skip or abbreviate, even for a one-line
change.

> **Alternative invocation modes:**
> - For large multi-file tasks, consider `/teamwork-preview` to launch a full autonomous team.
> - For unattended overnight execution, combine with `/goal` to run the full pipeline without stopping.

The mandatory user gates are **Step 3 (requirements approval)** and **Step 5 (plan approval)**. Both
use native artifacts with `RequestFeedback: true` — the user clicks **Proceed** to approve.

---

## Step 1: Task Intake

Use the `/grill-me` slash command to interview the user about every aspect of their requirements.
Once the interview is complete, the pipeline picks up from here.

If additional clarification is needed after `/grill-me`, use the `ask_question` tool for targeted
follow-up questions — one at a time, with a recommended option listed first.

Summarize back to the user: task title, technology context (React/frontend, Hono/Worker, Both, or
Other), acceptance criteria list, and any linked issues or documents. Ask: "Does this look right?" —
Confirm / Correct / Cancel. Wait for the answer.

> Produces: `ISSUE_KEY`, `ISSUE_CONTEXT`, `LINKED_ISSUES_LIST`, `TECH_CONTEXT`

---

## Step 2: Research & Analyze

Fan out research in parallel using `invoke_subagent` with the `research` subagent type:

- **Subagent A — Linked Context:** For each linked issue (discovered in Step 1), fetch and summarize.
  If the body references external URLs (documentation, RFCs, design docs), use `search_web` and
  `read_url_content` to fetch them.
- **Subagent B — Code Analysis:** Search the codebase for code paths affected by the requirement:
  - For React/frontend: locate components, custom hooks, query functions, and route definitions
  - For Hono/Worker: locate route handlers, middleware, service functions, and Drizzle schema files
  - Trace data flow end-to-end: UI → query hook → API route → service → repository → database

Launch both subagents simultaneously via a single `invoke_subagent` call. Collect their results via
`send_message` when they report back.

Ask the user: "Are there additional issues, documents, or context I should include?" Present what was
found and wait for the answer.

> Produces: `LINKED_CONTEXT`, `DOCS_CONTEXT`, `CODE_CONTEXT`

---

## Step 3: Requirements

Load and follow the [requirements-analyst](resources/requirements-analyst.md) resource to analyze the
collected context. The analyst applies SWEBOK Ch 1 (requirements), Ch 5 (state machine/test design),
Ch 2 (design impact), and Ch 14 (professional & compliance) using the
[SWEBOK glossary](../swebok/SKILL.md), and applies the [ddd-strategic](resources/ddd-strategic.md)
patterns lens.

Then load and follow the [requirements-writer](resources/requirements-writer.md) resource to produce
the requirements document.

**Produce the requirements as a native CLI artifact:**

Use `write_to_file` to create `requirements.md` in the artifact directory with:
- `ArtifactMetadata.UserFacing: true`
- `ArtifactMetadata.RequestFeedback: true`
- `ArtifactMetadata.Summary`: a detailed summary of the requirements

The user will see the artifact and can click **Proceed** to approve or provide feedback.

**This is a hard gate.** Wait for the user to approve before continuing.

On changes requested: apply feedback, regenerate the affected sections, update the artifact, and
re-present. Repeat until approved.

> Produces: `requirements.md` (native artifact)

---

## Step 4: Root Cause Analysis (bug-shaped tasks only)

**Skip unless** the task is a bug, or its description contains "defect", "regression", or "fix".

Load and follow the [rca](resources/rca.md) resource. Separate the problem from any proposed solution,
run the 5-Whys, scan the package source for the defect pattern, and check git history for the
introducing commit using the [rca-five-whys](resources/rca-five-whys.md) resource.

Carry the resulting `RCA_FINDINGS` into Step 5 — plan against the root cause, not the symptom.

---

## Step 5: Plan + Approval Gate (MANDATORY)

Load and follow the [planner](resources/planner.md) resource, consulting the
[SWEBOK glossary](../swebok/SKILL.md) for terminology. Produce an `EXECUTION_PLAN`: the state machine
table (see [tdd-state-coverage](resources/tdd-state-coverage.md)), the unit and integration test
inventories (following [ddd-strategic](resources/ddd-strategic.md)), and the minimal implementation
plan. For bug tasks, feed `RCA_FINDINGS` into the plan's Context section. Also reference and link to
the approved `requirements.md` from Step 3.

Before presenting, verify the plan lists at least one test. If it does not, re-plan.

**Produce the plan as a native CLI artifact:**

Use `write_to_file` to create `execution-plan.md` in the artifact directory with:
- `ArtifactMetadata.UserFacing: true`
- `ArtifactMetadata.RequestFeedback: true`
- `ArtifactMetadata.Summary`: a detailed summary of the execution plan

**This is a hard gate.** Wait for the user to click **Proceed** before writing any code.
Everything up to this point has been read-only; the first write happens only after approval.

- On approval → continue to Step 6.
- On rejection → take the feedback, revise the plan, update the artifact, and present again.

---

## Step 6: RED — Write Failing Tests

Use `define_subagent` to create a specialized **test-writer** subagent. Include the
[test-writer](resources/test-writer.md) role instructions in the subagent's system prompt, along with
[tdd-principles](resources/tdd-principles.md) and
[tdd-test-as-documentation](resources/tdd-test-as-documentation.md).

Launch the subagent via `invoke_subagent` with the approved plan's test inventory as the prompt.
The subagent writes unit and integration tests from the plan, co-located with the source.

Use `schedule` to set a reminder if the test-writing takes longer than expected.

When the subagent reports back via `send_message`, verify RED:

Run each new test file:
`pnpm --filter <package> exec vitest run <path/to/file.test.ts> --no-coverage`

Every test must fail, and fail for the *right* reason — an assertion about missing behavior, not a
setup or import error. If any test fails for the wrong reason, send corrections back to the subagent
via `send_message`.

> Produces: `TEST_WRITER_RED_RESULTS` (file list, raw output, failure reasons)

---

## Step 7: GREEN — Implement

**Checkpoint:** confirm the RED results show tests failing for the right reason, not setup errors,
before writing any production code.

Use `define_subagent` to create a specialized **implementer** subagent. Include the
[implementer](resources/implementer.md) role instructions in the subagent's system prompt.

Launch the subagent via `invoke_subagent` with `TEST_WRITER_RED_RESULTS` and the plan's implementation
section as the prompt. The subagent writes the minimum source to make the failing tests pass.

Use `schedule` to set a reminder if implementation takes longer than expected.

When the subagent reports back via `send_message`, verify GREEN:

- `pnpm --filter <package> exec vitest run <path/to/file.test.ts>`
- `pnpm --filter <package> test`

All new/changed code must reach 100% coverage (statements, branches, functions, lines).

> Produces: `GREEN_RESULTS`

---

## Step 8: Refactor & Summary

With tests green, improve the code while keeping them green: simplify logic, reduce the change
surface, eliminate duplication, improve naming, and remove dead code. Apply
[ddd-tactical](resources/ddd-tactical.md) to check CQRS (mutations vs queries), the Specification
Pattern for 3+ condition guards, branded-type Value Objects, and past-tense Domain Event naming.

Re-run `pnpm --filter <package> test` after every change. Repeat until the suite is green with no
findings left to address.

Then report to the user inline:
- Task summary (and root cause, for bug tasks)
- Tests written (files and what they cover)
- Changes made (files and what changed)
- Final coverage on new/changed code
- Any technical debt or follow-ups discovered along the way

---
