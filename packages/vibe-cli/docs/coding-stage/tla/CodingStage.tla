--------------------------- MODULE CodingStage ---------------------------
(*
 * TLA+ Specification for Stage 8 -- Coding Stage Orchestrator
 *
 * Models the full lifecycle: plan validation -> tier-by-tier execution ->
 * TDD cycles (RED/GREEN/Cleanup) -> merge queue -> final verification.
 *
 * Source: docs/coding-stage/bdd.feature (2026-04-09)
 *
 * Revision 2 -- Addresses all debate objections (bdd-debate.md):
 *   CRITICAL: SkipEmptyTier deadlock, ZeroTierComplete invariant,
 *             EscalationStop workspace preservation
 *   HIGH:     MergeExhausted task status, EscalationKeepGoingFinal reset,
 *             post-merge verification, MergeSerial tautology,
 *             plan validation phase, InfrastructureFailure during escalation,
 *             GREEN fencepost fix
 *   RECOMMENDED: cleanup blame fork, response-format failures,
 *             orphaned workspace detection, workspace creation rollback,
 *             final verification writer attribution
 *
 * Revision 3 -- Addresses debate-round-2 objections:
 *   HIGH:     (1) Added WF_vars(MergeConflictResolve) to close merge
 *             conflict liveness gap where retries stall indefinitely.
 *             (2) Reset cleanupCleanPasses in EscalationKeepGoing for
 *             cleanup/cleanup_remed tasks to prevent stale pass counts.
 *   MEDIUM:   (3) Split FinalVerifFail into two-step remediation cycle
 *             (FinalVerifFail -> final_remed -> FinalVerifRemediate)
 *             matching per-task cleanup pattern.
 *             (4) Documented that post-merge verification failures share
 *             MaxMergeRetries budget explicitly in MergeConflictResolve.
 *)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    Tasks,              \* Set of all task IDs (e.g., {1, 2, 3, 4})
    Tiers,              \* Function: task -> tier number
    NumTiers,           \* Total number of tiers
    WriterType,         \* Function: task -> writer type ("tdd" or "agent")
    MaxRedRetries,      \* Max RED retries (default 3)
    MaxTddCycles,       \* Max GREEN failure attempts (default 100)
    MaxFixRounds,       \* Max cleanup remediation cycles (default 100)
    MaxMergeRetries,    \* Max merge conflict resolution attempts (default 3)
    CleanupPasses       \* Consecutive clean passes required (default 2)

VARIABLES
    \* --- Pipeline-level state ---
    currentTier,            \* Current tier being processed (0 = not started, NumTiers+1 = done)
    pipelineStatus,         \* "running" | "halted" | "completed"
    escalationActive,       \* TRUE if Read-Escalation is waiting for user input
    validationStatus,       \* "pending" | "valid" | "failed"
    wsCreationFailed,       \* TRUE if workspace creation failed for pending tier

    \* --- Per-task state ---
    taskPhase,              \* Function: task -> phase enum
    taskStatus,             \* Function: task -> status enum

    \* --- Workspace state ---
    workspaceExists,        \* Function: task -> BOOLEAN (isolated workspace exists)
    workspaceMerged,        \* Function: task -> BOOLEAN (branch merged to feature)

    \* --- TDD counters ---
    redRetries,             \* Function: task -> count of RED retries used
    greenAttempts,          \* Function: task -> count of GREEN failure attempts
    cleanupRemediations,    \* Function: task -> count of cleanup remediation cycles
    cleanupCleanPasses,     \* Function: task -> consecutive clean passes achieved

    \* --- Merge queue ---
    mergeQueue,             \* Sequence of task IDs waiting to merge
    mergeRetries,           \* Function: task -> merge resolution attempts used
    mergeInProgress,        \* Task currently merging (0 = none)

    \* --- Final verification ---
    finalVerifPhase,        \* "idle" | "running" | "completed" | "escalated"
    finalCleanPasses,       \* Consecutive clean passes in final verification
    finalRemediations       \* Remediation cycles used in final verification

\* =========================================================================
\* Constant operators for TLC substitution (TLC .cfg cannot parse :> / @@)
\* =========================================================================

TiersConst == (1 :> 1 @@ 2 :> 1 @@ 3 :> 2)
WriterTypeConst == (1 :> "tdd" @@ 2 :> "tdd" @@ 3 :> "tdd")

\* =========================================================================
\* Variable groupings for UNCHANGED clauses
\* =========================================================================

pipeVars    == <<currentTier, pipelineStatus, escalationActive,
                 validationStatus, wsCreationFailed>>
taskVars    == <<taskPhase, taskStatus>>
wsVars      == <<workspaceExists, workspaceMerged>>
tddVars     == <<redRetries, greenAttempts, cleanupRemediations, cleanupCleanPasses>>
mergeAllVars == <<mergeQueue, mergeRetries, mergeInProgress>>
finalAllVars == <<finalVerifPhase, finalCleanPasses, finalRemediations>>

vars == <<currentTier, pipelineStatus, escalationActive,
          validationStatus, wsCreationFailed,
          taskPhase, taskStatus,
          workspaceExists, workspaceMerged,
          redRetries, greenAttempts, cleanupRemediations, cleanupCleanPasses,
          mergeQueue, mergeRetries, mergeInProgress,
          finalVerifPhase, finalCleanPasses, finalRemediations>>

\* =========================================================================
\* Helper operators
\* =========================================================================

