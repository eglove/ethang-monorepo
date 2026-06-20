# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in
`ethang-monorepo`.

> [!IMPORTANT]
> The [swebok](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/swebok/SKILL.md) skill must always be read using the `view_file` tool right away to provide foundational knowledge and guidance on all tasks.

> [!IMPORTANT]
> The [atdd-fsm-tdd](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/atdd-fsm-tdd/SKILL.md) skill must be read using the `view_file` tool and followed for all feature development tasks.

> [!IMPORTANT]
> All tasks on this repository should follow the [ddd](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/ddd/SKILL.md) principles.

> [!IMPORTANT]
> ESLint should **never** be directly run or fixed manually by an agent. All linting tasks must be routed exclusively through the [lint](file:///C:/Users/glove/projects/ethang-monorepo/.agents/skills/lint/SKILL.md) skill.

> [!IMPORTANT]
> Always read and respect the [tool-usage-hierarchy](file:///C:/Users/glove/projects/ethang-monorepo/.agents/rules/tool-hierarchy.md) rule. It defines a strict priority order for tool selection and must be followed at all times.

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

## Package Dependency Conventions

When installing and using packages in this repository, **do not assume the `workspace:*` convention**. Many packages are published and installed via the registry. Always look at how other apps/packages use them before adding a new dependency.
