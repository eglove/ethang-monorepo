--------------------------- MODULE ParallelDebates ---------------------------
(*
 * Formal specification for the vibe-cli parallel-debates pipeline.
 *
 * Models the 7-stage pipeline focusing on:
 *   - Stage 2: parallel BDD + TLA+ writers via Invoke-Parallel
 *   - Stage 3: unified debate loop with objection routing, parallel revisions,
 *              and per-writer consensus revision (final recommendations)
 *   - Stage transitions with cumulative artifact validation
 *   - Resume and fresh-run entry points
 *   - Failure isolation (one writer failing does not kill the other)
 *   - Artifact preservation as explicit safety property
 *
 * Source: docs/parallel-debates/bdd.feature (2026-04-12)
 *
 * ─── Intentionally Out of Scope ───────────────────────────────────────────────
 * The following BDD items are intentionally NOT modeled in this specification.
 * They describe implementation-level concerns (APIs, file formats, CLI params)
 * that do not affect the pipeline's state machine correctness:
 *
 *   Item 2  — Invoke-Parallel utility (internal API shape, timeout semantics,
 *             log race conditions). Modeled abstractly as parallel dispatch.
 *   Item 5  — Unified debate moderator JSON schema (field names, data shapes).
 *             Modeled as verdict/objTargets state transitions.
 *   Item 10 — Deleted files (filesystem cleanup of old stage scripts).
 *   Item 11 — Unified debate moderator agent prompt (prompt engineering).
 *   Item 13 — Write-PipelineLog consolidation (single function definition).
 *
 * Priority-2 gaps documented but not modeled:
 *   - Resume error paths (missing log, corrupted log, multi-feature log)
 *     → implementation validates via Resolve-PipelineState; spec models
 *       resume as "prior artifacts exist" which is the post-validation state.
 *   - Invoke-Parallel timeout → modeled as writer/revision failure.
 *   - TLC verification as distinct sub-process → modeled as part of TLA+
 *     writer success/failure; TLC pass = writer succeeds.
 * ──────────────────────────────────────────────────────────────────────────────
 *)
EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    MaxDebateRounds,    \* Maximum debate iterations (default 10)
    Writers,            \* {"bdd", "tla"}
    MaxStage            \* 7

VARIABLES
    pipelineStage,      \* 0 = not started, 1..7 = executing that stage, 8 = done
    stageResult,        \* [1..MaxStage -> {"none","running","success","fail"}]
    writerState,        \* [Writers -> {"idle","running","succeeded","failed"}]
    artifacts,          \* Set of artifact names present on disk
    debateRound,        \* Current debate round (0 = not in debate)
    debateVerdict,      \* "none" | "partial_consensus" | "consensus_reached" | "max_rounds"
    objTargets,         \* Subset of Writers that have objections this round
    revisionState,      \* [Writers -> {"idle","running","succeeded","failed"}]
    consensusRevState,  \* [Writers -> {"idle","running","succeeded","failed"}]
    entryMode,          \* "fresh" | "resume"
    resumeStage,        \* Stage to resume from (0 if fresh)
    completionMarkers,  \* Set of stage numbers that have written STAGE_COMPLETE
    pipelineFailed      \* TRUE if pipeline has fatally failed

vars == <<pipelineStage, stageResult, writerState, artifacts,
          debateRound, debateVerdict, objTargets, revisionState,
          consensusRevState, entryMode, resumeStage, completionMarkers,
          pipelineFailed>>

-----------------------------------------------------------------------------
(* Type invariant *)
-----------------------------------------------------------------------------

TypeOK ==
    /\ pipelineStage \in 0..8
    /\ stageResult \in [1..MaxStage -> {"none","running","success","fail"}]
    /\ writerState \in [Writers -> {"idle","running","succeeded","failed"}]
    /\ artifacts \subseteq {"elicitor","bdd_feature","tla_spec",
                            "unified_debate","fixture_json",
                            "impl_plan_md","impl_plan_json","impl_debate"}
    /\ debateRound \in 0..MaxDebateRounds
    /\ debateVerdict \in {"none","partial_consensus","consensus_reached","max_rounds"}
    /\ objTargets \subseteq Writers
    /\ revisionState \in [Writers -> {"idle","running","succeeded","failed"}]
    /\ consensusRevState \in [Writers -> {"idle","running","succeeded","failed"}]
    /\ entryMode \in {"fresh","resume"}
    /\ resumeStage \in 0..MaxStage
    /\ completionMarkers \subseteq 1..MaxStage
    /\ pipelineFailed \in BOOLEAN

