----------------------- MODULE PairProgrammingStage -----------------------
\* TLA+ Specification for Design Pipeline Stage 6: Pair Programming
\* Models tier-based parallel pair programming sessions with ping-pong TDD,
\* serialized merge queue, and bounded global review.
\*
\* Source: docs/questioner-sessions/2026-03-30_pair-programming-stage.md
\* Revision: v1.1 — expert review fixes (15 objections, 7 mandatory)

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    Tasks,                    \* Set of task IDs
    TierOf,                   \* Function: task -> tier number (1..NumTiers)
    NumTiers,                 \* Total number of tiers
    MaxConcurrent,            \* Max concurrent worktrees (Windows cap = 3)
    MaxGlobalFixes,           \* Hard cap on global review fix iterations (3)
    MaxCrossReview,           \* Bound on cross-review iterations per session
    MaxTDDCycles,             \* Bound on TDD cycles per session (for finite model)
    MaxValidationRetries,     \* Bound on test validation retries per TDD cycle
    MaxReDispatches,          \* Bound on re-dispatches per task
    MaxMergeConflictRetries   \* Bound on merge conflict resolution attempts (Fix 7)

ASSUME NumTiers >= 1
ASSUME MaxConcurrent >= 1
ASSUME MaxGlobalFixes >= 1
ASSUME MaxCrossReview >= 1
ASSUME MaxTDDCycles >= 1
ASSUME MaxValidationRetries >= 1
ASSUME MaxReDispatches >= 1
ASSUME MaxMergeConflictRetries >= 1
ASSUME \A t \in Tasks : TierOf[t] \in 1..NumTiers

---------------------------------------------------------------------------
\* State Space
---------------------------------------------------------------------------

PipelineStates == {
    "CONFIRMATION_GATE",
    "TIER_EXECUTING",
    "TIER_MERGING",
    "INTER_TIER_VERIFICATION",
    "GLOBAL_REVIEW",
    "FIX_SESSION",
    "COMPLETE",
    "HALTED"
}

SessionStates == {
    "IDLE",
    "HANDSHAKE",
    "RED",
    "TEST_VALIDATION",
    "GREEN",
    "REFACTOR_REVIEW",
    "LOCAL_REVIEW",
    "SESSION_COMPLETE",
    "SESSION_FAILED"
}

MergeStates == {
    "NOT_QUEUED",
    "QUEUED",
    "MERGING",
    "POST_MERGE_TEST",
    "MERGE_COMPLETE",
    "MERGE_CONFLICT"
}

HaltReasons == {
    "NONE",
    "TIER_ALL_FAILED",
    "VERIFICATION_FAILED",
    "GLOBAL_REVIEW_EXHAUSTED",
    "MERGE_CONFLICT_UNRESOLVABLE"
}

VARIABLES
    pipelineState,        \* Current pipeline state
    currentTier,          \* Current tier being executed (1..NumTiers or 0)
    sessionState,         \* Function: task -> session state
    mergeState,           \* Function: task -> merge state
    tddCycle,             \* Function: task -> current TDD cycle count
    hasFailingTest,       \* Function: task -> whether a failing test exists
    validationRetries,    \* Function: task -> validation retries in current cycle
    crossReviewCount,     \* Function: task -> cross-review iteration count
    reDispatchCount,      \* Function: task -> number of re-dispatches
    globalFixCount,       \* Number of global fix iterations used
    mergeQueueBusy,       \* Whether the merge queue is currently processing
    mergeConflictRetries, \* Function: task -> merge conflict resolution attempts
    confirmed,            \* Whether user confirmed at the gate
    commitCount,          \* Function: task -> number of committed TDD cycles (Fix 4)
    corruptionFlag,       \* Function: task -> whether session failed due to corruption (Fix 1)
    haltReason,           \* Distinguishes different escalation paths (additional)
    terminalArtifact      \* TRUE when pipeline reaches COMPLETE (additional)

vars == <<pipelineState, currentTier, sessionState, mergeState,
          tddCycle, hasFailingTest, validationRetries, crossReviewCount,
          reDispatchCount, globalFixCount, mergeQueueBusy,
          mergeConflictRetries, confirmed, commitCount, corruptionFlag,
          haltReason, terminalArtifact>>

---------------------------------------------------------------------------
\* Helper Operators
---------------------------------------------------------------------------

\* Tasks in a given tier
TasksInTier(t) == {task \in Tasks : TierOf[task] = t}

