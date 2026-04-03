# Debate Session — Skill Consolidation, CLAUDE.md Dissolution, and Merge Queue CI Setup

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-bdd, expert-atomic-design, expert-tla, expert-continuous-delivery, expert-lodash, expert-edge-cases

---

## Agreed Recommendation

The proposed three work streams are sound and should proceed as designed, with the following refinements:

1. **Shared conventions file must be explicitly referenced.** Create `.claude/skills/shared/conventions.md` with all global rules. Every agent and expert SKILL.md/AGENT.md that currently relies on CLAUDE.md auto-loading must add a line at the top: `Read shared conventions: .claude/skills/shared/conventions.md`. Without this, agents lose access to LF enforcement, ESLint constraints, Vitest threshold rules, lodash preferences, and the no-repeated-strings rule.

2. **TLA+ split is correct as proposed.** Evaluation perspective (state enumeration, safety/liveness analysis, characteristic tensions with other experts) stays in `expert-tla/SKILL.md`. Syntax, patterns, PlusCal, TLC configuration, and the integration-with-C# examples move to `tla-writer/AGENT.md`. The `tla-writer` already references the user-scoped skill at line 51 (`Reference the TLA+ syntax and patterns from .claude/skills/tla-specification/SKILL.md`); after consolidation this reference updates to its own inlined content.

3. **Dissolution checklist is mandatory before CLAUDE.md deletion.** Create a machine-verifiable checklist mapping every CLAUDE.md section to its destination file and the specific line range where the content now lives. Run the checklist as the final step before deleting CLAUDE.md. This prevents the primary risk: a rule silently lost during dissolution.

4. **The `merge_group` trigger addition is trivial and low-risk.** Add it alongside the existing `pull_request` trigger. No job changes needed. The user handles GitHub repo settings separately.

5. **Progressive Mapping section already has a home** (`progressive-mapper.md`). No action needed beyond removing it from CLAUDE.md.

6. **Feature Development Agents section** should go into shared conventions (the general principle of using feature-dev agents) rather than being distributed to individual writer agents, since it applies to all agents equally.

---

## Expert Final Positions

**expert-tdd**
Position: Approve the distribution plan. The TDD section from CLAUDE.md contains the red-green-refactor cycle mandate and the "write the test first" rule. These must land in both `expert-tdd/SKILL.md` (the evaluative perspective) and `vitest-writer/AGENT.md` (the operational instructions). The CLAUDE.md TDD section adds the specific Vitest tooling choice and the "tests live alongside the code" convention, which expert-tdd's SKILL.md currently states implicitly but not explicitly. The Vitest coverage threshold rule ("never lower without permission") is a global convention, not a TDD-specific rule -- shared conventions is the correct home.
Key reasoning: The expert-tdd SKILL.md already captures the philosophy. What's missing is the operational directive: "Use Vitest for all packages in this monorepo" and "Tests live alongside the code they cover." These are concrete instructions that vitest-writer needs. The split between expert-tdd (evaluation) and vitest-writer (execution) mirrors the TLA+ split and is consistent.
Endorsed: expert-tla (TLA+ split pattern is correct and should be the template for TDD split), expert-edge-cases (dissolution checklist is critical)

**expert-ddd**
Position: Approve. The user-scoped `ddd-architect` skill contains a Chinese-language DDD scaffolding guide with directory structure examples, architecture violation checks, and dependency direction validation. The `expert-ddd/SKILL.md` currently has none of this operational content -- it is purely an evaluation lens. The scaffolding and violation-checking content should be inlined into expert-ddd as a new "Operational Guidance" section, since there is no separate "ddd-writer" agent. The CLAUDE.md DDD section adds "Entry points are thin -- they delegate to domain functions" and "Name things after the domain: use ubiquitous language" -- both are already captured in expert-ddd's characteristic positions. No content loss risk here.
Key reasoning: The ddd-architect skill's value is the concrete scaffolding structure and the violation detection rules. expert-ddd's current SKILL.md is evaluation-only. Absorbing the operational content transforms expert-ddd into a complete reference. The dependency direction diagram (`Presentation -> Application -> Domain`, `Infrastructure -> Domain`) is valuable and not present in expert-ddd today.
Endorsed: expert-edge-cases (dissolution checklist), expert-lodash (shared conventions approach)

