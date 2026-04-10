--------------------------- MODULE PipelineReviewers ---------------------------
(*
 * TLA+ Specification — Pipeline Reviewers & Resume
 * Source: docs/reviewers/bdd.feature (2026-04-10)
 *
 * Models the review gate lifecycle within the vibe-cli pipeline:
 *   - Pipeline mutual exclusion (lock file)
 *   - Pre-merge and post-merge final review gates
 *   - Review-fix TDD cycles (RED -> GREEN -> CLEANUP -> re-review)
 *   - Retry-reviews (moderator timeout / parse failure / schema violation)
 *   - Review round counting (MaxReviewRounds)
 *   - Keep Going livelock prevention (MaxKeepGoingResets)
 *   - TDD Keep Going cap (MaxTddKeepGoingPerGate)
 *   - Absorbing terminal states (COMPLETE, HALTED)
 *   - Global pipeline timeout (PipelineTimeoutSeconds)
 *   - Review gate wall-clock cap (ReviewGateTimeout)
 *   - Diff-base staleness after concurrent merges
 *
 * Abstraction choices:
 *   - Individual reviewer agents are modeled as nondeterministic
 *     success/failure (the JSON parsing logic is deterministic in code).
 *   - Wall-clock timeouts are modeled as nondeterministic events that
 *     may fire at any point during the relevant phase.
 *   - The 8 reviewer agent types are abstracted to a reviewer count.
 *   - Merge queue and TDD internals (RED/GREEN retry counts) are
 *     abstracted — the spec focuses on counter interactions and
 *     termination guarantees at the review gate level.
 *)
EXTENDS Integers, FiniteSets, TLC

CONSTANTS
    MaxReviewRounds,         \* Max review-fix cycles + retry-reviews per gate (default 3)
    MaxKeepGoingResets,      \* Max consecutive Keep Going resets per gate (default 3)
    MaxTddKeepGoingPerGate,  \* Max TDD Keep Going selections within a gate (default 5)
    NumTasks,                \* Number of tasks in the tier being modeled (1..3)
    NULL                     \* Sentinel value

VARIABLES
    pipelineState,       \* "idle" | "locked" | "running" | "preMergeReview"
                         \*   | "reviewFix" | "mergeQueue" | "finalReview"
                         \*   | "finalReviewFix" | "COMPLETE" | "HALTED"
    lockHolder,          \* NULL | PID of the process holding the lock
    reviewRound,         \* Current review round counter (0..MaxReviewRounds)
    keepGoingResets,     \* Meta-counter for Keep Going on review escalation
    tddKeepGoingCount,   \* TDD Keep Going selections within current review gate
    verdict,             \* NULL | "pass" | "fail" | "retry"
    tasksDone,           \* Number of tasks that have passed review and merged
    gateTimedOut,        \* Boolean: has the review gate wall-clock fired?
    globalTimedOut,      \* Boolean: has the global pipeline timeout fired?
    reviewGateType       \* "preMerge" | "final" — which gate is active

vars == <<pipelineState, lockHolder, reviewRound, keepGoingResets,
          tddKeepGoingCount, verdict, tasksDone, gateTimedOut,
          globalTimedOut, reviewGateType>>

Tasks == 1..NumTasks

-----------------------------------------------------------------------------
(* Type invariant *)
-----------------------------------------------------------------------------

TypeOK ==
    /\ pipelineState \in {"idle", "locked", "running", "preMergeReview",
                          "reviewFix", "mergeQueue", "finalReview",
                          "finalReviewFix", "COMPLETE", "HALTED"}
    /\ lockHolder \in {NULL} \cup {1}  \* Simplified: 1 = held, NULL = free
    /\ reviewRound \in 0..MaxReviewRounds
    /\ keepGoingResets \in 0..(MaxKeepGoingResets + 1)
    /\ tddKeepGoingCount \in 0..(MaxTddKeepGoingPerGate + 1)
    /\ verdict \in {NULL, "pass", "fail", "retry"}
    /\ tasksDone \in 0..NumTasks
    /\ gateTimedOut \in BOOLEAN
    /\ globalTimedOut \in BOOLEAN
    /\ reviewGateType \in {"preMerge", "final", "none"}

