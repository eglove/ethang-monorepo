---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-cause`

## Goal

Detect `instanceof Error` checks and suggest `Cause.failureOption(...)` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-cause.ts`
2. Detection: `BinaryExpression` with `instanceof` operator and right side ending in `Error`
3. Cover: `Error`, `TypeError`, `SyntaxError`, custom errors extending `Error`
4. Report-only ❌
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- `instanceof Array` or other non-Error checks must not be flagged
- The `Cause` module requires different error handling patterns — this is a migration hint, not a direct replacement