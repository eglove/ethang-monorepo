--------------------------- MODULE CleanupImprovements ---------------------------
(* version: 1.0.0 *)
(*
 * TLA+ Specification: vibe-cli Cleanup Improvements
 * Source: docs/cleanup-improvements/bdd.feature (2026-04-11, round 4 amendments)
 * Revision: Addresses all debate objections (3 CRITICAL + 3 HIGH)
 *           + Fix for liveness violation: crash budget bounds LockGoesStale
 *
 * Models the core pipeline orchestration covering:
 *   - Pipeline lifecycle (stages 1-8, lock, resume)
 *   - Parallel task execution within tiers (fan-out, atomic completion counter)
 *   - Worktree and warden lifecycle per task
 *   - Merge serialization with mutex (completion-time ordering)
 *   - Coverage gate with dual caps (coverage iteration cap + TDD cycle cap)
 *   - Fixture generation and precondition checks
 *   - Abort cleanup (Ctrl+C / CancelKeyPress)
 *   - Claude API transient failure retry
 *   - Idempotency tokens for --resume
 *   - Stale lock detection and recovery (bounded crashes)
 *   - Review gate failure path
 *
 * Fixes from debate review:
 *   [CRITICAL-1] Init is now non-deterministic for isResuming and fixture state
 *   [CRITICAL-2] Resume to coding stage requires valid fixtures (no deadlock)
 *   [CRITICAL-3] LockGoesStale action added — stale lock detection is exercised
 *   [HIGH-1]     ReviewGateFail action added — review_gate has an exit on failure
 *   [HIGH-2]     TaskTimeout covers executing, coverage_gate, review_gate, merge_waiting
 *   [HIGH-3]     WF added for all failure/crash transitions
 *
 * Liveness fixes:
 *   [LIVENESS-1] Added crashCount variable bounded by MaxCrashes to prevent
 *                infinite crash-resume cycles that violate liveness properties.
 *                Without this bound, TLC finds a counterexample where the system
 *                alternates LockGoesStale → ResumeAcquireLock forever, preventing
 *                pipeline completion.
 *   [LIVENESS-2] LockGoesStale now fully resets worktreeState to "none" for all
 *                tasks (not conditionally to "removed"). The prior conditional
 *                reset left tasks with worktreeState="removed" after crash, but
 *                CreateWorktree requires "none", permanently disabling worktree
 *                creation for those tasks and deadlocking the tier on resume.
 *   [LIVENESS-3] TasksEventuallyTerminate consequent now includes
 *                \/ pipelineAborted. A crash resets active tasks to "idle",
 *                and if a subsequent abort fires while those tasks are still
 *                "idle", AbortCleanup does not re-fail them (it only fails
 *                in-flight tasks). The original property required terminal
 *                states unconditionally, which is violated by this legitimate
 *                crash-then-abort sequence.
 *)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    T1, T2, T3,         \* Model values for task identifiers
    Tasks,              \* Set of task identifiers (e.g., {T1, T2, T3})
    MaxTiers,           \* Number of tiers (e.g., 2)
    TierAssignment,     \* Function: task -> tier number
    MaxTDDCycles,       \* TDD cycle cap per task (e.g., 3)
    MaxCoverageIter,    \* Coverage iteration cap per task (e.g., 2)
    MaxRetries,         \* API/merge retry cap (e.g., 2)
    NumStages,          \* Total pipeline stages (e.g., 4 — abstracted from 8)
    FixtureGenAfter,    \* Set of stages after which fixture generation runs (e.g., {2, 3})
    MaxCrashes          \* Maximum number of environment-injected crashes (e.g., 2)

VARIABLES
    \* --- Pipeline-level state ---
    pipelineStage,      \* Current stage: 0 (not started) .. NumStages+1 (complete)
    pipelineLock,       \* Lock state: "free" | "held" | "stale"
    pipelineAborted,    \* Boolean: has abort been triggered?
    abortCleanupDone,   \* Boolean: has abort cleanup completed?
    runId,              \* "none" | "active" (abstracted — just tracks existence)

    \* --- Fixture state ---
    bddFixture,         \* "missing" | "generating" | "valid" | "corrupt"
    tlcFixture,         \* "missing" | "generating" | "valid" | "corrupt"

    \* --- Tier-level state ---
    currentTier,        \* Which tier is active (0 = none, 1..MaxTiers)
    tierComplete,       \* Function: tier -> Boolean

    \* --- Task-level state ---
    taskState,          \* Function: task -> state enum
    worktreeState,      \* Function: task -> "none" | "creating" | "active" | "removed"
    wardenState,        \* Function: task -> "unconfigured" | "configuring" | "active" | "failed"
    coverageIter,       \* Function: task -> coverage iteration count
    tddIter,            \* Function: task -> TDD cycle iteration count
    coveragePBT,        \* Function: task -> "unknown" | "pass" | "fail"
    coverageContract,   \* Function: task -> "unknown" | "pass" | "fail"
    coverageE2E,        \* Function: task -> "unknown" | "pass" | "fail"
    mergeState,         \* Function: task -> "none" | "waiting" | "merging" | "merged" | "conflict" | "failed"
    completionCounter,  \* Function: tier -> count of completed/failed tasks
    mergeMutex,         \* "free" | task holding it
    apiRetries,         \* Function: task -> current retry count

    \* --- Idempotency ---
    idempotencyTokens,  \* Set of {stage, status} records: status in {"invoked", "complete"}

    \* --- Resume state ---
    isResuming,         \* Boolean: is this a --resume invocation?

    \* --- Environment crash budget ---
    crashCount          \* Number of crashes injected so far (bounded by MaxCrashes)

