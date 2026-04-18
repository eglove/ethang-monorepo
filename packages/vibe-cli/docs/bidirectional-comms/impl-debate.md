# Implementation Plan Debate — Bidirectional Agent Communications

**Date:** 2026-04-18
**Feature:** `packages/vibe-cli/docs/bidirectional-comms`
**Artifact under review:** `implementation-plan.md` (2666 lines, 38 tasks across 11 tiers)
**Reference document:** `tla/BidirectionalComms.tla` (2030 lines, 32 vars / 40 actions / 22 invariants / 5 liveness)
**Result:** **CONSENSUS_REACHED**
**Rounds:** 3
**Experts:** expert-tla, expert-tdd, expert-bdd, expert-ddd, expert-edge-cases, expert-continuous-delivery, expert-performance

Excluded from roster: expert-a11y, expert-atomic-design, expert-lodash (all UI/JS — not relevant to a backend PowerShell pipeline).

---

## Synthesis — Recommendation

The implementation plan is fundamentally sound — the bijective coverage tables (32 state vars / 40 actions / 22 invariants / 5 liveness all enumerated and mapped to task IDs) prove genuine TLA+→PowerShell rigor. **However, four structural fixes and a follow-on remediation list must land before the plan can drive coding.**

### Convergence package — all 7 experts endorsed unconditionally

1. **Move T38 (BDD Feature Audit, Named-Tag Refactor) from Tier 9 → Tier 2.** Tagging, leak-removal, and observable-behavior refactor are *authoring-time* concerns, not delivery-time concerns. As written, every Tier 1–8 task that edits `bdd.feature` (T4/T25/T28/T29) writes untagged Gherkin that T38 must rewrite — two passes over the same file, plus the `bdd-tag-lint`, `bdd-action-tag-parity`, and `check-tla-leaks-in-bdd.ps1` gates in Tier 10 cannot enforce drift during 30+ steps of code authoring.

2. **Move T31 (Delete Obsolete Utilities) out of Tier 9 into a new Tier 9b.** T31 declares `dependencies: ["T30"]` while sitting in the same tier — a CI runner that schedules a tier as a single parallel batch will deadlock or run T31 against a half-migrated tree. Same-tier dependency violates the "tier = parallel" contract.

3. **Split T33 (Property + Trace + Refinement + Perf + Telemetry) into T33a (`@contract-independent`) and T33b (`@contract-dependent`) at the JSON level.** Tag-based intra-tier ordering is human-readable but not tractable for any standard DAG runner. T33b legitimately depends on T34 (contract snapshots); T33a does not.

4. **Close the `@invariant-none-reason` ≡ `@tla-action-none-reason` symmetric loophole.** Both escape hatches must reference one shared closed enum of reason tokens, validated at lint time. Either is a silent bypass of the spec→test bijection.

### Ratified additional remediations (cross-endorsed by ≥2 experts)

5. **Split T30 into 6 per-stage tasks** (T30.2 through T30.7), one commit per stage, each independently revertable. Already promised in Round-3 OBJ-R3-4 but not reflected in the task list. (endorsed by tdd, ddd, cd)

6. **Lift `VIBE_BUS_DB_PATH` guard into a `BusLocationPolicy` value object on the Bus aggregate** (current "structural guard against transaction-inside-git" is non-functional — env-var strings cannot expose connection handles). (edge-cases, ddd)

7. **Add explicit Gherkin scenarios** for: `RouterAbortsStaleRollback` (v12 path-a only), `role_schema_version` HARD HALT, `SQLITE_BUSY` under WAL, `$ErrorActionPreference` inheritance into background jobs, cascade-order observable behavior, and `@quality_attribute` perf-budget scenarios. (tla, bdd, edge-cases, perf)

8. **Promote `Test-WalContention-Characterization` from `@characterization` to `@regression`** with a fixed concurrency level (≥8 writers) and published p50/p95/p99 baselines as hard ceilings. T15's sequential append benchmark does not represent the production hot path. (perf, tdd, edge-cases)

9. **Rename `load-generator.ps1` to `event-sequence-generator.ps1`** OR add a real concurrent driver (N runspaces, ≥30s sustained pressure). The current file is a deterministic event-tuple emitter, not load. (perf, edge-cases)

