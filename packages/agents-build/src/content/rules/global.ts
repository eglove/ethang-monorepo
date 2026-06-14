import { defineRule, type RuleDefinition } from "../../define.ts";
import { codeVerification } from "./code-verification.ts";
import { dddStrategic } from "./ddd-strategic.ts";
import { dddTactical } from "./ddd-tactical.ts";
import { executionPlanning } from "./execution-planning.ts";
import { gitWorkflow } from "./git-workflow.ts";
import { rcaFiveWhys } from "./rca-five-whys.ts";
import { requirementsEngineering } from "./requirements-engineering.ts";
import { reviewDesignChecklist } from "./review-design-checklist.ts";
import { reviewPipeline } from "./review-pipeline.ts";
import { reviewSecurityChecklist } from "./review-security-checklist.ts";
import { roleImplementer } from "./role-implementer.ts";
import { rolePlanner } from "./role-planner.ts";
import { roleQualityAnalyst } from "./role-quality-analyst.ts";
import { roleRca } from "./role-rca.ts";
import { roleReporter } from "./role-reporter.ts";
import { roleRequirementsAnalyst } from "./role-requirements-analyst.ts";
import { roleRequirementsWriter } from "./role-requirements-writer.ts";
import { roleReviewer } from "./role-reviewer.ts";
import { roleSecurityAnalyst } from "./role-security-analyst.ts";
import { roleTestWriter } from "./role-test-writer.ts";
import { swebokCh01Requirements } from "./swebok-ch01-requirements.ts";
import { swebokCh02Architecture } from "./swebok-ch02-architecture.ts";
import { swebokCh03Design } from "./swebok-ch03-design.ts";
import { swebokCh04Construction } from "./swebok-ch04-construction.ts";
import { swebokCh05Testing } from "./swebok-ch05-testing.ts";
import { swebokCh06Operations } from "./swebok-ch06-operations.ts";
import { swebokCh07Maintenance } from "./swebok-ch07-maintenance.ts";
import { swebokCh08Configuration } from "./swebok-ch08-configuration.ts";
import { swebokCh09Management } from "./swebok-ch09-management.ts";
import { swebokCh10Process } from "./swebok-ch10-process.ts";
import { swebokCh11Models } from "./swebok-ch11-models.ts";
import { swebokCh12Quality } from "./swebok-ch12-quality.ts";
import { swebokCh13Security } from "./swebok-ch13-security.ts";
import { swebokCh14Professional } from "./swebok-ch14-professional.ts";
import { swebokCh15Economics } from "./swebok-ch15-economics.ts";
import { swebokCh16Computing } from "./swebok-ch16-computing.ts";
import { swebokCh17Math } from "./swebok-ch17-math.ts";
import { swebokCh18Engineering } from "./swebok-ch18-engineering.ts";
import { swebok } from "./swebok.ts";
import { tddPrinciples } from "./tdd-principles.ts";
import { tddStateCoverage } from "./tdd-state-coverage.ts";
import { tddTestAsDocumentation } from "./tdd-test-as-documentation.ts";

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
| 1 | **JetBrains WebStorm MCP** (\`mcp__webstorm__*\`) | All file **UPDATE/DELETE** operations (for safe refactoring), and as a primary tool for file **READ** operations when the IDE is running. |
| 2 | **Search & JSON CLI Tools** (\`es\`, \`jq\`, \`rg\`) | Priority for all file **READ** operations (e.g., path searching with \`es\`, JSON operations with \`jq\`, text searching with \`rg\`) if WebStorm MCP is unavailable. |
| 3 | **PowerShell** | File-adjacent shell operations that the prior tools cannot cover (path operations, directory listing, process management). Full access to .NET APIs for advanced scripting. |
| 4 | **Native Tools** (\`Grep\`, \`Glob\`, \`Read\`, \`Edit\`, \`Write\`) | Only when prior tools cannot cover the operation. |
| 5 | **Bash** | Last resort only — always prefer PowerShell on Windows. |

*Note: WebStorm is assumed to be running. Use it as the primary tool for all file operations (READ, UPDATE, and DELETE) when the IDE is running.*

## Token Efficiency & CLI Optimization

1. **Prefer IDE search/inspect tools over terminal commands:** WebStorm MCP search/symbol tools (like \`search_in_files_by_text\` and \`get_symbol_info\`) use indexing and return structured, compact JSON results instead of dumping raw stream outputs. Avoid running terminal tools (\`rg\`, \`grep\`, etc.) unless the IDE is unavailable.
2. **Selective / Incremental Diffing:** When analyzing repository changes, do not run a full \`git diff\` or \`git diff --staged\` on large change surfaces. Run \`git diff --name-only\` or \`git diff --stat\` first to view the file list, then inspect diffs of individual files of interest. This prevents thousands of lines of diff content from bloating the conversation history and consuming excessive tokens on subsequent turns.
3. **Targeted Test Execution:** When running tests during active coding loops (e.g. Red/Green phases), execute targeted test files (e.g. \`pnpm --filter <package-name> exec vitest run <path/to/file.test.ts> --no-coverage\`) rather than running the full package or workspace test suites. Full test runs and coverage reports generate huge outputs that clutter the context.
4. **Avoid redundant read operations:** Do not repeatedly read the same files or list the same directories within a task. Reuse the workspace context where possible.

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
   \`\`\`

## Learned Lessons

### Proven Patterns
- **Everything Search CLI (es) Fallback**: The \`es\` CLI relies on the Windows Everything IPC service. If the Everything service/application is not running, \`es\` fails. In this case, fall back to JetBrains WebStorm MCP \`find_files_by_glob\` or ripgrep (\`rg\`) to search for file paths.`,
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
- \`preview_table_data\`: Previews table data in CSV format.

## Learned Lessons

### Corrections
- **WebStorm MCP Argument Nesting**: When calling WebStorm MCP tools via \`call_mcp_tool\`, pass all parameters (such as \`projectPath\` and \`pathInProject\`) inside the \`Arguments\` property of the tool payload, rather than as top-level fields of \`call_mcp_tool\`.
- **WebStorm MCP replace_text_in_file Parameter**: The WebStorm MCP tool \`replace_text_in_file\` requires the parameter \`pathInProject\` (and \`projectPath\`) to successfully locate and replace text in a file. The parameter is named \`pathInProject\`, not \`filePath\` (which might be listed in some older documentation).
- **WebStorm Text Search**: For text searches, prefer using the WebStorm MCP tool \`search_in_files_by_text\` (passing \`projectPath\`) rather than broad \`rtk rg\` terminal commands. WebStorm utilizes its indexed project structure, which executes instantly and avoids background task timeouts/hangs.
- **IDE Write Synchronization**: When modifying a file that is actively open or cached in JetBrains WebStorm, avoid native write tools to prevent the IDE from overwriting the file with its in-memory cache. Instead, use WebStorm MCP's \`open_file_in_editor\` followed by \`replace_text_in_file\` to ensure WebStorm applies and persists the changes.`,
  filename: "webstorm-mcp",
  trigger: "always_on"
});

