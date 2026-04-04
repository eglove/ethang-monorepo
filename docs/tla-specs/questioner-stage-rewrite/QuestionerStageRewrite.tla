----------------------- MODULE QuestionerStageRewrite -----------------------
\* TLA+ specification for the design-pipeline questioner stage rewrite.
\* Models the questioner session state machine, store transitions, retry logic,
\* lint-fixer double-pass, signing-off guard, liveness bound, and feature flag.
\*
\* Source briefing: docs/questioner-sessions/2026-04-04_questioner-stage-rewrite.md
\* Debate synthesis: docs/debate-moderator-sessions/2026-04-04_questioner-stage-rewrite.md

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxRetries,         \* Max inline retries per turn (3)
    MaxTurns,           \* Safety valve turn cap (50)
    MaxSignoffAttempts, \* Max attempts to get LLM to produce signoff (3)
    MaxLintPasses,      \* Max lint-fixer attempts before escalation
    NumStages           \* Number of stages gated by feature flag (6: stages 2-7)

VARIABLES
    sessionState,       \* Discriminated union: "questioning", "awaitingInput",
                        \*   "summaryPresented", "signingOff", "completed", "failed"
    turnCount,          \* Current turn number
    retryCount,         \* Current retry count within a turn
    signoffAttempts,    \* Attempts to get LLM signoff cooperation
    storeStatus,        \* Store stage status: "idle", "active", "completed", "failed"
    storeErrorKind,     \* Error kind: "none", "retry_exhausted", "user_abandon",
                        \*   "signoff_exhausted", "turn_cap_exceeded"
    artifactQuest,      \* Questioner artifact: "empty", "partial", "complete"
    lintCleanRuns,      \* Consecutive clean lint runs (need 2)
    lintAttempts,       \* Total lint-fixer attempts
    lintEscalated,      \* Whether lint-fixer escalated to user
    briefingSaved,      \* Whether briefing file has been saved
    featureFlagOn,      \* Whether legacy feature flag is on
    stagesRun,          \* Whether stages 2-7 have been dispatched
    waitForResolved     \* Whether waitFor completion gate resolved

vars == <<sessionState, turnCount, retryCount, signoffAttempts,
          storeStatus, storeErrorKind, artifactQuest,
          lintCleanRuns, lintAttempts, lintEscalated,
          briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* --------------------------------------------------------------------------
\* Type invariant
\* --------------------------------------------------------------------------
TypeOK ==
    /\ sessionState \in {"questioning", "awaitingInput", "summaryPresented",
                         "signingOff", "completed", "failed"}
    /\ turnCount \in 0..MaxTurns
    /\ retryCount \in 0..MaxRetries
    /\ signoffAttempts \in 0..MaxSignoffAttempts
    /\ storeStatus \in {"idle", "active", "completed", "failed"}
    /\ storeErrorKind \in {"none", "retry_exhausted", "user_abandon",
                           "signoff_exhausted", "turn_cap_exceeded"}
    /\ artifactQuest \in {"empty", "partial", "complete"}
    /\ lintCleanRuns \in 0..2
    /\ lintAttempts \in 0..MaxLintPasses
    /\ lintEscalated \in BOOLEAN
    /\ briefingSaved \in BOOLEAN
    /\ featureFlagOn \in BOOLEAN
    /\ stagesRun \in BOOLEAN
    /\ waitForResolved \in BOOLEAN

\* --------------------------------------------------------------------------
\* Initial state
\* --------------------------------------------------------------------------
Init ==
    /\ sessionState = "questioning"
    /\ turnCount = 0
    /\ retryCount = 0
    /\ signoffAttempts = 0
    /\ storeStatus = "active"
    /\ storeErrorKind = "none"
    /\ artifactQuest = "empty"
    /\ lintCleanRuns = 0
    /\ lintAttempts = 0
    /\ lintEscalated = FALSE
    /\ briefingSaved = FALSE
    /\ featureFlagOn \in BOOLEAN  \* Non-deterministic: model both paths
    /\ stagesRun = FALSE
    /\ waitForResolved = FALSE