vars == <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
          runId, bddFixture, tlcFixture, currentTier, tierComplete,
          taskState, worktreeState, wardenState, coverageIter, tddIter,
          coveragePBT, coverageContract, coverageE2E, mergeState,
          completionCounter, mergeMutex, apiRetries, idempotencyTokens,
          isResuming, crashCount>>

\* ============================================================================
\* Helper Definitions
\* ============================================================================

TasksInTier(tier) == {t \in Tasks : TierAssignment[t] = tier}

AllTasksInTierDone(tier) ==
    \A t \in TasksInTier(tier) :
        taskState[t] \in {"merged", "failed", "timed_out"}

AnyTaskInTierSucceeded(tier) ==
    \E t \in TasksInTier(tier) : taskState[t] = "merged"

CompletionCount(tier) ==
    Cardinality({t \in TasksInTier(tier) :
        taskState[t] \in {"merged", "failed", "timed_out"}})

TaskStates == {"idle", "worktree_creating", "warden_configuring",
               "deps_installing", "executing", "coverage_gate",
               "review_gate", "merge_waiting", "merging",
               "merged", "failed", "timed_out", "escalated"}

\* Active task states — states where a task is "in-flight" and can time out
ActiveTaskStates == {"executing", "coverage_gate", "review_gate", "merge_waiting"}

\* Is the pipeline in the coding stage (the last stage, abstracted)?
InCodingStage == pipelineStage = NumStages

\* ============================================================================
\* Type Invariant
\* ============================================================================

TypeOK ==
    /\ pipelineStage \in 0..(NumStages + 1)
    /\ pipelineLock \in {"free", "held", "stale"}
    /\ pipelineAborted \in BOOLEAN
    /\ abortCleanupDone \in BOOLEAN
    /\ runId \in {"none", "active"}
    /\ bddFixture \in {"missing", "generating", "valid", "corrupt"}
    /\ tlcFixture \in {"missing", "generating", "valid", "corrupt"}
    /\ currentTier \in 0..MaxTiers
    /\ \A tier \in 1..MaxTiers : tierComplete[tier] \in BOOLEAN
    /\ \A t \in Tasks : taskState[t] \in TaskStates
    /\ \A t \in Tasks : worktreeState[t] \in {"none", "creating", "active", "removed"}
    /\ \A t \in Tasks : wardenState[t] \in {"unconfigured", "configuring", "active", "failed"}
    /\ \A t \in Tasks : coverageIter[t] \in 0..MaxCoverageIter
    /\ \A t \in Tasks : tddIter[t] \in 0..MaxTDDCycles
    /\ \A t \in Tasks : coveragePBT[t] \in {"unknown", "pass", "fail"}
    /\ \A t \in Tasks : coverageContract[t] \in {"unknown", "pass", "fail"}
    /\ \A t \in Tasks : coverageE2E[t] \in {"unknown", "pass", "fail"}
    /\ \A t \in Tasks : mergeState[t] \in {"none", "waiting", "merging", "merged", "conflict", "failed"}
    /\ \A tier \in 1..MaxTiers :
        completionCounter[tier] \in 0..Cardinality(TasksInTier(tier))
    /\ mergeMutex \in {"free"} \cup Tasks
    /\ \A t \in Tasks : apiRetries[t] \in 0..MaxRetries
    /\ isResuming \in BOOLEAN
    /\ crashCount \in 0..MaxCrashes

\* ============================================================================
\* Initial State
\* [CRITICAL-1] Non-deterministic: fresh start OR resume with prior state
\* ============================================================================

(* Fresh start — pipeline begins from scratch *)
InitFresh ==
    /\ pipelineStage = 0
    /\ pipelineLock = "free"
    /\ pipelineAborted = FALSE
    /\ abortCleanupDone = FALSE
    /\ runId = "none"
    /\ bddFixture = "missing"
    /\ tlcFixture = "missing"
    /\ currentTier = 0
    /\ tierComplete = [tier \in 1..MaxTiers |-> FALSE]
    /\ taskState = [t \in Tasks |-> "idle"]
    /\ worktreeState = [t \in Tasks |-> "none"]
    /\ wardenState = [t \in Tasks |-> "unconfigured"]
    /\ coverageIter = [t \in Tasks |-> 0]
    /\ tddIter = [t \in Tasks |-> 0]
    /\ coveragePBT = [t \in Tasks |-> "unknown"]
    /\ coverageContract = [t \in Tasks |-> "unknown"]
    /\ coverageE2E = [t \in Tasks |-> "unknown"]
    /\ mergeState = [t \in Tasks |-> "none"]
    /\ completionCounter = [tier \in 1..MaxTiers |-> 0]
    /\ mergeMutex = "free"
    /\ apiRetries = [t \in Tasks |-> 0]
    /\ idempotencyTokens = {}
    /\ isResuming = FALSE
    /\ crashCount = 0

(* Resume start — models --resume with a prior crashed/aborted run.
   [CRITICAL-1] isResuming = TRUE is now reachable from Init.
   [CRITICAL-2] Fixture state is non-deterministic but constrained:
     - Fixtures may be "missing" or "valid" (modeling partial prior progress)
     - The lock may be "free" (clean shutdown) or "stale" (crash) *)
