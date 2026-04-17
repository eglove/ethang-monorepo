# Token Saving — Implementation Plan Debate Session

**Date:** 2026-04-17  
**Feature:** token-saving  
**Artifact reviewed:** `packages/vibe-cli/docs/token-saving/implementation-plan.md`  
**TLA+ reference:** `packages/vibe-cli/docs/token-saving/tla/TokenSaving.tla` (Revision 20)  
**Rounds:** 2  
**Result:** CONSENSUS_REACHED  

---

## Synthesis

### Result

CONSENSUS_REACHED — no new objections were raised in Round 2. All Round 2 outputs are maintenance, narrowings, endorsements, or withdrawals of Round 1 positions.

### Experts

| Expert | Domain |
|---|---|
| expert-tla | TLA+ Formal Specification |
| expert-tdd | Test-Driven Development |
| expert-bdd | Behavior-Driven Development |
| expert-continuous-delivery | Continuous Delivery and Deployment |
| expert-edge-cases | Edge Case and Failure Hunting |

> **[expert-bdd: no output in round 2]** — Round 1 BDD positions carry forward as the expert's final stance.

---

### Agreed Recommendation

The implementation plan is **approved with 10 required changes and 9 recommended improvements** before implementation begins. The plan demonstrates strong structural coverage: all 31 named TLA+ transitions, 38 safety invariants (S1–S38), and 14 liveness properties (L1–L14) are assigned to steps with test coverage, and 8 prior debate objections (Revisions 20–21) are correctly resolved. The required changes are targeted test-description improvements — not architectural changes — endorsed by two or more experts.

---

#### Required Changes (endorsed by ≥2 experts)

**R1 — Step 6: Add graphState="force_dedup" direct assertion**  
*Endorsed by: expert-tla, expert-tdd, expert-edge-cases*

Step 6 tests 4 and 8 test the post-force-dedup outcome (`graphState` returns to `"collecting"`) but no test directly asserts entry into and exit from the transient `force_dedup` state. Add Step 6 test 11:
1. Seeds `retryCount=MaxRetries` and `graphState="dedup_error"` with a pending node.
2. Calls `GraphForceDedup` — asserts `graphState="force_dedup"` at the intermediate state (not yet collecting).
3. Asserts S5: `retryCount >= MaxRetries` holds at `force_dedup` entry.
4. Calls `GraphAfterForceDedup` — asserts `graphState="collecting"` and `retryCount=0`.

This proves the implementation faithfully models the two-step TLA+ transition rather than short-circuiting `dedup_error → collecting`.

---

**R2 — Step 5 or Step 11: Add D27 4-step hook-completion-after-halt integration test**  
*Endorsed by: expert-tla, expert-tdd, expert-continuous-delivery*

D27 declares that `HookRewrite`, `HookExecuteSuccess`, and `HookExecuteFail` have no `pipelineState="running"` guard. The plan documents the 4-step interleaving textually in Step 5's halt signal design decision block, but no test exercises this path in a single trace. Add an integration test:
1. `HookInterceptEs` fires: `hookState="idle"` → `"intercepting"`, `pipelineState="running"`.
2. `ValidateRoleFail` fires: `pipelineState` → `"halted"`, `routingState` → `"error"`. `hookState` remains `"intercepting"`.
3. `HookRewrite` fires: `hookState` → `"rewriting"`, `hookRewritten=TRUE` — NOT blocked by halted state.
4. `HookExecuteSuccess` fires: `hookState` → `"done"`, `hookKind` → `"none"`.

Must be written RED before hook scripts are implemented, to enforce D27's structural no-guard requirement.

---

**R3 — Steps 3/4 test 10: Specify Pester mock mechanism for HookRewrite stub**  
*Endorsed by: expert-tdd, expert-continuous-delivery*

"Disable HookRewrite by mocking the rewrite function" does not specify the mechanism. For a test written before implementation, the mock boundary must be explicit. Specify: "Use `Mock HookRewrite { }` (Pester scoped mock) in the `BeforeEach` block to replace the rewrite function with a no-op. Assert `hookState` does NOT advance to `"rewriting"` — the test MUST FAIL when the mock is active. Remove the mock; assert progression to `"rewriting"`."

---

**R4 — Step 11 test 9: Enumerate all routing halt codes in negative assertion**  
*Endorsed by: expert-tdd, expert-tla*

"NO line matching `[ROUTING-HALT:...]` appears in stderr" cannot be validated without a closed set of possible codes. Add explicit enumeration: the complete set is `[ROUTING-HALT:INVALID-ROLE <role>]`, `[ROUTING-HALT:MISSING-MAPPING <role>]`, `[ROUTING-HALT:INVALID-MODEL <model>]` (per D23/D24). Test must assert none of these three codes appears. An implementation emitting a spurious fourth code would still be caught.