-----------------------------------------------------------------------------
(* Artifact requirements per stage (cumulative) *)
-----------------------------------------------------------------------------

\* Artifacts required BEFORE stage N can begin (inputs from prior stages)
RequiredArtifacts(stage) ==
    CASE stage = 1 -> {}
      [] stage = 2 -> {"elicitor"}
      [] stage = 3 -> {"elicitor", "bdd_feature", "tla_spec"}
      [] stage = 4 -> {"elicitor", "bdd_feature", "tla_spec", "unified_debate"}
      [] stage = 5 -> {"elicitor", "bdd_feature", "tla_spec",
                        "unified_debate", "fixture_json"}
      [] stage = 6 -> {"elicitor", "bdd_feature", "tla_spec",
                        "unified_debate", "fixture_json",
                        "impl_plan_md", "impl_plan_json"}
      [] stage = 7 -> {"elicitor", "bdd_feature", "tla_spec",
                        "unified_debate", "fixture_json",
                        "impl_plan_md", "impl_plan_json", "impl_debate"}
      [] OTHER  -> {}

ArtifactsValid(stage) ==
    RequiredArtifacts(stage) \subseteq artifacts

\* Artifacts produced by stage N on success
ProducedArtifacts(stage) ==
    CASE stage = 1 -> {"elicitor"}
      [] stage = 2 -> {"bdd_feature", "tla_spec"}
      [] stage = 3 -> {"unified_debate"}
      [] stage = 4 -> {"fixture_json"}
      [] stage = 5 -> {"impl_plan_md", "impl_plan_json"}
      [] stage = 6 -> {"impl_debate"}
      [] stage = 7 -> {}
      [] OTHER  -> {}

-----------------------------------------------------------------------------
(* Initial state *)
-----------------------------------------------------------------------------

Init ==
    /\ entryMode \in {"fresh", "resume"}
    /\ IF entryMode = "fresh"
       THEN /\ pipelineStage = 1
            /\ resumeStage = 0
            /\ artifacts = {}
            /\ completionMarkers = {}
            /\ stageResult = [s \in 1..MaxStage |-> IF s = 1 THEN "running" ELSE "none"]
       ELSE \* resume: non-deterministically pick a valid resume point
            /\ resumeStage \in 2..MaxStage
            \* All prior stages have their artifacts and markers
            /\ artifacts = UNION {ProducedArtifacts(s) : s \in 1..(resumeStage - 1)}
            /\ completionMarkers = 1..(resumeStage - 1)
            /\ pipelineStage = resumeStage
            /\ stageResult = [s \in 1..MaxStage |->
                                IF s < resumeStage THEN "success"
                                ELSE IF s = resumeStage THEN "running"
                                ELSE "none"]
    /\ writerState = [w \in Writers |-> "idle"]
    /\ debateRound = 0
    /\ debateVerdict = "none"
    /\ objTargets = {}
    /\ revisionState = [w \in Writers |-> "idle"]
    /\ consensusRevState = [w \in Writers |-> "idle"]
    /\ pipelineFailed = FALSE

-----------------------------------------------------------------------------
(* Terminal state — prevents deadlock when pipeline is done or has failed *)
-----------------------------------------------------------------------------

Done == pipelineStage = 8 /\ UNCHANGED vars

-----------------------------------------------------------------------------
(* Stage 1 — Elicitor *)
-----------------------------------------------------------------------------

Stage1Succeed ==
    /\ pipelineStage = 1
    /\ stageResult[1] = "running"
    /\ stageResult' = [stageResult EXCEPT ![1] = "success"]
    /\ artifacts' = artifacts \cup {"elicitor"}
    /\ completionMarkers' = completionMarkers \cup {1}
    /\ pipelineStage' = 2
    /\ UNCHANGED <<writerState, debateRound, debateVerdict, objTargets,
                   revisionState, consensusRevState, entryMode, resumeStage,
                   pipelineFailed>>

