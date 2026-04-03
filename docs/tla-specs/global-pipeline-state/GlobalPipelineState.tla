-------------------- MODULE GlobalPipelineState --------------------
\* TLA+ Specification for the Global Pipeline State File
\* Models three concerns:
\*   Machine 1 — StateFileLifecycle: ABSENT -> CLEARED -> ACCUMULATING ->
\*               COMPLETE_SNAPSHOT / HALTED_SNAPSHOT
\*   Machine 2 — SectionOwnership: per-stage StageResult sections with
\*               exclusive write ownership
\*   Machine 3 — GitCommitProtocol: terminal-state-only commits and
\*               uncommitted-change warning before clearing
\*
\* Source: docs/questioner-sessions/2026-04-02_global-pipeline-state.md
\* Debate:  docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-design.md

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    NumStages,          \* Total pipeline stages (6 in production)
    MaxRuns             \* Bound on pipeline runs for finite model checking

ASSUME NumStages >= 1
ASSUME MaxRuns >= 1

Stages == 1..NumStages

---------------------------------------------------------------------------
\* State Space Enumerations
---------------------------------------------------------------------------

FileStates == {
    "ABSENT",               \* File does not exist (before first run ever)
    "CLEARED",              \* Template written, all sections empty
    "ACCUMULATING",         \* At least one stage has written its section
    "COMPLETE_SNAPSHOT",    \* Pipeline reached COMPLETE
    "HALTED_SNAPSHOT"       \* Pipeline reached HALTED
}

SectionStates == {
    "EMPTY",        \* Section header present but no content (template)
    "WRITTEN",      \* Section populated by its owning stage
    "VALIDATED"     \* Section validated by next stage before writing
}

GitStates == {
    "CLEAN",            \* No uncommitted changes to state file
    "DIRTY",            \* State file has uncommitted changes
    "COMMITTED"         \* Terminal state committed to git
}

---------------------------------------------------------------------------
\* Variables
---------------------------------------------------------------------------

VARIABLES
    fileState,          \* Current lifecycle state of the state file
    sections,           \* Function: stage -> section state
    writtenBy,          \* Function: stage -> which stage wrote it (0 = none)
    currentStage,       \* Current stage being executed (0 = no run active)
    runCount,           \* Number of completed pipeline runs
    gitState,           \* Git status of the state file
    warned,             \* Whether uncommitted-change warning was issued
    clearFailed,        \* Whether the clear operation failed
    halted              \* Whether current run halted (vs completed)

vars == <<fileState, sections, writtenBy, currentStage, runCount,
          gitState, warned, clearFailed, halted>>

---------------------------------------------------------------------------
\* Type Invariant
---------------------------------------------------------------------------

TypeOK ==
    /\ fileState \in FileStates
    /\ sections \in [Stages -> SectionStates]
    /\ writtenBy \in [Stages -> 0..NumStages]
    /\ currentStage \in 0..NumStages
    /\ runCount \in 0..MaxRuns
    /\ gitState \in GitStates
    /\ warned \in BOOLEAN
    /\ clearFailed \in BOOLEAN
    /\ halted \in BOOLEAN

---------------------------------------------------------------------------
\* Initial State
---------------------------------------------------------------------------

Init ==
    /\ fileState = "ABSENT"
    /\ sections = [s \in Stages |-> "EMPTY"]
    /\ writtenBy = [s \in Stages |-> 0]
    /\ currentStage = 0
    /\ runCount = 0
    /\ gitState = "CLEAN"
    /\ warned = FALSE
    /\ clearFailed = FALSE
    /\ halted = FALSE

---------------------------------------------------------------------------
\* Machine 1 — StateFileLifecycle Actions
---------------------------------------------------------------------------

\* Attempt to clear the state file at the start of a new run.
\* Preconditions: file is ABSENT, COMPLETE_SNAPSHOT, or HALTED_SNAPSHOT.
\* The clear can succeed or fail (non-deterministic for model checking).
ClearStateFile ==
    /\ fileState \in {"ABSENT", "COMPLETE_SNAPSHOT", "HALTED_SNAPSHOT"}
    /\ runCount < MaxRuns
    /\ clearFailed = FALSE
    \* If dirty, warning must have been issued first
    /\ gitState /= "DIRTY" \/ warned = TRUE
    /\ \E success \in BOOLEAN :
        IF success
        THEN
            /\ fileState' = "CLEARED"
            /\ sections' = [s \in Stages |-> "EMPTY"]
            /\ writtenBy' = [s \in Stages |-> 0]
            /\ currentStage' = 0
            /\ halted' = FALSE
            /\ clearFailed' = FALSE
            /\ gitState' = "DIRTY"
            /\ warned' = FALSE
            /\ UNCHANGED <<runCount>>
        ELSE
            /\ clearFailed' = TRUE
            /\ UNCHANGED <<fileState, sections, writtenBy, currentStage,
                           runCount, gitState, warned, halted>>

