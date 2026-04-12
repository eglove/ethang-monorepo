When a vibe-cli session starts we should check if we are on master with unstaged
commits, if not, immediatly halt the pipeline.

Otherwise, create a feature branch using git switch -c

When all changes are merged and approved from git worktrees, add all files,
squash the branch commits with a conventional commit, push,
and create a pr using the gh cli.

Conventional commits specification:
https://www.conventionalcommits.org/en/v1.0.0/#specification
