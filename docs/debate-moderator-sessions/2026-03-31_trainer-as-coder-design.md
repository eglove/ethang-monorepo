# Debate Session -- Trainer as Code Writer with Agent Contracts

**Date:** 2026-03-31
**Topic:** Trainer-writer as a code writer option in the implementation-writer, with Zod-based contract validation in `packages/agent-contracts/`
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery
**Rounds:** 2
**Result:** CONSENSUS REACHED

---

## Round 1

### expert-tdd

Position: Strong support for the proposal. The Zod contract validation pattern is a natural fit for TDD of agent artifacts, and integrating trainer-writer into the standard Stage 6 ping-pong cycle ensures agent artifacts get the same test-first discipline as application code.

Reasoning:
The core question is: how do you TDD agent artifacts (SKILL.md, AGENT.md, hook scripts)? These are not executable TypeScript -- they are structured Markdown and shell scripts. Traditional unit tests cannot import and exercise them. The Zod contract approach solves this cleanly: define a schema that describes the required output shape (frontmatter fields, required sections, handoff contracts), parse the artifact through the schema, and assert the parse succeeds. This is a real failing test -- write the schema first, watch `z.parse()` throw on missing fields, then write the artifact to satisfy it. The red-green-refactor cycle works naturally.

The in-memory fixture approach is correct. Contract tests should not read from the filesystem -- they should validate a string or object against a schema. This keeps tests fast (sub-millisecond parse calls) and deterministic. The vitest-writer handles contract tests, which means no new test writer type is needed -- this respects the existing 3x2 pairing matrix.

One concern: the briefing says "trainer-writer output contract (Zod schema) as the first contract" with other agent handoff contracts as future work. This is fine as a starting point, but the schema must be designed to be composable from day one. If the first schema is a monolithic object, extending it to cover questioner-to-debate or debate-to-tla handoffs later will require a breaking refactor.

Objections:
- The Zod schema for trainer-writer output must be designed as composable building blocks (e.g., a `FrontmatterSchema`, a `SectionSchema`, a `HandoffContractSchema`) rather than a single flat object. If the first schema is monolithic, every future contract will duplicate structure instead of reusing it.

Endorsements:
None (first round)

---

### expert-ddd

Position: Strong support. The proposal correctly identifies agent boundaries as bounded context boundaries. The `packages/agent-contracts/` package is an Anti-Corruption Layer (ACL) between agent contexts, and removing the trainer from the questioner's dispatch targets enforces proper context separation.

Reasoning:
In DDD terms, each agent (questioner, debate-moderator, tla-writer, implementation-writer, trainer) is a bounded context with its own internal model and language. The questioner speaks in "briefings" and "decision trees." The trainer speaks in "artifacts," "templates," and "phases." The implementation-writer speaks in "steps," "tiers," and "task assignments." When contexts communicate, they need an explicit contract at the boundary -- not implicit coupling through shared internal types.

Today, the questioner dispatches the trainer directly, which means the questioner must understand the trainer's input shape. This is context leakage. By routing the trainer through the implementation-writer's task assignment table instead, the boundary becomes: implementation-writer produces a task assignment (a well-defined shape), and the trainer-writer consumes it. The contract between them is explicit and testable via the Zod schema.

The name `trainer-writer` is appropriate -- it uses the ubiquitous language of the pipeline ("writer" is how Stage 6 refers to code-producing agents) while retaining the domain identity ("trainer" is what the agent actually is). This avoids generic naming like "artifact-writer" or "meta-writer."

The `packages/agent-contracts/` package placement is correct for a monorepo: contracts are shared infrastructure that multiple agents depend on, not owned by any single agent's bounded context.

Objections:
- The briefing says the trainer AGENT.md must be modified to "accept implementation step input shape (not just questioner briefing)." This is an input shape change at a bounded context boundary. The contract package should define both the trainer-writer's input contract (what the implementation-writer sends) and its output contract (what the trainer-writer produces). Defining only the output contract leaves the input boundary implicit.

Endorsements:
None (first round)

---

### expert-edge-cases

Position: Support with caveats. The proposal handles the main flow well, but several edge cases in the transition from the current direct-dispatch model to the new pipeline-only model need explicit handling.

