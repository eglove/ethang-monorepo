---
tags: [backlog, eslint, eslint-plugin, lodash]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-trim` / `prefer-lodash-trimStart` / `prefer-lodash-trimEnd`

## Goal

Detect native `s.trim()`, `s.trimStart()`, `s.trimEnd()`. Suggest lodash `trim(s)`, `trimStart(s)`, `trimEnd(s)`. The lodash functions support optional character set parameters.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-trim.ts`.
2. Detection: `CallExpression` on `MemberExpression` with `trim`/`trimStart`/`trimEnd` property.
3. Autofix: only parameterless calls are autofixable (`s.trim()` becomes `trim(s)`). Calls with arguments are report-only.
4. Skip if `.trim` is not called. Property access without invocation must be skipped.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- Nested trimming `str.trim().trimStart()` becomes `trimStart(trim(str))`. The autofix is difficult. Consider report-only for nested calls.
- Receiver side effects: `getStr().trim()` becomes `trim(getStr())`. The conversion is fine. The function evaluates once. Verify the behavior.
