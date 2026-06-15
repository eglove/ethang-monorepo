# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in
`ethang-monorepo`.

---

## CRITICAL: `.agents/` is a Generated Artifact

**Never edit files in `.agents/` directly.** The `.agents/` directory (which contains workspace rules, lifecycle hooks,
and skills) is compiled from TypeScript definitions and will be overwritten on the next build. Any direct edits will be
lost.

All changes to agent rules, commands, skills, and configuration must go through the compiler package:

* **Source Path:** [packages/agents-build/](packages/agents-build/)

After modifying TypeScript definitions in the builder, compile the changes with:

```bash
pnpm --filter @ethang/agents-build build
```

This compiles the configurations into the `.agents/` directory, validating rules against sizing limits, SWEBOK router
integrity, and drift checks.

---

## Parallel Agent Execution & Efficiency

To optimize resource usage, latency, and token consumption:

* **Fan out work** into parallel subagents as often as possible.
* **Choose the minimum model and effort level** required for each task to minimize token usage.

---

## Learned Lessons

## Corrections

Rules from explicit user corrections — things the assistant did wrong and must not repeat.

- **Hoisted Mock Imports**: To avoid `ReferenceError` during Vitest mock hoisting, mock classes must be imported rather than declared as variables/classes in the test file scope. Since imports are hoisted to the top of the ES module, they are fully defined before `vi.mock` runs.
- **Constructible Mock Patterns**: When mocking classes in tests to comply with `max-classes-per-file` rules, standard ES6 class mock definitions should be isolated to their own separate files (one class per file, and nothing else), rather than using arrow functions.
- **Resolving String Duplication**: Centralizing duplicate string literals in a dedicated `test-constants.ts` file successfully addresses SonarQube's `sonar/no-duplicate-string` rule. Since imports are hoisted, these constants can be cleanly referenced in both `vi.mock` factories and test cases.
- **Selective Revert Over Global Revert**: Never run global git resets or checkouts (like `git checkout -- .` or
  `git reset --hard`) when asked to revert agent-specific changes, as the user may have unrelated unstaged changes in
  their workspace. Always use `git restore` (or targeted checkout) explicitly on the specific files modified by the
  agent.
- **Avoid Empty Model Output**: Avoid executing a tool or finishing a turn without returning any model text or
  subsequent tool calls. If a tool finishes and there is no other immediate action, provide a textual response to the
  user to avoid empty model output errors.
- **Browser Global Stubbing**: In universal/SDK code running in tests, access window-scoped properties like
  `location.href` via `globalThis.window.location.href` and verify `globalThis.window` is defined before accessing, to
  prevent throwing `ReferenceError`/`TypeError` in Node test environments.
- **Index Signature Property Access**: In packages with `noPropertyAccessFromIndexSignature` enabled, use bracket
  notation `obj["prop"]` instead of dot notation `obj.prop` for objects defined as index-signature types (like
  `Record<string, any>` or `any`).
- **D1 Mocking Column Order**: When mocking D1 statements in tests or proxies for Drizzle ORM, the array of values
  returned by `.raw()` must align exactly with the alphabetical/definition order of columns in `sqliteTable` to avoid
  property mapping mismatches.
