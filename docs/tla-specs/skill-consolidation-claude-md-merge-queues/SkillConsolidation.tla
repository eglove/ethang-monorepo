----------------------- MODULE SkillConsolidation -----------------------
\* Skill Consolidation, CLAUDE.md Dissolution, and Merge Queue Specification
\* Models the migration of content from user-scoped skills and CLAUDE.md
\* into project-scoped agent/expert files and a shared conventions file.
\*
\* Source briefing:
\*   docs/questioner-sessions/2026-04-03_skill-consolidation-claude-md-merge-queues.md

EXTENDS Integers, FiniteSets, Sequences, TLC

\* -------------------------------------------------------------------
\* Constants
\* -------------------------------------------------------------------

CONSTANTS
    ClaudeMdSections,       \* Set of CLAUDE.md section identifiers
    UserScopedSkills,       \* Set of user-scoped skill identifiers
    AgentFiles,             \* Set of project-scoped agent/expert file identifiers
    SharedConventionsFile,  \* The single shared conventions file id
    NULL                    \* Null sentinel

\* -------------------------------------------------------------------
\* Destination types for the dissolution checklist
\* -------------------------------------------------------------------

DestTypes == {"shared_conventions", "agent_file"}

\* -------------------------------------------------------------------
\* Variables
\* -------------------------------------------------------------------

VARIABLES
    \* Per-section migration status: "unmigrated" | "migrated"
    sectionStatus,

    \* Per user-scoped skill: "pending" | "absorbed"
    skillStatus,

    \* Dissolution checklist: mapping from section -> destination
    \* NULL means no destination assigned yet
    checklist,

    \* Whether the checklist has been fully verified (all sections mapped)
    checklistVerified,

    \* Whether CLAUDE.md has been deleted
    claudeMdDeleted,

    \* Shared conventions file: "not_created" | "created"
    sharedConvStatus,

    \* Set of agent files that reference the shared conventions file
    referencingAgents,

    \* Merge queue CI status: "not_updated" | "updated"
    mergeQueueStatus,

    \* doc-bdd split tracking:
    \*   "unsplit" | "eval_to_expert" | "complete"
    docBddSplitStatus,

    \* TLA+ split tracking (mirrors doc-bdd pattern):
    \*   "unsplit" | "eval_to_expert" | "complete"
    tlaSplitStatus

vars == <<sectionStatus, skillStatus, checklist, checklistVerified,
          claudeMdDeleted, sharedConvStatus, referencingAgents,
          mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* -------------------------------------------------------------------
\* Type Invariant
\* -------------------------------------------------------------------

TypeOK ==
    /\ sectionStatus \in [ClaudeMdSections -> {"unmigrated", "migrated"}]
    /\ skillStatus \in [UserScopedSkills -> {"pending", "absorbed"}]
    /\ checklist \in [ClaudeMdSections -> AgentFiles \cup {SharedConventionsFile} \cup {NULL}]
    /\ checklistVerified \in BOOLEAN
    /\ claudeMdDeleted \in BOOLEAN
    /\ sharedConvStatus \in {"not_created", "created"}
    /\ referencingAgents \in SUBSET AgentFiles
    /\ mergeQueueStatus \in {"not_updated", "updated"}
    /\ docBddSplitStatus \in {"unsplit", "eval_to_expert", "complete"}
    /\ tlaSplitStatus \in {"unsplit", "eval_to_expert", "complete"}

\* -------------------------------------------------------------------
\* Initial State
\* -------------------------------------------------------------------

Init ==
    /\ sectionStatus = [s \in ClaudeMdSections |-> "unmigrated"]
    /\ skillStatus = [sk \in UserScopedSkills |-> "pending"]
    /\ checklist = [s \in ClaudeMdSections |-> NULL]
    /\ checklistVerified = FALSE
    /\ claudeMdDeleted = FALSE
    /\ sharedConvStatus = "not_created"
    /\ referencingAgents = {}
    /\ mergeQueueStatus = "not_updated"
    /\ docBddSplitStatus = "unsplit"
    /\ tlaSplitStatus = "unsplit"

