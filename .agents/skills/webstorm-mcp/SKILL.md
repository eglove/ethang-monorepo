---
description: Explains how to use the WebStorm MCP, including available tools, parameters, and examples for complex tools.
name: webstorm-mcp
---

# WebStorm MCP Skill Guide

This skill provides an overview of the tools available via the WebStorm MCP server. It is organized by category to help you easily find the right tool for your task.

## Table of Contents

- [File Operations](#file-operations)
  - [`create_new_file`](#create_new_file)
  - [`get_all_open_file_paths`](#get_all_open_file_paths)
  - [`get_file_text_by_path`](#get_file_text_by_path)
  - [`list_directory_tree`](#list_directory_tree)
  - [`open_file_in_editor`](#open_file_in_editor)
  - [`read_file`](#read_file)
  - [`reformat_file`](#reformat_file)
  - [`replace_text_in_file`](#replace_text_in_file)
- [Search & Navigation](#search-navigation)
  - [`find_files_by_glob`](#find_files_by_glob)
  - [`find_files_by_name_keyword`](#find_files_by_name_keyword)
  - [`get_symbol_info`](#get_symbol_info)
  - [`search_file`](#search_file)
  - [`search_in_files_by_regex`](#search_in_files_by_regex)
  - [`search_in_files_by_text`](#search_in_files_by_text)
  - [`search_regex`](#search_regex)
  - [`search_symbol`](#search_symbol)
  - [`search_text`](#search_text)
- [Refactoring & Inspection](#refactoring-inspection)
  - [`generate_inspection_kts_api`](#generate_inspection_kts_api)
  - [`generate_inspection_kts_examples`](#generate_inspection_kts_examples)
  - [`generate_psi_tree`](#generate_psi_tree)
  - [`get_file_problems`](#get_file_problems)
  - [`rename_refactoring`](#rename_refactoring)
  - [`run_inspection_kts`](#run_inspection_kts)
- [Project & Build](#project-build)
  - [`build_project`](#build_project)
  - [`execute_run_configuration`](#execute_run_configuration)
  - [`execute_terminal_command`](#execute_terminal_command)
  - [`get_project_dependencies`](#get_project_dependencies)
  - [`get_project_modules`](#get_project_modules)
  - [`get_repositories`](#get_repositories)
  - [`get_run_configurations`](#get_run_configurations)
- [Database](#database)
  - [`cancel_sql_query`](#cancel_sql_query)
  - [`execute_sql_query`](#execute_sql_query)
  - [`get_database_object_description`](#get_database_object_description)
  - [`list_database_connections`](#list_database_connections)
  - [`list_database_schemas`](#list_database_schemas)
  - [`list_recent_sql_queries`](#list_recent_sql_queries)
  - [`list_schema_objects`](#list_schema_objects)
  - [`list_schema_object_kinds`](#list_schema_object_kinds)
  - [`preview_table_data`](#preview_table_data)
  - [`test_database_connection`](#test_database_connection)

## File Operations

### `create_new_file`
Creates a new file at the specified path within the project directory and optionally populates it with text if provided.
Use this tool to generate new files in your project structure.
Note: Creates any necessary parent directories automatically

**Parameters:**
- `overwrite` (boolean): Whether to overwrite an existing file if exists. If false, an exception is thrown in case of a conflict.
- `pathInProject` (string) *(Required)*: Path where the file should be created relative to the project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `text` (string): Content to write into the new file

### `get_all_open_file_paths`
Returns active editor's and other open editors' file paths relative to the project root.

Use this tool to explore current open editors.

**Parameters:**
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `get_file_text_by_path`
        Retrieves the text content of a file using its path relative to project root.
        Use this tool to read file contents when you have the file's project-relative path.
        In the case of binary files, the tool returns an error.
        If the file is too large, the text will be truncated with '<<<...content truncated...>>>' marker and in according to the `truncateMode` parameter.

**Parameters:**
- `maxLinesCount` (integer): Max number of lines to return. Truncation will be performed depending on truncateMode.
- `pathInProject` (string) *(Required)*: Path relative to the project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `truncateMode` (string): How to truncate the text: from the start, in the middle, at the end, or don't truncate at all

### `list_directory_tree`
Provides a tree representation of the specified directory in the pseudo graphic format like `tree` utility does.
Use this tool to explore the contents of a directory or the whole project.
You MUST prefer this tool over listing directories via command line utilities like `ls` or `dir`.

**Parameters:**
- `directoryPath` (string) *(Required)*: Path relative to the project root
- `maxDepth` (integer): Maximum recursion depth
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `timeout` (integer): Timeout in milliseconds

### `open_file_in_editor`
Opens the specified file in the JetBrains IDE editor.
Requires a filePath parameter containing the path to the file to open.
The file path can be absolute or relative to the project root.

**Parameters:**
- `filePath` (string) *(Required)*: Path relative to the project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `read_file`
        Reads a file in the project directory or from any project dependency or other project source root.
        Can read sources inside Jar/Jrt files and decompile Java class files inside Jar/Jrt files or on disk. 
        Returns numbered lines (1-indexed) as text.
        Modes: slice, lines, line_columns, offsets, indentation.
        Slice uses start_line and max_lines. Lines uses start_line/end_line (inclusive).
        Line_columns uses start_line/start_column and end_line/end_column (end is exclusive; end_line defaults to start_line).
        Offsets uses start_offset/end_offset (end is exclusive). Indentation uses start_line with max_levels/include_*.
        max_lines caps the total output in all modes; context_lines applies to range modes (per side).

**Parameters:**
- `context_lines` (integer): Number of context lines to include around the range (per side)
- `end_column` (integer): 1-based end column for range read (exclusive)
- `end_line` (integer): 1-based end line for lines/line_columns mode (inclusive for lines; exclusive for line_columns)
- `end_offset` (integer): 0-based end offset for offsets mode (exclusive)
- `file_path` (string) *(Required)*: Path to the file. Supports project-relative paths, paths with '..', absolute paths, archive entries like '/path/lib.jar!/pkg/Foo.class', and URLs such as 'file://', 'jar://', and 'jrt://'. Any path returned from the other tools can be passed as is (e.g. paths from 'search_*' tools).
- `include_header` (boolean): Indentation mode: include header comments/annotations directly above anchor
- `include_siblings` (boolean): Indentation mode: include sibling blocks at the same indentation level
- `max_levels` (integer): Indentation mode: maximum indentation levels to include (0 = only anchor block)
- `max_lines` (integer): Maximum number of lines to return (slice uses as line count; all modes cap output)
- `mode` (string): Read mode: 'slice', 'lines', 'line_columns', 'offsets', or 'indentation'
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `start_column` (integer): 1-based start column for line_columns mode
- `start_line` (integer): 1-based line number to start reading from
- `start_offset` (integer): 0-based start offset for offsets mode (requires end_offset)

### `reformat_file`
Reformats a specified file in the JetBrains IDE.
Use this tool to apply code formatting rules to a file identified by its path.

**Parameters:**
- `path` (string) *(Required)*: Path relative to the project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `replace_text_in_file`
        Replaces text in a file with flexible options for find and replace operations.
        Use this tool to make targeted changes without replacing the entire file content.
        This is the most efficient tool for file modifications when you know the exact text to replace.
        
        Requires three parameters:
        - pathInProject: The path to the target file, relative to project root
        - oldTextOrPatte: The text to be replaced (exact match by default)
        - newText: The replacement text
        
        Optional parameters:
        - replaceAll: Whether to replace all occurrences (default: true)
        - caseSensitive: Whether the search is case-sensitive (default: true)
        - regex: Whether to treat oldText as a regular expression (default: false)
        
        Returns one of these responses:
        - "ok" when replacement happened
        - error "project dir not found" if project directory cannot be determined
        - error "file not found" if the file doesn't exist
        - error "could not get document" if the file content cannot be accessed
        - error "no occurrences found" if the old text was not found in the file
        
        Note: Automatically saves the file after modification

**Parameters:**
- `caseSensitive` (boolean): Case-sensitive search
- `newText` (string) *(Required)*: Replacement text
- `oldText` (string) *(Required)*: Text to be replaced
- `pathInProject` (string) *(Required)*: Path to target file relative to project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `replaceAll` (boolean): Replace all occurrences

**Example Usage:**
```json
{ "pathInProject": "src/main.ts", "oldText": "const x = 1;", "newText": "const x = 2;", "replaceAll": true }
```

## Search & Navigation

### `find_files_by_glob`
Searches for all files in the project whose relative paths match the specified glob pattern.
The search is performed recursively in all subdirectories of the project directory or a specified subdirectory.
Use this tool when you need to find files by a glob pattern (e.g. '**/*.txt').

**Parameters:**
- `addExcluded` (boolean): Whether to add excluded/ignored files to the search results. Files can be excluded from a project either by user of by some ignore rules
- `fileCountLimit` (integer): Maximum number of files to return.
- `globPattern` (string) *(Required)*: Glob pattern to search for. The pattern must be relative to the project root. Example: `src/**/ *.java`
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `subDirectoryRelativePath` (string): Optional subdirectory relative to the project to search in.
- `timeout` (integer): Timeout in milliseconds

**Example Usage:**
```json
{ "pattern": "**/*.ts", "projectPath": "c:/Users/glove/projects/ethang-monorepo" }
```

### `find_files_by_name_keyword`
Searches for all files in the project whose names contain the specified keyword (case-insensitive).
Use this tool to locate files when you know part of the filename.
Note: Matched only names, not paths, because works via indexes.
Note: Only searches through files within the project directory, excluding libraries and external dependencies.
Note: Prefer this tool over other `find` tools because it's much faster, 
but remember that this tool searches only names, not paths and it doesn't support glob patterns.

**Parameters:**
- `fileCountLimit` (integer): Maximum number of files to return.
- `nameKeyword` (string) *(Required)*: Substring to search for in file names
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `timeout` (integer): Timeout in milliseconds

### `get_symbol_info`
Retrieves information about the symbol at the specified position in the specified file.
Provides the same information as Quick Documentation feature of IntelliJ IDEA does.

This tool is useful for getting information about the symbol at the specified position in the specified file.
The information may include the symbol's name, signature, type, documentation, etc. It depends on a particular language.

If the position has a reference to a symbol the tool will return a piece of code with the declaration of the symbol if possible.

Use this tool to understand symbols declaration, semantics, where it's declared, etc.

**Parameters:**
- `column` (integer) *(Required)*: 1-based column number
- `filePath` (string) *(Required)*: Path relative to the project root
- `line` (integer) *(Required)*: 1-based line number
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `search_file`
Searches for files by glob pattern within the project.
Use this tool when you need to match file paths using glob syntax.

Glob patterns are relative to the project root.
Examples: "**/*.kt", "src/**/Foo*.java", "build.gradle.kts".
Patterns without '/' are treated as "**/pattern".
Paths are optional additional glob filters relative to the project root.

**Parameters:**
- `includeExcluded` (boolean): Whether to include excluded/ignored files in results
- `limit` (integer): Maximum number of results to return
- `paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `q` (string) *(Required)*: Glob pattern to search for

### `search_in_files_by_regex`
Searches with a regex pattern within all files in the project using IntelliJ's search engine.
Prefer this tool over reading files with command-line tools because it's much faster.

The result occurrences are surrounded with || characters, e.g. `some text ||substring|| text`

**Parameters:**
- `caseSensitive` (boolean): Whether to search for the text in a case-sensitive manner
- `directoryToSearch` (string): Directory to search in, relative to project root. If not specified, searches in the entire project.
- `fileMask` (string): File mask to search for. If not specified, searches for all files. Example: `*.java`
- `maxUsageCount` (integer): Maximum number of entries to return.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `regexPattern` (string) *(Required)*: Regex patter to search for
- `timeout` (integer): Timeout in milliseconds

### `search_in_files_by_text`
Searches for a text substring within all files in the project using IntelliJ's search engine.
Prefer this tool over reading files with command-line tools because it's much faster.

The result occurrences are surrounded with `||` characters, e.g. `some text ||substring|| text`

**Parameters:**
- `caseSensitive` (boolean): Whether to search for the text in a case-sensitive manner
- `directoryToSearch` (string): Directory to search in, relative to project root. If not specified, searches in the entire project.
- `fileMask` (string): File mask to search for. If not specified, searches for all files. Example: `*.java`
- `maxUsageCount` (integer): Maximum number of entries to return.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `searchText` (string) *(Required)*: Text substring to search for
- `timeout` (integer): Timeout in milliseconds

### `search_regex`
Searches for regex matches within project files.
Use this tool when you need regex search with snippet results.
Results include match coordinates when available (1-based line/column, 0-based offsets).

Paths are glob patterns relative to the project root.
Examples: ["src/**", "!**/test/**"], ["**/*.kt"], ["foo/"].

**Parameters:**
- `limit` (integer): Maximum number of results to return
- `paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `q` (string) *(Required)*: Regex pattern to search for

### `search_symbol`
Searches for symbols (classes, methods, fields).
Use this tool for semantic lookup by identifier fragments.
Results include match coordinates when available (1-based line/column, 0-based offsets).

Paths are glob patterns relative to the project root.
By default this searches project symbols only.
If you don't find a suitable result, try again with include_external=true to search SDK and library symbols too.

**Parameters:**
- `include_external` (boolean): Whether to include SDK and library symbols. Disabled by default; if nothing suitable is found, try again with include_external=true.
- `limit` (integer): Maximum number of results to return
- `paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `q` (string) *(Required)*: Symbol query text

### `search_text`
Searches for a text substring within project files.
Use this tool for fast text search with snippet results.
Results include match coordinates when available (1-based line/column, 0-based offsets).

Paths are glob patterns relative to the project root.
Examples: ["src/**", "!**/test/**"], ["**/*.kt"], ["foo/"].

**Parameters:**
- `limit` (integer): Maximum number of results to return
- `paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `q` (string) *(Required)*: Text to search for

## Refactoring & Inspection

### `generate_inspection_kts_api`
    Returns the Inspection KTS API documentation for the target language.
    Provides available classes and functions that can be used when writing inspection.kts files.

**Parameters:**
- `language` (string) *(Required)*: Target language: 'Java' or 'Kotlin'
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `wrapInTags` (boolean): If true, wraps the API content in <API> and <api.kt> tags

### `generate_inspection_kts_examples`
    Returns example inspection.kts templates for the target language to guide code generation.
    Provides XML-wrapped examples showing how to write inspections using the InspectionKts API.

**Parameters:**
- `includeAdditionalExamples` (boolean): If true, includes additional curated examples besides templates
- `language` (string): Target language for examples: 'Java', 'Kotlin', or 'Any' (default)
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `generate_psi_tree`
    Creates a PSI tree for provided Java or Kotlin code and returns it as indented text.
    Use this tool to understand the PSI structure of code snippets when writing inspections.
    The output shows element types and their hierarchy, with hints about when node.children() is needed.

**Parameters:**
- `code` (string) *(Required)*: Source code snippet to parse
- `language` (string) *(Required)*: Programming language: 'Java' or 'Kotlin'
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `get_file_problems`
Analyzes the specified file for errors and warnings using IntelliJ's inspections.
Use this tool to identify coding issues, syntax errors, and other problems in a specific file.
Returns a list of problems found in the file, including severity, description, and location information.
Note: Only analyzes files within the project directory.
Note: Lines and Columns are 1-based.

**Parameters:**
- `errorsOnly` (boolean): Whether to include only errors or include both errors and warnings
- `filePath` (string) *(Required)*: Path relative to the project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `timeout` (integer): Timeout in milliseconds

### `rename_refactoring`
        Renames a symbol (variable, function, class, etc.) in the specified file.
        Use this tool to perform rename refactoring operations. 
        
        The `rename_refactoring` tool is a powerful, context-aware utility. Unlike a simple text search-and-replace, 
        it understands the code's structure and will intelligently update ALL references to the specified symbol throughout the project,
        ensuring code integrity and preventing broken references. It is ALWAYS the preferred method for renaming programmatic symbols.

        Requires three parameters:
            - pathInProject: The relative path to the file from the project's root directory (e.g., `src/api/controllers/userController.js`)
            - symbolName: The exact, case-sensitive name of the existing symbol to be renamed (e.g., `getUserData`)
            - newName: The new, case-sensitive name for the symbol (e.g., `fetchUserData`).
            
        Returns a success message if the rename operation was successful.
        Returns an error message if the file or symbol cannot be found or the rename operation failed.

**Parameters:**
- `newName` (string) *(Required)*: New name for the symbol
- `pathInProject` (string) *(Required)*: Path relative to the project root
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `symbolName` (string) *(Required)*: Name of the symbol to rename

### `run_inspection_kts`
    Compiles an inspection.kts script and runs it against a target file.
    Returns compilation errors if any, or the list of problems found by the inspection.
    Use this tool to test inspection.kts scripts during development.

**Parameters:**
- `contextPath` (string) *(Required)*: Relative path of the target file inside project to analyze (e.g., 'src/my/package/Example.kt'
- `inspectionKtsCode` (string) *(Required)*: The inspection.kts script content to compile and run
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `targetFileContent` (string): The content of the target file to analyze. If not provided, the file must exist in the project.

## Project & Build

### `build_project`
Triggers building of the project or specified files, waits for completion, and returns build errors.
Use this tool to build the project or compile files and get detailed information about compilation errors and warnings.
You have to use this tool after performing edits to validate if the edits are valid.

**Parameters:**
- `filesToRebuild` (array): If specified, only compile files with the specified paths. Paths are relative to the project root.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `rebuild` (boolean): Whether to perform full rebuild the project. Defaults to false. Effective only when `filesToRebuild` is not specified.
- `timeout` (integer): Timeout in milliseconds

### `execute_run_configuration`
Run either an existing run configuration by name or a temporary run configuration created from a code location
(`filePath` + `line`) in the current project, then wait up to specified timeout for it to finish.
Use this tool with either a configuration name returned by `get_run_configurations`, or with a run point
(`filePath` + `line`) returned by `get_run_configurations(filePath = ...)`.

Optional launch overrides (`programArguments`, `workingDirectory`, `envs`) are applied only for this run and are not persisted.
Do not pass these override parameters unless you explicitly need to change the configured launch values for this run.
Missing/null override parameters keep existing run configuration values unchanged.
For string overrides (`programArguments`, `workingDirectory`), missing/null or empty string (`""`) keeps the existing value unchanged.
Pass a whitespace-only string such as `" "` to clear an existing value for this launch.

Pass either `configurationName`, or `filePath` together with `line`. These modes are mutually exclusive.

Behavior:
- When `waitForExit=true`, waits up to `timeout` milliseconds for process termination. If the timeout expires,
  the process keeps running in the background and `exitCode` is omitted from the result.
- When `waitForExit=false`, waits only for the process to start, then returns immediately without applying `timeout`.
- `fullOutputPath` points to a temp file with the full raw output and may continue growing while the process is alive.

Returns the execution result including current output snapshot, optional exit code, and optional `fullOutputPath`.

**Parameters:**
- `configurationName` (string): Name of the existing run configuration to execute
- `envs` (object): Optional environment variable overrides for this launch only. Missing/null keeps existing env unchanged; when provided, values are merged over existing env.
- `filePath` (string): File path relative to the project root. Provide together with `line` to create and execute a temporary run configuration from code context.
- `line` (integer): 1-based line number for `filePath`. Provide together with `filePath` and do not combine with `configurationName`.
- `programArguments` (string): Optional program arguments override for this launch only. Missing/null or empty string keeps the existing value; whitespace-only string clears it.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `timeout` (integer): Timeout in milliseconds
- `waitForExit` (boolean): Whether to wait for process termination. If false, the tool returns immediately after the process starts and ignores `timeout`.
- `workingDirectory` (string): Optional working directory override for this launch only. Missing/null or empty string keeps the existing value; whitespace-only string clears it.

**Example Usage:**
```json
{ "configurationName": "build", "projectPath": "c:/Users/glove/projects/ethang-monorepo" }
```

### `execute_terminal_command`
        Executes a specified shell command in the IDE's integrated terminal.
        Use this tool to run terminal commands within the IDE environment.
        Requires a command parameter containing the shell command to execute.
        Important features and limitations:
        - Checks if process is running before collecting output
        - Limits output to 2000 lines (truncates excess)
        - Times out after specified timeout with notification
        - Requires user confirmation unless "Brave Mode" is enabled in settings
        Returns possible responses:
        - Terminal output (truncated if > 2000 lines)
        - Output with interruption notice if timed out
        - Error messages for various failure cases

**Parameters:**
- `command` (string) *(Required)*: Shell command to execute
- `executeInShell` (boolean): Whether to execute the command in a default user's shell (bash, zsh, etc.). 
Useful if the command is not a commandline but a shell script, or if it's important to preserve real environment of the user's terminal. 
In the case of 'false' value the command will be started as a process
- `maxLinesCount` (integer): Maximum number of lines to return
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `reuseExistingTerminalWindow` (boolean): Whether to reuse an existing terminal window. Allows to avoid creating multiple terminals
- `timeout` (integer): Timeout in milliseconds
- `truncateMode` (string): How to truncate the text: from the start, in the middle, at the end, or don't truncate at all

**Example Usage:**
```json
{ "command": "npm run build" }
```

### `get_project_dependencies`
Get a list of all dependencies defined in the project.
Returns structured information about project library names.

**Parameters:**
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `get_project_modules`
Get a list of all modules in the project with their types.
Returns structured information about each module including name and type.

**Parameters:**
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `get_repositories`
Retrieves the list of VCS roots in the project.
This is useful to detect all repositories in a multi-repository project.

**Parameters:**
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `get_run_configurations`
Returns either project run configurations or executable code locations, depending on the input.

Without `filePath`, this tool lists the project's existing run configurations. The result includes configuration
names and, when available, launch details such as program arguments, working directory, environment variables,
and `supportsDynamicLaunchOverrides`.

`supportsDynamicLaunchOverrides` is the source-of-truth capability flag for one-time launch overrides
(`programArguments`, `workingDirectory`, `envs`) in `execute_run_configuration` and `xdebug_start_debugger_session`.
Only pass those override parameters when this flag is `true` for the selected configuration.

With `filePath`, this tool discovers executable entry points (run points) in that file, such as test methods,
main methods, or other executable entry points where the IDE shows a Run gutter icon. The result contains `filePath` and
`runPoints`; use the returned line numbers with `execute_run_configuration` to run from code.

**Parameters:**
- `filePath` (string): Optional file path relative to the project root. When provided, returns run points (executable entry points) in the file instead of project-wide run configurations.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

## Database

### `cancel_sql_query`
Cancels a running query using its unique ID. 

**Parameters:**
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `sessionId` (integer) *(Required)*: The unique ID of a query session.

### `execute_sql_query`
Executes a SQL query against the given database connection.
Do not use this tool for DDL data sources as they have no underlying DBMS connection.
Reports execution status (success/error) with error details when applicable.
Returns query results in CSV format, if any.

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.
Together with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `queryText` (string) *(Required)*: SQL query to be executed.
- `schemaName` (string) *(Required)*: Name of the schema.

### `get_database_object_description`
Retrieves the structure of a database object (columns, types, keys, indexes) within a particular schema as a hierarchical text representation.
In case of ambiguity returns definition of all applicable objects.

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.
Together with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection.
- `kind` (string) *(Required)*: Object kind (e.g., table, view, routine). May not be empty
- `objectName` (string) *(Required)*: Object name of the specified kind (e.g., table or view name). May not be empty.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `schemaName` (string) *(Required)*: Name of the schema.

### `list_database_connections`
Retrieves a list of configured database connections or data sources in the project.

**Parameters:**
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `list_database_schemas`
Retrieves a list of database schemas in the specified database connection.

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `selectedOnly` (boolean) *(Required)*: True to list only schemas with loaded metadata, false to list all schemas.

### `list_recent_sql_queries`
Retrieves a list of recent (including currently running) queries for the given database connection.
Do not use this tool for DDL data sources as they have no underlying DBMS connection.

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `list_schema_objects`
Retrieves a list of database objects within the given schema.

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.
Together with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection.
- `kind` (string): Object kind to filter by (e.g., table, view). If null, returns all objects in the schema.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `schemaName` (string) *(Required)*: Name of the schema.

### `list_schema_object_kinds`
Retrieves supported schema object kinds (e.g., table, view, routine) for the given database connection.

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

### `preview_table_data`
Previews data of the table, view, materialized view or other table-like object using given database connection.
Do not use this tool for DDL data sources as they have no underlying DBMS connection.
Returns table content in CSV format

**Parameters:**
- `connectionId` (string) *(Required)*: The unique ID of a database connection.
- `databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.
Together with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection.
- `maxRowCount` (integer): Maximum number of rows to return. Default is 100. You must NOT pass zero or negative value for this argument.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.
- `schemaName` (string) *(Required)*: Name of the schema.
- `tableName` (string) *(Required)*: Name of the table.

### `test_database_connection`
Checks whether a specific database connection is valid and reachable.
Do not use this tool for DDL data sources as they have no underlying DBMS connection.
Returns connection diagnostic info.

**Parameters:**
- `id` (string) *(Required)*: The unique ID of a database connection.
- `projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. 
 In the case you know only the current working directory you can use it as the project path.
 If you're not aware about the project path you can ask user about it.

