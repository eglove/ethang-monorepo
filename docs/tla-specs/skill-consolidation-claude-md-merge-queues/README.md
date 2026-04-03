# TLA+ Specification: Skill Consolidation & CLAUDE.md Dissolution

## Source
Briefing: `docs/questioner-sessions/2026-04-03_skill-consolidation-claude-md-merge-queues.md`

## Specification
- **Module:** `SkillConsolidation.tla`
- **Config:** `SkillConsolidation.cfg`

## States

### Content Section Status
- `unmigrated` -- section exists only in CLAUDE.md
- `migrated` -- section content has been moved to its destination

### User-Scoped Skill Status
- `pending` -- skill content not yet absorbed into project-scoped file
- `absorbed` -- skill content inlined into project-scoped counterpart(s)

### Dissolution Checklist
- Each CLAUDE.md section maps to either an agent file or the shared conventions file
- `NULL` means no destination assigned; must be non-NULL for all sections before verification

### Shared Conventions File
- `not_created` -- file does not exist yet
- `created` -- file exists and can receive content

### Content Split Status (doc-bdd and TLA+)
- `unsplit` -- content not yet separated by perspective
- `eval_to_expert` -- evaluation content moved to expert skill file
- `complete` -- both evaluation and production content in correct locations

### Merge Queue CI
- `not_updated` -- ci.yml lacks merge_group trigger
- `updated` -- merge_group trigger added

### CLAUDE.md
- `not deleted` (claudeMdDeleted = FALSE)
- `deleted` (claudeMdDeleted = TRUE)

## Properties Verified

### Safety (Invariants)
- **TypeOK** -- all variables remain within their declared type domains
- **NoContentLoss** -- CLAUDE.md cannot be deleted while any section remains unmigrated
- **DissolutionChecklistGate** -- deletion requires a verified checklist with every section mapped to a destination
- **ReferenceIntegrity** -- after deletion, shared conventions file exists and every agent file references it
- **SplitsCompleteBeforeDeletion** -- both doc-bdd and TLA+ content splits must be complete before dissolution
- **SkillsAbsorbedBeforeDeletion** -- all user-scoped skills must be absorbed before dissolution
- **MigrationRequiresChecklist** -- no section can be migrated until the checklist is verified
- **SharedConvExistsBeforeMigration** -- shared conventions file must exist before any section targeting it can be migrated
- **SplitOrdering** -- content split phases proceed in order (unsplit -> eval_to_expert -> complete)

### Liveness
- **EventuallyAllMigrated** -- all CLAUDE.md sections eventually reach migrated status
- **EventuallyDissolved** -- CLAUDE.md is eventually deleted
- **EventuallyMergeQueue** -- merge queue CI is eventually updated
- **EventuallySplitsComplete** -- both content splits eventually complete

## TLC Results
- **States generated:** 527,065
- **Distinct states:** 94,302
- **Result:** PASS (no errors)
- **Workers:** 4
- **Date:** 2026-04-03

## Prior Versions
None
