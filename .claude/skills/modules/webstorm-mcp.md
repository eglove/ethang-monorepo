# Module: WebStorm MCP — Codebase Exploration Constraints

When exploring the codebase, **always use the WebStorm MCP server** (`mcp__webstorm__*`) instead of built-in tools.

> **Tool list is dynamic.** Use `ToolSearch` with a query like `"webstorm"` to discover the current set of available `mcp__webstorm__*` tools before acting. Do not rely on a hardcoded list — the server's capabilities may change across WebStorm versions.

## Conceptual mapping (look up exact tool names via ToolSearch)

| Task | Tool category | Not this |
|------|--------------|----------|
| Find files by pattern or name | `find_files_by_*` | Glob / Bash find |
| Search file content | `search_in_files_by_*` | Grep |
| Read a file | `read_file` / `get_file_text_by_path` | Read |
| Edit a file | `replace_text_in_file` | Edit / Write |
| Look up a symbol | `get_symbol_info` / `search_symbol` | Grep |
| Check lint/type errors | `get_file_problems` | Bash |
| Run terminal commands | `execute_terminal_command` | Bash |
| Run build/tests | `execute_run_configuration` / `build_project` | Bash |

Fall back to built-in tools only when the WebStorm MCP server does not expose the needed capability.