InitResume ==
    /\ pipelineStage = 0
    /\ pipelineLock \in {"free", "stale"}
    /\ pipelineAborted = FALSE
    /\ abortCleanupDone = FALSE
    /\ runId = "none"
    /\ bddFixture \in {"missing", "valid"}
    /\ tlcFixture \in {"missing", "valid"}
    /\ currentTier = 0
    /\ tierComplete = [tier \in 1..MaxTiers |-> FALSE]
    /\ taskState = [t \in Tasks |-> "idle"]
    /\ worktreeState = [t \in Tasks |-> "none"]
    /\ wardenState = [t \in Tasks |-> "unconfigured"]
    /\ coverageIter = [t \in Tasks |-> 0]
    /\ tddIter = [t \in Tasks |-> 0]
    /\ coveragePBT = [t \in Tasks |-> "unknown"]
    /\ coverageContract = [t \in Tasks |-> "unknown"]
    /\ coverageE2E = [t \in Tasks |-> "unknown"]
    /\ mergeState = [t \in Tasks |-> "none"]
    /\ completionCounter = [tier \in 1..MaxTiers |-> 0]
    /\ mergeMutex = "free"
    /\ apiRetries = [t \in Tasks |-> 0]
    /\ idempotencyTokens = {}
    /\ isResuming = TRUE
    /\ crashCount = 0

(* Init is the disjunction of fresh and resume starts *)
Init ==
    \/ InitFresh
    \/ InitResume

\* ============================================================================
\* Pipeline Lifecycle Actions
\* ============================================================================

(* Acquire the pipeline lock and start a fresh run *)
AcquireLockFresh ==
    /\ pipelineStage = 0
    /\ pipelineLock = "free"
    /\ ~isResuming
    /\ pipelineLock' = "held"
    /\ runId' = "active"
    /\ pipelineStage' = 1
    /\ idempotencyTokens' = idempotencyTokens \cup {[stage |-> 1, status |-> "invoked"]}
    /\ UNCHANGED <<pipelineAborted, abortCleanupDone, bddFixture, tlcFixture,
                   currentTier, tierComplete, taskState, worktreeState, wardenState,
                   coverageIter, tddIter, coveragePBT, coverageContract, coverageE2E,
                   mergeState, completionCounter, mergeMutex, apiRetries, isResuming,
                   crashCount>>

(* Acquire a stale lock — detect and replace
   [CRITICAL-3] Now reachable because LockGoesStale can set pipelineLock = "stale" *)
AcquireStaleLock ==
    /\ pipelineStage = 0
    /\ pipelineLock = "stale"
    /\ ~isResuming
    /\ pipelineLock' = "held"
    /\ runId' = "active"
    /\ pipelineStage' = 1
    /\ idempotencyTokens' = idempotencyTokens \cup {[stage |-> 1, status |-> "invoked"]}
    /\ UNCHANGED <<pipelineAborted, abortCleanupDone, bddFixture, tlcFixture,
                   currentTier, tierComplete, taskState, worktreeState, wardenState,
                   coverageIter, tddIter, coveragePBT, coverageContract, coverageE2E,
                   mergeState, completionCounter, mergeMutex, apiRetries, isResuming,
                   crashCount>>

(* Resume: acquire lock and jump to detected resume stage.
   [CRITICAL-2] When resuming to the coding stage (NumStages), fixtures must
   already be valid — otherwise no fixture generation action is enabled at
   NumStages and the model deadlocks. The guard ensures this. *)
ResumeAcquireLock ==
    /\ pipelineStage = 0
    /\ pipelineLock \in {"free", "stale"}
    /\ isResuming
    /\ pipelineLock' = "held"
    /\ runId' = "active"
    \* Non-deterministically resume at any stage 1..NumStages (models log parsing)
    /\ \E s \in 1..NumStages :
        \* [CRITICAL-2] If resuming to the coding stage, fixtures must be valid
        /\ IF s = NumStages
           THEN bddFixture = "valid" /\ tlcFixture = "valid"
           ELSE TRUE
        /\ pipelineStage' = s
        /\ idempotencyTokens' = idempotencyTokens \cup {[stage |-> s, status |-> "invoked"]}
    /\ isResuming' = FALSE
    /\ UNCHANGED <<pipelineAborted, abortCleanupDone, bddFixture, tlcFixture,
                   currentTier, tierComplete, taskState, worktreeState, wardenState,
                   coverageIter, tddIter, coveragePBT, coverageContract, coverageE2E,
                   mergeState, completionCounter, mergeMutex, apiRetries, crashCount>>

(* [CRITICAL-3] Lock goes stale — models a crash or kill that leaves the lock
   behind without cleanup. This transitions a held lock to stale, making
   AcquireStaleLock and ResumeAcquireLock reachable.
   Modeled as an environment action: a running pipeline crashes.
   [LIVENESS-1] Bounded by MaxCrashes to prevent infinite crash-resume cycles
   that violate liveness properties. In practice, the environment can only
   inject a finite number of crashes before the system stabilizes. *)