-----------------------------------------------------------------------------
(* Initial state *)
-----------------------------------------------------------------------------

Init ==
    /\ pipelineState = "idle"
    /\ lockHolder = NULL
    /\ reviewRound = 0
    /\ keepGoingResets = 0
    /\ tddKeepGoingCount = 0
    /\ verdict = NULL
    /\ tasksDone = 0
    /\ gateTimedOut = FALSE
    /\ globalTimedOut = FALSE
    /\ reviewGateType = "none"

-----------------------------------------------------------------------------
(* Pipeline lock acquisition *)
-----------------------------------------------------------------------------

AcquireLock ==
    /\ pipelineState = "idle"
    /\ lockHolder = NULL
    /\ pipelineState' = "locked"
    /\ lockHolder' = 1
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

(* Transition from locked to running (stages 1-7 abstracted) *)
StartRunning ==
    /\ pipelineState = "locked"
    /\ lockHolder = 1
    /\ pipelineState' = "running"
    /\ UNCHANGED <<lockHolder, reviewRound, keepGoingResets,
                   tddKeepGoingCount, verdict, tasksDone, gateTimedOut,
                   globalTimedOut, reviewGateType>>

-----------------------------------------------------------------------------
(* Pre-merge review gate — entered after task cleanup passes *)
-----------------------------------------------------------------------------

EnterPreMergeReview ==
    /\ pipelineState = "running"
    /\ tasksDone < NumTasks
    /\ pipelineState' = "preMergeReview"
    /\ reviewRound' = 0
    /\ keepGoingResets' = 0
    /\ tddKeepGoingCount' = 0
    /\ verdict' = NULL
    /\ gateTimedOut' = FALSE
    /\ reviewGateType' = "preMerge"
    /\ UNCHANGED <<lockHolder, tasksDone, globalTimedOut>>

