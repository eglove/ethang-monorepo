--------------------------- MODULE CodeSimplify ---------------------------
(* version: 1.0.0 *)
(***************************************************************************)
(* TLA+ specification for vibe-cli Stage 8 "Code Simplify" pipeline.       *)
(* Derived from docs/code-simplify/bdd.feature (2026-04-11).               *)
(* Revised to address debate objections:                                   *)
(*   - CRITICAL: Route ClaudeDispatchNoWorktrees through WorktreeCleanup   *)
(*     so multi-tier plans with single-task tiers advance correctly.        *)
(*   - Crash-from-any-active-phase (BDD finally-block lock release).       *)
(*   - Remove dead 'PreCodingGate' from Phases set.                        *)
(*   - Named safety property: NoReReviewAfterConflict.                     *)
(*   - Timeout modeling (reviewer/moderator timeout -> pass).              *)
(*   - Resume/crash-recovery modeling with lastCompletedTier checkpoints.  *)
(*                                                                         *)
(* Pipeline phases:                                                        *)
(*   Init -> LockAcquire -> InputValidation -> FixtureCoverage             *)
(*     -> ClaudeDispatch -> PerWorktreeGates -> SequentialMerge            *)
(*     -> WorktreeCleanup -> [next tier | GlobalDoublePass]                *)
(*     -> GlobalReview -> Complete                                         *)
(*                                                                         *)
(* At every escalation point the user may choose KeepGoing or Stop.        *)
(* Stop always releases the lock and halts.  KeepGoing logs and continues. *)
(* Crash from any active phase releases the lock via finally block.        *)
(* After crash, --resume restarts from the last completed tier checkpoint. *)
(***************************************************************************)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxTiers,              \* number of tiers (>= 1)
    MaxTasksPerTier,       \* tasks per tier (>= 1)
    MaxDoublePassRetries,  \* 5 in production
    MaxReviewRounds,       \* 3 in production
    NumReviewers           \* 8 in production, kept small for model checking

VARIABLES
    phase,                 \* current pipeline phase
    lockHeld,              \* whether pipeline.lock is held by this run
    lockPID,               \* PID recorded in lock (0 = no lock)
    currentTier,           \* which tier is being processed (1..MaxTiers)
    currentTask,           \* which task within a tier (for merge ordering)
    totalTasks,            \* total tasks in current tier
    hasWorktrees,          \* whether worktrees were created
    \* --- per-worktree gate state ---
    wtDoublePassRetries,   \* retry counter for per-worktree double-pass
    wtConsecPasses,        \* consecutive pass counter (0..2)
    wtReviewRounds,        \* review round counter for per-worktree
    wtReviewVerdict,       \* "none" | "pass" | "fail"
    \* --- merge state ---
    mergeDoublePassRetries,\* retry counter for post-conflict double-pass
    mergeConsecPasses,     \* consecutive pass counter during merge
    \* --- global gate state ---
    glDoublePassRetries,   \* retry counter for global double-pass
    glConsecPasses,        \* consecutive pass counter (0..2)
    glReviewRounds,        \* review round counter for global review
    glReviewVerdict,       \* "none" | "pass" | "fail"
    \* --- escalation ---
    escalationActive,      \* whether user is being prompted
    userChoice,            \* "none" | "keepGoing" | "stop"
    \* --- outcome ---
    pipelineOutcome,       \* "running" | "complete" | "halted"
    \* --- crash/resume state ---
    lastCompletedTier,     \* last tier fully merged & cleaned up (0 = none)
    crashed                \* TRUE if halt was due to unhandled crash

vars == <<phase, lockHeld, lockPID, currentTier, currentTask, totalTasks,
          hasWorktrees,
          wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
          mergeDoublePassRetries, mergeConsecPasses,
          glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
          escalationActive, userChoice, pipelineOutcome,
          lastCompletedTier, crashed>>

\* "PreCodingGate" removed: Init phase models the pre-coding gate directly
Phases == {"Init", "LockAcquire", "InputValidation",
           "FixtureCoverage", "ClaudeDispatch",
           "PerWT_DoublePass", "PerWT_Review",
           "SequentialMerge", "MergeConflictDP",
           "WorktreeCleanup",
           "GlobalDoublePass", "GlobalReview",
           "Complete", "Halted"}

Verdicts == {"none", "pass", "fail"}
Outcomes == {"running", "complete", "halted"}
UserChoices == {"none", "keepGoing", "stop"}