**expert-bdd**
Position: Approve with a caution. The user-scoped `doc-bdd` skill is massive (~500 lines) and highly structured: it defines the full BDD suite file structure, Gherkin syntax, section metadata, ADR-ready scoring, threshold registry integration, and validation error codes. The `expert-bdd/SKILL.md` is a 110-line evaluation lens. Absorbing the entire doc-bdd content into expert-bdd would create a 600+ line file that mixes evaluation concerns with document-production concerns. Recommendation: absorb only the evaluation-relevant content (Gherkin syntax philosophy, scenario type categorization, the 8 scenario categories, Given/When/Then discipline). The document-production machinery (file naming patterns, section metadata, ADR-ready scoring, validation error codes) should remain in its own skill file, repositioned from user scope to project scope if needed.
Key reasoning: expert-bdd evaluates whether BDD practices are being followed. The doc-bdd skill is a document factory. These are different concerns. Full absorption would violate the separation between evaluation (expert) and production (writer/factory).
Endorsed: expert-tla (split pattern -- evaluation vs. production), expert-tdd (split pattern for TDD)

**expert-atomic-design**
Position: Approve. The user-scoped `atomic-design-planning` skill is a concise planning guide (~100 lines) covering the hierarchy, decision table, anti-patterns, and Linear integration. The `expert-atomic-design/SKILL.md` already covers the hierarchy and anti-patterns from an evaluation perspective. The planning skill adds the decision table ("Does something similar exist? If Yes -> Reuse/extend it") and the Linear workflow integration. The decision table is evaluation-relevant and should be absorbed. The Linear workflow integration is process guidance, not evaluation -- it can go into shared conventions or be dropped if Linear is not actively used.
Key reasoning: Small, clean absorption. The decision table strengthens expert-atomic-design's evaluation criteria. No risk of file bloat.
Endorsed: expert-bdd (separation between evaluation and production is a valid principle)

**expert-tla**
Position: Approve the TLA+ split. The user-scoped `tla-specification` skill contains ~400 lines of TLA+ syntax, PlusCal constructs, common patterns (consensus, two-phase commit), TLC configuration, temporal operators reference, integration-with-C# examples, and workflow guidance. The `expert-tla/SKILL.md` is a 123-line evaluation lens focused on state enumeration and property identification. These are cleanly separable. Evaluation content (state machine mindset, "enumerate all states", "impossible states should be unrepresentable") stays in expert-tla. The CLAUDE.md "State Machine Mindset" section is already essentially a summary of expert-tla's role -- absorb it as a preamble or merge with the existing "Role" section. The syntax/patterns/TLC content goes to tla-writer, which already references the user-scoped skill.
Key reasoning: The tla-writer at line 51 says `Reference the TLA+ syntax and patterns from .claude/skills/tla-specification/SKILL.md`. After consolidation, this content is inlined directly into tla-writer/AGENT.md. The reference path updates to "see below" rather than an external file. This eliminates the indirection the consolidation is designed to remove.
Endorsed: expert-tdd (vitest-writer needs operational content too -- same pattern), expert-edge-cases (dissolution checklist)

**expert-continuous-delivery**
Position: Approve the merge queue addition. Adding `merge_group` to the `on:` trigger in `ci.yml` is a one-line change with zero risk to existing behavior. The `pull_request` trigger continues to work for PR checks. The `merge_group` trigger activates the same jobs when GitHub's merge queue tests the merge commit. No job modifications needed. The user handles branch protection and merge queue settings in the GitHub UI separately. One observation: the CI workflow currently has no caching of build artifacts between jobs -- each job (lint, test, build) runs `pnpm install` independently. This is not in scope for this consolidation but is worth noting for pipeline speed.
Key reasoning: Merge queue support is additive. The existing `pull_request` trigger is untouched. GitHub Actions runs the same jobs for `merge_group` events. The only thing that changes is when the jobs are triggered -- before merge, not just on PR update.
Endorsed: None specific to other experts' positions, but no objections either.

**expert-lodash**
Position: Approve. The CLAUDE.md "Prefer Lodash" section contains the per-method import rule, the `lodash/get` with array-path form rule, and the overall preference for lodash over vanilla. The `expert-lodash/SKILL.md` already contains all of this content in its "Strong opinions" and "Process" sections. The only net-new content from CLAUDE.md is the code examples showing the import syntax and the `get` array-path form. These examples should be added to expert-lodash as a "Quick Reference" section. The general rule "prefer lodash over vanilla methods" is a global convention and belongs in shared conventions as well, so that agents without lodash expertise still follow the rule.
Key reasoning: No content loss risk. expert-lodash already has the philosophy. CLAUDE.md adds concrete syntax examples that are useful as quick reference. The dual placement (shared conventions for the general rule, expert-lodash for the detailed guidance) is correct.
Endorsed: expert-edge-cases (dissolution checklist), expert-ddd (shared conventions approach)

