# Model-Based Testing: TLA+ as Test Fixture Generator

## Seed Prompt

Build a model-based testing (MBT) system that uses TLA+ specs and the TLC model checker
to automatically generate test fixtures for the vibe-cli pipeline. Instead of manually writing
test scenarios, TLC discovers paths through the state space — including edge cases humans
wouldn't think to write — and those paths become conformity tests that verify the PowerShell
implementation matches the formal specification.

## Problem

The vibe-cli pipeline has two TLA+ specs (PipelineReviewers, CodeSimplify) that formally
verify safety and liveness properties. These specs model 22 state variables and 60+ actions
across 14 pipeline phases. Currently the specs only prove "no violations exist" — they don't
generate test cases. Meanwhile, hand-written test fixtures in tests/traces/fixtures/ cover
only a handful of scenarios. The TLA+ specs explore 113,144 states and 44,495 distinct states,
but none of that rich exploration feeds back into the test suite.

## Approach: The "False Invariant" Trick

TLC generates traces when a property is violated. To get traces for specific goal states
(not bugs), you define an invariant that is intentionally false when the desired state is
reached. TLC then produces the shortest path to that state as an "error trace."

Example: to get a trace showing crash recovery across tiers:

```tla
\* Intentionally violated when we reach a successful resume-to-completion path
GoalCrashRecovery == ~(
    /\ crashed = TRUE
    /\ phase = "Complete"
    /\ pipelineOutcome = "complete"
    /\ lastCompletedTier >= 1
)
```

TLC finds the shortest path from Init to this state and prints every intermediate state.
That trace becomes a test fixture.

## What Exists Today

### TLA+ Specs
- `docs/code-simplify/tla/CodeSimplify.tla` — 22 variables, 60+ actions, 14 phases
  - Models: lock acquire, input validation, fixture coverage, worktree dispatch,
    per-worktree double-pass/review, sequential merge, merge conflict recovery,
    worktree cleanup, global double-pass/review, crash/resume, escalation
  - Constants: MaxTiers, MaxTasksPerTier, MaxDoublePassRetries, MaxReviewRounds, NumReviewers
  - Invariants: TypeOK, LockReleasedOnTermination, LockHeldDuringExecution,
    DoublePassRetriesInBounds, ReviewRoundsInBounds, OutcomeConsistency, ConsecutivePassBound
  - Liveness: EventualTermination, GlobalReviewLeadsToEnd, EscalationEventuallyResolved,
    LockEventuallyReleased
  - Properties: NoReReviewAfterConflict

### Trace Infrastructure (Already Built)
- `tests/traces/trace-replay.ps1` — Replays TLA+ trace JSON against PowerShell state machine.
  Loads trace, initializes state, dispatches each action, compares state at every step.
  Supports per-trace constants override via environment variables.
- `tests/traces/action-dispatcher.ps1` — Maps TLA+ action names to PowerShell function calls.
  Currently covers PipelineReviewers actions (AcquireLock, HandlePassPreMerge, ReviewKeepGoing,
  etc.). Needs CodeSimplify actions added.
- `tests/traces/state-mapper.ps1` — Maps TLA+ state snapshots to PowerShell state hashtables.
  ConvertFrom-TlaReviewerState + Compare-PipelineState with field-level diffing.
  Needs a ConvertFrom-TlaCodeSimplifyState equivalent.
- `tests/traces/capture-traces.ps1` — Runs TLC in `-simulate` mode, parses State blocks
  and variable assignments from stdout. Currently targets PipelineReviewers spec only.
- `tests/traces/generate-fixtures.ps1` �� Generates trace fixtures from PowerShell state
  machine models (seeded random walks + targeted scenarios). Currently generates for
  CodingStage and PipelineReviewers models.

