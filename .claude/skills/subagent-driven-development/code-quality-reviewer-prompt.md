# Code Quality Reviewer Prompt Template

Use this template when dispatching code quality reviewer subagents.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

## Three-Focus Parallel Review

Launch 3 parallel reviewer subagents, each with a different lens. This surfaces issues a single reviewer would miss.

**Agent 1 — Simplicity, DRY, Elegance**
```
Task tool (general-purpose):
  description: "Review simplicity/DRY for Task N"
  prompt: |
    You are reviewing code changes for simplicity, DRY adherence, and elegance.

    BASE_SHA: [commit before task]
    HEAD_SHA: [current commit]

    Run: git diff BASE_SHA..HEAD_SHA

    Focus exclusively on:
    - Is any logic duplicated that should be extracted?
    - Is this code simpler than it could be? (YAGNI violations, over-engineering)
    - Is it readable and well-named?
    - Are there 3+ repeated string literals that should be constants?
    - Does code you're touching have nearby lodash opportunities (hand-rolled array/object ops)?

    HIGH SIGNAL ONLY. Do not flag style preferences or issues a linter catches.
    Return: list of issues with file:line, what's wrong, why it matters.
```

**Agent 2 — Bugs and Functional Correctness**
```
Task tool (general-purpose):
  description: "Review correctness for Task N"
  prompt: |
    You are reviewing code changes for bugs and functional correctness.

    BASE_SHA: [commit before task]
    HEAD_SHA: [current commit]
    WHAT_WAS_IMPLEMENTED: [from implementer's report]

    Run: git diff BASE_SHA..HEAD_SHA

    Focus exclusively on:
    - Code that will fail to compile or type-check (syntax errors, type errors, missing imports)
    - Clear logic errors that produce wrong results regardless of inputs
    - Missing error handling at system boundaries (user input, external APIs)
    - Unhandled state transitions or missing states (idle/loading/success/error/etc.)
    - Tests that mock behavior instead of testing real behavior

    HIGH SIGNAL ONLY. Only flag issues you are confident exist. If uncertain, do not flag.
    Do NOT flag: pre-existing issues, style, potential issues that depend on specific inputs.
    Return: list of issues with file:line, what's wrong, why it matters.
```

**Agent 3 — Project Conventions**
```
Task tool (general-purpose):
  description: "Review conventions for Task N"
  prompt: |
    You are reviewing code changes for project convention adherence.

    BASE_SHA: [commit before task]
    HEAD_SHA: [current commit]

    Run: git diff BASE_SHA..HEAD_SHA

    Check for violations of these conventions:
    - Domain-Driven Design, Atomic Design: see `.claude/skills/domain-driven-design/SKILL.md`; BDD (Gherkin test scenarios): see `.claude/skills/doc-bdd/SKILL.md`
      for full conventions. Key violations: business logic in entry points, atoms/molecules with
      side effects, UI tests that inspect implementation internals rather than user-visible behavior.
    - State machine: are all states enumerated? Are impossible states unrepresentable in types?
      Are "impossible" branches documented rather than silently omitted?
    - File structure: does each new file have one clear responsibility with a well-defined interface?
      Are units decomposed so they can be understood and tested independently?
    - Plan adherence: does the implementation follow the file structure defined in the plan?
    - File size: did this change create new files that are already large, or significantly grow
      existing files? (Don't flag pre-existing sizes — focus on what this change contributed.)

    Quote the exact convention being violated when you flag an issue.
    HIGH SIGNAL ONLY. Do not flag pre-existing issues or issues outside the changed code.
    Return: list of issues with file:line, convention violated (quoted), why it matters.
```

## Consolidation and Confidence Scoring

After all 3 agents return:

1. **Merge findings** — combine all issues, deduplicate overlaps
2. **Validate uncertain issues** — for any issue flagged by only one agent that seems uncertain, read the actual code to confirm it's real before including it. Issues flagged by 2+ agents are high-confidence; include them directly.
3. **Filter false positives** — do NOT include:
   - Pre-existing issues (not introduced by this change)
   - Issues that depend on specific inputs or external state
   - Pedantic nitpicks a senior engineer would not flag
   - Issues a linter will catch
   - General "could be better" suggestions without a clear fix
4. **Report consolidated findings** using the standard format (Strengths, Issues by severity, Assessment)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
