import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const lint = defineSkill({
  content: [
    {
      level: 1,
      text: "ESLint Fixer and Config Manager",
      type: "header"
    },
    {
      text: "This skill is designed specifically to understand, execute, and fix issues related to the `@ethang/eslint-config` package and the broader monorepo linting environment.",
      type: "text"
    },
    {
      level: 2,
      text: "Context & Awareness",
      type: "header"
    },
    {
      items: [
        {
          text: "**Rule Awareness**: You must be aware of every rule turned on or off in the configuration.\n- Use the `grep` tool to inspect `packages/eslint-config/src/config.*.js` dynamically to parse and understand the rules currently applied."
        },
        {
          text: "**Knowledge Base**: Check the skill resources for difficult rules and their solutions before attempting to fix them."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Execution Workflow",
      type: "header"
    },
    {
      text: "When this skill is invoked, follow these steps:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Run ESLint**: Execute the linter across the affected project or monorepo to identify issues. Use `pnpm lint` as appropriate for the target workspace."
        },
        {
          text: "**Fix Issues**: Modify code to resolve the linting errors identified."
        },
        {
          text: "**Turn Tracking**: You must track how many times you have attempted to fix a specific rule across separate invocations.\n- If it takes more than 3 separate invocations (turns) to fix a specific linting rule, you MUST STOP and ask the user for guidance. Explain what you've tried and ask how they want to proceed."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Best Practices",
      type: "header"
    },
    {
      items: [
        {
          text: "Always verify the linter runs cleanly after applying fixes."
        },
        {
          text: "For configuration issues, cross-reference the problem with the rules defined in `packages/eslint-config/src/config.*.js`."
        },
        {
          text: "Keep the knowledge base concise and structured (Rule Name, Problem, Solution/Workaround)."
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "ALWAYS invoke this skill for any linting tasks. Do not run eslint directly. Specifically designed to understand and fix issues with @ethang/eslint-config. Aware of rules, tracks fix attempts, asks for help after 3 failures.",
  name: "lint",
  resources: [
    {
      content: `# Lint Knowledge Base

The following entries are accumulated solutions to difficult lint rules encountered during development.

### @typescript-eslint/no-unused-vars / sonar/no-dead-store / sonar/no-unused-vars

* **Rule:** Unused variable in a \`for...of\` loop.
* **Problem:** \`for (const command of commands)\` assigns \`command\` but the loop body only pushes \`path.join(commandsDir)\` without using the loop variable.
* **Solution:** Replace the \`for...of\` loop with lodash \`forEach(commands, () => { ... })\` when the loop variable is not needed. This avoids declaring an unused variable while preserving the iteration behavior.

### sonar/cognitive-complexity / sonar/cyclomatic-complexity

* **Rule:** Function cognitive/cyclomatic complexity exceeds thresholds (15/10 respectively).
* **Problem:** A function with deeply nested conditions, loops, and early-exit logic accumulates complexity.
* **Solution:** Extract the inner directory-processing loop body into a separate \`scanDirectory\` helper function. Use early return (\`if (!isExists) { return; }\`) to flatten the nesting level.

### sonar/max-lines-per-function

* **Rule:** Functions must not exceed 200 lines.
* **Problem:** A single \`describe\` block callback in a test file contained all tests for file lifecycle, error handling, and manifest edge cases (~275 lines).
* **Solution:** Split the large \`describe\` block into multiple smaller \`describe\` blocks (\`"file lifecycle"\`, \`"error handling"\`, \`"manifest edge cases"\`), each with its own \`beforeEach\`/\`afterEach\` setup. Each block stays well under 200 lines.

### sonar/no-duplicate-string

* **Rule:** String literals duplicated 3+ times should be extracted to a constant.
* **Problem:** The test description \`"renders when content is MarkdownBlock[]"\` appeared as a test name in 3 different \`describe\` blocks (ruleMarkdown, commandMarkdown, skillMarkdown).
* **Solution:** Extract the string to a module-level constant (\`const MARKDOWN_BLOCK_CONTENT_TEST = "renders when content is MarkdownBlock[]"\`) and reference it via the constant in all three \`it()\` calls. This keeps the test names identical (as intended) while satisfying the no-duplicate-string rule.

### TypeScript: TS4104 (readonly type mismatch)

* **Rule:** \`readonly\` arrays cannot be assigned to mutable array types.
* **Problem:** \`GLOBAL_COMMANDS\` is declared \`as const\` (producing \`readonly [CommandDefinition, CommandDefinition]\`), but \`CompilerConfig.commands\` was typed as \`CommandDefinition[]\` (mutable).
* **Solution:** Change the \`commands\` property type in \`CompilerConfig\` from \`CommandDefinition[]\` to \`readonly CommandDefinition[]\`, since the compiler never mutates the input arrays.

### no-continue

* **Rule:** The \`continue\` statement is forbidden.
* **Problem:** \`for (const x of list) { if (!condition) { continue; } ... }\` — early-skip pattern using \`continue\`.
* **Solution:** Invert the condition to wrap the loop body instead: \`for (const x of list) { if (condition) { ... } }\`. This avoids \`continue\` entirely while preserving the same control flow.

### no-plusplus

* **Rule:** Unary \`++\` / \`--\` operators are forbidden.
* **Problem:** \`courseIndex++\` used to increment a counter in a loop body.
* **Solution:** Use \`+= 1\` instead: \`courseIndex += 1\`.

### unicorn/prefer-iterator-to-array

* **Rule:** Prefer \`Iterator#toArray()\` over spreading an iterator into an array.
* **Problem:** \`[...coursesByLp.keys()]\` creates a temporary spread array from a \`Map\` iterator.
* **Solution:** Replace with \`coursesByLp.keys().toArray()\`.

### sonar/nested-control-flow

* **Rule:** Control flow nesting depth exceeds the allowed limit (typically 3 levels).
* **Problem:** A loop body contains \`if\` statements that themselves contain loops and further \`if\`s, reaching 4+ levels of braces.
* **Solution:** Flatten nested structures using \`flatMap\` (or lodash \`flatMap\`) to merge an inner loop's results into the outer array, then iterate the flattened result with a single \`for...of\`. This keeps each loop body at ≤3 nesting levels.

### @typescript-eslint/no-shadow

* **Rule:** Variables declared in outer scopes must not be redeclared in inner scopes.
* **Problem:** Module-level constants (\`CREATED_AT\`, \`COURSE_1\`, \`LP_1\`, etc.) were redeclared with identical values inside a nested \`describe\` block's callback, causing shadowing.
* **Solution:** Remove the inner redeclarations and reference the module-level constants directly. Ensure mock data uses the same values as the module-level constants for assertions to match.
`,
      filename: "knowledge-base.md"
    }
  ]
});
