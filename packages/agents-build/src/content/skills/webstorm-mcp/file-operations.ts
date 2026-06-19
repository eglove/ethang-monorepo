/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const webstormMcpFileOperations: MarkdownBlock[] = [
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
  }
];