---

**R5 — Step 2 test 4: Specify ghost-edge error message and type**  
*Endorsed by: expert-tdd*

Test 4 asserts "throws a build error" for NoGhostEdges (S21) but does not specify message text or error type. Specify: `addEdge(from, to, type)` throws `Error("Cannot add edge: endpoint '<from>' not found in graph")`. Without this, a null-reference exception thrown for a different reason passes the assertion.

---

**R6 — Step 6 tests 7–10: Add explicit fail-first injection description**  
*Endorsed by: expert-tdd*

Tests 7–10 list expected postconditions but do not specify the failing precondition. Each needs a RED→GREEN scaffold. Example for test 8 (MaxRetries=1 boundary): "Stub `GraphForceDedup` to be a no-op — test MUST FAIL at the force-dedup assertion. Remove stub — test passes." Without this, the tests can vacuously pass on an incomplete implementation.

---

**R7 — Step 8: Add `.tmp`-write-success / rename-fail specific test**  
*Endorsed by: expert-edge-cases, expert-continuous-delivery*

Step 8 test 3 "simulates a write failure" generically. D26 defines a distinct rename-failure scenario: `.tmp` exists (phase 1 succeeded), prior `CLAUDE.md` intact (rename failed). Add a dedicated test:
1. Mock filesystem to succeed on temp-file write (`.tmp` exists after call).
2. Mock rename operation to throw `EPERM`/`EXDEV`.
3. Assert: (a) prior `CLAUDE.md` is untouched; (b) `.tmp` is cleaned up or explicitly reported; (c) `markdownState` remains `"stale"` not `"current"`.

This is a production reliability gap — a partial-write bug can silently corrupt `CLAUDE.md`.

---

**R8 — Step 12 Pester test 9: Assert CLAUDE.md existence before content inspection**  
*Endorsed by: expert-tdd, expert-edge-cases*

The content inspection (`R not present`, epoch-1 nodes present) vacuously passes if `CLAUDE.md` is missing. Add pre-condition assertions:
1. `Assert (Test-Path $claudeMdPath) -eq $true`
2. `Assert (Get-Item $claudeMdPath).Length -gt 0`
3. Then proceed with content assertions.

---

**R9 — Step 12 Vitest test 1: Add positive assertion that 3rd operation succeeds**  
*Endorsed by: expert-tdd, expert-tla, expert-edge-cases*

The test asserts the 4th add-operation is disabled (MaxGraphOps=3) but does not assert the 3rd succeeds. An off-by-one implementation that disables at `graphOpsCount=MaxGraphOps-1` would pass the 4th assertion while operating incorrectly. Expand:
1. Assert 1st, 2nd, and 3rd operations each succeed (`graphOpsCount` increments 0→1→2→3).
2. Assert 4th is silently disabled (no agent notification, `graphOpsCount` stays 3).
3. Assert stderr contains `[WARN: graphOpsCount=MaxGraphOps epoch-boundary enforced]`.

---

**R10 — Step 6 test 3: Resolve retryCount assertion target ambiguity**  
*Endorsed by: expert-tla, expert-tdd, expert-bdd (R1)*

The description contradicts itself: "asserts retryCount UNCHANGED (D19 observable contract: BDD asserts retryCount=0 at dedup_error entry)". "UNCHANGED" and "asserts 0" are mutually exclusive when `retryCount` entered the cycle at >0. Resolve to the **BDD per-cycle observable**: assert `retryCount === 0` at fresh `dedup_error` entry. The D19 shared-budget semantics are separately verified by Step 12 Vitest test 5.

---

#### Recommended Improvements (non-blocking)

**Rec1** — Step 8 test 7: Expand from 1 sentence to 4–5 lines with setup order, concurrent state (`graphState="writing"` when halt fires), and dual assertion (state variable AND no file content change).

**Rec2** — Step 8 test 11: Add Given/When/Then structure. "Given MaxAgents=2, agentsCompleted=0. When agent 1 close hook fires (GraphWriteSuccess). Then graphState='collecting', agentsCompleted=1. When agent 2 close hook fires. Then graphState='done', agentsCompleted=2."

**Rec3** — Step 9 tests: Clarify that tests 1–5 are content-existence tests (deployment verification), not behavioral tests. Behavioral verification (agents actually invoke `.addNode()`/`.addEdge()`) is covered by Step 11/12 integration tests. Label accordingly to prevent false completeness assumption.

