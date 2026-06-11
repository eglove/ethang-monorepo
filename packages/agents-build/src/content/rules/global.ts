import { defineRule, type RuleDefinition } from "../../define.ts";

const philosophy = defineRule({
  content: `# Working Philosophy

These rules apply to every task in this workspace:

1. **Follow every step** of any workflow you are executing, regardless of how simple the change appears. Even a one-line fix gets the full treatment. Do not skip or abbreviate steps.
2. **Tests are executable documentation** — someone reading only the test file must understand the feature.
3. **User checkpoints are mandatory.** When a workflow declares a checkpoint, present the decision to the user, ask, and wait for an explicit answer before continuing — even when operating autonomously.
4. **Stream full output** from test runs. Do not filter or truncate test output; the user wants to see real-time progress.
5. **Never commit, push, or comment on pull requests** unless the user explicitly asks.

## Parallelization

**Default: fan out.** Issue all independent tool calls together in a single step. Go sequential only when one call consumes the output of another.

Batch together: reading multiple files, running multiple searches with different terms, fetching multiple independent resources. Chain sequentially: fetch a resource, extract references from it, then fetch what it references.`,
  filename: "philosophy",
  trigger: "always_on"
});

const tddDiscipline = defineRule({
  content: `# Test-Driven Development (Red -> Green -> Refactor)

This is the highest-priority rule for ALL code changes. No exceptions.

1. **Red** — Write a failing test FIRST that proves the problem exists or specifies the new behavior. The test is a hypothesis. Do NOT touch production code yet.
2. **Green** — Write the minimum production code to make the test pass. The code is the conclusion.
3. **Refactor** — Improve the code while keeping tests green: simplify logic, reduce change surface, eliminate duplication, improve naming, remove dead code.

## Scientific method

Treat every test as an experiment:

- **Hypothesis** — the test describes expected behavior before code exists.
- **Experiment** — run the test; it MUST fail (red) to confirm the hypothesis is testable.
- **Conclusion** — production code makes it pass (green), proving the hypothesis.
- If a test passes before you write the code, it proves nothing — investigate why before continuing.

## State coverage

Line coverage is not the goal — **state coverage** is. Tests must cover all states a unit can receive:

- Valid inputs, invalid inputs, boundary values, empty/null/undefined states
- Error states, loading states, race conditions
- Use parameterized tests (Vitest \`it.each\`) to cover many input-output cases in a single block. Prefer them over copy-pasted test bodies.

## Test placement

- Unit tests live next to or near the code under test and run with Vitest.
- Never weaken an existing test to make a change pass. If a test blocks you, the test is telling you something — read it.`,
  filename: "tdd-discipline",
  trigger: "always_on"
});

const verification = defineRule({
  content: `# Verification Commands

How to build, test, and lint in this monorepo (pnpm workspaces; Bun runs build scripts).

## Whole repo (from the root)

| Goal | Command |
|---|---|
| Build everything | \`pnpm build\` (fans out to \`pnpm -r build\`) |
| Test everything | \`pnpm test\` (fans out to \`pnpm -r test\`) |
| Lint everything | \`pnpm lint\` (fans out to \`pnpm -r lint\`) |
| Full health sweep | \`./repo-check.ps1\` (cf-typegen, build, test, lint, dedupe, store prune) |

## Single package

| Goal | Command |
|---|---|
| Test one package | \`pnpm --filter <package-name> test\` (runs \`vitest run --coverage\`) |
| Watch mode | \`pnpm --filter <package-name> exec vitest\` |
| One test file | \`pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage\` |
| Build one package | \`pnpm --filter <package-name> build\` (runs \`bun build.ts\`) |
| Lint one package | \`pnpm --filter <package-name> lint\` (runs \`eslint . --fix && pnpm tsc --noEmit\`) |

## Cloudflare Workers apps

- Local dev server: \`pnpm --filter <app-name> dev\` (wrangler).
- Regenerate Worker types after wrangler.jsonc changes: \`pnpm -r cf-typegen\`.

## Rules of engagement

- Run the narrowest command that answers your question, but always finish a change by running the affected package's full \`test\` and \`lint\`.
- Coverage thresholds auto-ratchet (\`autoUpdate: true\`); never lower them by hand.
- Lint must produce no diff — CI runs \`eslint --fix\` and fails on \`git diff --exit-code\`.`,
  description: "running tests, builds, or lint in this monorepo",
  filename: "verification",
  trigger: "model_decision"
});

