--------------------------- MODULE PipelineEnhancements ---------------------------
(*
  TLA+ specification for four design-pipeline enhancements:
    1. PlantUML enforcement as unconditional Stage 7 step
    2. Freeform questioner with completeness check and hard turn cap
    3. Librarian agent maintaining codebase index (Shared Kernel)
    4. Accessibility expert + reviewer with quorum formula ceil(2n/3)

  Models the review gate, Stage 7 fork-join, questioner termination,
  and atomic deployment constraints from the 8 expert amendments.
*)
EXTENDS Integers, FiniteSets, Sequences, TLC

CONSTANTS
    Reviewers,          \* Set of reviewer IDs (includes a11y-reviewer)
    Experts,            \* Set of expert IDs (includes expert-a11y)
    MaxTurns,           \* Hard maximum turn cap for questioner
    SplitThreshold,     \* Configurable token threshold for librarian split (parameter, not hardcoded)
    A11yReviewer,       \* The specific a11y reviewer ID
    A11yExpert,         \* The specific a11y expert ID
    Topics              \* Set of possible topics (some frontend, some not)

ASSUME Cardinality(Reviewers) >= 1
ASSUME Cardinality(Experts) >= 1
ASSUME MaxTurns >= 1
ASSUME SplitThreshold >= 1

VARIABLES
    \* Pipeline stage tracking
    pipelineStage,      \* Current pipeline stage: 1..7, 8 = done

    \* Questioner state (Item 2)
    questionerTurns,    \* Number of turns taken
    questionerDone,     \* Whether questioner has finished
    completenessChecked,\* Whether the completeness self-check ran

    \* Review gate state (Item 4 + amendments 1, 5, 8)
    reviews,            \* Set of reviewers who have submitted reviews
    reviewGatePassed,   \* Whether the review gate has been passed
    quorumDeployed,     \* Whether quorum formula + a11y reviewer deployed atomically

    \* Stage 7 fork-join (Items 1 & 3 + amendment 3)
    plantumlDone,       \* Whether PlantUML step completed
    librarianDone,      \* Whether librarian step completed
    stage7Committed,    \* Whether the single atomic commit happened

    \* Librarian shared kernel state (Item 3 + amendment 4)
    librarianIndex,     \* "valid" | "stale" | "partial" | "corrupt"
    librarianTokens,    \* Token count for current category file
    librarianSplit,     \* Whether a split has occurred

    \* Expert selection (amendment 6)
    topicKind,          \* "frontend" | "backend" | "mixed"
    selectedExperts,    \* Set of experts selected for debate

    \* Deployment tracking (amendment 5)
    deployedItems       \* Set of items that have been deployed

vars == <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
          reviews, reviewGatePassed, quorumDeployed,
          plantumlDone, librarianDone, stage7Committed,
          librarianIndex, librarianTokens, librarianSplit,
          topicKind, selectedExperts, deployedItems>>

\* ---- Helper operators ----

\* Quorum formula: ceil(2n/3) with floor guard (amendment 1)
\* Precondition: n >= 1
Quorum(n) ==
    IF n < 1
    THEN -1  \* Sentinel: must never be used as actual quorum
    ELSE ((2 * n) + 2) \div 3  \* Integer ceiling of 2n/3

\* Number of active reviewers
NumReviewers == Cardinality(Reviewers)

\* Required quorum count
RequiredQuorum == Quorum(NumReviewers)

\* A11y expert should be selected when topic involves frontend (amendment 6)
A11yRelevant(tk) == tk \in {"frontend", "mixed"}

\* ---- Type invariant ----

TypeOK ==
    /\ pipelineStage \in 1..8  \* 8 = done
    /\ questionerTurns \in 0..MaxTurns
    /\ questionerDone \in BOOLEAN
    /\ completenessChecked \in BOOLEAN
    /\ reviews \subseteq Reviewers
    /\ reviewGatePassed \in BOOLEAN
    /\ quorumDeployed \in BOOLEAN
    /\ plantumlDone \in BOOLEAN
    /\ librarianDone \in BOOLEAN
    /\ stage7Committed \in BOOLEAN
    /\ librarianIndex \in {"valid", "stale", "partial", "corrupt"}
    /\ librarianTokens \in 0..(2 * SplitThreshold)
    /\ librarianSplit \in BOOLEAN
    /\ topicKind \in {"frontend", "backend", "mixed"}
    /\ selectedExperts \subseteq Experts
    /\ deployedItems \subseteq {"quorum_formula", "a11y_reviewer", "plantuml", "librarian", "questioner"}

\* ---- Init ----

