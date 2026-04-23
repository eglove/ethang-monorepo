# Specification: Standardize browserslist and node engines across workspaces

## Objective
To ensure all applications and packages within the monorepo consistently use `browserslist-config-baseline` and specify a minimum Node.js engine version of 24.

## Scope
- All `package.json` files within the `apps/` and `packages/` directories.

## Requirements
- Every `package.json` must include `"browserslist-config-baseline"` in its `devDependencies`.
- Every `package.json` must contain the following `browserslist` configuration:
  ```json
  "browserslist": [
    "extends browserslist-config-baseline",
    "current node"
  ],
  ```
- Every `package.json` must contain the following `engines` configuration:
  ```json
  "engines": {
    "node": ">=24"
  },
  ```
- The root `pnpm-lock.yaml` file must be updated to reflect these changes.