\* All tasks in current tier have completed their sessions
AllSessionsComplete(t) ==
    \A task \in TasksInTier(t) : sessionState[task] \in {"SESSION_COMPLETE", "SESSION_FAILED"}

\* All tasks in current tier are successfully merged
AllMergesComplete(t) ==
    \A task \in TasksInTier(t) :
        (sessionState[task] = "SESSION_COMPLETE" => mergeState[task] = "MERGE_COMPLETE") /\
        (sessionState[task] = "SESSION_FAILED" => mergeState[task] = "NOT_QUEUED")

\* Count of active sessions (not IDLE, not terminal)
ActiveSessionCount ==
    Cardinality({task \in Tasks :
        sessionState[task] \notin {"IDLE", "SESSION_COMPLETE", "SESSION_FAILED"}})

\* At least one session in this tier succeeded
AnySessionSucceeded(t) ==
    \E task \in TasksInTier(t) : sessionState[task] = "SESSION_COMPLETE"

\* All sessions in this tier failed
AllSessionsFailed(t) ==
    \A task \in TasksInTier(t) : sessionState[task] = "SESSION_FAILED"

---------------------------------------------------------------------------
\* Type Invariant
---------------------------------------------------------------------------

TypeOK ==
    /\ pipelineState \in PipelineStates
    /\ currentTier \in 0..NumTiers
    /\ sessionState \in [Tasks -> SessionStates]
    /\ mergeState \in [Tasks -> MergeStates]
    /\ tddCycle \in [Tasks -> 0..MaxTDDCycles]
    /\ hasFailingTest \in [Tasks -> BOOLEAN]
    /\ validationRetries \in [Tasks -> 0..MaxValidationRetries]
    /\ crossReviewCount \in [Tasks -> 0..MaxCrossReview]
    /\ reDispatchCount \in [Tasks -> 0..MaxReDispatches]
    /\ globalFixCount \in 0..MaxGlobalFixes
    /\ mergeQueueBusy \in BOOLEAN
    /\ mergeConflictRetries \in [Tasks -> 0..MaxMergeConflictRetries]
    /\ confirmed \in BOOLEAN
    /\ commitCount \in [Tasks -> 0..MaxTDDCycles]
    /\ corruptionFlag \in [Tasks -> BOOLEAN]
    /\ haltReason \in HaltReasons
    /\ terminalArtifact \in BOOLEAN

---------------------------------------------------------------------------
\* Initial State
---------------------------------------------------------------------------

Init ==
    /\ pipelineState = "CONFIRMATION_GATE"
    /\ currentTier = 0
    /\ sessionState = [task \in Tasks |-> "IDLE"]
    /\ mergeState = [task \in Tasks |-> "NOT_QUEUED"]
    /\ tddCycle = [task \in Tasks |-> 0]
    /\ hasFailingTest = [task \in Tasks |-> FALSE]
    /\ validationRetries = [task \in Tasks |-> 0]
    /\ crossReviewCount = [task \in Tasks |-> 0]
    /\ reDispatchCount = [task \in Tasks |-> 0]
    /\ globalFixCount = 0
    /\ mergeQueueBusy = FALSE
    /\ mergeConflictRetries = [task \in Tasks |-> 0]
    /\ confirmed = FALSE
    /\ commitCount = [task \in Tasks |-> 0]
    /\ corruptionFlag = [task \in Tasks |-> FALSE]
    /\ haltReason = "NONE"
    /\ terminalArtifact = FALSE

---------------------------------------------------------------------------
\* Pipeline-Level Actions
---------------------------------------------------------------------------

\* User confirms at the gate — advance to first tier
UserConfirms ==
    /\ pipelineState = "CONFIRMATION_GATE"
    /\ ~confirmed
    /\ confirmed' = TRUE
    /\ pipelineState' = "TIER_EXECUTING"
    /\ currentTier' = 1
    /\ UNCHANGED <<sessionState, mergeState, tddCycle, hasFailingTest,
                    validationRetries, crossReviewCount, reDispatchCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* All sessions in current tier done — transition to merging