Init ==
    /\ pipelineStage = 1
    /\ questionerTurns = 0
    /\ questionerDone = FALSE
    /\ completenessChecked = FALSE
    /\ reviews = {}
    /\ reviewGatePassed = FALSE
    /\ quorumDeployed = FALSE
    /\ plantumlDone = FALSE
    /\ librarianDone = FALSE
    /\ stage7Committed = FALSE
    /\ librarianIndex \in {"valid", "stale", "partial", "corrupt"}
    /\ librarianTokens = 0
    /\ librarianSplit = FALSE
    /\ topicKind \in {"frontend", "backend", "mixed"}
    /\ selectedExperts = {}
    /\ deployedItems = {}

\* ---- Actions ----

\* Stage 1: Questioner takes a turn (freeform, not fixed tree)
QuestionerAsk ==
    /\ pipelineStage = 1
    /\ ~questionerDone
    /\ questionerTurns < MaxTurns
    /\ questionerTurns' = questionerTurns + 1
    /\ UNCHANGED <<pipelineStage, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 1: Questioner completeness check (amendment 2a - defined completeness criteria)
\* The questioner CAN stop: it reviews accumulated answers and checks for gaps
QuestionerCompletenessCheck ==
    /\ pipelineStage = 1
    /\ ~questionerDone
    /\ ~completenessChecked
    /\ questionerTurns > 0  \* Must have asked at least one question
    /\ completenessChecked' = TRUE
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 1: Questioner finishes voluntarily (after completeness check)
QuestionerFinishVoluntary ==
    /\ pipelineStage = 1
    /\ ~questionerDone
    /\ completenessChecked  \* Must have run completeness check first
    /\ questionerDone' = TRUE
    /\ pipelineStage' = 2
    /\ UNCHANGED <<questionerTurns, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 1: Questioner forced stop at MaxTurns (amendment 2b - hard cap)
QuestionerForceStop ==
    /\ pipelineStage = 1
    /\ ~questionerDone
    /\ questionerTurns = MaxTurns
    /\ questionerDone' = TRUE
    /\ completenessChecked' = TRUE  \* Implicit at forced stop
    /\ pipelineStage' = 2
    /\ UNCHANGED <<questionerTurns,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 2: Select experts for debate (amendment 6 - a11y selection criteria)
SelectExperts ==
    /\ pipelineStage = 2
    /\ selectedExperts = {}
    /\ IF A11yRelevant(topicKind)
       THEN selectedExperts' \in {s \in SUBSET Experts : A11yExpert \in s /\ s /= {}}
       ELSE selectedExperts' \in {s \in SUBSET (Experts \ {A11yExpert}) : s /= {}}
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, deployedItems>>

\* Stages 2-5: Advance through pipeline stages (abstracted)
AdvanceMiddleStages ==
    /\ pipelineStage \in 2..5
    /\ IF pipelineStage = 2
       THEN selectedExperts /= {}  \* Must have selected experts
       ELSE TRUE
    /\ pipelineStage' = pipelineStage + 1
    /\ UNCHANGED <<questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 6: Reviewer submits a review
SubmitReview(r) ==
    /\ pipelineStage = 6
    /\ r \in Reviewers
    /\ r \notin reviews
    /\ ~reviewGatePassed
    /\ reviews' = reviews \cup {r}
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
                   reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 6: Review gate passes when quorum reached
PassReviewGate ==
    /\ pipelineStage = 6
    /\ ~reviewGatePassed
    /\ NumReviewers >= 1              \* Floor guard (amendment 1)
    /\ Cardinality(reviews) >= RequiredQuorum
    /\ reviewGatePassed' = TRUE
    /\ pipelineStage' = 7
    /\ UNCHANGED <<questionerTurns, questionerDone, completenessChecked,
                   reviews, quorumDeployed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 7: PlantUML completes (runs in parallel with librarian)
PlantUMLComplete ==
    /\ pipelineStage = 7
    /\ ~plantumlDone
    /\ ~stage7Committed
    /\ plantumlDone' = TRUE
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 7: Librarian updates index
LibrarianUpdate ==
    /\ pipelineStage = 7
    /\ ~librarianDone
    /\ ~stage7Committed
    /\ \E tokens \in 1..(2 * SplitThreshold) :
        /\ librarianTokens' = tokens
        /\ IF tokens > SplitThreshold
           THEN librarianSplit' = TRUE
           ELSE librarianSplit' = librarianSplit
    /\ librarianDone' = TRUE
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, stage7Committed,
                   librarianIndex,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 7: Librarian handles stale/partial index gracefully (amendment 4)
