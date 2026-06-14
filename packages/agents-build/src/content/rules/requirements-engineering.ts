import { defineRule } from "../../define.ts";

export const requirementsEngineering = defineRule({
  content: `# Requirements Engineering

Use this rule to perform software requirements elicitation, analysis, validation, and documentation (SWEBOK Ch 1 & Ch 14).

## Concept Phase & Needs Elicitation

Identify and document:
1. The business problem or mission need.
2. Stakeholders and success criteria.
3. Constraints (time, budget, compliance, platform).
4. Initial risks.

For bugs or defects (words like "defect", "regression", "fix", or "incident"), classify the corrective work (SWEBOK Ch 7) and run Root Cause Analysis (see \`rca-five-whys\`) first.

## Elicitation and Analysis (SWEBOK Ch 1)

1. **Separate problem from proposed solution:**
   - **PROBLEM**: the actual requirement (what behavior must the system exhibit?)
   - **PROPOSED SOLUTION**: the suggested implementation (a hypothesis to be verified)
   - Confirm if the proposed solution addresses the root cause or just a symptom.
2. **Functional Requirements (FR-N):** Stated as observable behaviors. Map issue AC to FRs.
3. **Non-Functional Requirements (NFR-N):** Map performance, accessibility, security, compatibility, privacy, and compliance concerns.
4. **Implicit Requirements (IR-N):** Detail error states, loading states, empty states, and defensive programming bounds.
5. **State Machine Analysis:** Derive the system states, transitions, and guards from requirements (see \`tdd-state-coverage\`).

## Compliance & Professional Practice (SWEBOK Ch 14)

Review requirements for:
- **Dark patterns**: Avoid designs pushing customers toward unintended actions.
- **PII/Privacy & Data Minimization**: Minimize collection of personal data. Flag fields exposing PII in logs, URLs, or API responses.
- **GDPR/CCPA**: Determine the legal basis if processing personal data.

## Requirements Document Artifact (\`requirements.md\`)

Document the requirements in the issue-specific directory: \`{output-path}/requirements.md\`.

### Document Template

\`\`\`markdown
# Requirements: {ISSUE_KEY} — {issue title}

## Problem Statement
{what behavior must the system exhibit? separated from any proposed solution}

## Full Context

### Issue Acceptance Criteria
{verbatim AC items, numbered}

### Linked Issues
| Key | Link type | Summary |
|-----|-----------|---------|

### Documentation References
| Title | URL | Relevance |
|-------|-----|-----------|

## Requirements

### Functional Requirements
| ID | Requirement | Source | Priority |
|----|-------------|--------|----------|

### Non-Functional Requirements
| ID | Requirement | Category | Source |

### Implicit Requirements
| ID | Requirement | Rationale |

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
### Schema / Database
| File | Change type | Notes |

### Data Flow Trace
{UI → query hook → API route → service → repository → DB}

## Risks and Gotchas
| ID | Risk | Severity | Mitigation |

## Traceability Matrix
| FR/NFR/IR ID | Source AC | State # | Test hypothesis |
|--------------|-----------|---------|-----------------|
\`\`\``,
  description:
    "requirements analysis, writing requirements, analyzing issues, specifying features, or creating requirements.md",
  filename: "requirements-engineering",
  trigger: "model_decision"
});
