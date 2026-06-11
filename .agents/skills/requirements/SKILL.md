---
name: requirements
description: Primary requirements skill. Execute when asked to define requirements from a GitHub issue or user description. Drives intake, multi-lens analysis, and structured requirements.md output.
---

# Requirements

Execute this pipeline when asked to define requirements from a GitHub issue or user-provided description.

Produces a single artifact: `requirements.md` — a structured requirements definition with state machine, test hypotheses, and traceability.

---

## Step 1: Task Intake (Interview via /grill-me)

Interview the user about every aspect of their requirements/task using the `/grill-me` command workflow to establish a shared understanding.

Guidelines:
- Ask questions one at a time using the `ask_question` tool.
- For each question, provide a recommended option first.
- If a question can be answered by exploring the codebase, explore the codebase instead of asking.
- Walk down each branch of the design tree, resolving dependencies between decisions.

Once the interview is complete, summarize back to the user: task title, technology context (React/frontend, Hono/Worker, Both, or Other), acceptance criteria list, and any linked issues or documents. Ask: "Does this look right?" — Confirm / Correct / Cancel. Wait for the answer.

> Produces: `ISSUE_KEY`, `ISSUE_CONTEXT`, `LINKED_ISSUES_LIST`, `TECH_CONTEXT`

---

## Step 2: Gather Linked Context

For each linked issue (discovered in Step 1), fetch and summarize. If the body references external URLs (documentation, RFCs, design docs), fetch them.

Run all fetches in parallel.

Ask the user: "Are there additional issues, documents, or context I should include?" Present what was found and wait for the answer.

> Produces: `LINKED_CONTEXT`, `DOCS_CONTEXT`

---

## Step 3: Analyze Affected Code

Search the codebase for code paths affected by the requirement:

- For React/frontend: locate components, custom hooks, query functions, and route definitions that the change will touch
- For Hono/Worker: locate route handlers, middleware, service functions, and Drizzle schema files
- Trace data flow end-to-end: UI → query hook → API route → service → repository → database

Run all searches in parallel.

> Produces: `CODE_CONTEXT`

---

## Step 4: Requirements Analysis

Load and follow the [requirements-analyst](resources/requirements-analyst.md) resource.

Provide:
- `ISSUE_CONTEXT`
- `LINKED_CONTEXT`
- `DOCS_CONTEXT`
- `CODE_CONTEXT`

The analyst applies SWEBOK Ch 1 (requirements), Ch 5 (state machine/test design), Ch 2 (design impact), and Ch 14 (professional & compliance) using the [SWEBOK glossary](../swebok/SKILL.md), and applies the [ddd-strategic](resources/ddd-strategic.md) patterns lens.

> Produces: `REQUIREMENTS_ANALYSIS`

---

## Step 5: Generate Requirements Definition

Load and follow the [requirements-writer](resources/requirements-writer.md) resource.

Provide all artifacts: `ISSUE_KEY`, `ISSUE_CONTEXT`, `LINKED_CONTEXT`, `DOCS_CONTEXT`, `CODE_CONTEXT`, `REQUIREMENTS_ANALYSIS`.

The writer produces `requirements.md` at `{output-path}/{ISSUE_KEY}/requirements.md`.

Present to the user: output file path, requirement counts, and any gaps discovered. Ask: "Approve as final?" — Approve / Request changes / Cancel. Wait for the answer.

On changes requested: apply feedback, regenerate the affected sections, re-present. Repeat until approved.

> Produces: `requirements.md`

---

## Edge Cases

- **No linked issues**: Proceed from main issue only.
- **Linked issue inaccessible** (404 or private): Note in the linked issues table. Proceed with available context.
- **No acceptance criteria**: Flag as gap. Derive implicit AC from the issue description. Note each as "Inferred."
- **Pure tooling/config issue** (no runtime behavior change): Skip state machine derivation. Focus on correctness and migration safety requirements only.
