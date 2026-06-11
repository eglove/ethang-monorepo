---
name: requirements-pipeline
description: Primary requirements skill. Execute when asked to define requirements from a GitHub issue or user description. Drives intake, multi-lens analysis, and structured requirements.md output.
---

# Requirements Pipeline

Execute this pipeline when asked to define requirements from a GitHub issue or user-provided description.

Produces a single artifact: `requirements.md` — a structured requirements definition with state machine, test hypotheses, and traceability.

## Skills

### `requirements-analyst`

Load for Step 4. Performs full multi-lens requirements analysis: SWEBOK Ch 1 requirements extraction, Ch 5 state machine derivation, Ch 2 design impact, Ch 14 compliance review.

### `requirements-writer`

Load for Step 5. Writes the structured requirements.md from the completed analysis using the full document template.

---

## Step 1: Intake

Accept any of the following inputs:
- A GitHub issue number or URL → use `gh issue view {number} --json title,body,labels,milestone,assignees,comments`
- User-provided prose description → treat as the issue body directly

Run in parallel:

### 1a. Fetch main issue (if GitHub issue)

```
gh issue view {number} --json title,body,labels,milestone,assignees,comments,state
```

### 1b. Detect linked issues

Scan the issue body and comments for GitHub issue URLs or cross-references (`#NNN`). For each found:
```
gh issue view {linked-number} --json title,body,labels,state
```

### 1c. Detect technology context

From the issue body and any referenced code paths, determine:
- **React/frontend** (mentions components, UI, screens, forms, TanStack Query)
- **Hono/Worker** (mentions API, endpoint, Worker, wrangler, Drizzle, database)
- **Both** (full-stack change)
- **Other** (scripts, config, tooling)

Present to the user: issue title, type, acceptance criteria summary, technology context, linked issues found. Ask: "Does this look right? Confirm / Correct." Wait for the answer.

> Produces: `ISSUE_KEY`, `ISSUE_CONTEXT`, `LINKED_ISSUES_LIST`, `TECH_CONTEXT`

---

## Step 2: Gather Linked Context

For each linked issue (from Step 1b), fetch and summarize. If the body references external URLs (documentation, RFCs, design docs), fetch them.

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

Load and follow the `requirements-analyst` skill.

Provide:
- `ISSUE_CONTEXT`
- `LINKED_CONTEXT`
- `DOCS_CONTEXT`
- `CODE_CONTEXT`

The analyst applies SWEBOK Ch 1 (requirements), Ch 5 (state machine/test design), Ch 2 (design impact), and Ch 14 (professional & compliance).

> Produces: `REQUIREMENTS_ANALYSIS`

---

## Step 5: Generate Requirements Definition

Load and follow the `requirements-writer` skill.

Provide all artifacts: `ISSUE_KEY`, `ISSUE_CONTEXT`, `LINKED_CONTEXT`, `DOCS_CONTEXT`, `CODE_CONTEXT`, `REQUIREMENTS_ANALYSIS`.

The writer produces `requirements.md` at `{output-path}/{ISSUE_KEY}/requirements.md`.

Present to the user: output file path, requirement counts, and any gaps discovered. Ask: "Approve as final / Request changes / Abort." Wait for the answer.

On changes requested: apply feedback, regenerate the affected sections, re-present. Repeat until approved.

> Produces: `requirements.md`

---

## Edge Cases

- **No linked issues**: Proceed from main issue only.
- **Linked issue inaccessible** (404 or private): Note in the linked issues table. Proceed with available context.
- **No acceptance criteria**: Flag as gap. Derive implicit AC from the issue description. Note each as "Inferred."
- **Pure tooling/config issue** (no runtime behavior change): Skip state machine derivation. Focus on correctness and migration safety requirements only.