(***************************************************************************)
(* Type invariant                                                          *)
(***************************************************************************)
TypeOK ==
    /\ phase \in Phases
    /\ lockHeld \in BOOLEAN
    /\ lockPID \in 0..1  \* abstracted: 0=no lock, 1=held by us
    /\ currentTier \in 0..MaxTiers
    /\ currentTask \in 0..MaxTasksPerTier
    /\ totalTasks \in 0..MaxTasksPerTier
    /\ hasWorktrees \in BOOLEAN
    /\ wtDoublePassRetries \in 0..MaxDoublePassRetries
    /\ wtConsecPasses \in 0..2
    /\ wtReviewRounds \in 0..MaxReviewRounds
    /\ wtReviewVerdict \in Verdicts
    /\ mergeDoublePassRetries \in 0..MaxDoublePassRetries
    /\ mergeConsecPasses \in 0..2
    /\ glDoublePassRetries \in 0..MaxDoublePassRetries
    /\ glConsecPasses \in 0..2
    /\ glReviewRounds \in 0..MaxReviewRounds
    /\ glReviewVerdict \in Verdicts
    /\ escalationActive \in BOOLEAN
    /\ userChoice \in UserChoices
    /\ pipelineOutcome \in Outcomes
    /\ lastCompletedTier \in 0..MaxTiers
    /\ crashed \in BOOLEAN

(***************************************************************************)
(* Initial state                                                           *)
(***************************************************************************)
Init ==
    /\ phase = "Init"
    /\ lockHeld = FALSE
    /\ lockPID = 0
    /\ currentTier = 0
    /\ currentTask = 0
    /\ totalTasks = 0
    /\ hasWorktrees = FALSE
    /\ wtDoublePassRetries = 0
    /\ wtConsecPasses = 0
    /\ wtReviewRounds = 0
    /\ wtReviewVerdict = "none"
    /\ mergeDoublePassRetries = 0
    /\ mergeConsecPasses = 0
    /\ glDoublePassRetries = 0
    /\ glConsecPasses = 0
    /\ glReviewRounds = 0
    /\ glReviewVerdict = "none"
    /\ escalationActive = FALSE
    /\ userChoice = "none"
    /\ pipelineOutcome = "running"
    /\ lastCompletedTier = 0
    /\ crashed = FALSE

(***************************************************************************)
(* Helper: Halt — always releases lock, marks as user-initiated (not crash)*)
(***************************************************************************)
Halt ==
    /\ phase' = "Halted"
    /\ lockHeld' = FALSE
    /\ lockPID' = 0
    /\ pipelineOutcome' = "halted"
    /\ crashed' = FALSE
    /\ UNCHANGED <<currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier>>

(***************************************************************************)
(* Crash — unhandled error from any active phase (BDD: finally-block)      *)
(*   Releases the lock.  Sets crashed=TRUE to enable --resume.             *)
(*   Can fire from any phase where the lock is held.                       *)
(***************************************************************************)
Crash ==
    /\ lockHeld
    /\ phase \notin {"Complete", "Halted"}
    /\ phase' = "Halted"
    /\ lockHeld' = FALSE
    /\ lockPID' = 0
    /\ pipelineOutcome' = "halted"
    /\ crashed' = TRUE
    /\ escalationActive' = FALSE
    /\ userChoice' = "none"
    /\ UNCHANGED <<currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier>>

(***************************************************************************)
(* Resume — restart from crash at next tier after last checkpoint          *)
(*   BDD: --resume reads last marker, reclaims stale lock, resumes.       *)
(*   Enabled only after crash with at least one completed tier checkpoint. *)
(*   Acquires lock and jumps to ClaudeDispatch for the next tier.          *)
(***************************************************************************)
Resume ==
    /\ phase = "Halted"
    /\ crashed
    /\ lastCompletedTier > 0
    /\ lastCompletedTier < MaxTiers
    /\ phase' = "ClaudeDispatch"
    /\ lockHeld' = TRUE
    /\ lockPID' = 1
    /\ currentTier' = lastCompletedTier + 1
    /\ totalTasks' \in 1..MaxTasksPerTier
    /\ currentTask' = 1
    /\ hasWorktrees' = FALSE
    /\ pipelineOutcome' = "running"
    /\ crashed' = FALSE
    \* Reset all gate counters for the resumed tier
    /\ wtDoublePassRetries' = 0
    /\ wtConsecPasses' = 0
    /\ wtReviewRounds' = 0
    /\ wtReviewVerdict' = "none"
    /\ mergeDoublePassRetries' = 0
    /\ mergeConsecPasses' = 0
    /\ glDoublePassRetries' = 0
    /\ glConsecPasses' = 0
    /\ glReviewRounds' = 0
    /\ glReviewVerdict' = "none"
    /\ escalationActive' = FALSE
    /\ userChoice' = "none"
    /\ UNCHANGED lastCompletedTier

