---
description: linting, fixing lint errors, formatting, typescript checks, or type errors
trigger: model_decision
---

# Linting and TypeScript Rules

## ESLint Troubleshooting & User Collaboration

* **Request User Help when Struggling with ESLint:** If you encounter conflicting ESLint rules, loops, or tricky typescript/linter constraints that are hard to resolve automatically, do not spin or struggle in a loop. Ask the user for help, explain what you are trying to change, and collaborate to find a clean path forward.

## Learned Lessons

### Corrections
- **Lodash Imports Must Be Individual**: Always import lodash functions individually using the path format (e.g. `import map from "lodash/map.js"`). Never use `import lodash from "lodash"` or `import { map } from "lodash"` — the path-based per-function import is required to keep bundle size small.
- **ESLint Auto-Fix Cycle Deadlock**: When mocking functions (like `vi.fn()`) in tests, watch out for conflicts between eslint rules. For example, using `vi.fn(async () => { return Promise.resolve(); })` will trigger `unicorn/no-useless-promise-resolve-reject`, which auto-fixes on save by stripping `return Promise.resolve()`. This leaves the function body empty: `vi.fn(async () => {})`, which then triggers `@typescript-eslint/no-empty-function`.
  - *Fix:* Insert a comment inside the body to prevent it from being classified as empty:
    ```typescript
    const mockNavigate = vi.fn(async () => {
      //
    });
    ```
- **Explicit Returns in attempt/attemptAsync**: In strict TypeScript configurations (e.g. `TS7030` check), ensure that all code paths within the callback return an explicit value (e.g., a default fallback object or `undefined`) instead of throwing errors or relying on implicit returns, to prevent compilation failures without introducing runtime exception overhead.
- **Lodash isNil for Nullable Checks**: When checking anything nullable, always use `isNil()` from lodash (e.g. `isNil(val)` instead of checking against `undefined` or `null`).

### Proven Patterns
- **ESLint and Lodash Compliance**: Avoid native `.filter`, `typeof === "string"`, and `.endsWith` on arrays/strings when using Lodash-preferred conventions. Additionally, avoid variable abbreviations like `srcDir` to prevent triggering `unicorn/prevent-abbreviations` (prefer descriptive names like `sourceDirectory`).
- **Strict TypeScript/ESLint checks**: When working under strict ESLint rules (like those in `eslint-config`), avoid non-null assertions (`!`) by using TypeScript type narrowing, and explicitly check nullable values (e.g., `!isNil(val)`) to satisfy `@typescript-eslint/strict-boolean-expressions`. Also, do not mix destructuring and property access of the same object in the same function scope to satisfy `unicorn/consistent-destructuring`.