BeginTierMerging ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ currentTier > 0
    /\ AllSessionsComplete(currentTier)
    /\ AnySessionSucceeded(currentTier)
    \* Queue all successful sessions for merge
    /\ mergeState' = [task \in Tasks |->
           IF TierOf[task] = currentTier /\ sessionState[task] = "SESSION_COMPLETE"
           THEN "QUEUED"
           ELSE mergeState[task]]
    /\ pipelineState' = "TIER_MERGING"
    /\ UNCHANGED <<currentTier, sessionState, tddCycle, hasFailingTest,
                    validationRetries, crossReviewCount, reDispatchCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* All sessions in current tier failed — halt pipeline
TierAllFailed ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ currentTier > 0
    /\ AllSessionsFailed(currentTier)
    /\ pipelineState' = "HALTED"
    /\ haltReason' = "TIER_ALL_FAILED"
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, terminalArtifact>>

\* All merges complete — run inter-tier verification
BeginInterTierVerification ==
    /\ pipelineState = "TIER_MERGING"
    /\ AllMergesComplete(currentTier)
    /\ ~mergeQueueBusy
    /\ pipelineState' = "INTER_TIER_VERIFICATION"
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Inter-tier verification passes — advance to next tier or global review
VerificationPasses ==
    /\ pipelineState = "INTER_TIER_VERIFICATION"
    /\ IF currentTier < NumTiers
       THEN /\ pipelineState' = "TIER_EXECUTING"
            /\ currentTier' = currentTier + 1
       ELSE /\ pipelineState' = "GLOBAL_REVIEW"
            /\ currentTier' = currentTier
    /\ UNCHANGED <<sessionState, mergeState, tddCycle, hasFailingTest,
                    validationRetries, crossReviewCount, reDispatchCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Inter-tier verification fails — halt (cross-tier defect)
VerificationFails ==
    /\ pipelineState = "INTER_TIER_VERIFICATION"
    /\ pipelineState' = "HALTED"
    /\ haltReason' = "VERIFICATION_FAILED"
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, terminalArtifact>>

\* Global review passes — pipeline complete
GlobalReviewPasses ==
    /\ pipelineState = "GLOBAL_REVIEW"
    /\ pipelineState' = "COMPLETE"
    /\ terminalArtifact' = TRUE
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason>>

\* Global review fails — spawn fix session (if under cap)
GlobalReviewFails ==
    /\ pipelineState = "GLOBAL_REVIEW"
    /\ globalFixCount < MaxGlobalFixes
    /\ pipelineState' = "FIX_SESSION"
    /\ globalFixCount' = globalFixCount + 1
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Global review fails and fix cap exhausted — halt (escalate to user)
GlobalReviewExhausted ==
    /\ pipelineState = "GLOBAL_REVIEW"
    /\ globalFixCount >= MaxGlobalFixes
    /\ pipelineState' = "HALTED"
    /\ haltReason' = "GLOBAL_REVIEW_EXHAUSTED"
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, terminalArtifact>>

\* Fix session completes — return to global review
FixSessionComplete ==
    /\ pipelineState = "FIX_SESSION"
    /\ pipelineState' = "GLOBAL_REVIEW"
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

---------------------------------------------------------------------------
\* Session-Level Actions (Ping-Pong TDD Protocol)
---------------------------------------------------------------------------

\* Dispatch a session for a task in the current tier
DispatchSession(task) ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ TierOf[task] = currentTier
    /\ sessionState[task] = "IDLE"
    /\ ActiveSessionCount < MaxConcurrent
    /\ sessionState' = [sessionState EXCEPT ![task] = "HANDSHAKE"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Handshake: test writer proposes, code writer confirms
CompleteHandshake(task) ==
    /\ sessionState[task] = "HANDSHAKE"
    /\ sessionState' = [sessionState EXCEPT ![task] = "RED"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* RED: test writer writes a failing test
WriteFailingTest(task) ==
    /\ sessionState[task] = "RED"
    /\ tddCycle[task] < MaxTDDCycles
    /\ sessionState' = [sessionState EXCEPT ![task] = "TEST_VALIDATION"]
    /\ hasFailingTest' = [hasFailingTest EXCEPT ![task] = TRUE]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    validationRetries, crossReviewCount, reDispatchCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* RED: TDD cycles exhausted — go to LOCAL_REVIEW only if at least 1 cycle completed (Fix 2)
TDDCyclesExhausted(task) ==
    /\ sessionState[task] = "RED"
    /\ tddCycle[task] >= MaxTDDCycles
    /\ tddCycle[task] > 0                    \* Fix 2: must have completed at least 1 cycle
    /\ sessionState' = [sessionState EXCEPT ![task] = "LOCAL_REVIEW"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* RED: TDD cycles exhausted with zero completed cycles — SESSION_FAILED (Fix 2)
