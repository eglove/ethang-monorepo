---
trigger: always_on
---

# JetBrains WebStorm MCP Server Reference

Use this rule to interact with the JetBrains WebStorm IDE via the Model Context Protocol (MCP) server. These tools allow search, file manipulation, refactoring, building, and running tests directly inside the IDE.

## Priority Hierarchy for File Operations
As defined in the workspace rules, all file operations must prioritize tools as follows:
1. **Search & JSON CLI Tools** (`es`, `jq`, `rg`) for READ operations.
2. **JetBrains WebStorm MCP** (`mcp__webstorm__*`) for all UPDATE/DELETE operations, and as a backup for READ operations.
3. **PowerShell** for directory listing, process management, etc.
4. **Native Tools** (`Grep`, `Glob`, `Read`, `Edit`, `Write`) as a backup.

---

## Tool Category: Analysis & Diagnostics

### `build_project`
Builds the project or specified files and returns compilation errors/warnings.
- **Parameters:**
  - `rebuild` (boolean): Rebuild the entire project. Defaults to false.
  - `filesToRebuild` (string[]): Paths of specific files to compile (relative to project root).
  - `projectPath` (string): Path to the project root. Always provide this if known.
- **Usage:** Call after edits to validate compilation.

### `get_file_problems`
Runs IntelliJ inspections on a file to identify coding issues, syntax errors, and warnings.
- **Parameters:**
  - `filePath` (string): Path relative to project root.
  - `errorsOnly` (boolean): Return only errors. Defaults to false.
  - `projectPath` (string): Path to the project root.

---

## Tool Category: File & Directory Operations

### `create_new_file`
Creates a new file in the project.
- **Parameters:**
  - `filePath` (string): Relative path for the new file.
  - `content` (string): Initial file contents.

### `replace_text_in_file`
Replaces substring or performs text replacements in a file.
- **Parameters:**
  - `filePath` (string): Path relative to project root.
  - `oldText` (string): Substring to find.
  - `newText` (string): Replacement text.

### `find_files_by_glob`
Recursively search file paths matching a glob pattern.
- **Parameters:**
  - `globPattern` (string): Glob pattern (e.g., `src/**/*.ts`).
  - `projectPath` (string): Project root path.

### `find_files_by_name_keyword`
Search files containing a keyword in their name.
- **Parameters:**
  - `keyword` (string): Name keyword to search for.

### `get_all_open_file_paths`
Lists all files currently open in the WebStorm editor.

### `list_directory_tree`
Returns a tree visualization of the directory structure.

### `open_file_in_editor`
Opens a file in the active editor tab.

### `reformat_file`
Runs the IDE formatter on the specified file.

---

## Tool Category: Search & Symbol Discovery

### `search_in_files_by_text`
Searches for a text substring using IntelliJ's search engine (faster than CLI tools).
- **Parameters:**
  - `searchText` (string): Substring to look for.
  - `directoryToSearch` (string): Optional search subdirectory.
  - `fileMask` (string): Optional file mask (e.g., `*.ts`).

### `search_in_files_by_regex`
Searches using a regular expression.
- **Parameters:**
  - `regex` (string): Regex pattern.

### `get_symbol_info`
Retrieves definition/signature/documentation details for a symbol (like "Quick Documentation").
- **Parameters:**
  - `filePath` (string): Relative file path.
  - `line` (integer): 1-based line number.
  - `column` (integer): 1-based column number.

---

## Tool Category: Refactoring & VCS

### `rename_refactoring`
Safe, automated rename refactoring for files or code symbols (renames definitions and all references).
- **Parameters:**
  - `filePath` (string): File containing the symbol.
  - `line` (integer): 1-based line number.
  - `column` (integer): 1-based column number.
  - `newName` (string): Target name.

### `get_repositories`
Lists configured VCS repositories in the workspace.

---

## Tool Category: Execution & Run Configurations

### `get_run_configurations`
Retrieves all configured IDE run configurations.

### `execute_run_configuration`
Executes a run configuration (e.g., test suite or build configuration).
- **Parameters:**
  - `name` (string): The configuration name.

### `execute_terminal_command`
Runs a terminal command within the IDE workspace.
- **Parameters:**
  - `command` (string): Shell command to execute.
- **Security Warning:** Make sure "brave mode" is enabled in WebStorm Settings (Tools -> MCP Server) to run commands without prompting for user confirmation.

---

## Tool Category: Database & SQL Tools

Supports database exploration and querying (requires the "Database Tools and SQL" and "AI Assistant" plugins).
- `list_database_connections`: Lists configured data sources.
- `test_database_connection`: Connection diagnostics.
- `list_database_schemas`: Lists schemas for a connection.
- `list_schema_objects`: Lists objects (tables, views, etc.) in a schema.
- `get_database_object_description`: Retrieves object schema structure.
- `execute_sql_query`: Executes queries (prefer read-only connections).
- `preview_table_data`: Previews table data in CSV format.