LockGoesStale ==
    /\ pipelineStage \in 1..NumStages
    /\ pipelineLock = "held"
    /\ ~pipelineAborted
    /\ crashCount < MaxCrashes
    /\ crashCount' = crashCount + 1
    /\ pipelineLock' = "stale"
    \* Crash resets pipeline to pre-start state (the *process* died)
    /\ pipelineStage' = 0
    /\ runId' = "none"
    \* Tasks are abandoned — their state is irrelevant post-crash, but we
    \* reset to model a fresh --resume starting from scratch task-wise.
    \* [LIVENESS-2] worktreeState must be fully reset to "none" (not
    \* conditionally transitioned to "removed") because the resume handler
    \* cleans up orphaned worktrees before re-creating them. Without this,
    \* a task whose worktree was active at crash time ends up "removed",
    \* and CreateWorktree (which requires "none") is permanently disabled
    \* for that task — deadlocking the tier.
    /\ taskState' = [t \in Tasks |-> "idle"]
    /\ worktreeState' = [t \in Tasks |-> "none"]
    /\ wardenState' = [t \in Tasks |-> "unconfigured"]
    /\ currentTier' = 0
    /\ tierComplete' = [tier \in 1..MaxTiers |-> FALSE]
    /\ completionCounter' = [tier \in 1..MaxTiers |-> 0]
    /\ mergeMutex' = "free"
    /\ coverageIter' = [t \in Tasks |-> 0]
    /\ tddIter' = [t \in Tasks |-> 0]
    /\ coveragePBT' = [t \in Tasks |-> "unknown"]
    /\ coverageContract' = [t \in Tasks |-> "unknown"]
    /\ coverageE2E' = [t \in Tasks |-> "unknown"]
    /\ mergeState' = [t \in Tasks |-> "none"]
    /\ apiRetries' = [t \in Tasks |-> 0]
    \* The crashed run may be resumed — set isResuming for the next attempt
    /\ isResuming' = TRUE
    /\ UNCHANGED <<pipelineAborted, abortCleanupDone,
                   bddFixture, tlcFixture, idempotencyTokens>>

(* Advance to the next stage (stages before the coding stage) *)
AdvanceStage ==
    /\ ~pipelineAborted
    /\ pipelineLock = "held"
    /\ pipelineStage \in 1..(NumStages - 1)
    /\ ~InCodingStage
    \* Before entering the coding stage, all fixtures must be valid.
    \* Intermediate fixture-gen stages (e.g. 2→3) may advance freely
    \* because later stages can still (re)generate fixtures.
    /\ IF pipelineStage + 1 = NumStages
       THEN bddFixture = "valid" /\ tlcFixture = "valid"
       ELSE TRUE
    \* Record idempotency
    /\ idempotencyTokens' = idempotencyTokens \cup
        {[stage |-> pipelineStage, status |-> "complete"],
         [stage |-> pipelineStage + 1, status |-> "invoked"]}
    /\ pipelineStage' = pipelineStage + 1
    /\ UNCHANGED <<pipelineLock, pipelineAborted, abortCleanupDone, runId,
                   bddFixture, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, isResuming,
                   crashCount>>

(* Generate BDD fixtures (after the BDD debate stage) *)
GenerateBDDFixtures ==
    /\ ~pipelineAborted
    /\ pipelineLock = "held"
    /\ bddFixture \in {"missing", "corrupt"}
    /\ pipelineStage \in FixtureGenAfter
    /\ bddFixture' = "generating"
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* BDD fixture generation completes successfully *)
BDDFixtureComplete ==
    /\ bddFixture = "generating"
    /\ bddFixture' = "valid"
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* BDD fixture generation crashes — leaves corrupt state *)
BDDFixtureCrash ==
    /\ bddFixture = "generating"
    /\ bddFixture' = "corrupt"
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Generate TLC fixtures (after the TLA+ debate stage) *)
GenerateTLCFixtures ==
    /\ ~pipelineAborted
    /\ pipelineLock = "held"
    /\ tlcFixture \in {"missing", "corrupt"}
    /\ pipelineStage \in FixtureGenAfter
    /\ tlcFixture' = "generating"
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* TLC fixture generation completes successfully *)
TLCFixtureComplete ==
    /\ tlcFixture = "generating"
    /\ tlcFixture' = "valid"
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* TLC fixture generation crashes *)
TLCFixtureCrash ==
    /\ tlcFixture = "generating"
    /\ tlcFixture' = "corrupt"
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

\* ============================================================================
\* Coding Stage (Stage 8 abstracted as NumStages) — Tier Orchestration
\* ============================================================================

(* Enter coding stage: check fixture preconditions and start tier 1 *)
EnterCodingStage ==
    /\ InCodingStage
    /\ ~pipelineAborted
    /\ currentTier = 0
    /\ bddFixture = "valid"
    /\ tlcFixture = "valid"
    /\ currentTier' = 1
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

\* ============================================================================
\* Task Lifecycle (within a tier)
\* ============================================================================

(* Create worktree for a task — every task gets one, even single-task tiers *)
CreateWorktree(t) ==
    /\ InCodingStage
    /\ ~pipelineAborted
    /\ currentTier = TierAssignment[t]
    /\ ~tierComplete[TierAssignment[t]]
    /\ taskState[t] = "idle"
    /\ worktreeState[t] = "none"
    /\ taskState' = [taskState EXCEPT ![t] = "worktree_creating"]
    /\ worktreeState' = [worktreeState EXCEPT ![t] = "creating"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Worktree creation succeeds *)