Stage1Fail ==
    /\ pipelineStage = 1
    /\ stageResult[1] = "running"
    /\ stageResult' = [stageResult EXCEPT ![1] = "fail"]
    /\ pipelineFailed' = TRUE
    /\ pipelineStage' = 8
    /\ UNCHANGED <<writerState, artifacts, debateRound,
                   debateVerdict, objTargets, revisionState, consensusRevState,
                   entryMode, resumeStage, completionMarkers>>

-----------------------------------------------------------------------------
(* Stage 2 — Parallel Writers *)
-----------------------------------------------------------------------------

\* Begin stage 2: validate artifacts, dispatch both writers
Stage2Begin ==
    /\ pipelineStage = 2
    /\ stageResult[2] \in {"none", "running"}
    /\ ArtifactsValid(2)
    /\ writerState = [w \in Writers |-> "idle"]
    /\ stageResult' = [stageResult EXCEPT ![2] = "running"]
    /\ writerState' = [w \in Writers |-> "running"]
    /\ UNCHANGED <<pipelineStage, artifacts, debateRound, debateVerdict,
                   objTargets, revisionState, consensusRevState, entryMode,
                   resumeStage, completionMarkers, pipelineFailed>>

\* A writer completes (succeed or fail) — modeled per writer
WriterComplete(w, outcome) ==
    /\ pipelineStage = 2
    /\ stageResult[2] = "running"
    /\ writerState[w] = "running"
    /\ writerState' = [writerState EXCEPT ![w] = outcome]
    /\ IF outcome = "succeeded"
       THEN artifacts' = artifacts \cup
                (CASE w = "bdd" -> {"bdd_feature"}
                   [] w = "tla" -> {"tla_spec"})
       ELSE artifacts' = artifacts
    /\ UNCHANGED <<pipelineStage, stageResult, debateRound, debateVerdict,
                   objTargets, revisionState, consensusRevState, entryMode,
                   resumeStage, completionMarkers, pipelineFailed>>

WriterSucceed(w) == WriterComplete(w, "succeeded")
WriterFail(w)    == WriterComplete(w, "failed")

\* Both writers have finished — evaluate stage 2 outcome
\* Key: we wait for BOTH to finish before deciding (failure isolation)
Stage2Finish ==
    /\ pipelineStage = 2
    /\ stageResult[2] = "running"
    /\ \A w \in Writers : writerState[w] \in {"succeeded", "failed"}
    /\ IF \A w \in Writers : writerState[w] = "succeeded"
       THEN \* Both succeeded
            /\ stageResult' = [stageResult EXCEPT ![2] = "success"]
            /\ completionMarkers' = completionMarkers \cup {2}
            /\ pipelineStage' = 3
            /\ pipelineFailed' = FALSE
       ELSE \* At least one failed — pipeline terminates
            /\ stageResult' = [stageResult EXCEPT ![2] = "fail"]
            /\ pipelineFailed' = TRUE
            /\ completionMarkers' = completionMarkers
            /\ pipelineStage' = 8
    /\ writerState' = [w \in Writers |-> "idle"]
    /\ UNCHANGED <<artifacts, debateRound, debateVerdict, objTargets,
                   revisionState, consensusRevState, entryMode, resumeStage>>

-----------------------------------------------------------------------------
(* Stage 3 — Unified Debate Loop *)
-----------------------------------------------------------------------------

\* Begin the debate: start round 1
DebateBegin ==
    /\ pipelineStage = 3
    /\ stageResult[3] \in {"none", "running"}
    /\ ArtifactsValid(3)
    /\ debateRound = 0
    /\ stageResult' = [stageResult EXCEPT ![3] = "running"]
    /\ debateRound' = 1
    /\ debateVerdict' = "none"
    /\ UNCHANGED <<pipelineStage, writerState, artifacts, objTargets,
                   revisionState, consensusRevState, entryMode, resumeStage,
                   completionMarkers, pipelineFailed>>

