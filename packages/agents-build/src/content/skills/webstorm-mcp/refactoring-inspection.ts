/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const webstormMcpRefactoringInspection: MarkdownBlock[] = [
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
  }
];
