/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const webstormMcpProjectBuild: MarkdownBlock[] = [
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
  }
];
