# Implementation Plan: Skill Consolidation, CLAUDE.md Dissolution, and Merge Queue CI

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-03_skill-consolidation-claude-md-merge-queues.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-03_skill-consolidation-claude-md-merge-queues.md` |
| TLA+ Specification | `docs/tla-specs/skill-consolidation-claude-md-merge-queues/SkillConsolidation.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-03_tla-review-skill-consolidation.md` |

## TLA+ State Coverage Matrix

### States

- `sectionStatus[s]`: `"unmigrated"` | `"migrated"` (per CLAUDE.md section)
- `skillStatus[sk]`: `"pending"` | `"absorbed"` (per user-scoped skill)
- `checklist[s]`: `NULL` | destination (per CLAUDE.md section)
- `checklistVerified`: `FALSE` | `TRUE`
- `claudeMdDeleted`: `FALSE` | `TRUE`
- `sharedConvStatus`: `"not_created"` | `"created"`
- `referencingAgents`: subset of AgentFiles (empty through full set)
- `mergeQueueStatus`: `"not_updated"` | `"updated"`
- `docBddSplitStatus`: `"unsplit"` | `"eval_to_expert"` | `"complete"`
- `tlaSplitStatus`: `"unsplit"` | `"eval_to_expert"` | `"complete"`

### Transitions

- `AssignDestination(section, dest)` -- assign a CLAUDE.md section to a destination in the dissolution checklist
- `ReassignDestination(section, dest)` -- correct a checklist assignment before verification (TLA+ review refinement #3)
- `VerifyChecklist` -- verify all sections have destinations
- `CreateSharedConventions` -- create the shared conventions file
- `AddConventionsReference(agent)` -- add shared conventions reference to an agent file
- `MigrateSection(section)` -- migrate a CLAUDE.md section to its assigned destination
- `AbsorbSkill(skill)` -- absorb a user-scoped skill into its project-scoped counterpart (must verify content placed -- TLA+ review refinement #4)
- `SplitDocBddEval` -- move evaluation content from doc-bdd to expert-bdd
- `CompleteDocBddSplit` -- relocate production content to project-scoped doc-bdd
- `SplitTlaEval` -- move evaluation content from tla-specification to expert-tla
- `CompleteTlaSplit` -- inline syntax/patterns into tla-writer
- `DeleteClaudeMd` -- delete CLAUDE.md after all preconditions met
- `UpdateMergeQueueCI` -- add merge_group trigger to CI
- `Done` -- terminal state (claudeMdDeleted AND mergeQueueStatus = "updated")

### Safety Invariants

- `TypeOK` -- all variables within valid domains
- `NoContentLoss` (S1) -- claudeMdDeleted implies all sections migrated
- `DissolutionChecklistGate` (S2) -- claudeMdDeleted implies checklistVerified and all sections have destinations
- `ReferenceIntegrity` (S3) -- claudeMdDeleted implies sharedConvStatus = "created" and all agents reference it
- `SplitsCompleteBeforeDeletion` (S4) -- claudeMdDeleted implies both splits complete
- `SkillsAbsorbedBeforeDeletion` (S5) -- claudeMdDeleted implies all skills absorbed
- `MigrationRequiresChecklist` (S6) -- any section migrated implies checklistVerified
- `SharedConvExistsBeforeMigration` (S7) -- section migrated to shared conventions implies it exists
- `SplitOrdering` (S8) -- REMOVED per TLA+ review: ordering enforced by transition guards, not a separate invariant

### Liveness Properties

- `EventuallyAllMigrated` (L1) -- all sections eventually migrated
- `EventuallyDissolved` (L2) -- CLAUDE.md eventually deleted
- `EventuallyMergeQueue` (L3) -- merge queue CI eventually updated
- `EventuallySplitsComplete` (L4) -- both content splits eventually complete
- `EventuallyAllAbsorbed` (L5) -- all user-scoped skills eventually absorbed (TLA+ review refinement #6)

---

## Implementation Steps

### Step 1: Create shared conventions file

**Files:**
- `.claude/skills/shared/conventions.md` (create)

**Description:**
Create the shared conventions file that will hold all global rules currently in CLAUDE.md that do not belong to any single agent or expert. This is the `CreateSharedConventions` transition. The file collects: LF line endings, ESLint config constraints, Vitest coverage thresholds, CSpell unknown words, lodash general rule, no repeated string literals, feature development agents directive, and opportunistic code improvement. These are rules every agent must follow regardless of specialization.

**Dependencies:** None

**Test (write first):**
Write a test that reads `.claude/skills/shared/conventions.md` and asserts:
1. File exists and is non-empty
2. Contains a section or heading for each of the 8 global rules: "Line Endings", "ESLint Config", "Vitest Coverage Thresholds", "CSpell", "Lodash" (general rule), "No Repeated String Literals", "Feature Development Agents", "Opportunistic Code Improvement"
3. File uses LF line endings (no CRLF)
4. Does not contain placeholder text (TBD, TODO)

**TLA+ Coverage:**
- Transition: `CreateSharedConventions`
- State: `sharedConvStatus = "created"`

---

### Step 2: Build dissolution checklist

**Files:**
- `docs/implementation/2026-04-03_dissolution-checklist.md` (create)

**Description:**
Create the mandatory dissolution checklist that maps every CLAUDE.md section to its destination file. This is the `AssignDestination` transition for all 14 sections. The checklist is machine-verifiable: each row maps a section name to a destination file path. The checklist also supports `ReassignDestination` -- entries can be corrected before verification (TLA+ review refinement #3). This step produces the checklist document; verification happens in a later step.

**Dependencies:** None

**Test (write first):**
Write a test that reads the checklist file and asserts:
1. File exists and is non-empty
2. Contains exactly 14 rows (one per CLAUDE.md section)
3. Each row has: section name, destination file path, status field
4. No row has a NULL/empty destination
5. Every destination path matches an expected set of valid destination files
6. The section names match the actual CLAUDE.md sections: Line Endings, ESLint Config, Vitest Coverage Thresholds, CSpell Unknown Words, TDD, DDD, Atomic Design, BDD, Lodash, State Machine Mindset, No Repeated String Literals, Feature Development Agents, Opportunistic Code Improvement, Progressive Mapping

**TLA+ Coverage:**
- Transition: `AssignDestination` (all sections)
- Transition: `ReassignDestination` (structure supports correction before verification)
- State: `checklist[s] != NULL` for all s

---

### Step 3: Split TLA+ evaluation content to expert-tla

**Files:**
- `.claude/skills/agents/expert-tla/SKILL.md` (modify)

**Description:**
Absorb the evaluation-relevant content from the user-scoped `tla-specification` skill into `expert-tla/SKILL.md`. This includes: the "State Machine Mindset" philosophy from CLAUDE.md (enumerate all states, valid transitions, invalid transitions, impossible states), and from the user-scoped skill: the "Why TLA+" section, workflow guidance, and best practices related to state enumeration and property identification. This is the `SplitTlaEval` transition. The expert-tla file already has the evaluation lens; this step enriches it with concrete operational guidance about how to evaluate state spaces. Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1

**Test (write first):**
Write a test that reads `expert-tla/SKILL.md` and asserts:
1. Contains content about enumerating all states before implementation
2. Contains the "impossible states should be unrepresentable" directive
3. Contains a reference to `.claude/skills/shared/conventions.md`
4. Contains content about UI components with loading/error/empty/populated states (from State Machine Mindset)
5. Contains content about async operations creating pending/settled/error states
6. Does NOT contain TLA+ syntax examples, PlusCal constructs, or TLC configuration (those go to tla-writer)
7. File uses LF line endings

**TLA+ Coverage:**
- Transition: `SplitTlaEval`
- State: `tlaSplitStatus = "eval_to_expert"`

---

### Step 4: Complete TLA+ split -- inline syntax/patterns into tla-writer

**Files:**
- `.claude/skills/tla-writer/AGENT.md` (modify)

**Description:**
Inline the syntax, patterns, PlusCal constructs, TLC configuration, temporal operators reference, common patterns (consensus, two-phase commit), and C# integration examples from the user-scoped `tla-specification` skill directly into `tla-writer/AGENT.md`. Replace the external reference at line 50 (`Reference the TLA+ syntax and patterns from .claude/skills/tla-specification/SKILL.md`) with the actual inlined content. This is the `CompleteTlaSplit` transition. Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1, Step 3

**Test (write first):**
Write a test that reads `tla-writer/AGENT.md` and asserts:
1. Does NOT contain a reference to `~/.claude/skills/tla-specification/SKILL.md` or `.claude/skills/tla-specification/SKILL.md`
2. Contains TLA+ syntax section (EXTENDS, CONSTANTS, VARIABLES patterns)
3. Contains PlusCal section with algorithm examples
4. Contains temporal operators reference ([], <>, ~>)
5. Contains TLC configuration section (.cfg file format)
6. Contains common patterns (consensus, two-phase commit)
7. Contains a reference to `.claude/skills/shared/conventions.md`
8. File uses LF line endings

**TLA+ Coverage:**
- Transition: `CompleteTlaSplit`
- State: `tlaSplitStatus = "complete"`
- Transition: `AbsorbSkill("tla-specification")` -- content verified present (TLA+ review refinement #4)

---

### Step 5: Absorb atomic-design-planning into expert-atomic-design

**Files:**
- `.claude/skills/agents/expert-atomic-design/SKILL.md` (modify)

**Description:**
Absorb the user-scoped `atomic-design-planning` skill content into `expert-atomic-design/SKILL.md`. The expert already covers the hierarchy and anti-patterns from an evaluation perspective. Add the decision table ("Does something similar exist? If Yes -> Reuse/extend it"), the component categories with detailed descriptions, and the integration guidance. Drop the Linear workflow integration per design consensus (not actively used). Also absorb the CLAUDE.md "Atomic & Component-Driven Design" section reference. Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1

**Test (write first):**
Write a test that reads `expert-atomic-design/SKILL.md` and asserts:
1. Contains the Reuse-First Principle decision table
2. Contains the component categories: Atoms, Molecules, Organisms, Templates, Pages with descriptions
3. Contains anti-patterns section (creating when reusing works, feature-specific atoms, skipping levels, wrong abstraction level)
4. Does NOT contain Linear workflow integration
5. Contains a reference to `.claude/skills/shared/conventions.md`
6. File uses LF line endings

**TLA+ Coverage:**
- Transition: `AbsorbSkill("atomic-design-planning")` -- content verified present (TLA+ review refinement #4)

---

### Step 6: Absorb ddd-architect into expert-ddd

**Files:**
- `.claude/skills/agents/expert-ddd/SKILL.md` (modify)

**Description:**
Absorb the user-scoped `ddd-architect` skill into `expert-ddd/SKILL.md`. Add a new "Operational Guidance" section containing: the DDD scaffolding directory structure (Domain/Application/Infrastructure layers), the architecture violation detection rules, and the dependency direction validation diagram (Presentation -> Application -> Domain; Infrastructure -> Domain). The CLAUDE.md DDD section adds "Entry points are thin -- they delegate to domain functions" and "Name things after the domain" -- both already captured in expert-ddd's characteristic positions, so no duplication needed. Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1

**Test (write first):**
Write a test that reads `expert-ddd/SKILL.md` and asserts:
1. Contains an "Operational Guidance" section
2. Contains the scaffolding directory structure (Domain/Entities, Domain/ValueObjects, Domain/Aggregates, Application/UseCases, Infrastructure/Persistence)
3. Contains dependency direction validation (Presentation -> Application -> Domain)
4. Contains architecture violation detection rules (Domain must not import Infrastructure)
5. Contains a reference to `.claude/skills/shared/conventions.md`
6. File uses LF line endings

**TLA+ Coverage:**
- Transition: `AbsorbSkill("ddd-architect")` -- content verified present (TLA+ review refinement #4)

---

### Step 7: Split doc-bdd -- evaluation content to expert-bdd

**Files:**
- `.claude/skills/agents/expert-bdd/SKILL.md` (modify)

**Description:**
Absorb the evaluation-relevant content from the user-scoped `doc-bdd` skill into `expert-bdd/SKILL.md`. This includes: the 8 scenario categories (success path, alternative path, error conditions, edge cases, data-driven, integration, quality attributes, failure recovery), the Given/When/Then discipline with examples, the living documentation philosophy, and the Gherkin syntax philosophy. Does NOT include: file naming patterns, section metadata, ADR-ready scoring, validation error codes, or document-production machinery (those stay in the separate project-scoped doc-bdd). Also absorb the CLAUDE.md BDD section content. Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1

**Test (write first):**
Write a test that reads `expert-bdd/SKILL.md` and asserts:
1. Contains all 8 scenario categories: success path (@primary), alternative path (@alternative), error conditions (@negative), edge cases (@edge_case/@boundary), data-driven (@data_driven), integration (@integration), quality attributes (@quality_attribute), failure recovery (@failure_recovery)
2. Contains Given/When/Then structure guidance
3. Contains reference to observable behavior testing (not implementation details)
4. Does NOT contain file naming patterns (BDD-NN.SS format)
5. Does NOT contain ADR-ready scoring
6. Does NOT contain validation error codes (E001, E002, etc.)
7. Contains a reference to `.claude/skills/shared/conventions.md`
8. File uses LF line endings

**TLA+ Coverage:**
- Transition: `SplitDocBddEval`
- State: `docBddSplitStatus = "eval_to_expert"`

---

### Step 8: Complete doc-bdd split -- relocate production content to project scope

**Files:**
- `.claude/skills/doc-bdd/SKILL.md` (create)

**Description:**
Create the project-scoped doc-bdd skill file at `.claude/skills/doc-bdd/SKILL.md`. This file contains the full document-production machinery from the user-scoped `doc-bdd` skill: file structure, naming patterns, section metadata, ADR-ready scoring system, threshold registry integration, validation error codes, creation process, index file template, aggregator files, and all the operational rules for producing BDD suite documents. This is the `CompleteDocBddSplit` transition. The file is a relocation of production content from user scope to project scope, as agreed in the design consensus. Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1, Step 7

**Test (write first):**
Write a test that reads `.claude/skills/doc-bdd/SKILL.md` and asserts:
1. File exists and is non-empty
2. Contains section-based structure rules (directory structure, three valid file patterns)
3. Contains prohibited patterns table
4. Contains ADR-ready scoring system with criteria percentages
5. Contains threshold registry integration (`@threshold:` key format)
6. Contains validation error codes (E001, E002, E041, etc.)
7. Contains creation process steps (Step 1 through Step 13)
8. Contains a reference to `.claude/skills/shared/conventions.md`
9. File uses LF line endings

**TLA+ Coverage:**
- Transition: `CompleteDocBddSplit`
- State: `docBddSplitStatus = "complete"`
- Transition: `AbsorbSkill("doc-bdd")` -- content verified present (TLA+ review refinement #4)

---

### Step 9: Absorb TDD content into expert-tdd and vitest-writer

**Files:**
- `.claude/skills/agents/expert-tdd/SKILL.md` (modify)
- `.claude/skills/vitest-writer/AGENT.md` (modify)

**Description:**
Distribute the CLAUDE.md TDD section to its two destinations per the design consensus. expert-tdd receives the philosophy: "Write the test first. No implementation code without a failing test that demands it." and the red-green-refactor cycle mandate. vitest-writer receives the operational directives: "Use Vitest for all packages in this monorepo" and "Tests live alongside the code they cover." Both files get a reference line to `.claude/skills/shared/conventions.md`. The Vitest coverage threshold rule is already destined for shared conventions (Step 1), not these files.

**Dependencies:** Step 1

**Test (write first):**
Write a test that:
1. Reads `expert-tdd/SKILL.md` and asserts it contains: "Write the test first", red-green-refactor cycle description, and a reference to `.claude/skills/shared/conventions.md`
2. Reads `vitest-writer/AGENT.md` and asserts it contains: "Use Vitest for all packages in this monorepo", "Tests live alongside the code they cover", and a reference to `.claude/skills/shared/conventions.md`
3. Both files use LF line endings

**TLA+ Coverage:**
- Transition: `MigrateSection("TDD")` -- split across two destinations

---

### Step 10: Absorb lodash detailed guidance into expert-lodash

**Files:**
- `.claude/skills/agents/expert-lodash/SKILL.md` (modify)

**Description:**
Add the concrete code examples from CLAUDE.md's "Prefer Lodash" section to expert-lodash as a "Quick Reference" section. This includes the import syntax example (`import groupBy from "lodash/groupBy.js"`), the `lodash/get` array-path form examples, and the rationale for array-path over dot-string notation. The expert-lodash already has the philosophy; this adds the concrete syntax reference. The general "prefer lodash" rule is already in shared conventions (Step 1). Add a reference line to `.claude/skills/shared/conventions.md`.

**Dependencies:** Step 1

**Test (write first):**
Write a test that reads `expert-lodash/SKILL.md` and asserts:
1. Contains a "Quick Reference" section (or equivalent)
2. Contains the import syntax example: `import groupBy from "lodash/groupBy.js"`
3. Contains the `lodash/get` array-path example: `get(object, ["items", 0, "name"])`
4. Contains explanation of why array-path form is preferred over dot-string notation
5. Contains a reference to `.claude/skills/shared/conventions.md`
6. File uses LF line endings

**TLA+ Coverage:**
- Transition: `MigrateSection("Lodash")` -- detailed guidance portion
- Transition: `AbsorbSkill` content verification for lodash examples

---

### Step 11: Add shared conventions references to all remaining agent/expert files

**Files:**
- `.claude/skills/agents/expert-continuous-delivery/SKILL.md` (modify)
- `.claude/skills/agents/expert-edge-cases/SKILL.md` (modify)
- `.claude/skills/agents/expert-performance/SKILL.md` (modify)
- `.claude/skills/hono-writer/AGENT.md` (modify)
- `.claude/skills/typescript-writer/AGENT.md` (modify)
- `.claude/skills/ui-writer/AGENT.md` (modify)
- `.claude/skills/playwright-writer/AGENT.md` (modify)
- `.claude/skills/trainer/AGENT.md` (modify)
- `.claude/skills/implementation-writer/AGENT.md` (modify)
- `.claude/skills/project-manager/AGENT.md` (modify)
- `.claude/skills/progressive-mapper.md` (modify)

**Description:**
Add the reference line `Read shared conventions: .claude/skills/shared/conventions.md` to all agent and expert files that do not already have it from prior steps. This is the `AddConventionsReference` transition for the remaining agents. Prior steps (3-10) already added the reference to expert-tla, tla-writer, expert-atomic-design, expert-ddd, expert-bdd, doc-bdd, expert-tdd, vitest-writer, and expert-lodash. This step covers the remaining 11 files. After this step, `referencingAgents = AgentFiles` -- every agent references shared conventions.

**Dependencies:** Step 1

**Test (write first):**
Write a test that reads each of the 11 files listed above and asserts:
1. Each file contains the string `.claude/skills/shared/conventions.md`
2. Each file uses LF line endings
3. The reference appears near the top of the file (within the first 20 lines)

**TLA+ Coverage:**
- Transition: `AddConventionsReference(agent)` for all remaining agents
- State: `referencingAgents = AgentFiles` (all agents now reference shared conventions)
- Invariant: `ReferenceIntegrity` (S3) -- prerequisite for deletion

---

### Step 12: Migrate all CLAUDE.md sections and verify checklist

**Files:**
- `docs/implementation/2026-04-03_dissolution-checklist.md` (modify -- mark all rows as migrated)

**Description:**
Verify that every CLAUDE.md section has been migrated to its destination by prior steps. Update the dissolution checklist to mark all 14 sections as "migrated". This is the `VerifyChecklist` transition followed by confirming all `MigrateSection` transitions are complete. The verification checks that content actually exists at each destination (TLA+ review refinement #4 and #5 -- verify destination exists and content is placed).

Section-to-step mapping:
- Line Endings -> Step 1 (shared conventions)
- ESLint Config -> Step 1 (shared conventions)
- Vitest Coverage Thresholds -> Step 1 (shared conventions)
- CSpell Unknown Words -> Step 1 (shared conventions)
- TDD -> Step 9 (expert-tdd + vitest-writer)
- DDD -> Step 6 (expert-ddd)
- Atomic Design -> Step 5 (expert-atomic-design)
- BDD -> Step 7 (expert-bdd)
- Lodash -> Step 1 (shared conventions) + Step 10 (expert-lodash)
- State Machine Mindset -> Step 3 (expert-tla)
- No Repeated String Literals -> Step 1 (shared conventions)
- Feature Development Agents -> Step 1 (shared conventions)
- Opportunistic Code Improvement -> Step 1 (shared conventions)
- Progressive Mapping -> already in progressive-mapper.md (verify only)

**Dependencies:** Step 1, Step 2, Step 3, Step 5, Step 6, Step 7, Step 9, Step 10

**Test (write first):**
Write a test that:
1. Reads the dissolution checklist and asserts all 14 rows have status "migrated"
2. For each row, reads the destination file and asserts the destination file exists and is non-empty
3. Verifies the progressive-mapper.md already contains the Progressive Mapping content
4. Asserts `checklistVerified = TRUE` equivalent: no row has an empty destination or unmigrated status

**TLA+ Coverage:**
- Transition: `VerifyChecklist`
- Transition: `MigrateSection(s)` for all sections
- Invariant: `MigrationRequiresChecklist` (S6)
- Invariant: `SharedConvExistsBeforeMigration` (S7)
- Invariant: `NoContentLoss` (S1) -- all sections verified migrated
- Invariant: `DissolutionChecklistGate` (S2) -- checklist verified with all destinations
- Liveness: `EventuallyAllMigrated` (L1)

---

### Step 13: Delete CLAUDE.md

**Files:**
- `CLAUDE.md` (delete)

**Description:**
Delete the project root CLAUDE.md. This is the `DeleteClaudeMd` transition. All preconditions must be verified:
1. `checklistVerified = TRUE` (Step 12)
2. All sections migrated (Step 12)
3. `sharedConvStatus = "created"` (Step 1)
4. `referencingAgents = AgentFiles` (Steps 3-11)
5. `docBddSplitStatus = "complete"` (Step 8)
6. `tlaSplitStatus = "complete"` (Step 4)
7. All user-scoped skills absorbed (Steps 4-8)

This is the critical dissolution action. It is irreversible once committed.

**Dependencies:** Step 4, Step 8, Step 11, Step 12

**Test (write first):**
Write a test that asserts:
1. `CLAUDE.md` does not exist at the project root
2. `.claude/skills/shared/conventions.md` exists and contains all global rules
3. All expert/agent files contain the shared conventions reference
4. All 4 user-scoped skills' content is present in their project-scoped destinations (spot-check key phrases)
5. Both content splits are complete (expert-tla has evaluation content, tla-writer has syntax; expert-bdd has evaluation content, doc-bdd has production content)

**TLA+ Coverage:**
- Transition: `DeleteClaudeMd`
- State: `claudeMdDeleted = TRUE`
- Invariant: `NoContentLoss` (S1) -- post-deletion verification
- Invariant: `DissolutionChecklistGate` (S2)
- Invariant: `ReferenceIntegrity` (S3)
- Invariant: `SplitsCompleteBeforeDeletion` (S4)
- Invariant: `SkillsAbsorbedBeforeDeletion` (S5)
- Liveness: `EventuallyDissolved` (L2)
- Liveness: `EventuallyAllAbsorbed` (L5)

---

### Step 14: Update CI for merge queues

**Files:**
- `.github/workflows/ci.yml` (modify)

**Description:**
Add `merge_group` trigger to the CI workflow alongside the existing `pull_request` trigger. This is the `UpdateMergeQueueCI` transition. No job changes are needed -- the same lint, test, build, codeql, and sonar jobs run for merge queue events. The `merge_group` trigger tells GitHub Actions to run the workflow when GitHub's merge queue tests a merge commit. This work stream is independent of the dissolution workflow per design consensus.

**Dependencies:** None

**Test (write first):**
Write a test that reads `.github/workflows/ci.yml` and asserts:
1. The `on:` section contains both `pull_request:` and `merge_group:` triggers
2. The `pull_request:` trigger still has `branches: [master]`
3. The file is valid YAML (parses without error)
4. File uses LF line endings

**TLA+ Coverage:**
- Transition: `UpdateMergeQueueCI`
- State: `mergeQueueStatus = "updated"`
- Liveness: `EventuallyMergeQueue` (L3)

---

## State Coverage Audit

### States -- all covered

| State | Covered By |
|-------|-----------|
| `sectionStatus = "unmigrated"` | Steps 1-11 (initial state) |
| `sectionStatus = "migrated"` | Step 12 |
| `skillStatus = "pending"` | Steps 3-8 (initial state) |
| `skillStatus = "absorbed"` | Steps 4, 5, 6, 8 |
| `checklist = NULL` | Step 2 (initial state) |
| `checklist = destination` | Step 2 |
| `checklistVerified = FALSE` | Steps 1-11 (initial state) |
| `checklistVerified = TRUE` | Step 12 |
| `claudeMdDeleted = FALSE` | Steps 1-12 (initial state) |
| `claudeMdDeleted = TRUE` | Step 13 |
| `sharedConvStatus = "not_created"` | (initial state, pre-Step 1) |
| `sharedConvStatus = "created"` | Step 1 |
| `referencingAgents = {}` | (initial state, pre-Step 3) |
| `referencingAgents = AgentFiles` | Step 11 (after all references added) |
| `mergeQueueStatus = "not_updated"` | (initial state, pre-Step 14) |
| `mergeQueueStatus = "updated"` | Step 14 |
| `docBddSplitStatus = "unsplit"` | (initial state, pre-Step 7) |
| `docBddSplitStatus = "eval_to_expert"` | Step 7 |
| `docBddSplitStatus = "complete"` | Step 8 |
| `tlaSplitStatus = "unsplit"` | (initial state, pre-Step 3) |
| `tlaSplitStatus = "eval_to_expert"` | Step 3 |
| `tlaSplitStatus = "complete"` | Step 4 |

### Transitions -- all covered

| Transition | Covered By |
|-----------|-----------|
| `AssignDestination` | Step 2 |
| `ReassignDestination` | Step 2 (structure supports correction) |
| `VerifyChecklist` | Step 12 |
| `CreateSharedConventions` | Step 1 |
| `AddConventionsReference` | Steps 3-11 |
| `MigrateSection` | Steps 1, 3, 5, 6, 7, 9, 10, 12 |
| `AbsorbSkill` | Steps 4, 5, 6, 8 |
| `SplitDocBddEval` | Step 7 |
| `CompleteDocBddSplit` | Step 8 |
| `SplitTlaEval` | Step 3 |
| `CompleteTlaSplit` | Step 4 |
| `DeleteClaudeMd` | Step 13 |
| `UpdateMergeQueueCI` | Step 14 |
| `Done` | Step 13 + Step 14 combined |

### Safety Invariants -- all verified

| Invariant | Verified By |
|-----------|------------|
| `TypeOK` | All steps (structural) |
| `NoContentLoss` (S1) | Step 12 test (all sections migrated), Step 13 test (post-deletion spot-check) |
| `DissolutionChecklistGate` (S2) | Step 12 test (checklist verified), Step 13 preconditions |
| `ReferenceIntegrity` (S3) | Step 11 test (all agents reference conventions), Step 13 test |
| `SplitsCompleteBeforeDeletion` (S4) | Step 13 preconditions (depends on Steps 4, 8) |
| `SkillsAbsorbedBeforeDeletion` (S5) | Step 13 preconditions (depends on Steps 4-8) |
| `MigrationRequiresChecklist` (S6) | Step 12 (checklist verified before migration confirmation) |
| `SharedConvExistsBeforeMigration` (S7) | Step 1 precedes all migration steps |

### Liveness Properties -- all verified

| Property | Verified By |
|----------|------------|
| `EventuallyAllMigrated` (L1) | Step 12 test |
| `EventuallyDissolved` (L2) | Step 13 test |
| `EventuallyMergeQueue` (L3) | Step 14 test |
| `EventuallySplitsComplete` (L4) | Steps 4, 8 tests |
| `EventuallyAllAbsorbed` (L5) | Steps 4, 5, 6, 8 tests |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation and Independent Work Streams (no dependencies between tasks)

These tasks have no inter-dependencies and touch distinct files. They can execute in parallel safely.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Create shared conventions file |
| T2 | Step 2 | Build dissolution checklist |
| T14 | Step 14 | Update CI for merge queues |

### Tier 2: Skill Absorption and Content Splits (depends on Tier 1 -- shared conventions must exist)

All tasks in this tier depend on Step 1 (shared conventions file exists) and touch distinct files. They can execute in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Split TLA+ evaluation content to expert-tla |
| T5 | Step 5 | Absorb atomic-design-planning into expert-atomic-design |
| T6 | Step 6 | Absorb ddd-architect into expert-ddd |
| T7 | Step 7 | Split doc-bdd evaluation content to expert-bdd |
| T9 | Step 9 | Absorb TDD content into expert-tdd and vitest-writer |
| T10 | Step 10 | Absorb lodash detailed guidance into expert-lodash |
| T11 | Step 11 | Add shared conventions references to remaining agent/expert files |

### Tier 3: Complete Content Splits (depends on Tier 2 -- eval splits must be done first)

These tasks depend on the eval-to-expert phase completing before the production-to-project phase. They touch distinct files and can execute in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | Complete TLA+ split -- inline syntax/patterns into tla-writer |
| T8 | Step 8 | Complete doc-bdd split -- relocate production content to project scope |

### Tier 4: Verification Gate (depends on Tiers 1-3 -- all migrations must be complete)

This is the verification step. It depends on all prior tiers. Single task, cannot be parallelized.

| Task ID | Step | Title |
|---------|------|-------|
| T12 | Step 12 | Migrate all CLAUDE.md sections and verify checklist |

### Tier 5: Dissolution (depends on Tier 4 -- verification must pass)

The terminal action. Depends on all prior steps. Single task.

| Task ID | Step | Title |
|---------|------|-------|
| T13 | Step 13 | Delete CLAUDE.md |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Create shared conventions file | 1 | trainer-writer | vitest-writer | None | Shared conventions is a Claude Code artifact (.md in .claude/); vitest validates structure. |
| T2 | Build dissolution checklist | 1 | trainer-writer | vitest-writer | None | Checklist is a documentation artifact; vitest validates row completeness and mapping. |
| T14 | Update CI for merge queues | 1 | typescript-writer | vitest-writer | None | CI YAML is infrastructure; typescript-writer handles non-Hono config files; vitest validates YAML structure. |
| T3 | Split TLA+ eval to expert-tla | 2 | trainer-writer | vitest-writer | T1 | Expert SKILL.md is a Claude Code artifact; vitest validates content presence. |
| T5 | Absorb atomic-design into expert | 2 | trainer-writer | vitest-writer | T1 | Expert SKILL.md is a Claude Code artifact; vitest validates content presence. |
| T6 | Absorb ddd-architect into expert | 2 | trainer-writer | vitest-writer | T1 | Expert SKILL.md is a Claude Code artifact; vitest validates content presence. |
| T7 | Split doc-bdd eval to expert-bdd | 2 | trainer-writer | vitest-writer | T1 | Expert SKILL.md is a Claude Code artifact; vitest validates content presence and absence of production content. |
| T9 | Absorb TDD into expert-tdd + vitest-writer | 2 | trainer-writer | vitest-writer | T1 | Both targets are Claude Code artifacts; vitest validates content distribution. |
| T10 | Absorb lodash guidance into expert | 2 | trainer-writer | vitest-writer | T1 | Expert SKILL.md is a Claude Code artifact; vitest validates code examples present. |
| T11 | Add conventions refs to remaining files | 2 | trainer-writer | vitest-writer | T1 | All targets are Claude Code artifacts; vitest validates reference line in all 11 files. |
| T4 | Complete TLA+ split to tla-writer | 3 | trainer-writer | vitest-writer | T1, T3 | AGENT.md is a Claude Code artifact; vitest validates inlined content and removed external reference. |
| T8 | Complete doc-bdd split to project scope | 3 | trainer-writer | vitest-writer | T1, T7 | New SKILL.md is a Claude Code artifact; vitest validates production machinery present. |
| T12 | Verify checklist and confirm migration | 4 | trainer-writer | vitest-writer | T1-T11 | Checklist verification is a documentation task; vitest validates all rows migrated and destinations exist. |
| T13 | Delete CLAUDE.md | 5 | trainer-writer | vitest-writer | T4, T8, T11, T12 | File deletion with post-condition verification; vitest validates absence and content presence elsewhere. |
