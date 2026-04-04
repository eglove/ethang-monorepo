# Source -- Ports & Adapters

| Path | Kind | Summary | Updated |
|------|------|---------|---------|
| src/ports/claude-adapter.ts | port | `ClaudeAdapter` interface; abstracts Claude API calls (send prompt, stream, parse result) | 2026-04-03 |
| src/ports/git-adapter.ts | port | `GitAdapter` interface; abstracts git operations (commit, branch, diff, checkpoint) | 2026-04-03 |
| src/adapters/claude-sdk.ts | adapter | Production `ClaudeSdkAdapter`; implements `ClaudeAdapter` via `@anthropic-ai/sdk` | 2026-04-03 |
| src/adapters/git-child-process.ts | adapter | Production `ChildProcessGitAdapter`; implements `GitAdapter` via child_process exec | 2026-04-03 |
