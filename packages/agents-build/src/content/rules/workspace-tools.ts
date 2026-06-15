import { defineRule } from "../../define.ts";

export const workspaceTools = defineRule({
  content: `# Workspace Tools Usage & Optimization

## 1. Domain Theory and Conceptual Foundations
In agentic software engineering, optimizing developer tool selection and execution is critical for both execution speed and model token efficiency. Large Language Models (LLMs) operate within strict context window and token usage constraints. Running verbose terminal commands can dump megabytes of redundant output into the conversation history, quickly consuming the context window and degrading model reasoning performance. Using specialized indexing, search, and transformation tools minimizes the data payload returned to the model context.

### 1.1 Model Context Optimization and Token Budgets
Every token returned from a terminal execution contributes directly to the conversation history:
- **Redundant Outputs**: Standard command outputs contain verbose headers, footers, and structural boilerplate.
- **RTK (Rust Token Killer)**: A specialized wrapper that filters out progress indicators, duplicate logs, and compresses formatting syntax. Using \`rtk\` commands reduces the incoming text footprint by 60% to 90%.
- **Selective Diffing**: Running full git diffs on extensive changes generates large payloads. Running file lists (\`--name-only\`) or stats (\`--stat\`) allows the model to selectively inspect files.

### 1.2 Tool Execution Priority Hierarchy
All file operations and terminal executions on Windows must prioritize tools according to a strict performance hierarchy:
1. **JetBrains WebStorm MCP**: Reuses the IDE's indexes, providing fast search capability, automated refactoring, syntax inspection, and write safety.
2. **Specialized Search & JSON CLI Utilities**: Utilizes local native indexes (e.g., Everything search CLI \`es\` for path resolution, \`rg\` for text, \`jq\` for JSON filtering).
3. **PowerShell**: Provides command glue and OS-specific scripts.
4. **Native File Tools**: Basic file system actions.
5. **Bash**: Kept as a last resort on Windows.

### 1.3 WebStorm MCP Architecture and Write Synchronization
WebStorm maintains an in-memory virtual file system cache. Modifying files directly using native file system tools while the IDE is running can cause synchronization conflicts:
- **Write Synchronization**: If a file is edited in the filesystem, the IDE might overwrite those changes with its cached in-memory buffer.
- **Nesting Arguments**: All WebStorm MCP tool arguments must be nested inside the \`Arguments\` object.

### 1.4 Command Line Search Indexing and ripgrep Principles
ripgrep (\`rg\`) is a line-oriented search tool that recursively searches the current directory for a regex pattern. It respects \`.gitignore\` files by default, automatically skipping node modules, build artifacts, and dependency directories. By using a rust-based search engine and memory maps, it provides instantaneous results compared to native file scanners.

### 1.5 JSON Processing and Streaming Optimization via jq
Directly viewing large JSON configuration files quickly exhausts the token budget. Using \`jq\` to filter, pluck, or slice JSON structures allows the model to retrieve only the relevant values. \`jq\` compiles a filter expression and streams the JSON input through a virtual machine, allowing transformations (maps, filters, key slicing) to run locally before reaching the model context.

### 1.6 Everything Search (es) IPC Architecture
The Everything search utility (\`es\`) accesses the master file table (MFT) of the NTFS volume via the Everything background service. This allows it to locate any file path in milliseconds. However, because it relies on the IPC service, if the service is not running, the command will fail and fallbacks (like WebStorm or ripgrep) must be triggered.

### 1.7 Logging, Pagination, and Output Control
To prevent commands from blocking on interactive inputs, all terminal executions are run with \`PAGER=cat\`. When querying logs or commit histories, explicit line limits must be provided to avoid massive context dumps:
- **Git Logs**: Use limits like \`git log -n 5\` to retrieve only the recent commit metadata.
- **File Previews**: Use line boundaries or the \`head\`/\`tail\` CLI tools to inspect file parts rather than reading the entire file.

### 1.8 Background Task Lifecycle and Reactive Wakeup
Long-running operations (like dev servers, long builds, or test suites) are automatically sent to the background as tasks. The system uses a reactive wake-up model, pausing execution and resuming automatically when background processes complete or send stdout. Developers must not write polling scripts or continuously check status, relying instead on system notifications.

### 1.9 GitHub Integration via gh CLI
The GitHub CLI (\`gh\`) is integrated under the \`rtk\` wrapper. It supports optimized, token-efficient formats for query operations, pull requests, issues, repository metadata, and CI run actions.
- **Ultra-compact output**: Using the \`--ultra-compact\` flag compresses tables into ASCII icons and inline lines.

### 1.10 Requirements Validation via SARA CLI
The SARA CLI (\`sara\`) manages requirements and design integrity in a local traceability graph. It parses files, checks relationships, queries chains, and generates reports.
- **Integrity Validation**: SARA verifies that all system and software requirements have corresponding traceability relationships and design matches.

## 2. Standard Operating Procedures (SOP)

### Step 2.1: Prioritizing WebStorm MCP for File Edits
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

### Step 2.2: Implementing RTK Command Prefixing
Prefix all terminal commands with \`rtk\` to compress the output sent to the model context:
\`\`\`bash
# Compress git status and test logs
rtk git status
rtk pnpm --filter @ethang/agents-build test
rtk rg "my-pattern" src/
\`\`\`

### Step 2.3: Performing Fast File Searches via Everything Search (es)
Locate files across the filesystem using the \`es\` CLI. If the Everything service is inactive, fall back to WebStorm's \`find_files_by_glob\`:
\`\`\`bash
# Locate all ts files matching a pattern
rtk es /a-d -json *my-module*.ts
\`\`\`

### Step 2.4: Querying JSON Data via jq
Filter and format JSON files before outputting them to the conversation:
\`\`\`bash
# Pluck only the dependencies object from package.json
rtk jq ".dependencies" package.json
# Filter array elements matching a condition
rtk jq ".[] | select(.name == "target-package")" packages.json
# Extract values into raw text strings (removing quotes)
rtk jq -r ".scripts.build" package.json
\`\`\`

### Step 2.5: Searching Text with ripgrep (rg)
Search for specific substrings or patterns inside the source folders. Use context flags when surrounding code is needed:
\`\`\`bash
# Simple case-insensitive match
rtk rg -i "my-search-term" packages/agents-build/src/
# Include 3 lines of context after matches
rtk rg -A 3 "class User" packages/
# Find only filenames containing matches
rtk rg -l "export const globalRules" packages/
\`\`\`

### Step 2.6: Running Non-Blocking Background Tasks
Avoid polling running tasks. Execute and let the reactive handler yield back control:
\`\`\`bash
# Start the linter in the background
rtk pnpm --filter @ethang/agents-build lint
# To check status (only if needed for diagnostics):
# manage_task Action="status" TaskId="task-id"
# To terminate a hung task:
# manage_task Action="kill" TaskId="task-id"
\`\`\`

### Step 2.7: Restricting Log Pagination
Always apply constraints to commands that yield continuous log formats:
\`\`\`bash
# Limit git log output to the last 5 commits
rtk git log -n 5 --oneline
# View only the first 20 lines of a large log file
rtk powershell -Command "Get-Content build.log -TotalCount 20"
\`\`\`

### Step 2.8: Running the Workspace Verification Suite
Verify workspace integrity regularly:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

### Step 2.9: Managing Pull Requests and Workflows via gh CLI
Use \`rtk gh\` subcommands to interact with GitHub. Wrap multi-line arguments in quotes:
\`\`\`bash
# Create a pull request
rtk gh pr create --title "feat: add feature" --body "My body details"
# View CI run log
rtk gh run view <run-id> --log
\`\`\`

### Step 2.10: Validating Requirements and Design Traceability via SARA CLI
Use \`rtk sara\` to initialize, validate, and query the graph:
\`\`\`bash
# Verify integrity of requirements and designs
rtk sara check
# Generate coverage report
rtk sara report
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following workspace tools usage rules:

- [ ] **Priority Hierarchy Followed**: Did you attempt WebStorm MCP tools before reverting to CLI or native file systems?
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
    "usage guidelines, priority hierarchy, and command references for webstorm_mcp, rg, jq, es, and rtk",
  filename: "workspace-tools",
  trigger: "always_on"
});