### Existing Fixture Format
```json
{
  "traceId": "tlc-single-happy-001",
  "spec": "CodingStage",
  "description": "Single TDD task: validate -> RED -> GREEN -> cleanup(x2) -> final verify -> completed",
  "steps": [
    {
      "stepNum": 0,
      "action": "Init",
      "state": {
        "currentTier": 0,
        "pipelineStatus": "running",
        "validationStatus": "pending",
        "escalationActive": false
      }
    },
    {
      "stepNum": 1,
      "action": "ValidationPasses",
      "state": { "validationStatus": "valid", ... }
    }
  ]
}
```

### TLC Runner
- `utils/tlc-runner.ps1` — Invoke-TlcProcess (runs TLC with configurable args),
  Invoke-TlcCheck (model checking with retry), Invoke-TlcSimulation (simulation mode).
  ExtraArgs parameter allows passing `-coverage`, `-simulate`, or custom invariant flags.

## Implementation Plan

### Phase 1: Goal-State Invariants in CodeSimplify.tla

Add a new section at the bottom of CodeSimplify.tla with "goal state" invariants that
TLC will violate to produce traces. Each goal represents a scenario we want a test for:

```tla
(***************************************************************************)
(* Goal-state invariants for model-based test generation.                  *)
(* These are INTENTIONALLY violated so TLC produces traces.               *)
(* Use: java -jar tla2tools.jar -config GoalStates.cfg CodeSimplify.tla   *)
(***************************************************************************)

\* Happy path: single tier completes without any failures
GoalHappyPath == ~(
    /\ phase = "Complete"
    /\ pipelineOutcome = "complete"
    /\ lastCompletedTier = MaxTiers
    /\ crashed = FALSE
    /\ escalationActive = FALSE
)

\* Crash during active processing, then successful resume to completion
GoalCrashResume == ~(
    /\ crashed = TRUE
    /\ phase = "Complete"
    /\ pipelineOutcome = "complete"
)

\* Escalation where user chooses Stop -> pipeline halts
GoalEscalationHalt == ~(
    /\ userChoice = "stop"
    /\ pipelineOutcome = "halted"
    /\ phase = "Halted"
    /\ lockHeld = FALSE
)

\* Escalation where user chooses KeepGoing -> pipeline eventually completes
GoalEscalationKeepGoing == ~(
    /\ userChoice = "keepGoing"
    /\ phase = "Complete"
    /\ pipelineOutcome = "complete"
)

\* Merge conflict -> merge-conflict double-pass -> recovery -> completion
GoalMergeConflictRecovery == ~(
    /\ mergeDoublePassRetries >= 1
    /\ phase = "Complete"
    /\ pipelineOutcome = "complete"
)

\* Per-worktree review failure -> fix -> pass -> merge
GoalReviewFailRecovery == ~(
    /\ wtReviewVerdict = "pass"
    /\ wtReviewRounds >= 2
    /\ phase \in {"SequentialMerge", "WorktreeCleanup", "GlobalDoublePass", "Complete"}
)

\* Global review failure -> fix -> eventual completion
GoalGlobalReviewRecovery == ~(
    /\ glReviewRounds >= 2
    /\ phase = "Complete"
    /\ pipelineOutcome = "complete"
)

\* Double-pass retry exhaustion -> escalation
GoalDoublePassExhaustion == ~(
    /\ wtDoublePassRetries = MaxDoublePassRetries
    /\ escalationActive = TRUE
)

\* Multi-tier: tier 1 completes, tier 2 begins
GoalMultiTier == ~(
    /\ lastCompletedTier >= 1
    /\ currentTier > lastCompletedTier
    /\ phase \in {"ClaudeDispatch", "PerWT_DoublePass"}
)

\* Resume to global review (crashed after per-worktree, resumes at global)
GoalResumeToGlobal == ~(
    /\ crashed = TRUE
    /\ lastCompletedTier >= 1
    /\ phase = "GlobalDoublePass"
)
```

