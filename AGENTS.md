# AGENTS.md

This document outlines the global rules, development principles, and tool-usage hierarchies for AI agents operating in
`ethang-monorepo`.

## Always-On Skills

The `$swebok` and `$ddd` skills **must always be loaded into context** for every session in this repository. They are not optional.

## CRITICAL: `.junie/` is a Generated Artifact

**Never edit files in `.junie/` directly.** The `.junie/` directory (which contains workspace rules, lifecycle hooks,
and configuration) is compiled from TypeScript definitions and will be overwritten on the next build. Any direct edits
will be lost.

Note that some skills in `.junie/skills/` are added externally and are not part of this build process — only the
skills tracked in `.manifest.json` are generated.

All changes to agent rules, commands, skills, and configuration must go through the compiler package:

* **Source Path:** [packages/agents-build/](packages/agents-build/)

After modifying TypeScript definitions in the builder, compile the changes with:

```bash
pnpm --filter @ethang/agents-build build
```

This compiles the configurations into the `.junie/` directory, validating rules against sizing limits, SWEBOK router
integrity, and drift checks.

---

## CRITICAL: Tool Usage Hierarchy

AI agents must follow this strict tool priority order:

1. **codebase-memory-mcp** (TOP PRIORITY) — use for: `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `get_architecture`
2. **webstorm-mcp** — use for: file writes/creates/renames, refactoring, builds, database/SQL queries
3. **PowerShell + Specialized CLIs** (fallback) — use `/ripgrep` (rg), `/jq`, `/everything-search` (es), `/github-cli` (gh), `/sara-cli`
4. **Banned:** Bash (strictly banned), `replace_file_content`/`write_to_file` (use webstorm-mcp), `view_file`/`read_file` (use MCP tools), `list_dir` (use webstorm-mcp), `find_by_name` (use webstorm-mcp or /everything-search), `grep_search` (use MCP tools or /ripgrep)

---

## Parallel Agent Execution & Efficiency

To optimize resource usage, latency, and token consumption:

* **Fan out work** into parallel subagents as often as possible.
* **Choose the minimum model and effort level** required for each task to minimize token usage.

## Package Dependency Conventions

When installing and using packages in this repository, **do not assume the `workspace:*` convention**. Many packages are published and installed via the registry. Always look at how other apps/packages use them before adding a new dependency.