WorktreeCreated(t) ==
    /\ taskState[t] = "worktree_creating"
    /\ worktreeState[t] = "creating"
    /\ taskState' = [taskState EXCEPT ![t] = "warden_configuring"]
    /\ worktreeState' = [worktreeState EXCEPT ![t] = "active"]
    /\ wardenState' = [wardenState EXCEPT ![t] = "configuring"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Worktree creation fails — task fails, escalation called *)
WorktreeCreationFailed(t) ==
    /\ taskState[t] = "worktree_creating"
    /\ worktreeState[t] = "creating"
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ worktreeState' = [worktreeState EXCEPT ![t] = "none"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* Warden configuration succeeds — agent can be dispatched *)
WardenConfigured(t) ==
    /\ taskState[t] = "warden_configuring"
    /\ wardenState[t] = "configuring"
    /\ wardenState' = [wardenState EXCEPT ![t] = "active"]
    /\ taskState' = [taskState EXCEPT ![t] = "deps_installing"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Warden configuration fails — task cannot proceed *)
WardenConfigFailed(t) ==
    /\ taskState[t] = "warden_configuring"
    /\ wardenState[t] = "configuring"
    /\ wardenState' = [wardenState EXCEPT ![t] = "failed"]
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* Dependencies installed — dispatch coding agent *)
DepsInstalled(t) ==
    /\ taskState[t] = "deps_installing"
    /\ wardenState[t] = "active"
    /\ taskState' = [taskState EXCEPT ![t] = "executing"]
    /\ tddIter' = [tddIter EXCEPT ![t] = 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Dependency install fails *)
DepsInstallFailed(t) ==
    /\ taskState[t] = "deps_installing"
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

\* ============================================================================
\* TDD Cycle & Coverage Gate
\* ============================================================================

(* Task finishes executing (TDD RED-GREEN-REFACTOR) and enters coverage gate *)
EnterCoverageGate(t) ==
    /\ taskState[t] = "executing"
    /\ ~pipelineAborted
    /\ taskState' = [taskState EXCEPT ![t] = "coverage_gate"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Coverage gate: all three categories pass *)
CoverageGatePass(t) ==
    /\ taskState[t] = "coverage_gate"
    /\ ~pipelineAborted
    \* Non-deterministically all pass
    /\ coveragePBT' = [coveragePBT EXCEPT ![t] = "pass"]
    /\ coverageContract' = [coverageContract EXCEPT ![t] = "pass"]
    /\ coverageE2E' = [coverageE2E EXCEPT ![t] = "pass"]
    /\ taskState' = [taskState EXCEPT ![t] = "review_gate"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   mergeState, completionCounter, mergeMutex, apiRetries,
                   idempotencyTokens, isResuming, crashCount>>

(* Coverage gate: at least one category fails — return to GREEN phase *)
CoverageGateFail(t) ==
    /\ taskState[t] = "coverage_gate"
    /\ ~pipelineAborted
    /\ coverageIter[t] < MaxCoverageIter
    /\ tddIter[t] < MaxTDDCycles
    \* Increment both counters (each coverage failure = 1 TDD iteration consumed)
    /\ coverageIter' = [coverageIter EXCEPT ![t] = coverageIter[t] + 1]
    /\ tddIter' = [tddIter EXCEPT ![t] = tddIter[t] + 1]
    /\ taskState' = [taskState EXCEPT ![t] = "executing"]
    \* Reset coverage results for re-evaluation
    /\ coveragePBT' = [coveragePBT EXCEPT ![t] = "unknown"]
    /\ coverageContract' = [coverageContract EXCEPT ![t] = "unknown"]
    /\ coverageE2E' = [coverageE2E EXCEPT ![t] = "unknown"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState,
                   mergeState, completionCounter, mergeMutex, apiRetries,
                   idempotencyTokens, isResuming, crashCount>>

(* Coverage gate failure exhausts coverage iteration cap *)
CoverageCapExhausted(t) ==
    /\ taskState[t] = "coverage_gate"
    /\ coverageIter[t] >= MaxCoverageIter
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   mergeState, mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* TDD cycle cap exhausted while in coverage gate *)
TDDCapExhausted(t) ==
    /\ taskState[t] = "coverage_gate"
    /\ tddIter[t] >= MaxTDDCycles
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   mergeState, mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* Task times out during any active state.
   [HIGH-2] Extended from "executing" only to all active task states:
   executing, coverage_gate, review_gate, merge_waiting.
   Models the 30-minute watchdog from BDD scenarios. *)
TaskTimeout(t) ==
    /\ taskState[t] \in ActiveTaskStates
    /\ taskState' = [taskState EXCEPT ![t] = "timed_out"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   mergeState, mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

\* ============================================================================
\* Review Gate & Merge
\* ============================================================================

(* Review gate passes — task enters merge queue *)
ReviewGatePass(t) ==
    /\ taskState[t] = "review_gate"
    /\ ~pipelineAborted
    /\ taskState' = [taskState EXCEPT ![t] = "merge_waiting"]
    /\ mergeState' = [mergeState EXCEPT ![t] = "waiting"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* [HIGH-1] Review gate fails — task fails with escalation.
   Without this action, a task in review_gate with no passing path would
   deadlock (Next disabled). This models review rejection. *)