**expert-edge-cases**
Position: Approve with a mandatory dissolution checklist. The primary risk in this consolidation is silent content loss -- a CLAUDE.md rule that does not land in any destination file. The mitigation proposed in the questioner session ("implementation plan includes a checklist") must be enforced, not aspirational.

Edge Cases Found:
- [content loss] CLAUDE.md section "Feature Development Agents" references three specific agents (code-architect, code-explorer, code-reviewer) with a directive to "use the methods from these agents in addition to your own." If this is distributed to "relevant writer agents," each writer agent gets a partial view. The directive should stay unified in shared conventions.
- [reference breakage] Any file that references `CLAUDE.md` by path (e.g., `@~/.claude/skills/ddd-architect/SKILL.md` references in CLAUDE.md pointing to user-scoped skills) must be updated. If the reference is in a file outside this repo (user-scoped skills), those remain stale -- acceptable per scope, but should be documented.
- [ordering] If shared conventions is created but not referenced by agent files, agents will not read it. The reference must be added to every agent/expert SKILL.md/AGENT.md that currently benefits from CLAUDE.md auto-loading.
- [partial absorption] The doc-bdd skill's document-production machinery (500+ lines) cannot be fully absorbed into expert-bdd without role confusion. expert-bdd's objection is valid -- only evaluation-relevant content should move.

Key reasoning: The consolidation is sound in design but fragile in execution. The dissolution checklist is the critical safeguard. Without it, the "delete CLAUDE.md" step becomes irreversible content loss.
Endorsed: expert-bdd (separation of evaluation and production concerns), expert-tla (split pattern), expert-continuous-delivery (merge queue is trivial and low-risk)

---

## Round 1 Summary

All 8 experts approved the overall plan. Three refinements surfaced as potential objections:

1. **expert-bdd** raised that full absorption of doc-bdd into expert-bdd would mix evaluation and production concerns (new objection)
2. **expert-edge-cases** raised the necessity of a mandatory dissolution checklist and the "Feature Development Agents" placement (new objection)
3. **expert-edge-cases** raised the ordering risk: shared conventions must be explicitly referenced by all agents (new objection)

No expert opposed the overall direction. Proceeding to Round 2 to resolve the three objections.

---

## Round 2

Round 2 context provided to all experts: the three objections from Round 1.

**expert-bdd (Round 2)**
Position: Unchanged. The doc-bdd skill should be repositioned from user scope to project scope as its own skill file (e.g., `.claude/skills/doc-bdd/SKILL.md`) rather than absorbed into expert-bdd. Only the evaluation-relevant content (8 scenario categories, Given/When/Then discipline, living documentation philosophy) should be added to expert-bdd. This is consistent with how tla-writer and expert-tla are split.
Objections: None new.
Endorsements: expert-edge-cases Round 1 objection about partial absorption is exactly right.

**expert-tdd (Round 2)**
Position: Agree with expert-bdd's refinement. The pattern should be consistent: expert-X evaluates, writer/factory-X produces. doc-bdd is a factory, not an evaluator.
Objections: None new.
Endorsements: expert-bdd (doc-bdd as separate project-scoped skill)

**expert-ddd (Round 2)**
Position: Agree. The ddd-architect skill is different from doc-bdd -- ddd-architect is small and purely adds operational scaffolding guidance to a single expert. doc-bdd is large and has a different role (document production). The two cases should be handled differently.
Objections: None new.
Endorsements: expert-bdd, expert-tdd

**expert-atomic-design (Round 2)**
Position: Agree.
Objections: None new.
Endorsements: expert-bdd

**expert-tla (Round 2)**
Position: Agree. The pattern is now clear: small operational-only skills (ddd-architect, atomic-design-planning) are absorbed into their expert. Large production-focused skills (doc-bdd, tla-specification) are split: evaluation content to the expert, production content to the writer/factory agent.
Objections: None new.
Endorsements: expert-bdd, expert-edge-cases

**expert-continuous-delivery (Round 2)**
Position: No change. The merge queue work stream is unaffected by the doc-bdd discussion. Agree with the dissolution checklist requirement -- it is the equivalent of a migration plan before a breaking deploy.
Objections: None new.
Endorsements: expert-edge-cases (dissolution checklist)