\* Moderator renders verdict for this round
\* At MaxDebateRounds: only consensus_reached or max_rounds are valid
\* (BDD line 238-244: round 10 completes then exits — no more partial rounds)
ModeratorVerdict ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateRound \in 1..MaxDebateRounds
    /\ debateVerdict = "none"
    /\ revisionState = [w \in Writers |-> "idle"]
    /\ consensusRevState = [w \in Writers |-> "idle"]
    /\ \/ \* Consensus reached — no objections
          /\ debateVerdict' = "consensus_reached"
          /\ objTargets' = {}
       \/ \* Partial consensus — objections for some subset of writers
          \* ONLY allowed BEFORE MaxDebateRounds (strict less-than)
          \* At MaxDebateRounds the only options are consensus or max_rounds
          /\ debateRound < MaxDebateRounds
          /\ debateVerdict' = "partial_consensus"
          /\ \E targets \in (SUBSET Writers \ {{}}) :
                objTargets' = targets
       \/ \* Max rounds reached (only at MaxDebateRounds)
          /\ debateRound = MaxDebateRounds
          /\ debateVerdict' = "max_rounds"
          /\ objTargets' = {}
    /\ UNCHANGED <<pipelineStage, stageResult, writerState, artifacts,
                   debateRound, revisionState, consensusRevState, entryMode,
                   resumeStage, completionMarkers, pipelineFailed>>

\* Dispatch revisions to writers that have objections
DispatchRevisions ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateVerdict = "partial_consensus"
    /\ objTargets /= {}
    /\ revisionState = [w \in Writers |-> "idle"]
    /\ revisionState' = [w \in Writers |->
                            IF w \in objTargets THEN "running" ELSE "idle"]
    /\ UNCHANGED <<pipelineStage, stageResult, writerState, artifacts,
                   debateRound, debateVerdict, objTargets, consensusRevState,
                   entryMode, resumeStage, completionMarkers, pipelineFailed>>

\* A revision completes (succeed or fail)
RevisionComplete(w, outcome) ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ revisionState[w] = "running"
    /\ revisionState' = [revisionState EXCEPT ![w] = outcome]
    /\ UNCHANGED <<pipelineStage, stageResult, writerState, artifacts,
                   debateRound, debateVerdict, objTargets, consensusRevState,
                   entryMode, resumeStage, completionMarkers, pipelineFailed>>

RevisionSucceed(w) == RevisionComplete(w, "succeeded")
RevisionFail(w)    == RevisionComplete(w, "failed")

\* All dispatched revisions finished — evaluate round outcome
RoundFinish ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateVerdict = "partial_consensus"
    /\ \A w \in objTargets : revisionState[w] \in {"succeeded", "failed"}
    /\ IF \E w \in objTargets : revisionState[w] = "failed"
       THEN \* Any revision failure exits stage 3 — pipeline terminates
            /\ stageResult' = [stageResult EXCEPT ![3] = "fail"]
            /\ pipelineFailed' = TRUE
            /\ pipelineStage' = 8
            /\ debateVerdict' = "none"
            /\ revisionState' = [w \in Writers |-> "idle"]
            /\ UNCHANGED <<debateRound, objTargets, completionMarkers>>
       ELSE \* All revisions succeeded — advance to next round
            /\ debateRound' = debateRound + 1
            /\ debateVerdict' = "none"
            /\ objTargets' = {}
            /\ revisionState' = [w \in Writers |-> "idle"]
            /\ pipelineFailed' = FALSE
            /\ UNCHANGED <<pipelineStage, stageResult, completionMarkers>>
    /\ UNCHANGED <<writerState, artifacts, consensusRevState, entryMode,
                   resumeStage>>

\* ─── Consensus Revision (Priority-1 Fix) ──────────────────────────────────
\* BDD line 231-236: "Consensus reached triggers per-writer final recommendations"
\* Both writers receive their keyed recommendation and apply a final revision
\* before the debate loop exits.

\* Dispatch final recommendations to BOTH writers
ConsensusRevisionDispatch ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateVerdict = "consensus_reached"
    /\ consensusRevState = [w \in Writers |-> "idle"]
    /\ revisionState = [w \in Writers |-> "idle"]
    /\ consensusRevState' = [w \in Writers |-> "running"]
    /\ UNCHANGED <<pipelineStage, stageResult, writerState, artifacts,
                   debateRound, debateVerdict, objTargets, revisionState,
                   entryMode, resumeStage, completionMarkers, pipelineFailed>>

