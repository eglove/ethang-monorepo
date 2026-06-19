import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const lint = defineSkill({
  content: [
    {
      level: 1,
      text: "ESLint Fixer and Config Manager (/lint)",
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
          text: "**Rule Awareness**: You must be aware of every rule turned on or off in the configuration.\n- Use file reading tools (`view_file`, `grep_search`) to inspect `packages/eslint-config/src/config.*.js` dynamically to parse and understand the rules currently applied."
        },
        {
          text: "**Knowledge Base**: Check your static knowledge base for difficult rules before attempting to fix them.\n- The knowledge base is located at `.agents/skills/lint/resources/knowledge.md`. If the file exists, read it using `view_file`."
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
          text: "**Run ESLint**: Execute the linter across the affected project or monorepo to identify issues. Use `rtk pnpm lint` or `npx eslint` as appropriate for the target workspace."
        },
        {
          text: "**Fix Issues**: Modify code to resolve the linting errors identified."
        },
        {
          text: "**Turn Tracking**: You must track how many times you have attempted to fix a specific rule across separate invocations.\n- If it takes more than 3 separate invocations (turns) to fix a specific linting rule, you MUST STOP and ask the user for guidance. Explain what you've tried and ask how they want to proceed."
        },
        {
          text: "**Knowledge Recording**: If you encounter a difficult to fix rule and successfully find a solution (or the user provides one), you MUST append the solution to your knowledge base.\n- Append a clear Markdown section explaining the rule, the problem, and the solution to `.agents/skills/lint/resources/knowledge.md`. Use the `run_command` or file editing tools to append to this file. Do NOT overwrite the existing content of the file."
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
    "ALWAYS invoke this skill for any linting tasks. Do not run eslint directly. Specifically designed to understand and fix issues with @ethang/eslint-config. Aware of rules, tracks fix attempts, asks for help after 3 failures, and records difficult solutions to a static knowledge base.",
  name: "lint"
});