TDDCyclesExhaustedNoWork(task) ==
    /\ sessionState[task] = "RED"
    /\ tddCycle[task] >= MaxTDDCycles
    /\ tddCycle[task] = 0                    \* Fix 2: no completed work
    /\ sessionState' = [sessionState EXCEPT ![task] = "SESSION_FAILED"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* TEST_VALIDATION: quality gate — test compiles and fails for behavioral reason
TestValidationPasses(task) ==
    /\ sessionState[task] = "TEST_VALIDATION"
    /\ hasFailingTest[task] = TRUE
    /\ sessionState' = [sessionState EXCEPT ![task] = "GREEN"]
    /\ validationRetries' = [validationRetries EXCEPT ![task] = 0]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, crossReviewCount, reDispatchCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* TEST_VALIDATION fails — go back to RED to rewrite test (bounded retries)
TestValidationFails(task) ==
    /\ sessionState[task] = "TEST_VALIDATION"
    /\ validationRetries[task] < MaxValidationRetries
    /\ hasFailingTest' = [hasFailingTest EXCEPT ![task] = FALSE]
    /\ validationRetries' = [validationRetries EXCEPT ![task] = @ + 1]
    /\ sessionState' = [sessionState EXCEPT ![task] = "RED"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    crossReviewCount, reDispatchCount, globalFixCount,
                    mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* TEST_VALIDATION retries exhausted — session fails
TestValidationExhausted(task) ==
    /\ sessionState[task] = "TEST_VALIDATION"
    /\ validationRetries[task] >= MaxValidationRetries
    /\ sessionState' = [sessionState EXCEPT ![task] = "SESSION_FAILED"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* GREEN: code writer makes the test pass
MakeTestPass(task) ==
    /\ sessionState[task] = "GREEN"
    /\ hasFailingTest[task] = TRUE
    /\ sessionState' = [sessionState EXCEPT ![task] = "REFACTOR_REVIEW"]
    /\ hasFailingTest' = [hasFailingTest EXCEPT ![task] = FALSE]
    /\ tddCycle' = [tddCycle EXCEPT ![task] = @ + 1]
    /\ validationRetries' = [validationRetries EXCEPT ![task] = 0]
    /\ commitCount' = [commitCount EXCEPT ![task] = @ + 1]  \* Fix 4: commit per cycle
    /\ UNCHANGED <<pipelineState, currentTier, mergeState,
                    crossReviewCount, reDispatchCount, globalFixCount,
                    mergeQueueBusy, mergeConflictRetries, confirmed,
                    corruptionFlag, haltReason, terminalArtifact>>

\* REFACTOR_REVIEW: in-cycle review — continue TDD or go to local review
ContinueTDD(task) ==
    /\ sessionState[task] = "REFACTOR_REVIEW"
    /\ tddCycle[task] < MaxTDDCycles
    /\ sessionState' = [sessionState EXCEPT ![task] = "HANDSHAKE"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

TaskComplete(task) ==
    /\ sessionState[task] = "REFACTOR_REVIEW"
    /\ sessionState' = [sessionState EXCEPT ![task] = "LOCAL_REVIEW"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* LOCAL_REVIEW: 5-point checklist + mutual cross-review (bounded)
LocalReviewPasses(task) ==
    /\ sessionState[task] = "LOCAL_REVIEW"
    /\ sessionState' = [sessionState EXCEPT ![task] = "SESSION_COMPLETE"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Cross-review finds issues — fix and re-review (bounded)
LocalReviewNeedsFix(task) ==
    /\ sessionState[task] = "LOCAL_REVIEW"
    /\ crossReviewCount[task] < MaxCrossReview
    /\ crossReviewCount' = [crossReviewCount EXCEPT ![task] = @ + 1]
    /\ sessionState' = [sessionState EXCEPT ![task] = "HANDSHAKE"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, reDispatchCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Cross-review exhausted — session fails
LocalReviewExhausted(task) ==
    /\ sessionState[task] = "LOCAL_REVIEW"
    /\ crossReviewCount[task] >= MaxCrossReview
    /\ sessionState' = [sessionState EXCEPT ![task] = "SESSION_FAILED"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Session failure — can happen at any active state including TEST_VALIDATION