\* --------------------------------------------------------------------------
\* Session actions
\* --------------------------------------------------------------------------

\* LLM asks a question, user will respond
AskQuestion ==
    /\ sessionState = "questioning"
    /\ turnCount < MaxTurns
    /\ retryCount = 0
    /\ sessionState' = "awaitingInput"
    /\ turnCount' = turnCount + 1
    /\ artifactQuest' = IF artifactQuest = "empty" THEN "partial" ELSE artifactQuest
    /\ UNCHANGED <<retryCount, signoffAttempts, storeStatus, storeErrorKind,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* User provides a normal answer
UserAnswer ==
    /\ sessionState = "awaitingInput"
    /\ sessionState' = "questioning"
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* User types "/summary" (exact match interception)
UserRequestsSummary ==
    /\ sessionState = "awaitingInput"
    /\ sessionState' = "summaryPresented"
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* After summary, user says "keep going" — session continues
UserContinuesAfterSummary ==
    /\ sessionState = "summaryPresented"
    /\ sessionState' = "questioning"
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* After summary, user confirms sign-off
UserConfirmsSignoff ==
    /\ sessionState = "summaryPresented"
    /\ sessionState' = "signingOff"
    /\ signoffAttempts' = 0
    /\ UNCHANGED <<turnCount, retryCount, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* LLM naturally initiates sign-off (without explicit /summary)
LLMInitiatesSignoff ==
    /\ sessionState = "questioning"
    /\ sessionState' = "signingOff"
    /\ signoffAttempts' = 0
    /\ UNCHANGED <<turnCount, retryCount, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* LLM cooperates and produces signoff response
LLMProducesSignoff ==
    /\ sessionState = "signingOff"
    /\ sessionState' = "completed"
    /\ storeStatus' = "completed"
    /\ storeErrorKind' = "none"
    /\ artifactQuest' = "complete"
    /\ briefingSaved' = TRUE
    /\ waitForResolved' = TRUE
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   featureFlagOn, stagesRun>>