TasksInTier(t) == {task \in Tasks : Tiers[task] = t}

TierSize(t) == Cardinality(TasksInTier(t))

IsTddTask(task) == WriterType[task] = "tdd"

IsAgentTask(task) == WriterType[task] = "agent"

AllTasksInTierDone(t) ==
    \A task \in TasksInTier(t) :
        taskStatus[task] \in {"completed", "skipped"}

AllTasksInTierMerged(t) ==
    \A task \in TasksInTier(t) :
        workspaceMerged[task] = TRUE \/ workspaceExists[task] = FALSE

MergeQueueEmpty == Len(mergeQueue) = 0 /\ mergeInProgress = 0

TierFullyDone(t) ==
    AllTasksInTierDone(t) /\ AllTasksInTierMerged(t) /\ MergeQueueEmpty

\* Phase enum values:
\*   "idle"          -- not started
\*   "red"           -- RED phase (writing tests)
\*   "red_retry"     -- RED retry (tests passed unexpectedly)
\*   "green"         -- GREEN phase (writing implementation)
\*   "green_retry"   -- GREEN retry (tests still failing)
\*   "cleanup"       -- Cleanup verification loop
\*   "cleanup_remed" -- Cleanup remediation cycle
\*                      (models both blame="test" and blame="code" paths;
\*                       the nondeterministic blame fork is abstracted here
\*                       because both paths have identical state transitions)
\*   "agent_call"    -- Agent-writer single call
\*   "done"          -- Task completed its TDD/agent cycle

PhaseSet == {"idle", "red", "red_retry", "green", "green_retry",
             "cleanup", "cleanup_remed", "agent_call", "done"}

StatusSet == {"pending", "running", "completed", "escalated", "skipped"}

\* =========================================================================
\* Type Invariant
\* =========================================================================

TypeOK ==
    /\ currentTier \in 0..NumTiers + 1
    /\ pipelineStatus \in {"running", "halted", "completed"}
    /\ escalationActive \in BOOLEAN
    /\ validationStatus \in {"pending", "valid", "failed"}
    /\ wsCreationFailed \in BOOLEAN
    /\ \A t \in Tasks : taskPhase[t] \in PhaseSet
    /\ \A t \in Tasks : taskStatus[t] \in StatusSet
    /\ \A t \in Tasks : workspaceExists[t] \in BOOLEAN
    /\ \A t \in Tasks : workspaceMerged[t] \in BOOLEAN
    /\ \A t \in Tasks : redRetries[t] \in 0..MaxRedRetries
    /\ \A t \in Tasks : greenAttempts[t] \in 0..MaxTddCycles
    /\ \A t \in Tasks : cleanupRemediations[t] \in 0..MaxFixRounds
    /\ \A t \in Tasks : cleanupCleanPasses[t] \in 0..CleanupPasses
    /\ \A t \in Tasks : mergeRetries[t] \in 0..MaxMergeRetries
    /\ mergeInProgress \in Tasks \cup {0}
    /\ finalVerifPhase \in {"idle", "running", "remediating", "completed", "escalated"}
    /\ finalCleanPasses \in 0..CleanupPasses
    /\ finalRemediations \in 0..MaxFixRounds

\* =========================================================================
\* Initial State
\* =========================================================================

Init ==
    /\ currentTier = 0
    /\ pipelineStatus = "running"
    /\ escalationActive = FALSE
    /\ validationStatus = "pending"
    /\ wsCreationFailed = FALSE
    /\ taskPhase = [t \in Tasks |-> "idle"]
    /\ taskStatus = [t \in Tasks |-> "pending"]
    /\ workspaceExists = [t \in Tasks |-> FALSE]
    /\ workspaceMerged = [t \in Tasks |-> FALSE]
    /\ redRetries = [t \in Tasks |-> 0]
    /\ greenAttempts = [t \in Tasks |-> 0]
    /\ cleanupRemediations = [t \in Tasks |-> 0]
    /\ cleanupCleanPasses = [t \in Tasks |-> 0]
    /\ mergeQueue = <<>>
    /\ mergeRetries = [t \in Tasks |-> 0]
    /\ mergeInProgress = 0
    /\ finalVerifPhase = "idle"
    /\ finalCleanPasses = 0
    /\ finalRemediations = 0

\* =========================================================================
\* Plan Validation (covers BDD Stages 6-7 output + Stage 8 pre-checks)
\*
\* Models: intra-tier dependency rejection, unknown writer type rejection,
\* orphaned workspace detection, ticket completeness, TLA+ coverage gaps.
\* The specific failure reason is a runtime detail; the state machine
\* distinguishes only "valid" vs "failed" since all failures block execution.
\* =========================================================================

\* Validation passes -- plan is valid, orphan check clean, ready to execute
ValidationPasses ==
    /\ validationStatus = "pending"
    /\ pipelineStatus = "running"
    /\ validationStatus' = "valid"
    /\ UNCHANGED <<currentTier, pipelineStatus, escalationActive,
                   wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* Validation fails -- intra-tier deps, unknown writers, orphaned workspaces, etc.
\* BDD: "validation fails with an error" and "no tasks execute"
ValidationFails ==
    /\ validationStatus = "pending"
    /\ pipelineStatus = "running"
    /\ validationStatus' = "failed"
    /\ pipelineStatus' = "halted"
    /\ UNCHANGED <<currentTier, escalationActive, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* Pipeline-level actions
\* =========================================================================

