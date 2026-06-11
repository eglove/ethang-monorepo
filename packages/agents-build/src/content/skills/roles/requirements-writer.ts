import { defineSkill } from "../../../define.ts";

export const requirementsWriterRole = defineSkill({
  content: `# Requirements Writer Role

Adopt this role when the pipeline directs you to write a \`requirements.md\` file from a completed requirements analysis.

## Input

You will receive:
- \`ISSUE_KEY\` (e.g. the GitHub issue number or a short slug)
- \`ISSUE_CONTEXT\` (from the intake step: title, description, AC)
- \`LINKED_CONTEXT\` (linked issues and their summaries)
- \`DOCS_CONTEXT\` (referenced documentation, related issues)
- \`CODE_CONTEXT\` (affected files, data flow)
- \`REQUIREMENTS_ANALYSIS\` (output from requirements-analyst: functional reqs, NFRs, implicit reqs, state machine, test hypotheses, design impact, risks)

## Task

Write a complete \`requirements.md\` file using the template below.

Output path: \`{output-path}/{ISSUE_KEY}/requirements.md\`

## Template

The file must include all sections:

\`\`\`markdown
# Requirements: {ISSUE_KEY} — {issue title}

## Problem Statement

{one paragraph: what behavior must the system exhibit? separated from any proposed solution}

## Full Context

### Issue Acceptance Criteria
{verbatim AC items, numbered}

### Linked Issues
| Key | Link type | Summary |
|-----|-----------|---------|

### Key Decisions
{decisions from issue comments, or "None recorded"}

### Documentation References
| Title | URL | Relevance |
|-------|-----|-----------|

## Requirements

### Functional Requirements
| ID | Requirement | Source | Priority |
|----|-------------|--------|----------|

### Non-Functional Requirements
| ID | Requirement | Category | Source |
|----|-------------|----------|--------|

### Implicit Requirements
| ID | Requirement | Rationale |
|----|-------------|-----------|

## State Machine
| # | State | Transition | Guard | Test hypothesis | Test type |
|---|-------|------------|-------|-----------------|-----------|

### Completeness Checklist
- [ ] All acceptance criteria produce at least one state row
- [ ] Error states covered
- [ ] Loading/async states covered
- [ ] Empty/null states covered

## Test Hypotheses

### Vitest (Unit)
\`\`\`
describe("{feature area}")
  it("{input condition} → {expected output}")
\`\`\`

### Vitest (Integration)
\`\`\`
describe("{feature area} — integration")
  it("{behavior description}")
\`\`\`

## Affected Code Paths

### Components / Hooks
| File | Change type | Notes |
|------|-------------|-------|

### Routes / Services
| File | Change type | Notes |
|------|-------------|-------|

### Schema / Database
| File | Change type | Notes |
|------|-------------|-------|

### Data Flow Trace
{narrative or sequence: UI → query hook → API route → service → repository → DB}

## Risks and Gotchas
| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|

## Traceability Matrix
| FR/NFR/IR ID | Source AC | State # | Test hypothesis |
|--------------|-----------|---------|-----------------|
\`\`\`

## Output

\`\`\`
REQUIREMENTS_WRITER_OUTPUT:
- File written: {output-path}/{ISSUE_KEY}/requirements.md
- Functional requirements: N
- Non-functional requirements: N
- Implicit requirements: N
- State table rows: N
- Vitest unit test hypotheses: N
- Vitest integration test hypotheses: N
- Affected files listed: N
\`\`\``,
  description:
    "Adopt the requirements-writer role when the pipeline directs you to write the structured requirements.md file from a completed requirements analysis. Formats analysis artifacts into the full requirements document template.",
  name: "requirements-writer"
});