ReviewGateFail(t) ==
    /\ taskState[t] = "review_gate"
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   mergeState, mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* Acquire merge mutex — serialized by completion order *)
AcquireMergeMutex(t) ==
    /\ taskState[t] = "merge_waiting"
    /\ mergeState[t] = "waiting"
    /\ mergeMutex = "free"
    /\ ~pipelineAborted
    /\ mergeMutex' = t
    /\ taskState' = [taskState EXCEPT ![t] = "merging"]
    /\ mergeState' = [mergeState EXCEPT ![t] = "merging"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   completionCounter, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* Merge succeeds — worktree removed, warden torn down *)
MergeSuccess(t) ==
    /\ taskState[t] = "merging"
    /\ mergeMutex = t
    /\ mergeState' = [mergeState EXCEPT ![t] = "merged"]
    /\ taskState' = [taskState EXCEPT ![t] = "merged"]
    /\ worktreeState' = [worktreeState EXCEPT ![t] = "removed"]
    /\ wardenState' = [wardenState EXCEPT ![t] = "unconfigured"]
    /\ mergeMutex' = "free"
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   apiRetries, idempotencyTokens, isResuming, crashCount>>

(* Merge conflict detected — release mutex, bump retry, return to waiting *)
MergeConflict(t) ==
    /\ taskState[t] = "merging"
    /\ mergeMutex = t
    /\ apiRetries[t] < MaxRetries
    /\ mergeState' = [mergeState EXCEPT ![t] = "waiting"]
    /\ mergeMutex' = "free"
    /\ apiRetries' = [apiRetries EXCEPT ![t] = apiRetries[t] + 1]
    /\ taskState' = [taskState EXCEPT ![t] = "merge_waiting"]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   completionCounter, idempotencyTokens, isResuming, crashCount>>

(* Merge conflict exhausts retries *)
MergeConflictExhausted(t) ==
    /\ taskState[t] = "merging"
    /\ mergeMutex = t
    /\ apiRetries[t] >= MaxRetries
    /\ mergeState' = [mergeState EXCEPT ![t] = "failed"]
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ mergeMutex' = "free"
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   apiRetries, idempotencyTokens, isResuming, crashCount>>

(* Merge mutex timeout — task waiting for merge mutex times out *)
MergeMutexTimeout(t) ==
    /\ taskState[t] = "merge_waiting"
    /\ mergeState[t] = "waiting"
    /\ mergeMutex \in Tasks  \* Another task holds the mutex
    /\ mergeMutex /= t
    /\ taskState' = [taskState EXCEPT ![t] = "failed"]
    /\ mergeState' = [mergeState EXCEPT ![t] = "failed"]
    /\ completionCounter' = [completionCounter EXCEPT
        ![TierAssignment[t]] = completionCounter[TierAssignment[t]] + 1]
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E,
                   mergeMutex, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

\* ============================================================================
\* Tier Advancement
\* ============================================================================

(* All tasks in current tier done — advance to next tier *)
AdvanceTier ==
    /\ InCodingStage
    /\ ~pipelineAborted
    /\ currentTier \in 1..MaxTiers
    /\ ~tierComplete[currentTier]
    /\ completionCounter[currentTier] = Cardinality(TasksInTier(currentTier))
    /\ AnyTaskInTierSucceeded(currentTier)
    /\ tierComplete' = [tierComplete EXCEPT ![currentTier] = TRUE]
    /\ IF currentTier < MaxTiers
       THEN currentTier' = currentTier + 1
       ELSE currentTier' = currentTier  \* Stay — pipeline completion handles this
    /\ UNCHANGED <<pipelineStage, pipelineLock, pipelineAborted, abortCleanupDone,
                   runId, bddFixture, tlcFixture,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* All tasks in tier failed — tier fails, pipeline halts *)
TierAllFailed ==
    /\ InCodingStage
    /\ ~pipelineAborted
    /\ currentTier \in 1..MaxTiers
    /\ ~tierComplete[currentTier]
    /\ completionCounter[currentTier] = Cardinality(TasksInTier(currentTier))
    /\ ~AnyTaskInTierSucceeded(currentTier)
    /\ pipelineAborted' = TRUE
    /\ UNCHANGED <<pipelineStage, pipelineLock, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

\* ============================================================================
\* Pipeline Completion
\* ============================================================================

PipelineComplete ==
    /\ InCodingStage
    /\ ~pipelineAborted
    /\ \A tier \in 1..MaxTiers : tierComplete[tier]
    /\ pipelineStage' = NumStages + 1
    /\ pipelineLock' = "free"
    /\ idempotencyTokens' = idempotencyTokens \cup
        {[stage |-> NumStages, status |-> "complete"]}
    /\ UNCHANGED <<pipelineAborted, abortCleanupDone, runId,
                   bddFixture, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, isResuming,
                   crashCount>>

\* ============================================================================
\* Abort (Ctrl+C / CancelKeyPress)
\* ============================================================================

(* Abort triggered at any point during execution *)
AbortTriggered ==
    /\ pipelineStage \in 1..NumStages
    /\ pipelineLock = "held"
    /\ ~pipelineAborted
    /\ pipelineAborted' = TRUE
    /\ UNCHANGED <<pipelineStage, pipelineLock, abortCleanupDone,
                   runId, bddFixture, tlcFixture, currentTier, tierComplete,
                   taskState, worktreeState, wardenState, coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, mergeMutex, apiRetries, idempotencyTokens,
                   isResuming, crashCount>>