const fileOperations = defineRule({
  content: `# File Operations Priority Hierarchy

All file operations and terminal executions on Windows must prioritize tools according to the following hierarchy:

| Priority | Tool | When to Use |
| :--- | :--- | :--- |
| 1 | **Search & JSON CLI Tools** (\`es\`, \`jq\`, \`rg\`) | Priority for all file **READ** operations (e.g., path searching with \`es\`, JSON operations with \`jq\`, text searching with \`rg\`). |
| 2 | **JetBrains WebStorm MCP** (\`mcp__webstorm__*\`) | All file **UPDATE/DELETE** operations (for safe refactoring), and as a backup for file **READ** operations when the IDE is running. |
| 3 | **PowerShell** | File-adjacent shell operations that the prior tools cannot cover (path operations, directory listing, process management). Full access to .NET APIs for advanced scripting. |
| 4 | **Native Tools** (\`Grep\`, \`Glob\`, \`Read\`, \`Edit\`, \`Write\`) | Only when prior tools cannot cover the operation. |
| 5 | **Bash** | Last resort only — always prefer PowerShell on Windows. |

*Note: WebStorm is assumed to be running. Use it for all UPDATE/DELETE operations, and as a backup for READ operations if CLI tools are unavailable or insufficient.*

### Search & JSON CLI Tools Reference

To ensure efficient file READ operations, familiarize yourself with the basic usage patterns of these CLI tools. Detailed help documentation and examples are available in their respective rules:
- **Everything Search CLI**: [es-cli](es-cli.md)
- **JSON Processor**: [jq-cli](jq-cli.md)
- **ripgrep**: [rg-cli](rg-cli.md)`,
  filename: "file-operations",
  trigger: "always_on"
});

const antigravityRtkRules = defineRule({
  content: `# RTK - Rust Token Killer (Google Antigravity)

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Always prefix shell commands with \`rtk\` to minimize token consumption.

Examples:

\`\`\`bash
rtk git status
rtk cargo test
rtk ls src/
rtk grep "pattern" src/
rtk find "*.rs" .
rtk docker ps
rtk gh pr list
\`\`\`

## Meta Commands

\`\`\`bash
rtk gain              # Show token savings
rtk gain --history    # Command history with savings
rtk discover          # Find missed RTK opportunities
rtk proxy <cmd>       # Run raw (no filtering, for debugging)
\`\`\`

## Why

RTK filters and compresses command output before it reaches the LLM context, saving 60-90% tokens on common operations. Always use \`rtk <cmd>\` instead of raw commands.`,
  filename: "antigravity-rtk-rules",
  trigger: "always_on"
});

const reviewEdgeCases = defineRule({
  content: `# Review Edge Cases

## No PR description

When \`gh pr view\` returns an empty or missing body: note in the verdict that the PR lacks a description. Flag as a non-blocking documentation finding. Proceed with review using only the diff and branch name as context.

## Draft PR

When \`gh pr view\` shows \`isDraft: true\`: note in the review output. Reduce the blocking threshold — treat High findings as advisory rather than blocking unless the author requests a full blocking review. State explicitly: "This is a draft PR — findings are advisory."

## Very large PR (>2000 lines)

Warn the user before proceeding: "This PR changes more than 2000 lines. Review accuracy may be reduced. Consider splitting the PR." Split the diff per-file when passing to individual review perspectives — do not pass the full diff as a single blob to each perspective.

## CI already red

Capture CI status from \`gh pr checks {number}\`. Flag pre-existing failures separately from review findings with the label "Pre-existing CI failure." Do not let CI failures block posting review findings — but call them out prominently in the verdict block.

## Config-only PR

When the diff contains only config or build files (\`*.json\`, \`*.toml\`, \`*.jsonc\`, \`wrangler.jsonc\`, lockfiles, \`tsconfig.json\`): skip correctness and component review perspectives. Run Security and Architecture perspectives only.`,
  description: "reviewing a pull request or diff",
  filename: "review-edge-cases",
  trigger: "model_decision"
});