\* --- Zero-tier plan completes as no-op ---
\* FIX(critical): ZeroTierComplete only fires for NumTiers=0.
\* CompletionRequiresFinalVerif is weakened to exempt this case.
ZeroTierComplete ==
    /\ currentTier = 0
    /\ NumTiers = 0
    /\ pipelineStatus = "running"
    /\ validationStatus = "valid"
    /\ pipelineStatus' = "completed"
    /\ currentTier' = 1
    /\ UNCHANGED <<escalationActive, validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* --- Advance to next tier ---
\* Requires validation passed. Creates workspaces for multi-task tiers.
StartNextTier ==
    /\ pipelineStatus = "running"
    /\ ~escalationActive
    /\ validationStatus = "valid"
    /\ \/ currentTier = 0 /\ NumTiers > 0
       \/ /\ currentTier > 0
          /\ currentTier <= NumTiers
          /\ TierFullyDone(currentTier)
    /\ LET nextTier == currentTier + 1
       IN /\ nextTier <= NumTiers
          /\ currentTier' = nextTier
          /\ LET tierTasks == TasksInTier(nextTier)
                 multi == TierSize(nextTier) > 1
             IN /\ taskStatus' = [t \in Tasks |->
                    IF t \in tierTasks THEN "running" ELSE taskStatus[t]]
                /\ taskPhase' = [t \in Tasks |->
                    IF t \in tierTasks /\ IsTddTask(t) THEN "red"
                    ELSE IF t \in tierTasks /\ IsAgentTask(t) THEN "agent_call"
                    ELSE taskPhase[t]]
                \* Multi-task tier: create workspaces; single-task: no workspace
                /\ workspaceExists' = [t \in Tasks |->
                    IF t \in tierTasks /\ multi THEN TRUE
                    ELSE workspaceExists[t]]
    /\ UNCHANGED <<pipelineStatus, escalationActive, validationStatus, wsCreationFailed,
                   workspaceMerged,
                   tddVars, mergeAllVars, finalAllVars>>

\* --- Workspace creation failure ---
\* BDD: "Partial workspace creation failure rolls back the tier"
\* Nondeterministic alternative to StartNextTier for multi-task tiers.
\* Does NOT advance currentTier, so KeepGoing allows retry via StartNextTier.
WorkspaceCreationFailure ==
    /\ pipelineStatus = "running"
    /\ ~escalationActive
    /\ validationStatus = "valid"
    /\ \/ currentTier = 0 /\ NumTiers > 0
       \/ /\ currentTier > 0
          /\ currentTier <= NumTiers
          /\ TierFullyDone(currentTier)
    /\ LET nextTier == currentTier + 1
       IN /\ nextTier <= NumTiers
          /\ TierSize(nextTier) > 1   \* Only multi-task tiers create workspaces
    /\ wsCreationFailed' = TRUE
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus,
                   taskVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* --- Empty tier is skipped ---
SkipEmptyTier ==
    /\ pipelineStatus = "running"
    /\ ~escalationActive
    /\ validationStatus = "valid"
    /\ currentTier > 0
    /\ currentTier <= NumTiers
    /\ TasksInTier(currentTier) = {}
    /\ currentTier' = currentTier + 1
    /\ UNCHANGED <<pipelineStatus, escalationActive, validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* TDD Cycle -- RED Phase
\* =========================================================================

\* RED phase: tests fail as expected -> move to GREEN
RedTestsFail(task) ==
    /\ taskPhase[task] = "red"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "green"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* RED phase: tests pass unexpectedly -> enter RED retry
RedTestsPassUnexpectedly(task) ==
    /\ taskPhase[task] = "red"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "red_retry"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* RED retry: verdict "revised" -- increment counter, restart RED
RedRetryRevised(task) ==
    /\ taskPhase[task] = "red_retry"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ redRetries[task] < MaxRedRetries
    /\ redRetries' = [redRetries EXCEPT ![task] = @ + 1]
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "red"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars,
                   greenAttempts, cleanupRemediations, cleanupCleanPasses,
                   mergeAllVars, finalAllVars>>

\* RED retry: verdict "already_implemented" -- skip GREEN, go to cleanup
RedRetryAlreadyImplemented(task) ==
    /\ taskPhase[task] = "red_retry"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "cleanup"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* RED retries exhausted -> escalate
RedRetryExhausted(task) ==
    /\ taskPhase[task] = "red_retry"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ redRetries[task] >= MaxRedRetries
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "escalated"]
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* TDD Cycle -- GREEN Phase
\*
\* FIX(high): GREEN fencepost corrected. greenAttempts counts each failed
\* GREEN attempt (incremented in GreenTestsFail, not GreenRetry).
\* With MaxTddCycles=100: 100 failures -> escalation. Matches BDD exactly.
\*
\* Flow: green -> GreenTestsFail (counter++) -> green_retry
\*       -> GreenRetry (back to green) OR GreenRetryExhausted (escalate)
\*
\* Note: Invoke-Claude response-format failures (non-JSON, empty, truncated)
\* are abstracted into the retry mechanism. Each re-prompt attempt is
\* counted as a GREEN attempt since it consumes a cycle.
\* =========================================================================

\* GREEN phase: tests pass -> move to cleanup
GreenTestsPass(task) ==
    /\ taskPhase[task] = "green"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "cleanup"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* GREEN phase: tests fail -> increment attempt counter, enter retry decision
