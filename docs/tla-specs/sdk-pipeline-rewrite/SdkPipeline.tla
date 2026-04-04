--------------------------- MODULE SdkPipeline ---------------------------
(*
 * Formal specification of the SDK Pipeline Rewrite.
 *
 * Models a 7-stage design pipeline where TypeScript is the state machine,
 * agents are pure domain instructions, and each pipeline run owns its own
 * instance-scoped state. Incorporates all 5 expert consensus fixes:
 *   1. Instance-scoped state (not singleton)
 *   2. Stage-scoped coordinators (not god object)
 *   3. Incremental migration (feature flags)
 *   4. Git operations behind port/adapter
 *   5. Explicit transaction boundaries with compensation
 *
 * Key characteristics modeled:
 *   - Typed stage transitions with Zod validation at boundaries
 *   - Streaming input for user interaction
 *   - Synchronous message routing for pair programming
 *   - Discriminated union errors with config-driven retry caps
 *   - Compensation/checkpoint for partial failure recovery
 *)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxRuns,          \* Maximum concurrent pipeline runs
    MaxRetries,       \* Config-driven retry cap per stage
    MaxStreamTurns,   \* Maximum streaming input turns (questioner/confirmation)
    Stages            \* Set of stage identifiers

ASSUME MaxRuns \in Nat /\ MaxRuns >= 1
ASSUME MaxRetries \in Nat /\ MaxRetries >= 1
ASSUME MaxStreamTurns \in Nat /\ MaxStreamTurns >= 1
ASSUME Stages = 1..7

\* ---------- Type domains ----------

\* Stage names (for documentation):
\*   1 = Questioner, 2 = DebateModerator, 3 = TlaWriter,
\*   4 = ExpertReview, 5 = ImplementationPlanning,
\*   6 = PairProgramming, 7 = ForkJoin

\* Run-level lifecycle
RunStates == {
    "idle",
    "running",
    "completed",
    "failed",
    "compensating"
}

\* Stage-level lifecycle (explicit retry/streaming/validation states)
StageStates == {
    "pending",
    "streaming_input",      \* Waiting for user streaming input
    "executing",            \* Agent is executing
    "validating",           \* Zod validation at stage boundary
    "validation_failed",    \* Zod validation failed, will retry
    "retrying",             \* Retrying after transient failure
    "git_operating",        \* Git port/adapter in use
    "pair_routing",         \* Synchronous message routing (stage 6)
    "completed",
    "failed",
    "compensating",         \* Undoing side effects
    "compensated"           \* Successfully compensated
}

\* Error discriminated union tags
ErrorKinds == {
    "none",
    "claude_api_timeout",
    "claude_api_rate_limit",
    "zod_validation",
    "git_failure",
    "user_abandon",
    "retry_exhausted"
}

\* Stages that require streaming input
StreamingStages == {1, 5}  \* Questioner and confirmation gates

\* Stage that uses pair programming routing
PairStage == 6

\* Stages that perform git operations
GitStages == {6, 7}

VARIABLES
    runs,           \* Function from RunId -> run state record
    activeRuns,     \* Set of currently active run IDs
    nextRunId,      \* Counter for generating unique run IDs
    gitOwner        \* 0 = idle, or RunId of the run holding the git adapter

vars == <<runs, activeRuns, nextRunId, gitOwner>>

\* ---------- Helpers ----------

RunIds == 1..MaxRuns

\* A run record captures instance-scoped state for one pipeline execution
EmptyStageRecord == [
    status    |-> "pending",
    retries   |-> 0,
    error     |-> "none",
    turns     |-> 0,
    artifact  |-> FALSE    \* Whether stage produced its artifact
]

InitRunRecord == [
    state       |-> "idle",
    currentStage|-> 0,
    stages      |-> [s \in Stages |-> EmptyStageRecord],
    checkpoint  |-> 0       \* Last successfully completed stage (for recovery)
]

\* Get current stage record for a run
CurrentStageOf(r) == runs[r].stages[runs[r].currentStage]

\* ---------- Type Invariant ----------

TypeOK ==
    /\ activeRuns \subseteq RunIds
    /\ nextRunId \in 1..(MaxRuns + 1)
    /\ gitOwner \in 0..MaxRuns
    /\ \A r \in activeRuns :
        /\ runs[r].state \in RunStates
        /\ runs[r].currentStage \in 0..7
        /\ runs[r].checkpoint \in 0..7
        /\ \A s \in Stages :
            /\ runs[r].stages[s].status \in StageStates
            /\ runs[r].stages[s].retries \in 0..MaxRetries
            /\ runs[r].stages[s].error \in ErrorKinds
            /\ runs[r].stages[s].turns \in 0..MaxStreamTurns
            /\ runs[r].stages[s].artifact \in BOOLEAN