\* Resume when all tiers were complete — jump to GlobalDoublePass
ResumeToGlobal ==
    /\ phase = "Halted"
    /\ crashed
    /\ lastCompletedTier = MaxTiers
    /\ phase' = "GlobalDoublePass"
    /\ lockHeld' = TRUE
    /\ lockPID' = 1
    /\ pipelineOutcome' = "running"
    /\ crashed' = FALSE
    /\ glDoublePassRetries' = 0
    /\ glConsecPasses' = 0
    /\ glReviewRounds' = 0
    /\ glReviewVerdict' = "none"
    /\ escalationActive' = FALSE
    /\ userChoice' = "none"
    /\ UNCHANGED <<currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   lastCompletedTier>>

(***************************************************************************)
(* Pre-Coding Gate                                                         *)
(*   Working tree clean -> proceed                                         *)
(*   Working tree dirty -> user accepts commit or declines (halt)          *)
(*   Non-deterministic: models both clean and dirty states                 *)
(***************************************************************************)
PreCodingGatePass ==
    /\ phase = "Init"
    /\ phase' = "LockAcquire"
    /\ pipelineOutcome' = "running"
    /\ UNCHANGED <<lockHeld, lockPID, currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

PreCodingGateHalt ==
    /\ phase = "Init"
    /\ Halt
    /\ UNCHANGED <<escalationActive, userChoice>>

(***************************************************************************)
(* Lock Acquire                                                            *)
(*   No lock / stale lock -> acquire                                       *)
(*   Live lock held by other PID -> halt (concurrent rejection)            *)
(***************************************************************************)
LockAcquire ==
    /\ phase = "LockAcquire"
    /\ phase' = "InputValidation"
    /\ lockHeld' = TRUE
    /\ lockPID' = 1
    /\ UNCHANGED <<pipelineOutcome, currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

LockAcquireReject ==
    /\ phase = "LockAcquire"
    /\ Halt
    /\ UNCHANGED <<escalationActive, userChoice>>

(***************************************************************************)
(* Input Validation                                                        *)
(*   All inputs valid -> proceed                                           *)
(*   Any input missing/malformed -> halt                                   *)
(***************************************************************************)
InputValidationPass ==
    /\ phase = "InputValidation"
    /\ phase' = "FixtureCoverage"
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome,
                   currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

InputValidationFail ==
    /\ phase = "InputValidation"
    /\ Halt
    /\ UNCHANGED <<escalationActive, userChoice>>

(***************************************************************************)
(* Fixture Coverage Check                                                  *)
(*   Always proceeds (missing coverage is sent to Claude, not a halt)      *)
(***************************************************************************)
FixtureCoverageCheck ==
    /\ phase = "FixtureCoverage"
    /\ phase' = "ClaudeDispatch"
    /\ currentTier' = 1
    /\ totalTasks' \in 1..MaxTasksPerTier
    /\ currentTask' = 1
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

