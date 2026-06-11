---
trigger: always_on
---

# File Operations Priority Hierarchy

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

To ensure efficient file READ operations, familiarize yourself with the basic usage patterns of these CLI tools. Detailed help documentation and examples are available in their respective rules:
- **Everything Search CLI**: [es-cli](es-cli.md)
- **JSON Processor**: [jq-cli](jq-cli.md)
- **ripgrep**: [rg-cli](rg-cli.md)
