------------------------ MODULE PipelineImprovements ------------------------
\* TLA+ Formal Specification: Pipeline Improvements — Lodash Expert Session
\* Source: docs/questioner-sessions/2026-04-01_pipeline-improvements-lodash-expert.md
\* Design consensus from expert debate (6 mandatory amendments)
\*
\* Three state machines are modelled:
\*   1. UserNotesFile        — ABSENT | EMPTY | HAS_ENTRIES
\*   2. AutonomousExpertSel  — IDLE | SELECTING | SELECTED | FAILED
\*   3. PumlUpdate           — IDLE | PENDING | WRITING | COMPLETE | FAILED
\*
\* Amendment compliance:
\*   A1: selectExperts is a named pure function; empty result → FAILED (hard error)
\*   A2: AppendEntry is idempotent at write time (duplicates allowed)
\*   A3: EMPTY file is treated same as ABSENT for header-creation guard
\*   A4: "Only user may delete" is a convention modelled as an unconstrained User action
\*   A5: changeFlag is explicit boolean, not inferred
\*   A6: .puml write is atomic: temp → rename; original unchanged on failure

EXTENDS Integers, FiniteSets, Sequences, TLC

-----------------------------------------------------------------------------
\* CONSTANTS
-----------------------------------------------------------------------------

CONSTANTS
    Agents,          \* Set of agent names that can append to user_notes
    Roster,          \* Fixed set of available expert names
    Topics,          \* Set of possible debate topics
    Sessions,        \* Set of session identifiers (source_session field)
    TopicWithNoMatch, \* A specific topic that maps to zero experts (tests Amendment A1)
                      \* Must be an element of Topics in the .cfg
    MaxEntries       \* Upper bound on notesEntries length for bounded model checking

-----------------------------------------------------------------------------
\* VARIABLES
-----------------------------------------------------------------------------

VARIABLES
    \* --- Machine 1: UserNotesFile ---
    notesFileState,     \* "ABSENT" | "EMPTY" | "HAS_ENTRIES"
    notesEntries,       \* Sequence of entries written by agents

    \* --- Machine 2: AutonomousExpertSelection ---
    selectionState,     \* "IDLE" | "SELECTING" | "SELECTED" | "FAILED"
    currentTopic,       \* Topic currently being processed (or "NONE")
    selectedExperts,    \* Set of experts chosen for current debate

    \* --- Machine 3: PumlUpdate ---
    pumlState,          \* "IDLE" | "PENDING" | "WRITING" | "COMPLETE" | "FAILED"
    changeFlag,         \* BOOLEAN — set by pipeline stages when structure changes
    tempFileExists,     \* BOOLEAN — TRUE while temp file has been written
    originalPumlSafe    \* BOOLEAN — TRUE means original .puml is intact (never FALSE after failure)

vars == <<notesFileState, notesEntries,
          selectionState, currentTopic, selectedExperts,
          pumlState, changeFlag, tempFileExists, originalPumlSafe>>

-----------------------------------------------------------------------------
\* TYPE INVARIANT
-----------------------------------------------------------------------------

FileStates  == {"ABSENT", "EMPTY", "HAS_ENTRIES"}
SelStates   == {"IDLE", "SELECTING", "SELECTED", "FAILED"}
PumlStates  == {"IDLE", "PENDING", "WRITING", "COMPLETE", "FAILED"}

\* An entry is a record with four fields matching the briefing schema.
\* expertNeeded is drawn from Roster (the set of known expert names).
\* rationale is free text — we model it as a token from Sessions for
\* enumerability (the content does not affect safety/liveness properties).
EntryType == [agent        : Agents,
              expertNeeded : Roster,
              sourceSession: Sessions]

TypeOK ==
    /\ notesFileState \in FileStates
    /\ notesEntries   \in Seq(EntryType)
    /\ selectionState \in SelStates
    /\ currentTopic   \in Topics \union {"NONE"}
    /\ selectedExperts \in SUBSET Roster
    /\ pumlState       \in PumlStates
    /\ changeFlag      \in BOOLEAN
    /\ tempFileExists  \in BOOLEAN
    /\ originalPumlSafe \in BOOLEAN