**Rec4** — Step 11 test 7: Replace "throughout" with specific checkpoints: "Assert `hookState='idle'` at pipeline initialization AND at pipeline completion. No hook match events appear in the pipeline audit log."

**Rec5** — Step 12 Pester test 6: Specify timestamp injection mechanism: "Use mock timestamps injected into the pipeline log writer. Capture close hook process exit timestamp. Assert any next-stage-start log entry has a strictly greater timestamp."

**Rec6** — Steps 3/4 test 7: Re-label as integration-level per D3 ASSUME: "Integration-level test (outside D3 ASSUME scope): verifies runtime hook-reset behavior not modeled in TLA+."

**Rec7** — T9 dependency: Add to Step 9 description: "Pre-condition: all six agent role system prompt files must exist at their documented paths before T9 executes (`packages/vibe-cli/agents/<role>.md` for each of the six roles)."

**Rec8** — [WARN] format: Specify log format for Step 6/12 force-dedup entries: `[WARN] force-dedup: discarding '<path>' (retryCount=<N> >= MaxRetries=<N>)`. Tests should match on this pattern, not just `[WARN]` alone.

**Rec9** — Step 5 test 6: Add distinct malformed `.psd1` test case: create a file with a syntax error (unclosed hashtable), assert `Import-PowerShellDataFile` fails with a parse error (not file-not-found), and assert the pipeline halts with `[ROUTING-HALT:MISSING-MAPPING]`.

---

#### Withdrawn Objections (declared abstractions — no action required)

| Objection | Expert | Reason |
|---|---|---|
| Terminated action vacuous | expert-tla | S22/S23/S24 invariant tests cover absorption; stutter action has no behavioral content requiring a dedicated test |
| Edge type erasure silent duplicates | expert-edge-cases | Covered by O5 ASSUME (`EdgeTypeErasureIsDeclaredAbstraction`); intentional TLA+ design boundary |
| GraphWriteMarkdown from idle state | expert-edge-cases | Structurally prevented by D14 ASSUME (`GraphWriteMarkdownRequiresCollecting`); not a reachable path |
| HookState cleanup atomicity | expert-edge-cases | Outside TLA+ scope by D26 serial action model; inter-agent race covered by Step 12 integration test 4 |

---

## Round Transcripts

### Round 1

#### expert-tla — Round 1

**Position:** Strong structural coverage with three material concerns.

**State Model (abbreviated):**
- Pipeline: idle → running → {halted, done} (absorbing)
- Routing: idle → validating → {resolving, error} → {invoking, halt} → done
- Hook: idle → intercepting → rewriting → {done, error} (D27: rewriting proceeds independent of pipelineState)
- Graph: idle → collecting ↔ building → dedup_error → retrying → building | dedup_error; dedup_error → **force_dedup** → collecting; collecting → writing → {done, collecting}; any active → warn (halt cleanup)

**Reasoning:** All 31 transitions are mapped. All state domains are first-class test subjects. D36 Init artifact is declared. Revision 20 objections are well-addressed. Halt signal format is binding. Three gaps remain: Terminated vacuity, force_dedup intermediate visibility, D27 integrated 4-step path.

**Objections:**
1. Terminated action: no test seeds terminal states and asserts the stutter is enabled but produces no change
2. `graphState="force_dedup"` transient state: Step 6 tests assert post-force-dedup outcomes only, not the intermediate state visit or S5 at that waypoint
3. D27 hook-halt interleaving: 4-step sequence described in text but not exercised in a single test trace

**Endorsements:** None (Round 1)

---

#### expert-tdd — Round 1

**Position:** Strong support with six structural reservations.

**Reasoning:** The plan excels at red-green clarity and binding assertions. Its vulnerability is that "critical" tests (Steps 8, 10, 12) are under-described in setup, creating a gap between the assertion requirement and precondition construction. TDD demands the test harness be specified in the test, not delegated to an imagined framework.

**Objections:**
1. Steps 3/4 test 10 (L14 failing-first): "disable HookRewrite" presumes mocking infrastructure that does not yet exist; no DI container in PowerShell scripts
2. Step 8 test 7 "most critical" with 1-sentence description: criticality is asserted, not auditable
3. Step 11 test 9 negative-assertion guidance: "does NOT appear" requires a closed-world assumption on halt codes
4. Step 2 test 4 ghost-edge: "throws a build error" without specifying message or type
5. Step 6 tests 7–10: assertions listed without failing injection — vacuously pass on incomplete implementation
6. Step 12 Vitest test 1: plan warns "asserting only 'the epoch completes' is insufficient" but does not structure the two required sub-assertions