const lint = defineRule({
  content: `# Linting and TypeScript Rules

## ESLint Troubleshooting & User Collaboration

* **Request User Help when Struggling with ESLint:** If you encounter conflicting ESLint rules, loops, or tricky typescript/linter constraints that are hard to resolve automatically, do not spin or struggle in a loop. Ask the user for help, explain what you are trying to change, and collaborate to find a clean path forward.

## Style/Quality Guidelines

- **Yoda comparisons**: Always put the constant first in comparisons (e.g., \`if (null === value)\`).
- **Arrow function blocks**: Always use explicit block bodies and returns in arrow functions (e.g., \`(x) => { return x; }\`).
- **Arrow functions**: Always use arrow functions rather than function declarations for all function definitions.
- **Explicit member accessibility**: Always use explicit accessibility modifiers (\`public\`/\`private\`/\`protected\`) for all class members.
- **typescript type definitions**: Enforce the use of \`type\` instead of \`interface\` for declaring typescript type definitions.
- **consistent-type-imports**: Enforce inline type imports when importing types.
- **isNil**: Perform nullable/boolean checks using Lodash \`isNil\` for explicit checks instead of implicit truthy/falsy evaluation on nullable values.
- **lodash/** method import path rules: Individual function path imports only, e.g., \`import map from "lodash/map.js"\`. Never import lodash globally.
- **React 19 rules**: Enforce functional components, purity, immutability, no class components, and no nested component definitions.
- **Ng signals and DI**: Use 信号 APIs (signals) over decorators, standalone components, and dynamic control flow in the Ng framework.
- **Vitest spec checks**: Expect spacing around test blocks, no assertions inside loops, and correct mock setups.

## Linter Conflict Solutions

- **Mock Promise auto-fix deadlock loops**: Avoid conflicts where unicorn removes a mock return value and triggers an empty function error. *Solution*: Use **lodash noop for mocking** (e.g. \`vi.fn(noop)\`) or insert an empty comment \`//\` inside the mock async body.
- **Array Methods**: **use lodash over native array methods** for all array operations (e.g., prefer \`map(arr, cb)\` from \`lodash/map.js\` over native \`arr.map(cb)\`).
- **Strict Boolean Expressions**: **use isNil, isString instead of !!** (or other type-guard helpers like \`isNumber\`) to perform nullable/boolean evaluation. Never cast values to a boolean using \`!!\`.
- **perfectionist object sorting vs partition comments**: Alphabetic sorting breaks logical pairings (e.g. \`{x, y}\`). *Solution*: Use partition comments (\`// partition\`) to prevent sorting.
- **Vitest hook bypass via \`onTestFinished\`**: Since hooks are forbidden (\`vitest/no-hooks\`), register mock and stub cleanups using Vitest's \`onTestFinished(cleanupFn)\` inside setup helper functions. This also avoids using \`try-finally\` blocks that trigger \`unicorn/try-complexity\`.
- **Vitest conditional test bypass**: Since conditionals are forbidden inside tests (\`vitest/no-conditional-in-test\`), split assertions of multiple states or conditions into multiple smaller test blocks, and avoid using \`if\` blocks directly in tests.
- **Drizzle dynamic queries**: Avoid re-assignment type errors and unsafe \`as any\` type-casting on query builders by calling \`.$dynamic()\` on the select statement to erase strict generic types.
- **Deletable properties vs Atomic writes**: Under strict TypeScript check, the \`delete\` operator requires properties to be optional. Instead of using \`delete\`, construct a new object that does not include the property (atomic writes), e.g., using destructuring: \`const { stack, ...rest } = row; return { ...rest, ...(!isNil(stack) ? { stack } : {}) };\`.
- **Zod output types**: Avoid using the deprecated \`schema._output\` property. Instead, import the inferred type from the schema's package, or use \`z.output<typeof schema>\` (or \`z.infer<typeof schema>\`).
- **TypeScript-ESLint compiler cascade warnings**: If eslint reports \`no-unsafe-assignment\` or \`no-unsafe-member-access\` on mocks/stubs, run \`tsc --noEmit\` to verify if generic parameters (e.g. \`Mock<Fn>\`) are incorrectly defined, which defaults the types to \`any\` (error types).
- **Apollo Link Connection**: Use Apollo's \`from\` utility (e.g. \`from([authLink, httpLink])\`) instead of \`.concat\` to avoid \`unicorn/prefer-spread\` conflict.
- **Dynamic Headers Deletion**: Avoid mutating headers dynamically using the \`delete\` operator, which violates \`@typescript-eslint/no-dynamic-delete\`. Instead, copy defaults and conditionally populate them using a structured key-value iterator or native \`Headers.set/delete\` API.
- **EventTarget Override Context**: To avoid \`unicorn/no-this-outside-of-class\` when monkeypatching EventTarget or native prototypes, declare the patched handler functions as \`static\` class methods, keeping the \`this\` keyword lexically scoped.
- **Zod trim Method Bypass**: Zod string validation \`.trim()\` triggers \`lodash/prefer-lodash-method\`. Bypass this conflict locally using property bracket notation: \`z.string()["trim"]()\`. For email validations where \`z.string().email()\` is deprecated, wrap it in a preprocessor to trim first: \`z.preprocess((val) => { return isString(val) ? trim(val) : val; }, z.email())\`.
- **Command Line Argument Destructuring**: Use array destructuring (e.g., \`const [, , filePath] = globalThis.process.argv\`) instead of direct index access to resolve \`@typescript-eslint/prefer-destructuring\` on \`process.argv\`.
- **Cyclomatic Complexity Reduction**: Replace complex switch/if statements with a static lookup registry map that routes block/event types to dedicated renderer functions, keeping individual function complexity extremely low.

## Security Mitigations

- **SR-1**: Limit lint-fix attempts to a maximum of 3 iterations to prevent infinite loop execution.
- **SR-3**: Type checks must preserve exact falsy semantics (like empty string \`""\` or \`0\`) when modifying boolean checks to prevent logic bypasses.
- **SR-7**: All changes must be traceable, logged, and isolated in specific commits (no auto-push/commit without user permission).

## Learned Lessons

### Corrections
- **Lodash Imports Must Be Individual**: Always import lodash functions individually using the path format (e.g. \`import map from "lodash/map.js"\`). Never use \`import lodash from "lodash"\` or \`import { map } from "lodash"\` — the path-based per-function import is required to keep bundle size small.
- **ESLint Auto-Fix Cycle Deadlock**: When mocking functions (like \`vi.fn()\`) in tests, watch out for conflicts between eslint rules. For example, using \`vi.fn(async () => { return Promise.resolve(); })\` will trigger \`unicorn/no-useless-promise-resolve-reject\`, which auto-fixes on save by stripping \`return Promise.resolve()\`. This leaves the function body empty: \`vi.fn(async () => {})\`, which then triggers \`@typescript-eslint/no-empty-function\`.
  - *Fix:* Insert a comment inside the body to prevent it from being classified as empty:
    \`\`\`typescript
    const mockNavigate = vi.fn(async () => {
      //
    });
    \`\`\`
- **Explicit Returns in attempt/attemptAsync**: In strict TypeScript configurations (e.g. \`TS7030\` check), ensure that all code paths within the callback return an explicit value (e.g., a default fallback object or \`undefined\`) instead of throwing errors or relying on implicit returns, to prevent compilation failures without introducing runtime exception overhead.
- **Lodash isNil for Nullable Checks**: When checking anything nullable, always use \`isNil()\` from lodash (e.g. \`isNil(val)\` instead of checking against \`undefined\` or \`null\`).
- **Browser Global Stubbing**: In universal/SDK code running in tests, access window-scoped properties like \`location.href\` via \`globalThis.window.location.href\` and verify \`globalThis.window\` is defined before accessing, to prevent throwing \`ReferenceError\`/\`TypeError\` in Node test environments.
- **Index Signature Property Access**: In packages with \`noPropertyAccessFromIndexSignature\` enabled, use bracket notation \`obj["prop"]\` instead of dot notation \`obj.prop\` for objects defined as index-signature types (like \`Record<string, any>\` or \`any\`).
- **D1 Mocking Column Order**: When mocking D1 statements in tests or proxies for Drizzle ORM, the array of values returned by \`.raw()\` must align exactly with the alphabetical/definition order of columns in \`sqliteTable\` to avoid property mapping mismatches.
- **No ESLint Auto-Revert**: If an ESLint fix fails or breaks something, do not auto-revert the changes globally. Ask the user for guidance on what to do.
- **Single Category ESLint Fixes**: Only fix one category of ESLint issues at a time, and ask the user for confirmation before moving to the next category. Do not attempt to fix the same issue repeatedly if it fails.
- **Explicit Member Accessibility**: Always use explicit accessibility modifiers (\`public\`/\`private\`/\`protected\`) for class members and methods.
- **Arrow Functions Preference**: Enforce the use of arrow functions over function declarations (e.g., \`const fn = () => {}\` instead of \`function fn() {}\`).
- **Avoid Explicit Returns**: Avoid specifying explicit return types in TypeScript functions unless strictly necessary. In general, rely on TypeScript's type inference as much as possible.
- **Wrangler Conflicting Secrets**: In Wrangler configuration files (\`wrangler.jsonc\`/\`wrangler.toml\`), avoid setting empty placeholders in the \`vars\` block for variables that are intended to be kept secure as Cloudflare Secrets. When deploying via Wrangler, any empty variables defined in \`vars\` will overwrite and clear the existing remote secrets on Cloudflare. Keep secrets entirely out of the \`vars\` block.
- **Vitest Spy Typing**: When defining variables to hold mock/spy instances at the \`describe\` block scope, type them explicitly using \`MockInstance<typeof targetFunction>\` (e.g. \`let exitSpy: MockInstance<typeof process.exit>;\`) rather than using complex wrappers like \`ReturnType<typeof vi.spyOn<...>>\` to avoid TypeScript generic constraint mismatches.
- **Explicit Node Process Imports**: Import \`process\` from \`"node:process"\` inside test files rather than relying on global \`process\` references to ensure the full Node.js types are resolved correctly.

### Proven Patterns
- **ESLint and Lodash Compliance**: Avoid native \`.filter\`, \`typeof === "string"\`, and \`.endsWith\` on arrays/strings when using Lodash-preferred conventions. Additionally, avoid variable abbreviations like \`srcDir\` to prevent triggering \`unicorn/prevent-abbreviations\` (prefer descriptive names like \`sourceDirectory\`).
- **Strict TypeScript/ESLint checks**: When working under strict ESLint rules (like those in \`eslint-config\`), avoid non-null assertions (\`!\`) by using TypeScript type narrowing, and explicitly check nullable values (e.g., \`!isNil(val)\`) to satisfy \`@typescript-eslint/strict-boolean-expressions\`. Also, do not mix destructuring and property access of the same object in the same function scope to satisfy \`unicorn/consistent-destructuring\`.`,
  description:
    "linting, fixing lint errors, formatting, typescript checks, or type errors",
  filename: "lint",
  trigger: "model_decision"
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
  webstormMcp,
  lint,
  dddStrategic,
  dddTactical,
  rcaFiveWhys,
  tddPrinciples,
  tddStateCoverage,
  tddTestAsDocumentation,
  requirementsEngineering,
  executionPlanning,
  codeVerification,
  reviewDesignChecklist,
  reviewSecurityChecklist,
  rolePlanner,
  roleTestWriter,
  roleImplementer,
  roleRca,
  roleRequirementsAnalyst,
  roleRequirementsWriter,
  roleSecurityAnalyst,
  roleQualityAnalyst,
  roleReviewer,
  roleReporter,
  gitWorkflow,
  reviewPipeline,
  swebok,
  swebokCh01Requirements,
  swebokCh02Architecture,
  swebokCh03Design,
  swebokCh04Construction,
  swebokCh05Testing,
  swebokCh06Operations,
  swebokCh07Maintenance,
  swebokCh08Configuration,
  swebokCh09Management,
  swebokCh10Process,
  swebokCh11Models,
  swebokCh12Quality,
  swebokCh13Security,
  swebokCh14Professional,
  swebokCh15Economics,
  swebokCh16Computing,
  swebokCh17Math,
  swebokCh18Engineering
];
