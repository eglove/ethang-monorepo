import { defineRule } from "../../define.ts";

export const workspaceTools = defineRule({
  content: `# Workspace Tools Usage & Optimization

## 1. Domain Theory and Conceptual Foundations
In agentic software engineering, optimizing developer tool selection and execution is critical for both execution speed and model token efficiency. Large Language Models (LLMs) operate within strict context window and token usage constraints. Running verbose terminal commands can dump megabytes of redundant output into the conversation history, quickly consuming the context window and degrading model reasoning performance. Using specialized indexing, search, and transformation tools minimizes the data payload returned to the model context.

### 1.1 Model Context Optimization and Token Budgets
Every token returned from terminal execution consumes context. Minimize bloat:
- **RTK (Rust Token Killer)**: A wrapper filtering progress indicators, duplicate logs, and formatting syntax, reducing output by 60%-90%.
- **Selective Diffing**: Avoid full git diffs. Use file lists (\`--name-only\`) or stats (\`--stat\`) to inspect targets selectively.

### 1.2 Tool Execution Priority Hierarchy
All file operations and terminal executions on Windows must prioritize tools according to a strict performance hierarchy:
1. **Codebase Memory (codebase-memory-mcp)**: ALWAYS prefer MCP graph tools (search_graph, trace_path, get_code_snippet, query_graph, get_architecture) over grep/glob/file-search for code discovery.
2. **JetBrains WebStorm MCP**: Reuses the IDE's indexes, providing fast search capability, automated refactoring, syntax inspection, and write safety.
3. **Specialized Search & JSON CLI Utilities**: Utilizes local native indexes (e.g., Everything search CLI \`es\` for path resolution, \`rg\` for text, \`jq\` for JSON filtering).
4. **PowerShell**: Provides command glue and OS-specific scripts.
5. **Native File Tools**: Basic file system actions.
6. **Bash**: Kept as a last resort on Windows.

### 1.3 WebStorm MCP Architecture and Write Synchronization
WebStorm caches file systems in memory. Modifying files directly on disk can cause synchronization conflicts where the IDE overwrites disk edits with cached data. Always nest WebStorm MCP tool arguments inside the \`Arguments\` property to ensure write synchronization.

### 1.4 Command Line Search Indexing and ripgrep Principles
ripgrep (\`rg\`) searches directories recursively for regex patterns, automatically respecting \`.gitignore\` (skipping node modules, build artifacts). Using a Rust search engine, it returns matches instantaneously.

### 1.5 JSON Processing and Streaming Optimization via jq
Directly viewing large JSON configurations exhausts the token budget. Use \`jq\` to filter, pluck, or slice JSON structures locally, streaming only the relevant subsets to the model context.

### 1.6 Everything Search (es) IPC Architecture
The \`es\` utility accesses the master file table (MFT) of NTFS volumes via Everything IPC service, locating file paths in milliseconds. Fall back to WebStorm or ripgrep if the service is inactive.

### 1.7 Logging, Pagination, and Output Control
All commands run with \`PAGER=cat\` to prevent interactive blocking. Paginate logs and preview files with explicit limits (e.g., \`git log -n 5\`, or \`head\`/\`tail\` helpers) to avoid context bloat.

### 1.8 Background Task Lifecycle and Reactive Wakeup
Long-running builds, servers, or test suites run in the background. The system pauses and resumes execution reactively when background tasks complete. Avoid polling or checking status; wait for system notifications.

### 1.9 GitHub Integration via gh CLI
The \`gh\` CLI is integrated under \`rtk\` for query operations, PRs, issues, and CI runs. Use the \`--ultra-compact\` flag to compress tables into inline ASCII lines.

### 1.10 Requirements Validation via SARA CLI
The \`sara\` CLI manages requirements and design integrity, verifying that system and software requirements trace correctly to design files and implementation code.

## 2. Standard Operating Procedures (SOP)

### Step 2.1: Codebase Memory Graph Discovery (codebase-memory-mcp)
When searching for code definitions, implementations, or relationships, prioritize codebase-memory-mcp tools over grep/glob:
- **search_graph**: Search for functions, classes, routes, variables (e.g., \`name_pattern: ".*Order.*"\`).
- **trace_path**: Trace inbound/outbound calls (e.g., \`function_name: "OrderHandler", direction: "inbound"\`).
- **get_code_snippet**: Read specific source code (e.g., \`qualified_name: "pkg/orders.OrderHandler"\`).
- **query_graph**: Run custom Cypher queries.
- **get_architecture**: Retrieve high-level project summary.
For all codebase-memory-mcp calls, provide the required \`project\` parameter as \`C-Users-glove-projects-ethang-monorepo\`. Fall back to grep/glob only for configuration values, string literals, non-code files, or when MCP returns insufficient results.

### Step 2.2: Prioritizing WebStorm MCP for File Edits
Always use WebStorm MCP tools when updating or deleting files. Ensure all parameters are nested under the \`Arguments\` object:
\`\`\`typescript
// Inside the tool payload structure:
{
  ServerName: "mcp__webstorm",
  ToolName: "replace_text_in_file",
  Arguments: {
    pathInProject: "packages/agents-build/src/content/rules/target-file.ts",
    projectPath: "c:/Users/glove/projects/ethang-monorepo",
    oldText: "const value = 1;",
    newText: "const value = 2;"
  }
}
\`\`\`

### Step 2.3: Implementing RTK Command Prefixing
Prefix all terminal commands with \`rtk\` to compress the output sent to the model context:
\`\`\`bash
# Compress git status and test logs
rtk git status
rtk pnpm --filter @ethang/agents-build test
rtk rg "my-pattern" src/
\`\`\`

### Step 2.4: Performing Fast File Searches via Everything Search (es)
Locate files across the filesystem using the \`es\` CLI. If the Everything service is inactive, fall back to WebStorm's \`find_files_by_glob\`:
\`\`\`bash
# Locate all ts files matching a pattern
rtk es /a-d -json *my-module*.ts
\`\`\`

### Step 2.5: Querying JSON Data via jq
Filter and format JSON files before outputting them to the conversation:
\`\`\`bash
# Pluck only the dependencies object from package.json
rtk jq ".dependencies" package.json
# Filter array elements matching a condition
rtk jq ".[] | select(.name == "target-package")" packages.json
# Extract values into raw text strings (removing quotes)
rtk jq -r ".scripts.build" package.json
\`\`\`

### Step 2.6: Searching Text with ripgrep (rg)
Search for specific substrings or patterns inside the source folders. Use context flags when surrounding code is needed:
\`\`\`bash
# Simple case-insensitive match
rtk rg -i "my-search-term" packages/agents-build/src/
# Include 3 lines of context after matches
rtk rg -A 3 "class User" packages/
# Find only filenames containing matches
rtk rg -l "export const globalRules" packages/
\`\`\`

### Step 2.7: Running Non-Blocking Background Tasks
Avoid polling running tasks. Let the reactive handler yield control:
\`\`\`bash
# Start linter in background
rtk pnpm --filter @ethang/agents-build lint
# Terminate if hung: manage_task Action="kill" TaskId="task-id"
\`\`\`

### Step 2.8: Restricting Log Pagination
Always apply constraints to commands that yield continuous log formats:
\`\`\`bash
# Limit git log output to the last 5 commits
rtk git log -n 5 --oneline
# View only the first 20 lines of a large log file
rtk powershell -Command "Get-Content build.log -TotalCount 20"
\`\`\`

### Step 2.9: Running the Workspace Verification Suite
Verify workspace integrity regularly:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

### Step 2.10: Managing Pull Requests and Workflows via gh CLI
Use \`rtk gh\` subcommands to interact with GitHub. Wrap multi-line arguments in quotes:
\`\`\`bash
# Create a pull request
rtk gh pr create --title "feat: add feature" --body "My body details"
# View CI run log
rtk gh run view <run-id> --log
\`\`\`

### Step 2.11: Validating Requirements and Design Traceability via SARA CLI
Use \`rtk sara\` to initialize, validate, and query the graph:
\`\`\`bash
# Verify integrity of requirements and designs
rtk sara check
# Generate coverage report
rtk sara report
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following workspace tools usage rules:

- [ ] **Codebase Memory Graph Preferred**: Did you prioritize codebase-memory-mcp tools (search_graph, trace_path, get_code_snippet) over grep/glob for code discovery?
- [ ] **Priority Hierarchy Followed**: Did you attempt codebase-memory-mcp or WebStorm MCP tools before reverting to CLI or native file systems?
- [ ] **Command RTK Prefixed**: Are all shell executions prefixed with \`rtk\` to optimize the token budget?
- [ ] **Arguments Nested**: Are all WebStorm MCP arguments nested under the \`Arguments\` property of the payload?
- [ ] **Write Synchronization Checked**: Did you avoid modifying active IDE-buffered files via native file writers?
- [ ] **Selective Diffing Applied**: Did you run git diff with \`--name-only\` or \`--stat\` first rather than a full raw diff?
- [ ] **Targeted Tests Executed**: Did you isolate testing to specific files rather than running full packages?
- [ ] **JSON Processed via jq**: Did you query large JSON files using \`jq\` instead of printing the whole file?
- [ ] **Search Fallback Utilized**: If Everything search (\`es\`) failed, did you fall back to WebStorm search or ripgrep?
- [ ] **Yoda Comparisons Used**: Are all comparison statements in scripts formatted with constants on the left?
- [ ] **Arrow Functions Enforced**: Are all hook scripts and build helpers structured as arrow functions?
- [ ] **Explicit Member Modifiers**: Are custom CLI tooling class methods annotated with visibility modifiers?
- [ ] **Luxon for Timestamps**: Are elapsed execution times represented using Luxon (\`DateTime\`)?
- [ ] **No Forbidden Terminology**: Has the code been scanned to verify no restricted words are present?
- [ ] **Index Signature Property Access**: Are dynamic attributes on index-signature types accessed via bracket notation (\`obj["key"]\`)?
- [ ] **Tuple Typing in Tests**: Are Vitest \`it.each\` tables explicitly typed to prevent compiler warnings?
- [ ] **Void Assertions Wrapped**: Are test assertions for void operations wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Rule Character Bounds**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Backticks Escaped**: Are all backticks and code snippets in the rule content template properly escaped?
- [ ] **Walkthrough Updated**: Are build verification status, benchmark times, and test logs documented in \`walkthrough.md\`?
- [ ] **SARA Graph Checked**: Did you run \`rtk sara check\` to validate requirements and design integrity?
- [ ] **GitHub PR Opened**: Did you open the Pull Request using the \`rtk gh pr\` CLI when submitting changes?`,
  description:
    "usage guidelines, priority hierarchy, and command references for codebase-memory-mcp, webstorm_mcp, rg, jq, es, and rtk",
  filename: "workspace-tools",
  trigger: "always_on"
});