\* FIX: Counter increments HERE (on failure), not in GreenRetry.
\* This also models: code writer modifies test file (rejected, re-prompted,
\* counts as a failed attempt); response-format failures (re-prompted).
GreenTestsFail(task) ==
    /\ taskPhase[task] = "green"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ greenAttempts' = [greenAttempts EXCEPT ![task] = @ + 1]
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "green_retry"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars,
                   redRetries, cleanupRemediations, cleanupCleanPasses,
                   mergeAllVars, finalAllVars>>

\* GREEN retry: code writer tries again (counter already incremented)
GreenRetry(task) ==
    /\ taskPhase[task] = "green_retry"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ greenAttempts[task] < MaxTddCycles
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "green"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* GREEN attempts exhausted -> escalate
GreenRetryExhausted(task) ==
    /\ taskPhase[task] = "green_retry"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ greenAttempts[task] >= MaxTddCycles
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "escalated"]
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* TDD Cycle -- Cleanup Phase
\*
\* Runs test/lint/tsc in sequence. The remediation phase (cleanup_remed)
\* models the blame fork: test writer determines blame ("test" or "code"),
\* then the appropriate writer fixes the issue. Both blame paths have
\* identical state transitions (increment remediation counter, return to
\* cleanup), so they are unified in a single action.
\* =========================================================================

\* Cleanup: all three commands pass -> increment consecutive clean counter
CleanupPass(task) ==
    /\ taskPhase[task] = "cleanup"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ cleanupCleanPasses[task] < CleanupPasses
    /\ cleanupCleanPasses' = [cleanupCleanPasses EXCEPT ![task] = @ + 1]
    /\ UNCHANGED <<pipeVars, taskVars, wsVars,
                   redRetries, greenAttempts, cleanupRemediations,
                   mergeAllVars, finalAllVars>>

\* Cleanup: consecutive passes reach CleanupPasses -> task done
CleanupComplete(task) ==
    /\ taskPhase[task] = "cleanup"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ cleanupCleanPasses[task] >= CleanupPasses
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "done"]
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "completed"]
    /\ UNCHANGED <<pipeVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* Cleanup: a verify command fails -> reset clean counter, trigger remediation
CleanupFail(task) ==
    /\ taskPhase[task] = "cleanup"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ cleanupRemediations[task] < MaxFixRounds
    /\ cleanupCleanPasses' = [cleanupCleanPasses EXCEPT ![task] = 0]
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "cleanup_remed"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars,
                   redRetries, greenAttempts, cleanupRemediations,
                   mergeAllVars, finalAllVars>>

\* Cleanup remediation: fix applied -> back to cleanup, increment counter
\* Models both blame="test" (test writer fixes) and blame="code" (code writer
\* fixes via test writer triage). Unrecognized blame values trigger re-prompt,
\* which is absorbed into this single remediation step.
CleanupRemediate(task) ==
    /\ taskPhase[task] = "cleanup_remed"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ cleanupRemediations[task] < MaxFixRounds
    /\ cleanupRemediations' = [cleanupRemediations EXCEPT ![task] = @ + 1]
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "cleanup"]
    /\ UNCHANGED <<pipeVars, taskStatus, wsVars,
                   redRetries, greenAttempts, cleanupCleanPasses,
                   mergeAllVars, finalAllVars>>

\* Cleanup exhausted -> escalate
CleanupExhausted(task) ==
    /\ taskPhase[task] \in {"cleanup", "cleanup_remed"}
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ cleanupRemediations[task] >= MaxFixRounds
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "escalated"]
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* Agent-Writer Exception
\* =========================================================================

\* Agent-writer: single call completes the task (no TDD cycle)
\* BDD: "Invoke-Claude is called exactly once" / "no retry loop"
AgentWriterComplete(task) ==
    /\ taskPhase[task] = "agent_call"
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ IsAgentTask(task)
    /\ taskPhase' = [taskPhase EXCEPT ![task] = "done"]
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "completed"]
    /\ UNCHANGED <<pipeVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* Merge Queue
