# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in `ethang-monorepo`.

---

## CRITICAL: `.agents/` is a Generated Artifact

**Never edit files in `.agents/` directly.** The `.agents/` directory (which contains workspace rules, lifecycle hooks, and skills) is compiled from TypeScript definitions and will be overwritten on the next build. Any direct edits will be lost.

All changes to agent rules, commands, skills, and configuration must go through the compiler package:
* **Source Path:** [packages/agents-build/](packages/agents-build/)

After modifying TypeScript definitions in the builder, compile the changes with:
```bash
pnpm --filter @ethang/agents-build build
```
This compiles the configurations into the `.agents/` directory, validating rules against sizing limits, SWEBOK router integrity, and drift checks.

---

## CRITICAL: Test-Driven Development (Red -> Green -> Refactor)

**This is the highest-priority rule for ALL production code changes. No exceptions.**

Every change must follow the strict Red-Green-Refactor pipeline:

1. **Red (Hypothesis)** — Write a failing test *first* that proves the problem exists or specifies the new behavior. Do **not** touch production code yet. Run the test and ensure it fails for the correct reason.
2. **Green (Conclusion)** — Write the minimum production code necessary to make the test pass.
3. **Refactor** — Clean up the code while keeping the tests green: simplify logic, reduce change surface, eliminate duplication, improve naming, and minimize cognitive complexity.

### State Coverage
Line coverage is a baseline, not the goal. You must cover **all possible states** a unit can receive:
* Valid inputs, invalid inputs, boundary values, empty/null/undefined states.
* Error states, loading states, race conditions, and concurrent states.
* Use parameterized tests (such as Vitest `it.each`) to cover many input-output cases in a single test block.

### Scientific Engineering Approach
Treat every test as a scientific experiment:
* **Hypothesis:** The test describes the expected behavior before the code exists.
* **Experiment:** Run the test; it **must fail** (Red) to confirm the hypothesis is testable and that you are not writing a false-positive test.
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
* **Bounded Context:** Identify the bounded context (package boundaries, route groups, database schema modules) the ticket belongs to.
* **Ubiquitous Language:** Extract the ubiquitous language from the requirements; flag any divergence from existing code vocabulary.
* **Domain Events:** Name the domain events that this feature produces or consumes (past-tense business occurrences).

### Tactical (Implementation & Review)
* **CQRS (Command Query Responsibility Segregation):**
  * GET/Select operations = **Queries** (reads)
  * Write/Mutation operations = **Commands** (mutations)
  * Keep queries and commands strictly separated.
* **Specification Pattern:** Encapsulate complex eligibility or filtering logic (3+ conditions) into a named, reusable predicate class or function.
* **Value Objects:** Use branded TypeScript types for domain-meaningful primitives (e.g., account numbers, money, date ranges) to prevent primitive obsession.

---

## ESLint Troubleshooting & User Collaboration

* **Request User Help when Struggling with ESLint:** If you encounter conflicting ESLint rules, loops, or tricky typescript/linter constraints that are hard to resolve automatically, do not spin or struggle in a loop. Ask the user for help, explain what you are trying to change, and collaborate to find a clean path forward.

---

## Learned Lessons

## Corrections
Rules from explicit user corrections — things the assistant did wrong and must not repeat.

- **Lodash Imports Must Be Individual**: Always import lodash functions individually using the path format (e.g. `import map from "lodash/map.js"`). Never use `import lodash from "lodash"` or `import { map } from "lodash"` — the path-based per-function import is required to keep bundle size small.
- **ESLint Auto-Fix Cycle Deadlock**: When mocking functions (like `vi.fn()`) in tests, watch out for conflicts between eslint rules. For example, using `vi.fn(async () => { return Promise.resolve(); })` will trigger `unicorn/no-useless-promise-resolve-reject`, which auto-fixes on save by stripping `return Promise.resolve()`. This leaves the function body empty: `vi.fn(async () => {})`, which then triggers `@typescript-eslint/no-empty-function`.
  - *Fix:* Insert a comment inside the body to prevent it from being classified as empty:
    ```typescript
    const mockNavigate = vi.fn(async () => {
      //
    });
    ```
- **Selective Revert Over Global Revert**: Never run global git resets or checkouts (like `git checkout -- .` or `git reset --hard`) when asked to revert agent-specific changes, as the user may have unrelated unstaged changes in their workspace. Always use `git restore` (or targeted checkout) explicitly on the specific files modified by the agent.
- **Explicit Returns in attempt/attemptAsync**: In strict TypeScript configurations (e.g. `TS7030` check), ensure that all code paths within the callback return an explicit value (e.g., a default fallback object or `undefined`) instead of throwing errors or relying on implicit returns, to prevent compilation failures without introducing runtime exception overhead.
- **Lodash isNil for Nullable Checks**: When checking anything nullable, always use `isNil()` from lodash (e.g. `isNil(val)` instead of checking against `undefined` or `null`).
- **WebStorm MCP Argument Nesting**: When calling WebStorm MCP tools via `call_mcp_tool`, pass all parameters (such as `projectPath` and `pathInProject`) inside the `Arguments` property of the tool payload, rather than as top-level fields of `call_mcp_tool`.

## Proven Patterns
Approaches confirmed to work well in this workspace.

- **Everything Search CLI (es) Fallback**: The `es` CLI relies on the Windows Everything IPC service. If the Everything service/application is not running, `es` fails. In this case, fall back to JetBrains WebStorm MCP `find_files_by_glob` or ripgrep (`rg`) to search for file paths.
- **WebStorm MCP `replace_text_in_file` Parameter**: The WebStorm MCP tool `replace_text_in_file` requires the parameter `pathInProject` (and `projectPath`) to successfully locate and replace text in a file. The parameter is named `pathInProject`, not `filePath` (which might be listed in some older documentation).
- **ESLint and Lodash Compliance**: Avoid native `.filter`, `typeof === "string"`, and `.endsWith` on arrays/strings when using Lodash-preferred conventions. Additionally, avoid variable abbreviations like `srcDir` to prevent triggering `unicorn/prevent-abbreviations` (prefer descriptive names like `sourceDirectory`).
- **WebStorm Text Search**: For text searches, prefer using the WebStorm MCP tool `search_in_files_by_text` (passing `projectPath`) rather than broad `rtk rg` terminal commands. WebStorm utilizes its indexed project structure, which executes instantly and avoids background task timeouts/hangs.
- **Strict TypeScript/ESLint checks**: When working under strict ESLint rules (like those in `eslint-config`), avoid non-null assertions (`!`) by using TypeScript type narrowing, and explicitly check nullable values (e.g., `!isNil(val)`) to satisfy `@typescript-eslint/strict-boolean-expressions`. Also, do not mix destructuring and property access of the same object in the same function scope to satisfy `unicorn/consistent-destructuring`.
- **IDE Write Synchronization**: When modifying a file that is actively open or cached in JetBrains WebStorm, avoid native write tools to prevent the IDE from overwriting the file with its in-memory cache. Instead, use WebStorm MCP's `open_file_in_editor` followed by `replace_text_in_file` to ensure WebStorm applies and persists the changes.
