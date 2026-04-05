------------------------- MODULE StorePipeline -------------------------
(**************************************************************************)
(* TLA+ specification for the design-pipeline store-per-stage            *)
(* architecture — REVISION v2.                                           *)
(*                                                                       *)
(* Addresses 4 objections from Stage 4 TLA+ review debate:              *)
(*   1. AbortingBlocksNewStages rewritten (was tautology)                *)
(*   2. StageTimeout(s) action added (Amendment 6)                       *)
(*   3. LLM completion decoupled from stage completion                   *)
(*   4. StageDirectError(s) for non-LLM infrastructure failures          *)
(*                                                                       *)
(* Source: docs/questioner-sessions/                                      *)
(*   2026-04-04_design-pipeline-event-driven-refactor.md                 *)
(* Consensus: 8 amendments from 6-expert debate (3 rounds)              *)
(* Prior version: docs/tla-specs/design-pipeline-event-driven-refactor/  *)
(**************************************************************************)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    NumStages,        \* Number of pipeline stages (7)
    MaxRetries,       \* Maximum retry attempts per stage (e.g. 3)
    Stages,           \* Set of stage identifiers {1..NumStages}
    MaxLlmCalls       \* Bound on LLM calls per stage for model checking

(**************************************************************************)
(* VARIABLES                                                              *)
(**************************************************************************)
VARIABLES
    \* OrchestratorStore state
    runState,          \* "idle" | "running" | "complete" | "error" | "aborting" | "aborted"
    currentStage,      \* 0..NumStages (0 = not started)

    \* Per-stage store state (function: Stages -> state)
    stageState,        \* [Stages -> {"idle","active","streaming","complete","error","aborting","aborted","retrying"}]
    stageRetries,      \* [Stages -> 0..MaxRetries]
    stageCreated,      \* [Stages -> BOOLEAN] -- whether the store has been created by orchestrator
    stageDestroyed,    \* [Stages -> BOOLEAN] -- whether the store has been destroyed

    \* OpenRouterStore per-stage LLM request state
    llmState,          \* [Stages -> {"idle","requesting","streaming-active","streaming-interrupted","complete","error"}]
    llmCalls,          \* [Stages -> 0..MaxLlmCalls]
    llmCompleted,      \* [Stages -> 0..MaxLlmCalls] -- count of completed LLM calls (for multi-call stages)

    \* Subscription graph: set of edges (pairs) for DAG check
    subscriptions      \* SUBSET (Stages \X Stages)

vars == <<runState, currentStage, stageState, stageRetries, stageCreated,
          stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

(**************************************************************************)
(* TYPE INVARIANT                                                         *)
(**************************************************************************)
TypeOK ==
    /\ runState \in {"idle", "running", "complete", "error", "aborting", "aborted"}
    /\ currentStage \in 0..NumStages
    /\ stageState \in [Stages -> {"idle", "active", "streaming", "complete",
                                   "error", "aborting", "aborted", "retrying"}]
    /\ stageRetries \in [Stages -> 0..MaxRetries]
    /\ stageCreated \in [Stages -> BOOLEAN]
    /\ stageDestroyed \in [Stages -> BOOLEAN]
    /\ llmState \in [Stages -> {"idle", "requesting", "streaming-active",
                                 "streaming-interrupted", "complete", "error"}]
    /\ llmCalls \in [Stages -> 0..MaxLlmCalls]
    /\ llmCompleted \in [Stages -> 0..MaxLlmCalls]
    /\ subscriptions \subseteq (Stages \X Stages)

(**************************************************************************)
(* HELPER: Acyclic (DAG) check for subscription graph                    *)
(* A graph on Stages is acyclic iff there is a topological ordering,     *)
(* which for our small model we check via transitive closure.            *)
(**************************************************************************)
RECURSIVE ReachableFrom(_, _)
ReachableFrom(node, edges) ==
    LET direct == {e[2] : e \in {edge \in edges : edge[1] = node}}
    IN  direct \cup UNION {ReachableFrom(d, edges) : d \in direct}