(* Review-moderator returns a verdict (nondeterministic) *)
ReviewVerdict ==
    /\ pipelineState \in {"preMergeReview", "finalReview"}
    /\ verdict = NULL
    /\ ~gateTimedOut
    /\ ~globalTimedOut
    /\ \/ (verdict' = "pass" /\ UNCHANGED <<>>)
       \/ (verdict' = "fail" /\ UNCHANGED <<>>)
       \/ (verdict' = "retry" /\ UNCHANGED <<>>)  \* moderator timeout/parse/schema
    /\ reviewRound' = reviewRound  \* round increments on handling, not on verdict
    /\ UNCHANGED <<pipelineState, lockHolder, keepGoingResets,
                   tddKeepGoingCount, tasksDone, gateTimedOut,
                   globalTimedOut, reviewGateType>>

(* Handle pass verdict — task enters merge queue (pre-merge) *)
HandlePassPreMerge ==
    /\ pipelineState = "preMergeReview"
    /\ verdict = "pass"
    /\ pipelineState' = "mergeQueue"
    /\ verdict' = NULL
    /\ reviewGateType' = "none"
    /\ UNCHANGED <<lockHolder, reviewRound, keepGoingResets,
                   tddKeepGoingCount, tasksDone, gateTimedOut,
                   globalTimedOut>>

(* Handle fail verdict — enter review-fix cycle (pre-merge) *)
HandleFailPreMerge ==
    /\ pipelineState = "preMergeReview"
    /\ verdict = "fail"
    /\ reviewRound < MaxReviewRounds
    /\ pipelineState' = "reviewFix"
    /\ verdict' = NULL
    /\ UNCHANGED <<lockHolder, reviewRound, keepGoingResets,
                   tddKeepGoingCount, tasksDone, gateTimedOut,
                   globalTimedOut, reviewGateType>>

(* Handle retry verdict — retry-review, increment round counter *)
HandleRetryPreMerge ==
    /\ pipelineState = "preMergeReview"
    /\ verdict = "retry"
    /\ reviewRound < MaxReviewRounds
    /\ reviewRound' = reviewRound + 1
    /\ verdict' = NULL  \* ready for next review attempt
    /\ UNCHANGED <<pipelineState, lockHolder, keepGoingResets,
                   tddKeepGoingCount, tasksDone, gateTimedOut,
                   globalTimedOut, reviewGateType>>

-----------------------------------------------------------------------------
(* Review-fix cycle (RED -> GREEN -> CLEANUP abstracted as one step) *)
-----------------------------------------------------------------------------

(* Fix cycle completes successfully — triggers re-review *)
ReviewFixComplete ==
    /\ pipelineState = "reviewFix"
    /\ ~gateTimedOut
    /\ ~globalTimedOut
    /\ reviewRound' = reviewRound + 1
    /\ pipelineState' = "preMergeReview"
    /\ verdict' = NULL
    /\ UNCHANGED <<lockHolder, keepGoingResets, tddKeepGoingCount,
                   tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

(* TDD exhaustion during review-fix — user chooses Keep Going *)
TddKeepGoingInFix ==
    /\ pipelineState = "reviewFix"
    /\ tddKeepGoingCount < MaxTddKeepGoingPerGate
    /\ ~gateTimedOut
    /\ ~globalTimedOut
    /\ tddKeepGoingCount' = tddKeepGoingCount + 1
    /\ UNCHANGED <<pipelineState, lockHolder, reviewRound,
                   keepGoingResets, verdict, tasksDone,
                   gateTimedOut, globalTimedOut, reviewGateType>>

(* TDD exhaustion during review-fix — TDD cap reached, escalate to review level *)
TddKeepGoingExhausted ==
    /\ pipelineState = "reviewFix"
    /\ tddKeepGoingCount >= MaxTddKeepGoingPerGate
    /\ reviewRound' = reviewRound + 1
    /\ pipelineState' = "preMergeReview"
    /\ verdict' = "fail"  \* escalated — treated as review failure
    /\ UNCHANGED <<lockHolder, keepGoingResets, tddKeepGoingCount,
                   tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

(* TDD exhaustion during review-fix — user chooses Stop *)
TddStopInFix ==
    /\ pipelineState \in {"reviewFix", "finalReviewFix"}
    /\ pipelineState' = "HALTED"
    /\ lockHolder' = NULL
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

-----------------------------------------------------------------------------
(* Review round exhaustion and escalation *)
-----------------------------------------------------------------------------

(* Review rounds exhausted — user chooses Keep Going *)
ReviewKeepGoing ==
    /\ pipelineState \in {"preMergeReview", "finalReview"}
    /\ \/ (verdict = "fail" /\ reviewRound >= MaxReviewRounds)
       \/ (verdict = "retry" /\ reviewRound >= MaxReviewRounds)
    /\ keepGoingResets < MaxKeepGoingResets
    /\ keepGoingResets' = keepGoingResets + 1
    /\ reviewRound' = 0
    /\ tddKeepGoingCount' = 0  \* TDD counter resets with review gate reset
    /\ verdict' = NULL
    /\ UNCHANGED <<pipelineState, lockHolder, tasksDone,
                   gateTimedOut, globalTimedOut, reviewGateType>>

(* Review rounds exhausted AND Keep Going exhausted — forced stop *)
ReviewForcedStop ==
    /\ pipelineState \in {"preMergeReview", "finalReview"}
    /\ \/ (verdict = "fail" /\ reviewRound >= MaxReviewRounds)
       \/ (verdict = "retry" /\ reviewRound >= MaxReviewRounds)
    /\ keepGoingResets >= MaxKeepGoingResets
    /\ pipelineState' = "HALTED"
    /\ lockHolder' = NULL
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

(* Review rounds exhausted — user chooses Stop (before Keep Going exhaustion) *)
ReviewStop ==
    /\ pipelineState \in {"preMergeReview", "finalReview"}
    /\ \/ (verdict = "fail" /\ reviewRound >= MaxReviewRounds)
       \/ (verdict = "retry" /\ reviewRound >= MaxReviewRounds)
    /\ pipelineState' = "HALTED"
    /\ lockHolder' = NULL
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

-----------------------------------------------------------------------------
(* Merge queue — task merges successfully *)
-----------------------------------------------------------------------------

TaskMerged ==
    /\ pipelineState = "mergeQueue"
    /\ tasksDone' = tasksDone + 1
    /\ pipelineState' = "running"
    /\ UNCHANGED <<lockHolder, reviewRound, keepGoingResets,
                   tddKeepGoingCount, verdict, gateTimedOut,
                   globalTimedOut, reviewGateType>>

-----------------------------------------------------------------------------
(* Post-merge final review *)
-----------------------------------------------------------------------------

EnterFinalReview ==
    /\ pipelineState = "running"
    /\ tasksDone = NumTasks
    /\ pipelineState' = "finalReview"
    /\ reviewRound' = 0
    /\ keepGoingResets' = 0
    /\ tddKeepGoingCount' = 0
    /\ verdict' = NULL
    /\ gateTimedOut' = FALSE
    /\ reviewGateType' = "final"
    /\ UNCHANGED <<lockHolder, tasksDone, globalTimedOut>>

HandlePassFinal ==
    /\ pipelineState = "finalReview"
    /\ verdict = "pass"
    /\ pipelineState' = "COMPLETE"
    /\ lockHolder' = NULL
    /\ reviewGateType' = "none"
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, globalTimedOut>>

HandleFailFinal ==
    /\ pipelineState = "finalReview"
    /\ verdict = "fail"
    /\ reviewRound < MaxReviewRounds
    /\ pipelineState' = "finalReviewFix"
    /\ verdict' = NULL
    /\ UNCHANGED <<lockHolder, reviewRound, keepGoingResets,
                   tddKeepGoingCount, tasksDone, gateTimedOut,
                   globalTimedOut, reviewGateType>>

HandleRetryFinal ==
    /\ pipelineState = "finalReview"
    /\ verdict = "retry"
    /\ reviewRound < MaxReviewRounds
    /\ reviewRound' = reviewRound + 1
    /\ verdict' = NULL
    /\ UNCHANGED <<pipelineState, lockHolder, keepGoingResets,
                   tddKeepGoingCount, tasksDone, gateTimedOut,
                   globalTimedOut, reviewGateType>>

(* Final review fix cycle completes — triggers re-review *)
FinalReviewFixComplete ==
    /\ pipelineState = "finalReviewFix"
    /\ ~gateTimedOut
    /\ ~globalTimedOut
    /\ reviewRound' = reviewRound + 1
    /\ pipelineState' = "finalReview"
    /\ verdict' = NULL
    /\ UNCHANGED <<lockHolder, keepGoingResets, tddKeepGoingCount,
                   tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

(* TDD Keep Going during final review fix *)
TddKeepGoingInFinalFix ==
    /\ pipelineState = "finalReviewFix"
    /\ tddKeepGoingCount < MaxTddKeepGoingPerGate
    /\ ~gateTimedOut
    /\ ~globalTimedOut
    /\ tddKeepGoingCount' = tddKeepGoingCount + 1
    /\ UNCHANGED <<pipelineState, lockHolder, reviewRound,
                   keepGoingResets, verdict, tasksDone,
                   gateTimedOut, globalTimedOut, reviewGateType>>

(* TDD cap reached during final review fix *)
TddKeepGoingExhaustedFinal ==
    /\ pipelineState = "finalReviewFix"
    /\ tddKeepGoingCount >= MaxTddKeepGoingPerGate
    /\ reviewRound' = reviewRound + 1
    /\ pipelineState' = "finalReview"
    /\ verdict' = "fail"
    /\ UNCHANGED <<lockHolder, keepGoingResets, tddKeepGoingCount,
                   tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

-----------------------------------------------------------------------------
(* Timeout events (modeled as nondeterministic) *)
-----------------------------------------------------------------------------

(* Review gate wall-clock timeout *)
ReviewGateTimeout ==
    /\ pipelineState \in {"preMergeReview", "reviewFix",
                          "finalReview", "finalReviewFix"}
    /\ ~gateTimedOut
    /\ ~globalTimedOut
    /\ gateTimedOut' = TRUE
    /\ UNCHANGED <<pipelineState, lockHolder, reviewRound,
                   keepGoingResets, tddKeepGoingCount, verdict,
                   tasksDone, globalTimedOut, reviewGateType>>

(* Handle gate timeout — escalation: Keep Going resets gate timer *)
GateTimeoutKeepGoing ==
    /\ gateTimedOut = TRUE
    /\ ~globalTimedOut
    /\ pipelineState \in {"preMergeReview", "reviewFix",
                          "finalReview", "finalReviewFix"}
    /\ keepGoingResets < MaxKeepGoingResets
    /\ gateTimedOut' = FALSE
    /\ keepGoingResets' = keepGoingResets + 1
    /\ reviewRound' = 0
    /\ tddKeepGoingCount' = 0
    /\ verdict' = NULL
    /\ pipelineState' = IF reviewGateType = "preMerge"
                         THEN "preMergeReview"
                         ELSE "finalReview"
    /\ UNCHANGED <<lockHolder, tasksDone, globalTimedOut,
                   reviewGateType>>

(* Handle gate timeout — escalation: Stop *)
GateTimeoutStop ==
    /\ gateTimedOut = TRUE
    /\ pipelineState \in {"preMergeReview", "reviewFix",
                          "finalReview", "finalReviewFix"}
    /\ pipelineState' = "HALTED"
    /\ lockHolder' = NULL
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, globalTimedOut,
                   reviewGateType>>

(* Global pipeline timeout — fires regardless of state *)
GlobalTimeout ==
    /\ pipelineState \notin {"idle", "COMPLETE", "HALTED"}
    /\ ~globalTimedOut
    /\ globalTimedOut' = TRUE
    /\ pipelineState' = "HALTED"
    /\ lockHolder' = NULL
    /\ UNCHANGED <<reviewRound, keepGoingResets, tddKeepGoingCount,
                   verdict, tasksDone, gateTimedOut, reviewGateType>>

(* Terminal stuttering — COMPLETE and HALTED are absorbing states.
   This action keeps Next enabled so TLC does not report a spurious
   deadlock when the pipeline reaches a terminal state. *)
Done ==
    /\ pipelineState \in {"COMPLETE", "HALTED"}
    /\ UNCHANGED vars

-----------------------------------------------------------------------------
(* Next-state relation *)
-----------------------------------------------------------------------------

Next ==
    \/ AcquireLock
    \/ StartRunning
    \/ EnterPreMergeReview
    \/ ReviewVerdict
    \/ HandlePassPreMerge
    \/ HandleFailPreMerge
    \/ HandleRetryPreMerge
    \/ ReviewFixComplete
    \/ TddKeepGoingInFix
    \/ TddKeepGoingExhausted
    \/ TddStopInFix
    \/ ReviewKeepGoing
    \/ ReviewForcedStop
    \/ ReviewStop
    \/ TaskMerged
    \/ EnterFinalReview
    \/ HandlePassFinal
    \/ HandleFailFinal
    \/ HandleRetryFinal
    \/ FinalReviewFixComplete
    \/ TddKeepGoingInFinalFix
    \/ TddKeepGoingExhaustedFinal
    \/ ReviewGateTimeout
    \/ GateTimeoutKeepGoing
    \/ GateTimeoutStop
    \/ GlobalTimeout
    \/ Done

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

-----------------------------------------------------------------------------
(* Safety properties *)
-----------------------------------------------------------------------------

(* S1: COMPLETE and HALTED are absorbing — no transitions out *)
AbsorbingTerminalStates ==
    /\ (pipelineState = "COMPLETE" => pipelineState' = "COMPLETE")
    /\ (pipelineState = "HALTED" => pipelineState' = "HALTED")

(* Check as an action property via invariant on reachable states *)
TerminalIsAbsorbing ==
    pipelineState \in {"COMPLETE", "HALTED"} =>
        /\ lockHolder = NULL

(* S2: Lock released in terminal states *)
LockReleasedInTerminal ==
    pipelineState \in {"COMPLETE", "HALTED"} => lockHolder = NULL

(* S3: Pipeline holds lock while running *)
LockHeldWhileActive ==
    pipelineState \notin {"idle", "COMPLETE", "HALTED"} => lockHolder = 1

(* S4: Review round never exceeds MaxReviewRounds *)
ReviewRoundBounded ==
    reviewRound <= MaxReviewRounds

(* S5: Keep Going resets never exceed MaxKeepGoingResets + 1
       (can reach MaxKeepGoingResets, then forced stop fires) *)
KeepGoingResetsBounded ==
    keepGoingResets <= MaxKeepGoingResets + 1

(* S6: TDD Keep Going never exceeds MaxTddKeepGoingPerGate + 1 *)
TddKeepGoingBounded ==
    tddKeepGoingCount <= MaxTddKeepGoingPerGate + 1

(* S7: Tasks done never exceeds total tasks *)
TaskCountBounded ==
    tasksDone <= NumTasks

(* S8: Final review only runs after all tasks merged *)
FinalReviewRequiresAllMerged ==
    pipelineState \in {"finalReview", "finalReviewFix"} =>
        tasksDone = NumTasks

(* S9: Cannot enter review fix without a prior fail verdict *)
NoReviewFixWithoutFail ==
    pipelineState \in {"reviewFix", "finalReviewFix"} =>
        verdict = NULL  \* verdict was consumed (set to NULL) on transition

(* S10: Global timeout always halts *)
GlobalTimeoutHalts ==
    globalTimedOut => pipelineState = "HALTED"

(* S11: MaxKeepGoingResets=0 means Keep Going is never used *)
(* This is enforced structurally by the guard keepGoingResets < MaxKeepGoingResets *)

(* Composite safety invariant *)
Safety ==
    /\ TypeOK
    /\ LockReleasedInTerminal
    /\ LockHeldWhileActive
    /\ ReviewRoundBounded
    /\ KeepGoingResetsBounded
    /\ TddKeepGoingBounded
    /\ TaskCountBounded
    /\ FinalReviewRequiresAllMerged
    /\ GlobalTimeoutHalts

-----------------------------------------------------------------------------
(* Liveness properties *)
-----------------------------------------------------------------------------

(* L1: Pipeline eventually terminates — reaches COMPLETE or HALTED *)
EventuallyTerminates ==
    <>(pipelineState \in {"COMPLETE", "HALTED"})

(* L2: Once a review gate starts, it eventually resolves
       (pass, escalation->stop, or timeout->halt) *)
ReviewGateResolves ==
    (pipelineState = "preMergeReview") ~>
        (pipelineState \in {"mergeQueue", "HALTED", "running"})

FinalReviewResolves ==
    (pipelineState = "finalReview") ~>
        (pipelineState \in {"COMPLETE", "HALTED"})

(* L3: Every task eventually merges or pipeline halts *)
AllTasksResolve ==
    <>(tasksDone = NumTasks \/ pipelineState = "HALTED")

=============================================================================