(* Abort cleanup: remove worktrees, tear down wardens, release lock, write ABORT marker *)
AbortCleanup ==
    /\ pipelineAborted
    /\ ~abortCleanupDone
    /\ pipelineLock = "held"
    \* Release the lock
    /\ pipelineLock' = "free"
    \* Remove all active worktrees
    /\ worktreeState' = [t \in Tasks |->
        IF worktreeState[t] \in {"creating", "active"} THEN "removed"
        ELSE worktreeState[t]]
    \* Tear down wardens whose worktrees are being removed
    /\ wardenState' = [t \in Tasks |->
        IF wardenState[t] \in {"configuring", "active"} THEN "failed"
        ELSE wardenState[t]]
    \* Terminate running tasks
    /\ taskState' = [t \in Tasks |->
        IF taskState[t] \in {"worktree_creating", "warden_configuring",
                             "deps_installing", "executing", "coverage_gate",
                             "review_gate", "merge_waiting", "merging"}
        THEN "failed"
        ELSE taskState[t]]
    \* Release merge mutex if held
    /\ mergeMutex' = "free"
    /\ abortCleanupDone' = TRUE
    /\ UNCHANGED <<pipelineStage, pipelineAborted, runId,
                   bddFixture, tlcFixture, currentTier, tierComplete,
                   coverageIter, tddIter,
                   coveragePBT, coverageContract, coverageE2E, mergeState,
                   completionCounter, apiRetries, idempotencyTokens, isResuming,
                   crashCount>>

(* Terminal state: pipeline finished (normally or via abort) — explicit stutter *)
Done ==
    /\ \/ pipelineStage = NumStages + 1                  \* Normal completion
       \/ (pipelineAborted /\ abortCleanupDone)          \* Abort completed
    /\ UNCHANGED vars

\* ============================================================================
\* Next-State Relation
\* ============================================================================

Next ==
    \* Pipeline lifecycle
    \/ AcquireLockFresh
    \/ AcquireStaleLock
    \/ ResumeAcquireLock
    \/ LockGoesStale
    \/ AdvanceStage
    \/ PipelineComplete
    \* Fixture generation
    \/ GenerateBDDFixtures
    \/ BDDFixtureComplete
    \/ BDDFixtureCrash
    \/ GenerateTLCFixtures
    \/ TLCFixtureComplete
    \/ TLCFixtureCrash
    \* Coding stage entry
    \/ EnterCodingStage
    \* Task lifecycle (for each task)
    \/ \E t \in Tasks :
        \/ CreateWorktree(t)
        \/ WorktreeCreated(t)
        \/ WorktreeCreationFailed(t)
        \/ WardenConfigured(t)
        \/ WardenConfigFailed(t)
        \/ DepsInstalled(t)
        \/ DepsInstallFailed(t)
        \/ EnterCoverageGate(t)
        \/ CoverageGatePass(t)
        \/ CoverageGateFail(t)
        \/ CoverageCapExhausted(t)
        \/ TDDCapExhausted(t)
        \/ TaskTimeout(t)
        \/ ReviewGatePass(t)
        \/ ReviewGateFail(t)
        \/ AcquireMergeMutex(t)
        \/ MergeSuccess(t)
        \/ MergeConflict(t)
        \/ MergeConflictExhausted(t)
        \/ MergeMutexTimeout(t)
    \* Tier management
    \/ AdvanceTier
    \/ TierAllFailed
    \* Abort
    \/ AbortTriggered
    \/ AbortCleanup
    \* Terminal
    \/ Done

\* [HIGH-3] Fairness: every enabled action eventually executes.
\* Failure/crash actions now have WF to close liveness holes — without these,
\* TLC could construct infinite traces where a failure is perpetually enabled
\* but never taken, making the system appear to hang.
Fairness ==
    /\ WF_vars(AcquireLockFresh)
    /\ WF_vars(AcquireStaleLock)
    /\ WF_vars(ResumeAcquireLock)
    /\ WF_vars(AdvanceStage)
    /\ WF_vars(PipelineComplete)
    /\ WF_vars(GenerateBDDFixtures)
    /\ SF_vars(BDDFixtureComplete)
    /\ WF_vars(BDDFixtureCrash)
    /\ WF_vars(GenerateTLCFixtures)
    /\ SF_vars(TLCFixtureComplete)
    /\ WF_vars(TLCFixtureCrash)
    /\ WF_vars(EnterCodingStage)
    /\ WF_vars(AdvanceTier)
    /\ WF_vars(TierAllFailed)
    /\ WF_vars(AbortCleanup)
    /\ WF_vars(Done)
    /\ \A t \in Tasks :
        /\ WF_vars(CreateWorktree(t))
        /\ WF_vars(WorktreeCreated(t))
        /\ WF_vars(WorktreeCreationFailed(t))
        /\ WF_vars(WardenConfigured(t))
        /\ WF_vars(WardenConfigFailed(t))
        /\ WF_vars(DepsInstalled(t))
        /\ WF_vars(DepsInstallFailed(t))
        /\ WF_vars(EnterCoverageGate(t))
        /\ WF_vars(CoverageGatePass(t))
        /\ WF_vars(CoverageGateFail(t))
        /\ WF_vars(CoverageCapExhausted(t))
        /\ WF_vars(TDDCapExhausted(t))
        /\ WF_vars(TaskTimeout(t))
        /\ WF_vars(ReviewGatePass(t))
        /\ WF_vars(ReviewGateFail(t))
        /\ WF_vars(AcquireMergeMutex(t))
        /\ WF_vars(MergeSuccess(t))
        /\ WF_vars(MergeConflict(t))
        /\ WF_vars(MergeConflictExhausted(t))
        /\ WF_vars(MergeMutexTimeout(t))

