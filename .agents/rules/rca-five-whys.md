---
description: "Bug root cause analysis: trust-the-problem discipline, the 5-Whys chain, defect-pattern scan across the repo, regression analysis via git log, and defect classification. Use when the task is a bug or contains 'defect'/'regression'/'fix'; produces the RCA_FINDINGS contract."
trigger: model_decision
---

# Bug Root Cause Analysis

> Theory: read `resources/ch18-engineering.md` in the `swebok` skill for RCA method selection
> (5-Whys vs fishbone vs FTA), the full 5-Whys procedure, and stopping criteria, and
> `resources/ch12-quality.md` for defect taxonomy and classification theory (max 3 chapters per task).
> This rule contains only the repo-specific procedures and output contract.

Apply when the task is a bug, or its description contains "defect", "regression", or "fix". Spend
5-10 minutes on analysis — not a bureaucratic exercise, but enough to fix the right thing.

## Trust the Problem, Verify the Solution

If the task proposes a specific fix (e.g., "change X to Y", "add a null check in Z"), treat it as a
**hypothesis**, not a directive:

1. The **problem statement** (symptoms, repro steps, expected vs actual) = requirements. Trust these.
2. The **proposed solution** = a guess by someone who may not have full codebase context. Verify it
   independently.
3. Before adopting the proposed fix, confirm it addresses the actual root cause, not just the symptom.
4. If the proposed fix is wrong or incomplete, document why and propose the correct fix.

## 5-Whys

Start from the reported symptom and ask "Why?" until you reach a fundamental gap:

1. **Symptom** — what is failing for the user?
2. **Why #1** — what code/logic produces that symptom?
3. **Why #2** — why does that code behave incorrectly?
4. **Why #3** — why was it implemented that way?
5. **Why #4-5** — what design gap, missing requirement, or misunderstanding led here?

## Repo Defect-Pattern Scan

After identifying the root cause, check if the same defect pattern exists elsewhere in the repo. Grep
the source for the pattern (e.g. the missing guard, the unsafe cast, the un-awaited promise) across the
affected package's `src/`.

If the pattern appears in multiple places:
- The fix scope may need to expand (fix all instances)
- Or at minimum, document the other instances as known technical debt
- Consider whether a shared utility/guard would prevent recurrence

## Regression Analysis via git log

Determine what change introduced the bug:

```
git log --oneline -20 -- path/to/affected/file
```

If the bug is a regression (worked before, broke after a specific commit):
- The introducing commit narrows the root cause
- The fix may be a revert + proper re-implementation
- Add a regression test that specifically asserts the pre-regression behavior

## Defect Classification

After the 5-Whys, classify the defect to enable systematic prevention:

- **Defect type**: logic | interface | data | timing/concurrency | configuration | security
- **Discovery phase**: requirements | design | construction | testing | operation
- **Recurrence check**: search git log for similar fixes in the same area — isolated or recurring?
- **Prevention gate**: recommend a targeted prevention step based on type and phase (new parameterized
  test, lint rule, type-level constraint, or process step)

## RCA_FINDINGS Output Contract

Produce `RCA_FINDINGS`:
- **Root cause statement** (1-2 sentences)
- **5-Whys chain** (include each Why level)
- **Pattern scan results** (other instances found, or "pattern is unique to this location")
- **Regression info** (introducing commit if identified, or "not a regression / unknown")
- **Defect classification** (type, discovery phase, recurrence, prevention gate)
- **Verdict on the proposed solution** (correct / partially correct / incorrect / no solution proposed)

These findings feed into the execution plan's Context section and inform both the test inventory (what
to assert) and the implementation plan (what to change).
