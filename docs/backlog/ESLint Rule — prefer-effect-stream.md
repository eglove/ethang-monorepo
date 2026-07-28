---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-stream`

## Goal

Detect `async function*` generators. Suggest `Stream.asyncEffect(...)` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-stream.ts`.
2. Detection: `FunctionDeclaration` or variable declarations with `async function*`.
3. Also detect async generators passed to iteration contexts (`for await...of`).
4. Report-only. The migration is semantic.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- Simple async generators have a single yield. Stream may be overkill.
- `for await...of` over async generators is a common Node.js pattern. Flagging every instance is noisy.
