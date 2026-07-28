---
tags: [backlog, eslint, eslint-plugin, effect]
status: todo
priority: medium
created: 2026-07-26
related: [ESLint — Make Private, Stop Publishing]
---

# ESLint Rule: `prefer-effect-redacted`

## Goal

Detect string literals that look like secrets. The secrets include API keys, tokens, and passwords. The detection exists in variable assignments. Suggest `Redacted.make(value)`.

## Plan

1. Create `packages/eslint-plugin/src/rules/prefer-effect-redacted.ts`.
2. Detection: heuristic-based. String literals match secret patterns:
   - Known key prefixes (`sk-`, `pk-`, `ghp_`, `glpat-`, `xoxb-`, etc.).
   - Variable named `secret`, `token`, `key`, `password`, `apiKey`, `apiSecret`.
   - Long base64-like strings (30+ chars, matching `[A-Za-z0-9+/=]{30,}`).
3. Report-only. Never autofix secrets.
4. Skip short strings. Skip template literals with interpolation. Skip env var assignments.
5. Create unit test and integration test.
6. Register in `index.ts`.

## Risks

- The detection is heuristic-based. The rule produces false positives and false negatives.
- The rule must NOT match in test files. The test files intentionally contain fake secrets.
- Long random strings are not secrets. UUIDs and hashes could trigger false positives. Exclude well-known formats.