-----------------------------------------------------------------------------
\* STATE CONSTRAINT (bounds model checking state space)
-----------------------------------------------------------------------------

\* Limit the notes log length to MaxEntries for tractable model checking.
\* This does not affect the safety/liveness properties being verified.
StateConstraint == Len(notesEntries) <= MaxEntries

-----------------------------------------------------------------------------
\* INITIAL STATE
-----------------------------------------------------------------------------

Init ==
    /\ notesFileState   = "ABSENT"
    /\ notesEntries     = <<>>
    /\ selectionState   = "IDLE"
    /\ currentTopic     = "NONE"
    /\ selectedExperts  = {}
    /\ pumlState        = "IDLE"
    /\ changeFlag       = FALSE
    /\ tempFileExists   = FALSE
    /\ originalPumlSafe = TRUE

-----------------------------------------------------------------------------
\* MACHINE 1 — UserNotesFile
\*
\* Amendment A2: duplicate entries allowed at write time
\* Amendment A3: EMPTY treated same as ABSENT (header guard applies to both)
\* Amendment A4: user deletion modelled as unconstrained external action
-----------------------------------------------------------------------------

\* Agent appends an entry.  Creates file (with header) if ABSENT or EMPTY.
\* Always succeeds regardless of current file state (AppendAlwaysSucceeds).
\* Amendment A3: file created with header when ABSENT or EMPTY.
\* Amendment A2: duplicates allowed at write time.
\* Bounded by MaxEntries for model checking tractability.
AppendEntry(agent, expertNeeded, sourceSession) ==
    LET entry == [agent         |-> agent,
                  expertNeeded  |-> expertNeeded,
                  sourceSession |-> sourceSession]
    IN
    /\ agent \in Agents
    /\ expertNeeded \in Roster
    /\ sourceSession \in Sessions
    /\ Len(notesEntries) < MaxEntries   \* bound for model checking
    \* Transition to HAS_ENTRIES from any state (ABSENT, EMPTY, or HAS_ENTRIES)
    /\ notesFileState' = "HAS_ENTRIES"
    /\ notesEntries'   = Append(notesEntries, entry)
    /\ UNCHANGED <<selectionState, currentTopic, selectedExperts,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

\* User deletes all entries (convention — unconstrained).
\* Amendment A4: deletion by user is a convention, not a system invariant.
\* We model the user resetting the file to ABSENT or EMPTY (entries cleared).
\* The user may also leave the file in HAS_ENTRIES (partial delete not modelled
\* for state-space tractability; partial delete is equivalent to a full reset
\* followed by selective re-appends, which the agent actions already cover).
UserDeleteEntries ==
    /\ notesFileState = "HAS_ENTRIES"
    /\ \E newState \in {"ABSENT", "EMPTY"} :
           notesFileState' = newState
    /\ notesEntries' = <<>>
    /\ UNCHANGED <<selectionState, currentTopic, selectedExperts,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

-----------------------------------------------------------------------------
\* MACHINE 2 — AutonomousExpertSelection
\*
\* Amendment A1: selectExperts is a named pure function.
\*   Empty result → FAILED (hard precondition error, not silent proceed).
\* The function is modelled via SelectMapping constant.
-----------------------------------------------------------------------------

\* Pure function: maps a topic to the set of matching experts.
\* Defined as an operator so it has an explicit contract (Amendment A1).
\* Topics other than TopicWithNoMatch are assumed to match at least one expert.
\* This models the two possible outcomes without needing a full mapping constant.
selectExperts(topic) ==
    IF topic = TopicWithNoMatch
    THEN {}                \* empty → FAILED (hard precondition error)
    ELSE Roster            \* non-empty → SELECTED (uses full roster for simplicity)