**Endorsements:** None (Round 1)

---

#### expert-bdd — Round 1

**Position:** Strong test-first discipline with six BDD integrity gaps.

**Reasoning:** The Revision 20 hookKind inversion and halt signal discrimination are well-resolved. Six issues remain that risk test authors producing false-positive assertions or tests that fail to falsify critical properties.

**Objections:**
1. Steps 3/4 test 7: lead phrase "unit-level verification" contradicts D3 ASSUME (multi-intercept is integration-level only)
2. Step 6 test 3: "retryCount UNCHANGED" AND "BDD asserts retryCount=0" are mutually exclusive — test authors have no unambiguous assertion target
3. Step 8 test 11 multi-agent: no Given/When/Then structure; no specification of agent discovery payloads
4. Step 9 content assertions: verify documentation exists, not agent runtime behavior
5. Step 11 test 7: "hookState='idle' throughout" — "throughout" is not implementable as a single assertion
6. Step 12 Pester test 6: timestamp-ordering assertion requires process-level injection; mechanism unspecified

**Endorsements:** None (Round 1)

---

#### expert-continuous-delivery — Round 1

**Position:** Tier structure substantially correct; three assumptions require explicit verification.

**Reasoning:** No hidden circular dependencies. Parallel work within each tier is genuine. Three assumptions embedded in the design are verifiable at Tier 1 completion with near-zero cost.

**Objections:**
1. T3/T4 test isolation: "piping JSON payloads directly" is correct in principle but if any test touches settings.json, it creates a hidden T7 dependency
2. T9 undeclared dependency: six agent role prompt files must exist before T9 executes; not listed in T9's Files section or dependency table
3. T8/T12 transitive coupling: T12 explicitly depends on T5, T7, T11 but silently depends on T6 and T8 via T11→T10→T8→T6; failure triage is harder

**Endorsements:** None (Round 1)

---

#### expert-edge-cases — Round 1

**Position:** Multiple genuine gaps at critical boundaries with silent-failure potential.

**Reasoning:** TLA+ coverage and prior objection resolutions are strong. Five gaps expose failure modes where the system appears to work while internally broken. Additional five are recommended improvements.

**Objections:**
1. Malformed `.psd1` not distinguished from missing file — D10 collapse tests only the missing-file failure mode
2. Edge type erasure — two edges with same node pair but different types silently collapse to a duplicate; no test for this
3. `$Model=NULL` explicitly passed vs. parameter omitted — PowerShell may differ; no test distinguishes
4. D26 rename failure — `.tmp` write succeeds but rename fails — specific test missing
5. `GraphWriteMarkdown` from idle state — no negative test for close hook firing before `GraphStartCollecting`
6. PowerShell alias gap — unlisted aliases bypass hooks silently; `gls`, `gcm`, etc. not enumerated
7. HookState cleanup atomicity — state transitions set sequentially, not atomically
8. `[WARN]` format underspecification — tests assert presence, not format
9. CLAUDE.md file existence verification gap — content inspection vacuously passes if file missing
10. MaxGraphOps off-by-one — no test verifying 3rd operation succeeds AND 4th is disabled

**Endorsements:** None (Round 1)

---

### Round 2

#### expert-tla — Round 2

**Position:** Withdraw Objection 1 (Terminated); maintain Objections 2 and 3.

**Reasoning:** Terminated is a stutter action; S22/S23/S24 cover absorption as named invariants. Objections 2 and 3 remain because intermediate-state visibility and concurrent-path testing are foundational to spec compliance, not optional audits. Expert-bdd's retryCount objection and expert-edge-cases' MaxGraphOps objection are both state-machine boundary issues — endorsed.

**Objections maintained:**
- Objection 2 (force_dedup transient): intermediate state must be directly asserted
- Objection 3 (D27 4-step interleaving): single-trace test required

**Endorsements:**
- expert-bdd Objection 2 (retryCount ambiguity): Safety-property gap at D19 abstraction boundary — endorse completely
- expert-edge-cases Objection 10 (MaxGraphOps off-by-one): State-space boundary error — endorse strongly
- expert-continuous-delivery Objections 1 and 2 (isolation, T9 files): Hidden dependencies are state-machine anti-patterns — endorse principle

---

#### expert-tdd — Round 2

**Position:** Maintain all six objections; five blocking, one recommended.

**Reasoning:** Five objections prevent writing correct failing tests before implementation. Mocking underspecification (Obj 1), missing error signal formats (Obj 4), and incomplete negative assertions (Obj 3) are all specification gaps that block TDD. Expert-continuous-delivery's isolation concern is a deployment issue, not a TDD specification issue — not endorsed.