Create a separate `GoalStates.cfg` that includes one goal invariant at a time
(TLC stops at the first violation, so run separately per goal):

```
SPECIFICATION Spec
CONSTANTS
    MaxTiers = 2
    MaxTasksPerTier = 2
    MaxDoublePassRetries = 2
    MaxReviewRounds = 2
    NumReviewers = 3
INVARIANT GoalHappyPath
```

### Phase 2: TLA+ ALIAS for Clean Trace Output

Add an ALIAS to the cfg files so TLC prints states in a structure that maps cleanly
to the PowerShell implementation. This avoids needing complex post-processing:

```tla
TraceAlias == [
    phase            |-> phase,
    lockHeld         |-> lockHeld,
    currentTier      |-> currentTier,
    currentTask      |-> currentTask,
    hasWorktrees     |-> hasWorktrees,
    pipelineOutcome  |-> pipelineOutcome,
    crashed          |-> crashed,
    lastCompletedTier |-> lastCompletedTier,
    escalationActive |-> escalationActive,
    userChoice       |-> userChoice,
    wt |-> [
        doublePassRetries |-> wtDoublePassRetries,
        consecPasses      |-> wtConsecPasses,
        reviewRounds      |-> wtReviewRounds,
        reviewVerdict     |-> wtReviewVerdict
    ],
    merge |-> [
        doublePassRetries |-> mergeDoublePassRetries,
        consecPasses      |-> mergeConsecPasses
    ],
    gl |-> [
        doublePassRetries |-> glDoublePassRetries,
        consecPasses      |-> glConsecPasses,
        reviewRounds      |-> glReviewRounds,
        reviewVerdict     |-> glReviewVerdict
    ]
]
```

In the cfg: `ALIAS TraceAlias`

### Phase 3: Trace Generation Script

Create `tests/traces/generate-goal-traces.ps1` that:

1. Reads all `Goal*` invariant names from CodeSimplify.tla (regex parse)
2. For each goal, creates a temporary cfg with that single invariant
3. Runs TLC via Invoke-TlcProcess — TLC will "fail" with a trace
4. Parses the trace output (reusing capture-traces.ps1 logic)
5. Writes each trace to `tests/traces/fixtures/code-simplify/goal-<name>.json`
6. Logs which goals were unreachable (TLC found no violation = goal impossible)

This script is idempotent and can be re-run whenever the spec changes.

### Phase 4: CodeSimplify Action Dispatcher

Extend `tests/traces/action-dispatcher.ps1` with a second dispatcher function
for CodeSimplify actions. Map each TLA+ action to the corresponding PowerShell
pipeline function call:

| TLA+ Action | PowerShell Function |
|---|---|
| PreCodingGatePass | Test-FixturePrecondition (returns canProceed=true) |
| LockAcquire | New-PipelineLock |
| InputValidationPass | Invoke-InputValidation (success path) |
| InputValidationFail | Invoke-InputValidation (failure path) |
| ClaudeDispatchWithWorktrees | Start-WorktreeDispatch |
| PerWT_DoublePassSucceed | Invoke-DoublePassCheck (pass) |
| PerWT_DoublePassFail | Invoke-DoublePassCheck (fail) |
| PerWT_ReviewPass | Resolve-ReviewVerdict (pass) |
| PerWT_ReviewFail | Resolve-ReviewVerdict (fail) |
| SequentialMerge | Invoke-SequentialMerge (success) |
| MergeConflict | Invoke-SequentialMerge (conflict) |
| WorktreeCleanup | Remove-Worktrees |
| GlobalDoublePass* | Invoke-GlobalDoublePass |
| GlobalReview* | Resolve-GlobalReview |
| Crash | throw + catch in finally block |
| Resume | Resume-Pipeline |
| EscalationKeepGoing | Read-Escalation -> KeepGoing |
| EscalationStop | Read-Escalation -> Stop |