const esCli = defineRule({
  content: `# Everything Search CLI (\`es\`) Reference

Use this rule to locate files and folders instantly across the Windows filesystem using the \`es\` command-line interface.

## Basic Usage

\`\`\`powershell
es [options] <search-string>
\`\`\`

## Key Options

### Filter Options
- \`/ad\` : Folders only.
- \`/a-d\` : Files only.
- \`/a[RHSDAVNTPLCOIEUPM]\` : DIR style attributes search.
  - \`R\` = Read only, \`H\` = Hidden, \`S\` = System, \`D\` = Directory, \`A\` = Archive, \`T\` = Temporary.
  - Prefix a flag with \`-\` to exclude (e.g. \`/a-h\` to exclude hidden files).

### Sort Options
- \`-s\` : Sort by full path.
- \`-sort <name[-ascending|-descending]>\` : Set sort order.
  - Names: \`name\`, \`path\`, \`size\`, \`extension\`, \`date-created\`, \`date-modified\`, \`date-accessed\`, \`attributes\`.
- \`/on\`, \`/o-n\`, \`/os\`, \`/o-s\`, \`/oe\`, \`/o-e\`, \`/od\`, \`/o-d\` : DIR style sorts.
  - \`N\` = Name, \`S\` = Size, \`E\` = Extension, \`D\` = Date modified, \`-\` = descending.

### Display Options
- \`-name\` : Show name column.
- \`-path-column\` : Show path column.
- \`-full-path-and-name\`, \`-filename-column\` : Show full path and name.
- \`-extension\`, \`-ext\` : Show extension column.
- \`-size\` : Show size column.
- \`-date-created\`, \`-dc\`, \`-date-modified\`, \`-dm\`, \`-date-accessed\`, \`-da\` : Show specified date column.
- \`-csv\`, \`-json\`, \`-tsv\`, \`-txt\` : Change display format.
- \`-double-quote\` : Wrap paths and filenames with double quotes.

### Viewport Options
- \`-viewport-offset <offset>\` : Show results starting from offset.
- \`-viewport-count <num>\` : Limit the number of results shown.

### Export Options
- \`-export-csv <out.csv>\`, \`-export-json <out.json>\`, \`-export-tsv <out.tsv>\`, \`-export-txt <out.txt>\` : Export to a file using the specified layout.
- \`-no-header\` : Do not output a column header for CSV, EFU, and TSV files.

## Examples

1. Search for JSON files matching "package" in their name:
   \`\`\`powershell
   es -json package.json
   \`\`\`

2. Search for directories only with name "src" and sort by path:
   \`\`\`powershell
   es /ad -s src
   \`\`\`

3. Get JSON output and wrap paths with double quotes:
   \`\`\`powershell
   es -json -double-quote my-file
   \`\`\``,
  filename: "es-cli",
  trigger: "always_on"
});

const jqCli = defineRule({
  content: `# jq (JSON processor) Reference

Use this rule to parse, filter, format, and slice JSON data using the \`jq\` command-line interface.

## Basic Usage

\`\`\`powershell
jq [options] <jq filter> [file...]
# Or via pipeline
cat file.json | jq [options] <jq filter>
\`\`\`

## Key Options

- \`-n\`, \`--null-input\` : Use \`null\` as the single input value (useful for creating JSON from scratch).
- \`-R\`, \`--raw-input\` : Read each line as a string instead of JSON.
- \`-s\`, \`--slurp\` : Read all inputs into a single large array and apply the filter to it.
- \`-c\`, \`--compact-output\` : Compact output (single line per JSON object) instead of pretty-printed.
- \`-r\`, \`--raw-output\` : Output strings directly without escapes or enclosing quotes.
- \`-S\`, \`--sort-keys\` : Sort keys of each object on output.
- \`--arg name value\` : Set a global variable \`$name\` to the string \`value\`.
- \`--argjson name value\` : Set a global variable \`$name\` to the JSON parsed \`value\`.
- \`-e\`, \`--exit-status\` : Set exit status code based on whether the output is null/false.

## Common Filter Patterns

- \`.\` : The identity filter. Pretty-prints the input JSON unmodified.
- \`.key\` : Extract value at a specific key.
- \`.[]\` : Unbox an array or object values.
- \`map(<filter>)\` : Apply a filter to each element of an array.
- \`select(<boolean_expression>)\` : Keep only items matching the condition.
- \`{key1: .val1, key2: .val2}\` : Reconstruct a new JSON object.

## Examples

1. Pretty print a JSON file:
   \`\`\`powershell
   jq . package.json
   \`\`\`

2. Extract the \`dependencies\` object from \`package.json\`:
   \`\`\`powershell
   jq .dependencies package.json
   \`\`\`

3. List only the names of packages in monorepo pnpm-workspace:
   \`\`\`powershell
   jq -r ".packages[]" pnpm-workspace.yaml
   \`\`\``,
  filename: "jq-cli",
  trigger: "always_on"
});

