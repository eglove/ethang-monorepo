---
tags: [backlog, eslint, eslint-plugin, effect, policy]
status: todo
priority: low
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-config`

## Goal

Detect `process.env.X ?? default` and suggest `Config.string("X").pipe(Config.withDefault(default))` from Effect.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-config.ts`
2. Detection: `MemberExpression` accessing `process.env.*` with nullish coalescing `??` or logical OR `||`
3. Also detect `process.env[key]` with computed access and fallback
4. Report-only ❌ — requires Effect Config wiring
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- `import.meta.env.VITE_*` is Vite convention, not Effect Config
- `process.env[key]` with dynamic keys is not statically analyzable
- Some env var access patterns are framework-specific (Next.js `process.env.NEXT_PUBLIC_*`)