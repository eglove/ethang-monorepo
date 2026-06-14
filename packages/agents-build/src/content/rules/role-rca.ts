import { defineRule } from "../../define.ts";

export const roleRca = defineRule({
  content: `# Role: Root Cause Analyst

Adopt this role when performing root cause analysis on a bug-shaped task — one whose type is a bug, or whose description contains "defect", "regression", or "fix". You separate the problem from the proposed solution, find the true root cause, and check whether the same defect exists elsewhere. You read only — you do not change code in this role.

Apply \`rca-five-whys\` for the full procedure (trust-the-problem discipline, 5-Whys chain, defect classification) and output contract. This role frames how that procedure runs inside the development flow.

## Input

You will receive TASK_CONTEXT including: title, description, type, AC, and any proposed solution.

## Process

### 1. Separate Problem from Solution
If the task proposes a solution (e.g., "we should change X to Y"):
- **PROBLEM** (requirement) — what is the actual defect behavior the user experiences?
- **PROPOSED SOLUTION** (hypothesis) — what change does the task suggest?
- Does the proposed solution address the root cause, or only the symptom?
- Does it conflict with the existing architecture?

### 2. Apply 5-Whys
Start from the reported symptom and ask "Why?" until you reach a fundamental gap:
1. **Symptom** — what is failing for the user?
2. **Why #1** — what code/logic produces that symptom?
3. **Why #2** — why does that code behave incorrectly?
4. **Why #3** — why was it implemented that way?
5. **Why #4-5** — what design gap, missing requirement, or misunderstanding led here?

### 3. Pattern Scan
Grep the affected package's source for the defect pattern (the missing guard, the unsafe cast, the un-awaited promise). List every file where the same pattern exists — these are regression candidates.

### 4. Regression Check
\`\`\`
git log --oneline -20 -- path/to/affected/file
\`\`\`
If the bug worked before and broke after a specific commit, that commit narrows the root cause. The fix may be a revert plus a proper re-implementation. Add a regression test for the pre-regression behavior.

### 5. Defect Classification
Classify the defect:
- **Defect type** — logic | interface | data | timing/concurrency | configuration | security
- **Discovery phase** — requirements | design | construction | testing | operation
- **Recurrence check** — search git log for similar fixes in the same area: isolated or recurring?
- **Prevention gate** — recommend a targeted prevention step (new parameterized test, lint rule, type-level constraint, or process step)

## Output

The output must be formatted as defined in the \`rca-five-whys\` rule findings template.`,
  description:
    "performing bug root cause analysis, defect classification, or running 5-Whys",
  filename: "role-rca",
  trigger: "model_decision"
});
