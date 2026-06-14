---
description: linting, fixing lint errors, formatting, typescript checks, or type errors
trigger: model_decision
---

# Linting and TypeScript Rules

## Load and Follow the eslint-fixer Skill
Whenever you encounter an ESLint issue, linting or TypeScript compilation error, or need to run an ESLint fixer, you **must** load and follow the `eslint-fixer` skill.

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
- **Browser Global Stubbing**: In universal/SDK code running in tests, access window-scoped properties like `location.href` via `globalThis.window.location.href` and verify `globalThis.window` is defined before accessing, to prevent throwing `ReferenceError`/`TypeError` in Node test environments.
- **Index Signature Property Access**: In packages with `noPropertyAccessFromIndexSignature` enabled, use bracket notation `obj["prop"]` instead of dot notation `obj.prop` for objects defined as index-signature types (like `Record<string, any>` or `any`).
- **D1 Mocking Column Order**: When mocking D1 statements in tests or proxies for Drizzle ORM, the array of values returned by `.raw()` must align exactly with the alphabetical/definition order of columns in `sqliteTable` to avoid property mapping mismatches.
- **No ESLint Auto-Revert**: If an ESLint fix fails or breaks something, do not auto-revert the changes globally. Ask the user for guidance on what to do.
- **Single Category ESLint Fixes**: Only fix one category of ESLint issues at a time, and ask the user for confirmation before moving to the next category. Do not attempt to fix the same issue repeatedly if it fails.
- **Explicit Member Accessibility**: Always use explicit accessibility modifiers (`public`/`private`/`protected`) for class members and methods.
- **Arrow Functions Preference**: Enforce the use of arrow functions over function declarations (e.g., `const fn = () => {}` instead of `function fn() {}`).
- **Avoid Explicit Returns**: Avoid specifying explicit return types in TypeScript functions unless strictly necessary. In general, rely on TypeScript's type inference as much as possible.
- **Wrangler Conflicting Secrets**: In Wrangler configuration files (`wrangler.jsonc`/`wrangler.toml`), avoid setting empty placeholders in the `vars` block for variables that are intended to be kept secure as Cloudflare Secrets. When deploying via Wrangler, any empty variables defined in `vars` will overwrite and clear the existing remote secrets on Cloudflare. Keep secrets entirely out of the `vars` block.
- **Vitest Spy Typing**: When defining variables to hold mock/spy instances at the `describe` block scope, type them explicitly using `MockInstance<typeof targetFunction>` (e.g. `let exitSpy: MockInstance<typeof process.exit>;`) rather than using complex wrappers like `ReturnType<typeof vi.spyOn<...>>` to avoid TypeScript generic constraint mismatches.
- **Explicit Node Process Imports**: Import `process` from `"node:process"` inside test files rather than relying on global `process` references to ensure the full Node.js types are resolved correctly.

### Proven Patterns
- **ESLint and Lodash Compliance**: Avoid native `.filter`, `typeof === "string"`, and `.endsWith` on arrays/strings when using Lodash-preferred conventions. Additionally, avoid variable abbreviations like `srcDir` to prevent triggering `unicorn/prevent-abbreviations` (prefer descriptive names like `sourceDirectory`).
- **Strict TypeScript/ESLint checks**: When working under strict ESLint rules (like those in `eslint-config`), avoid non-null assertions (`!`) by using TypeScript type narrowing, and explicitly check nullable values (e.g., `!isNil(val)`) to satisfy `@typescript-eslint/strict-boolean-expressions`. Also, do not mix destructuring and property access of the same object in the same function scope to satisfy `unicorn/consistent-destructuring`.
