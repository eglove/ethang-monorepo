import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

const blocks: MarkdownBlock[] = [
  {
    level: 1,
    text: "Git Staging and Commit Workflow Guide (/commit)",
    type: "header"
  },
  {
    text: "This skill guides you through the process of staging and committing changes within this repository. It enforces structured git hygiene, Conventional Commits specification, RFC 2119 key terminology, and an interactive confirmation flow.",
    type: "text"
  },
  { level: 2, text: "Staging & Confirmation Flow", type: "header" },
  {
    text: "You MUST execute the following steps:",
    type: "text"
  },
  {
    items: [
      {
        children: [
          {
            text: "Run `git status --porcelain` or `git status` to check all modified, untracked, and deleted files."
          }
        ],
        text: "🔍 **Inspect Workspace Changes**:"
      },
      {
        children: [
          {
            children: [
              {
                text: "🟢 **Staged**: Files that are currently staged or planned to be staged."
              },
              {
                text: "🔴 **Unstaged/Untracked**: Files that are modified or untracked but will NOT be staged."
              }
            ],
            text: "Present a clear, emoji-bulleted summary separating what will be staged from what won't:"
          }
        ],
        text: "📋 **Categorize and Summarize Changes**:"
      },
      {
        children: [
          {
            text: "You MUST explicitly ask the user for confirmation before proceeding to commit."
          },
          {
            text: "Do NOT run `git commit` until the user approves the staged list."
          }
        ],
        text: "💬 **Ask for User Confirmation**:"
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "Commit Message Format (Conventional Commits & RFC 2119)",
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
        text: "📌 **Commit Header Structure**:"
      },
      {
        children: [
          {
            text: "A breaking change MUST be indicated by a `!` immediately after the type/scope (e.g., `feat(api)!: remove deprecated endpoints`), or by starting the body/footer with `BREAKING CHANGE:`."
          }
        ],
        text: "⚡ **Breaking Changes**:"
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
        text: "📝 **Commit Body & Footer**:"
      },
      {
        children: [
          {
            text: "In this repository, the commit body/footers SHOULD use the descriptive `[Actor]: [Action]` format (e.g., `Agent: Implement commit skill`)."
          }
        ],
        text: "🤖 **Actor-Action Format**:"
      }
    ],
    type: "unorderedList"
  },
  { level: 2, text: "RFC 2119 Key Terminology", type: "header" },
  {
    items: [
      {
        text: "⚠️ **MUST/SHALL/REQUIRED**: Indicates an absolute requirement. Failing to do this violates the repository's git hygiene rules."
      },
      { text: "🚫 **MUST NOT/SHALL NOT**: Indicates an absolute prohibition." },
      {
        text: "💡 **SHOULD/RECOMMENDED**: Indicates a highly recommended best practice, though valid exceptions may exist."
      },
      { text: "⚙️ **MAY/OPTIONAL**: Indicates a truly optional action." }
    ],
    type: "unorderedList"
  }
];

export const commit = defineSkill({
  content: blocks,
  description:
    "Adds and commits uncommitted changes in the repository. Confirms staged vs unstaged files with the user, enforcing Conventional Commits, RFC 2119 key terminology, and emoji bullet points.",
  name: "commit"
});
