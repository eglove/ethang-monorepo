# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in `ethang-monorepo`.

---

## File Operations Priority Hierarchy

All file operations and terminal executions on Windows must prioritize tools according to the following hierarchy:

| Priority | Tool | When to Use |
| :--- | :--- | :--- |
| 1 | **Search & JSON CLI Tools** (`es`, `jq`, `rg`) | Priority for all file **READ** operations (e.g., path searching with `es`, JSON operations with `jq`, text searching with `rg`). |
| 2 | **JetBrains WebStorm MCP** (`mcp__webstorm__*`) | All file **UPDATE/DELETE** operations (for safe refactoring), and as a backup for file **READ** operations when the IDE is running. |
| 3 | **PowerShell** | File-adjacent shell operations that the prior tools cannot cover (path operations, directory listing, process management). Full access to .NET APIs for advanced scripting. |
| 4 | **Native Tools** (`Grep`, `Glob`, `Read`, `Edit`, `Write`) | Only when prior tools cannot cover the operation. |
| 5 | **Bash** | Last resort only — always prefer PowerShell on Windows. |

*Note: WebStorm is assumed to be running. Use it for all UPDATE/DELETE operations, and as a backup for READ operations if CLI tools are unavailable or insufficient.*

### Search & JSON CLI Tools Reference

To ensure efficient file READ operations, familiarize yourself with the basic usage patterns of these CLI tools. Detailed help documentation and examples are available in their respective skills:
- **Everything Search CLI**: [es-cli](.agents/plugins/git/skills/es-cli/SKILL.md)
- **JSON Processor**: [jq-cli](.agents/plugins/git/skills/jq-cli/SKILL.md)
- **ripgrep**: [rg-cli](.agents/plugins/git/skills/rg-cli/SKILL.md)

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

## SWEBOK v4 Standards & Glossary

All requirements analysis, design, testing, and maintenance work must align with SWEBOK v4 guidelines:
* Load the [swebok](.agents/plugins/requirements/skills/swebok/SKILL.md) chapter index and router to find the matching chapter resource path.
* Read the matching `resources/chNN-*.md` file (maximum 3 chapters per task to conserve context).
* Reference the cross-cutting vocabulary (e.g., distinguishing between **Error**, **Defect/Fault**, and **Failure**).
