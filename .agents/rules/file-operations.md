---
trigger: always_on
---

# File Operations Priority Hierarchy

All file operations and terminal executions on Windows must prioritize tools according to the following hierarchy:

| Priority | Tool | When to Use |
| :--- | :--- | :--- |
| 1 | **JetBrains WebStorm MCP** (`mcp__webstorm__*`) | All file **UPDATE/DELETE** operations (for safe refactoring), and as a primary tool for file **READ** operations when the IDE is running. |
| 2 | **Search & JSON CLI Tools** (`es`, `jq`, `rg`) | Priority for all file **READ** operations (e.g., path searching with `es`, JSON operations with `jq`, text searching with `rg`) if WebStorm MCP is unavailable. |
| 3 | **PowerShell** | File-adjacent shell operations that the prior tools cannot cover (path operations, directory listing, process management). Full access to .NET APIs for advanced scripting. |
| 4 | **Native Tools** (`Grep`, `Glob`, `Read`, `Edit`, `Write`) | Only when prior tools cannot cover the operation. |
| 5 | **Bash** | Last resort only — always prefer PowerShell on Windows. |

*Note: WebStorm is assumed to be running. Use it as the primary tool for all file operations (READ, UPDATE, and DELETE) when the IDE is running.*

## Token Efficiency & CLI Optimization

1. **Prefer IDE search/inspect tools over terminal commands:** WebStorm MCP search/symbol tools (like `search_in_files_by_text` and `get_symbol_info`) use indexing and return structured, compact JSON results instead of dumping raw stream outputs. Avoid running terminal tools (`rg`, `grep`, etc.) unless the IDE is unavailable.
2. **Selective / Incremental Diffing:** When analyzing repository changes, do not run a full `git diff` or `git diff --staged` on large change surfaces. Run `git diff --name-only` or `git diff --stat` first to view the file list, then inspect diffs of individual files of interest. This prevents thousands of lines of diff content from bloating the conversation history and consuming excessive tokens on subsequent turns.
3. **Targeted Test Execution:** When running tests during active coding loops (e.g. Red/Green phases), execute targeted test files (e.g. `pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage`) rather than running the full package or workspace test suites. Full test runs and coverage reports generate huge outputs that clutter the context.
4. **Avoid redundant read operations:** Do not repeatedly read the same files or list the same directories within a task. Reuse the workspace context where possible.

### Search & JSON CLI Tools Reference

To ensure efficient file READ operations, familiarize yourself with the basic usage patterns of these CLI tools. Detailed help documentation and examples are available in their respective rules:
- **Everything Search CLI**: [es-cli](es-cli.md)
- **JSON Processor**: [jq-cli](jq-cli.md)
- **ripgrep**: [rg-cli](rg-cli.md)
