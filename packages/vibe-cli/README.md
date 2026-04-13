# vibe-cli

A 7-stage design pipeline that takes a seed idea through requirements elicitation, formal verification, and expert debate — all orchestrated by Claude Code agents.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) authenticated (OAuth or API key)
- PowerShell 7+
- Java (for TLC model checker in stage 4)
- TLA+ toolbox jar at `C:\Users\glove\projects\tla-toolbox\tla2tools.jar`

## Usage

### Fresh run

```powershell
./vibe.ps1 "your idea or feature description"
```

This starts at stage 1 (elicitor interview) and runs through all 7 stages.

### Resume from a stage

If the pipeline fails or you want to re-run from a specific stage, use `-Stage` and `-Feature`:

```powershell
./vibe.ps1 -Stage 3 -Feature lint-fixer
```

`-Feature` is the directory name under `docs/` (created by the elicitor in stage 1). The pipeline reconstructs all state from the files prior stages produced.

```powershell
# Re-run BDD debate after editing bdd.feature
./vibe.ps1 -Stage 3 -Feature my-feature

# Re-run TLA+ writing after editing scenarios
./vibe.ps1 -Stage 4 -Feature my-feature
```

## Stages

| # | Stage | Mode | Artifact |
|---|-------|------|----------|
| 1 | Elicitor | Interactive | `docs/<feature>/elicitor.md` |
| 2 | BDD Writer | Print | `docs/<feature>/bdd.feature` |
| 3 | BDD Debate | Print | revises `bdd.feature` |
| 4 | TLA+ Writer | Print | `docs/<feature>/tla/<Name>.tla`, `.cfg` |
| 5 | TLA+ Debate | Print | revises TLA+ spec |
| 6 | Implementation Writer | Print | `docs/<feature>/implementation-plan.md`, `.json` |
| 7 | Implementation Debate | Print | revises implementation plan |

### Stage details

**Stage 1 — Elicitor**: Opens an interactive Claude session in a new terminal window. The agent interviews you one question at a time until all design dimensions are resolved, then saves a structured briefing.

**Stages 2/4/6 — Writers**: Non-interactive agents that produce artifacts from the prior stage's output. Stage 4 additionally runs TLC model checking and loops until the spec passes.

**Stages 3/5/7 — Debates**: A debate moderator assembles expert panels to review the artifact against the elicitor briefing. On consensus, objections are applied as a final revision by the writer. On partial consensus, the writer revises and the debate continues.

## Directory structure

```
vibe-cli/
  vibe.ps1              # Entry point
  agents/
    doc-writers/         # Elicitor, BDD, TLA+, implementation writer prompts
    code-writers/        # TypeScript writer prompts
    test-writers/        # Test writer prompts
    reviewers/           # Reviewer prompts (run in parallel)
    debate-moderator.md  # Debate panel moderator prompt
  stages/                # Stage scripts (1-7)
  utils/
    config.ps1           # Pipeline configuration
    invoke-claude.ps1    # Claude CLI wrapper (handles auth, MCP, streaming)
    debate-loop.ps1      # Debate → revise cycle
    tdd-loop.ps1         # RED/GREEN TDD cycle
    task-runner.ps1      # TDD + cleanup + review per task
    cleanup-loop.ps1     # lint/test/tsc verification
    review-runner.ps1    # Parallel reviewer dispatch
  docs/                  # Feature artifacts (created by pipeline)
```