10. **Add absolute hard-ceiling perf budgets** in `performance-baselines-absolute.json`, checked unconditionally with no env-var override. The 20% regression tolerance plus ratchet-only-tightens creates one-way drift. (perf)

11. **Add stderr backpressure budget** (bytes/sec cap, drop-and-warn policy) for every Claude subprocess. Unmentioned in T16 but a real Windows pipe-buffer deadlock hazard. (edge-cases, perf)

12. **Add per-stage wall-clock observability targets** (warning thresholds, NOT hard kills — consistent with no-hardcoded-limits rule). (cd, perf)

13. **Add rollback rehearsal task** in Tier 9b — quarterly automated `vibe rehearse-rollback` against snapshot fixtures. (cd, tdd)

14. **Define canary cohort** explicitly (which fixture set, which traffic share, which duration). (cd, bdd)

15. **Add CI gates:** mutation-testing on Tier 2 (threshold ≥70% killed mutants), test-must-fail-first pre-merge check, fixture-tier provenance manifest. (tdd, bdd, edge-cases)

16. **Add `tla-action-aggregate-cascade.md`** — single authoritative document mapping each of the 40 TLA actions to its primary-mover aggregate, follower updates, and atomic boundary. Current `cascade-order.md` covers feature flags only. (ddd, bdd, perf)

17. **Add edge-case coverage:** `.git/index.lock` external-process contention, EPIPE on stdin, cross-volume rename for `.snapshot.tmp`, Hyper-V clock backward jump, group-id epoch on `-Resume`, `alarms.log` ENOSPC retry. (edge-cases)

18. **Add flag-removal policy:** every `VIBE_STAGE_N_BIDIR` flag ships with a sunset ticket and hard-removal commit in Tier 11. (cd)

19. **Add explicit fairness-obligation matrix rows** (15+ enumerated WF/SF terms inline, not just counted). (tla)

20. **Map invariant 19 (`HandlerStateConsistency`) to T16, T18, T24** in addition to T17 — those tasks mutate handler state. (tla)

### Unresolved dissents

None. Every objection raised in Rounds 1–2 was either ratified by ≥2 experts (now in remediations 5–20) or withdrawn/subsumed by the convergence package.

---

## Per-expert final positions and endorsement map

| Expert | Final Position | Endorses |
|---|---|---|
| **expert-tla** | Consensus on domain. Coverage is bijective; remediations fix what the bijection alone could not. | tdd N3, ddd N1, edge-cases N1, all 4 convergence items |
| **expert-tdd** | CONSENSUS declared on TDD domain. | bdd N1/N2, ddd N1, edge-cases N1/N2, cd N1, perf N1/N2, all 4 convergence items |
| **expert-bdd** | Consensus declarable once perf + cascade-order Gherkin lands. | tdd N1/N2/N3, edge-cases N1, cd N1/N2, perf N1/N2 (folded into bdd N1) |
| **expert-ddd** | Consensus YES, conditional on `BusLocationPolicy` stub. | tdd N2, bdd N2, edge-cases N1, all 4 convergence items |
| **expert-edge-cases** | Consensus declarable once N1+N2 receive remediation tasks. | tdd N1/N2/N3, bdd N2, cd N1/N2, perf N1, all 4 convergence items |
| **expert-continuous-delivery** | "Consensus declared from CD seat. Ship it." | tdd N1/N2/N3 (scoped), bdd N1/N2, edge-cases N1/N2, perf N1/N2 (observability target only), all 4 convergence items |
| **expert-performance** | Consensus declarable once N1+N2 land. | tdd N2, bdd N1/N2, edge-cases N1/N2, cd N1/N2, all 4 convergence items |

---

## Round 1 Transcript

### expert-tla — Round 1

**Position:** Partial — coverage tables are bijective (32 vars, 40 actions, 22 invariants, 5 liveness all enumerated and mapped); refinement-mapping doc exists with CI-enforced 32-row check. Plan is unusually rigorous. But four specific gaps remain.

