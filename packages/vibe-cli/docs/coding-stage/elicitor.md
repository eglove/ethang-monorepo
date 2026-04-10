# Elicitor Session — Coding Stage (Stage 8)

**Date:** 2026-04-09
**Status:** COMPLETE
**Feature:** coding-stage

---

## Purpose
Add an autonomous coding stage to the vibe-cli pipeline that takes the implementation plan and tickets from Stage 6/7 and produces working, tested code via TDD. This is the transition from design artifacts to executable software.

## Artifact / Output Type
- PowerShell stage script (`stages/8-coding.ps1`)
- Supporting utilities: `Write-TaskLog`, `Read-Escalation`, cleanup loop, TDD orchestrator
- 5 code writer agents: hono-writer, powershell-writer, typescript-writer, agent-writer, ui-writer
- 3 test writer agents: pester-writer, playwright-writer, vitest-writer
- 1 merge-resolver agent
- Modifications to Stage 6 (implementation writer) and Stage 7 (implementation debate)

## Trigger
Stage 8 is invoked after Stage 7 (implementation debate) completes with consensus. Input is the `implementation-plan.json` manifest and the tickets directory.

## Inputs
- `docs/<feature>/implementation-plan.json` — lightweight index with tiers, task metadata, writer assignments, ticket paths, projectRoot
- `docs/<feature>/tickets/T<N>-<slug>.md` — detailed per-task tickets with acceptance criteria
- TLA+ spec (`docs/<feature>/tla/*.tla`) — relevant actions/invariants extracted per task
- BDD scenarios (`docs/<feature>/bdd.feature`) — relevant scenarios per task
- Writer agent markdown files from `agents/code-writers/` and `agents/test-writers/`

## Outputs
- Working code committed to the feature branch
- Per-task log files: `docs/<feature>/tickets/T<N>-log.txt` (plain text, timestamped)
- Pipeline log entries in `pipeline.log`

## Ecosystem Placement
Stage 8 in the vibe-cli pipeline. Follows Stage 7 (implementation debate). Terminal stage — no downstream stage.

## Handoff
No downstream handoff. Stage 8 produces the final working code on the feature branch.

---

## Stage 6 Modifications — Implementation Writer

The implementation writer is modified to produce three outputs:

1. **`implementation-plan.md`** — High-level overview only. General architecture, approach summary, and tier structure. No detailed task descriptions.

2. **`implementation-plan.json`** — Lightweight index. Schema:
   ```json
   {
     "feature": "<feature-name>",
     "tiers": [
       {
         "tier": 1,
         "tasks": [
           {
             "step": 1,
             "title": "Task title",
             "codeWriter": "typescript-writer",
             "testWriter": "vitest",
             "ticketFile": "docs/<feature>/tickets/T1-slug.md",
             "projectRoot": "packages/<package-name>",
             "dependencies": []
           }
         ]
       }
     ]
   }
   ```
   - `testWriter` is `null` for agent-writer tasks (no TDD cycle)
   - Writer pairs assigned by implementation writer based on best fit
   - `projectRoot` determines where verify commands run

3. **`docs/<feature>/tickets/T<N>-<slug>.md`** — Detailed per-task tickets:
   ```markdown
   # T<N> — <Task Title>

   **Tier:** <execution tier>
   **Code Writer:** <agent name>
   **Test Writer:** <agent name>
   **Project Root:** <packages/package-name>
   **Dependencies:** T1, T3, ...

   ## Files
   - path/to/file.ts (create | modify)

   ## Description
   <detailed what-to-build>

   ## Acceptance Criteria
   - [ ] <specific, testable criterion mapped to TLA+ states/transitions>

   ## Test Description
   <what tests to write, mapped to BDD scenarios>

   ## TLA+ Coverage
   - States: <which states this task covers>
   - Transitions: <which transitions>
   - Invariants: <which invariants>
   ```

## Stage 7 Modifications — Implementation Debate

- Debate reviews tickets alongside the plan for completeness and TLA+ coverage
- Ensures the main plan stays high-level — detail must live in tickets
- Verifies all TLA+ states/transitions/invariants are covered across the full ticket set

---

## Stage 8 — Coding

### Orchestration Flow