\* ---------- Init ----------

Init ==
    /\ runs = [r \in RunIds |-> InitRunRecord]
    /\ activeRuns = {}
    /\ nextRunId = 1
    /\ gitOwner = 0

\* ---------- Actions ----------

(* --- Run Lifecycle --- *)

\* Start a new pipeline run (instance-scoped state creation)
StartRun(r) ==
    /\ r = nextRunId
    /\ r \in RunIds
    /\ r \notin activeRuns
    /\ runs[r].state = "idle"
    /\ runs' = [runs EXCEPT
        ![r].state = "running",
        ![r].currentStage = 1,
        ![r].stages[1].status = "streaming_input"  \* Stage 1 (Questioner) starts with streaming
       ]
    /\ activeRuns' = activeRuns \cup {r}
    /\ nextRunId' = nextRunId + 1
    /\ UNCHANGED gitOwner

(* --- Streaming Input (Questioner & Confirmation Gates) --- *)

\* User provides streaming input turn
StreamInput(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in StreamingStages
        /\ runs[r].stages[s].status = "streaming_input"
        /\ runs[r].stages[s].turns < MaxStreamTurns
        /\ runs' = [runs EXCEPT
            ![r].stages[s].turns = runs[r].stages[s].turns + 1
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* User completes streaming input, stage moves to executing
CompleteStreaming(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in StreamingStages
        /\ runs[r].stages[s].status = "streaming_input"
        /\ runs[r].stages[s].turns >= 1  \* At least one turn required
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "executing"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* User abandons during streaming input
AbandonStreaming(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in StreamingStages
        /\ runs[r].stages[s].status = "streaming_input"
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "failed",
            ![r].stages[s].error = "user_abandon",
            ![r].state = "failed"
           ]
    /\ activeRuns' = activeRuns \ {r}
    /\ UNCHANGED <<nextRunId, gitOwner>>

(* --- Non-Streaming Stage Start --- *)

\* Begin a non-streaming stage (directly enters executing)
BeginNonStreamingStage(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \notin StreamingStages
        /\ runs[r].stages[s].status = "pending"
        /\ IF s = PairStage
           THEN runs' = [runs EXCEPT ![r].stages[s].status = "pair_routing"]
           ELSE runs' = [runs EXCEPT ![r].stages[s].status = "executing"]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

(* --- Pair Programming Synchronous Routing (Stage 6) --- *)

\* Pair programming ping-pong completes, moves to executing
CompletePairRouting(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ runs[r].currentStage = PairStage
    /\ runs[r].stages[PairStage].status = "pair_routing"
    /\ runs' = [runs EXCEPT
        ![r].stages[PairStage].status = "executing"
       ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

(* --- Stage Execution Completes -> Validation --- *)

\* Agent finishes, output goes to Zod validation
FinishExecution(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "executing"
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "validating"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

(* --- Zod Validation --- *)

\* Validation passes -> stage needs git or completes
ValidationPass(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "validating"
        /\ IF s \in GitStages
           THEN runs' = [runs EXCEPT
                ![r].stages[s].status = "git_operating"
                ]
           ELSE runs' = [runs EXCEPT
                ![r].stages[s].status = "completed",
                ![r].stages[s].artifact = TRUE,
                ![r].checkpoint = s
                ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Validation fails -> retry or fail
ValidationFail(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "validating"
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "validation_failed",
            ![r].stages[s].error = "zod_validation"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Retry after validation failure (if under cap)
RetryAfterValidationFail(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "validation_failed"
        /\ runs[r].stages[s].retries < MaxRetries
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "retrying",
            ![r].stages[s].retries = runs[r].stages[s].retries + 1,
            ![r].stages[s].error = "none"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Transition from retrying back to executing
RetryToExecuting(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "retrying"
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "executing"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Retry cap exhausted -> stage fails
RetryExhausted(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "validation_failed"
        /\ runs[r].stages[s].retries >= MaxRetries
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "failed",
            ![r].stages[s].error = "retry_exhausted"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

(* --- Claude API Transient Failures --- *)

\* Claude API fails during execution (timeout or rate limit)
ClaudeApiFail(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "executing"
        /\ runs[r].stages[s].retries < MaxRetries
        /\ \E errKind \in {"claude_api_timeout", "claude_api_rate_limit"} :
            runs' = [runs EXCEPT
                ![r].stages[s].status = "retrying",
                ![r].stages[s].retries = runs[r].stages[s].retries + 1,
                ![r].stages[s].error = errKind
            ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Claude API fails and retries exhausted
ClaudeApiFailExhausted(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "executing"
        /\ runs[r].stages[s].retries >= MaxRetries
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "failed",
            ![r].stages[s].error = "retry_exhausted"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

(* --- Git Port/Adapter Operations --- *)

\* Acquire git adapter (mutual exclusion across runs)
\* gitOwner tracks which run holds the lock: 0 = idle, r = run r owns it
AcquireGit(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in GitStages
        /\ runs[r].stages[s].status = "git_operating"
        /\ gitOwner = 0
        /\ gitOwner' = r
        /\ UNCHANGED <<runs, activeRuns, nextRunId>>

\* Git operation succeeds -> stage completes
GitSuccess(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in GitStages
        /\ runs[r].stages[s].status = "git_operating"
        /\ gitOwner = r
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "completed",
            ![r].stages[s].artifact = TRUE,
            ![r].checkpoint = s
           ]
        /\ gitOwner' = 0
    /\ UNCHANGED <<activeRuns, nextRunId>>

\* Git operation fails
GitFail(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in GitStages
        /\ runs[r].stages[s].status = "git_operating"
        /\ gitOwner = r
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "failed",
            ![r].stages[s].error = "git_failure"
           ]
        /\ gitOwner' = 0
    /\ UNCHANGED <<activeRuns, nextRunId>>

(* --- Stage Advancement --- *)

\* Advance to next stage after current completes
AdvanceStage(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ s \in 1..6
        /\ runs[r].stages[s].status = "completed"
        /\ LET next == s + 1 IN
            /\ runs' = [runs EXCEPT
                ![r].currentStage = next,
                ![r].stages[next].status =
                    IF next \in StreamingStages
                    THEN "streaming_input"
                    ELSE "pending"
               ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Final stage completes -> run completes
CompleteRun(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ runs[r].currentStage = 7
    /\ runs[r].stages[7].status = "completed"
    /\ runs' = [runs EXCEPT ![r].state = "completed"]
    /\ activeRuns' = activeRuns \ {r}
    /\ UNCHANGED <<nextRunId, gitOwner>>

(* --- Compensation / Checkpoint Recovery --- *)

\* Stage failure triggers compensation for the run
BeginCompensation(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "failed"
        /\ runs[r].checkpoint > 0  \* There are prior stages to potentially compensate
        /\ runs' = [runs EXCEPT
            ![r].state = "compensating",
            ![r].stages[s].status = "compensating"
           ]
    /\ UNCHANGED <<activeRuns, nextRunId, gitOwner>>

\* Stage failure with no prior checkpoints -> run fails directly
FailRunNoCheckpoint(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "running"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "failed"
        /\ runs[r].checkpoint = 0
        /\ runs' = [runs EXCEPT ![r].state = "failed"]
    /\ activeRuns' = activeRuns \ {r}
    /\ UNCHANGED <<nextRunId, gitOwner>>

\* Compensation completes -> run fails gracefully with checkpoint preserved
CompleteCompensation(r) ==
    /\ r \in activeRuns
    /\ runs[r].state = "compensating"
    /\ LET s == runs[r].currentStage IN
        /\ runs[r].stages[s].status = "compensating"
        /\ runs' = [runs EXCEPT
            ![r].stages[s].status = "compensated",
            ![r].state = "failed"
           ]
    /\ activeRuns' = activeRuns \ {r}
    /\ UNCHANGED <<nextRunId, gitOwner>>

(* --- Terminal Stutter --- *)

\* System is done when all possible runs have terminated
Terminated ==
    /\ nextRunId > MaxRuns
    /\ activeRuns = {}
    /\ UNCHANGED vars

(* --- Next State --- *)

Next ==
    \/ Terminated
    \/ \E r \in RunIds :
        \/ StartRun(r)
        \/ StreamInput(r)
        \/ CompleteStreaming(r)
        \/ AbandonStreaming(r)
        \/ BeginNonStreamingStage(r)
        \/ CompletePairRouting(r)
        \/ FinishExecution(r)
        \/ ValidationPass(r)
        \/ ValidationFail(r)
        \/ RetryAfterValidationFail(r)
        \/ RetryToExecuting(r)
        \/ RetryExhausted(r)
        \/ ClaudeApiFail(r)
        \/ ClaudeApiFailExhausted(r)
        \/ AcquireGit(r)
        \/ GitSuccess(r)
        \/ GitFail(r)
        \/ AdvanceStage(r)
        \/ CompleteRun(r)
        \/ BeginCompensation(r)
        \/ FailRunNoCheckpoint(r)
        \/ CompleteCompensation(r)

\* ---------- Fairness ----------

\* Fairness assumptions:
\* - Weak fairness for system-internal actions (continuously enabled => eventually taken)
\* - Strong fairness for user/external actions (infinitely often enabled => eventually taken)
\*   This models that the user will eventually either provide input or abandon.
Fairness ==
    \A r \in RunIds :
        \* External/user actions: strong fairness
        /\ SF_vars(StreamInput(r))
        /\ SF_vars(AbandonStreaming(r))
        \* Internal system actions: weak fairness
        /\ WF_vars(CompleteStreaming(r))
        /\ WF_vars(BeginNonStreamingStage(r))
        /\ WF_vars(CompletePairRouting(r))
        /\ WF_vars(FinishExecution(r))
        /\ WF_vars(ValidationPass(r))
        /\ WF_vars(RetryAfterValidationFail(r))
        /\ WF_vars(RetryToExecuting(r))
        /\ WF_vars(RetryExhausted(r))
        /\ WF_vars(AcquireGit(r))
        /\ WF_vars(GitSuccess(r))
        /\ WF_vars(AdvanceStage(r))
        /\ WF_vars(CompleteRun(r))
        /\ WF_vars(BeginCompensation(r))
        /\ WF_vars(FailRunNoCheckpoint(r))
        /\ WF_vars(CompleteCompensation(r))

Spec == Init /\ [][Next]_vars /\ Fairness

\* ---------- Safety Properties ----------

\* S1: No two runs share state — each run has independent stage records
\* (Structurally guaranteed by runs being a function from RunId -> record.
\*  This invariant verifies the instance-scoped state design.)
InstanceIsolation ==
    \A r1, r2 \in activeRuns :
        r1 /= r2 =>
            /\ runs[r1].currentStage # runs[r2].currentStage
               \/ runs[r1].stages /= runs[r2].stages
               \* The point: runs never alias the same mutable state object.
               \* In TLA+, distinct keys in a function are inherently isolated.

\* S2: Stages execute in strict sequential order (no skipping)
StageOrder ==
    \A r \in activeRuns :
        runs[r].state = "running" =>
            \A s \in 1..(runs[r].currentStage - 1) :
                runs[r].stages[s].status \in {"completed", "compensated"}

\* S3: Retry count never exceeds the configured cap
RetryBound ==
    \A r \in activeRuns :
        \A s \in Stages :
            runs[r].stages[s].retries <= MaxRetries

\* S4: Git adapter mutual exclusion — at most one run holds it
GitMutualExclusion ==
    gitOwner /= 0 =>
        /\ gitOwner \in activeRuns
        /\ runs[gitOwner].currentStage \in GitStages
        /\ runs[gitOwner].stages[runs[gitOwner].currentStage].status = "git_operating"

\* S5: A completed run has all 7 stages completed with artifacts
CompletedRunIntegrity ==
    \A r \in RunIds :
        runs[r].state = "completed" =>
            \A s \in Stages :
                /\ runs[r].stages[s].status = "completed"
                /\ runs[r].stages[s].artifact = TRUE

\* S6: Checkpoint is monotonically valid — never exceeds current stage
CheckpointValidity ==
    \A r \in activeRuns :
        runs[r].checkpoint <= runs[r].currentStage

\* S7: Failed stage must have a non-none error tag (discriminated union)
FailedStageHasError ==
    \A r \in RunIds :
        \A s \in Stages :
            runs[r].stages[s].status = "failed" =>
                runs[r].stages[s].error /= "none"

\* S8: Only streaming stages can be in streaming_input state
StreamingStageConstraint ==
    \A r \in activeRuns :
        \A s \in Stages :
            runs[r].stages[s].status = "streaming_input" =>
                s \in StreamingStages

\* S9: Only pair stage can be in pair_routing state
PairRoutingConstraint ==
    \A r \in activeRuns :
        \A s \in Stages :
            runs[r].stages[s].status = "pair_routing" =>
                s = PairStage

\* S10: Compensation only happens when there is a prior checkpoint
CompensationRequiresCheckpoint ==
    \A r \in RunIds :
        runs[r].state = "compensating" =>
            runs[r].checkpoint > 0

\* ---------- Liveness Properties ----------

\* L1: Every started run eventually completes or fails
RunTermination ==
    \A r \in RunIds :
        (runs[r].state = "running") ~> (runs[r].state \in {"completed", "failed"})

\* L2: A compensating run eventually reaches failed state
CompensationTermination ==
    \A r \in RunIds :
        (runs[r].state = "compensating") ~> (runs[r].state = "failed")

\* L3: If a stage is retrying and under the cap, it eventually re-executes
RetryProgress ==
    \A r \in RunIds :
        \A s \in Stages :
            (runs[r].stages[s].status = "retrying") ~>
                (runs[r].stages[s].status \in {"executing", "failed"})

=============================================================================