\*
\* Post-merge verification (BDD: "runs verify commands for both tasks after
\* resolution") is abstracted into the MergeConflictResolve -> MergeSuccess
\* nondeterministic sequence. A failed post-merge verification manifests as
\* another MergeConflictResolve (consuming a retry), while success manifests
\* as MergeSuccess. This abstraction is sound because the retry counter
\* correctly bounds total resolution attempts including verification failures.
\*
\* Budget sharing: conflict resolution and post-merge verification share
\* the MaxMergeRetries budget per task. Implementers should be aware that
\* a task that needs 2 conflict resolutions has only 1 retry left for
\* post-merge verification failure (with MaxMergeRetries=3).
\* =========================================================================

\* Enqueue completed workspace tasks for merging
EnqueueForMerge(task) ==
    /\ taskStatus[task] = "completed"
    /\ workspaceExists[task] = TRUE
    /\ workspaceMerged[task] = FALSE
    /\ pipelineStatus = "running"
    /\ ~escalationActive
    \* Not already in queue or being merged
    /\ \A i \in 1..Len(mergeQueue) : mergeQueue[i] /= task
    /\ mergeInProgress /= task
    /\ mergeQueue' = Append(mergeQueue, task)
    /\ UNCHANGED <<pipeVars, taskVars, wsVars, tddVars,
                   mergeRetries, mergeInProgress, finalAllVars>>

\* Dequeue next task for merge (serial: only when nothing in progress)
StartMerge ==
    /\ Len(mergeQueue) > 0
    /\ mergeInProgress = 0
    /\ pipelineStatus = "running"
    /\ ~escalationActive
    /\ mergeInProgress' = Head(mergeQueue)
    /\ mergeQueue' = Tail(mergeQueue)
    /\ UNCHANGED <<pipeVars, taskVars, wsVars, tddVars,
                   mergeRetries, finalAllVars>>

\* Merge succeeds (no conflict or post-merge verification passed)
\* -> mark merged, clean up workspace
MergeSuccess ==
    /\ mergeInProgress /= 0
    /\ pipelineStatus = "running"
    /\ LET task == mergeInProgress
       IN /\ workspaceMerged' = [workspaceMerged EXCEPT ![task] = TRUE]
          /\ workspaceExists' = [workspaceExists EXCEPT ![task] = FALSE]
    /\ mergeInProgress' = 0
    /\ UNCHANGED <<pipeVars, taskVars,
                   tddVars, mergeQueue, mergeRetries, finalAllVars>>

\* Merge conflict -> attempt resolution (uses a retry)
\* Also models post-merge verification failure (retry consumed).
\* IMPORTANT: Post-merge verification failures and conflict resolution attempts
\* share the same MaxMergeRetries budget. Each failed post-merge verification
\* consumes one retry, just like a conflict resolution attempt. This means
\* MaxMergeRetries=3 allows at most 3 total attempts across both conflict
\* resolution and post-merge verification for a single task's merge.
\* BDD: "merge-resolver receives both tickets, conflict diff, affected files"
\* BDD: "task log notes possible missed dependency in implementation plan"
MergeConflictResolve ==
    /\ mergeInProgress /= 0
    /\ pipelineStatus = "running"
    /\ LET task == mergeInProgress
       IN /\ mergeRetries[task] < MaxMergeRetries
          /\ mergeRetries' = [mergeRetries EXCEPT ![task] = @ + 1]
    /\ UNCHANGED <<pipeVars, taskVars, wsVars, tddVars,
                   mergeQueue, mergeInProgress, finalAllVars>>

\* Merge retries exhausted -> escalate
\* FIX(high): Now marks the merging task as "escalated" so recovery can
\* identify and restore it. EscalationKeepGoingMerge reverses this.
MergeExhausted ==
    /\ mergeInProgress /= 0
    /\ pipelineStatus = "running"
    /\ LET task == mergeInProgress
       IN /\ mergeRetries[task] >= MaxMergeRetries
          /\ taskStatus' = [taskStatus EXCEPT ![task] = "escalated"]
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars, tddVars,
                   mergeQueue, mergeRetries, mergeInProgress, finalAllVars>>

\* Single-task tier: task on feature branch, no merge needed
SingleTaskTierComplete(task) ==
    /\ taskStatus[task] = "completed"
    /\ workspaceExists[task] = FALSE
    /\ workspaceMerged[task] = FALSE
    /\ pipelineStatus = "running"
    /\ workspaceMerged' = [workspaceMerged EXCEPT ![task] = TRUE]
    /\ UNCHANGED <<pipeVars, taskVars, workspaceExists,
                   tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* Final Verification
\*
\* BDD: "Final verification includes only test writers that were used."
\* At runtime, the orchestrator collects the set of distinct test writers
\* across all tasks and runs only those verify commands. Writer attribution
\* for remediation uses the task whose files caused the failure.
\* These runtime details are abstracted in the state machine.
\* =========================================================================

\* All tiers complete -> start final verification
\* FIX(critical): Now accepts currentTier > NumTiers (handles empty-last-tier
\* case where SkipEmptyTier advanced past NumTiers without deadlocking).
StartFinalVerification ==
    /\ pipelineStatus = "running"
    /\ ~escalationActive
    /\ NumTiers > 0
    /\ finalVerifPhase = "idle"
    /\ \/ /\ currentTier = NumTiers
          /\ TierFullyDone(currentTier)
       \/ currentTier > NumTiers    \* Last tier was empty/skipped
    /\ currentTier' = NumTiers + 1
    /\ finalVerifPhase' = "running"
    /\ UNCHANGED <<pipelineStatus, escalationActive, validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars,
                   finalCleanPasses, finalRemediations>>

\* Final verification: clean pass
FinalVerifPass ==
    /\ finalVerifPhase = "running"
    /\ pipelineStatus = "running"
    /\ finalCleanPasses < CleanupPasses
    /\ finalCleanPasses' = finalCleanPasses + 1
    /\ UNCHANGED <<pipeVars, taskVars, wsVars, tddVars, mergeAllVars,
                   finalVerifPhase, finalRemediations>>

\* Final verification: completed
FinalVerifComplete ==
    /\ finalVerifPhase = "running"
    /\ pipelineStatus = "running"
    /\ finalCleanPasses >= CleanupPasses
    /\ finalVerifPhase' = "completed"
    /\ pipelineStatus' = "completed"
    /\ UNCHANGED <<currentTier, escalationActive, validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars,
                   finalCleanPasses, finalRemediations>>

\* Final verification: fail -> reset counter, enter remediation phase
\* FIX(medium): Now a two-step cycle matching per-task cleanup pattern.
\* Step 1: FinalVerifFail transitions to "remediating" and resets clean passes.
\* Step 2: FinalVerifRemediate applies the fix, increments counter, returns to "running".
\* Writer attribution for remediation uses the task whose files caused the
\* failure (runtime detail, abstracted here).
FinalVerifFail ==
    /\ finalVerifPhase = "running"
    /\ pipelineStatus = "running"
    /\ finalRemediations < MaxFixRounds
    /\ finalCleanPasses' = 0
    /\ finalVerifPhase' = "remediating"
    /\ UNCHANGED <<currentTier, pipelineStatus, escalationActive,
                   validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars,
                   finalRemediations>>

\* Final verification: remediation fix applied -> back to running, increment counter
FinalVerifRemediate ==
    /\ finalVerifPhase = "remediating"
    /\ pipelineStatus = "running"
    /\ finalRemediations < MaxFixRounds
    /\ finalRemediations' = finalRemediations + 1
    /\ finalVerifPhase' = "running"
    /\ UNCHANGED <<currentTier, pipelineStatus, escalationActive,
                   validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars,
                   finalCleanPasses>>

\* Final verification: remediation exhausted -> escalate
FinalVerifExhausted ==
    /\ finalVerifPhase \in {"running", "remediating"}
    /\ pipelineStatus = "running"
    /\ finalRemediations >= MaxFixRounds
    /\ finalVerifPhase' = "escalated"
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars,
                   finalCleanPasses, finalRemediations>>

\* =========================================================================
\* Escalation Recovery
\* =========================================================================

\* User selects "Keep Going" -> reset the failed task's retry counter
EscalationKeepGoing(task) ==
    /\ escalationActive
    /\ pipelineStatus = "running"
    /\ taskStatus[task] = "escalated"
    \* Must not be a merge-escalated task (those use EscalationKeepGoingMerge)
    /\ taskPhase[task] /= "done"
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "running"]
    /\ LET otherEscalated ==
            \/ \E t \in Tasks \ {task} : taskStatus[t] = "escalated"
            \/ (mergeInProgress /= 0 /\ mergeRetries[mergeInProgress] >= MaxMergeRetries)
            \/ finalVerifPhase = "escalated"
            \/ wsCreationFailed
       IN escalationActive' = otherEscalated
    \* Reset the relevant retry counter based on the task's current phase
    /\ \/ /\ taskPhase[task] = "red_retry"
          /\ redRetries' = [redRetries EXCEPT ![task] = 0]
          /\ UNCHANGED <<greenAttempts, cleanupRemediations, cleanupCleanPasses, mergeRetries>>
       \/ /\ taskPhase[task] = "green_retry"
          /\ greenAttempts' = [greenAttempts EXCEPT ![task] = 0]
          /\ UNCHANGED <<redRetries, cleanupRemediations, cleanupCleanPasses, mergeRetries>>
       \/ /\ taskPhase[task] \in {"cleanup", "cleanup_remed"}
          \* FIX(high): Also reset cleanupCleanPasses to prevent stale pass
          \* counts from surviving human intervention. Without this, a task
          \* that had 1 clean pass before escalation could complete cleanup
          \* after only 1 new clean pass post-recovery.
          /\ cleanupRemediations' = [cleanupRemediations EXCEPT ![task] = 0]
          /\ cleanupCleanPasses' = [cleanupCleanPasses EXCEPT ![task] = 0]
          /\ UNCHANGED <<redRetries, greenAttempts, mergeRetries>>
       \* Infrastructure failure can escalate during any running phase;
       \* no retry counter to reset for these phases.
       \/ /\ taskPhase[task] \in {"red", "green", "agent_call"}
          /\ UNCHANGED <<redRetries, greenAttempts, cleanupRemediations,
                         cleanupCleanPasses, mergeRetries>>
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars,
                   mergeQueue, mergeInProgress,
                   finalAllVars>>

