-------------------- MODULE ReviewerGate --------------------
EXTENDS Integers, FiniteSets, Sequences, TLC

\* ============================================================
\* Constants
\* ============================================================

CONSTANTS
    Tasks,              \* Set of task IDs
    Reviewers,          \* Set of reviewer IDs (8 in production)
    MaxReviewRevisions, \* Max full review-revision cycles per task (e.g., 3)
    MaxReviewerRetries, \* Max retries per reviewer on crash/timeout (e.g., 2)
    MinReviewQuorum     \* Minimum reviewers required for valid gate (e.g., 5)

\* ============================================================
\* Derived sets
\* ============================================================

ReviewVerdict == {"PASS", "FAIL"}
ReviewScope == {"SESSION_DIFF", "OUT_OF_SCOPE"}

TaskStates == {
    "PENDING",
    "LOCAL_REVIEW",
    "REVIEWING",
    "REVIEW_PASSED",
    "REVIEW_FAILED",
    "REVISING",
    "MERGED",
    "FAILED"
}

TerminalTaskStates == {"MERGED", "FAILED"}

ReviewerStates == {
    "IDLE",
    "RUNNING",
    "PASS",
    "FAIL",
    "UNAVAILABLE"
}

\* ============================================================
\* Variables
\* ============================================================

VARIABLES
    taskState,           \* [Tasks -> TaskStates]
    reviewRevisionCount, \* [Tasks -> 0..MaxReviewRevisions]
    reviewerState,       \* [Tasks -> [Reviewers -> ReviewerStates]]
    reviewerRetries,     \* [Tasks -> [Reviewers -> 0..MaxReviewerRetries]]
    reviewerVerdict,     \* [Tasks -> [Reviewers -> ReviewVerdict \cup {"NONE"}]]
    reviewerScope        \* [Tasks -> [Reviewers -> ReviewScope \cup {"NONE"}]]

vars == <<taskState, reviewRevisionCount, reviewerState,
          reviewerRetries, reviewerVerdict, reviewerScope>>

\* ============================================================
\* Type invariant
\* ============================================================

TypeOK ==
    /\ taskState \in [Tasks -> TaskStates]
    /\ reviewRevisionCount \in [Tasks -> 0..MaxReviewRevisions]
    /\ reviewerState \in [Tasks -> [Reviewers -> ReviewerStates]]
    /\ reviewerRetries \in [Tasks -> [Reviewers -> 0..MaxReviewerRetries]]
    /\ reviewerVerdict \in [Tasks -> [Reviewers -> ReviewVerdict \cup {"NONE"}]]
    /\ reviewerScope \in [Tasks -> [Reviewers -> ReviewScope \cup {"NONE"}]]

\* ============================================================
\* Helpers
\* ============================================================

InitReviewerMap(val) == [t \in Tasks |-> [r \in Reviewers |-> val]]

\* Available reviewers for a task: those not UNAVAILABLE
AvailableReviewers(t) ==
    {r \in Reviewers : reviewerState[t][r] /= "UNAVAILABLE"}

\* Reviewers that completed (PASS or FAIL or UNAVAILABLE)
CompletedReviewers(t) ==
    {r \in Reviewers : reviewerState[t][r] \in {"PASS", "FAIL", "UNAVAILABLE"}}

\* Reviewers that responded (not UNAVAILABLE)
RespondedReviewers(t) ==
    {r \in Reviewers : reviewerState[t][r] \in {"PASS", "FAIL"}}

\* All reviewers finished (no one IDLE or RUNNING)
AllReviewersFinished(t) ==
    CompletedReviewers(t) = Reviewers

\* Quorum met: enough non-unavailable reviewers responded
QuorumMet(t) ==
    Cardinality(RespondedReviewers(t)) >= MinReviewQuorum

\* All responded reviewers passed
AllRespondedPassed(t) ==
    \A r \in RespondedReviewers(t) : reviewerVerdict[t][r] = "PASS"

\* At least one responded reviewer failed
SomeRespondedFailed(t) ==
    \E r \in RespondedReviewers(t) : reviewerVerdict[t][r] = "FAIL"

\* Reset reviewer state for a new review cycle on task t
ResetReviewers(t) ==
    /\ reviewerState' = [reviewerState EXCEPT ![t] =
        [r \in Reviewers |-> "IDLE"]]
    /\ reviewerRetries' = [reviewerRetries EXCEPT ![t] =
        [r \in Reviewers |-> 0]]
    /\ reviewerVerdict' = [reviewerVerdict EXCEPT ![t] =
        [r \in Reviewers |-> "NONE"]]
    /\ reviewerScope' = [reviewerScope EXCEPT ![t] =
        [r \in Reviewers |-> "NONE"]]

