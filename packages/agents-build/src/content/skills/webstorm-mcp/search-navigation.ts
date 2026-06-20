/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const webstormMcpSearchNavigation: MarkdownBlock[] = [
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
  }
];