Note: the exact function names need to be verified against the actual implementation
at the time of building this feature. The implementation may have changed since the
spec was written. The dispatcher should call the real functions, not simulate them.

### Phase 5: CodeSimplify State Mapper

Create `ConvertFrom-TlaCodeSimplifyState` in state-mapper.ps1 that maps the 22
TLA+ variables to the PowerShell pipeline state hashtable. Use the ALIAS-structured
output to simplify mapping (nested `wt`, `merge`, `gl` objects map to prefixed fields).

### Phase 6: Conformity Test Suite

Create `tests/trace-conformity.Tests.ps1` that:

1. Discovers all fixture files in `tests/traces/fixtures/code-simplify/`
2. For each fixture, calls Invoke-TraceReplay with the appropriate spec type
3. Asserts zero mismatches at every step
4. Reports which action/step failed if there's a divergence

This becomes a regression gate: if someone changes the pipeline logic, the conformity
tests catch any deviation from the formally verified behavior.

### Phase 7: CI Integration

Add trace regeneration to the pipeline:
- After TLA+ debate (stage 5), run generate-goal-traces.ps1
- Generated traces are committed to the repo as fixtures
- Before coding (stage 8), the conformity tests run as a precondition
- If any trace has mismatches, the coding stage cannot proceed

## Key Design Decisions

### Why goal-state invariants, not simulation?
Simulation (`-simulate`) generates random walks — useful for fuzzing but not reproducible
and doesn't target specific scenarios. Goal-state invariants produce the SHORTEST path to
a specific scenario, giving minimal, targeted test cases. They're also deterministic given
the same spec.

### Why one goal per TLC run?
TLC stops at the first invariant violation. If you put all goals in one cfg, you'd only
get a trace for whichever goal state TLC encounters first (breadth-first). Running each
goal separately ensures every scenario gets a trace.

### Why ALIAS?
Without ALIAS, TLC prints all 22 variables as flat `/\ var = value` lines. ALIAS lets
you restructure the output to match your implementation's data model, reducing the mapping
code needed in state-mapper.ps1.

### Why static fixtures, not runtime generation?
Traces are deterministic for a given spec — regenerating them in CI wastes time. Commit
the fixtures and only regenerate when the spec changes. This also makes test failures
easier to debug since you can inspect the fixture file directly.

## Edge Cases to Consider

- **Unreachable goals**: Some goal states may be impossible (TLC completes without violating
  the invariant). The generation script should log these clearly — they indicate either a
  spec bug or a scenario that genuinely can't happen.
- **State space explosion**: With large constants (MaxTiers=5, NumReviewers=8), TLC may not
  finish. Keep model-checking constants small (same as CodeSimplify.cfg: MaxTiers=2, etc.)
  and note that traces are valid for any constant values since the logic is parametric.
- **Action name extraction**: TLC prints `State N: <ActionName line L, col C ...>`. The
  action name needs to be extracted from between `<` and the first space. The existing
  capture-traces.ps1 already does this: `if ($action -match '<(\w+)') { $Matches[1] }`.
- **Spec evolution**: When the TLA+ spec changes (new actions, renamed variables), the
  action dispatcher and state mapper must be updated. Consider a contract test that verifies
  every TLA+ action name has a corresponding dispatcher entry.

## Success Criteria

1. `generate-goal-traces.ps1` produces at least 8 distinct trace fixtures from CodeSimplify goals
2. Each fixture is valid JSON with the existing `{ traceId, spec, steps: [{ stepNum, action, state }] }` format
3. `trace-conformity.Tests.ps1` replays every fixture against the PowerShell implementation with zero mismatches
4. At least one trace exercises crash-resume (Crash -> Resume -> Complete)
5. At least one trace exercises escalation (user chooses Stop or KeepGoing)
6. At least one trace exercises merge conflict recovery
7. The generation script completes in under 60 seconds (small constants)
8. Generated traces are committed and run as part of the regular Pester test suite