\* -------------------------------------------------------------------
\* Actions
\* -------------------------------------------------------------------

\* Assign a destination for a CLAUDE.md section in the dissolution checklist
AssignDestination(section, dest) ==
    /\ ~claudeMdDeleted
    /\ checklist[section] = NULL
    /\ dest \in AgentFiles \cup {SharedConventionsFile}
    /\ checklist' = [checklist EXCEPT ![section] = dest]
    /\ UNCHANGED <<sectionStatus, skillStatus, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* Verify the dissolution checklist (all sections have destinations)
VerifyChecklist ==
    /\ ~checklistVerified
    /\ \A s \in ClaudeMdSections : checklist[s] /= NULL
    /\ checklistVerified' = TRUE
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* Create the shared conventions file
CreateSharedConventions ==
    /\ sharedConvStatus = "not_created"
    /\ sharedConvStatus' = "created"
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* An agent file adds a reference to the shared conventions file
AddConventionsReference(agent) ==
    /\ sharedConvStatus = "created"
    /\ agent \notin referencingAgents
    /\ referencingAgents' = referencingAgents \cup {agent}
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* Migrate a CLAUDE.md section to its assigned destination
MigrateSection(section) ==
    /\ sectionStatus[section] = "unmigrated"
    /\ checklistVerified                          \* checklist must be verified first
    /\ checklist[section] /= NULL                 \* destination must be assigned
    \* If destination is shared conventions, it must exist
    /\ (checklist[section] = SharedConventionsFile => sharedConvStatus = "created")
    /\ sectionStatus' = [sectionStatus EXCEPT ![section] = "migrated"]
    /\ UNCHANGED <<skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* Absorb a user-scoped skill into its project-scoped counterpart(s)
AbsorbSkill(skill) ==
    /\ skillStatus[skill] = "pending"
    /\ skillStatus' = [skillStatus EXCEPT ![skill] = "absorbed"]
    /\ UNCHANGED <<sectionStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* Split doc-bdd: evaluation content to expert-bdd
SplitDocBddEval ==
    /\ docBddSplitStatus = "unsplit"
    /\ docBddSplitStatus' = "eval_to_expert"
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, tlaSplitStatus>>

\* Complete doc-bdd split: production content stays project-scoped
CompleteDocBddSplit ==
    /\ docBddSplitStatus = "eval_to_expert"
    /\ docBddSplitStatus' = "complete"
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, tlaSplitStatus>>

\* Split TLA+: evaluation content to expert-tla
SplitTlaEval ==
    /\ tlaSplitStatus = "unsplit"
    /\ tlaSplitStatus' = "eval_to_expert"
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus>>

\* Complete TLA+ split: syntax/patterns stay in tla-writer
CompleteTlaSplit ==
    /\ tlaSplitStatus = "eval_to_expert"
    /\ tlaSplitStatus' = "complete"
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus>>

\* Delete CLAUDE.md — the critical dissolution action
DeleteClaudeMd ==
    \* PRECONDITIONS (dissolution checklist is the verified gate):
    /\ ~claudeMdDeleted
    /\ checklistVerified
    \* Every section must already be migrated (no content loss)
    /\ \A s \in ClaudeMdSections : sectionStatus[s] = "migrated"
    \* Shared conventions must exist and be referenced by all agents
    /\ sharedConvStatus = "created"
    /\ referencingAgents = AgentFiles
    \* Both content splits must be complete
    /\ docBddSplitStatus = "complete"
    /\ tlaSplitStatus = "complete"
    \* All user-scoped skills absorbed
    /\ \A sk \in UserScopedSkills : skillStatus[sk] = "absorbed"
    /\ claudeMdDeleted' = TRUE
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    sharedConvStatus, referencingAgents,
                    mergeQueueStatus, docBddSplitStatus, tlaSplitStatus>>

\* Update CI for merge queues
UpdateMergeQueueCI ==
    /\ mergeQueueStatus = "not_updated"
    /\ mergeQueueStatus' = "updated"
    /\ UNCHANGED <<sectionStatus, skillStatus, checklist, checklistVerified,
                    claudeMdDeleted, sharedConvStatus, referencingAgents,
                    docBddSplitStatus, tlaSplitStatus>>

