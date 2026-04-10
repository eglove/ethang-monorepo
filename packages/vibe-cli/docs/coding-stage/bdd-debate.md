# BDD Debate Session — Coding Stage (Stage 8)

**Date:** 2026-04-09
**Result:** CONSENSUS_REACHED
**Rounds:** 3
**Experts:** expert-bdd, expert-tdd, expert-edge-cases, expert-ddd

---

## Synthesis — Agreed Recommendation

The BDD scenarios cover the briefing's major features and happy paths well. The domain concepts (Tier, Task, Writer, Ticket, TDD Cycle, Merge Queue, Escalation) are faithfully modeled and the tier-sequential / task-parallel architecture is correctly expressed. However, the experts identified **~25 missing or underspecified scenarios** across four categories: missing edge cases, TDD cycle precision gaps, domain language inconsistencies, and Gherkin structural improvements. All experts converged on the following action items.

### Priority 1 — Must Fix (all experts agree)

1. **Retry fencepost semantics.** Add concrete exact-count scenarios that pin whether `MaxRedRetries=3` means 3 attempts total or 3 retries after the initial attempt. Same for `MaxTddCycles` and `MaxFixRounds`. Example: "Given MaxRedRetries is 3 / When the 3rd retry fails / Then escalation fires" paired with "When the 2nd retry fails / Then a 3rd retry is attempted."

2. **Code-writer-must-not-modify-tests guard.** Add a scenario: "When the code writer response includes changes to test files / Then those changes are rejected and the code writer is re-prompted." This is a fundamental TDD invariant — the RED phase guarantee is void if the code writer can touch tests.

3. **Config name mismatch.** Reconcile `MaxGreenRetries` (in actual `utils/config.ps1`) with `MaxTddCycles` (in BDD scenarios and elicitor briefing). One canonical name must be chosen. Add `MaxMergeRetries`, `MaxRedRetries`, `CleanupPasses`, and `MaxFixRounds` to the config feature scenarios.

4. **Dependency validation within a tier.** Add scenario: "Given T2 depends on T1 / And both are in the same tier / Then the pipeline fails validation before execution with an error identifying the circular/same-tier dependency."

5. **Mini TDD cycle decision protocol.** Specify the structured JSON schema the test writer returns when deciding "test is wrong" vs "code is wrong" during cleanup mini cycles. Add scenarios for each branch and for an unrecognized verdict value.

6. **Worktree lifecycle gaps:**
   - Orphaned worktree recovery on pipeline restart after crash
   - Worktree creation failure for one task in a multi-task tier (partial creation)
   - Explicit cleanup on all exit paths (success, failure, escalation Stop)

### Priority 2 — Should Fix (3+ experts agree)

7. **Invoke-Claude failure handling.** Add scenarios for: truncated/non-JSON response, timeout, empty response, network failure. Distinguish retryable from non-retryable failures.

8. **Verify command failure type distinction.** Differentiate exit code 1 (test failure → retry) from exit code 127/timeout (infrastructure failure → escalate immediately).

9. **Test isolation across worktrees.** Add scenario asserting that concurrent worktree tasks do not share mutable state (temp files, ports, environment variables). A GREEN pass in one worktree must not be a false positive caused by another worktree's side effects.

10. **Tier-transition observable behavior.** Add scenarios that assert observable consequences of tier completion: "Given all tier 1 tasks have merged / When the pipeline advances / Then tier 2 worktrees are created." Bridges the gap between internal domain events and testable behavior.

11. **Cleanup for non-vitest tasks.** Add scenarios showing the cleanup loop for Pester and Playwright tasks. The current scenarios only show cleanup with `pnpm test/lint/tsc`.

12. **Non-convergent cleanup.** Add scenario: "When a cleanup fix introduces a new issue / Then the mini TDD cycle addresses the new issue / And MaxFixRounds still caps the total attempts."

13. **Cascading merge conflicts within a tier.** Add scenario: "Given tasks A, B, C in a tier / And A merges successfully / And B's merge resolution changes files C also touches / When C attempts to merge / Then a new conflict is detected and the merge-resolver handles it."

14. **Merge exhaustion mid-tier state.** Add scenario clarifying: already-merged tasks are preserved, remaining unmerged tasks are skipped, escalation presents full tier state.

15. **Escalation during parallel execution.** Add scenario: "When user selects Stop while parallel tasks are in-flight / Then running tasks are gracefully terminated / And worktrees are preserved for debugging."

### Priority 3 — Recommended (domain quality)

16. **Ubiquitous language fixes:**
    - Rename JSON field `"step"` to `"taskNumber"` (or document the mapping) — fracture between "step" and "T<N>" convention
    - Remove `$Worktrees[1]` PowerShell reference from scenarios — use domain language ("the orchestrator tracks T1's worktree path")
    - Rename "mini TDD cycle" to "remediation cycle" or "fix cycle" — it has different semantics than the main RED-GREEN TDD cycle
    - Define "verdict" as a ubiquitous language term or replace with domain phrasing ("the test writer determines...")

