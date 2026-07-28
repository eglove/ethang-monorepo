---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-cause`

## Goal

Detect `instanceof Error` checks. Suggest `Cause.failureOption(...)` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-cause.ts`.
2. Detection: `BinaryExpression` with `instanceof` operator. The right side ends in `Error`.
3. Cover: `Error`, `TypeError`, `SyntaxError`, and custom errors that extend `Error`.
4. Report-only.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- The rule must not flag `instanceof Array` or other non-Error checks.
- The `Cause` module requires different error handling patterns. This is a migration hint. The rule does not provide a direct replacement.