IsDAG(edges) ==
    \A n \in Stages : n \notin ReachableFrom(n, edges)

(**************************************************************************)
(* INITIAL STATE                                                          *)
(**************************************************************************)
Init ==
    /\ runState = "idle"
    /\ currentStage = 0
    /\ stageState = [s \in Stages |-> "idle"]
    /\ stageRetries = [s \in Stages |-> 0]
    /\ stageCreated = [s \in Stages |-> FALSE]
    /\ stageDestroyed = [s \in Stages |-> FALSE]
    /\ llmState = [s \in Stages |-> "idle"]
    /\ llmCalls = [s \in Stages |-> 0]
    /\ llmCompleted = [s \in Stages |-> 0]
    /\ subscriptions = {}

(**************************************************************************)
(* ORCHESTRATOR ACTIONS                                                   *)
(**************************************************************************)

\* Start the pipeline run
StartPipeline ==
    /\ runState = "idle"
    /\ runState' = "running"
    /\ currentStage' = 1
    /\ stageCreated' = [stageCreated EXCEPT ![1] = TRUE]
    /\ stageState' = [stageState EXCEPT ![1] = "active"]
    /\ UNCHANGED <<stageRetries, stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* Advance to next stage after current stage completes
AdvanceStage ==
    /\ runState = "running"
    /\ currentStage \in 1..(NumStages - 1)
    /\ stageState[currentStage] = "complete"
    /\ ~stageDestroyed[currentStage]
    /\ LET next == currentStage + 1
       IN /\ currentStage' = next
          /\ stageCreated' = [stageCreated EXCEPT ![next] = TRUE]
          /\ stageState' = [stageState EXCEPT ![next] = "active"]
          \* Destroy the completed stage's store
          /\ stageDestroyed' = [stageDestroyed EXCEPT ![currentStage] = TRUE]
          \* Wire subscription: next stage subscribes to previous (sequential DAG)
          /\ subscriptions' = subscriptions \cup {<<currentStage, next>>}
          /\ UNCHANGED <<runState, stageRetries, llmState, llmCalls, llmCompleted>>

\* Pipeline completes when last stage finishes
CompletePipeline ==
    /\ runState = "running"
    /\ currentStage = NumStages
    /\ stageState[NumStages] = "complete"
    /\ runState' = "complete"
    /\ stageDestroyed' = [s \in Stages |-> TRUE]
    /\ UNCHANGED <<currentStage, stageState, stageRetries, stageCreated,
                    llmState, llmCalls, llmCompleted, subscriptions>>

\* Pipeline errors when a stage errors and retries are exhausted
PipelineError ==
    /\ runState = "running"
    /\ currentStage \in Stages
    /\ stageState[currentStage] = "error"
    /\ stageRetries[currentStage] = MaxRetries
    /\ runState' = "error"
    /\ UNCHANGED <<currentStage, stageState, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* Abort pipeline (destroy during active operation)
AbortPipeline ==
    /\ runState = "running"
    /\ runState' = "aborting"
    /\ UNCHANGED <<currentStage, stageState, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* Complete the abort: transition run to aborted, destroy active stage
CompleteAbort ==
    /\ runState = "aborting"
    /\ currentStage \in Stages
    /\ stageCreated[currentStage]
    \* Stage may be in any non-idle state; we force it to aborted if not already terminal
    /\ stageState' = [stageState EXCEPT ![currentStage] =
                        IF stageState[currentStage] \in {"complete", "error", "aborted"}
                        THEN stageState[currentStage]
                        ELSE "aborted"]
    /\ stageDestroyed' = [stageDestroyed EXCEPT ![currentStage] = TRUE]
    /\ llmState' = [llmState EXCEPT ![currentStage] =
                        IF llmState[currentStage] \in {"requesting", "streaming-active", "streaming-interrupted"}
                        THEN "error"
                        ELSE llmState[currentStage]]
    /\ runState' = "aborted"
    /\ UNCHANGED <<currentStage, stageRetries, stageCreated, llmCalls,
                    llmCompleted, subscriptions>>