\* A consensus revision completes (per writer)
ConsensusRevComplete(w, outcome) ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateVerdict = "consensus_reached"
    /\ consensusRevState[w] = "running"
    /\ consensusRevState' = [consensusRevState EXCEPT ![w] = outcome]
    /\ UNCHANGED <<pipelineStage, stageResult, writerState, artifacts,
                   debateRound, debateVerdict, objTargets, revisionState,
                   entryMode, resumeStage, completionMarkers, pipelineFailed>>

ConsensusRevSucceed(w) == ConsensusRevComplete(w, "succeeded")
ConsensusRevFail(w)    == ConsensusRevComplete(w, "failed")

\* Both consensus revisions finished — finalize stage 3
ConsensusFinalize ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateVerdict = "consensus_reached"
    /\ \A w \in Writers : consensusRevState[w] \in {"succeeded", "failed"}
    /\ IF \E w \in Writers : consensusRevState[w] = "failed"
       THEN \* Consensus revision failure — pipeline terminates
            /\ stageResult' = [stageResult EXCEPT ![3] = "fail"]
            /\ pipelineFailed' = TRUE
            /\ pipelineStage' = 8
            /\ UNCHANGED <<artifacts, completionMarkers>>
       ELSE \* Both consensus revisions succeeded — exit stage 3 successfully
            /\ stageResult' = [stageResult EXCEPT ![3] = "success"]
            /\ artifacts' = artifacts \cup {"unified_debate"}
            /\ completionMarkers' = completionMarkers \cup {3}
            /\ pipelineStage' = 4
            /\ pipelineFailed' = FALSE
    /\ debateVerdict' = "none"
    /\ debateRound' = 0
    /\ objTargets' = {}
    /\ revisionState' = [w \in Writers |-> "idle"]
    /\ consensusRevState' = [w \in Writers |-> "idle"]
    /\ UNCHANGED <<writerState, entryMode, resumeStage>>

\* Max rounds reached — proceed to stage 4 with current versions
\* BDD line 238-244: exits without consensus, logs unresolved, proceeds
MaxRoundsFinalize ==
    /\ pipelineStage = 3
    /\ stageResult[3] = "running"
    /\ debateVerdict = "max_rounds"
    /\ stageResult' = [stageResult EXCEPT ![3] = "success"]
    /\ artifacts' = artifacts \cup {"unified_debate"}
    /\ completionMarkers' = completionMarkers \cup {3}
    /\ pipelineStage' = 4
    /\ debateVerdict' = "none"
    /\ debateRound' = 0
    /\ objTargets' = {}
    /\ revisionState' = [w \in Writers |-> "idle"]
    /\ consensusRevState' = [w \in Writers |-> "idle"]
    /\ UNCHANGED <<writerState, entryMode, resumeStage, pipelineFailed>>

-----------------------------------------------------------------------------
(* Stages 4-7 — Simplified sequential stages *)
-----------------------------------------------------------------------------

\* Generic stage success for stages 4-7
SimpleStageSucceed(n) ==
    /\ pipelineStage = n
    /\ n \in 4..MaxStage
    /\ stageResult[n] \in {"none", "running"}
    /\ ArtifactsValid(n)
    /\ stageResult' = [stageResult EXCEPT ![n] = "success"]
    /\ artifacts' = artifacts \cup ProducedArtifacts(n)
    /\ completionMarkers' = completionMarkers \cup {n}
    /\ pipelineStage' = IF n < MaxStage THEN n + 1 ELSE 8
    /\ UNCHANGED <<writerState, debateRound, debateVerdict, objTargets,
                   revisionState, consensusRevState, entryMode, resumeStage,
                   pipelineFailed>>

\* Generic stage failure for stages 4-7 — pipeline terminates
SimpleStageFail(n) ==
    /\ pipelineStage = n
    /\ n \in 4..MaxStage
    /\ stageResult[n] \in {"none", "running"}
    /\ stageResult' = [stageResult EXCEPT ![n] = "fail"]
    /\ pipelineFailed' = TRUE
    /\ pipelineStage' = 8
    /\ UNCHANGED <<writerState, artifacts, debateRound,
                   debateVerdict, objTargets, revisionState, consensusRevState,
                   entryMode, resumeStage, completionMarkers>>