**expert-lodash (Round 2)**
Position: No change. Agree with all Round 1 objection resolutions.
Objections: None new.
Endorsements: expert-bdd, expert-edge-cases

**expert-edge-cases (Round 2)**
Position: All three objections from Round 1 have been accepted by the group:
1. doc-bdd stays as a separate project-scoped skill, only evaluation content absorbed into expert-bdd -- accepted
2. Dissolution checklist is mandatory -- accepted
3. Shared conventions must be explicitly referenced by all agents -- accepted
4. "Feature Development Agents" goes to shared conventions -- accepted

No new edge cases identified. The plan is now complete.
Objections: None new.
Endorsements: All experts' Round 2 positions.

---

## Round 2 Summary

No new objections raised. All three Round 1 objections were resolved by consensus:
1. doc-bdd becomes a separate project-scoped skill; only evaluation content goes to expert-bdd
2. Dissolution checklist is mandatory before CLAUDE.md deletion
3. Shared conventions file must be explicitly referenced by all agent/expert files

**Consensus reached after Round 2.**

---

## Endorsement Map

| Expert | Endorsed By |
|---|---|
| expert-tla (split pattern) | expert-tdd, expert-bdd, expert-edge-cases, expert-ddd |
| expert-edge-cases (dissolution checklist) | expert-tdd, expert-tla, expert-lodash, expert-ddd, expert-continuous-delivery |
| expert-bdd (evaluation vs production separation) | expert-tdd, expert-ddd, expert-atomic-design, expert-tla, expert-lodash, expert-edge-cases |
| expert-lodash (shared conventions approach) | expert-ddd |
| expert-continuous-delivery (merge queue is trivial) | expert-edge-cases |

---

## Final Distribution Plan (Refined)

### Work Stream 1: Inline User-Scoped Skills

| User-Scoped Skill | Destination | Strategy |
|---|---|---|
| `tla-specification` | `expert-tla/SKILL.md` + `tla-writer/AGENT.md` | Evaluation (state machine mindset, invariant identification) to expert-tla. Syntax, patterns, PlusCal, TLC, examples to tla-writer. Update tla-writer line 51 reference. |
| `atomic-design-planning` | `expert-atomic-design/SKILL.md` | Full absorption. Add decision table as evaluation criteria. Drop Linear workflow integration unless actively used. |
| `ddd-architect` | `expert-ddd/SKILL.md` | Full absorption. Add scaffolding structure and dependency direction diagram as "Operational Guidance" section. |
| `doc-bdd` | `expert-bdd/SKILL.md` + `.claude/skills/doc-bdd/SKILL.md` (new project-scoped location) | 8 scenario categories, Given/When/Then philosophy, living documentation principle to expert-bdd. Full document-production machinery (file structure, naming, metadata, scoring, validation) stays as separate project-scoped doc-bdd skill. |

### Work Stream 2: Dissolve CLAUDE.md

| CLAUDE.md Section | Destination |
|---|---|
| Line Endings (LF Only) | shared conventions |
| ESLint Config constraints | shared conventions |
| Vitest Coverage Thresholds | shared conventions |
| CSpell Unknown Words | shared conventions |
| Test-Driven Development | expert-tdd (philosophy) + vitest-writer (operational: Vitest choice, colocation) |
| Domain-Driven Design | expert-ddd |
| Atomic & Component-Driven Design | expert-atomic-design |
| Behavior-Driven Development | expert-bdd |
| Prefer Lodash | shared conventions (general rule) + expert-lodash (detailed guidance + examples) |
| State Machine Mindset | expert-tla (merge with Role section) |
| No Repeated String Literals | shared conventions |
| Feature Development Agents | shared conventions |
| Opportunistic Code Improvement | shared conventions |
| Progressive Mapping | already in progressive-mapper.md; remove from CLAUDE.md |

### Work Stream 3: Merge Queue CI

- Add `merge_group:` to `on:` trigger alongside `pull_request:`
- No job changes
- User handles GitHub repo settings

### Implementation Safeguards

1. Create dissolution checklist mapping every CLAUDE.md section to destination file + line range
2. Add `Read shared conventions: .claude/skills/shared/conventions.md` reference to every agent/expert file
3. Verify checklist completeness before deleting CLAUDE.md
4. doc-bdd moves from `~/.claude/skills/doc-bdd/SKILL.md` to `.claude/skills/doc-bdd/SKILL.md` (project scope)

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_skill-consolidation-claude-md-merge-queues.md