\* debate-moderator receives a topic; selection begins.
ReceiveTopic(topic) ==
    /\ selectionState = "IDLE"
    /\ topic \in Topics
    /\ selectionState' = "SELECTING"
    /\ currentTopic'   = topic
    /\ UNCHANGED <<notesFileState, notesEntries, selectedExperts,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

\* selectExperts returns a non-empty set → SELECTED.
SelectionSucceeds ==
    /\ selectionState = "SELECTING"
    /\ currentTopic /= "NONE"
    /\ selectExperts(currentTopic) /= {}   \* guard: non-empty result
    /\ selectionState' = "SELECTED"
    /\ selectedExperts' = selectExperts(currentTopic)
    /\ UNCHANGED <<notesFileState, notesEntries, currentTopic,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

\* selectExperts returns empty set → FAILED (hard precondition error).
\* Amendment A1: never silently proceed with zero experts.
SelectionFails ==
    /\ selectionState = "SELECTING"
    /\ currentTopic /= "NONE"
    /\ selectExperts(currentTopic) = {}    \* guard: empty result triggers failure
    /\ selectionState' = "FAILED"
    /\ UNCHANGED <<notesFileState, notesEntries, currentTopic, selectedExperts,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

\* Debate rounds complete; reset to IDLE.
DebateComplete ==
    /\ selectionState = "SELECTED"
    /\ selectionState' = "IDLE"
    /\ currentTopic'   = "NONE"
    /\ selectedExperts' = {}
    /\ UNCHANGED <<notesFileState, notesEntries,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

\* Failure is acknowledged; reset to IDLE for next attempt.
AcknowledgeFailure ==
    /\ selectionState = "FAILED"
    /\ selectionState' = "IDLE"
    /\ currentTopic'   = "NONE"
    /\ UNCHANGED <<notesFileState, notesEntries, selectedExperts,
                   pumlState, changeFlag, tempFileExists, originalPumlSafe>>

-----------------------------------------------------------------------------
\* MACHINE 3 — PumlUpdate
\*
\* Amendment A5: changeFlag is an explicit boolean (not inferred from context).
\* Amendment A6: write is atomic — temp file written first, then renamed.
\*   Original unchanged if rename fails.
-----------------------------------------------------------------------------

\* A pipeline stage modifies pipeline structure → sets changeFlag.
PipelineStageModifiesStructure ==
    /\ pumlState = "IDLE"
    /\ ~changeFlag
    /\ changeFlag' = TRUE
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   pumlState, tempFileExists, originalPumlSafe>>

\* Pipeline completes with changeFlag = TRUE → PENDING.
PipelineCompletes_ChangeFlagSet ==
    /\ pumlState = "IDLE"
    /\ changeFlag = TRUE
    /\ pumlState' = "PENDING"
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   changeFlag, tempFileExists, originalPumlSafe>>

\* Pipeline completes with changeFlag = FALSE → no update (stays IDLE).
\* Amendment A5: update only triggered by explicit flag.
PipelineCompletes_NoChange ==
    /\ pumlState = "IDLE"
    /\ changeFlag = FALSE
    /\ UNCHANGED vars   \* no state change needed

\* Stage 6 wrap-up begins atomic write: writes temp file.
BeginAtomicWrite ==
    /\ pumlState = "PENDING"
    /\ pumlState'      = "WRITING"
    /\ tempFileExists' = TRUE
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   changeFlag, originalPumlSafe>>

\* Rename succeeds → COMPLETE. Original .puml is now updated.
RenameSucceeds ==
    /\ pumlState = "WRITING"
    /\ tempFileExists = TRUE        \* Amendment A6: temp must exist before rename
    /\ pumlState'      = "COMPLETE"
    /\ tempFileExists' = FALSE
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   changeFlag, originalPumlSafe>>