\* Start the pipeline run after successful clearing.
\* Transitions CLEARED -> ACCUMULATING by starting Stage 1.
StartRun ==
    /\ fileState = "CLEARED"
    /\ clearFailed = FALSE
    /\ currentStage = 0
    /\ currentStage' = 1
    /\ UNCHANGED <<fileState, sections, writtenBy, runCount,
                   gitState, warned, clearFailed, halted>>

\* A stage writes its own StageResult section.
\* Machine 2 invariants enforce ownership.
WriteStageResult(stage) ==
    /\ fileState \in {"CLEARED", "ACCUMULATING"}
    /\ currentStage = stage
    /\ stage \in Stages
    /\ sections[stage] = "EMPTY"
    \* NoStageSkip: stage 1 can always write; stage N requires N-1 written
    \* SchemaValidation: validate prior sections are well-formed
    /\ \A s \in 1..(stage - 1) : sections[s] \in {"WRITTEN", "VALIDATED"}
    /\ sections' = [sections EXCEPT ![stage] = "WRITTEN"]
    /\ writtenBy' = [writtenBy EXCEPT ![stage] = stage]
    /\ fileState' = "ACCUMULATING"
    /\ gitState' = "DIRTY"
    /\ UNCHANGED <<currentStage, runCount, warned, clearFailed, halted>>

\* Validate a prior stage's section before writing the next one.
\* This models the schema validation check each stage performs.
ValidateSection(stage) ==
    /\ stage \in Stages
    /\ sections[stage] = "WRITTEN"
    /\ currentStage > stage
    /\ sections' = [sections EXCEPT ![stage] = "VALIDATED"]
    /\ UNCHANGED <<fileState, writtenBy, currentStage, runCount,
                   gitState, warned, clearFailed, halted>>

\* Advance to the next stage after the current stage writes.
AdvanceStage ==
    /\ currentStage \in 1..(NumStages - 1)
    /\ sections[currentStage] = "WRITTEN"
    /\ currentStage' = currentStage + 1
    /\ UNCHANGED <<fileState, sections, writtenBy, runCount,
                   gitState, warned, clearFailed, halted>>

\* Pipeline completes successfully (all stages written).
CompletePipeline ==
    /\ fileState = "ACCUMULATING"
    /\ currentStage = NumStages
    /\ sections[NumStages] \in {"WRITTEN", "VALIDATED"}
    /\ halted = FALSE
    /\ fileState' = "COMPLETE_SNAPSHOT"
    /\ runCount' = runCount + 1
    /\ currentStage' = 0
    /\ UNCHANGED <<sections, writtenBy, gitState, warned,
                   clearFailed, halted>>

\* Pipeline halts due to failure (retry exhausted).
HaltPipeline ==
    /\ fileState \in {"CLEARED", "ACCUMULATING"}
    /\ currentStage >= 1
    /\ halted' = TRUE
    /\ fileState' = "HALTED_SNAPSHOT"
    /\ runCount' = runCount + 1
    /\ currentStage' = 0
    /\ UNCHANGED <<sections, writtenBy, gitState, warned, clearFailed>>

---------------------------------------------------------------------------
\* Machine 3 — GitCommitProtocol Actions
---------------------------------------------------------------------------

\* Warn about uncommitted changes before clearing.
WarnUncommitted ==
    /\ gitState = "DIRTY"
    /\ warned = FALSE
    /\ warned' = TRUE
    /\ UNCHANGED <<fileState, sections, writtenBy, currentStage,
                   runCount, gitState, clearFailed, halted>>

\* Commit state file — only allowed at terminal states.
CommitStateFile ==
    /\ fileState \in {"COMPLETE_SNAPSHOT", "HALTED_SNAPSHOT"}
    /\ gitState = "DIRTY"
    /\ gitState' = "COMMITTED"
    /\ UNCHANGED <<fileState, sections, writtenBy, currentStage,
                   runCount, warned, clearFailed, halted>>

---------------------------------------------------------------------------
\* Next State Relation
---------------------------------------------------------------------------

Next ==
    \/ ClearStateFile
    \/ StartRun
    \/ \E s \in Stages : WriteStageResult(s)
    \/ \E s \in Stages : ValidateSection(s)
    \/ AdvanceStage
    \/ CompletePipeline
    \/ HaltPipeline
    \/ WarnUncommitted
    \/ CommitStateFile