\* User selects "Keep Going" for merge exhaustion
\* FIX(high): Restores task to "completed" (reversed from MergeExhausted).
EscalationKeepGoingMerge ==
    /\ escalationActive
    /\ pipelineStatus = "running"
    /\ mergeInProgress /= 0
    /\ mergeRetries[mergeInProgress] >= MaxMergeRetries
    /\ LET task == mergeInProgress
       IN /\ taskStatus' = [taskStatus EXCEPT ![task] = "completed"]
          /\ LET otherEscalated ==
                  \/ \E t \in Tasks \ {task} : taskStatus[t] = "escalated"
                  \/ finalVerifPhase = "escalated"
                  \/ wsCreationFailed
             IN escalationActive' = otherEscalated
    /\ mergeRetries' = [mergeRetries EXCEPT ![mergeInProgress] = 0]
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars,
                   redRetries, greenAttempts, cleanupRemediations, cleanupCleanPasses,
                   mergeQueue, mergeInProgress,
                   finalAllVars>>

\* User selects "Keep Going" for final verification exhaustion
\* FIX(high): Now resets finalCleanPasses in addition to finalRemediations.
\* Handles escalation from both "running" and "remediating" phases.
EscalationKeepGoingFinal ==
    /\ escalationActive
    /\ pipelineStatus = "running"
    /\ finalVerifPhase = "escalated"
    /\ LET otherEscalated ==
            \/ \E t \in Tasks : taskStatus[t] = "escalated"
            \/ (mergeInProgress /= 0 /\ mergeRetries[mergeInProgress] >= MaxMergeRetries)
            \/ wsCreationFailed
       IN escalationActive' = otherEscalated
    /\ finalVerifPhase' = "running"
    /\ finalRemediations' = 0
    /\ finalCleanPasses' = 0
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskVars, wsVars, tddVars, mergeAllVars>>