(**************************************************************************)
(* STAGE STORE ACTIONS                                                    *)
(**************************************************************************)

\* Stage initiates an LLM call
StageRequestLlm(s) ==
    /\ stageState[s] = "active"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState[s] \in {"idle", "complete"}  \* can start new LLM call after previous completed
    /\ llmCalls[s] < MaxLlmCalls
    /\ llmState' = [llmState EXCEPT ![s] = "requesting"]
    /\ llmCalls' = [llmCalls EXCEPT ![s] = llmCalls[s] + 1]
    /\ UNCHANGED <<runState, currentStage, stageState, stageRetries,
                    stageCreated, stageDestroyed, llmCompleted, subscriptions>>

\* LLM request transitions to streaming
LlmStartStreaming(s) ==
    /\ llmState[s] = "requesting"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState' = [llmState EXCEPT ![s] = "streaming-active"]
    /\ stageState' = [stageState EXCEPT ![s] = "streaming"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmCalls, llmCompleted, subscriptions>>

\* Streaming completes successfully — LLM call done, stage returns to active
\* (Objection #3: decoupled from stage completion)
LlmStreamComplete(s) ==
    /\ llmState[s] = "streaming-active"
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState' = [llmState EXCEPT ![s] = "complete"]
    /\ stageState' = [stageState EXCEPT ![s] = "active"]
    /\ llmCompleted' = [llmCompleted EXCEPT ![s] = llmCompleted[s] + 1]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmCalls, subscriptions>>

\* Stage decides to complete after at least one successful LLM call
\* (Objection #3: separate action for stage completion)
StageDecideComplete(s) ==
    /\ stageState[s] = "active"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmCompleted[s] > 0                  \* at least one LLM call completed
    /\ llmState[s] \in {"idle", "complete"} \* no in-flight LLM call
    /\ stageState' = [stageState EXCEPT ![s] = "complete"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* Streaming is interrupted (network failure, timeout)
LlmStreamInterrupt(s) ==
    /\ llmState[s] = "streaming-active"
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState' = [llmState EXCEPT ![s] = "streaming-interrupted"]
    /\ UNCHANGED <<runState, currentStage, stageState, stageRetries,
                    stageCreated, stageDestroyed, llmCalls, llmCompleted, subscriptions>>

\* Interrupted stream leads to stage retry or error
LlmInterruptResolve(s) ==
    /\ llmState[s] = "streaming-interrupted"
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ IF stageRetries[s] < MaxRetries
       THEN /\ stageState' = [stageState EXCEPT ![s] = "retrying"]
            /\ stageRetries' = [stageRetries EXCEPT ![s] = stageRetries[s] + 1]
            /\ llmState' = [llmState EXCEPT ![s] = "idle"]
       ELSE /\ stageState' = [stageState EXCEPT ![s] = "error"]
            /\ stageRetries' = stageRetries
            /\ llmState' = [llmState EXCEPT ![s] = "error"]
    /\ UNCHANGED <<runState, currentStage, stageCreated, stageDestroyed,
                    llmCalls, llmCompleted, subscriptions>>

\* LLM request fails directly (not during streaming)
LlmRequestFail(s) ==
    /\ llmState[s] = "requesting"
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ IF stageRetries[s] < MaxRetries
       THEN /\ stageState' = [stageState EXCEPT ![s] = "retrying"]
            /\ stageRetries' = [stageRetries EXCEPT ![s] = stageRetries[s] + 1]
            /\ llmState' = [llmState EXCEPT ![s] = "idle"]
       ELSE /\ stageState' = [stageState EXCEPT ![s] = "error"]
            /\ stageRetries' = stageRetries
            /\ llmState' = [llmState EXCEPT ![s] = "error"]
    /\ UNCHANGED <<runState, currentStage, stageCreated, stageDestroyed,
                    llmCalls, llmCompleted, subscriptions>>

\* Retry: retrying stage goes back to active
StageRetryResume(s) ==
    /\ stageState[s] = "retrying"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ stageState' = [stageState EXCEPT ![s] = "active"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* Stage completes without LLM (e.g., pure computation stages)
StageCompleteDirectly(s) ==
    /\ stageState[s] = "active"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState[s] \in {"idle", "complete"}  \* no in-flight LLM call
    /\ llmCompleted[s] = 0                   \* no LLM calls were made — pure computation
    /\ stageState' = [stageState EXCEPT ![s] = "complete"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* (Objection #4) Infrastructure error — Git/FileSystem failure on an active stage
\* Non-deterministic: any active stage can encounter an infrastructure error
StageDirectError(s) ==
    /\ stageState[s] = "active"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState[s] \in {"idle", "complete"}  \* no in-flight LLM call (LLM errors have their own path)
    /\ IF stageRetries[s] < MaxRetries
       THEN /\ stageState' = [stageState EXCEPT ![s] = "retrying"]
            /\ stageRetries' = [stageRetries EXCEPT ![s] = stageRetries[s] + 1]
       ELSE /\ stageState' = [stageState EXCEPT ![s] = "error"]
            /\ stageRetries' = stageRetries
    /\ UNCHANGED <<runState, currentStage, stageCreated, stageDestroyed,
                    llmState, llmCalls, llmCompleted, subscriptions>>

\* (Objection #2) Per-stage timeout — Amendment 6
\* Active or streaming stage exceeds its timeout budget (modeled non-deterministically).
\* Same retry/exhaustion logic as other failures.
StageTimeout(s) ==
    /\ stageState[s] \in {"active", "streaming"}
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ IF stageRetries[s] < MaxRetries
       THEN /\ stageState' = [stageState EXCEPT ![s] = "retrying"]
            /\ stageRetries' = [stageRetries EXCEPT ![s] = stageRetries[s] + 1]
            /\ llmState' = [llmState EXCEPT ![s] =
                                IF llmState[s] \in {"requesting", "streaming-active"}
                                THEN "idle"
                                ELSE llmState[s]]
       ELSE /\ stageState' = [stageState EXCEPT ![s] = "error"]
            /\ stageRetries' = stageRetries
            /\ llmState' = [llmState EXCEPT ![s] =
                                IF llmState[s] \in {"requesting", "streaming-active"}
                                THEN "error"
                                ELSE llmState[s]]
    /\ UNCHANGED <<runState, currentStage, stageCreated, stageDestroyed,
                    llmCalls, llmCompleted, subscriptions>>

\* Abort a specific stage (called during pipeline abort)
StageAbort(s) ==
    /\ stageState[s] \in {"active", "streaming", "retrying"}
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "aborting"
    /\ stageState' = [stageState EXCEPT ![s] = "aborting"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, llmCompleted, subscriptions>>

\* Aborting stage completes abort -- cancel any in-flight LLM work
StageAbortComplete(s) ==
    /\ stageState[s] = "aborting"
    /\ stageState' = [stageState EXCEPT ![s] = "aborted"]
    /\ stageDestroyed' = [stageDestroyed EXCEPT ![s] = TRUE]
    /\ llmState' = [llmState EXCEPT ![s] =
                        IF llmState[s] \in {"requesting", "streaming-active", "streaming-interrupted"}
                        THEN "error"
                        ELSE llmState[s]]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    llmCalls, llmCompleted, subscriptions>>

