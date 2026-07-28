---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-match`

## Goal

Detect long `switch` statements and if-else chains. Suggest `Match.tags` / `Match.type` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-match.ts`.
2. Detection: `SwitchStatement` has 3 or more non-default cases. If/else-if chains have 3 or more branches.
3. Note: existing rules `sonar/no-small-switch` and `unicorn/prefer-switch` govern switch vs if-else. This rule fires after those decisions are made.
4. Report-only.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- The rule must not fire on `switch` statements that use discriminated union patterns correctly.
- if/else chain detection requires walking the AST. Count consecutive `else if` branches.
- Ternary chains (`a ? b : c ? d : e`) must also be considered.