const rgCli = defineRule({
  content: `# ripgrep (rg) Reference

Use this rule to recursively search the current directory for lines matching a regex pattern. By default, ripgrep respects gitignore rules, skipping hidden and binary files.

## Basic Usage

\`\`\`powershell
rg [options] PATTERN [PATH ...]
\`\`\`

## Key Options

### Input & Search Options
- \`-e PATTERN\`, \`--regexp=PATTERN\` : A pattern to search for (useful when pattern starts with a dash).
- \`-F\`, \`--fixed-strings\` : Treat the pattern as a literal string instead of a regular expression.
- \`-i\`, \`--ignore-case\` : Case-insensitive search.
- \`-s\`, \`--case-sensitive\` : Case-sensitive search (default).
- \`-S\`, \`--smart-case\` : Case-insensitive if the pattern is all lowercase; case-sensitive otherwise.
- \`-v\`, \`--invert-match\` : Invert match (show lines that do not match).
- \`-w\`, \`--word-regexp\` : Match only whole words.
- \`-x\`, \`--line-regexp\` : Match only whole lines.
- \`-m NUM\`, \`--max-count=NUM\` : Limit the number of matching lines per file.

### Filter Options
- \`-.\`, \`--hidden\` : Search hidden files and directories as well.
- \`-g GLOB\`, \`--glob=GLOB\` : Include or exclude file paths (e.g. \`-g '!**/node_modules/**'\` or \`-g '*.ts'\`).
- \`--binary\` : Search binary files.
- \`--no-ignore\` : Don't respect ignore files (.gitignore, .ignore, etc.).
- \`-t TYPE\`, \`--type=TYPE\` : Only search files matching file type (e.g. \`rg -t ts pattern\`).
- \`-T TYPE\`, \`--type-not=TYPE\` : Do not search files of this type.
- \`--type-list\` : Show all supported file types and their globs.

### Output Options
- \`-A NUM\`, \`--after-context=NUM\` : Show NUM lines of trailing context after each match.
- \`-B NUM\`, \`--before-context=NUM\` : Show NUM lines of leading context before each match.
- \`-C NUM\`, \`--context=NUM\` : Show NUM lines of context before and after matches.
- \`-n\`, \`--line-number\` : Show line numbers (default).
- \`-N\`, \`--no-line-number\` : Suppress line numbers.
- \`-o\`, \`--only-matching\` : Print only the matched part of the line.
- \`-r TEXT\`, \`--replace=TEXT\` : Replace matches in the output with the given text.
- \`-H\`, \`--with-filename\` : Print the file path with each matching line.
- \`-I\`, \`--no-filename\` : Suppress file paths.

### Output Modes
- \`-c\`, \`--count\` : Show count of matching lines for each file.
- \`--count-matches\` : Show count of every individual match for each file.
- \`-l\`, \`--files-with-matches\` : Print only the paths of files containing at least one match.
- \`--files-without-match\` : Print only paths of files containing zero matches.
- \`--files\` : Print each file that would be searched without actually searching.
- \`--json\` : Show search results in a JSON Lines format.

## Examples

1. Search for a literal string case-insensitively in all TypeScript files:
   \`\`\`powershell
   rg -i -t ts "userRepository"
   \`\`\`

2. List files containing the pattern without showing match contents:
   \`\`\`powershell
   rg -l "definePlugin"
   \`\`\`

3. Find matches including hidden files, but ignoring node_modules:
   \`\`\`powershell
   rg --hidden -g '!**/node_modules/**' "antigravity"
   \`\`\``,
  filename: "rg-cli",
  trigger: "always_on"
});

