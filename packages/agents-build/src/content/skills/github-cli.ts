import { defineSkill } from "../../define.ts";

export const githubCli = defineSkill({
  content: `# GitHub CLI (gh) Skill Guide

The GitHub CLI (\`gh\`) brings pull requests, issues, and other GitHub concepts to the terminal. It allows you to script and automate your GitHub workflow.

> [!IMPORTANT]
> Within this workspace, you must ALWAYS prefix your \`gh\` commands with \`rtk\` (e.g., \`rtk gh pr list\`) to compress tabular data into inline ASCII and optimize the token budget.

## Table of Contents

- [Pull Requests](#pull-requests)
  - [Create a Pull Request](#create-a-pull-request)
  - [List Pull Requests](#list-pull-requests)
  - [View Pull Request Details](#view-pull-request-details)
- [GitHub Actions (CI/CD)](#github-actions-cicd)
  - [View CI Run Logs](#view-ci-run-logs)
  - [List Recent Workflow Runs](#list-recent-workflow-runs)
- [Issues](#issues)
  - [Create an Issue](#create-an-issue)

## Pull Requests

### Create a Pull Request
Creates a pull request on the current branch. Be sure to wrap multi-line arguments in quotes.
**Example Usage:**
\`\`\`bash
rtk gh pr create --title "feat: add user authentication" --body "Implements JWT-based user authentication. Closes #42."
\`\`\`

### List Pull Requests
Lists open pull requests in the repository. The \`rtk\` wrapper will compress the output tables.
**Example Usage:**
\`\`\`bash
rtk gh pr list --limit 10
\`\`\`

### View Pull Request Details
View the status, description, and checks for a specific PR.
**Example Usage:**
\`\`\`bash
rtk gh pr view 123
\`\`\`

## GitHub Actions (CI/CD)

### View CI Run Logs
View the logs of a specific GitHub Actions workflow run.
**Example Usage:**
\`\`\`bash
rtk gh run view <run-id> --log
\`\`\`

### List Recent Workflow Runs
List recent workflow executions.
**Example Usage:**
\`\`\`bash
rtk gh run list --limit 5
\`\`\`

## Issues

### Create an Issue
Create a new GitHub issue.
**Example Usage:**
\`\`\`bash
rtk gh issue create --title "Bug: Login form crashes on submit" --body "When submitting the form with an empty password, the app crashes."
\`\`

## CLI Help Reference




\`\`\`text
Work seamlessly with GitHub from the command line.

USAGE
  gh <command> <subcommand> [flags]

CORE COMMANDS
  auth:          Authenticate gh and git with GitHub
  browse:        Open repositories, issues, pull requests, and more in the browser
  codespace:     Connect to and manage codespaces
  discussion:    Work with GitHub Discussions (preview)
  gist:          Manage gists
  issue:         Manage issues
  org:           Manage organizations
  pr:            Manage pull requests
  project:       Work with GitHub Projects.
  release:       Manage releases
  repo:          Manage repositories
  skill:         Install and manage agent skills (preview)

GITHUB ACTIONS COMMANDS
  cache:         Manage GitHub Actions caches
  run:           View details about workflow runs
  workflow:      View details about GitHub Actions workflows

ALIAS COMMANDS
  co:            Alias for "pr checkout"

ADDITIONAL COMMANDS
  agent-task:    Work with agent tasks (preview)
  alias:         Create command shortcuts
  api:           Make an authenticated GitHub API request
  attestation:   Work with artifact attestations
  completion:    Generate shell completion scripts
  config:        Manage configuration for gh
  copilot:       Run the GitHub Copilot CLI (preview)
  extension:     Manage gh extensions
  gpg-key:       Manage GPG keys
  label:         Manage labels
  licenses:      View third-party license information
  preview:       Execute previews for gh features
  ruleset:       View info about repo rulesets
  search:        Search for repositories, issues, and pull requests
  secret:        Manage GitHub secrets
  ssh-key:       Manage SSH keys
  status:        Print information about relevant issues, pull requests, and notifications across repositories
  variable:      Manage GitHub Actions variables

HELP TOPICS
  accessibility: Learn about GitHub CLI's accessibility experiences
  actions:       Learn about working with GitHub Actions
  environment:   Environment variables that can be used with gh
  exit-codes:    Exit codes used by gh
  formatting:    Formatting options for JSON data exported from gh
  mintty:        Information about using gh with MinTTY
  reference:     A comprehensive reference of all gh commands
  telemetry:     Information about telemetry in gh

FLAGS
  --help      Show help for command
  --version   Show gh version

EXAMPLES
  $ gh issue create
  $ gh repo clone cli/cli
  $ gh pr checkout 321

LEARN MORE
  Use \`gh <command> <subcommand> --help\` for more information about a command.
  Read the manual at https://cli.github.com/manual
  Learn about exit codes using \`gh help exit-codes\`
  Learn about accessibility experiences using \`gh help accessibility\`


\`\`\`

`,
  description: "Explains how to use the GitHub CLI (gh) to manage pull requests, issues, and view CI/CD workflows, emphasizing token optimization.",
  name: "github-cli"
});