\* and LOCAL_REVIEW due to agent crash etc. (Fix 5)
SessionFails(task) ==
    /\ sessionState[task] \in {"HANDSHAKE", "RED", "GREEN", "REFACTOR_REVIEW",
                                "TEST_VALIDATION", "LOCAL_REVIEW"}
    /\ sessionState' = [sessionState EXCEPT ![task] = "SESSION_FAILED"]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Session failure due to filesystem corruption — sets corruption flag (Fix 1)
SessionFailsCorruption(task) ==
    /\ sessionState[task] \in {"HANDSHAKE", "RED", "GREEN", "REFACTOR_REVIEW",
                                "TEST_VALIDATION", "LOCAL_REVIEW"}
    /\ sessionState' = [sessionState EXCEPT ![task] = "SESSION_FAILED"]
    /\ corruptionFlag' = [corruptionFlag EXCEPT ![task] = TRUE]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, haltReason, terminalArtifact>>

\* Re-dispatch failed session — logic error re-dispatch inherits context (Fix 1)
\* Preserves tddCycle, hasFailingTest, commitCount; resets only validationRetries
ReDispatchSession(task) ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ TierOf[task] = currentTier
    /\ sessionState[task] = "SESSION_FAILED"
    /\ ~corruptionFlag[task]                  \* Fix 1: not a corruption failure
    /\ reDispatchCount[task] < MaxReDispatches
    /\ ActiveSessionCount < MaxConcurrent
    /\ sessionState' = [sessionState EXCEPT ![task] = "HANDSHAKE"]
    /\ validationRetries' = [validationRetries EXCEPT ![task] = 0]
    /\ reDispatchCount' = [reDispatchCount EXCEPT ![task] = @ + 1]
    \* Fix 1: inherit tddCycle, hasFailingTest, crossReviewCount, commitCount
    /\ UNCHANGED <<pipelineState, currentTier, mergeState, tddCycle,
                    hasFailingTest, crossReviewCount,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Re-dispatch failed session — corruption re-dispatch does full reset (Fix 1)
ReDispatchSessionCorruption(task) ==
    /\ pipelineState = "TIER_EXECUTING"
    /\ TierOf[task] = currentTier
    /\ sessionState[task] = "SESSION_FAILED"
    /\ corruptionFlag[task] = TRUE            \* Fix 1: corruption-triggered
    /\ reDispatchCount[task] < MaxReDispatches
    /\ ActiveSessionCount < MaxConcurrent
    /\ sessionState' = [sessionState EXCEPT ![task] = "HANDSHAKE"]
    /\ tddCycle' = [tddCycle EXCEPT ![task] = 0]
    /\ hasFailingTest' = [hasFailingTest EXCEPT ![task] = FALSE]
    /\ validationRetries' = [validationRetries EXCEPT ![task] = 0]
    /\ crossReviewCount' = [crossReviewCount EXCEPT ![task] = 0]
    /\ commitCount' = [commitCount EXCEPT ![task] = 0]
    /\ corruptionFlag' = [corruptionFlag EXCEPT ![task] = FALSE]
    /\ reDispatchCount' = [reDispatchCount EXCEPT ![task] = @ + 1]
    /\ UNCHANGED <<pipelineState, currentTier, mergeState,
                    globalFixCount, mergeQueueBusy, mergeConflictRetries, confirmed,
                    haltReason, terminalArtifact>>

---------------------------------------------------------------------------
\* Merge Queue Actions (Serialized)
---------------------------------------------------------------------------

\* Begin merging the next queued task (serialized — one at a time)
BeginMerge(task) ==
    /\ pipelineState = "TIER_MERGING"
    /\ mergeState[task] = "QUEUED"
    /\ ~mergeQueueBusy
    /\ mergeState' = [mergeState EXCEPT ![task] = "MERGING"]
    /\ mergeQueueBusy' = TRUE
    /\ UNCHANGED <<pipelineState, currentTier, sessionState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Merge succeeds — run post-merge test
MergeSucceeds(task) ==
    /\ mergeState[task] = "MERGING"
    /\ mergeState' = [mergeState EXCEPT ![task] = "POST_MERGE_TEST"]
    /\ UNCHANGED <<pipelineState, currentTier, sessionState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy,
                    mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Post-merge test passes — merge complete, release queue
