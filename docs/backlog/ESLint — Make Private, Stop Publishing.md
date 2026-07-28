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

- The package is configured for publishing (public, versioned).
- Publish CI workflows may exist.
- Only the monorepo consumes the package.

## Target State

- `"private": true` exists in `package.json`.
- No publish CI or CD steps exist.
- All internal consumers use the workspace protocol (`workspace:*`).
- The versioning is simplified (no changelog generation, no npm publish).

## Plan

1. Audit: list all current consumers. All consumers should be internal.
2. Confirm no external consumers exist. Check the npm registry downloads and GitHub dependents.
3. Set `"private": true` in `packages/eslint/package.json`.
4. Verify all consumers use the `workspace:*` protocol.
5. Remove publish CI workflow steps and jobs.
6. Remove `files`, `publishConfig`, and other publish-only fields from `package.json`.
7. Remove changelog generation if automated.
8. Run the full monorepo lint. Confirm everything resolves.

## Verification

- `pnpm -r lint` passes.
- No publish-related CI steps remain.
- `package.json` has `"private": true`. No publish-only fields exist.

## Risks

- An external project may depend on `@ethang/eslint-config`. Verify first. This breaks the external project.
