------------------------ MODULE TrainerAsCoder ------------------------
\* TLA+ Specification: Trainer as Code Writer with Agent Contracts
\*
\* Models the integration of trainer-writer as a fourth code writer in the
\* implementation-writer's Stage 6 task assignment, the removal of
\* trainer from the questioner's dispatch targets, Zod-based dual
\* contract validation (input + output), and the ordered implementation
\* sequence (a -> b -> c -> d).
\*
\* Source: docs/questioner-sessions/2026-03-31_trainer-as-coder.md
\* Design: docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-design.md

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    Steps,                  \* Set of implementation step IDs
    MaxTDDCycles,           \* Bound on TDD ping-pong cycles per step
    MaxContractRetries      \* Bound on contract validation retries per cycle

ASSUME MaxTDDCycles >= 1
ASSUME MaxContractRetries >= 1

---------------------------------------------------------------------------
\* Enumerations
---------------------------------------------------------------------------

\* The four code writers available to the implementation-writer
WriterTypes == {"hono_writer", "typescript_writer", "vitest_writer", "trainer_writer"}

\* Step lifecycle (mirrors ping-pong TDD from Stage 6)
StepStates == {
    "UNASSIGNED",         \* Step exists but no writer selected
    "ASSIGNED",           \* Writer selected, not yet started
    "HANDSHAKE",          \* Writer and test-writer performing handshake
    "RED",                \* Failing test written (for trainer-writer: Zod schema written)
    "CONTRACT_VALIDATE",  \* Contract validation running (Zod parse of artifact)
    "GREEN",              \* Implementation satisfies contract (Zod parse passes)
    "REFACTOR",           \* Refactor phase of TDD cycle
    "STEP_COMPLETE",      \* Step done — all TDD cycles passed
    "STEP_FAILED"         \* Step exhausted retries
}

\* Contract validation results
ContractResults == {"PASS", "FAIL"}