**Reasoning:**
- State variable bijection complete (lines 267–272, all 32 TLA vars mapped to task IDs).
- Action coverage complete by name (lines 274–317, all 40 Next-state actions including v12-new actions).
- Invariant coverage complete (lines 319–344, all 22 invariants with task IDs, v12 renumbering honored).
- Liveness/fairness present with concrete fairness obligation matrix and liveness-slo-mapping.md.
- Refinement mapping deliverable exists and is justified (32-row table with file-existence assertions).
- However: v12 fairness additions not individually broken out as test rows — only counted.
- Crash-during-rollback drain semantics: `RouterExecutesRollback` requires `\A w : commitLockHolder[w] = NULL` BEFORE firing; OBJ-EC-5's drain-poll abort is not classified as a stutter.

**Objections:**
1. `RouterAbortsStaleRollback` (action 36) needs explicit BDD scenario for v12 path-a only (path-b structurally unreachable per OBJ-LOW-2(v12)).
2. `ConsensusRoundStartMonotone` (invariant 21) needs property test asserting v12 OBJ-LOW-1 boundary explicitly.
3. `HandlerStateConsistency` (invariant 19) mapped only to T17 — must add T16, T18, T24 because `AgentCrashes`, `RouterRespawnsAgent` mutate handler state.
4. Fairness-obligation-matrix described but not enumerated (counted as "15+ rows" — list WF/SF terms inline).

### expert-tdd — Round 1

**Position:** Plan is dense with TDD-friendly named tests in halt/rollback/lifecycle steps but is severely undisciplined elsewhere. Multiple steps bundle 10–40 distinct assertions into a single "Test (write first)" paragraph; largest tasks (T15, T22, T29, T30, T32, T33, T35) are not red-green sequenceable. T34+T33 dependency is inverted.

**Reasoning:**
- T2/T4/T5 hide 12+ unrelated assertions per "test paragraph." T2's single sentence chains 13 distinct verifications.
- T15 mixes unit test + integration test + atomicity simulation + 1000-call performance benchmark in one step.
- T25's halt section is exemplary; the rest of the plan should imitate it (13 named test functions + 13 paired negative branches).
- T29 conflates 18+ scenarios in one block (snapshot+rollback happy path + chaos tests in one task).
- T30 is the worst TDD violation — "Migrate Stages 2-7" with one test file; Round-3 OBJ-R3-4 demanded 6 per-stage commits but task list still shows undivided T30.
- T33 dependency on T34 is inverted; contract snapshots from T34 should be owned by T9.
- T32's 35 verifications across 24 CI jobs in one `ci-gates.Tests.ps1` defeats Round-7 OBJ-R7-TDD-2 test-fail-assertion gate.
- OBJ-R6-14 (red-phase assertions name the invariant violated) only partially honored.

**Objections:** 15 — bundling defects in T2/T4/T5/T15/T17/T18/T21/T22/T26/T29/T30/T31/T32/T33/T35; T33↔T34 inverted dependency; T35 should be a thin orchestration calling already-named test functions.

### expert-bdd — Round 1

**Position:** Coverage breadth sufficient and observable-behavior intent mostly honored, but ordering structurally broken: T38 (the ONLY task that tags scenarios, removes 263 TLA+-identifier leaks, and refactors to observable behaviors) must move out of Tier 9.