PostMergeTestPasses(task) ==
    /\ mergeState[task] = "POST_MERGE_TEST"
    /\ mergeState' = [mergeState EXCEPT ![task] = "MERGE_COMPLETE"]
    /\ mergeQueueBusy' = FALSE
    /\ UNCHANGED <<pipelineState, currentTier, sessionState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Post-merge test fails — treat as merge conflict
PostMergeTestFails(task) ==
    /\ mergeState[task] = "POST_MERGE_TEST"
    /\ mergeState' = [mergeState EXCEPT ![task] = "MERGE_CONFLICT"]
    /\ mergeQueueBusy' = FALSE
    /\ UNCHANGED <<pipelineState, currentTier, sessionState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Merge conflict from the merge step itself
MergeConflict(task) ==
    /\ mergeState[task] = "MERGING"
    /\ mergeState' = [mergeState EXCEPT ![task] = "MERGE_CONFLICT"]
    /\ mergeQueueBusy' = FALSE
    /\ UNCHANGED <<pipelineState, currentTier, sessionState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Merge conflict resolved — re-queue (bounded by MaxMergeConflictRetries, Fix 7)
MergeConflictResolved(task) ==
    /\ pipelineState = "TIER_MERGING"
    /\ mergeState[task] = "MERGE_CONFLICT"
    /\ mergeConflictRetries[task] < MaxMergeConflictRetries
    /\ ~mergeQueueBusy
    /\ mergeState' = [mergeState EXCEPT ![task] = "QUEUED"]
    /\ mergeConflictRetries' = [mergeConflictRetries EXCEPT ![task] = @ + 1]
    /\ UNCHANGED <<pipelineState, currentTier, sessionState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeQueueBusy, confirmed,
                    commitCount, corruptionFlag, haltReason, terminalArtifact>>

\* Merge conflict unresolvable — escalate (halt) (Fix 3: guarded)
MergeConflictEscalates(task) ==
    /\ pipelineState = "TIER_MERGING"
    /\ mergeState[task] = "MERGE_CONFLICT"
    /\ mergeConflictRetries[task] >= MaxMergeConflictRetries  \* Fix 3: must exhaust retries first
    /\ pipelineState' = "HALTED"
    /\ haltReason' = "MERGE_CONFLICT_UNRESOLVABLE"
    /\ mergeQueueBusy' = FALSE
    /\ UNCHANGED <<currentTier, sessionState, mergeState, tddCycle,
                    hasFailingTest, validationRetries, crossReviewCount,
                    reDispatchCount, globalFixCount, mergeConflictRetries, confirmed,
                    commitCount, corruptionFlag, terminalArtifact>>

---------------------------------------------------------------------------
\* Next State Relation
---------------------------------------------------------------------------

Next ==
    \* Pipeline-level transitions
    \/ UserConfirms
    \/ BeginTierMerging
    \/ TierAllFailed
    \/ BeginInterTierVerification
    \/ VerificationPasses
    \/ VerificationFails
    \/ GlobalReviewPasses
    \/ GlobalReviewFails
    \/ GlobalReviewExhausted
    \/ FixSessionComplete
    \* Session-level transitions
    \/ \E task \in Tasks : DispatchSession(task)
    \/ \E task \in Tasks : CompleteHandshake(task)
    \/ \E task \in Tasks : WriteFailingTest(task)
    \/ \E task \in Tasks : TDDCyclesExhausted(task)
    \/ \E task \in Tasks : TDDCyclesExhaustedNoWork(task)
    \/ \E task \in Tasks : TestValidationPasses(task)
    \/ \E task \in Tasks : TestValidationFails(task)
    \/ \E task \in Tasks : TestValidationExhausted(task)
    \/ \E task \in Tasks : MakeTestPass(task)
    \/ \E task \in Tasks : ContinueTDD(task)
    \/ \E task \in Tasks : TaskComplete(task)
    \/ \E task \in Tasks : LocalReviewPasses(task)
    \/ \E task \in Tasks : LocalReviewNeedsFix(task)
    \/ \E task \in Tasks : LocalReviewExhausted(task)
    \/ \E task \in Tasks : SessionFails(task)
    \/ \E task \in Tasks : SessionFailsCorruption(task)
    \/ \E task \in Tasks : ReDispatchSession(task)
    \/ \E task \in Tasks : ReDispatchSessionCorruption(task)
    \* Merge queue transitions
    \/ \E task \in Tasks : BeginMerge(task)
    \/ \E task \in Tasks : MergeSucceeds(task)
    \/ \E task \in Tasks : PostMergeTestPasses(task)
    \/ \E task \in Tasks : PostMergeTestFails(task)
    \/ \E task \in Tasks : MergeConflict(task)
    \/ \E task \in Tasks : MergeConflictResolved(task)
    \/ \E task \in Tasks : MergeConflictEscalates(task)