Spec == Init /\ [][Next]_vars /\ Fairness

\* ============================================================================
\* Model-Checking Helpers (referenced by .cfg via CONSTANT <- operator)
\* ============================================================================

MC_TierAssignment == (T1 :> 1 @@ T2 :> 1 @@ T3 :> 2)
MC_FixtureGenAfter == {2, 3}
Symmetry == Permutations({T1, T2})

\* ============================================================================
\* Safety Properties
\* ============================================================================

(* S1: Every task must have a worktree before executing *)
WardenRequiresWorktree ==
    \A t \in Tasks :
        wardenState[t] = "active" => worktreeState[t] = "active"

(* S2: Warden must be active before task executes *)
AgentRequiresWarden ==
    \A t \in Tasks :
        taskState[t] \in {"executing", "coverage_gate", "review_gate"} =>
            wardenState[t] = "active"

(* S3: At most one task holds the merge mutex *)
MergeMutexExclusive ==
    \A t1, t2 \in Tasks :
        (taskState[t1] = "merging" /\ taskState[t2] = "merging") => t1 = t2

(* S4: Tier does not advance until all tasks complete *)
TierAdvanceRequiresCompletion ==
    \A tier \in 1..MaxTiers :
        tierComplete[tier] =>
            \A t \in TasksInTier(tier) :
                taskState[t] \in {"merged", "failed", "timed_out"}

(* S5: Tasks only run in the current tier *)
TasksOnlyInCurrentTier ==
    \A t \in Tasks :
        taskState[t] \in {"worktree_creating", "warden_configuring",
                          "deps_installing", "executing", "coverage_gate",
                          "review_gate", "merge_waiting", "merging"} =>
            TierAssignment[t] = currentTier

(* S6: Coverage iteration count never exceeds cap *)
CoverageCapRespected ==
    \A t \in Tasks : coverageIter[t] <= MaxCoverageIter

(* S7: TDD cycle count never exceeds cap *)
TDDCapRespected ==
    \A t \in Tasks : tddIter[t] <= MaxTDDCycles

(* S8: Pipeline lock is held during execution *)
LockHeldDuringExecution ==
    pipelineStage \in 1..NumStages /\ ~pipelineAborted =>
        pipelineLock = "held"

(* S9: Fixtures must be valid before coding stage tasks start *)
FixturesPrecondition ==
    \A t \in Tasks :
        taskState[t] \in {"executing", "coverage_gate"} =>
            (bddFixture = "valid" /\ tlcFixture = "valid")

(* S10: Completion counter never exceeds task count per tier *)
CounterBounded ==
    \A tier \in 1..MaxTiers :
        completionCounter[tier] <= Cardinality(TasksInTier(tier))

(* S11: Abort cleanup releases the lock *)
AbortReleasesLock ==
    abortCleanupDone => pipelineLock = "free"

(* S12: No task executes after abort *)
NoExecutionAfterAbort ==
    (pipelineAborted /\ abortCleanupDone) =>
        \A t \in Tasks :
            taskState[t] \notin {"worktree_creating", "warden_configuring",
                                 "deps_installing", "executing", "coverage_gate",
                                 "review_gate", "merge_waiting", "merging"}

(* S13: Merged task has worktree removed *)
MergedWorktreeCleanedUp ==
    \A t \in Tasks :
        taskState[t] = "merged" => worktreeState[t] = "removed"

(* S14: Stale lock is never "held" — once stale, must be re-acquired *)
StaleLockNotExecuting ==
    pipelineLock = "stale" => pipelineStage = 0

(* S15: Crash count never exceeds budget *)
CrashBudgetRespected ==
    crashCount <= MaxCrashes

\* ============================================================================
\* Liveness Properties
\* ============================================================================

(* L1: If pipeline starts and is not aborted, it eventually completes *)
PipelineEventuallyCompletes ==
    (pipelineStage = 1 /\ ~pipelineAborted) ~>
        (pipelineStage = NumStages + 1 \/ pipelineAborted)

(* L2: If abort is triggered, cleanup eventually completes *)
AbortEventuallyCleanedUp ==
    pipelineAborted ~> abortCleanupDone

(* L3: Every task in an active state eventually reaches a terminal state,
   or the pipeline aborts (which covers crash-recovery scenarios where a
   crash resets a task to "idle" and a subsequent abort does not re-fail
   already-idle tasks).
   [HIGH-2] Extended from "executing" to all active states so that tasks
   stuck in coverage_gate, review_gate, or merge_waiting are also covered.
   [LIVENESS-3] Added \/ pipelineAborted to the consequent: without it,
   a crash resetting an active task to "idle" followed by an abort that
   does not mark idle tasks as failed creates a trace where the task
   never reaches a terminal state — violating the original property. *)
TasksEventuallyTerminate ==
    \A t \in Tasks :
        (taskState[t] \in ActiveTaskStates) ~>
            (taskState[t] \in {"merged", "failed", "timed_out"} \/ pipelineAborted)

(* L4: Each tier eventually completes if the pipeline is not aborted *)
TiersEventuallyComplete ==
    \A tier \in 1..MaxTiers :
        (currentTier = tier /\ ~pipelineAborted) ~>
            (tierComplete[tier] \/ pipelineAborted)

=============================================================================
