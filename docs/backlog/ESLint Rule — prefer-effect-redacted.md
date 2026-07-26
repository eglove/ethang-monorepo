---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-redacted`

## Goal

Detect string literals that look like secrets (API keys, tokens, passwords) in variable assignments and suggest `Redacted.make(value)`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-redacted.ts`
2. Detection: heuristic-based — string literals matching secret patterns:
   - Known key prefixes (`sk-`, `pk-`, `ghp_`, `glpat-`, `xoxb-`, etc.)
   - Variable named `secret`, `token`, `key`, `password`, `apiKey`, `apiSecret`
   - Long base64-like strings (30+ chars, matching `[A-Za-z0-9+/=]{30,}`)
3. Report-only ❌ — never autofix secrets
4. Skip short strings, template literals with interpolation, env var assignments
5. Create unit test and integration test
6. Register in `index.ts`

## Risks

- Heuristic-based — will produce false positives and false negatives
- Must NOT match in test files that intentionally contain fake secrets
- Long random strings that aren't secrets (UUIDs, hashes) could trigger false positives — exclude well-known formats