\* ============================================================
\* Init
\* ============================================================

Init ==
    /\ taskState = [t \in Tasks |-> "PENDING"]
    /\ reviewRevisionCount = [t \in Tasks |-> 0]
    /\ reviewerState = InitReviewerMap("IDLE")
    /\ reviewerRetries = InitReviewerMap(0)
    /\ reviewerVerdict = InitReviewerMap("NONE")
    /\ reviewerScope = InitReviewerMap("NONE")

\* ============================================================
\* Actions
\* ============================================================

\* Task completes local self-review and enters REVIEWING state
\* (pair session LOCAL_REVIEW -> reviewer gate)
BeginLocalReview(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "PENDING"
    /\ taskState' = [taskState EXCEPT ![t] = "LOCAL_REVIEW"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

CompleteLocalReview(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "LOCAL_REVIEW"
    /\ taskState' = [taskState EXCEPT ![t] = "REVIEWING"]
    /\ ResetReviewers(t)
    /\ UNCHANGED <<reviewRevisionCount>>

\* Project-manager dispatches a reviewer (IDLE -> RUNNING)
DispatchReviewer(t, r) ==
    /\ t \in Tasks
    /\ r \in Reviewers
    /\ taskState[t] = "REVIEWING"
    /\ reviewerState[t][r] = "IDLE"
    /\ reviewerState' = [reviewerState EXCEPT ![t][r] = "RUNNING"]
    /\ UNCHANGED <<taskState, reviewRevisionCount, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* Reviewer completes with PASS verdict
ReviewerPass(t, r) ==
    /\ t \in Tasks
    /\ r \in Reviewers
    /\ taskState[t] = "REVIEWING"
    /\ reviewerState[t][r] = "RUNNING"
    /\ reviewerState' = [reviewerState EXCEPT ![t][r] = "PASS"]
    /\ reviewerVerdict' = [reviewerVerdict EXCEPT ![t][r] = "PASS"]
    /\ \E s \in ReviewScope :
        reviewerScope' = [reviewerScope EXCEPT ![t][r] = s]
    /\ UNCHANGED <<taskState, reviewRevisionCount, reviewerRetries>>

\* Reviewer completes with FAIL verdict
ReviewerFail(t, r) ==
    /\ t \in Tasks
    /\ r \in Reviewers
    /\ taskState[t] = "REVIEWING"
    /\ reviewerState[t][r] = "RUNNING"
    /\ reviewerState' = [reviewerState EXCEPT ![t][r] = "FAIL"]
    /\ reviewerVerdict' = [reviewerVerdict EXCEPT ![t][r] = "FAIL"]
    /\ reviewerScope' = [reviewerScope EXCEPT ![t][r] = "SESSION_DIFF"]
    /\ UNCHANGED <<taskState, reviewRevisionCount, reviewerRetries>>

\* Reviewer crashes/times out - retry if under limit
ReviewerCrashRetry(t, r) ==
    /\ t \in Tasks
    /\ r \in Reviewers
    /\ taskState[t] = "REVIEWING"
    /\ reviewerState[t][r] = "RUNNING"
    /\ reviewerRetries[t][r] < MaxReviewerRetries
    /\ reviewerRetries' = [reviewerRetries EXCEPT ![t][r] = @ + 1]
    /\ reviewerState' = [reviewerState EXCEPT ![t][r] = "IDLE"]
    /\ UNCHANGED <<taskState, reviewRevisionCount, reviewerVerdict, reviewerScope>>

\* Reviewer exhausts retries - marked unavailable
ReviewerExhausted(t, r) ==
    /\ t \in Tasks
    /\ r \in Reviewers
    /\ taskState[t] = "REVIEWING"
    /\ reviewerState[t][r] = "RUNNING"
    /\ reviewerRetries[t][r] >= MaxReviewerRetries
    /\ reviewerState' = [reviewerState EXCEPT ![t][r] = "UNAVAILABLE"]
    /\ UNCHANGED <<taskState, reviewRevisionCount, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* All reviewers finished, quorum met, all passed -> REVIEW_PASSED
ReviewGatePass(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVIEWING"
    /\ AllReviewersFinished(t)
    /\ QuorumMet(t)
    /\ AllRespondedPassed(t)
    /\ taskState' = [taskState EXCEPT ![t] = "REVIEW_PASSED"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* All reviewers finished, quorum met, some failed -> REVIEW_FAILED
ReviewGateFail(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVIEWING"
    /\ AllReviewersFinished(t)
    /\ QuorumMet(t)
    /\ SomeRespondedFailed(t)
    /\ taskState' = [taskState EXCEPT ![t] = "REVIEW_FAILED"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* All reviewers finished but quorum NOT met -> escalate, task fails
ReviewGateNoQuorum(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVIEWING"
    /\ AllReviewersFinished(t)
    /\ ~QuorumMet(t)
    /\ taskState' = [taskState EXCEPT ![t] = "FAILED"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* Review passed -> merge
MergeTask(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVIEW_PASSED"
    /\ taskState' = [taskState EXCEPT ![t] = "MERGED"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* Review failed, revisions remaining -> REVISING
BeginRevision(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVIEW_FAILED"
    /\ reviewRevisionCount[t] < MaxReviewRevisions
    /\ taskState' = [taskState EXCEPT ![t] = "REVISING"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* Review failed, no revisions remaining -> session fails
RevisionExhausted(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVIEW_FAILED"
    /\ reviewRevisionCount[t] >= MaxReviewRevisions
    /\ taskState' = [taskState EXCEPT ![t] = "FAILED"]
    /\ UNCHANGED <<reviewRevisionCount, reviewerState, reviewerRetries,
                   reviewerVerdict, reviewerScope>>

\* Pair finishes revision -> back to REVIEWING with full re-run
CompleteRevision(t) ==
    /\ t \in Tasks
    /\ taskState[t] = "REVISING"
    /\ reviewRevisionCount' = [reviewRevisionCount EXCEPT ![t] = @ + 1]
    /\ taskState' = [taskState EXCEPT ![t] = "REVIEWING"]
    /\ ResetReviewers(t)

\* Terminated tasks stay put
Terminated ==
    /\ \A t \in Tasks : taskState[t] \in TerminalTaskStates
    /\ UNCHANGED vars

\* ============================================================
\* Next-state relation
\* ============================================================

Next ==
    \/ \E t \in Tasks : BeginLocalReview(t)
    \/ \E t \in Tasks : CompleteLocalReview(t)
    \/ \E t \in Tasks, r \in Reviewers : DispatchReviewer(t, r)
    \/ \E t \in Tasks, r \in Reviewers : ReviewerPass(t, r)
    \/ \E t \in Tasks, r \in Reviewers : ReviewerFail(t, r)
    \/ \E t \in Tasks, r \in Reviewers : ReviewerCrashRetry(t, r)
    \/ \E t \in Tasks, r \in Reviewers : ReviewerExhausted(t, r)
    \/ \E t \in Tasks : ReviewGatePass(t)
    \/ \E t \in Tasks : ReviewGateFail(t)
    \/ \E t \in Tasks : ReviewGateNoQuorum(t)
    \/ \E t \in Tasks : MergeTask(t)
    \/ \E t \in Tasks : BeginRevision(t)
    \/ \E t \in Tasks : RevisionExhausted(t)
    \/ \E t \in Tasks : CompleteRevision(t)
    \/ Terminated

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* ============================================================
\* Safety properties
\* ============================================================

\* Revision count never exceeds maximum
RevisionBounded ==
    \A t \in Tasks : reviewRevisionCount[t] <= MaxReviewRevisions

\* Reviewer retries never exceed maximum
ReviewerRetriesBounded ==
    \A t \in Tasks, r \in Reviewers :
        reviewerRetries[t][r] <= MaxReviewerRetries

\* A task can only be MERGED after passing review
MergeOnlyAfterReviewPass ==
    \A t \in Tasks :
        taskState[t] = "MERGED" =>
            \A r \in RespondedReviewers(t) :
                reviewerVerdict[t][r] = "PASS"

\* Reviewers only run during REVIEWING state
ReviewersOnlyDuringReviewing ==
    \A t \in Tasks :
        taskState[t] /= "REVIEWING" =>
            \A r \in Reviewers :
                reviewerState[t][r] /= "RUNNING"

\* No quorum means task cannot pass review
NoQuorumBlocksMerge ==
    \A t \in Tasks :
        (taskState[t] = "REVIEW_PASSED") => QuorumMet(t)

\* ============================================================
\* Liveness properties
\* ============================================================

\* Every task eventually reaches a terminal state
TaskEventuallyTerminal ==
    \A t \in Tasks :
        taskState[t] \in (TaskStates \ TerminalTaskStates)
            ~> taskState[t] \in TerminalTaskStates

\* Every review session eventually resolves
ReviewEventuallyResolves ==
    \A t \in Tasks :
        taskState[t] = "REVIEWING"
            ~> taskState[t] \in {"REVIEW_PASSED", "REVIEW_FAILED", "FAILED"}

=============================================================