Edge Cases Found:
- [Sequence] Standalone questioner sessions that previously dispatched to trainer directly will break. If a user runs `/questioner` (not `/design-pipeline`) and describes a new skill, the questioner currently scans `.claude/skills/` and proposes the trainer as a dispatch target. After this change, the trainer is no longer a valid dispatch target from the questioner. What happens? The briefing says "remove trainer from questioner's dispatch target scanning" -- but what replaces it? Does the user get told "no matching target found"?
- [Boundary] Mixed pipeline runs where a single feature requires both application code and agent artifacts. The briefing acknowledges this case and says "the tier system handles this naturally." But what if a trainer-writer task depends on a typescript-writer task in the same tier? The implementation-writer assigns them to the same tier because it sees no explicit dependency, but the agent artifact references a type defined by the application code. This is a hidden cross-task dependency.
- [Partial failure] Contract schema validation fails on a well-formed but semantically wrong artifact. The Zod schema can validate structure (required fields, correct types) but not semantics (does this handoff contract actually match the downstream agent's expectations?). A trainer-writer could produce a SKILL.md that passes the Zod schema but has an incorrect trigger condition. The contract test passes, but the artifact is wrong.
- [Type boundary] Empty or missing frontmatter in trainer-writer output. If the trainer produces an artifact with no YAML frontmatter block, the Zod parse should fail with a clear error -- not a cryptic YAML parse exception. The contract test needs an explicit negative case for malformed frontmatter.

Reasoning:
The most serious edge case is the standalone questioner regression. The current system has two paths to the trainer: direct dispatch from questioner (standalone) and the new pipeline path (via implementation-writer). Removing the direct path means standalone questioner sessions that describe agent artifacts have no dispatch target. The briefing's scope says "Remove trainer from questioner's dispatch target scanning" -- this needs a migration plan or the questioner needs a new behavior for this case (e.g., "To create agent artifacts, use /design-pipeline instead").

The mixed pipeline case is less severe because the tier system's dependency tracking should catch it -- but only if the implementation-writer recognizes cross-type dependencies. If the implementation-writer does not know that a SKILL.md references a TypeScript type, it will not create the dependency edge.

Objections:
- Standalone `/questioner` sessions that describe agent artifacts will have no dispatch target after the trainer is removed from questioner scanning. The briefing does not specify what happens in this case. This is a regression in standalone questioner functionality.
- The Zod contract validates structure but not semantics. A structurally valid but semantically wrong artifact (e.g., incorrect trigger, wrong handoff target) will pass contract tests. The testing strategy needs at least one semantic validation beyond structural parsing.

Endorsements:
None (first round)

---

### expert-continuous-delivery

Position: Support. The proposal is independently deployable, adds a new package without breaking existing ones, and contract tests integrate into the existing vitest pipeline with zero CI changes.

Reasoning:
From a deployment perspective, this change is well-structured. The `packages/agent-contracts/` package is a new addition -- it does not modify any existing package. The trainer AGENT.md modification is a non-breaking change (expanding what inputs the trainer accepts, not removing old ones). The implementation-writer AGENT.md modification adds a fourth code writer option without removing the existing three. The questioner SKILL.md modification removes a dispatch target, which is the only potentially breaking change.

The contract tests run as part of the standard vitest suite. No new CI step, no new test runner, no new pipeline stage. This is ideal -- the feedback loop stays fast. A Zod schema parse is nanoseconds; even hundreds of contract tests add negligible CI time.

The new `packages/agent-contracts/` package needs standard monorepo setup: `package.json`, `tsconfig.json`, `vitest.config.ts`, ESLint config extension. These are mechanical and well-understood in this monorepo. The package should be workspace-internal (not published to npm) since these contracts are only consumed by agents within the monorepo.

One concern: the rollback story. If the trainer-writer produces bad artifacts in a pipeline run, the rollback is the same as any other code writer failure -- the session enters SESSION_FAILED, gets re-dispatched, and the worktree is cleaned. This is handled by existing Stage 6 machinery. However, removing the trainer from questioner dispatch is a one-way door for standalone sessions. If the change ships and users find they need standalone questioner-to-trainer dispatch, adding it back requires reverting the questioner change.

Objections:
- The `packages/agent-contracts/` package must be workspace-internal only (not published to npm). The briefing does not specify this, but publishing agent contracts externally would create an unnecessary public API surface.

Endorsements:
None (first round)

---

## Round 1 Analysis

New objections raised:
1. **expert-tdd:** Zod schemas must be composable building blocks, not monolithic
2. **expert-ddd:** Input contract for trainer-writer must also be defined, not just output
3. **expert-edge-cases:** Standalone questioner regression -- no dispatch target for agent artifact creation
4. **expert-edge-cases:** Structural validation is insufficient -- need semantic validation
5. **expert-continuous-delivery:** Package must be workspace-internal only

Proceeding to Round 2 since there are new objections.

---

## Round 2

### expert-tdd

Position: Maintain support. The objections from Round 1 are valid and complementary -- none conflict with TDD principles. They refine the design without changing its direction.

Reasoning:
expert-ddd's point about defining the input contract is well taken. In TDD terms, the input contract is the "arrange" step of every trainer-writer test: you construct a valid implementation step input, pass it to the trainer-writer, and assert the output matches the output contract. Without a Zod schema for the input shape, the test setup is ad-hoc -- each test constructs the input differently, and there is no single source of truth for what a valid input looks like. Defining both input and output schemas means the test is: `InputSchema.parse(fixture) -> trainer-writer -> OutputSchema.parse(result)`. Clean, auditable, composable.

expert-edge-cases' standalone questioner regression is a real issue, but it is a scope decision, not a TDD concern. The briefing explicitly scopes the trainer to be reachable only through the implementation-writer. If the user needs standalone agent artifact creation, that is a separate feature. The questioner should surface a clear message: "Agent artifact creation requires /design-pipeline" -- not a silent "no match found."

The semantic validation concern is valid but bounded. Zod schemas validate shape. Semantic correctness (does this trigger actually match?) is the domain of integration tests or manual review. The contract package should not try to solve both -- it validates structure. The Stage 6 local review checklist (point 4: "TLA+ states/transitions assigned to this task are covered") provides the semantic check.

Objections:
None new. Prior objection (composable schemas) stands.

Endorsements:
- expert-ddd: Defining the input contract alongside the output contract is correct. This makes the test boundary explicit at both ends.
- expert-edge-cases: The standalone questioner regression is real. The questioner should emit a clear message directing users to /design-pipeline for agent artifacts, rather than silently having no match.
- expert-continuous-delivery: Workspace-internal only is correct. These contracts are internal coordination, not a public API.

---

### expert-ddd

Position: Maintain support. Round 1 objections from other experts align with DDD principles. The design direction is sound.

Reasoning:
expert-tdd's composability point maps directly to DDD's building-block pattern. In DDD, Value Objects are the composable primitives that Entities and Aggregates are built from. The Zod schemas should follow the same pattern: a `FrontmatterSchema` is a Value Object schema, a `SkillOutputSchema` is an Aggregate schema composed of Value Object schemas. This is not just a testing convenience -- it is domain modeling of what an agent artifact actually is.

expert-edge-cases' standalone questioner regression is a bounded context boundary question. Today the questioner has knowledge of the trainer's existence (it scans for dispatch targets). Removing that knowledge is correct from a context separation standpoint -- the questioner should not know about agent internals. The proper fix is not to keep the leaky boundary but to provide a clear user-facing path: `/design-pipeline` is the entry point for agent artifacts. The questioner's decision guide table should gain a row: "User describes an agent artifact -> Recommend /design-pipeline."

The semantic validation concern is outside the contract package's bounded context. The contract package validates data shapes at boundaries. Semantic correctness is the responsibility of the producing agent (trainer-writer) and the consuming pipeline stage (local review). Pushing semantic validation into the contract package would violate the Single Responsibility principle and make the package a God Object that knows about every agent's internal logic.

Objections:
None new. Prior objection (define input contract too) stands.

Endorsements:
- expert-tdd: Composable schemas as building blocks is the right architecture. This matches DDD's Value Object composition pattern.
- expert-edge-cases: Standalone questioner regression is real. Fix is a decision guide row, not keeping the leaky dispatch path.
- expert-continuous-delivery: Workspace-internal only -- correct. Contracts are internal bounded context boundaries, not external APIs.

---

### expert-edge-cases

Position: Maintain support with caveats addressed. The responses to my Round 1 objections are satisfactory for the standalone regression (clear user message) and semantic validation (deferred to local review).

Reasoning:
expert-tdd and expert-ddd both agreed the standalone questioner regression is real and proposed the same fix: the questioner's decision guide gains a row directing agent artifact requests to `/design-pipeline`. This is sufficient -- the user gets a clear path forward rather than a dead end. The fix is small (one row in a table in questioner SKILL.md) and should be included in the implementation scope.

On semantic validation: expert-tdd points out that Stage 6's local review checklist already covers semantic correctness (TLA+ coverage check, mutual cross-review). expert-ddd correctly argues that pushing semantics into the contract package would overload its responsibility. I accept this -- structural contracts plus the existing review machinery are adequate. The contract package stays structural.

The mixed pipeline edge case (agent artifact depending on application code in the same tier) was not explicitly addressed by other experts, but it is handled by the implementation-writer's existing dependency analysis. If the implementation-writer fails to detect a cross-type dependency, the inter-tier verification catches it (tests fail because the type does not exist yet). This is defense in depth -- not ideal, but acceptable.

Objections:
None new. Prior objections resolved by Round 2 responses.

Endorsements:
- expert-tdd: Correct that semantic validation is bounded by the local review checklist, not the contract package.
- expert-ddd: Correct that the questioner decision guide row is the right fix for standalone regression.
- expert-continuous-delivery: Workspace-internal is the right default.

---

### expert-continuous-delivery

Position: Maintain support. All Round 1 concerns are addressed or accepted.

Reasoning:
The emerging consensus is clean: composable Zod schemas for both input and output contracts, workspace-internal package, questioner decision guide update for standalone sessions. From a CD perspective, the implementation order matters:

1. Create `packages/agent-contracts/` with Zod schemas (no downstream breakage -- new package)
2. Modify implementation-writer AGENT.md to add trainer-writer as fourth code writer (additive change)
3. Modify trainer AGENT.md to accept implementation step input shape (additive change)
4. Modify questioner SKILL.md to remove trainer dispatch + add decision guide row (breaking change for standalone, but with clear user path)

Steps 1-3 are independently deployable and non-breaking. Step 4 is the only change that removes functionality, and it is paired with a mitigation (the decision guide row). This ordering minimizes risk.

The feedback loop stays fast: Zod parse tests run in vitest alongside existing tests. No new CI configuration. The `packages/agent-contracts/` package inherits the monorepo's ESLint and TypeScript configs. Coverage thresholds will be set by `autoUpdate: true` in the vitest config.

Objections:
None new. Prior objection (workspace-internal) stands as a recommendation.

Endorsements:
- expert-tdd: Composable schemas and dual (input + output) contracts are the right architecture.
- expert-ddd: Decision guide row in questioner is the clean fix for the standalone regression.
- expert-edge-cases: Accepting that structural validation plus existing review machinery is sufficient for semantic correctness.

---

## Round 2 Analysis

New objections raised: **None.** All experts reiterated prior positions or endorsed other experts' points. No novel objections were introduced in Round 2.

**Consensus reached after Round 2.**

---

## Debate Synthesis -- trainer-as-coder-design

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-edge-cases, expert-continuous-delivery

---

### Agreed Recommendation

The proposal to add `trainer-writer` as a fourth code writer in the implementation-writer's Stage 6 task assignment table is sound and should proceed with the following refinements:

1. **Composable Zod schemas:** The `packages/agent-contracts/` package must define schemas as composable building blocks (e.g., `FrontmatterSchema`, `SectionSchema`, `HandoffContractSchema`) that larger artifact schemas are composed from -- not monolithic per-artifact schemas. This enables reuse when future agent contracts are added.

2. **Dual contracts (input + output):** Define both the trainer-writer's input contract (what the implementation-writer sends as a task assignment) and its output contract (what the trainer-writer produces). This makes the boundary explicit at both ends and enables clean test setup.

3. **Workspace-internal package:** `packages/agent-contracts/` must be workspace-internal only (not published to npm). These contracts are internal coordination between agents, not a public API.

4. **Questioner decision guide update:** Add a row to the questioner's decision guide table: when a user describes an agent artifact in a standalone `/questioner` session, recommend `/design-pipeline` as the entry point. This prevents a dead-end where the questioner has no dispatch target for agent artifacts after the trainer is removed from its scanning.

5. **Implementation order:** (a) Create `packages/agent-contracts/` with composable Zod schemas, (b) modify implementation-writer to add trainer-writer as fourth code writer, (c) modify trainer to accept implementation step input shape, (d) modify questioner to remove trainer dispatch and add decision guide row. Steps a-c are additive and non-breaking; step d is the only removal.

6. **Structural validation only:** The contract package validates data shapes (structure, required fields, types). Semantic correctness (does this trigger match? does this handoff target exist?) is the responsibility of the producing agent and the Stage 6 local review checklist. Do not overload the contract package with semantic logic.

---

### Expert Final Positions

**expert-tdd**
Position: Strong support. Zod contracts enable genuine TDD of agent artifacts via red-green-refactor on schema parse calls.
Key reasoning: The contract approach turns agent artifact creation into a testable discipline. Write the schema first (the failing test), then write the artifact to satisfy it. In-memory fixtures keep tests fast. Composable schemas and dual input/output contracts make the test boundary explicit. Semantic correctness is handled by the existing local review checklist, not the contract package.
Endorsed: expert-ddd (input contract definition), expert-edge-cases (standalone questioner regression is real), expert-continuous-delivery (workspace-internal only)

**expert-ddd**
Position: Strong support. Agent boundaries are bounded context boundaries; Zod contracts are the Anti-Corruption Layer.
Key reasoning: Each agent is a bounded context. The contract package sits at the boundary, validating data shapes as they cross from one context to another. Composable schemas mirror DDD's Value Object composition. Removing the trainer from questioner dispatch enforces proper context separation. The questioner decision guide row is the clean fix for the standalone regression.
Endorsed: expert-tdd (composable building blocks), expert-edge-cases (decision guide row fix), expert-continuous-delivery (workspace-internal)

**expert-edge-cases**
Position: Support with all caveats resolved. The standalone questioner regression is real but mitigated by the decision guide row. Structural validation plus existing review machinery covers semantic concerns.
Key reasoning: The most serious edge case (standalone questioner dead-end) is handled by adding a decision guide row. The mixed pipeline case (cross-type dependencies in the same tier) is caught by inter-tier verification as defense in depth. Semantic validation is the producing agent's responsibility, not the contract package's.
Endorsed: expert-tdd (semantic validation bounded by local review), expert-ddd (decision guide row as the right fix), expert-continuous-delivery (workspace-internal default)

**expert-continuous-delivery**
Position: Strong support. Independently deployable, zero CI changes, fast feedback loop.
Key reasoning: The change decomposes into four steps with a clear ordering that minimizes risk. Steps 1-3 are additive and non-breaking. Step 4 (questioner modification) is the only removal, paired with a mitigation. The contract package inherits monorepo tooling. Zod parse tests add negligible CI time. Coverage thresholds managed by autoUpdate.
Endorsed: expert-tdd (composable and dual contracts), expert-ddd (decision guide row), expert-edge-cases (structural validation is sufficient)

---

### Endorsement Map

| Expert | Endorsed Points From |
|--------|---------------------|
| expert-tdd | expert-ddd (input contract), expert-edge-cases (standalone regression), expert-continuous-delivery (workspace-internal) |
| expert-ddd | expert-tdd (composable schemas), expert-edge-cases (decision guide row), expert-continuous-delivery (workspace-internal) |
| expert-edge-cases | expert-tdd (semantic bounded by review), expert-ddd (decision guide fix), expert-continuous-delivery (workspace-internal) |
| expert-continuous-delivery | expert-tdd (composable + dual contracts), expert-ddd (decision guide row), expert-edge-cases (structural validation sufficient) |

All experts endorsed all other experts' key points. Full cross-endorsement achieved.

---

**Session saved to:** docs/debate-moderator-sessions/2026-03-31_trainer-as-coder-design.md
