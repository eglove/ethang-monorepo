import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineCommand } from "../../define.ts";

const blocks: MarkdownBlock[] = [
  {
    level: 1,
    text: "Git Staging and Commit Workflow (/commit)",
    type: "header"
  },
  {
    text: "When the user invokes `/commit`, you MUST execute the full staging and commit workflow described below. Do NOT just summarize the steps — run them directly.",
    type: "text"
  },
  { level: 2, text: "Execution Workflow", type: "header" },
  {
    items: [
      {
        text: "**Inspect Workspace Changes**: Run `git status --porcelain` to see all modified, untracked, and deleted files."
      },
      {
        text: "**Categorize Changes**: Present a clear, emoji-bulleted summary to the user separating what will be staged from what won't. List the staged files under a 🟢 heading and the unstaged/untracked files under a 🔴 heading."
      },
      {
        text: "**Ask for Confirmation**: You MUST explicitly ask the user for confirmation before proceeding. Do NOT run `git commit` until the user approves the staged list."
      },
      {
        text: "**Build Commit message**: After the user confirms, construct the commit message following the rules below, then run `git commit` with it."
      }
    ],
    type: "numberedList"
  },
  {
    level: 2,
    text: "Commit message Format (Conventional Commits & RFC 2119)",
    type: "header"
  },
  {
    text: "When constructing the commit message, you MUST strictly adhere to these rules:",
    type: "text"
  },
  {
    items: [
      {
        children: [
          {
            text: "The message MUST be prefixed with a noun type indicating the nature of changes (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`)."
          },
          {
            text: "A scope MAY be provided after the type, enclosed in parentheses (e.g., `feat(auth): add google sign-in`)."
          },
          {
            text: "A terminal colon (`:`) and space MUST follow the type/scope prefix."
          },
          {
            text: "A description MUST follow the colon and space. The description is a short summary of the code changes, written in lowercase."
          }
        ],
        text: "\u{1F4CC} **Commit Header Structure**:"
      },
      {
        children: [
          {
            text: "A breaking change MUST be indicated by a `!` immediately after the type/scope (e.g., `feat(api)!: remove deprecated endpoints`), or by starting the body/footer with `BREAKING CHANGE:`."
          }
        ],
        text: "\u{26A1} **Breaking Changes**:"
      },
      {
        children: [
          {
            text: "A commit body MAY be provided after a blank line. The body SHOULD describe the motivation for the change and contrast it with previous behavior."
          },
          {
            text: "One or more footers MAY be provided after another blank line (e.g., `Refs: #123`)."
          }
        ],
        text: "\u{1F4DD} **Commit Body & Footer**:"
      },
      {
        children: [
          {
            text: "In this repository, the commit body/footers SHOULD use the descriptive `[Actor]: [Action]` format (e.g., `Agent: Implement commit skill`)."
          }
        ],
        text: "\u{1F916} **Actor-Action Format**:"
      }
    ],
    type: "unorderedList"
  },
  { level: 2, text: "RFC 2119 Key Terminology", type: "header" },
  {
    items: [
      {
        text: "\u{26A0}\u{FE0F} **MUST/SHALL/REQUIRED**: Indicates an absolute requirement. Failing to do this violates the repository's git hygiene rules."
      },
      {
        text: "\u{1F6AB} **MUST NOT/SHALL NOT**: Indicates an absolute prohibition."
      },
      {
        text: "\u{1F4A1} **SHOULD/RECOMMENDED**: Indicates a highly recommended best practice, though valid exceptions may exist."
      },
      {
        text: "\u{2699}\u{FE0F} **MAY/OPTIONAL**: Indicates a truly optional action."
      }
    ],
    type: "unorderedList"
  }
];

export const commit = defineCommand({
  content: blocks,
  description:
    "Adds and commits uncommitted changes in the repository. Confirms staged vs unstaged files with the user, enforcing Conventional Commits, RFC 2119 key terminology, and emoji bullet points.",
  name: "commit"
});
