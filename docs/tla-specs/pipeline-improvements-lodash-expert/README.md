# TLA+ Specification: Pipeline Improvements — Lodash Expert

## Source

Briefing: `docs/questioner-sessions/2026-04-01_pipeline-improvements-lodash-expert.md`

## Specification

- **Module:** `PipelineImprovements.tla`
- **Config:** `PipelineImprovements.cfg`

## Design Amendments Covered

Six mandatory amendments from the expert debate are formally modelled:

| Amendment | Description | Where modelled |
|-----------|-------------|----------------|
| A1 | `selectExperts` is a named pure function; empty result → hard FAILED | `selectExperts` operator + `SelectionFails` action |
| A2 | `AppendEntry` is idempotent at write time (duplicates allowed) | No guard on existing entries in `AppendEntry` |
| A3 | EMPTY file treated same as ABSENT for header guard | `AppendEntry` fires in any file state |
| A4 | "Only user may delete" is a convention, not a system invariant | `UserDeleteEntries` modelled as unconstrained user action |
| A5 | `.puml` update uses explicit `changeFlag` boolean | `PipelineCompletes_ChangeFlagSet` guard requires `changeFlag = TRUE` |
| A6 | `.puml` write is atomic: temp → rename; original unchanged on failure | `WRITING` state with `tempFileExists`, `originalPumlSafe = TRUE` invariant |

## States

### Machine 1 — UserNotesFile

| State | Meaning |
|-------|---------|
| `ABSENT` | File does not exist |
| `EMPTY` | File exists but has zero bytes (no entries) |
| `HAS_ENTRIES` | File contains one or more agent-appended entries |

### Machine 2 — AutonomousExpertSelection

| State | Meaning |
|-------|---------|
| `IDLE` | Waiting for a new topic |
| `SELECTING` | `selectExperts(topic)` in progress |
| `SELECTED` | Non-empty expert set chosen; ready for debate rounds |
| `FAILED` | `selectExperts` returned empty set — hard precondition error |

### Machine 3 — PumlUpdate

| State | Meaning |
|-------|---------|
| `IDLE` | No update in progress |
| `PENDING` | `changeFlag = TRUE`; Stage 6 wrap-up has not begun |
| `WRITING` | Temp file written; awaiting rename |
| `COMPLETE` | Rename succeeded; `.puml` updated |
| `FAILED` | Rename failed; original `.puml` intact |

## Properties Verified

### Safety (Invariants)

| Property | Guarantee |
|----------|-----------|
| `TypeOK` | All variables remain within their declared domains |
| `NotesStateConsistency` | `HAS_ENTRIES` iff entry sequence is non-empty |
| `AppendAlwaysEnabled` | File state never blocks an append |
| `SelectionNonEmpty` | `SELECTED` state requires `selectedExperts ≠ {}` |
| `FailedOnlyWhenNoMatch` | `FAILED` only when `selectExperts(topic) = {}` |
| `SelectedExpertsOnlyWhenSelected` | Non-empty expert set exists only in `SELECTED` state |
| `AtomicWriteGuarantee` | `originalPumlSafe = TRUE` throughout all reachable states |
| `TempBeforeRename` | `WRITING` state requires `tempFileExists = TRUE` |
| `UpdateOnlyWhenChanged` | `PENDING`/`WRITING` states require `changeFlag = TRUE` |
| `TempFileOnlyDuringWrite` | `tempFileExists = TRUE` only in `WRITING` state |

### Liveness (Temporal Properties)

Liveness properties are defined in the spec (`EventuallyResolved`, `EventuallyIdle_Selection`, `EventuallyUpdated`, `EventuallyIdle_Puml`) and use `LiveSpec` with weak fairness. They are not included in the `.cfg` safety-only run but are available by uncommenting the `PROPERTY` lines and switching `SPECIFICATION` to `LiveSpec`.

## TLC Results

- **States generated:** 37,541
- **Distinct states found:** 6,636
- **States left on queue:** 0
- **Search depth:** 10
- **Result:** PASS — no invariant violations found
- **Workers:** 4
- **Model size:** Agents={a1,a2}, Sessions={s1,s2}, Roster={expert\_tdd, expert\_ddd, expert\_lodash}, Topics={t1,t2,t3}, MaxEntries=2
- **Date:** 2026-04-01

### Modelling Notes

- `STRING` (unbounded) is not enumerable by TLC. The `rationale` field (free text in the design) was dropped from `EntryType` as it has no effect on safety or liveness properties. `expertNeeded` is drawn from `Roster` (the finite set of expert names).
- `notesEntries` is a sequence that grows without bound in production. A `StateConstraint` (`Len(notesEntries) <= MaxEntries`) bounds it to 2 entries for model checking. The constraint does not affect what properties hold — it only limits how many append cycles TLC explores.
- `selectExperts` is implemented as a conditional operator: the constant `TopicWithNoMatch` designates the one topic that returns an empty set, exercising the `FAILED` branch (Amendment A1).

## Prior Versions

None — this is the first version of this specification.