1. Read `implementation-plan.json`
2. Process tiers sequentially (tier 1, then tier 2, etc.)
3. Within a tier:
   - **Single task:** work directly on the feature branch
   - **Multiple tasks:** create one git worktree per task, run in parallel
4. Per task: run TDD cycle (unless agent-writer, which is a single call with no tests)
5. After all tasks in a tier complete: serialized merge queue (worktree tasks merge back to feature branch one at a time)
6. After all tiers complete: final verification pass

### TDD Cycle (per task)

Both test writer and code writer receive the same context: ticket + relevant TLA+ actions/invariants + relevant BDD scenarios. They communicate through files on disk. PowerShell orchestrates all verification.

**RED Phase:**
1. Send prompt to test writer via `Invoke-Claude` (print mode) with ticket context
2. Test writer writes test files to disk, returns JSON: `{ filesModified: [{ path, action }], summary }`
3. Orchestrator runs verify command in `projectRoot` directory
4. Confirm tests FAIL (red state achieved)
5. If tests PASS: send test writer a new prompt with passing output to review
   - Test writer returns verdict: `"revised"` (rewrote tests, retry RED) or `"already_implemented"` (skip to cleanup)
   - Max 3 RED retries (`MaxRedRetries`). Escalate on exhaustion.

**GREEN Phase:**
1. Send prompt to code writer via `Invoke-Claude` (print mode) with ticket context + test files + RED failure output
2. Code writer writes implementation to disk, returns JSON: `{ filesModified: [{ path, action }], summary }`
3. Orchestrator runs verify command
4. If tests PASS: proceed to cleanup
5. If tests FAIL: send code writer new prompt with failure output, retry
6. Max `MaxTddCycles` (100) retries. Escalate on exhaustion.