(**************************************************************************)
(* TERMINAL -- allow stuttering in final states to avoid deadlock         *)
(**************************************************************************)
Terminated ==
    /\ runState \in {"complete", "error", "aborted"}
    /\ UNCHANGED vars

(**************************************************************************)
(* NEXT-STATE RELATION                                                    *)
(**************************************************************************)
Next ==
    \/ StartPipeline
    \/ AdvanceStage
    \/ CompletePipeline
    \/ PipelineError
    \/ AbortPipeline
    \/ CompleteAbort
    \/ Terminated
    \/ \E s \in Stages :
        \/ StageRequestLlm(s)
        \/ LlmStartStreaming(s)
        \/ LlmStreamComplete(s)
        \/ LlmStreamInterrupt(s)
        \/ LlmInterruptResolve(s)
        \/ LlmRequestFail(s)
        \/ StageRetryResume(s)
        \/ StageCompleteDirectly(s)
        \/ StageDecideComplete(s)
        \/ StageDirectError(s)
        \/ StageTimeout(s)
        \/ StageAbort(s)
        \/ StageAbortComplete(s)

(**************************************************************************)
(* FAIRNESS                                                               *)
(**************************************************************************)
Fairness ==
    /\ WF_vars(Next)
    /\ WF_vars(StartPipeline)
    /\ WF_vars(AdvanceStage)
    /\ WF_vars(CompletePipeline)
    /\ WF_vars(PipelineError)
    /\ WF_vars(CompleteAbort)
    /\ \A s \in Stages :
        /\ WF_vars(LlmStartStreaming(s))
        /\ WF_vars(LlmStreamComplete(s))
        /\ WF_vars(LlmInterruptResolve(s))
        /\ WF_vars(StageRetryResume(s))
        /\ WF_vars(StageDecideComplete(s))
        /\ WF_vars(StageAbortComplete(s))