17. **Domain events.** Consider adding TIER_COMPLETED and MERGE_QUEUE_DRAINED as named events in the domain model, with corresponding scenarios that assert their observable consequences.

18. **Anti-corruption layer for worktrees.** Abstract worktree operations behind an `IsolatedWorkspace` concept so domain scenarios don't reference Git primitives. This makes the spec resilient to changes in isolation strategy.

19. **Writer-pair Scenario Outline.** Replace the single "Writer pairs assigned based on best fit" scenario with a Scenario Outline using an Examples table covering all writer combinations (hono-writer/vitest, powershell-writer/pester, ui-writer/playwright, agent-writer/null, typescript-writer/vitest).

20. **already_implemented explicit flow.** Ensure the "already_implemented" verdict → skip GREEN → run cleanup flow has its own end-to-end scenario, not just the verdict step.

21. **Zero-tier plan.** Add scenario: "Given implementation-plan.json has zero tiers / When Stage 8 starts / Then it completes as a no-op."

22. **Unknown writer type.** Add scenario: "Given a task references a non-existent writer agent / Then the pipeline fails with an actionable error before the TDD cycle begins."

23. **Agent-writer output domain naming.** Specify what the `.md` files produced by agent-writer represent in domain terms (agent configuration files? documentation artifacts?).

---

## Per-Expert Final Positions

### expert-bdd
**Final position:** The scenario set covers happy paths well but needs structural improvements (Scenario Outlines for parameterized behavior, concrete fencepost scenarios) and ~6 missing scenarios for flow transitions and failure handling. Dropped general Gherkin style objections as implementable during rewrite rather than debate blockers.

**Key endorsements:** expert-tdd's code-writer-test-guard, expert-edge-cases' worktree partial failure and verify failure distinction, expert-ddd's ubiquitous language fixes and TIER_COMPLETED event.

### expert-tdd
**Final position:** The TDD cycle is faithfully modeled in structure but underspecified at boundaries. The off-by-one ambiguity, missing test isolation guarantees, and absent code-writer-test-modification guard are the highest-risk gaps from a TDD discipline perspective.

**Key endorsements:** expert-edge-cases' fencepost overlap, expert-ddd's verify command naming and mini TDD cycle renaming, expert-bdd's config completeness.

### expert-edge-cases
**Final position:** 10 of original 14 gap areas retained after refinement. Highest-risk gaps: worktree cleanup on crash, cascading merge conflicts, Invoke-Claude failure handling, escalation during parallel execution, and non-convergent cleanup. All addressable with specific scenarios.

**Key endorsements:** expert-tdd's test isolation, expert-ddd's anti-corruption layer, expert-bdd's already_implemented flow.

### expert-ddd
**Final position:** Strong ubiquitous language discipline overall, with specific fractures to fix ("step" vs "task number", "mini TDD cycle" naming, $Worktrees implementation leak, undefined "verdict" term). The worktree lifecycle needs an anti-corruption layer to prevent infrastructure concerns from contaminating domain scenarios.

**Key endorsements:** expert-tdd's code-writer-test-guard as domain invariant, expert-edge-cases' partial worktree creation, expert-bdd's fencepost pinning.

---

## Endorsement Map

| Point | expert-bdd | expert-tdd | expert-edge-cases | expert-ddd |
|---|:---:|:---:|:---:|:---:|
| Retry fencepost | ✓ (raised R2) | ✓ (raised R1) | ✓ (raised R1) | ✓ |
| Code-writer-test-guard | ✓ | ✓ (raised R1) | ✓ | ✓ |
| Config name mismatch | ✓ | ✓ (raised R1) | ✓ | ✓ |
| Dependency validation in tier | ✓ | ✓ | ✓ (raised R1) | ✓ (raised R1) |
| Mini TDD decision protocol | ✓ | ✓ (raised R1) | ✓ | ✓ |
| Worktree lifecycle gaps | ✓ (raised R1) | ✓ | ✓ (raised R1) | ✓ |
| Invoke-Claude failure handling | ✓ (raised R1) | ✓ | ✓ (raised R1) | — |
| Verify failure type distinction | ✓ | — | ✓ (raised R2) | — |
| Test isolation across worktrees | ✓ | ✓ (raised R2) | ✓ | ✓ |
| Tier-transition behavior | ✓ (raised R2) | ✓ | ✓ | ✓ |
| Anti-corruption layer (worktrees) | ✓ | ✓ | ✓ | ✓ (raised R2) |
| Ubiquitous language fixes | ✓ | ✓ | — | ✓ (raised R1) |

---

## Round Transcripts

### Round 1

#### expert-bdd
**Position:** Scenario set covers major features broadly but suffers from stub-only scenarios (~60%), completeness gaps, and Gherkin quality issues.