**Cleanup Phase:**
1. Run `test → lint → tsc` in sequence (using appropriate verify commands for the task's test writer)
2. If all three pass, increment consecutive clean counter
3. If any fail: trigger mini TDD cycle (test writer reviews failure, decides if test or code is wrong, fixes; code writer makes tests pass), reset clean counter to 0
4. Require `CleanupPasses` (2) consecutive clean loops
5. Max `MaxFixRounds` (100) mini TDD cycles. Escalate on exhaustion.

### Verify Commands (per test writer)

| Test Writer | Verify Command |
|---|---|
| vitest | `pnpm test` |
| pester | `Invoke-Pester -Configuration (Import-PowerShellDataFile ./tests/pester.config.ps1)` |
| playwright | `pnpm exec playwright test` |

All commands run in the task's `projectRoot` directory. For worktree tasks, `Invoke-Claude` receives `-WorkDir $worktreePath` which translates to `--cwd` on the CLI.

### Agent-Writer Exception

Tasks with `testWriter: null` (agent-writer tasks) skip the TDD cycle entirely. The orchestrator calls the agent-writer once, it writes `.md` files to disk, returns the JSON schema response, and the orchestrator moves on.

### Worktree Management

- Worktrees created only for tiers with 2+ tasks
- Tracked in a `$Worktrees` hashtable keyed by task number
- All `Invoke-Claude` calls and verify commands use the worktree path
- Worktrees cleaned up after successful merge

### Merge Queue

After all tasks in a tier complete, worktree branches merge back to the feature branch one at a time (serialized). If a merge conflict occurs:

1. Dedicated `merge-resolver` agent attempts resolution
2. Receives: both tickets, conflict diff, affected files
3. After resolution, runs verify commands for both tasks
4. Max 3 attempts (`MaxMergeRetries`)
5. Escalate on exhaustion

### Final Verification

After all tiers complete and merge:
1. Run cleanup loop against the full codebase
2. Require 2 consecutive clean loops (`CleanupPasses`)
3. Includes all verify commands relevant to the tasks that were executed (pnpm test, pnpm lint, pnpm tsc, and Invoke-Pester if any Pester tasks ran)
4. Failures trigger mini TDD cycles with the appropriate writer

### Escalation — `Read-Escalation`

A single reusable function for all failure points:
- Logs full context (ticket, failure output, retry count)
- Presents interactive prompt: **Keep Going** (restarts the failed process counter) | **Stop** (halts pipeline)
- Keep Going restarts only the failed task's cycle; other completed tasks in the tier stay done
- Used for: TDD exhaustion, RED retries exhaustion, merge conflict exhaustion, cleanup exhaustion

### Logging — `Write-TaskLog`

Dual-write function:
- `pipeline.log`: one-liner with task prefix, e.g., `[T3] RED passed - 2 test files written`
- `docs/<feature>/tickets/T<N>-log.txt`: full detail — test output, file lists, Claude response summaries
- Plain text, timestamped, terminal-friendly
- Used liberally throughout Stage 8

### Invoke-Claude Modification

- New optional `-WorkDir` parameter
- Translates to `--cwd $WorkDir` on the Claude CLI call
- Omitted for single-task tiers (defaults to current directory)

---

## New Config Values

```powershell
$Config = @{
    # ... existing values ...
    MaxMergeRetries = 3    # Merge-resolver attempts before escalation
    MaxRedRetries   = 3    # RED phase retries when tests pass immediately
}
```

## New Agent Files

### Code Writers (`agents/code-writers/`)
| Agent | Domain |
|---|---|
| `hono-writer.md` | Hono backend — routes, middleware, handlers |
| `powershell-writer.md` | PowerShell scripts and utilities |
| `typescript-writer.md` | General TypeScript libraries, utilities, types |
| `agent-writer.md` | Claude Code agent markdown files (no TDD) |
| `ui-writer.md` | HTML/CSS/JS, TypeScript, JSX/TSX, Tailwind — framework-agnostic |

### Test Writers (`agents/test-writers/`)
| Agent | Domain | Verify Command |
|---|---|---|
| `vitest-writer.md` | Vitest unit/integration tests | `pnpm test` |
| `pester-writer.md` | Pester PowerShell tests | `Invoke-Pester ...` |
| `playwright-writer.md` | Playwright E2E tests | `pnpm exec playwright test` |

### Merge Resolver (`agents/code-writers/`)
| Agent | Domain |
|---|---|
| `merge-resolver.md` | Git merge conflict resolution between parallel task branches |

## Writer JSON Response Schema

Both code and test writers return structured JSON:
```json
{
  "filesModified": [
    { "path": "src/routes/auth.ts", "action": "create" },
    { "path": "src/routes/index.ts", "action": "modify" }
  ],
  "summary": "Brief description of what was done"
}
```

Test writer RED retry response:
```json
{
  "verdict": "revised | already_implemented",
  "filesModified": [...],
  "summary": "..."
}
```

---

## Error States

| Failure Point | Retries | Escalation |
|---|---|---|
| RED phase tests pass | 3 (`MaxRedRetries`) | `Read-Escalation` |
| GREEN phase tests fail | 100 (`MaxTddCycles`) | `Read-Escalation` |
| Cleanup loop failures | 100 (`MaxFixRounds`) | `Read-Escalation` |
| Merge conflicts | 3 (`MaxMergeRetries`) | `Read-Escalation` |
| Final verification | 100 (`MaxFixRounds`) | `Read-Escalation` |

All escalations halt the pipeline and present Keep Going / Stop interactive prompt.

## Scope

**In scope:**
- Stage 8 orchestrator script
- Stage 6/7 modifications (tickets, lightweight JSON, debate reviews tickets)
- All agent markdown files listed above
- `Write-TaskLog`, `Read-Escalation` utility functions
- `-WorkDir` parameter for `Invoke-Claude`
- New config values

**Out of scope:**
- Changes to Stages 1–5
- Changes to the debate loop or debate moderator
- CI/CD integration
- Remote/cloud execution
- Automatic PR creation after Stage 8

## Edge Cases

- **Single-task tier:** No worktree, work directly on feature branch, no merge step
- **Agent-writer tasks:** No TDD cycle, single call, `testWriter: null`
- **Already-implemented functionality:** RED phase detects passing tests, test writer can verdict `already_implemented` to skip
- **Cross-package tasks:** `projectRoot` determines verify command working directory; Pester config comes from target project
- **Merge conflicts within a tier:** Signals missed dependency in implementation plan; merge-resolver attempts resolution before escalating
- **Cascading lint/test failures:** Cleanup loop requires 2 consecutive clean passes; any fix resets counter to 0

---

## Open Questions
None — all branches resolved.