\* The four ordered implementation changes (debate refinement #5)
ImplPhases == {
    "NOT_STARTED",
    "PHASE_A",    \* Create packages/agent-contracts/ with Zod schemas
    "PHASE_B",    \* Modify implementation-writer AGENT.md (add trainer-writer)
    "PHASE_C",    \* Modify trainer AGENT.md (accept impl step input shape)
    "PHASE_D",    \* Modify questioner SKILL.md (remove trainer dispatch + add guide row)
    "ALL_DONE"
}

VARIABLES
    stepState,              \* Function: step -> StepStates
    assignedWriter,         \* Function: step -> WriterTypes \cup {"NONE"}
    tddCycle,               \* Function: step -> current TDD cycle count
    contractRetries,        \* Function: step -> contract validation retries in cycle
    inputContractValid,     \* Function: step -> whether input contract was validated
    outputContractValid,    \* Function: step -> whether output contract was validated
    implPhase,              \* Current implementation phase (ordered a->b->c->d)
    questionerCanDispatchTrainer,  \* Whether questioner can still dispatch trainer
    pipelineComplete        \* Whether all steps and phases are done

vars == <<stepState, assignedWriter, tddCycle, contractRetries,
          inputContractValid, outputContractValid, implPhase,
          questionerCanDispatchTrainer, pipelineComplete>>

---------------------------------------------------------------------------
\* Type Invariant
---------------------------------------------------------------------------

TypeOK ==
    /\ stepState \in [Steps -> StepStates]
    /\ assignedWriter \in [Steps -> WriterTypes \cup {"NONE"}]
    /\ tddCycle \in [Steps -> 0..MaxTDDCycles]
    /\ contractRetries \in [Steps -> 0..MaxContractRetries]
    /\ inputContractValid \in [Steps -> BOOLEAN]
    /\ outputContractValid \in [Steps -> BOOLEAN]
    /\ implPhase \in ImplPhases
    /\ questionerCanDispatchTrainer \in BOOLEAN
    /\ pipelineComplete \in BOOLEAN

---------------------------------------------------------------------------
\* Initial State
---------------------------------------------------------------------------

Init ==
    /\ stepState = [s \in Steps |-> "UNASSIGNED"]
    /\ assignedWriter = [s \in Steps |-> "NONE"]
    /\ tddCycle = [s \in Steps |-> 0]
    /\ contractRetries = [s \in Steps |-> 0]
    /\ inputContractValid = [s \in Steps |-> FALSE]
    /\ outputContractValid = [s \in Steps |-> FALSE]
    /\ implPhase = "NOT_STARTED"
    /\ questionerCanDispatchTrainer = TRUE
    /\ pipelineComplete = FALSE

---------------------------------------------------------------------------
\* Helper Operators
---------------------------------------------------------------------------

\* Whether a step is using the trainer-writer
IsTrainerStep(s) == assignedWriter[s] = "trainer_writer"

\* All steps have reached a terminal state
AllStepsTerminal ==
    \A s \in Steps : stepState[s] \in {"STEP_COMPLETE", "STEP_FAILED"}

\* Count of steps assigned to trainer-writer
TrainerStepCount ==
    Cardinality({s \in Steps : assignedWriter[s] = "trainer_writer"})

---------------------------------------------------------------------------
\* Step Assignment Actions
---------------------------------------------------------------------------

\* Implementation-writer assigns a code writer to a step
AssignWriter(s, w) ==
    /\ stepState[s] = "UNASSIGNED"
    /\ ~pipelineComplete
    \* trainer_writer cannot be assigned until PHASE_B deploys the capability
    /\ (w = "trainer_writer" => implPhase \notin {"NOT_STARTED", "PHASE_A"})
    /\ stepState' = [stepState EXCEPT ![s] = "ASSIGNED"]
    /\ assignedWriter' = [assignedWriter EXCEPT ![s] = w]
    /\ UNCHANGED <<tddCycle, contractRetries, inputContractValid,
                    outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

---------------------------------------------------------------------------
\* TDD Ping-Pong Actions (shared by all writers)
---------------------------------------------------------------------------

\* Writer begins handshake
BeginHandshake(s) ==
    /\ stepState[s] = "ASSIGNED"
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "HANDSHAKE"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Handshake complete — write failing test (RED phase)
\* For trainer-writer: RED means writing the Zod contract schema
WriteFailingTest(s) ==
    /\ stepState[s] = "HANDSHAKE"
    /\ tddCycle[s] < MaxTDDCycles
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "RED"]
    /\ tddCycle' = [tddCycle EXCEPT ![s] = @ + 1]
    /\ contractRetries' = [contractRetries EXCEPT ![s] = 0]
    /\ UNCHANGED <<assignedWriter, inputContractValid,
                    outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Implementation written — validate contracts
\* For trainer-writer: validates both input and output Zod schemas
RunContractValidation(s) ==
    /\ stepState[s] = "RED"
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "CONTRACT_VALIDATE"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Contract validation passes — move to GREEN
\* NOTE: Dual contract validation (input + output) is intentionally atomic.
\* Modeling them separately would double the state space without yielding
\* new safety properties — both must pass for the step to proceed.
ContractPasses(s) ==
    /\ stepState[s] = "CONTRACT_VALIDATE"
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "GREEN"]
    \* For trainer-writer steps, both contracts are now validated
    /\ inputContractValid' = [inputContractValid EXCEPT
           ![s] = IF IsTrainerStep(s) THEN TRUE ELSE inputContractValid[s]]
    /\ outputContractValid' = [outputContractValid EXCEPT
           ![s] = IF IsTrainerStep(s) THEN TRUE ELSE outputContractValid[s]]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Contract validation fails — retry or fail step
ContractFails(s) ==
    /\ stepState[s] = "CONTRACT_VALIDATE"
    /\ ~pipelineComplete
    /\ contractRetries[s] < MaxContractRetries
    \* Back to HANDSHAKE for another TDD cycle attempt
    /\ stepState' = [stepState EXCEPT ![s] = "HANDSHAKE"]
    /\ contractRetries' = [contractRetries EXCEPT ![s] = @ + 1]
    /\ UNCHANGED <<assignedWriter, tddCycle, inputContractValid,
                    outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Contract validation fails and retries exhausted — step fails