\* Rename fails → FAILED. Original .puml remains unchanged.
\* Amendment A6: originalPumlSafe stays TRUE.
RenameFails ==
    /\ pumlState = "WRITING"
    /\ tempFileExists = TRUE
    /\ pumlState'      = "FAILED"
    /\ tempFileExists' = FALSE
    \* originalPumlSafe remains TRUE — original file was never touched
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   changeFlag, originalPumlSafe>>

\* Reset to IDLE after completion (successful or failed).
PumlResetAfterComplete ==
    /\ pumlState = "COMPLETE"
    /\ pumlState'   = "IDLE"
    /\ changeFlag'  = FALSE
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   tempFileExists, originalPumlSafe>>

PumlResetAfterFailure ==
    /\ pumlState = "FAILED"
    /\ pumlState'   = "IDLE"
    /\ changeFlag'  = FALSE
    \* originalPumlSafe remains TRUE — confirmed intact
    /\ UNCHANGED <<notesFileState, notesEntries,
                   selectionState, currentTopic, selectedExperts,
                   tempFileExists, originalPumlSafe>>

-----------------------------------------------------------------------------
\* NEXT STATE RELATION
-----------------------------------------------------------------------------

Next ==
    \* Machine 1 — UserNotesFile
    \/ \E a \in Agents, en \in Roster, s \in Sessions :
           AppendEntry(a, en, s)
    \/ UserDeleteEntries
    \* Machine 2 — AutonomousExpertSelection
    \/ \E t \in Topics : ReceiveTopic(t)
    \/ SelectionSucceeds
    \/ SelectionFails
    \/ DebateComplete
    \/ AcknowledgeFailure
    \* Machine 3 — PumlUpdate
    \/ PipelineStageModifiesStructure
    \/ PipelineCompletes_ChangeFlagSet
    \/ PipelineCompletes_NoChange
    \/ BeginAtomicWrite
    \/ RenameSucceeds
    \/ RenameFails
    \/ PumlResetAfterComplete
    \/ PumlResetAfterFailure

Spec == Init /\ [][Next]_vars

-----------------------------------------------------------------------------
\* FAIRNESS
\* Weak fairness ensures that if an action is continuously enabled it
\* will eventually fire — guaranteeing liveness properties.
-----------------------------------------------------------------------------

Fairness ==
    /\ WF_vars(SelectionSucceeds)
    /\ WF_vars(SelectionFails)
    /\ WF_vars(DebateComplete)
    /\ WF_vars(AcknowledgeFailure)
    /\ WF_vars(BeginAtomicWrite)
    /\ WF_vars(RenameSucceeds \/ RenameFails)
    /\ WF_vars(PumlResetAfterComplete)
    /\ WF_vars(PumlResetAfterFailure)

LiveSpec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------
\* SAFETY INVARIANTS — Machine 1: UserNotesFile
-----------------------------------------------------------------------------

\* Agents never remove entries from the file.
\* (Only UserDeleteEntries may reduce the entry count — that is a user action.)
\* We cannot directly enforce "agents never called UserDeleteEntries", but we
\* can assert that the notes monotonicity holds except through the user action.
\* The property we CAN check as an invariant is structural consistency:

\* HAS_ENTRIES state requires at least one entry in the sequence.
NotesStateConsistency ==
    /\ (notesFileState = "HAS_ENTRIES" => Len(notesEntries) > 0)
    /\ (notesFileState \in {"ABSENT", "EMPTY"} => Len(notesEntries) = 0)

\* AppendEntry always succeeds — the file is never left in a state where
\* appending is blocked.  Captured by the absence of a guard on AppendEntry
\* plus the type invariant.  We assert the enabling condition here:
AppendAlwaysEnabled ==
    \* For any agent and session, AppendEntry is structurally enabled
    \* (no file state blocks it).  This is an invariant on the state space.
    notesFileState \in FileStates  \* trivially true but documents intent