**Objections rated:**
- Obj 1 (mocking concreteness): Blocking
- Obj 2 (Step 8 test 7): Recommended
- Obj 3 (Step 11 test 9 negatives): Blocking
- Obj 4 (ghost-edge error message): Blocking
- Obj 5 (fail-first signaling): Blocking
- Obj 6 (Step 12 Vitest test 1 substeps): Recommended

**Endorsements:**
- expert-bdd Objection 2 (retryCount): Blocking — ambiguous assertion produces false confidence
- expert-edge-cases Objection 9 (CLAUDE.md existence): Blocking — vacuous assertion is worse than no test
- expert-edge-cases Objection 10 (off-by-one): Blocking — missing positive boundary assertion

---

#### expert-bdd — Round 2

**[expert-bdd: no output in round 2]** — Round 1 positions maintained as final stance.

---

#### expert-continuous-delivery — Round 2

**Position:** All three objections narrowed to non-blocking. Verification gates specified.

**Reasoning:** Tier structure is correct for execution sequencing. Objections are documentation and verification gaps. T3/T4 isolation risk is resolvable via Tier 1 code review. T9 dependency is one-sentence documentation. T8/T12 coupling is a triage note, not a deployment blocker.

**Objections narrowed:**
- Obj 1 (T3/T4 isolation): Non-blocking — code-review gate at Tier 1 completion
- Obj 2 (T9 dependency): Non-blocking — add pre-condition note to Step 9
- Obj 3 (T8/T12 coupling): Non-blocking — documentation-only

**Endorsements:**
- expert-edge-cases Objection 4 (D26 rename failure): Critical deployment reliability concern — endorse
- expert-edge-cases Objection 5 (GraphWriteMarkdown sequencing): Sequencing risk in parallel Tier 3 execution — endorse
- expert-edge-cases Objection 6 (alias gap): Live production miss — endorse as deployment runbook concern

---

#### expert-edge-cases — Round 2

**Position:** Three objections withdrawn as declared abstractions; 3 blocking and 4 recommended remain.

**Reasoning:** O5 ASSUME dissolves edge type erasure. D14 ASSUME prevents GraphWriteMarkdown from idle. D26 serial action model covers atomicity via the Step 12 inter-agent race test. Remaining objections are genuine gaps: three produce silent failures in production; four are test-quality improvements.

**Objections (final):**
- ~~Obj 2 (edge type erasure): Withdrawn~~ — O5 ASSUME is a formal declaration; intentional abstraction
- ~~Obj 5 (GraphWriteMarkdown from idle): Withdrawn~~ — D14 ASSUME structurally prevents this path
- ~~Obj 7 (atomicity): Withdrawn~~ — outside TLA+ scope; D26 serial model; Step 12 test 4 covers race
- Obj 4 (D26 rename failure): **Blocking** — silent CLAUDE.md corruption on partial write
- Obj 9 (CLAUDE.md existence): **Blocking** — vacuous assertion hides broken implementation
- Obj 10 (MaxGraphOps off-by-one): **Blocking** — positive boundary assertion missing
- Obj 1 (malformed .psd1): **Recommended** — D10 collapse tested only for missing-file case
- Obj 3 ($Model=NULL vs omitted): **Recommended** — PowerShell parameter binding edge case
- Obj 6 (alias gap): **Recommended** — production hook miss for unlisted aliases
- Obj 8 ([WARN] format): **Recommended** — format drift risk

**Endorsements:**
- expert-tdd (boundary testing for off-by-one): Endorse — 0/1/max/max+1 discipline is load-bearing
- expert-continuous-delivery (rename failure as deployment risk): Endorse — elevate to critical
- expert-bdd R1 (edge type erasure BDD scenario): Recommend adding BDD scenario "second identical-nodepair edge rejected as duplicate" even if TLA+ abstraction is declared

---

## Metadata

| Field | Value |
|---|---|
| Date | 2026-04-17 |
| Rounds | 2 |
| Result | CONSENSUS_REACHED |
| Experts | expert-tla, expert-tdd, expert-bdd, expert-continuous-delivery, expert-edge-cases |
| Required changes | 10 (R1–R10) |
| Recommended improvements | 9 (Rec1–Rec9) |
| Withdrawn objections | 4 |
| Artifact reviewed | `packages/vibe-cli/docs/token-saving/implementation-plan.md` |
| TLA+ reference | `packages/vibe-cli/docs/token-saving/tla/TokenSaving.tla` (Revision 20) |