**Objections:**
1. Stub scenarios must be fully elaborated (~60% are title-only)
2. CleanupPasses and MaxFixRounds missing from config feature
3. No scenario for already_implemented → skip GREEN → cleanup flow transition
4. Writer-pair assignment needs Scenario Outline with Examples table
5. No coverage of empty/timeout/non-JSON Invoke-Claude responses
6. Worktree lifecycle underspecified (creation, naming, cleanup on success, cleanup on failure)

#### expert-tdd
**Position:** TDD cycle structure faithfully captured but has gaps in transition coverage, boundary conditions, and test isolation.

**Objections:**
1. Off-by-one ambiguity in RED retry exhaustion (3 attempts or 3 retries?)
2. GREEN retry context underspecified (full context or just failure output?)
3. No RED verify command parameterization for non-vitest writers
4. Mini TDD cycle decision protocol unspecified (JSON schema, branching)
5. No guard against code writer modifying test files
6. Cleanup verify commands for non-vitest tasks missing
7. Config name mismatch: MaxGreenRetries (actual) vs MaxTddCycles (scenarios)

#### expert-edge-cases
**Position:** Happy paths and explicitly called-out edge cases covered well, but significant gaps in partial-failure recovery, boundary transitions, resource cleanup, and concurrent operation hazards.

**Objections (14 gap areas, ~17 missing scenarios):**
1. Orphaned worktree recovery on crash
2. Worktree creation failure
3. Retry counter boundary fencepost
4. Cascading merge conflicts within a tier
5. Merge exhaustion mid-tier state
6. Invoke-Claude timeout/network failure
7. Concurrent shared lockfile modifications
8. Non-convergent cleanup (fix introduces new issue)
9. Zero tiers in plan
10. Unknown/null writer type
11. State file corruption
12. Escalation during parallel execution
13. Tautological test detection
14. Git branch naming collision

#### expert-ddd
**Position:** Strong ubiquitous language discipline and faithful domain modeling, with several language inconsistencies and two modeling gaps.

**Objections:**
1. "step" vs "task number" naming fracture
2. "verify command" vs concrete commands inconsistent usage
3. Missing TIER_COMPLETED domain event
4. Missing MERGE_QUEUE_DRAINED domain event
5. "Mini TDD cycle" misnamed (different semantics than main TDD)
6. $Worktrees hashtable leaks PowerShell implementation into domain scenarios
7. Agent-writer output role unnamed (what are the .md files?)
8. Invalid schema scenario lacks domain framing
9. Missing dependency validation within tier (intra-tier deps)
10. "Verdict" term introduced without definition in ubiquitous language

### Round 2

#### expert-bdd
Dropped 4 objections (subsumed by other experts). Retained: already_implemented flow, Scenario Outline.

**New objections:** (1) No scenario bridges domain events to observable tier-transition behavior. (2) Fencepost must be pinned with exact-count scenarios.

**Endorsements:** expert-tdd #3, #5, #7; expert-edge-cases #1, #2, #6, #8; expert-ddd #1, #3, #5, #6.

#### expert-tdd
Retained 6 of 7 objections (dropped #3, subsumed by expert-ddd #2).

**New objection:** (8) No test-isolation guarantee across worktrees — concurrent tests could share state, making GREEN a false positive.

**Endorsements:** expert-edge-cases orphaned worktrees, fencepost, tautological tests; expert-ddd verify command naming, mini TDD naming, TIER_COMPLETED, verdict; expert-bdd Invoke-Claude, config.

#### expert-edge-cases
Retained 10 of 14 objections (dropped zero-tiers, tautological tests, unknown writer, branch naming as lower priority or subsumed).

**New objections:** (1) Worktree creation partial failure — T1 succeeds, T2 fails, unclear tier-level state. (2) Verify command failure type distinction — exit code 1 vs 127 need different handling.

**Endorsements:** expert-bdd #2, #3, #5; expert-tdd #1, #4, #5, #6; expert-ddd #3, #6, #9, #10.

#### expert-ddd
Retained all 10 objections.

**New objections:** (11) TDD retry loop lacks domain events for attempt transitions. (12) Worktree lifecycle crosses bounded contexts without anti-corruption layer — needs IsolatedWorkspace abstraction.

**Endorsements:** expert-tdd #1, #4, #5, #7; expert-bdd #1, #3; expert-edge-cases #9, unknown writer.

### Round 3

All four experts reported **"No new objections."** Consensus reached.

---

## Metadata

- **Date:** 2026-04-09
- **Topic:** BDD scenarios for Coding Stage (Stage 8) vs. elicitor briefing
- **Artifact reviewed:** `docs/coding-stage/bdd.feature`
- **Briefing source:** `docs/coding-stage/elicitor.md`
- **Experts selected:** expert-bdd, expert-tdd, expert-edge-cases, expert-ddd
- **Selection rationale:** BDD scenario review (expert-bdd), TDD cycle accuracy (expert-tdd), failure mode coverage (expert-edge-cases), domain modeling quality (expert-ddd)
- **Rounds completed:** 3
- **Result:** CONSENSUS_REACHED