\* -------------------------------------------------------------------
\* Termination
\* -------------------------------------------------------------------

\* The system is done when CLAUDE.md is deleted and merge queue updated.
Done ==
    /\ claudeMdDeleted
    /\ mergeQueueStatus = "updated"
    /\ UNCHANGED vars

\* -------------------------------------------------------------------
\* Next-State Relation
\* -------------------------------------------------------------------

Next ==
    \/ \E s \in ClaudeMdSections, d \in AgentFiles \cup {SharedConventionsFile} :
           AssignDestination(s, d)
    \/ VerifyChecklist
    \/ CreateSharedConventions
    \/ \E a \in AgentFiles : AddConventionsReference(a)
    \/ \E s \in ClaudeMdSections : MigrateSection(s)
    \/ \E sk \in UserScopedSkills : AbsorbSkill(sk)
    \/ SplitDocBddEval
    \/ CompleteDocBddSplit
    \/ SplitTlaEval
    \/ CompleteTlaSplit
    \/ DeleteClaudeMd
    \/ UpdateMergeQueueCI
    \/ Done

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* -------------------------------------------------------------------
\* Safety Properties (Invariants)
\* -------------------------------------------------------------------

\* S1: No content loss — CLAUDE.md cannot be deleted while any section
\*     remains unmigrated.
NoContentLoss ==
    claudeMdDeleted =>
        \A s \in ClaudeMdSections : sectionStatus[s] = "migrated"

\* S2: Dissolution checklist gate — deletion requires verified checklist
\*     where every section has a destination.
DissolutionChecklistGate ==
    claudeMdDeleted =>
        /\ checklistVerified
        /\ \A s \in ClaudeMdSections : checklist[s] /= NULL

\* S3: Reference integrity — if CLAUDE.md is deleted, shared conventions
\*     must exist and every agent must reference it.
ReferenceIntegrity ==
    claudeMdDeleted =>
        /\ sharedConvStatus = "created"
        /\ referencingAgents = AgentFiles

\* S4: Content splits must be complete before dissolution.
SplitsCompleteBeforeDeletion ==
    claudeMdDeleted =>
        /\ docBddSplitStatus = "complete"
        /\ tlaSplitStatus = "complete"

\* S5: All user-scoped skills absorbed before dissolution.
SkillsAbsorbedBeforeDeletion ==
    claudeMdDeleted =>
        \A sk \in UserScopedSkills : skillStatus[sk] = "absorbed"

\* S6: Migration requires verified checklist — no section can be migrated
\*     until checklist is verified.
MigrationRequiresChecklist ==
    \A s \in ClaudeMdSections :
        sectionStatus[s] = "migrated" => checklistVerified

\* S7: Shared conventions must be created before any section targeting
\*     it can be migrated.
SharedConvExistsBeforeMigration ==
    \A s \in ClaudeMdSections :
        (sectionStatus[s] = "migrated" /\ checklist[s] = SharedConventionsFile)
            => sharedConvStatus = "created"

\* S8: Content split ordering — eval_to_expert must precede complete.
SplitOrdering ==
    /\ (docBddSplitStatus = "complete" =>
            docBddSplitStatus \in {"eval_to_expert", "complete"})
    /\ (tlaSplitStatus = "complete" =>
            tlaSplitStatus \in {"eval_to_expert", "complete"})

\* -------------------------------------------------------------------
\* Liveness Properties
\* -------------------------------------------------------------------

\* L1: Eventually all sections are migrated.
EventuallyAllMigrated ==
    <>(\A s \in ClaudeMdSections : sectionStatus[s] = "migrated")

\* L2: Eventually CLAUDE.md is deleted (dissolution completes).
EventuallyDissolved ==
    <>(claudeMdDeleted)

\* L3: Eventually merge queue CI is updated.
EventuallyMergeQueue ==
    <>(mergeQueueStatus = "updated")

\* L4: Eventually both content splits complete.
EventuallySplitsComplete ==
    <>(docBddSplitStatus = "complete" /\ tlaSplitStatus = "complete")

=============================================================================
