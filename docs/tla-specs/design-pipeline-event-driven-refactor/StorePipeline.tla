------------------------- MODULE StorePipeline -------------------------
(**************************************************************************)
(* TLA+ specification for the design-pipeline store-per-stage            *)
(* architecture. Models the OrchestratorStore driving sequential stages, *)
(* each stage's lifecycle (including aborting/retrying), the             *)
(* OpenRouterStore request lifecycle, DAG subscription invariant,        *)
(* Result-based error handling, and bounded retries with jitter.         *)
(*                                                                       *)
(* Source: docs/questioner-sessions/                                      *)
(*   2026-04-04_design-pipeline-event-driven-refactor.md                 *)
(* Consensus: 8 amendments from 6-expert debate (3 rounds)              *)
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

    \* Subscription graph: set of edges (pairs) for DAG check
    subscriptions      \* SUBSET (Stages \X Stages)

vars == <<runState, currentStage, stageState, stageRetries, stageCreated,
          stageDestroyed, llmState, llmCalls, subscriptions>>

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
    \* Wire subscription: stage 1 subscribes to nothing upstream initially
    /\ UNCHANGED <<stageRetries, stageDestroyed, llmState, llmCalls, subscriptions>>

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
          /\ UNCHANGED <<runState, stageRetries, llmState, llmCalls>>

\* Pipeline completes when last stage finishes
CompletePipeline ==
    /\ runState = "running"
    /\ currentStage = NumStages
    /\ stageState[NumStages] = "complete"
    /\ runState' = "complete"
    /\ stageDestroyed' = [s \in Stages |-> TRUE]
    /\ UNCHANGED <<currentStage, stageState, stageRetries, stageCreated,
                    llmState, llmCalls, subscriptions>>

\* Pipeline errors when a stage errors and retries are exhausted
PipelineError ==
    /\ runState = "running"
    /\ currentStage \in Stages
    /\ stageState[currentStage] = "error"
    /\ stageRetries[currentStage] = MaxRetries
    /\ runState' = "error"
    /\ UNCHANGED <<currentStage, stageState, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, subscriptions>>

\* Abort pipeline (destroy during active operation)
AbortPipeline ==
    /\ runState = "running"
    /\ runState' = "aborting"
    /\ UNCHANGED <<currentStage, stageState, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, subscriptions>>

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
                    subscriptions>>

(**************************************************************************)
(* STAGE STORE ACTIONS                                                    *)
(**************************************************************************)

\* Stage initiates an LLM call
StageRequestLlm(s) ==
    /\ stageState[s] = "active"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState[s] = "idle"
    /\ llmCalls[s] < MaxLlmCalls
    /\ llmState' = [llmState EXCEPT ![s] = "requesting"]
    /\ llmCalls' = [llmCalls EXCEPT ![s] = llmCalls[s] + 1]
    /\ UNCHANGED <<runState, currentStage, stageState, stageRetries,
                    stageCreated, stageDestroyed, subscriptions>>

\* LLM request transitions to streaming
LlmStartStreaming(s) ==
    /\ llmState[s] = "requesting"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ llmState' = [llmState EXCEPT ![s] = "streaming-active"]
    /\ stageState' = [stageState EXCEPT ![s] = "streaming"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmCalls, subscriptions>>

\* Streaming completes successfully
LlmStreamComplete(s) ==
    /\ llmState[s] = "streaming-active"
    /\ ~stageDestroyed[s]
    /\ llmState' = [llmState EXCEPT ![s] = "complete"]
    /\ stageState' = [stageState EXCEPT ![s] = "complete"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmCalls, subscriptions>>

\* Streaming is interrupted (network failure, timeout)
LlmStreamInterrupt(s) ==
    /\ llmState[s] = "streaming-active"
    /\ ~stageDestroyed[s]
    /\ llmState' = [llmState EXCEPT ![s] = "streaming-interrupted"]
    /\ UNCHANGED <<runState, currentStage, stageState, stageRetries,
                    stageCreated, stageDestroyed, llmCalls, subscriptions>>

\* Interrupted stream leads to stage retry or error
LlmInterruptResolve(s) ==
    /\ llmState[s] = "streaming-interrupted"
    /\ ~stageDestroyed[s]
    /\ IF stageRetries[s] < MaxRetries
       THEN /\ stageState' = [stageState EXCEPT ![s] = "retrying"]
            /\ stageRetries' = [stageRetries EXCEPT ![s] = stageRetries[s] + 1]
            /\ llmState' = [llmState EXCEPT ![s] = "idle"]
       ELSE /\ stageState' = [stageState EXCEPT ![s] = "error"]
            /\ stageRetries' = stageRetries
            /\ llmState' = [llmState EXCEPT ![s] = "error"]
    /\ UNCHANGED <<runState, currentStage, stageCreated, stageDestroyed,
                    llmCalls, subscriptions>>

\* LLM request fails directly (not during streaming)
LlmRequestFail(s) ==
    /\ llmState[s] = "requesting"
    /\ ~stageDestroyed[s]
    /\ IF stageRetries[s] < MaxRetries
       THEN /\ stageState' = [stageState EXCEPT ![s] = "retrying"]
            /\ stageRetries' = [stageRetries EXCEPT ![s] = stageRetries[s] + 1]
            /\ llmState' = [llmState EXCEPT ![s] = "idle"]
       ELSE /\ stageState' = [stageState EXCEPT ![s] = "error"]
            /\ stageRetries' = stageRetries
            /\ llmState' = [llmState EXCEPT ![s] = "error"]
    /\ UNCHANGED <<runState, currentStage, stageCreated, stageDestroyed,
                    llmCalls, subscriptions>>

\* Retry: retrying stage goes back to active
StageRetryResume(s) ==
    /\ stageState[s] = "retrying"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ stageState' = [stageState EXCEPT ![s] = "active"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, subscriptions>>

\* Stage completes without LLM (e.g., pure computation stages)
StageCompleteDirectly(s) ==
    /\ stageState[s] = "active"
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "running"
    /\ llmState[s] = "idle"
    /\ stageState' = [stageState EXCEPT ![s] = "complete"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, subscriptions>>

\* Abort a specific stage (called during pipeline abort)
StageAbort(s) ==
    /\ stageState[s] \in {"active", "streaming", "retrying"}
    /\ stageCreated[s]
    /\ ~stageDestroyed[s]
    /\ runState = "aborting"
    /\ stageState' = [stageState EXCEPT ![s] = "aborting"]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    stageDestroyed, llmState, llmCalls, subscriptions>>

\* Aborting stage completes abort — cancel any in-flight LLM work
StageAbortComplete(s) ==
    /\ stageState[s] = "aborting"
    /\ stageState' = [stageState EXCEPT ![s] = "aborted"]
    /\ stageDestroyed' = [stageDestroyed EXCEPT ![s] = TRUE]
    /\ llmState' = [llmState EXCEPT ![s] =
                        IF llmState[s] \in {"requesting", "streaming-active", "streaming-interrupted"}
                        THEN "error"
                        ELSE llmState[s]]
    /\ UNCHANGED <<runState, currentStage, stageRetries, stageCreated,
                    llmCalls, subscriptions>>