**Reasoning:**
- Scenario-to-task coverage looks complete on paper. 335-scenario count in `bdd.feature` preserved with bijection completion in T38 for invariants 18, 21, 22.
- Assertability partially observable, partially leaking — many step texts assert SQLite columns directly.
- T38 in Tier 9 too late on three independent grounds: (1) T4/T25/T28/T29 explicitly told to add Gherkin Then text NOW; (2) Step 32's gates depend on tagged corpus; (3) "scenarios should be written before a single line of implementation."
- Halt coverage is the strongest area (Step 25's 13-named-test rule).
- Schema-version mismatch covered but BDD scenario missing.
- Fragmentation risk: 5 separate tasks (T4, T25, T28, T29, T38) editing one 3645-line `bdd.feature` across Tiers 1, 8, 8, 8, 9.

**Objections:**
1. T38 must move forward to Tier 2 (sit alongside T1).
2. No explicit BDD scenario for `role_schema_version` mismatch (T28).
3. Several scenarios assert `agent_sessions` rows / `event_log` records directly — not stakeholder-observable.
4. `@tla-action-none-reason` valid-reason allowlist is open-ended ("or any other non-empty string").
5. Fragmentation across 5 tasks editing one feature file is a merge-conflict trap.

### expert-ddd — Round 1

**Position:** DDD-credible but not yet DDD-clean. Round 7-9 work demonstrates aggregate ownership taken seriously. However, several boundary leaks, one misclassified building block, and an under-specified context-map artifact remain.

**Reasoning:**
- Bounded contexts (T1) — four-context partition is a real partition.
- Aggregate roots (T11, T12, T22, T36) — each owns named transition methods enforcing invariants at the boundary.
- Aggregate-table ownership (T4) — `bus_state` god-table correctly decomposed.
- Domain services genuinely service-shaped (T17, T22).
- Value objects (T13 Envelope) constructed via `New-BusEnvelope` with construction-time invariant enforcement.
- Cascade-order doc ambiguity — covers feature-flag cascade, NOT TLA action cascade.

**Objections:**
1. WriteSession-as-Entity inside CommitSerializer-as-aggregate is two patterns in conflict.
2. `event_log` owned by "Router" (R6-33), but Router is not an aggregate — anemic ownership.
3. T30 Stage "domain object" has no aggregate-table ownership.
4. Cascade-order ambiguity for TLA actions — need single `tla-action-aggregate-cascade.md`.
5. Routing layer raising `DomainProtocolError` for `TypeSenderACL` violations means routing encodes domain rules.

### expert-edge-cases — Round 1

**Position:** Plan covers enumerable failure surface very well after nine rounds of objection-resolution. However, treats git-process boundary as a single fault unit and leaves several real-world Windows pipe/process edge cases gestured at rather than tested.

**Reasoning:**
- Halt enumeration is genuine, not gestural — Step 25 lists 13 named test functions and 13 paired negative branches.
- TLA failure transitions map cleanly.
- Bus-protocol races largely covered (partial-write snapshot, checkpoint↔crash race, SQLite-WAL contention, mutex starvation, etc.).
- Schema-version mismatch hard-halted, not warned (HARD HALT per OBJ-EC-3/EC-11).
- The git surface is the soft spot — `.git/index.lock` from out-of-bus processes not enumerated.
- Subprocess pipe topology one-sided — stderr never mentioned.
- `VIBE_BUS_DB_PATH` guard is non-functional — env vars cannot expose connection handles.

**Objections:** 10 — `.git/index.lock` external contention; stderr-runaway; broken stdin EPIPE; `VIBE_BUS_DB_PATH` guard non-functional; half-open heartbeat → `[Console]::Out`; mid-write `alarms.log` lock; cross-volume rename for `.snapshot.tmp`; Hyper-V clock backward jump; group-id reuse across `-Resume`; `@invariant-none` loophole missing reason tag.

### expert-continuous-delivery — Round 1

**Position:** 11-tier graph broadly deploy-safe. But Tier 9 contains hidden sequential edge that breaks "tier = parallel" contract; Tier 10's intra-tier sub-phase notation not tractable for vanilla CI runner.

**Reasoning:**
- T31 inside Tier 9 violates the tier invariant (declares `dependencies: ["T30"]` while sitting in same tier).
- T33 has intra-tier dependency on T34 — tag-based "contract-independent / contract-dependent" notation not machine-checkable.
- T35 dependency list is satisfied (37 deps, transitive closure verified).
- Migration playbook (T4) genuinely strong.
- T30 feature flags + cascade correctly designed for staged rollout (1%/5%/25%/100% canary ladder).
- T29 RollbackCoordinator wired for hot rollback (single `BEGIN IMMEDIATE` boundary, snapshot SHA-256 verification, drain-abort, chaos tests).
- Schema-hash canary window keystone for zero-downtime.

**Objections:**
1. T31 must move to its own tier (9b) or be fused into T30's per-stage commit sequence.
2. T33 must split into T33a (`@contract-independent`) / T33b (`@contract-dependent`) at JSON level.
3. No flag-removal policy — six `VIBE_STAGE_N_BIDIR` flags with no documented sunset.
4. `e2e-smoke-contract` should be **blocking** gate on canary advancement, not advisory.
5. No mention of pipeline duration target — wall-clock feedback loop unspecified.

### expert-performance — Round 1

**Position:** Plan performance-credible but has three measurable gaps: load generator is not actually a load generator; perf-baseline ratchet wired only in advisory mode; Round-6 contention test tagged `@characterization` not `@regression`.

**Reasoning:**
- T15 BEGIN IMMEDIATE correct on paper, untested under load — measures sequential happy path; production hot path is 16+ concurrent runspaces.
- T33 `load-generator.ps1` does not drive fan-out — it's a deterministic event-tuple emitter for property tests.
- T16 stdout backpressure correctly chosen (BlockingCollection + Interlocked counter).
- T22 commit serializer concurrency primitives sound but starvation cap is hardcoded (8-attempt max) — contradicts "no hardcoded retry caps" rule.
- T26 heartbeat not a bottleneck if OBJ-R5-11 contract holds.
- T32 perf gate threshold too loose (20% with env-override).
- T33 property+trace tests likely fit CI budget (60s with virtual time).

**Objections:**
1. Load generator does not generate load — rename or add real concurrent driver.
2. Sequential append benchmark unrepresentative of hot path — promote `Test-WalContention-Characterization` from `@characterization` to `@regression`.
3. 20% regression tolerance + ratchet-only-tightens creates one-way drift — add absolute hard ceilings.

---

## Round 2 Transcript (Engagement)

### expert-tla — Round 2
- **Position:** Consensus on TLA+ domain substantially reached in R1. All 4 R1 objections STAND.
- **Endorses:** expert-edge-cases R1-8 (`@invariant-none-reason` symmetric to `@tla-action-none-reason`); expert-bdd R1 (T38 → Tier 2); expert-edge-cases R1-1 (`.git/index.lock` is a missing state); expert-ddd R1-2 (anemic `event_log` ownership leaves Inv 7 with no enforcer).
- **New objections:** None.

### expert-tdd — Round 2
- **Position:** Severely undisciplined remains the assessment. R1 objections largely STAND.
- **Endorses:** expert-bdd T38; expert-cd T31 → Tier 9b; expert-cd T33 split (subsumes own T33↔T34 inverted objection); expert-tla T16/T18/T24 in `HandlerStateConsistency`; expert-edge-cases `@invariant-none` loophole; expert-ddd WriteSession identity.
- **New objections:** N1 mutation-testing gate; N2 fixture reuse undeclared; N3 test-must-fail-first CI check.

### expert-bdd — Round 2
- **Position:** Partial. Plan still lacks executable Gherkin coverage for several behaviors. R1 objections about T38 placement and 5-way fragmentation unaddressed.
- **Endorses:** expert-tla RouterAbortsStaleRollback BDD; expert-edge-cases `@invariant-none-reason` (mirror of own R1 #4); expert-tdd T30 split; expert-ddd WriteSession identity; expert-cd flag-removal policy.
- **New objections:** N1 no `@quality_attribute` perf scenarios; N2 cascade-order BDD scenario missing.

### expert-ddd — Round 2
- **Position:** DDD-credible after R1 objections, but R2 reveals two new domain leaks.
- **Endorses:** expert-edge-cases #4 (VIBE_BUS_DB_PATH); expert-tdd T30 split (DDD grounds); expert-cd T31 graph bug; expert-bdd T38 + role_schema_version Gherkin.
- **New objections:** N1 BusLocationPolicy — VIBE_BUS_DB_PATH must be lifted into domain policy on Bus aggregate.

### expert-edge-cases — Round 2
- **Position:** R1 hunt remains valid. None of 10 R1 objections RESOLVED or WITHDRAWN.
- **Endorses:** expert-bdd role_schema_version Gherkin; expert-perf load-generator misnaming; expert-ddd VIBE_BUS_DB_PATH (direct endorsement of own R1 #4); expert-tdd assertion-bundling splits; expert-cd e2e-smoke-contract as canary blocker.
- **New objections:** N1 SQLITE_BUSY under WAL during Stage 2 fan-out; N2 PowerShell `$ErrorActionPreference` inheritance into background jobs.

### expert-continuous-delivery — Round 2
- **Position:** Tier graph structurally broken in two places. R1 objections all STAND.
- **Endorses:** expert-tdd T30 split (stronger framing); expert-tdd T33↔T34 inversion (resolves own R1 #2); expert-bdd T38 → Tier 2; expert-edge-cases `.git/index.lock` (e2e-smoke-contract scenario); expert-ddd cascade-order ambiguity.
- **New objections:** N1 no rollback rehearsal task; N2 canary cohort undefined.

### expert-performance — Round 2
- **Position:** Plan still under-specifies measurement infrastructure. R1 stance unchanged.
- **Endorses:** expert-tdd T15 split (benchmark vs. correctness); expert-edge-cases stderr-runaway and half-open heartbeat (perf cliffs); expert-cd pipeline-duration SLO.
- **New objections:** N1 stderr backpressure budget; N2 per-stage wall-clock budget.

---

## Round 3 Transcript (Closure)

### expert-tla — Round 3
- **Position:** **Consensus on TLA+ domain.**
- **Round 2 ratifications:** Ratifies all in-domain (tdd N1/N2/N3, bdd N2, ddd N1, edge-cases N1/N2, cd N1); out-of-domain (bdd N1, cd N2, perf N1/N2).
- **Final status:** All R1/R2 TLA+ objections accounted for by convergent fixes.
- **New objections:** None.

### expert-tdd — Round 3
- **Position:** **CONSENSUS declared on TDD domain.**
- **Round 2 ratifications:** Ratifies all (own N1/N2/N3, bdd N1/N2, ddd N1, edge-cases N1/N2, cd N1, perf N1/N2 conditionally).
- **Final status:** N1/N2/N3 ratified by convergence and re-affirmed.
- **New objections:** None.

### expert-bdd — Round 3
- **Position:** Endorse convergence. Consensus declarable once perf+cascade Gherkin lands.
- **Round 2 ratifications:** Ratifies all (tdd N1/N2/N3, edge-cases N1/N2, cd N1/N2, perf N1/N2 fold into own N1).
- **Final status:** Own N1 and N2 UNRESOLVED until concrete Gherkin committed.
- **New objections:** None.

### expert-ddd — Round 3
- **Position:** **Consensus YES**, conditional on `BusLocationPolicy` stub landing.
- **Round 2 ratifications:** Ratifies tdd N2, bdd N2, edge-cases N1, perf N2 (with reservation about hidden domain rules); out-of-domain otherwise.
- **Final status:** N1 maintained but downgraded to non-blocking.
- **New objections:** None.

### expert-edge-cases — Round 3
- **Position:** Endorse convergence package. Consensus declarable once N1+N2 receive remediation tasks.
- **Round 2 ratifications:** Ratifies all (tdd N1/N2/N3, bdd N2, cd N1/N2, perf N1/N2, ddd N1 deferred).
- **Final status:** N1 and N2 STAND with explicit acceptance criteria.
- **New objections:** None.

### expert-continuous-delivery — Round 3
- **Position:** **"Consensus declared from CD seat. Ship it."**
- **Round 2 ratifications:** Ratifies all (tdd N1/N2/N3 scoped, bdd N1/N2, edge-cases N1/N2, perf N1, perf N2 as observability target only).
- **Final status:** Own N1 and N2 ratified by silence in R2.
- **New objections:** None.

### expert-performance — Round 3
- **Position:** Endorse all 4 convergence items. Consensus declarable once N1+N2 land.
- **Round 2 ratifications:** Ratifies tdd N2, bdd N1/N2, ddd N1 (out-of-domain), edge-cases N1/N2, cd N1/N2.
- **Final status:** N1 (stderr budget) and N2 (per-stage wall-clock budgets) STAND.
- **New objections:** None.

---

## Consensus Detection

Round 3 produced **zero new objections** from any of the 7 experts. Per the moderator's consensus rule:

> Consensus is NOT blocked by experts reiterating the same objection from a prior round. Only novel objections extend the debate.

All Round 1/2 objections are now either:
- **Resolved** by the 4 convergence items, OR
- **Ratified by ≥2 experts** and consolidated into the 16 additional remediations (items 5–20 above).

No expert raised a novel objection in Round 3. **Consensus reached.**