const webstormMcp = defineRule({
  content: `# JetBrains WebStorm MCP Server Reference

Use this rule to interact with the JetBrains WebStorm IDE via the Model Context Protocol (MCP) server. These tools allow search, file manipulation, refactoring, building, and running tests directly inside the IDE.

## Priority Hierarchy for File Operations
As defined in the workspace rules, all file operations must prioritize tools as follows:
1. **Search & JSON CLI Tools** (\`es\`, \`jq\`, \`rg\`) for READ operations.
2. **JetBrains WebStorm MCP** (\`mcp__webstorm__*\`) for all UPDATE/DELETE operations, and as a backup for READ operations.
3. **PowerShell** for directory listing, process management, etc.
4. **Native Tools** (\`Grep\`, \`Glob\`, \`Read\`, \`Edit\`, \`Write\`) as a backup.

---

## Tool Category: Analysis & Diagnostics

### \`build_project\`
Builds the project or specified files and returns compilation errors/warnings.
- **Parameters:**
  - \`rebuild\` (boolean): Rebuild the entire project. Defaults to false.
  - \`filesToRebuild\` (string[]): Paths of specific files to compile (relative to project root).
  - \`projectPath\` (string): Path to the project root. Always provide this if known.
- **Usage:** Call after edits to validate compilation.

### \`get_file_problems\`
Runs IntelliJ inspections on a file to identify coding issues, syntax errors, and warnings.
- **Parameters:**
  - \`filePath\` (string): Path relative to project root.
  - \`errorsOnly\` (boolean): Return only errors. Defaults to false.
  - \`projectPath\` (string): Path to the project root.

---

## Tool Category: File & Directory Operations

### \`create_new_file\`
Creates a new file in the project.
- **Parameters:**
  - \`filePath\` (string): Relative path for the new file.
  - \`content\` (string): Initial file contents.

### \`replace_text_in_file\`
Replaces substring or performs text replacements in a file.
- **Parameters:**
  - \`filePath\` (string): Path relative to project root.
  - \`oldText\` (string): Substring to find.
  - \`newText\` (string): Replacement text.

### \`find_files_by_glob\`
Recursively search file paths matching a glob pattern.
- **Parameters:**
  - \`globPattern\` (string): Glob pattern (e.g., \`src/**/*.ts\`).
  - \`projectPath\` (string): Project root path.

### \`find_files_by_name_keyword\`
Search files containing a keyword in their name.
- **Parameters:**
  - \`keyword\` (string): Name keyword to search for.

### \`get_all_open_file_paths\`
Lists all files currently open in the WebStorm editor.

### \`list_directory_tree\`
Returns a tree visualization of the directory structure.

### \`open_file_in_editor\`
Opens a file in the active editor tab.

### \`reformat_file\`
Runs the IDE formatter on the specified file.

---

## Tool Category: Search & Symbol Discovery

### \`search_in_files_by_text\`
Searches for a text substring using IntelliJ's search engine (faster than CLI tools).
- **Parameters:**
  - \`searchText\` (string): Substring to look for.
  - \`directoryToSearch\` (string): Optional search subdirectory.
  - \`fileMask\` (string): Optional file mask (e.g., \`*.ts\`).

### \`search_in_files_by_regex\`
Searches using a regular expression.
- **Parameters:**
  - \`regex\` (string): Regex pattern.

### \`get_symbol_info\`
Retrieves definition/signature/documentation details for a symbol (like "Quick Documentation").
- **Parameters:**
  - \`filePath\` (string): Relative file path.
  - \`line\` (integer): 1-based line number.
  - \`column\` (integer): 1-based column number.

---

## Tool Category: Refactoring & VCS

### \`rename_refactoring\`
Safe, automated rename refactoring for files or code symbols (renames definitions and all references).
- **Parameters:**
  - \`filePath\` (string): File containing the symbol.
  - \`line\` (integer): 1-based line number.
  - \`column\` (integer): 1-based column number.
  - \`newName\` (string): Target name.

### \`get_repositories\`
Lists configured VCS repositories in the workspace.

---

## Tool Category: Execution & Run Configurations

### \`get_run_configurations\`
Retrieves all configured IDE run configurations.

### \`execute_run_configuration\`
Executes a run configuration (e.g., test suite or build configuration).
- **Parameters:**
  - \`name\` (string): The configuration name.

### \`execute_terminal_command\`
Runs a terminal command within the IDE workspace.
- **Parameters:**
  - \`command\` (string): Shell command to execute.
- **Security Warning:** Make sure "brave mode" is enabled in WebStorm Settings (Tools -> MCP Server) to run commands without prompting for user confirmation.

---

## Tool Category: Database & SQL Tools

Supports database exploration and querying (requires the "Database Tools and SQL" and "AI Assistant" plugins).
- \`list_database_connections\`: Lists configured data sources.
- \`test_database_connection\`: Connection diagnostics.
- \`list_database_schemas\`: Lists schemas for a connection.
- \`list_schema_objects\`: Lists objects (tables, views, etc.) in a schema.
- \`get_database_object_description\`: Retrieves object schema structure.
- \`execute_sql_query\`: Executes queries (prefer read-only connections).
- \`preview_table_data\`: Previews table data in CSV format.`,
  filename: "webstorm-mcp",
  trigger: "always_on"
});

export const GLOBAL_RULES: RuleDefinition[] = [
  philosophy,
  tddDiscipline,
  verification,
  fileOperations,
  antigravityRtkRules,
  reviewEdgeCases,
  esCli,
  jqCli,
  rgCli,
  webstormMcp
];
