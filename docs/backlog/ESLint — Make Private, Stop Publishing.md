---
tags: [backlog, eslint, publishing, monorepo]
status: todo
priority: medium
created: 2026-07-26
---

# ESLint — Make Private, Stop Publishing

## Goal

Convert the `eslint` package from a published package to a private monorepo-only package. Stop all publishing workflows. All consumers are internal.

## Current State

- Package is configured for publishing (public, versioned)
- May have publish CI workflows
- Consumed only within the monorepo

## Target State

- `"private": true` in `package.json`
- No publish CI/CD steps
- Workspace protocol (`workspace:*`) for all internal consumers
- Versioning simplified (no changelog generation, no npm publish)

## Plan

1. Audit: list all current consumers (should all be internal)
2. Confirm no external consumers exist (check npm registry downloads, GitHub dependents)
3. Set `"private": true` in `packages/eslint/package.json`
4. Verify all consumers use `workspace:*` protocol
5. Remove publish CI workflow steps/jobs
6. Remove `files`, `publishConfig`, and other publish-only fields from `package.json`
7. Remove changelog generation if automated
8. Run full monorepo lint to confirm everything resolves

## Verification

- `pnpm -r lint` passes
- No publish-related CI steps remain
- `package.json` has `"private": true` and no publish-only fields

## Risks

- If any external project depends on `@ethang/eslint-config`, this breaks them — verify first