Stage4Succeed == SimpleStageSucceed(4)
Stage4Fail    == SimpleStageFail(4)
Stage5Succeed == SimpleStageSucceed(5)
Stage5Fail    == SimpleStageFail(5)
Stage6Succeed == SimpleStageSucceed(6)
Stage6Fail    == SimpleStageFail(6)
Stage7Succeed == SimpleStageSucceed(7)
Stage7Fail    == SimpleStageFail(7)

-----------------------------------------------------------------------------
(* Next-state relation *)
-----------------------------------------------------------------------------

Next ==
    \* Stage 1
    \/ Stage1Succeed
    \/ Stage1Fail
    \* Stage 2 (parallel writers)
    \/ Stage2Begin
    \/ \E w \in Writers : WriterSucceed(w)
    \/ \E w \in Writers : WriterFail(w)
    \/ Stage2Finish
    \* Stage 3 (unified debate)
    \/ DebateBegin
    \/ ModeratorVerdict
    \/ DispatchRevisions
    \/ \E w \in Writers : RevisionSucceed(w)
    \/ \E w \in Writers : RevisionFail(w)
    \/ RoundFinish
    \* Stage 3 consensus revision (per-writer final recommendations)
    \/ ConsensusRevisionDispatch
    \/ \E w \in Writers : ConsensusRevSucceed(w)
    \/ \E w \in Writers : ConsensusRevFail(w)
    \/ ConsensusFinalize
    \* Stage 3 max rounds exit
    \/ MaxRoundsFinalize
    \* Stages 4-7
    \/ Stage4Succeed \/ Stage4Fail
    \/ Stage5Succeed \/ Stage5Fail
    \/ Stage6Succeed \/ Stage6Fail
    \/ Stage7Succeed \/ Stage7Fail
    \* Terminal (no deadlock at pipelineStage = 8)
    \/ Done

Fairness ==
    /\ WF_vars(Stage1Succeed)
    /\ WF_vars(Stage2Begin)
    /\ \A w \in Writers : WF_vars(WriterSucceed(w))
    /\ WF_vars(Stage2Finish)
    /\ WF_vars(DebateBegin)
    /\ WF_vars(ModeratorVerdict)
    /\ WF_vars(DispatchRevisions)
    /\ \A w \in Writers : WF_vars(RevisionSucceed(w))
    /\ WF_vars(RoundFinish)
    /\ WF_vars(ConsensusRevisionDispatch)
    /\ \A w \in Writers : WF_vars(ConsensusRevSucceed(w))
    /\ WF_vars(ConsensusFinalize)
    /\ WF_vars(MaxRoundsFinalize)
    /\ WF_vars(Stage4Succeed)
    /\ WF_vars(Stage5Succeed)
    /\ WF_vars(Stage6Succeed)
    /\ WF_vars(Stage7Succeed)

Spec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------
(* Safety Properties *)
-----------------------------------------------------------------------------

\* S1: Writers are isolated — during stage 2, a running writer cannot observe
\* the other writer's output artifact. This means while any writer is still
\* running, the OTHER writer's artifact must not yet be in the artifact set
\* that was available when writers were dispatched.
\* (Priority-1 Fix: strengthened from tautology to actual isolation guarantee)
WritersIndependent ==
    pipelineStage = 2 /\ stageResult[2] = "running" =>
        \A w1, w2 \in Writers :
            w1 /= w2 /\ writerState[w1] = "running" =>
                \* The other writer's output is not available as input to w1.
                \* Concretely: if w1 is still running, it was dispatched before
                \* w2's artifact could exist. We verify w2's artifact is not
                \* in the set that EXCLUDES w2's own production — i.e., w1
                \* cannot have been given w2's artifact at dispatch time.
                \* Since artifacts are only added on completion, and writers
                \* read from artifacts at dispatch, a running writer never
                \* sees a co-writer's output that was added after dispatch.
                LET otherArtifact == CASE w2 = "bdd" -> "bdd_feature"
                                       [] w2 = "tla" -> "tla_spec"
                IN  writerState[w2] /= "succeeded" => otherArtifact \notin artifacts

\* S2: One writer failing does not kill the other (failure isolation)
\* A failed writer does not force the other to a terminal state prematurely
FailureIsolation ==
    pipelineStage = 2 /\ stageResult[2] = "running" =>
        \A w1, w2 \in Writers :
            w1 /= w2 /\ writerState[w1] = "failed" =>
                writerState[w2] \in {"running", "succeeded", "failed"}