- **No ESLint Auto-Revert**: If an ESLint fix fails or breaks something, do not auto-revert the changes globally. Ask the user for guidance on what to do.
- **Single Category ESLint Fixes**: Only fix one category of ESLint issues at a time, and ask the user for confirmation before moving to the next category. Do not attempt to fix the same issue repeatedly if it fails.
- **Explicit Member Accessibility**: Always use explicit accessibility modifiers (`public`/`private`/`protected`) for class members and methods.
- **Arrow Functions Preference**: Enforce the use of arrow functions over function declarations (e.g., `const fn = () => {}` instead of `function fn() {}`).
- **Avoid Explicit Returns**: Avoid specifying explicit return types in TypeScript functions unless strictly necessary. In general, rely on TypeScript's type inference as much as possible.
- **Exact Optional Property Types**: When testing optional parameters under `exactOptionalPropertyTypes: true`, use `Reflect.set(obj, 'prop', undefined)` to dynamically set properties to `undefined` without violating typescript literal checking or using unsafe type assertions.
- **Sonar Assertions in Tests**: To satisfy `sonar/assertions-in-tests` for test cases verifying that a void method executes without issues, wrap the call in `expect(() => ...).not.toThrow()`.
- **Vitest Spy Typing**: When defining variables to hold mock/spy instances at the `describe` block scope, type them explicitly using `MockInstance<typeof targetFunction>` (e.g. `let exitSpy: MockInstance<typeof process.exit>;`) rather than using complex wrappers like `ReturnType<typeof vi.spyOn<...>>` to avoid TypeScript generic constraint mismatches.
- **Explicit Node Process Imports**: Import `process` from `"node:process"` inside test files rather than relying on global `process` references to ensure the full Node.js types are resolved correctly.
- **Multi-Phase Scanning to Reduce Complexity**: When writing custom text/file scanners in tests, split complex loops into distinct search and extraction phases (e.g., finding indices first, then slicing lines). This simplifies loops and satisfies `sonar/cognitive-complexity` and `sonar/nested-control-flow` rules.
- **Safe Array Traversal in Loops**: Avoid accessing array elements by index using non-null assertions (e.g., `arr[i]!`). Instead, use native `for (const item of arr)` loops or array slicing (`arr.slice(start)`) to traverse elements safely and satisfy `@typescript-eslint/no-non-null-assertion` rules.
- **Comment-Stripping Preprocessing**: When parsing configuration files (like YAML) in tests, preprocess the lines to strip comments (`rawLine.slice(0, commentIndex)`) at the start of the function. This prevents inline comments from interfering with subsequent string matching or regex assertions.
- **Yoda and Trailing Else Compliance**: Ensure that all `else if` structures terminate with a trailing `else` statement (even if it's just an empty comment body `// do nothing`), and format condition statements with constants first (e.g. `"env:" === trimmed`) to avoid `sonar/elseif-without-else` and styling violations.
- **Drizzle Chainable Mocks**: When mocking Drizzle query builders in unit tests, chainable methods (like `.values()`, `.from()`, `.where()`) must return `vi.fn().mockReturnThis()` to allow continuous builder calls (such as `.insert().values()`) without causing type or execution errors.
- **TypeScript Unchecked Index Access in Tests**: In packages with strict null checks and `noUncheckedIndexedAccess: true` enabled (which parses array index accesses like `arr[0]` as potentially `undefined`), test assertions should use optional chaining (e.g., `arr[0]?.prop`) to avoid compiler errors without using unsafe non-null assertions.
- **Luxon Date Parsing**: Native JavaScript `Date` constructor and methods are banned in this workspace. Always use Luxon (`DateTime`) for date parsing, validation, and normalization.
- **ESLint Bypass Policy**: If ESLint rules or autofixes cause persistent loops or blocking issues during development, bypass the lint runner after two failed attempts and focus on verifying tests and functional correctness.
- **Vitest \`it.each\` Tuple Typing**: In TypeScript tests using Vitest's \`it.each\` where tuples have varying lengths or union types, explicitly define the tuple type parameter (e.g., \`it.each<[string, string, string, string]>([...])\`) to prevent compiler type resolution mismatches.

## Proven Patterns

Approaches confirmed to work well in this workspace.

- **Avoid Duplicating Rules and Instructions**: Avoid duplicating existing rules, instructions, or hierarchies across
  different files. Check and search other rule and skill artifacts (e.g. using `search_in_files_by_text`) before making
  changes to keep documentation modular, single-sourced, and consistent.
- **Manifest-Based Builder Cleaning**: When writing workspace compilers or code-generators that overwrite files, write a
  build manifest (e.g. `.manifest.json`) and use it for targeted file deletion and empty folder pruning. This preserves
  third-party or externally installed files located in the output directory.
- **SonarCloud Tree Measures Retrieval**: To retrieve file-level metrics (such as code coverage or duplication density) for a project's descendant files, use the `/api/measures/component_tree` API endpoint instead of `/api/components/tree`, as the latter does not populate the `measures` array for descendants.
