---
description: linting, fixing lint errors, formatting, typescript checks, or type errors
trigger: model_decision
---

# Linting and TypeScript Rules

## ESLint Troubleshooting & User Collaboration

* **Request User Help when Struggling with ESLint:** If you encounter conflicting ESLint rules, loops, or tricky typescript/linter constraints that are hard to resolve automatically, do not spin or struggle in a loop. Ask the user for help, explain what you are trying to change, and collaborate to find a clean path forward.

## Style/Quality Guidelines

- **Yoda comparisons**: Always put the constant first in comparisons (e.g., `if (null === value)`).
- **Arrow function blocks**: Always use explicit block bodies and returns in arrow functions (e.g., `(x) => { return x; }`).
- **Arrow functions**: Always use arrow functions rather than function declarations for all function definitions.
- **Explicit member accessibility**: Always use explicit accessibility modifiers (`public`/`private`/`protected`) for all class members.
- **typescript type definitions**: Enforce the use of `type` instead of `interface` for declaring typescript type definitions.
- **consistent-type-imports**: Enforce inline type imports when importing types.
- **isNil**: Perform nullable/boolean checks using Lodash `isNil` for explicit checks instead of implicit truthy/falsy evaluation on nullable values.
- **lodash/** method import path rules: Individual function path imports only, e.g., `import map from "lodash/map.js"`. Never import lodash globally.
- **React 19 rules**: Enforce functional components, purity, immutability, no class components, and no nested component definitions.
- **Ng signals and DI**: Use 信号 APIs (signals) over decorators, standalone components, and dynamic control flow in the Ng framework.
- **Vitest spec checks**: Expect spacing around test blocks, no assertions inside loops, and correct mock setups.

## Linter Conflict Solutions

- **Mock Promise auto-fix deadlock loops**: Avoid conflicts where unicorn removes a mock return value and triggers an empty function error. *Solution*: Use **lodash noop for mocking** (e.g. `vi.fn(noop)`) or insert an empty comment `//` inside the mock async body.
- **Array Methods**: **use lodash over native array methods** for all array operations (e.g., prefer `map(arr, cb)` from `lodash/map.js` over native `arr.map(cb)`).
- **Strict Boolean Expressions**: **use isNil, isString instead of !!** (or other type-guard helpers like `isNumber`) to perform nullable/boolean evaluation. Never cast values to a boolean using `!!`.
- **perfectionist object sorting vs partition comments**: Alphabetic sorting breaks logical pairings (e.g. `{x, y}`). *Solution*: Use partition comments (`// partition`) to prevent sorting.
- **Vitest hook bypass via `onTestFinished`**: Since hooks are forbidden (`vitest/no-hooks`), register mock and stub cleanups using Vitest's `onTestFinished(cleanupFn)` inside setup helper functions. This also avoids using `try-finally` blocks that trigger `unicorn/try-complexity`.
- **Vitest conditional test bypass**: Since conditionals are forbidden inside tests (`vitest/no-conditional-in-test`), split assertions of multiple states or conditions into multiple smaller test blocks, and avoid using `if` blocks directly in tests.
- **Drizzle dynamic queries**: Avoid re-assignment type errors and unsafe `as any` type-casting on query builders by calling `.$dynamic()` on the select statement to erase strict generic types.
- **Deletable properties vs Atomic writes**: Under strict TypeScript check, the `delete` operator requires properties to be optional. Instead of using `delete`, construct a new object that does not include the property (atomic writes), e.g., using destructuring: `const { stack, ...rest } = row; return { ...rest, ...(!isNil(stack) ? { stack } : {}) };`.
- **Zod output types**: Avoid using the deprecated `schema._output` property. Instead, import the inferred type from the schema's package, or use `z.output<typeof schema>` (or `z.infer<typeof schema>`).
- **TypeScript-ESLint compiler cascade warnings**: If eslint reports `no-unsafe-assignment` or `no-unsafe-member-access` on mocks/stubs, run `tsc --noEmit` to verify if generic parameters (e.g. `Mock<Fn>`) are incorrectly defined, which defaults the types to `any` (error types).
- **Apollo Link Connection**: Use Apollo's `from` utility (e.g. `from([authLink, httpLink])`) instead of `.concat` to avoid `unicorn/prefer-spread` conflict.
- **Dynamic Headers Deletion**: Avoid mutating headers dynamically using the `delete` operator, which violates `@typescript-eslint/no-dynamic-delete`. Instead, copy defaults and conditionally populate them using a structured key-value iterator or native `Headers.set/delete` API.
- **EventTarget Override Context**: To avoid `unicorn/no-this-outside-of-class` when monkeypatching EventTarget or native prototypes, declare the patched handler functions as `static` class methods, keeping the `this` keyword lexically scoped.
- **Zod trim Method Bypass**: Zod string validation `.trim()` triggers `lodash/prefer-lodash-method`. Bypass this conflict locally using property bracket notation: `z.string()["trim"]()`. For email validations where `z.string().email()` is deprecated, wrap it in a preprocessor to trim first: `z.preprocess((val) => { return isString(val) ? trim(val) : val; }, z.email())`.
- **Command Line Argument Destructuring**: Use array destructuring (e.g., `const [, , filePath] = globalThis.process.argv`) instead of direct index access to resolve `@typescript-eslint/prefer-destructuring` on `process.argv`.
- **Cyclomatic Complexity Reduction**: Replace complex switch/if statements with a static lookup registry map that routes block/event types to dedicated renderer functions, keeping individual function complexity extremely low.

## Security Mitigations

- **SR-1**: Limit lint-fix attempts to a maximum of 3 iterations to prevent infinite loop execution.
- **SR-3**: Type checks must preserve exact falsy semantics (like empty string `""` or `0`) when modifying boolean checks to prevent logic bypasses.
- **SR-7**: All changes must be traceable, logged, and isolated in specific commits (no auto-push/commit without user permission).

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