\* Terminal predicate — COMPLETE and HALTED are intentional final states
Terminated == pipelineState \in {"COMPLETE", "HALTED"}

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

---------------------------------------------------------------------------
\* Safety Properties
---------------------------------------------------------------------------

\* S1: Merge queue is serialized — at most one task is MERGING at a time
SerializedMergeQueue ==
    Cardinality({task \in Tasks : mergeState[task] = "MERGING"}) <= 1

\* S2: TDD ordering — every GREEN phase requires a failing test
TDDOrdering ==
    \A task \in Tasks :
        sessionState[task] = "GREEN" => hasFailingTest[task] = TRUE

\* S3: Global review fix iterations never exceed cap
GlobalFixBounded ==
    globalFixCount <= MaxGlobalFixes

\* S4: Cross-review iterations are bounded
CrossReviewBounded ==
    \A task \in Tasks : crossReviewCount[task] <= MaxCrossReview

\* S5: No tier N+1 starts before tier N is verified
\* (currentTier only advances through VerificationPasses)
TierOrderingValid ==
    \A task \in Tasks :
        sessionState[task] \notin {"IDLE", "SESSION_COMPLETE", "SESSION_FAILED"} =>
            TierOf[task] = currentTier

\* S6: Concurrent sessions respect the worktree cap
ConcurrencyBounded ==
    ActiveSessionCount <= MaxConcurrent

\* S7: Pipeline cannot be in COMPLETE without having been confirmed
CompletionRequiresConfirmation ==
    pipelineState = "COMPLETE" => confirmed = TRUE

\* S8: No merging happens during tier execution
NoMergeDuringExecution ==
    pipelineState = "TIER_EXECUTING" =>
        \A task \in Tasks : mergeState[task] \in {"NOT_QUEUED", "MERGE_COMPLETE"}

\* S9: Re-dispatch count is bounded
ReDispatchBounded ==
    \A task \in Tasks : reDispatchCount[task] <= MaxReDispatches

\* S10: Commit count equals TDD cycle count for completed sessions (Fix 4)
CommitCountMatchesCycles ==
    \A task \in Tasks :
        sessionState[task] = "SESSION_COMPLETE" => commitCount[task] = tddCycle[task]

\* S11: Merge conflict retries bounded by dedicated constant (Fix 7)
MergeConflictRetriesBounded ==
    \A task \in Tasks : mergeConflictRetries[task] <= MaxMergeConflictRetries

\* S12: Terminal artifact only set when pipeline is COMPLETE (additional)
TerminalArtifactOnlyOnComplete ==
    terminalArtifact = TRUE => pipelineState = "COMPLETE"

\* S13: Halt reason is NONE only when not halted (additional)
HaltReasonConsistent ==
    (pipelineState = "HALTED") => (haltReason /= "NONE")

---------------------------------------------------------------------------
\* Liveness Properties
---------------------------------------------------------------------------

\* L1: Every dispatched session eventually completes, fails, or pipeline halts
SessionTerminates ==
    \A task \in Tasks :
        sessionState[task] = "HANDSHAKE" ~>
            (sessionState[task] \in {"SESSION_COMPLETE", "SESSION_FAILED"}
             \/ pipelineState = "HALTED")

\* L2: Every tier eventually completes processing or pipeline halts
TierTerminates ==
    (pipelineState = "TIER_EXECUTING") ~>
        (pipelineState \in {"TIER_MERGING", "HALTED"})

\* L3: Pipeline eventually reaches COMPLETE or HALTED
PipelineTerminates ==
    (pipelineState = "CONFIRMATION_GATE" /\ confirmed) ~>
        (pipelineState \in {"COMPLETE", "HALTED"})

\* L4: Every queued merge eventually completes, conflicts, or pipeline halts (Fix 6)
MergeQueueProgress ==
    \A task \in Tasks :
        mergeState[task] = "QUEUED" ~>
            (mergeState[task] \in {"MERGE_COMPLETE", "MERGE_CONFLICT"}
             \/ pipelineState = "HALTED")

=============================================================================