Spec == Init /\ [][Next]_vars /\ Fairness

(**************************************************************************)
(* SAFETY PROPERTIES                                                      *)
(**************************************************************************)

\* 1. Subscription graph is always a DAG (no circular subscriptions)
DAGInvariant == IsDAG(subscriptions)

\* 2. No transitions from terminal states
NoZombieStages ==
    \A s \in Stages :
        /\ (stageState[s] = "aborted" => stageDestroyed[s])
        /\ (stageDestroyed[s] => stageState[s] \in {"complete", "aborted", "error", "idle"})

\* 3. Retries are bounded
RetriesBounded ==
    \A s \in Stages : stageRetries[s] <= MaxRetries

\* 4. Stage ordering preserved: stages execute sequentially
StageOrdering ==
    \A s \in Stages :
        (stageCreated[s] /\ s > 1) =>
            \/ stageState[s - 1] \in {"complete", "error", "aborted"}
            \/ stageDestroyed[s - 1]

\* 5. Only created, non-destroyed stages can be active
StoreLifecycleIntegrity ==
    \A s \in Stages :
        stageState[s] \in {"active", "streaming", "retrying", "aborting"} =>
            (stageCreated[s] /\ ~stageDestroyed[s])

\* 6. Pipeline is complete only when all stages are done
PipelineCompleteImpliesAllDone ==
    runState = "complete" =>
        \A s \in Stages : stageDestroyed[s]

\* 7. No LLM activity on destroyed stages
NoLlmOnDestroyedStage ==
    \A s \in Stages :
        stageDestroyed[s] =>
            llmState[s] \in {"idle", "complete", "error"}

\* 8. Aborting/aborted run blocks new stage activation
\*    (Objection #1: rewritten — was a tautology)
\*    No stage beyond currentStage may become active or created during abort.
AbortingBlocksNewStages ==
    runState \in {"aborting", "aborted"} =>
        \A s \in Stages :
            s > currentStage => (~stageCreated[s] /\ stageState[s] = "idle")

\* 9. LLM completed count never exceeds LLM calls made
LlmCompletedBounded ==
    \A s \in Stages : llmCompleted[s] <= llmCalls[s]

(**************************************************************************)
(* LIVENESS PROPERTIES                                                    *)
(**************************************************************************)

\* Pipeline eventually terminates (reaches complete, error, or aborted)
PipelineTerminates ==
    <>(runState \in {"complete", "error", "aborted"})

\* Every created stage eventually completes or errors or aborts
StageEventuallyResolves ==
    \A s \in Stages :
        stageCreated[s] ~> stageState[s] \in {"complete", "error", "aborted"}

\* If pipeline starts, it eventually leaves "running"
RunningIsTransient ==
    (runState = "running") ~> (runState \in {"complete", "error", "aborting", "aborted"})

=============================================================================