(***************************************************************************)
(* Claude Dispatch                                                         *)
(*   Claude completes the current tier's tasks.                            *)
(*   Non-deterministic: may or may not create worktrees.                   *)
(*                                                                         *)
(*   FIX: ClaudeDispatchNoWorktrees now routes through WorktreeCleanup     *)
(*   instead of jumping to GlobalDoublePass.  This ensures multi-tier      *)
(*   plans with single-task tiers still advance through all tiers.         *)
(***************************************************************************)
ClaudeDispatchWithWorktrees ==
    /\ phase = "ClaudeDispatch"
    /\ currentTier <= MaxTiers
    /\ phase' = "PerWT_DoublePass"
    /\ hasWorktrees' = TRUE
    /\ currentTask' = 1
    \* Reset per-worktree counters
    /\ wtDoublePassRetries' = 0
    /\ wtConsecPasses' = 0
    /\ wtReviewRounds' = 0
    /\ wtReviewVerdict' = "none"
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

ClaudeDispatchNoWorktrees ==
    /\ phase = "ClaudeDispatch"
    /\ currentTier <= MaxTiers
    /\ totalTasks = 1  \* single task -> may skip worktrees
    \* FIX: Route through WorktreeCleanup for proper tier advancement.
    \* Previously jumped to GlobalDoublePass, silently skipping remaining tiers.
    /\ phase' = "WorktreeCleanup"
    /\ hasWorktrees' = FALSE
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask, totalTasks,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

(***************************************************************************)
(* Per-Worktree Double-Pass                                                *)
(*   Runs pnpm test -> pnpm lint twice consecutively.                      *)
(*   On failure: Claude fixes, retry counter increments, consec resets.    *)
(*   On MaxDoublePassRetries: escalate.                                    *)
(***************************************************************************)
PerWT_DoublePassSucceed ==
    /\ phase = "PerWT_DoublePass"
    /\ ~escalationActive
    /\ wtConsecPasses < 2
    /\ wtConsecPasses' = wtConsecPasses + 1
    /\ IF wtConsecPasses + 1 = 2
       THEN phase' = "PerWT_Review"
       ELSE phase' = "PerWT_DoublePass"
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees, wtDoublePassRetries,
                   wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

PerWT_DoublePassFail ==
    /\ phase = "PerWT_DoublePass"
    /\ ~escalationActive
    /\ wtDoublePassRetries < MaxDoublePassRetries
    /\ wtDoublePassRetries' = wtDoublePassRetries + 1
    /\ wtConsecPasses' = 0
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

PerWT_DoublePassEscalate ==
    /\ phase = "PerWT_DoublePass"
    /\ ~escalationActive
    /\ wtDoublePassRetries = MaxDoublePassRetries
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees, wtDoublePassRetries, wtConsecPasses,
                   wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   userChoice, lastCompletedTier, crashed>>

PerWT_DoublePassKeepGoing ==
    /\ phase = "PerWT_DoublePass"
    /\ escalationActive
    /\ userChoice' = "keepGoing"
    /\ escalationActive' = FALSE
    /\ phase' = "PerWT_Review"
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees, wtDoublePassRetries, wtConsecPasses,
                   wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier, crashed>>

PerWT_DoublePassStop ==
    /\ phase = "PerWT_DoublePass"
    /\ escalationActive
    /\ userChoice' = "stop"
    /\ escalationActive' = FALSE
    /\ Halt

(***************************************************************************)
(* Per-Worktree Review                                                     *)
(*   Moderator dispatches reviewers.                                       *)
(*   Pass (or no reviewers relevant) -> merge queue.                       *)
(*   Fail with blockers -> Claude fix -> re-run double-pass -> re-review.  *)
(*   MaxReviewRounds -> escalate.                                          *)
(*   Timeout (all reviewers or moderator timeout) -> treated as pass.      *)
(***************************************************************************)
PerWT_ReviewPass ==
    /\ phase = "PerWT_Review"
    /\ ~escalationActive
    /\ wtReviewVerdict' = "pass"
    \* Advance to next task or to merge
    /\ IF currentTask < totalTasks
       THEN /\ currentTask' = currentTask + 1
            /\ phase' = "PerWT_DoublePass"
            /\ wtDoublePassRetries' = 0
            /\ wtConsecPasses' = 0
            /\ wtReviewRounds' = 0
       ELSE /\ phase' = "SequentialMerge"
            /\ currentTask' = 1
            /\ UNCHANGED <<wtDoublePassRetries, wtConsecPasses, wtReviewRounds>>
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

\* Timeout: all reviewers and/or moderator timed out (BDD: ReviewerTimeout
\* 600s, ReviewModeratorTimeout 300s).  All-timeout => verdict "pass" with
\* warning.  Behaviorally identical to PerWT_ReviewPass but represents the
\* timeout path explicitly per BDD scenarios.
PerWT_ReviewTimeout ==
    /\ phase = "PerWT_Review"
    /\ ~escalationActive
    /\ wtReviewVerdict' = "pass"
    /\ IF currentTask < totalTasks
       THEN /\ currentTask' = currentTask + 1
            /\ phase' = "PerWT_DoublePass"
            /\ wtDoublePassRetries' = 0
            /\ wtConsecPasses' = 0
            /\ wtReviewRounds' = 0
       ELSE /\ phase' = "SequentialMerge"
            /\ currentTask' = 1
            /\ UNCHANGED <<wtDoublePassRetries, wtConsecPasses, wtReviewRounds>>
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

PerWT_ReviewFail ==
    /\ phase = "PerWT_Review"
    /\ ~escalationActive
    /\ wtReviewRounds < MaxReviewRounds
    /\ wtReviewRounds' = wtReviewRounds + 1
    /\ wtReviewVerdict' = "fail"
    \* Claude fixes, then re-run double-pass
    /\ phase' = "PerWT_DoublePass"
    /\ wtDoublePassRetries' = 0
    /\ wtConsecPasses' = 0
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

PerWT_ReviewEscalate ==
    /\ phase = "PerWT_Review"
    /\ ~escalationActive
    /\ wtReviewRounds = MaxReviewRounds
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees, wtDoublePassRetries, wtConsecPasses,
                   wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   userChoice, lastCompletedTier, crashed>>

PerWT_ReviewKeepGoing ==
    /\ phase = "PerWT_Review"
    /\ escalationActive
    /\ userChoice' = "keepGoing"
    /\ escalationActive' = FALSE
    /\ wtReviewVerdict' = "pass"
    \* Advance to next task or merge
    /\ IF currentTask < totalTasks
       THEN /\ currentTask' = currentTask + 1
            /\ phase' = "PerWT_DoublePass"
            /\ wtDoublePassRetries' = 0
            /\ wtConsecPasses' = 0
            /\ wtReviewRounds' = 0
       ELSE /\ phase' = "SequentialMerge"
            /\ currentTask' = 1
            /\ UNCHANGED <<wtDoublePassRetries, wtConsecPasses, wtReviewRounds>>
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier, crashed>>

PerWT_ReviewStop ==
    /\ phase = "PerWT_Review"
    /\ escalationActive
    /\ userChoice' = "stop"
    /\ escalationActive' = FALSE
    /\ Halt

(***************************************************************************)
(* Sequential Merge                                                        *)
(*   Merges worktree branches in task order.                               *)
(*   Clean merge -> next task.                                             *)
(*   Conflict -> Claude resolves -> double-pass on feature branch.         *)
(***************************************************************************)
MergeClean ==
    /\ phase = "SequentialMerge"
    /\ ~escalationActive
    /\ IF currentTask < totalTasks
       THEN /\ currentTask' = currentTask + 1
            /\ phase' = "SequentialMerge"
       ELSE /\ phase' = "WorktreeCleanup"
            /\ UNCHANGED currentTask
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

MergeConflict ==
    /\ phase = "SequentialMerge"
    /\ ~escalationActive
    \* Claude resolves conflict, then need double-pass on feature branch
    /\ phase' = "MergeConflictDP"
    /\ mergeDoublePassRetries' = 0
    /\ mergeConsecPasses' = 0
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

MergeConflictUnresolvable ==
    /\ phase = "SequentialMerge"
    /\ ~escalationActive
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   userChoice, lastCompletedTier, crashed>>

MergeEscKeepGoing ==
    /\ phase = "SequentialMerge"
    /\ escalationActive
    /\ userChoice' = "keepGoing"
    /\ escalationActive' = FALSE
    \* Skip this merge and continue
    /\ IF currentTask < totalTasks
       THEN /\ currentTask' = currentTask + 1
            /\ phase' = "SequentialMerge"
       ELSE /\ phase' = "WorktreeCleanup"
            /\ UNCHANGED currentTask
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier, crashed>>

MergeEscStop ==
    /\ phase = "SequentialMerge"
    /\ escalationActive
    /\ userChoice' = "stop"
    /\ escalationActive' = FALSE
    /\ Halt

(***************************************************************************)
(* Merge Conflict Double-Pass                                              *)
(*   After conflict resolution, double-pass on the feature branch.         *)
(*   BDD: "No full re-review after conflict resolution" — on success,     *)
(*   continues merge sequence (SequentialMerge or WorktreeCleanup), never  *)
(*   dispatches reviewers.  See NoReReviewAfterConflict safety property.   *)
(***************************************************************************)
MergeDP_Succeed ==
    /\ phase = "MergeConflictDP"
    /\ ~escalationActive
    /\ mergeConsecPasses < 2
    /\ mergeConsecPasses' = mergeConsecPasses + 1
    /\ IF mergeConsecPasses + 1 = 2
       THEN \* Continue merge from next task (no re-review per BDD)
            /\ IF currentTask < totalTasks
               THEN /\ currentTask' = currentTask + 1
                    /\ phase' = "SequentialMerge"
               ELSE /\ phase' = "WorktreeCleanup"
                    /\ UNCHANGED currentTask
       ELSE /\ UNCHANGED <<phase, currentTask>>
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

MergeDP_Fail ==
    /\ phase = "MergeConflictDP"
    /\ ~escalationActive
    /\ mergeDoublePassRetries < MaxDoublePassRetries
    /\ mergeDoublePassRetries' = mergeDoublePassRetries + 1
    /\ mergeConsecPasses' = 0
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

MergeDP_Escalate ==
    /\ phase = "MergeConflictDP"
    /\ ~escalationActive
    /\ mergeDoublePassRetries = MaxDoublePassRetries
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   userChoice, lastCompletedTier, crashed>>

MergeDP_KeepGoing ==
    /\ phase = "MergeConflictDP"
    /\ escalationActive
    /\ userChoice' = "keepGoing"
    /\ escalationActive' = FALSE
    /\ IF currentTask < totalTasks
       THEN /\ currentTask' = currentTask + 1
            /\ phase' = "SequentialMerge"
       ELSE /\ phase' = "WorktreeCleanup"
            /\ UNCHANGED currentTask
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier, crashed>>

MergeDP_Stop ==
    /\ phase = "MergeConflictDP"
    /\ escalationActive
    /\ userChoice' = "stop"
    /\ escalationActive' = FALSE
    /\ Halt

(***************************************************************************)
(* Worktree Cleanup                                                        *)
(*   Always proceeds (cleanup failures are warnings, never halt).          *)
(*   Records lastCompletedTier checkpoint for --resume support.            *)
(*   Advances to next tier or to global gates.                             *)
(***************************************************************************)
WorktreeCleanup ==
    /\ phase = "WorktreeCleanup"
    /\ lastCompletedTier' = currentTier  \* checkpoint for --resume
    \* Advance to next tier or global gates
    /\ IF currentTier < MaxTiers
       THEN /\ currentTier' = currentTier + 1
            /\ phase' = "ClaudeDispatch"
            /\ totalTasks' \in 1..MaxTasksPerTier
            /\ currentTask' = 1
            /\ UNCHANGED <<glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict>>
       ELSE /\ phase' = "GlobalDoublePass"
            /\ glDoublePassRetries' = 0
            /\ glConsecPasses' = 0
            /\ glReviewRounds' = 0
            /\ glReviewVerdict' = "none"
            /\ UNCHANGED <<currentTier, currentTask, totalTasks>>
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   escalationActive, userChoice, crashed>>

(***************************************************************************)
(* Global Double-Pass                                                      *)
(***************************************************************************)
GlobalDP_Succeed ==
    /\ phase = "GlobalDoublePass"
    /\ ~escalationActive
    /\ glConsecPasses < 2
    /\ glConsecPasses' = glConsecPasses + 1
    /\ IF glConsecPasses + 1 = 2
       THEN phase' = "GlobalReview"
       ELSE phase' = "GlobalDoublePass"
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

GlobalDP_Fail ==
    /\ phase = "GlobalDoublePass"
    /\ ~escalationActive
    /\ glDoublePassRetries < MaxDoublePassRetries
    /\ glDoublePassRetries' = glDoublePassRetries + 1
    /\ glConsecPasses' = 0
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glReviewRounds, glReviewVerdict,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

GlobalDP_Escalate ==
    /\ phase = "GlobalDoublePass"
    /\ ~escalationActive
    /\ glDoublePassRetries = MaxDoublePassRetries
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   userChoice, lastCompletedTier, crashed>>

GlobalDP_KeepGoing ==
    /\ phase = "GlobalDoublePass"
    /\ escalationActive
    /\ userChoice' = "keepGoing"
    /\ escalationActive' = FALSE
    /\ phase' = "GlobalReview"
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   lastCompletedTier, crashed>>

GlobalDP_Stop ==
    /\ phase = "GlobalDoublePass"
    /\ escalationActive
    /\ userChoice' = "stop"
    /\ escalationActive' = FALSE
    /\ Halt

(***************************************************************************)
(* Global Review                                                           *)
(***************************************************************************)
GlobalReviewPass ==
    /\ phase = "GlobalReview"
    /\ ~escalationActive
    /\ glReviewVerdict' = "pass"
    /\ phase' = "Complete"
    /\ lockHeld' = FALSE
    /\ lockPID' = 0
    /\ pipelineOutcome' = "complete"
    /\ UNCHANGED <<currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

\* Timeout: all reviewers and/or moderator timed out at global level.
\* BDD: all-timeout => verdict "pass", warning logged.
\* Behaviorally identical to GlobalReviewPass but models the timeout path.
GlobalReviewTimeout ==
    /\ phase = "GlobalReview"
    /\ ~escalationActive
    /\ glReviewVerdict' = "pass"
    /\ phase' = "Complete"
    /\ lockHeld' = FALSE
    /\ lockPID' = 0
    /\ pipelineOutcome' = "complete"
    /\ UNCHANGED <<currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

GlobalReviewFail ==
    /\ phase = "GlobalReview"
    /\ ~escalationActive
    /\ glReviewRounds < MaxReviewRounds
    /\ glReviewRounds' = glReviewRounds + 1
    /\ glReviewVerdict' = "fail"
    \* Claude fixes, re-run global double-pass
    /\ phase' = "GlobalDoublePass"
    /\ glDoublePassRetries' = 0
    /\ glConsecPasses' = 0
    /\ UNCHANGED <<lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   escalationActive, userChoice, lastCompletedTier, crashed>>

GlobalReviewEscalate ==
    /\ phase = "GlobalReview"
    /\ ~escalationActive
    /\ glReviewRounds = MaxReviewRounds
    /\ escalationActive' = TRUE
    /\ UNCHANGED <<phase, lockHeld, lockPID, pipelineOutcome, currentTier, currentTask,
                   totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds, glReviewVerdict,
                   userChoice, lastCompletedTier, crashed>>

GlobalReviewKeepGoing ==
    /\ phase = "GlobalReview"
    /\ escalationActive
    /\ userChoice' = "keepGoing"
    /\ escalationActive' = FALSE
    /\ glReviewVerdict' = "pass"
    /\ phase' = "Complete"
    /\ lockHeld' = FALSE
    /\ lockPID' = 0
    /\ pipelineOutcome' = "complete"
    /\ UNCHANGED <<currentTier, currentTask, totalTasks, hasWorktrees,
                   wtDoublePassRetries, wtConsecPasses, wtReviewRounds, wtReviewVerdict,
                   mergeDoublePassRetries, mergeConsecPasses,
                   glDoublePassRetries, glConsecPasses, glReviewRounds,
                   lastCompletedTier, crashed>>

GlobalReviewStop ==
    /\ phase = "GlobalReview"
    /\ escalationActive
    /\ userChoice' = "stop"
    /\ escalationActive' = FALSE
    /\ Halt

(***************************************************************************)
(* Terminal stuttering step - prevents TLC deadlock in terminal states      *)
(***************************************************************************)
Done ==
    /\ phase \in {"Complete", "Halted"}
    /\ UNCHANGED vars

(***************************************************************************)
(* Next-state relation                                                     *)
(***************************************************************************)
Next ==
    \* Terminal
    \/ Done
    \* Pre-coding gate
    \/ PreCodingGatePass
    \/ PreCodingGateHalt
    \* Lock
    \/ LockAcquire
    \/ LockAcquireReject
    \* Input validation
    \/ InputValidationPass
    \/ InputValidationFail
    \* Fixture coverage
    \/ FixtureCoverageCheck
    \* Claude dispatch
    \/ ClaudeDispatchWithWorktrees
    \/ ClaudeDispatchNoWorktrees
    \* Per-worktree double-pass
    \/ PerWT_DoublePassSucceed
    \/ PerWT_DoublePassFail
    \/ PerWT_DoublePassEscalate
    \/ PerWT_DoublePassKeepGoing
    \/ PerWT_DoublePassStop
    \* Per-worktree review
    \/ PerWT_ReviewPass
    \/ PerWT_ReviewTimeout
    \/ PerWT_ReviewFail
    \/ PerWT_ReviewEscalate
    \/ PerWT_ReviewKeepGoing
    \/ PerWT_ReviewStop
    \* Sequential merge
    \/ MergeClean
    \/ MergeConflict
    \/ MergeConflictUnresolvable
    \/ MergeEscKeepGoing
    \/ MergeEscStop
    \* Merge conflict double-pass
    \/ MergeDP_Succeed
    \/ MergeDP_Fail
    \/ MergeDP_Escalate
    \/ MergeDP_KeepGoing
    \/ MergeDP_Stop
    \* Worktree cleanup (also handles tier advancement)
    \/ WorktreeCleanup
    \* Global double-pass
    \/ GlobalDP_Succeed
    \/ GlobalDP_Fail
    \/ GlobalDP_Escalate
    \/ GlobalDP_KeepGoing
    \/ GlobalDP_Stop
    \* Global review
    \/ GlobalReviewPass
    \/ GlobalReviewTimeout
    \/ GlobalReviewFail
    \/ GlobalReviewEscalate
    \/ GlobalReviewKeepGoing
    \/ GlobalReviewStop
    \* Crash from any active phase (finally-block lock release)
    \/ Crash
    \* Resume from crash at last checkpoint
    \/ Resume
    \/ ResumeToGlobal

(***************************************************************************)
(* Fairness                                                                *)
(*   If KeepGoing is always eventually chosen, the pipeline terminates.    *)
(*   Weak fairness on all non-escalation, non-crash, non-timeout actions.  *)
(*   No fairness on Crash (crashes are not required to happen).            *)
(*   No fairness on Resume (user may choose not to resume).               *)
(*   No fairness on Timeout (timeouts are not required to happen).        *)
(***************************************************************************)
Fairness ==
    /\ WF_vars(PreCodingGatePass)
    /\ WF_vars(LockAcquire)
    /\ WF_vars(InputValidationPass)
    /\ WF_vars(FixtureCoverageCheck)
    /\ WF_vars(ClaudeDispatchWithWorktrees)
    /\ WF_vars(ClaudeDispatchNoWorktrees)
    /\ WF_vars(PerWT_DoublePassSucceed)
    /\ WF_vars(PerWT_ReviewPass)
    /\ WF_vars(MergeClean)
    /\ WF_vars(MergeDP_Succeed)
    /\ WF_vars(WorktreeCleanup)
    /\ WF_vars(GlobalDP_Succeed)
    /\ WF_vars(GlobalReviewPass)
    \* Fairness on escalation resolution (user eventually responds)
    /\ WF_vars(PerWT_DoublePassKeepGoing)
    /\ WF_vars(PerWT_ReviewKeepGoing)
    /\ WF_vars(MergeEscKeepGoing)
    /\ WF_vars(MergeDP_KeepGoing)
    /\ WF_vars(GlobalDP_KeepGoing)
    /\ WF_vars(GlobalReviewKeepGoing)

Spec == Init /\ [][Next]_vars /\ Fairness

(***************************************************************************)
(* SAFETY PROPERTIES                                                       *)
(***************************************************************************)

\* S1: Lock is always released on termination
LockReleasedOnTermination ==
    (phase = "Complete" \/ phase = "Halted") => ~lockHeld

\* S2: Lock must be held during all active phases
LockHeldDuringExecution ==
    (phase \notin {"Init", "LockAcquire", "Complete", "Halted"}) => lockHeld

\* S3: Double-pass retries never exceed maximum
DoublePassRetriesInBounds ==
    /\ wtDoublePassRetries <= MaxDoublePassRetries
    /\ mergeDoublePassRetries <= MaxDoublePassRetries
    /\ glDoublePassRetries <= MaxDoublePassRetries

\* S4: Review rounds never exceed maximum
ReviewRoundsInBounds ==
    /\ wtReviewRounds <= MaxReviewRounds
    /\ glReviewRounds <= MaxReviewRounds

\* S5: Pipeline outcome is consistent with phase
OutcomeConsistency ==
    /\ (phase = "Complete" => pipelineOutcome = "complete")
    /\ (phase = "Halted" => pipelineOutcome = "halted")
    /\ (phase \notin {"Complete", "Halted"} => pipelineOutcome = "running")

\* S6: Consecutive passes never exceed 2
ConsecutivePassBound ==
    /\ wtConsecPasses <= 2
    /\ mergeConsecPasses <= 2
    /\ glConsecPasses <= 2

\* S7: No re-review after conflict resolution (BDD: "No full re-review
\*     after conflict resolution").  From MergeConflictDP, the only valid
\*     successor phases are itself (retry), SequentialMerge (continue merge),
\*     WorktreeCleanup (all merged), or Halted (crash/stop).  Never a
\*     review phase.
NoReReviewAfterConflict ==
    [][phase = "MergeConflictDP" =>
       phase' \in {"MergeConflictDP", "SequentialMerge", "WorktreeCleanup", "Halted"}]_vars

(***************************************************************************)
(* LIVENESS PROPERTIES                                                     *)
(***************************************************************************)

\* L1: Pipeline eventually terminates (reaches Complete or Halted)
EventualTermination ==
    <>(phase = "Complete" \/ phase = "Halted")

\* L2: If we reach GlobalReview, we eventually complete or halt
GlobalReviewLeadsToEnd ==
    (phase = "GlobalReview") ~> (phase = "Complete" \/ phase = "Halted")

\* L3: Escalation is always eventually resolved
EscalationEventuallyResolved ==
    escalationActive ~> ~escalationActive

\* L4: If lock is acquired, it is eventually released
LockEventuallyReleased ==
    lockHeld ~> ~lockHeld

=============================================================================
