import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const githubCli = defineSkill({
  content: [
    {
      level: 1,
      text: "GitHub CLI (gh) Skill Guide",
      type: "header"
    },
    {
      text: "The GitHub CLI (`gh`) brings pull requests, issues, and other GitHub concepts to the terminal. It allows you to script and automate your GitHub workflow.",
      type: "text"
    },
    {
      text: "[!IMPORTANT]\nWithin this workspace, you must ALWAYS prefix your `gh` commands with `rtk` (e.g., `rtk gh pr list`) to compress tabular data into inline ASCII and optimize the token budget.",
      type: "quote"
    },
    {
      level: 2,
      text: "Table of Contents",
      type: "header"
    },
    {
      items: [
        {
          text: "[Pull Requests](#pull-requests)\n- [Create a Pull Request](#create-a-pull-request)\n- [List Pull Requests](#list-pull-requests)\n- [View Pull Request Details](#view-pull-request-details)"
        },
        {
          text: "[GitHub Actions (CI/CD)](#github-actions-cicd)\n- [View CI Run Logs](#view-ci-run-logs)\n- [List Recent Workflow Runs](#list-recent-workflow-runs)"
        },
        {
          text: "[Issues](#issues)\n- [Create an Issue](#create-an-issue)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Pull Requests",
      type: "header"
    },
    {
      level: 3,
      text: "Create a Pull Request",
      type: "header"
    },
    {
      text: "Creates a pull request on the current branch. Be sure to wrap multi-line arguments in quotes.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk gh pr create --title "feat: add user authentication" --body "Implements JWT-based user authentication. Closes #42."',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "List Pull Requests",
      type: "header"
    },
    {
      text: "Lists open pull requests in the repository. The `rtk` wrapper will compress the output tables.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "rtk gh pr list --limit 10",
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "View Pull Request Details",
      type: "header"
    },
    {
      text: "View the status, description, and checks for a specific PR.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "rtk gh pr view 123",
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "GitHub Actions (CI/CD)",
      type: "header"
    },
    {
      level: 3,
      text: "View CI Run Logs",
      type: "header"
    },
    {
      text: "View the logs of a specific GitHub Actions workflow run.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "rtk gh run view <run-id> --log",
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "List Recent Workflow Runs",
      type: "header"
    },
    {
      text: "List recent workflow executions.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "rtk gh run list --limit 5",
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Issues",
      type: "header"
    },
    {
      level: 3,
      text: "Create an Issue",
      type: "header"
    },
    {
      text: "Create a new GitHub issue.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk gh issue create --title "Bug: Login form crashes on submit" --body "When submitting the form with an empty password, the app crashes."\n``\n\n## CLI Help Reference\n\n\n\n\n```text\nWork seamlessly with GitHub from the command line.\n\nUSAGE\n  gh <command> <subcommand> [flags]\n\nCORE COMMANDS\n  auth:          Authenticate gh and git with GitHub\n  browse:        Open repositories, issues, pull requests, and more in the browser\n  codespace:     Connect to and manage codespaces\n  discussion:    Work with GitHub Discussions (preview)\n  gist:          Manage gists\n  issue:         Manage issues\n  org:           Manage organizations\n  pr:            Manage pull requests\n  project:       Work with GitHub Projects.\n  release:       Manage releases\n  repo:          Manage repositories\n  skill:         Install and manage agent skills (preview)\n\nGITHUB ACTIONS COMMANDS\n  cache:         Manage GitHub Actions caches\n  run:           View details about workflow runs\n  workflow:      View details about GitHub Actions workflows\n\nALIAS COMMANDS\n  co:            Alias for "pr checkout"\n\nADDITIONAL COMMANDS\n  agent-task:    Work with agent tasks (preview)\n  alias:         Create command shortcuts\n  api:           Make an authenticated GitHub API request\n  attestation:   Work with artifact attestations\n  completion:    Generate shell completion scripts\n  config:        Manage configuration for gh\n  copilot:       Run the GitHub Copilot CLI (preview)\n  extension:     Manage gh extensions\n  gpg-key:       Manage GPG keys\n  label:         Manage labels\n  licenses:      View third-party license information\n  preview:       Execute previews for gh features\n  ruleset:       View info about repo rulesets\n  search:        Search for repositories, issues, and pull requests\n  secret:        Manage GitHub secrets\n  ssh-key:       Manage SSH keys\n  status:        Print information about relevant issues, pull requests, and notifications across repositories\n  variable:      Manage GitHub Actions variables\n\nHELP TOPICS\n  accessibility: Learn about GitHub CLI\'s accessibility experiences\n  actions:       Learn about working with GitHub Actions\n  environment:   Environment variables that can be used with gh\n  exit-codes:    Exit codes used by gh\n  formatting:    Formatting options for JSON data exported from gh\n  mintty:        Information about using gh with MinTTY\n  reference:     A comprehensive reference of all gh commands\n  telemetry:     Information about telemetry in gh\n\nFLAGS\n  --help      Show help for command\n  --version   Show gh version\n\nEXAMPLES\n  $ gh issue create\n  $ gh repo clone cli/cli\n  $ gh pr checkout 321\n\nLEARN MORE\n  Use `gh <command> <subcommand> --help` for more information about a command.\n  Read the manual at https://cli.github.com/manual\n  Learn about exit codes using `gh help exit-codes`\n  Learn about accessibility experiences using `gh help accessibility`\n\n',
      language: "bash",
      type: "codeBlock"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use the GitHub CLI (gh) to manage pull requests, issues, and view CI/CD workflows, emphasizing token optimization.",
  name: "github-cli"
});