\* LLM does NOT cooperate during signoff — produces question instead (gap #3)
LLMRefusesSignoff ==
    /\ sessionState = "signingOff"
    /\ signoffAttempts < MaxSignoffAttempts
    /\ signoffAttempts' = signoffAttempts + 1
    /\ UNCHANGED <<sessionState, turnCount, retryCount, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* Signoff attempts exhausted — CLI forces signoff from conversation content
CLIForcesSignoff ==
    /\ sessionState = "signingOff"
    /\ signoffAttempts >= MaxSignoffAttempts
    /\ sessionState' = "completed"
    /\ storeStatus' = "completed"
    /\ storeErrorKind' = "none"
    /\ artifactQuest' = "complete"
    /\ briefingSaved' = TRUE
    /\ waitForResolved' = TRUE
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   featureFlagOn, stagesRun>>

\* --------------------------------------------------------------------------
\* Safety valve: turn cap exceeded (gap #2)
\* --------------------------------------------------------------------------
TurnCapExceeded ==
    /\ sessionState \in {"questioning", "awaitingInput"}
    /\ turnCount >= MaxTurns
    /\ sessionState' = "failed"
    /\ storeStatus' = "failed"
    /\ storeErrorKind' = "turn_cap_exceeded"
    /\ artifactQuest' = IF artifactQuest = "empty" THEN "empty" ELSE "partial"
    /\ briefingSaved' = TRUE
    /\ waitForResolved' = TRUE
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   featureFlagOn, stagesRun>>

\* --------------------------------------------------------------------------
\* Retry logic: malformed JSON or network error
\* --------------------------------------------------------------------------
LLMMalformedResponse ==
    /\ sessionState = "questioning"
    /\ retryCount < MaxRetries
    /\ retryCount' = retryCount + 1
    /\ UNCHANGED <<sessionState, turnCount, signoffAttempts, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

RetryExhausted ==
    /\ sessionState = "questioning"
    /\ retryCount >= MaxRetries
    /\ sessionState' = "failed"
    /\ storeStatus' = "failed"
    /\ storeErrorKind' = "retry_exhausted"
    /\ briefingSaved' = TRUE
    /\ waitForResolved' = TRUE
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts, artifactQuest,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   featureFlagOn, stagesRun>>

RetrySucceeds ==
    /\ sessionState = "questioning"
    /\ retryCount > 0
    /\ retryCount' = 0
    /\ UNCHANGED <<sessionState, turnCount, signoffAttempts, storeStatus, storeErrorKind,
                   artifactQuest, lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* --------------------------------------------------------------------------
\* SIGINT / user abandonment
\* --------------------------------------------------------------------------
UserAbandons ==
    /\ sessionState \in {"questioning", "awaitingInput", "summaryPresented", "signingOff"}
    /\ sessionState' = "failed"
    /\ storeStatus' = "failed"
    /\ storeErrorKind' = "user_abandon"
    /\ briefingSaved' = TRUE
    /\ waitForResolved' = TRUE
    /\ UNCHANGED <<turnCount, retryCount, signoffAttempts, artifactQuest,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   featureFlagOn, stagesRun>>

\* --------------------------------------------------------------------------
\* Lint-fixer double-pass (post-session, only after briefing saved)
\* --------------------------------------------------------------------------
LintRunClean ==
    /\ sessionState = "completed"
    /\ briefingSaved = TRUE
    /\ lintCleanRuns < 2
    /\ lintAttempts < MaxLintPasses
    /\ lintCleanRuns' = lintCleanRuns + 1
    /\ lintAttempts' = lintAttempts + 1
    /\ UNCHANGED <<sessionState, turnCount, retryCount, signoffAttempts,
                   storeStatus, storeErrorKind, artifactQuest,
                   lintEscalated, briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

LintRunDirty ==
    /\ sessionState = "completed"
    /\ briefingSaved = TRUE
    /\ lintCleanRuns < 2
    /\ lintAttempts < MaxLintPasses
    /\ lintCleanRuns' = 0  \* Reset consecutive clean count
    /\ lintAttempts' = lintAttempts + 1
    /\ UNCHANGED <<sessionState, turnCount, retryCount, signoffAttempts,
                   storeStatus, storeErrorKind, artifactQuest,
                   lintEscalated, briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* Lint-fixer escalates to user when stuck
LintEscalateToUser ==
    /\ sessionState = "completed"
    /\ briefingSaved = TRUE
    /\ lintCleanRuns < 2
    /\ lintAttempts >= MaxLintPasses
    /\ ~lintEscalated
    /\ lintEscalated' = TRUE
    /\ lintAttempts' = 0        \* Reset attempts after escalation (user provides recipe)
    /\ UNCHANGED <<sessionState, turnCount, retryCount, signoffAttempts,
                   storeStatus, storeErrorKind, artifactQuest,
                   lintCleanRuns, briefingSaved, featureFlagOn, stagesRun, waitForResolved>>

\* --------------------------------------------------------------------------
\* Feature flag: stages 2-7 dispatch (gap #8)
\* --------------------------------------------------------------------------
DispatchStages ==
    /\ sessionState = "completed"
    /\ lintCleanRuns >= 2       \* Lint passed double-pass
    /\ ~stagesRun
    /\ stagesRun' = TRUE
    /\ UNCHANGED <<sessionState, turnCount, retryCount, signoffAttempts,
                   storeStatus, storeErrorKind, artifactQuest,
                   lintCleanRuns, lintAttempts, lintEscalated,
                   briefingSaved, featureFlagOn, waitForResolved>>
    \* Note: featureFlagOn determines whether claude CLI or legacy loop is used,
    \* but both are modeled as a single dispatch since the distinction is
    \* an implementation detail — the state transitions are identical.

\* --------------------------------------------------------------------------
\* Terminal: system has reached a final state (stuttering allowed by Spec)
\* Failed sessions are terminal. Completed sessions are terminal once
\* lint has passed and stages have dispatched (or lint is still running).
\* --------------------------------------------------------------------------
Done ==
    \/ sessionState = "failed"
    \/ (sessionState = "completed" /\ stagesRun = TRUE)

\* --------------------------------------------------------------------------
\* Next-state relation
\* --------------------------------------------------------------------------
Next ==
    \/ AskQuestion
    \/ UserAnswer
    \/ UserRequestsSummary
    \/ UserContinuesAfterSummary
    \/ UserConfirmsSignoff
    \/ LLMInitiatesSignoff
    \/ LLMProducesSignoff
    \/ LLMRefusesSignoff
    \/ CLIForcesSignoff
    \/ TurnCapExceeded
    \/ LLMMalformedResponse
    \/ RetryExhausted
    \/ RetrySucceeds
    \/ UserAbandons
    \/ LintRunClean
    \/ LintRunDirty
    \/ LintEscalateToUser
    \/ DispatchStages

\* --------------------------------------------------------------------------
\* Fairness: the system must eventually make progress
\* --------------------------------------------------------------------------
UserRespondToSummary ==
    \/ UserContinuesAfterSummary
    \/ UserConfirmsSignoff
    \/ UserAbandons

Fairness ==
    /\ WF_vars(AskQuestion)
    /\ WF_vars(UserAnswer)
    /\ WF_vars(UserRespondToSummary)
    /\ WF_vars(LLMProducesSignoff)
    /\ WF_vars(CLIForcesSignoff)
    /\ WF_vars(TurnCapExceeded)
    /\ WF_vars(RetryExhausted)
    /\ WF_vars(LintRunClean)
    /\ WF_vars(DispatchStages)
    /\ SF_vars(UserAbandons)  \* Strong fairness: user can always abandon

Spec == Init /\ [][Next]_vars /\ Fairness

\* --------------------------------------------------------------------------
\* Safety properties
\* --------------------------------------------------------------------------

\* S1: Store only transitions to "completed" after signoff or CLI-forced signoff
StoreCompletedOnlyAfterSignoff ==
    storeStatus = "completed" =>
        /\ sessionState = "completed"
        /\ artifactQuest = "complete"
        /\ briefingSaved = TRUE

\* S2: Retry count never exceeds max
RetryBounded ==
    retryCount <= MaxRetries

\* S3: Signoff attempts never exceed max
SignoffAttemptsBounded ==
    signoffAttempts <= MaxSignoffAttempts

\* S4: Turn count never exceeds max
TurnsBounded ==
    turnCount <= MaxTurns

\* S5: Lint-fixer requires two consecutive clean passes before dispatch
LintDoublePassRequired ==
    stagesRun = TRUE => lintCleanRuns >= 2

\* S6: No completed status without briefing saved
CompletedRequiresBriefing ==
    storeStatus = "completed" => briefingSaved = TRUE

\* S7: Failed status always has an error kind
FailedHasErrorKind ==
    storeStatus = "failed" => storeErrorKind /= "none"

\* S8: waitFor resolves only on terminal states
WaitForOnlyOnTerminal ==
    waitForResolved = TRUE =>
        sessionState \in {"completed", "failed"}

\* S9: Stages only dispatch after completed session with lint pass
StagesOnlyAfterLintPass ==
    stagesRun = TRUE =>
        /\ sessionState = "completed"
        /\ lintCleanRuns >= 2

\* --------------------------------------------------------------------------
\* Liveness properties
\* --------------------------------------------------------------------------

\* L1: Session always terminates
SessionTerminates ==
    <>(sessionState \in {"completed", "failed"})

\* L2: waitFor always resolves
WaitForResolves ==
    <>(waitForResolved = TRUE)

\* L3: If completed and lint passes, stages eventually dispatch
StagesEventuallyDispatch ==
    (sessionState = "completed" /\ lintCleanRuns >= 2) ~> stagesRun = TRUE

=============================================================================