\* User selects "Keep Going" for workspace creation failure
EscalationKeepGoingWorkspace ==
    /\ escalationActive
    /\ pipelineStatus = "running"
    /\ wsCreationFailed
    /\ wsCreationFailed' = FALSE
    /\ LET otherEscalated ==
            \/ \E t \in Tasks : taskStatus[t] = "escalated"
            \/ (mergeInProgress /= 0 /\ mergeRetries[mergeInProgress] >= MaxMergeRetries)
            \/ finalVerifPhase = "escalated"
       IN escalationActive' = otherEscalated
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus,
                   taskVars, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* User selects "Stop" -> halt the pipeline
\* FIX(critical): Preserves workspaces for BOTH escalated AND running tasks.
\* BDD: "T1's workspace is cleaned up" (completed), "T2's workspace is
\* preserved for debugging" (escalated); AND "both preserved" (both active).
EscalationStop ==
    /\ escalationActive
    /\ pipelineStatus = "running"
    /\ pipelineStatus' = "halted"
    /\ escalationActive' = FALSE
    /\ wsCreationFailed' = FALSE
    \* Gracefully terminate all running/pending tasks
    /\ taskStatus' = [t \in Tasks |->
        IF taskStatus[t] = "running" THEN "skipped"
        ELSE IF taskStatus[t] = "pending" THEN "skipped"
        ELSE taskStatus[t]]
    \* Preserve workspaces for escalated and running (now skipped) tasks;
    \* clean up completed task workspaces.
    \* Note: check CURRENT status (before this action's changes) to decide.
    /\ workspaceExists' = [t \in Tasks |->
        IF taskStatus[t] \in {"escalated", "running"} THEN workspaceExists[t]
        ELSE FALSE]
    /\ UNCHANGED <<currentTier, validationStatus,
                   taskPhase, workspaceMerged,
                   tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* Infrastructure failure -> immediate escalation (no retry consumed)
\*
\* FIX(high): Removed ~escalationActive guard. Infrastructure failures are
\* never silently dropped. Multiple tasks can be escalated simultaneously;
\* EscalationKeepGoing handles them one at a time.
\*
\* BDD: "exit code 127 (command not found)" and "command times out" both
\* trigger immediate escalation without consuming a retry.
\* =========================================================================

InfrastructureFailure(task) ==
    /\ taskStatus[task] = "running"
    /\ pipelineStatus = "running"
    /\ taskStatus' = [taskStatus EXCEPT ![task] = "escalated"]
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<currentTier, pipelineStatus, validationStatus, wsCreationFailed,
                   taskPhase, wsVars, tddVars, mergeAllVars, finalAllVars>>

\* =========================================================================
\* Next-State Relation
\* =========================================================================

Next ==
    \* Validation
    \/ ValidationPasses
    \/ ValidationFails
    \* Pipeline
    \/ ZeroTierComplete
    \/ StartNextTier
    \/ WorkspaceCreationFailure
    \/ SkipEmptyTier
    \* TDD per task
    \/ \E t \in Tasks :
        \/ RedTestsFail(t)
        \/ RedTestsPassUnexpectedly(t)
        \/ RedRetryRevised(t)
        \/ RedRetryAlreadyImplemented(t)
        \/ RedRetryExhausted(t)
        \/ GreenTestsPass(t)
        \/ GreenTestsFail(t)
        \/ GreenRetry(t)
        \/ GreenRetryExhausted(t)
        \/ CleanupPass(t)
        \/ CleanupComplete(t)
        \/ CleanupFail(t)
        \/ CleanupRemediate(t)
        \/ CleanupExhausted(t)
        \/ AgentWriterComplete(t)
        \/ EnqueueForMerge(t)
        \/ SingleTaskTierComplete(t)
        \/ InfrastructureFailure(t)
        \/ EscalationKeepGoing(t)
    \* Merge queue
    \/ StartMerge
    \/ MergeSuccess
    \/ MergeConflictResolve
    \/ MergeExhausted
    \/ EscalationKeepGoingMerge
    \* Final verification
    \/ StartFinalVerification
    \/ FinalVerifPass
    \/ FinalVerifComplete
    \/ FinalVerifFail
    \/ FinalVerifRemediate
    \/ FinalVerifExhausted
    \/ EscalationKeepGoingFinal
    \* Workspace creation
    \/ EscalationKeepGoingWorkspace
    \* Escalation
    \/ EscalationStop

\* =========================================================================
\* Fairness
\* =========================================================================

