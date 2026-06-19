/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const webstormMcp = defineSkill({
  content: [
    {
      level: 1,
      text: "WebStorm MCP Skill Guide",
      type: "header"
    },
    {
      text: "This skill provides an overview of the tools available via the WebStorm MCP server. It is organized by category to help you easily find the right tool for your task.",
      type: "text"
    },
    {
      level: 2,
      text: "Table of Contents",
      type: "header"
    },
    {
      items: [
        {
          text: "[File Operations](#file-operations)\n- [`create_new_file`](#create_new_file)\n- [`get_all_open_file_paths`](#get_all_open_file_paths)\n- [`get_file_text_by_path`](#get_file_text_by_path)\n- [`list_directory_tree`](#list_directory_tree)\n- [`open_file_in_editor`](#open_file_in_editor)\n- [`read_file`](#read_file)\n- [`reformat_file`](#reformat_file)\n- [`replace_text_in_file`](#replace_text_in_file)"
        },
        {
          text: "[Search & Navigation](#search-navigation)\n- [`find_files_by_glob`](#find_files_by_glob)\n- [`find_files_by_name_keyword`](#find_files_by_name_keyword)\n- [`get_symbol_info`](#get_symbol_info)\n- [`search_file`](#search_file)\n- [`search_in_files_by_regex`](#search_in_files_by_regex)\n- [`search_in_files_by_text`](#search_in_files_by_text)\n- [`search_regex`](#search_regex)\n- [`search_symbol`](#search_symbol)\n- [`search_text`](#search_text)"
        },
        {
          text: "[Refactoring & Inspection](#refactoring-inspection)\n- [`generate_inspection_kts_api`](#generate_inspection_kts_api)\n- [`generate_inspection_kts_examples`](#generate_inspection_kts_examples)\n- [`generate_psi_tree`](#generate_psi_tree)\n- [`get_file_problems`](#get_file_problems)\n- [`rename_refactoring`](#rename_refactoring)\n- [`run_inspection_kts`](#run_inspection_kts)"
        },
        {
          text: "[Project & Build](#project-build)\n- [`build_project`](#build_project)\n- [`execute_run_configuration`](#execute_run_configuration)\n- [`execute_terminal_command`](#execute_terminal_command)\n- [`get_project_dependencies`](#get_project_dependencies)\n- [`get_project_modules`](#get_project_modules)\n- [`get_repositories`](#get_repositories)\n- [`get_run_configurations`](#get_run_configurations)"
        },
        {
          text: "[Database](#database)\n- [`cancel_sql_query`](#cancel_sql_query)\n- [`execute_sql_query`](#execute_sql_query)\n- [`get_database_object_description`](#get_database_object_description)\n- [`list_database_connections`](#list_database_connections)\n- [`list_database_schemas`](#list_database_schemas)\n- [`list_recent_sql_queries`](#list_recent_sql_queries)\n- [`list_schema_objects`](#list_schema_objects)\n- [`list_schema_object_kinds`](#list_schema_object_kinds)\n- [`preview_table_data`](#preview_table_data)\n- [`test_database_connection`](#test_database_connection)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "File Operations",
      type: "header"
    },
    {
      level: 3,
      text: "`create_new_file`",
      type: "header"
    },
    {
      text: "Creates a new file at the specified path within the project directory and optionally populates it with text if provided.\nUse this tool to generate new files in your project structure.\nNote: Creates any necessary parent directories automatically",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`overwrite` (boolean): Whether to overwrite an existing file if exists. If false, an exception is thrown in case of a conflict."
        },
        {
          text: "`pathInProject` (string) *(Required)*: Path where the file should be created relative to the project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`text` (string): Content to write into the new file"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_all_open_file_paths`",
      type: "header"
    },
    {
      text: "Returns active editor's and other open editors' file paths relative to the project root.",
      type: "text"
    },
    {
      text: "Use this tool to explore current open editors.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_file_text_by_path`",
      type: "header"
    },
    {
      code: "    Retrieves the text content of a file using its path relative to project root.\n    Use this tool to read file contents when you have the file's project-relative path.\n    In the case of binary files, the tool returns an error.\n    If the file is too large, the text will be truncated with '<<<...content truncated...>>>' marker and in according to the `truncateMode` parameter.",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`maxLinesCount` (integer): Max number of lines to return. Truncation will be performed depending on truncateMode."
        },
        {
          text: "`pathInProject` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`truncateMode` (string): How to truncate the text: from the start, in the middle, at the end, or don't truncate at all"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`list_directory_tree`",
      type: "header"
    },
    {
      text: "Provides a tree representation of the specified directory in the pseudo graphic format like `tree` utility does.\nUse this tool to explore the contents of a directory or the whole project.\nYou MUST prefer this tool over listing directories via command line utilities like `ls` or `dir`.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`directoryPath` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`maxDepth` (integer): Maximum recursion depth"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`open_file_in_editor`",
      type: "header"
    },
    {
      text: "Opens the specified file in the JetBrains IDE editor.\nRequires a filePath parameter containing the path to the file to open.\nThe file path can be absolute or relative to the project root.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`filePath` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`read_file`",
      type: "header"
    },
    {
      code: "    Reads a file in the project directory or from any project dependency or other project source root.\n    Can read sources inside Jar/Jrt files and decompile Java class files inside Jar/Jrt files or on disk. \n    Returns numbered lines (1-indexed) as text.\n    Modes: slice, lines, line_columns, offsets, indentation.\n    Slice uses start_line and max_lines. Lines uses start_line/end_line (inclusive).\n    Line_columns uses start_line/start_column and end_line/end_column (end is exclusive; end_line defaults to start_line).\n    Offsets uses start_offset/end_offset (end is exclusive). Indentation uses start_line with max_levels/include_*.\n    max_lines caps the total output in all modes; context_lines applies to range modes (per side).",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`context_lines` (integer): Number of context lines to include around the range (per side)"
        },
        {
          text: "`end_column` (integer): 1-based end column for range read (exclusive)"
        },
        {
          text: "`end_line` (integer): 1-based end line for lines/line_columns mode (inclusive for lines; exclusive for line_columns)"
        },
        {
          text: "`end_offset` (integer): 0-based end offset for offsets mode (exclusive)"
        },
        {
          text: "`file_path` (string) *(Required)*: Path to the file. Supports project-relative paths, paths with '..', absolute paths, archive entries like '/path/lib.jar!/pkg/Foo.class', and URLs such as 'file://', 'jar://', and 'jrt://'. Any path returned from the other tools can be passed as is (e.g. paths from 'search_*' tools)."
        },
        {
          text: "`include_header` (boolean): Indentation mode: include header comments/annotations directly above anchor"
        },
        {
          text: "`include_siblings` (boolean): Indentation mode: include sibling blocks at the same indentation level"
        },
        {
          text: "`max_levels` (integer): Indentation mode: maximum indentation levels to include (0 = only anchor block)"
        },
        {
          text: "`max_lines` (integer): Maximum number of lines to return (slice uses as line count; all modes cap output)"
        },
        {
          text: "`mode` (string): Read mode: 'slice', 'lines', 'line_columns', 'offsets', or 'indentation'"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`start_column` (integer): 1-based start column for line_columns mode"
        },
        {
          text: "`start_line` (integer): 1-based line number to start reading from"
        },
        {
          text: "`start_offset` (integer): 0-based start offset for offsets mode (requires end_offset)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`reformat_file`",
      type: "header"
    },
    {
      text: "Reformats a specified file in the JetBrains IDE.\nUse this tool to apply code formatting rules to a file identified by its path.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`path` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`replace_text_in_file`",
      type: "header"
    },
    {
      code: '    Replaces text in a file with flexible options for find and replace operations.\n    Use this tool to make targeted changes without replacing the entire file content.\n    This is the most efficient tool for file modifications when you know the exact text to replace.\n    \n    Requires three parameters:\n    - pathInProject: The path to the target file, relative to project root\n    - oldTextOrPatte: The text to be replaced (exact match by default)\n    - newText: The replacement text\n    \n    Optional parameters:\n    - replaceAll: Whether to replace all occurrences (default: true)\n    - caseSensitive: Whether the search is case-sensitive (default: true)\n    - regex: Whether to treat oldText as a regular expression (default: false)\n    \n    Returns one of these responses:\n    - "ok" when replacement happened\n    - error "project dir not found" if project directory cannot be determined\n    - error "file not found" if the file doesn\'t exist\n    - error "could not get document" if the file content cannot be accessed\n    - error "no occurrences found" if the old text was not found in the file\n    \n    Note: Automatically saves the file after modification',
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`caseSensitive` (boolean): Case-sensitive search"
        },
        {
          text: "`newText` (string) *(Required)*: Replacement text"
        },
        {
          text: "`oldText` (string) *(Required)*: Text to be replaced"
        },
        {
          text: "`pathInProject` (string) *(Required)*: Path to target file relative to project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`replaceAll` (boolean): Replace all occurrences"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "**Example Usage:**",
      type: "text"
    },
    {
      code: '{ "pathInProject": "src/main.ts", "oldText": "const x = 1;", "newText": "const x = 2;", "replaceAll": true }',
      language: "json",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Search & Navigation",
      type: "header"
    },
    {
      level: 3,
      text: "`find_files_by_glob`",
      type: "header"
    },
    {
      text: "Searches for all files in the project whose relative paths match the specified glob pattern.\nThe search is performed recursively in all subdirectories of the project directory or a specified subdirectory.\nUse this tool when you need to find files by a glob pattern (e.g. '**/*.txt').",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`addExcluded` (boolean): Whether to add excluded/ignored files to the search results. Files can be excluded from a project either by user of by some ignore rules"
        },
        {
          text: "`fileCountLimit` (integer): Maximum number of files to return."
        },
        {
          text: "`globPattern` (string) *(Required)*: Glob pattern to search for. The pattern must be relative to the project root. Example: `src/**/ *.java`"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`subDirectoryRelativePath` (string): Optional subdirectory relative to the project to search in."
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "**Example Usage:**",
      type: "text"
    },
    {
      code: '{ "pattern": "**/*.ts", "projectPath": "c:/Users/glove/projects/ethang-monorepo" }',
      language: "json",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "`find_files_by_name_keyword`",
      type: "header"
    },
    {
      text: "Searches for all files in the project whose names contain the specified keyword (case-insensitive).\nUse this tool to locate files when you know part of the filename.\nNote: Matched only names, not paths, because works via indexes.\nNote: Only searches through files within the project directory, excluding libraries and external dependencies.\nNote: Prefer this tool over other `find` tools because it's much faster, \nbut remember that this tool searches only names, not paths and it doesn't support glob patterns.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`fileCountLimit` (integer): Maximum number of files to return."
        },
        {
          text: "`nameKeyword` (string) *(Required)*: Substring to search for in file names"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_symbol_info`",
      type: "header"
    },
    {
      text: "Retrieves information about the symbol at the specified position in the specified file.\nProvides the same information as Quick Documentation feature of IntelliJ IDEA does.",
      type: "text"
    },
    {
      text: "This tool is useful for getting information about the symbol at the specified position in the specified file.\nThe information may include the symbol's name, signature, type, documentation, etc. It depends on a particular language.",
      type: "text"
    },
    {
      text: "If the position has a reference to a symbol the tool will return a piece of code with the declaration of the symbol if possible.",
      type: "text"
    },
    {
      text: "Use this tool to understand symbols declaration, semantics, where it's declared, etc.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`column` (integer) *(Required)*: 1-based column number"
        },
        {
          text: "`filePath` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`line` (integer) *(Required)*: 1-based line number"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`search_file`",
      type: "header"
    },
    {
      text: "Searches for files by glob pattern within the project.\nUse this tool when you need to match file paths using glob syntax.",
      type: "text"
    },
    {
      text: 'Glob patterns are relative to the project root.\nExamples: "**/*.kt", "src/**/Foo*.java", "build.gradle.kts".\nPatterns without \'/\' are treated as "**/pattern".\nPaths are optional additional glob filters relative to the project root.',
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`includeExcluded` (boolean): Whether to include excluded/ignored files in results"
        },
        {
          text: "`limit` (integer): Maximum number of results to return"
        },
        {
          text: "`paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`q` (string) *(Required)*: Glob pattern to search for"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`search_in_files_by_regex`",
      type: "header"
    },
    {
      text: "Searches with a regex pattern within all files in the project using IntelliJ's search engine.\nPrefer this tool over reading files with command-line tools because it's much faster.",
      type: "text"
    },
    {
      text: "The result occurrences are surrounded with || characters, e.g. `some text ||substring|| text`",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`caseSensitive` (boolean): Whether to search for the text in a case-sensitive manner"
        },
        {
          text: "`directoryToSearch` (string): Directory to search in, relative to project root. If not specified, searches in the entire project."
        },
        {
          text: "`fileMask` (string): File mask to search for. If not specified, searches for all files. Example: `*.java`"
        },
        {
          text: "`maxUsageCount` (integer): Maximum number of entries to return."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`regexPattern` (string) *(Required)*: Regex patter to search for"
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`search_in_files_by_text`",
      type: "header"
    },
    {
      text: "Searches for a text substring within all files in the project using IntelliJ's search engine.\nPrefer this tool over reading files with command-line tools because it's much faster.",
      type: "text"
    },
    {
      text: "The result occurrences are surrounded with `||` characters, e.g. `some text ||substring|| text`",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`caseSensitive` (boolean): Whether to search for the text in a case-sensitive manner"
        },
        {
          text: "`directoryToSearch` (string): Directory to search in, relative to project root. If not specified, searches in the entire project."
        },
        {
          text: "`fileMask` (string): File mask to search for. If not specified, searches for all files. Example: `*.java`"
        },
        {
          text: "`maxUsageCount` (integer): Maximum number of entries to return."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`searchText` (string) *(Required)*: Text substring to search for"
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`search_regex`",
      type: "header"
    },
    {
      text: "Searches for regex matches within project files.\nUse this tool when you need regex search with snippet results.\nResults include match coordinates when available (1-based line/column, 0-based offsets).",
      type: "text"
    },
    {
      text: 'Paths are glob patterns relative to the project root.\nExamples: ["src/**", "!**/test/**"], ["**/*.kt"], ["foo/"].',
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`limit` (integer): Maximum number of results to return"
        },
        {
          text: "`paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`q` (string) *(Required)*: Regex pattern to search for"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`search_symbol`",
      type: "header"
    },
    {
      text: "Searches for symbols (classes, methods, fields).\nUse this tool for semantic lookup by identifier fragments.\nResults include match coordinates when available (1-based line/column, 0-based offsets).",
      type: "text"
    },
    {
      text: "Paths are glob patterns relative to the project root.\nBy default this searches project symbols only.\nIf you don't find a suitable result, try again with include_external=true to search SDK and library symbols too.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`include_external` (boolean): Whether to include SDK and library symbols. Disabled by default; if nothing suitable is found, try again with include_external=true."
        },
        {
          text: "`limit` (integer): Maximum number of results to return"
        },
        {
          text: "`paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`q` (string) *(Required)*: Symbol query text"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`search_text`",
      type: "header"
    },
    {
      text: "Searches for a text substring within project files.\nUse this tool for fast text search with snippet results.\nResults include match coordinates when available (1-based line/column, 0-based offsets).",
      type: "text"
    },
    {
      text: 'Paths are glob patterns relative to the project root.\nExamples: ["src/**", "!**/test/**"], ["**/*.kt"], ["foo/"].',
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`limit` (integer): Maximum number of results to return"
        },
        {
          text: "`paths` (array): Optional list of project-relative glob patterns to filter results. Supports '!' excludes. Trailing '/' expands to '**'. Patterns without '/' are treated as '**/pattern'. Empty strings are ignored."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`q` (string) *(Required)*: Text to search for"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Refactoring & Inspection",
      type: "header"
    },
    {
      level: 3,
      text: "`generate_inspection_kts_api`",
      type: "header"
    },
    {
      code: "Returns the Inspection KTS API documentation for the target language.\nProvides available classes and functions that can be used when writing inspection.kts files.",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`language` (string) *(Required)*: Target language: 'Java' or 'Kotlin'"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`wrapInTags` (boolean): If true, wraps the API content in <API> and <api.kt> tags"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`generate_inspection_kts_examples`",
      type: "header"
    },
    {
      code: "Returns example inspection.kts templates for the target language to guide code generation.\nProvides XML-wrapped examples showing how to write inspections using the InspectionKts API.",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`includeAdditionalExamples` (boolean): If true, includes additional curated examples besides templates"
        },
        {
          text: "`language` (string): Target language for examples: 'Java', 'Kotlin', or 'Any' (default)"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`generate_psi_tree`",
      type: "header"
    },
    {
      code: "Creates a PSI tree for provided Java or Kotlin code and returns it as indented text.\nUse this tool to understand the PSI structure of code snippets when writing inspections.\nThe output shows element types and their hierarchy, with hints about when node.children() is needed.",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`code` (string) *(Required)*: Source code snippet to parse"
        },
        {
          text: "`language` (string) *(Required)*: Programming language: 'Java' or 'Kotlin'"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_file_problems`",
      type: "header"
    },
    {
      text: "Analyzes the specified file for errors and warnings using IntelliJ's inspections.\nUse this tool to identify coding issues, syntax errors, and other problems in a specific file.\nReturns a list of problems found in the file, including severity, description, and location information.\nNote: Only analyzes files within the project directory.\nNote: Lines and Columns are 1-based.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`errorsOnly` (boolean): Whether to include only errors or include both errors and warnings"
        },
        {
          text: "`filePath` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`rename_refactoring`",
      type: "header"
    },
    {
      code: "    Renames a symbol (variable, function, class, etc.) in the specified file.\n    Use this tool to perform rename refactoring operations. \n    \n    The `rename_refactoring` tool is a powerful, context-aware utility. Unlike a simple text search-and-replace, \n    it understands the code's structure and will intelligently update ALL references to the specified symbol throughout the project,\n    ensuring code integrity and preventing broken references. It is ALWAYS the preferred method for renaming programmatic symbols.\n\n    Requires three parameters:\n        - pathInProject: The relative path to the file from the project's root directory (e.g., `src/api/controllers/userController.js`)\n        - symbolName: The exact, case-sensitive name of the existing symbol to be renamed (e.g., `getUserData`)\n        - newName: The new, case-sensitive name for the symbol (e.g., `fetchUserData`).\n        \n    Returns a success message if the rename operation was successful.\n    Returns an error message if the file or symbol cannot be found or the rename operation failed.",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`newName` (string) *(Required)*: New name for the symbol"
        },
        {
          text: "`pathInProject` (string) *(Required)*: Path relative to the project root"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`symbolName` (string) *(Required)*: Name of the symbol to rename"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`run_inspection_kts`",
      type: "header"
    },
    {
      code: "Compiles an inspection.kts script and runs it against a target file.\nReturns compilation errors if any, or the list of problems found by the inspection.\nUse this tool to test inspection.kts scripts during development.",
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`contextPath` (string) *(Required)*: Relative path of the target file inside project to analyze (e.g., 'src/my/package/Example.kt'"
        },
        {
          text: "`inspectionKtsCode` (string) *(Required)*: The inspection.kts script content to compile and run"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`targetFileContent` (string): The content of the target file to analyze. If not provided, the file must exist in the project."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Project & Build",
      type: "header"
    },
    {
      level: 3,
      text: "`build_project`",
      type: "header"
    },
    {
      text: "Triggers building of the project or specified files, waits for completion, and returns build errors.\nUse this tool to build the project or compile files and get detailed information about compilation errors and warnings.\nYou have to use this tool after performing edits to validate if the edits are valid.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`filesToRebuild` (array): If specified, only compile files with the specified paths. Paths are relative to the project root."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`rebuild` (boolean): Whether to perform full rebuild the project. Defaults to false. Effective only when `filesToRebuild` is not specified."
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`execute_run_configuration`",
      type: "header"
    },
    {
      text: "Run either an existing run configuration by name or a temporary run configuration created from a code location\n(`filePath` + `line`) in the current project, then wait up to specified timeout for it to finish.\nUse this tool with either a configuration name returned by `get_run_configurations`, or with a run point\n(`filePath` + `line`) returned by `get_run_configurations(filePath = ...)`.",
      type: "text"
    },
    {
      text: 'Optional launch overrides (`programArguments`, `workingDirectory`, `envs`) are applied only for this run and are not persisted.\nDo not pass these override parameters unless you explicitly need to change the configured launch values for this run.\nMissing/null override parameters keep existing run configuration values unchanged.\nFor string overrides (`programArguments`, `workingDirectory`), missing/null or empty string (`""`) keeps the existing value unchanged.\nPass a whitespace-only string such as `" "` to clear an existing value for this launch.',
      type: "text"
    },
    {
      text: "Pass either `configurationName`, or `filePath` together with `line`. These modes are mutually exclusive.",
      type: "text"
    },
    {
      text: "Behavior:",
      type: "text"
    },
    {
      items: [
        {
          text: "When `waitForExit=true`, waits up to `timeout` milliseconds for process termination. If the timeout expires,\nthe process keeps running in the background and `exitCode` is omitted from the result."
        },
        {
          text: "When `waitForExit=false`, waits only for the process to start, then returns immediately without applying `timeout`."
        },
        {
          text: "`fullOutputPath` points to a temp file with the full raw output and may continue growing while the process is alive."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Returns the execution result including current output snapshot, optional exit code, and optional `fullOutputPath`.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`configurationName` (string): Name of the existing run configuration to execute"
        },
        {
          text: "`envs` (object): Optional environment variable overrides for this launch only. Missing/null keeps existing env unchanged; when provided, values are merged over existing env."
        },
        {
          text: "`filePath` (string): File path relative to the project root. Provide together with `line` to create and execute a temporary run configuration from code context."
        },
        {
          text: "`line` (integer): 1-based line number for `filePath`. Provide together with `filePath` and do not combine with `configurationName`."
        },
        {
          text: "`programArguments` (string): Optional program arguments override for this launch only. Missing/null or empty string keeps the existing value; whitespace-only string clears it."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        },
        {
          text: "`waitForExit` (boolean): Whether to wait for process termination. If false, the tool returns immediately after the process starts and ignores `timeout`."
        },
        {
          text: "`workingDirectory` (string): Optional working directory override for this launch only. Missing/null or empty string keeps the existing value; whitespace-only string clears it."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "**Example Usage:**",
      type: "text"
    },
    {
      code: '{ "configurationName": "build", "projectPath": "c:/Users/glove/projects/ethang-monorepo" }',
      language: "json",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "`execute_terminal_command`",
      type: "header"
    },
    {
      code: '    Executes a specified shell command in the IDE\'s integrated terminal.\n    Use this tool to run terminal commands within the IDE environment.\n    Requires a command parameter containing the shell command to execute.\n    Important features and limitations:\n    - Checks if process is running before collecting output\n    - Limits output to 2000 lines (truncates excess)\n    - Times out after specified timeout with notification\n    - Requires user confirmation unless "Brave Mode" is enabled in settings\n    Returns possible responses:\n    - Terminal output (truncated if > 2000 lines)\n    - Output with interruption notice if timed out\n    - Error messages for various failure cases',
      type: "codeBlock"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`command` (string) *(Required)*: Shell command to execute"
        },
        {
          text: "`executeInShell` (boolean): Whether to execute the command in a default user's shell (bash, zsh, etc.). \nUseful if the command is not a commandline but a shell script, or if it's important to preserve real environment of the user's terminal. \nIn the case of 'false' value the command will be started as a process"
        },
        {
          text: "`maxLinesCount` (integer): Maximum number of lines to return"
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`reuseExistingTerminalWindow` (boolean): Whether to reuse an existing terminal window. Allows to avoid creating multiple terminals"
        },
        {
          text: "`timeout` (integer): Timeout in milliseconds"
        },
        {
          text: "`truncateMode` (string): How to truncate the text: from the start, in the middle, at the end, or don't truncate at all"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "**Example Usage:**",
      type: "text"
    },
    {
      code: '{ "command": "npm run build" }',
      language: "json",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "`get_project_dependencies`",
      type: "header"
    },
    {
      text: "Get a list of all dependencies defined in the project.\nReturns structured information about project library names.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_project_modules`",
      type: "header"
    },
    {
      text: "Get a list of all modules in the project with their types.\nReturns structured information about each module including name and type.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_repositories`",
      type: "header"
    },
    {
      text: "Retrieves the list of VCS roots in the project.\nThis is useful to detect all repositories in a multi-repository project.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_run_configurations`",
      type: "header"
    },
    {
      text: "Returns either project run configurations or executable code locations, depending on the input.",
      type: "text"
    },
    {
      text: "Without `filePath`, this tool lists the project's existing run configurations. The result includes configuration\nnames and, when available, launch details such as program arguments, working directory, environment variables,\nand `supportsDynamicLaunchOverrides`.",
      type: "text"
    },
    {
      text: "`supportsDynamicLaunchOverrides` is the source-of-truth capability flag for one-time launch overrides\n(`programArguments`, `workingDirectory`, `envs`) in `execute_run_configuration` and `xdebug_start_debugger_session`.\nOnly pass those override parameters when this flag is `true` for the selected configuration.",
      type: "text"
    },
    {
      text: "With `filePath`, this tool discovers executable entry points (run points) in that file, such as test methods,\nmain methods, or other executable entry points where the IDE shows a Run gutter icon. The result contains `filePath` and\n`runPoints`; use the returned line numbers with `execute_run_configuration` to run from code.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`filePath` (string): Optional file path relative to the project root. When provided, returns run points (executable entry points) in the file instead of project-wide run configurations."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Database",
      type: "header"
    },
    {
      level: 3,
      text: "`cancel_sql_query`",
      type: "header"
    },
    {
      text: "Cancels a running query using its unique ID. ",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`sessionId` (integer) *(Required)*: The unique ID of a query session."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`execute_sql_query`",
      type: "header"
    },
    {
      text: "Executes a SQL query against the given database connection.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.\nReports execution status (success/error) with error details when applicable.\nReturns query results in CSV format, if any.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`queryText` (string) *(Required)*: SQL query to be executed."
        },
        {
          text: "`schemaName` (string) *(Required)*: Name of the schema."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`get_database_object_description`",
      type: "header"
    },
    {
      text: "Retrieves the structure of a database object (columns, types, keys, indexes) within a particular schema as a hierarchical text representation.\nIn case of ambiguity returns definition of all applicable objects.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
        },
        {
          text: "`kind` (string) *(Required)*: Object kind (e.g., table, view, routine). May not be empty"
        },
        {
          text: "`objectName` (string) *(Required)*: Object name of the specified kind (e.g., table or view name). May not be empty."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`schemaName` (string) *(Required)*: Name of the schema."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`list_database_connections`",
      type: "header"
    },
    {
      text: "Retrieves a list of configured database connections or data sources in the project.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`list_database_schemas`",
      type: "header"
    },
    {
      text: "Retrieves a list of database schemas in the specified database connection.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`selectedOnly` (boolean) *(Required)*: True to list only schemas with loaded metadata, false to list all schemas."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`list_recent_sql_queries`",
      type: "header"
    },
    {
      text: "Retrieves a list of recent (including currently running) queries for the given database connection.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`list_schema_objects`",
      type: "header"
    },
    {
      text: "Retrieves a list of database objects within the given schema.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
        },
        {
          text: "`kind` (string): Object kind to filter by (e.g., table, view). If null, returns all objects in the schema."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`schemaName` (string) *(Required)*: Name of the schema."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`list_schema_object_kinds`",
      type: "header"
    },
    {
      text: "Retrieves supported schema object kinds (e.g., table, view, routine) for the given database connection.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`preview_table_data`",
      type: "header"
    },
    {
      text: "Previews data of the table, view, materialized view or other table-like object using given database connection.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.\nReturns table content in CSV format",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
        },
        {
          text: "`maxRowCount` (integer): Maximum number of rows to return. Default is 100. You must NOT pass zero or negative value for this argument."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        },
        {
          text: "`schemaName` (string) *(Required)*: Name of the schema."
        },
        {
          text: "`tableName` (string) *(Required)*: Name of the table."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "`test_database_connection`",
      type: "header"
    },
    {
      text: "Checks whether a specific database connection is valid and reachable.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.\nReturns connection diagnostic info.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "`id` (string) *(Required)*: The unique ID of a database connection."
        },
        {
          text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use the WebStorm MCP, including available tools, parameters, and examples for complex tools.",
  name: "webstorm-mcp"
});