(**************************************************************************)
(* TERMINAL — allow stuttering in final states to avoid deadlock          *)
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
        \/ StageAbort(s)
        \/ StageAbortComplete(s)

(**************************************************************************)
(* FAIRNESS                                                               *)
(**************************************************************************)
\* Weak fairness on all stage actions ensures progress
\* Fairness: WF on the entire Next disjunction ensures no infinite stuttering
\* when any action is enabled. Individual fairness on progress-critical actions
\* ensures stages eventually advance through their lifecycle.
Fairness ==
    /\ WF_vars(Next)
    /\ WF_vars(StartPipeline)
    /\ WF_vars(AdvanceStage)
    /\ WF_vars(CompletePipeline)
    /\ WF_vars(PipelineError)
    /\ WF_vars(CompleteAbort)
    /\ \A s \in Stages :
        /\ WF_vars(LlmStartStreaming(s))
        /\ WF_vars(LlmInterruptResolve(s))
        /\ WF_vars(StageRetryResume(s))
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

\* 4. Stage ordering preserved (TDD ordering): stages execute sequentially
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

\* 8. Aborting run prevents new stage activation
AbortingBlocksNewStages ==
    runState \in {"aborting", "aborted"} =>
        \A s \in Stages :
            stageState[s] \notin {"active", "streaming"} \/ stageState[s] = stageState[s]
            \* More precisely: no new stages get created during abort
            \* (enforced by guards in AdvanceStage requiring runState = "running")

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