Fairness ==
    /\ WF_vars(ValidationPasses)
    /\ WF_vars(ZeroTierComplete)
    /\ WF_vars(StartNextTier)
    /\ WF_vars(SkipEmptyTier)
    /\ \A t \in Tasks :
        /\ WF_vars(RedTestsFail(t))
        /\ WF_vars(RedRetryRevised(t))
        /\ WF_vars(RedRetryAlreadyImplemented(t))
        /\ WF_vars(RedRetryExhausted(t))
        /\ WF_vars(GreenTestsPass(t))
        /\ WF_vars(GreenRetry(t))
        /\ WF_vars(GreenRetryExhausted(t))
        /\ WF_vars(CleanupPass(t))
        /\ WF_vars(CleanupComplete(t))
        /\ WF_vars(CleanupRemediate(t))
        /\ WF_vars(CleanupExhausted(t))
        /\ WF_vars(AgentWriterComplete(t))
        /\ WF_vars(EnqueueForMerge(t))
        /\ WF_vars(SingleTaskTierComplete(t))
        /\ WF_vars(EscalationKeepGoing(t))
    /\ WF_vars(StartMerge)
    /\ WF_vars(MergeSuccess)
    \* FIX(high): Added WF for MergeConflictResolve to close liveness gap.
    \* Without this, a merge conflict can stall indefinitely: the resolver
    \* never fires, retries never increment, MergeExhausted never enables.
    /\ WF_vars(MergeConflictResolve)
    /\ WF_vars(MergeExhausted)
    /\ WF_vars(EscalationKeepGoingMerge)
    /\ WF_vars(EscalationKeepGoingWorkspace)
    /\ WF_vars(StartFinalVerification)
    /\ WF_vars(FinalVerifPass)
    /\ WF_vars(FinalVerifComplete)
    /\ WF_vars(FinalVerifRemediate)
    /\ WF_vars(FinalVerifExhausted)
    /\ WF_vars(EscalationKeepGoingFinal)
    \* Strong fairness: if escalation keeps recurring (e.g., infinite
    \* InfrastructureFailure -> KeepGoing loops, or infinite workspace
    \* creation failures), the user eventually selects Stop.
    /\ SF_vars(EscalationStop)

Spec == Init /\ [][Next]_vars /\ Fairness

\* =========================================================================
\* Safety Properties
\* =========================================================================

\* S1: Tiers execute sequentially -- no task in a later tier runs before
\*     all tasks in earlier tiers are done
TiersSequential ==
    \A t \in Tasks :
        taskStatus[t] = "running" =>
            \A earlier \in Tasks :
                Tiers[earlier] < Tiers[t] =>
                    taskStatus[earlier] \in {"completed", "skipped"}

\* S2: Retry counters never exceed their maximums
RetryBounds ==
    /\ \A t \in Tasks : redRetries[t] <= MaxRedRetries
    /\ \A t \in Tasks : greenAttempts[t] <= MaxTddCycles
    /\ \A t \in Tasks : cleanupRemediations[t] <= MaxFixRounds
    /\ \A t \in Tasks : mergeRetries[t] <= MaxMergeRetries
    /\ finalRemediations <= MaxFixRounds

\* S3: Agent-writer tasks never enter TDD phases
AgentWriterNoTdd ==
    \A t \in Tasks :
        IsAgentTask(t) =>
            taskPhase[t] \in {"idle", "agent_call", "done"}

\* S4: Merges are serial -- no duplicates in queue, in-progress not also queued
\* FIX(high): Replaced tautology with a real structural invariant.
MergeSerial ==
    /\ \A i, j \in 1..Len(mergeQueue) : i /= j => mergeQueue[i] /= mergeQueue[j]
    /\ mergeInProgress /= 0 =>
        \A i \in 1..Len(mergeQueue) : mergeQueue[i] /= mergeInProgress

\* S5: No orphaned workspaces after pipeline completion
NoOrphanedWorkspaces ==
    pipelineStatus = "completed" =>
        \A t \in Tasks : workspaceExists[t] = FALSE

\* S6: Single-task tiers never create workspaces
SingleTaskNoWorkspace ==
    \A t \in Tasks :
        /\ Tiers[t] <= NumTiers
        /\ TierSize(Tiers[t]) = 1
        => workspaceExists[t] = FALSE

\* S7: Completed pipeline means final verification passed
\* FIX(critical): Exempts NumTiers=0 (zero-tier plans complete without
\* final verification, which is correct per BDD "completes as no-op").
CompletionRequiresFinalVerif ==
    pipelineStatus = "completed" =>
        \/ finalVerifPhase = "completed"
        \/ NumTiers = 0

\* S8: Escalation blocks pipeline completion
EscalationBlocksProgress ==
    escalationActive =>
        pipelineStatus /= "completed"

\* S9: GREEN phase only reachable for TDD tasks
GreenAfterRed ==
    \A t \in Tasks :
        taskPhase[t] \in {"green", "green_retry"} =>
            IsTddTask(t)

\* S10: Cleanup only reachable for TDD tasks
CleanupOnlyForTdd ==
    \A t \in Tasks :
        taskPhase[t] \in {"cleanup", "cleanup_remed"} =>
            IsTddTask(t)

\* S11: Validation gates execution -- no task runs unless plan is validated
\* BDD: "validation fails" => "no tasks execute"
ValidationGatesExecution ==
    validationStatus /= "valid" =>
        \A t \in Tasks : taskStatus[t] \in {"pending", "skipped"}

\* S12: Workspace creation failure always triggers escalation
WorkspaceCreationSafety ==
    wsCreationFailed =>
        escalationActive

\* =========================================================================
\* Liveness Properties
\* =========================================================================

\* L1: The pipeline eventually completes or halts (no infinite running)
EventuallyTerminates ==
    <>(pipelineStatus \in {"completed", "halted"})

\* L2: Every running task eventually completes, escalates, or skips
TasksResolve ==
    \A t \in Tasks :
        taskStatus[t] = "running" ~>
            taskStatus[t] \in {"completed", "escalated", "skipped"}

\* L3: Escalation eventually resolves (user picks Keep Going or Stop)
EscalationResolves ==
    escalationActive ~> ~escalationActive

=============================================================================