Fairness ==
    /\ WF_vars(ClearStateFile)
    /\ WF_vars(StartRun)
    /\ \A s \in Stages : WF_vars(WriteStageResult(s))
    /\ WF_vars(AdvanceStage)
    /\ WF_vars(CompletePipeline)
    /\ WF_vars(HaltPipeline)
    /\ WF_vars(WarnUncommitted)
    /\ WF_vars(CommitStateFile)

Spec == Init /\ [][Next]_vars /\ Fairness

---------------------------------------------------------------------------
\* Machine 2 — SectionOwnership Safety Properties
---------------------------------------------------------------------------

\* SectionOwnership: each stage's section is written only by its owner.
\* writtenBy[s] is either 0 (not written) or s (written by owner).
SectionOwnership ==
    \A s \in Stages : writtenBy[s] \in {0, s}

\* NoStageSkip: stage N is written only if all stages 1..(N-1) are written.
NoStageSkip ==
    \A s \in Stages :
        sections[s] \in {"WRITTEN", "VALIDATED"} =>
            \A p \in 1..(s - 1) : sections[p] \in {"WRITTEN", "VALIDATED"}

---------------------------------------------------------------------------
\* Machine 1 — StateFileLifecycle Safety Properties
---------------------------------------------------------------------------

\* ClearOnStart: no run begins with stale data.
\* If currentStage >= 1 (run active), the file was cleared this run.
\* Specifically: all sections not yet written are EMPTY.
ClearOnStart ==
    currentStage >= 1 =>
        \A s \in (currentStage + 1)..NumStages : sections[s] = "EMPTY"

\* FailFastOnClearFailure: if clear failed, pipeline does not start.
FailFastOnClearFailure ==
    clearFailed = TRUE => currentStage = 0

\* SchemaValidation: when a stage writes, all prior stages are populated.
\* (This is enforced by the guard in WriteStageResult but we verify it
\*  as an invariant on the reachable state space.)
SchemaValidationInvariant ==
    \A s \in Stages :
        sections[s] \in {"WRITTEN", "VALIDATED"} =>
            \A p \in 1..(s - 1) : sections[p] \in {"WRITTEN", "VALIDATED"}

\* ClearedSectionsEmpty: when the file is CLEARED, every section is EMPTY.
\* Documents the meaning of CLEARED — the template has been written but
\* no stage has populated its section yet.
ClearedSectionsEmpty ==
    fileState = "CLEARED" => \A s \in Stages : sections[s] = "EMPTY"

\* HaltedConsistency: the halted boolean and HALTED_SNAPSHOT file state
\* are always in agreement. The boolean is redundant but aids readability;
\* this invariant prevents them from diverging.
HaltedConsistency ==
    halted = TRUE <=> fileState = "HALTED_SNAPSHOT"

---------------------------------------------------------------------------
\* Machine 3 — GitCommitProtocol Safety Properties
---------------------------------------------------------------------------

\* TerminalStateOnlyCommit: the state file is only committed at
\* COMPLETE_SNAPSHOT or HALTED_SNAPSHOT.
TerminalStateOnlyCommit ==
    gitState = "COMMITTED" =>
        fileState \in {"COMPLETE_SNAPSHOT", "HALTED_SNAPSHOT"}

\* UncommittedWarningBeforeClear: if the file has uncommitted changes
\* and we attempt to clear, a warning must be issued first.
\* (Enforced by ClearStateFile guard: gitState /= "DIRTY" \/ warned = TRUE.)
\* After clearing, gitState becomes DIRTY (template write) and warned
\* resets to FALSE — that is expected. The invariant we verify on
\* reachable states: warned is only TRUE when gitState is DIRTY or
\* COMMITTED (warning persists through commit since commit doesn't
\* reset it; clearing resets both warned and gitState).
UncommittedWarningProtocol ==
    warned = TRUE => gitState \in {"DIRTY", "COMMITTED"}

---------------------------------------------------------------------------
\* Liveness Properties
---------------------------------------------------------------------------

\* Progress: if a pipeline run starts (CLEARED), it eventually reaches
\* COMPLETE_SNAPSHOT or HALTED_SNAPSHOT.
Progress ==
    fileState = "CLEARED" ~>
        fileState \in {"COMPLETE_SNAPSHOT", "HALTED_SNAPSHOT"}

\* EventualCommit: if the file reaches a terminal state, it is eventually
\* committed (assuming the user acts on the warning).
EventualCommit ==
    fileState \in {"COMPLETE_SNAPSHOT", "HALTED_SNAPSHOT"} ~>
        gitState \in {"COMMITTED", "CLEAN"}

=====================================================================