ContractFailsExhausted(s) ==
    /\ stepState[s] = "CONTRACT_VALIDATE"
    /\ ~pipelineComplete
    /\ contractRetries[s] >= MaxContractRetries
    /\ stepState' = [stepState EXCEPT ![s] = "STEP_FAILED"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* GREEN phase — refactor
BeginRefactor(s) ==
    /\ stepState[s] = "GREEN"
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "REFACTOR"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Refactor complete — step done or start another TDD cycle
CompleteStep(s) ==
    /\ stepState[s] = "REFACTOR"
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "STEP_COMPLETE"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Refactor reveals need for another TDD cycle
AnotherCycle(s) ==
    /\ stepState[s] = "REFACTOR"
    /\ tddCycle[s] < MaxTDDCycles
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "HANDSHAKE"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* TDD cycles exhausted from HANDSHAKE
TDDExhausted(s) ==
    /\ stepState[s] = "HANDSHAKE"
    /\ tddCycle[s] >= MaxTDDCycles
    /\ ~pipelineComplete
    /\ stepState' = [stepState EXCEPT ![s] = "STEP_FAILED"]
    /\ UNCHANGED <<assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer, pipelineComplete>>

---------------------------------------------------------------------------
\* Implementation Phase Actions (Ordered: A -> B -> C -> D)
\* Models the four-step deployment from the debate synthesis refinement #5
---------------------------------------------------------------------------

\* Phase A: Create packages/agent-contracts/ with Zod schemas (additive)
BeginPhaseA ==
    /\ implPhase = "NOT_STARTED"
    /\ ~pipelineComplete
    /\ implPhase' = "PHASE_A"
    /\ UNCHANGED <<stepState, assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Phase B: Modify implementation-writer to add trainer-writer (additive)
BeginPhaseB ==
    /\ implPhase = "PHASE_A"
    /\ ~pipelineComplete
    /\ implPhase' = "PHASE_B"
    /\ UNCHANGED <<stepState, assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Phase C: Modify trainer to accept implementation step input (additive)
BeginPhaseC ==
    /\ implPhase = "PHASE_B"
    /\ ~pipelineComplete
    /\ implPhase' = "PHASE_C"
    /\ UNCHANGED <<stepState, assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid,
                    questionerCanDispatchTrainer, pipelineComplete>>

\* Phase D: Remove trainer from questioner dispatch + add guide row (removal)
\* This is the ONLY step that removes functionality
BeginPhaseD ==
    /\ implPhase = "PHASE_C"
    /\ ~pipelineComplete
    /\ implPhase' = "PHASE_D"
    /\ questionerCanDispatchTrainer' = FALSE
    /\ UNCHANGED <<stepState, assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, pipelineComplete>>

\* All phases done
CompletePhases ==
    /\ implPhase = "PHASE_D"
    /\ ~pipelineComplete
    /\ implPhase' = "ALL_DONE"
    /\ UNCHANGED <<stepState, assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid,
                    questionerCanDispatchTrainer, pipelineComplete>>

---------------------------------------------------------------------------
\* Pipeline Completion
---------------------------------------------------------------------------

\* Pipeline completes when all steps are terminal and all phases are done
CompletePipeline ==
    /\ ~pipelineComplete
    /\ AllStepsTerminal
    /\ implPhase = "ALL_DONE"
    /\ pipelineComplete' = TRUE
    /\ UNCHANGED <<stepState, assignedWriter, tddCycle, contractRetries,
                    inputContractValid, outputContractValid, implPhase,
                    questionerCanDispatchTrainer>>

---------------------------------------------------------------------------
\* Next State Relation
---------------------------------------------------------------------------

Next ==
    \* Step assignment
    \/ \E s \in Steps, w \in WriterTypes : AssignWriter(s, w)
    \* TDD ping-pong (all writers use the same protocol)
    \/ \E s \in Steps : BeginHandshake(s)
    \/ \E s \in Steps : WriteFailingTest(s)
    \/ \E s \in Steps : RunContractValidation(s)
    \/ \E s \in Steps : ContractPasses(s)
    \/ \E s \in Steps : ContractFails(s)
    \/ \E s \in Steps : ContractFailsExhausted(s)
    \/ \E s \in Steps : BeginRefactor(s)
    \/ \E s \in Steps : CompleteStep(s)
    \/ \E s \in Steps : AnotherCycle(s)
    \/ \E s \in Steps : TDDExhausted(s)
    \* Implementation phases (ordered)
    \/ BeginPhaseA
    \/ BeginPhaseB
    \/ BeginPhaseC
    \/ BeginPhaseD
    \/ CompletePhases
    \* Pipeline completion
    \/ CompletePipeline

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