LibrarianConsultWithDegradedIndex ==
    /\ pipelineStage = 7
    /\ ~librarianDone
    /\ ~stage7Committed
    /\ librarianIndex \in {"stale", "partial", "corrupt"}
    \* Graceful degradation: still completes, just with reduced quality
    /\ librarianDone' = TRUE
    /\ librarianTokens' = 0  \* No update when degraded
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, stage7Committed,
                   librarianIndex, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Stage 7: Fork-join commit (amendment 3 - single atomic commit after both complete)
Stage7Commit ==
    /\ pipelineStage = 7
    /\ plantumlDone
    /\ librarianDone
    /\ ~stage7Committed
    /\ stage7Committed' = TRUE
    /\ pipelineStage' = 8
    /\ UNCHANGED <<questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed, quorumDeployed,
                   plantumlDone, librarianDone,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts, deployedItems>>

\* Deployment: Quorum formula + a11y reviewer deployed atomically (amendment 5)
DeployQuorumAndA11y ==
    /\ pipelineStage = 8
    /\ ~quorumDeployed
    /\ "quorum_formula" \notin deployedItems
    /\ "a11y_reviewer" \notin deployedItems
    /\ quorumDeployed' = TRUE
    /\ deployedItems' = deployedItems \cup {"quorum_formula", "a11y_reviewer"}
    /\ UNCHANGED <<pipelineStage, questionerTurns, questionerDone, completenessChecked,
                   reviews, reviewGatePassed,
                   plantumlDone, librarianDone, stage7Committed,
                   librarianIndex, librarianTokens, librarianSplit,
                   topicKind, selectedExperts>>

\* ---- Next state relation ----

Next ==
    \/ QuestionerAsk
    \/ QuestionerCompletenessCheck
    \/ QuestionerFinishVoluntary
    \/ QuestionerForceStop
    \/ SelectExperts
    \/ AdvanceMiddleStages
    \/ \E r \in Reviewers : SubmitReview(r)
    \/ PassReviewGate
    \/ PlantUMLComplete
    \/ LibrarianUpdate
    \/ LibrarianConsultWithDegradedIndex
    \/ Stage7Commit
    \/ DeployQuorumAndA11y

\* ---- Specification ----

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* ==== SAFETY PROPERTIES (Invariants) ====

\* Amendment 1: Quorum formula floor guard - quorum must never be 0
QuorumFloorGuard ==
    NumReviewers >= 1 => RequiredQuorum >= 1

\* Amendment 1 + 8: At n=2, quorum=2 (unanimity) - documented as intentional
QuorumAtTwoIsUnanimity ==
    Cardinality(Reviewers) = 2 => Quorum(2) = 2

\* Amendment 2: Questioner must not exceed MaxTurns
QuestionerBounded ==
    questionerTurns <= MaxTurns

\* Amendment 2: Questioner must complete completeness check before finishing voluntarily
QuestionerCompletenessRequired ==
    (questionerDone /\ pipelineStage /= 1) => completenessChecked

\* Amendment 3: No independent commits during Stage 7 fork-join
\* PlantUML and librarian must both be done before commit
Stage7AtomicCommit ==
    stage7Committed => (plantumlDone /\ librarianDone)

\* Amendment 5: Quorum formula and a11y reviewer are always deployed together
AtomicQuorumDeployment ==
    /\ ("quorum_formula" \in deployedItems) <=> ("a11y_reviewer" \in deployedItems)
    /\ quorumDeployed <=> ("quorum_formula" \in deployedItems)

\* Amendment 6: A11y expert selected when topic is frontend-relevant
A11ySelectionCriteria ==
    (selectedExperts /= {} /\ A11yRelevant(topicKind)) => A11yExpert \in selectedExperts

\* Review gate cannot pass with zero reviews
ReviewGateNonVacuous ==
    reviewGatePassed => Cardinality(reviews) >= 1

\* Questioner must have asked at least one question when done
QuestionerMinOneQuestion ==
    questionerDone => questionerTurns >= 1

\* Deployment is contingent on review gate passage
DeploymentRequiresReviewGate ==
    quorumDeployed => reviewGatePassed

\* ==== LIVENESS PROPERTIES ====

\* Amendment 2: Questioner eventually terminates
QuestionerTerminates == <>(questionerDone)

\* Pipeline eventually reaches done
PipelineCompletes == <>(pipelineStage = 8)

\* Stage 7 fork-join eventually commits after both tasks complete
ForkJoinCompletes == (plantumlDone /\ librarianDone) ~> stage7Committed

\* Pipeline stages only move forward (temporal monotonicity)
StageMonotonicity == [][pipelineStage' >= pipelineStage]_pipelineStage

=============================================================================
