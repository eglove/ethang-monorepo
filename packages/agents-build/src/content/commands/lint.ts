import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineCommand } from "../../define.ts";

export const lint = defineCommand({
  content: [
    {
      level: 1,
      text: "ESLint Fixer and Config Manager (/lint)",
      type: "header"
    },
    {
      text: "This command is designed specifically to understand, execute, and fix issues related to the `@ethang/eslint-config` package and the broader monorepo linting environment. Accepts a `$prompt` (free-form task description) from the user describing what linting issues to fix or which rules to address.",
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
          text: "**Rule Awareness**: You must be aware of every rule turned on or off in the configuration.\n- Use file reading tools (`open`, `search_contents_by_grep`) to inspect `packages/eslint-config/src/config.*.js` dynamically to parse and understand the rules currently applied."
        },
        {
          text: '**Knowledge Base**: Check your static knowledge base for difficult rules before attempting to fix them.\n- The knowledge base is appended to the bottom section of `.junie/commands/lint.md` under the "## Knowledge Base" heading. Read that section using `open`.'
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
      text: "When this command is invoked, use the `$prompt` argument (if provided) to understand what specific linting issues the user wants addressed, then follow these steps:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Run ESLint**: Execute the linter across the affected project or monorepo to identify issues. Use `pnpm lint` or `npx eslint` as appropriate for the target workspace. If a `$prompt` was provided, use it to scope the lint run to the relevant files or rules."
        },
        {
          text: "**Fix Issues**: Modify code to resolve the linting errors identified."
        },
        {
          text: "**Turn Tracking**: You must track how many times you have attempted to fix a specific rule across separate invocations.\n- If it takes more than 3 separate invocations (turns) to fix a specific linting rule, you MUST STOP and ask the user for guidance. Explain what you've tried and ask how they want to proceed."
        },
        {
          text: '**Knowledge Recording**: If you encounter a difficult to fix rule and successfully find a solution (or the user provides one), you MUST append the solution to your knowledge base.\n- Append a clear Markdown section explaining the rule, the problem, and the solution to the bottom of `.junie/commands/lint.md` (under the "## Knowledge Base" heading). This file is regenerated on each agents-build, so the command must append to it after generation. Do NOT overwrite the existing entries.'
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
    },
    {
      level: 2,
      text: "Knowledge Base",
      type: "header"
    },
    {
      text: "The following knowledge base entries are accumulated solutions to difficult lint rules encountered during development. When you fix a difficult rule, append a new entry here.",
      type: "text"
    },
    {
      level: 3,
      text: "@typescript-eslint/no-unused-vars / sonar/no-dead-store / sonar/no-unused-vars",
      type: "header"
    },
    {
      items: [
        {
          text: "**Rule:** Unused variable in a `for...of` loop."
        },
        {
          text: "**Problem:** `for (const command of commands)` assigns `command` but the loop body only pushes `path.join(commandsDir)` without using the loop variable."
        },
        {
          text: "**Solution:** Replace the `for...of` loop with lodash `forEach(commands, () => { ... })` when the loop variable is not needed. This avoids declaring an unused variable while preserving the iteration behavior."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "sonar/cognitive-complexity / sonar/cyclomatic-complexity",
      type: "header"
    },
    {
      items: [
        {
          text: "**Rule:** Function cognitive/cyclomatic complexity exceeds thresholds (15/10 respectively)."
        },
        {
          text: "**Problem:** A function with deeply nested conditions, loops, and early-exit logic accumulates complexity."
        },
        {
          text: "**Solution:** Extract the inner directory-processing loop body into a separate `scanDirectory` helper function. Use early return (`if (!isExists) { return; }`) to flatten the nesting level."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "sonar/max-lines-per-function",
      type: "header"
    },
    {
      items: [
        {
          text: "**Rule:** Functions must not exceed 200 lines."
        },
        {
          text: "**Problem:** A single `describe` block callback in a test file contained all tests for file lifecycle, error handling, and manifest edge cases (~275 lines)."
        },
        {
          text: '**Solution:** Split the large `describe` block into multiple smaller `describe` blocks (`"file lifecycle"`, `"error handling"`, `"manifest edge cases"`), each with its own `beforeEach`/`afterEach` setup. Each block stays well under 200 lines.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "sonar/no-duplicate-string",
      type: "header"
    },
    {
      items: [
        {
          text: "**Rule:** String literals duplicated 3+ times should be extracted to a constant."
        },
        {
          text: '**Problem:** The test description `"renders when content is MarkdownBlock[]"` appeared as a test name in 3 different `describe` blocks (ruleMarkdown, commandMarkdown, skillMarkdown).'
        },
        {
          text: '**Solution:** Extract the string to a module-level constant (`const MARKDOWN_BLOCK_CONTENT_TEST = "renders when content is MarkdownBlock[]"`) and reference it via the constant in all three `it()` calls. This keeps the test names identical (as intended) while satisfying the no-duplicate-string rule.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "TypeScript: TS4104 (readonly type mismatch)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Rule:** `readonly` arrays cannot be assigned to mutable array types."
        },
        {
          text: "**Problem:** `GLOBAL_COMMANDS` is declared `as const` (producing `readonly [CommandDefinition, CommandDefinition]`), but `CompilerConfig.commands` was typed as `CommandDefinition[]` (mutable)."
        },
        {
          text: "**Solution:** Change the `commands` property type in `CompilerConfig` from `CommandDefinition[]` to `readonly CommandDefinition[]`, since the compiler never mutates the input arrays."
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "ALWAYS invoke this command for any linting tasks. Do not run eslint directly. Specifically designed to understand and fix issues with @ethang/eslint-config. Accepts a $prompt argument describing what linting issues to fix. Aware of rules, tracks fix attempts, asks for help after 3 failures, and records difficult solutions to a static knowledge base.",
  name: "lint"
});