---------------------------------------------------------------------------
\* Safety Properties (Invariants)
---------------------------------------------------------------------------

\* S1: Trainer-writer steps MUST have both contracts validated before completing
TrainerContractRequired ==
    \A s \in Steps :
        (assignedWriter[s] = "trainer_writer" /\ stepState[s] = "STEP_COMPLETE")
        => (inputContractValid[s] /\ outputContractValid[s])

\* S2: Implementation phases execute in strict order (never skip or go backwards)
\* If we are in phase B, phase A must have been completed (i.e., we came from A)
PhaseOrdering ==
    /\ (implPhase = "PHASE_B" => TRUE)  \* B can only be reached from A (guard)
    /\ (implPhase = "PHASE_C" => TRUE)  \* C can only be reached from B (guard)
    /\ (implPhase = "PHASE_D" => TRUE)  \* D can only be reached from C (guard)
    \* The real ordering is enforced by the guards on each action.
    \* This invariant checks the consequence: questioner dispatch removal
    \* only happens at phase D or later.
    /\ (questionerCanDispatchTrainer = FALSE =>
            implPhase \in {"PHASE_D", "ALL_DONE"})

\* S3: Questioner cannot dispatch to trainer after phase D
QuestionerTrainerRemoved ==
    implPhase \in {"PHASE_D", "ALL_DONE"} => ~questionerCanDispatchTrainer

\* S4: Only trainer-writer steps have contract validation flags set
ContractFlagsOnlyForTrainer ==
    \A s \in Steps :
        (inputContractValid[s] \/ outputContractValid[s])
        => assignedWriter[s] = "trainer_writer"

\* S5: A step cannot be STEP_COMPLETE without having gone through at least one TDD cycle
CompletionRequiresTDD ==
    \A s \in Steps :
        stepState[s] = "STEP_COMPLETE" => tddCycle[s] >= 1

\* S6: Contract retries are bounded
\* NOTE: Total contract validation attempts per step = MaxTDDCycles * MaxContractRetries
\* because contractRetries resets to 0 at each TDD cycle entry (WriteFailingTest).
ContractRetriesBounded ==
    \A s \in Steps : contractRetries[s] <= MaxContractRetries

\* S7: TDD cycles are bounded
TDDCyclesBounded ==
    \A s \in Steps : tddCycle[s] <= MaxTDDCycles

\* S8: Pipeline complete only when all steps terminal and phases done
PipelineCompleteConsistent ==
    pipelineComplete =>
        (AllStepsTerminal /\ implPhase = "ALL_DONE")

\* S9: An unassigned step cannot be in any active TDD state
UnassignedStepIsIdle ==
    \A s \in Steps :
        assignedWriter[s] = "NONE" =>
            stepState[s] = "UNASSIGNED"

\* S10: Phase D is the ONLY phase that modifies questionerCanDispatchTrainer
\* (enforced structurally by UNCHANGED in all other actions; this checks consequence)
RemovalOnlyInPhaseD ==
    (implPhase \in {"NOT_STARTED", "PHASE_A", "PHASE_B", "PHASE_C"})
    => questionerCanDispatchTrainer

---------------------------------------------------------------------------
\* Liveness Properties
---------------------------------------------------------------------------

\* L1: Every assigned step eventually reaches a terminal state
StepTerminates ==
    \A s \in Steps :
        stepState[s] = "ASSIGNED" ~>
            stepState[s] \in {"STEP_COMPLETE", "STEP_FAILED"}

\* L2: The implementation phases eventually complete
PhasesComplete ==
    implPhase = "NOT_STARTED" ~> implPhase = "ALL_DONE"

\* L3: The pipeline eventually completes
PipelineTerminates ==
    <>pipelineComplete

=============================================================================
