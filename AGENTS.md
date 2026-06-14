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

## CRITICAL: Test-Driven Development (Red -> Green -> Refactor)

**This is the highest-priority rule for ALL production code changes. No exceptions.**

Every change must follow the strict Red-Green-Refactor pipeline:

1. **Red (Hypothesis)** — Write a failing test *first* that proves the problem exists or specifies the new behavior. Do
   **not** touch production code yet. Run the test and ensure it fails for the correct reason.
2. **Green (Conclusion)** — Write the minimum production code necessary to make the test pass.
3. **Refactor** — Clean up the code while keeping the tests green: simplify logic, reduce change surface, eliminate
   duplication, improve naming, and minimize cognitive complexity.

### State Coverage

Line coverage is a baseline, not the goal. You must cover **all possible states** a unit can receive:

* Valid inputs, invalid inputs, boundary values, empty/null/undefined states.
* Error states, loading states, race conditions, and concurrent states.
* Use parameterized tests (such as Vitest `it.each`) to cover many input-output cases in a single test block.

### Scientific Engineering Approach

Treat every test as a scientific experiment:

* **Hypothesis:** The test describes the expected behavior before the code exists.
* **Experiment:** Run the test; it **must fail** (Red) to confirm the hypothesis is testable and that you are not
  writing a false-positive test.
* **Conclusion:** Production code makes the test pass (Green), confirming the hypothesis.
* If a test passes before you write the production code, investigate why immediately.

---

## Parallel Agent Execution & Efficiency

To optimize resource usage, latency, and token consumption:

* **Fan out work** into parallel subagents as often as possible.
* **Choose the minimum model and effort level** required for each task to minimize token usage.

---

## Domain-Driven Design (DDD) Lens

All agents must apply a DDD analytical lens when analyzing, planning, and implementing features in the codebase:

### Strategic (Requirements & Planning)

* **Bounded Context:** Identify the bounded context (package boundaries, route groups, database schema modules) the
  ticket belongs to.
* **Ubiquitous Language:** Extract the ubiquitous language from the requirements; flag any divergence from existing code
  vocabulary.
* **Domain Events:** Name the domain events that this feature produces or consumes (past-tense business occurrences).

### Tactical (Implementation & Review)

* **CQRS (Command Query Responsibility Segregation):**
    * GET/Select operations = **Queries** (reads)
    * Write/Mutation operations = **Commands** (mutations)
    * Keep queries and commands strictly separated.
* **Specification Pattern:** Encapsulate complex eligibility or filtering logic (3+ conditions) into a named, reusable
  predicate class or function.
* **Value Objects:** Use branded TypeScript types for domain-meaningful primitives (e.g., account numbers, money, date
  ranges) to prevent primitive obsession.

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

## Proven Patterns

Approaches confirmed to work well in this workspace.

- **Avoid Duplicating Rules and Instructions**: Avoid duplicating existing rules, instructions, or hierarchies across
  different files. Check and search other rule and skill artifacts (e.g. using `search_in_files_by_text`) before making
  changes to keep documentation modular, single-sourced, and consistent.
- **Manifest-Based Builder Cleaning**: When writing workspace compilers or code-generators that overwrite files, write a
  build manifest (e.g. `.manifest.json`) and use it for targeted file deletion and empty folder pruning. This preserves
  third-party or externally installed files located in the output directory.
- **SonarCloud Tree Measures Retrieval**: To retrieve file-level metrics (such as code coverage or duplication density) for a project's descendant files, use the `/api/measures/component_tree` API endpoint instead of `/api/components/tree`, as the latter does not populate the `measures` array for descendants.