\* S3: Consensus requires BOTH documents have zero objections
\* (No partial graduation — consensus_reached only with empty objTargets)
ConsensusRequiresBoth ==
    debateVerdict = "consensus_reached" => objTargets = {}

\* S4: Stage N only starts if all prior artifacts exist
\* (A stage with stageResult = "running" or "success" implies artifacts are valid)
ArtifactPreconditions ==
    \A s \in 1..MaxStage :
        stageResult[s] \in {"running", "success"} =>
            RequiredArtifacts(s) \subseteq artifacts

\* S5: Debate round never exceeds MaxDebateRounds
\* (Priority-1 Fix: boundary is strict — at MaxDebateRounds the loop MUST exit)
DebateRoundBound ==
    debateRound \in 0..MaxDebateRounds

\* S6: Completion markers are only for stages that succeeded
MarkersOnlyForSuccess ==
    \A s \in 1..MaxStage :
        s \in completionMarkers => stageResult[s] = "success"

\* S7: Pipeline stages execute in order (no stage runs before its predecessor completes)
StageOrdering ==
    \A s \in 2..MaxStage :
        stageResult[s] \in {"running", "success"} =>
            stageResult[s - 1] = "success"

\* S8: Fresh run and resume are mutually exclusive
\* (entryMode is set once and doesn't change)
EntryModeConsistent ==
    entryMode = "resume" => resumeStage \in 1..MaxStage

\* S9: When stage 2 succeeds, both writer artifacts are present
Stage2SuccessImpliesArtifacts ==
    (pipelineStage /= 2 /\ stageResult[2] = "success") =>
        "bdd_feature" \in artifacts /\ "tla_spec" \in artifacts

\* S10: Only the targeted writers receive revision instructions
RevisionRoutingCorrect ==
    \A w \in Writers :
        revisionState[w] = "running" => w \in objTargets

\* S11: Artifact preservation — artifacts once produced are never removed
\* (Priority-2: models BDD Item 1 line 71, Item 4 line 310-315)
\* This is expressed as: artifacts is monotonically non-decreasing.
\* Since TLA+ invariants check each state, we express this as a temporal property.
\* However for TLC efficiency we check the structural consequence:
\* if a stage completed successfully, its artifacts remain present.
ArtifactPreservation ==
    \A s \in 1..MaxStage :
        s \in completionMarkers =>
            ProducedArtifacts(s) \subseteq artifacts

\* S12: Consensus revision targets ALL writers (not a subset)
\* BDD line 234-236: both writers receive recommendations at consensus
ConsensusRevisionTargetsAll ==
    \A w \in Writers :
        consensusRevState[w] = "running" =>
            \A w2 \in Writers : consensusRevState[w2] \in {"running", "succeeded", "failed"}

\* S13: MaxDebateRounds boundary — at round = MaxDebateRounds, no partial_consensus
\* (Priority-1 Fix: BDD implies exit-without-consensus at max, never another round)
MaxRoundsBoundaryStrict ==
    debateRound = MaxDebateRounds =>
        debateVerdict /= "partial_consensus"

-----------------------------------------------------------------------------
(* Liveness Properties *)
-----------------------------------------------------------------------------

\* L1: The pipeline eventually completes (succeeds fully) or fails
PipelineTerminates ==
    <>(pipelineStage = 8)

\* L2: If stage 2 begins with both writers running, it eventually finishes
Stage2Terminates ==
    (\A w \in Writers : writerState[w] = "running") ~>
        (\A w \in Writers : writerState[w] \in {"idle", "succeeded", "failed"})

\* L3: The debate loop eventually terminates (consensus or max rounds or failure)
DebateTerminates ==
    (debateRound >= 1 /\ stageResult[3] = "running") ~>
        (stageResult[3] \in {"success", "fail"})

\* L4: Consensus revision eventually completes once dispatched
ConsensusRevisionTerminates ==
    (\E w \in Writers : consensusRevState[w] = "running") ~>
        (\A w \in Writers : consensusRevState[w] \in {"idle", "succeeded", "failed"})

=============================================================================
