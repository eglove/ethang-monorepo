# Specification: Standardize ESLint configurations across the monorepo

## Objective
To ensure all applications and packages within the monorepo use the shared ESLint configuration (`@ethang/eslint-config`) uniformly, enforcing consistent code style and quality.

## Scope
- Review existing `eslint.config.js` or `eslint.config.ts` files in all apps and packages.
- Update configurations to extend or strictly use the shared `@ethang/eslint-config`.
- Resolve any resulting linting errors or warnings introduced by the standardization.

## Requirements
- All monorepo projects must use the shared configuration.
- No application should have custom ESLint rules that override the shared config unless explicitly documented and necessary.
- Code should pass linting and formatting successfully across the monorepo via `pnpm lint` or equivalent command.