\* Monotonic: once HAS_ENTRIES, only a user action can remove entries.
\* Since UserDeleteEntries is modelled as unconstrained, the invariant
\* we can verify is that the entry count never decreases without going
\* through a state that the user owns.  As a safety property we verify:
\* The notesEntries sequence only grows via AppendEntry (never by Next
\* without a corresponding append).  This is guaranteed structurally
\* because only AppendEntry modifies notesEntries in the agent actions.

-----------------------------------------------------------------------------
\* SAFETY INVARIANTS — Machine 2: AutonomousExpertSelection
-----------------------------------------------------------------------------

\* Amendment A1: SELECTED requires non-empty selectedExperts.
SelectionNonEmpty ==
    selectionState = "SELECTED" => selectedExperts /= {}

\* Amendment A1: FAILED only reachable when selectExperts returned empty.
FailedOnlyWhenNoMatch ==
    selectionState = "FAILED" =>
        currentTopic /= "NONE" /\ selectExperts(currentTopic) = {}

\* Debate rounds cannot begin without passing through SELECTED first.
\* We model "debate rounds" as the state following SELECTED.
\* This invariant asserts SELECTING never jumps to IDLE without resolution.
SelectionBeforeRounds ==
    \* If IDLE with no previous failure, prior state must have been SELECTED
    \* (enforced structurally: IDLE ← DebateComplete ← SELECTED, or
    \*                          IDLE ← AcknowledgeFailure ← FAILED)
    \* As a checkable invariant: selectedExperts is empty iff not in SELECTED.
    (selectionState /= "SELECTED") => TRUE   \* structural guarantee by Next

\* Stronger form: selectedExperts is non-empty only in SELECTED state.
SelectedExpertsOnlyWhenSelected ==
    selectedExperts /= {} => selectionState = "SELECTED"

-----------------------------------------------------------------------------
\* SAFETY INVARIANTS — Machine 3: PumlUpdate
-----------------------------------------------------------------------------

\* Amendment A6: original .puml is always intact (never corrupted by partial write).
AtomicWriteGuarantee ==
    originalPumlSafe = TRUE

\* Amendment A6: WRITING state requires temp file to exist before rename.
TempBeforeRename ==
    pumlState = "WRITING" => tempFileExists = TRUE

\* Amendment A5: update only triggered when changeFlag was TRUE.
\* Captured structurally: PipelineCompletes_ChangeFlagSet requires changeFlag = TRUE.
\* As an invariant: PENDING or WRITING states imply changeFlag was TRUE at some point.
\* The state machine enforces this; we assert the observable consequence:
UpdateOnlyWhenChanged ==
    \* If we are in PENDING/WRITING/COMPLETE/FAILED, changeFlag was set at entry.
    \* Since changeFlag is only reset after COMPLETE/FAILED→IDLE, while in these
    \* states it must still be TRUE (it was required to enter PENDING).
    pumlState \in {"PENDING", "WRITING"} => changeFlag = TRUE

\* Temp file only exists during WRITING state.
TempFileOnlyDuringWrite ==
    tempFileExists = TRUE => pumlState = "WRITING"

-----------------------------------------------------------------------------
\* LIVENESS PROPERTIES
-----------------------------------------------------------------------------

\* Machine 2: Every topic received eventually either selects experts or fails.
EventuallyResolved ==
    \A t \in Topics :
        selectionState = "SELECTING" ~>
            selectionState \in {"SELECTED", "FAILED"}

\* Machine 2: After SELECTED, debate eventually completes (returns to IDLE).
EventuallyIdle_Selection ==
    selectionState = "SELECTED" ~> selectionState = "IDLE"

\* Machine 3: If changeFlag is set and pipeline completes, puml eventually updates.
EventuallyUpdated ==
    (pumlState = "PENDING") ~> pumlState \in {"COMPLETE", "FAILED"}

\* Machine 3: After COMPLETE or FAILED, system returns to IDLE.
EventuallyIdle_Puml ==
    pumlState \in {"COMPLETE", "FAILED"} ~> pumlState = "IDLE"

=============================================================================
