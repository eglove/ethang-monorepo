---
tags: [backlog, eslint, eslint-plugin, lodash]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-lodash-trim` / `prefer-lodash-trimStart` / `prefer-lodash-trimEnd`

## Goal

Detect native `s.trim()`, `s.trimStart()`, `s.trimEnd()` and suggest lodash's `trim(s)`, `trimStart(s)`, `trimEnd(s)` which support optional character set parameters.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-lodash-trim.ts`
2. Detection: `CallExpression` on `MemberExpression` with `trim`/`trimStart`/`trimEnd` property
3. Autofix ⚠: only parameterless calls (`s.trim()` → `trim(s)`); calls with arguments are report-only
4. Skip if `.trim` is not called (property access without invocation)
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Nested trimming `str.trim().trimStart()` → `trimStart(trim(str))` — tricky to autofix; consider report-only for nested calls
- Receiver side effects: `getStr().trim()` → `trim(getStr())` is fine (single evaluation), but verify