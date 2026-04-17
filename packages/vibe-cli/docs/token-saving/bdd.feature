# BDD Scenarios — Token Saving
# Date: 2026-04-17
# Source: docs/token-saving/elicitor.md
# Revision: R17 — Addresses 13 debate objections from unified-debate.md (fourteenth session)
#   Changes from R16 (13 objections from fourteenth debate session):
#   - [OBJ-1] S25 negative-path scenario: added D31 cross-reference Feature-level annotation
#     following the L11 annotation pattern — declares the MaxAgents=3 assertion is outside the
#     TLC-verified envelope and supplies the integration-test obligation anchor text.
#   - [OBJ-2] hookPreOutputCrash Then steps (es-hook and rg-hook): removed TLA+ formula syntax
#     from inline comments (S3 invariant parenthetical). Replaced with plain-English prose and
#     ASSUME declaration index cross-references only.
#   - [OBJ-3] Added hookKind {"none","es","rg"} BDD glossary entry: full definition of the
#     three-value enum, assignment semantics, relationship to hookState, and S28 cross-reference.
#     The hook subsystem bounded context is now complete without TLA+ being required.
#   - [OBJ-4] Added pipelineState "idle" exclusion note: "idle" is a TLA+ initialization artifact
#     and is NOT a domain-observable pipeline state, mirroring D24 treatment for inputRole=NULL.
#   - [OBJ-5] Updated retryCount glossary: (a) fixed "two distinct code paths" to three reset sites
#     with explicit enumeration; (b) added FORCE-DEDUP TRIGGER PREDICATE specifying the exact
#     comparison (retryCount >= MaxRetries) and the reset value (0) at each of the three reset sites.
#   - [OBJ-6] WRONG hook order scenario: added concrete automatable observable specification —
#     the hook-execution log IS the test-harness observable; both expected log entries identified.
#   - [OBJ-7] D21 liveness bound integration-test obligation: named the concrete test-harness
#     event constituting "control returned" — the PostToolUse event. Specified that an integration
#     test MUST assert hookRewritten=TRUE in the audit log BEFORE the PostToolUse event fires.
#   - [OBJ-8] E2E triple-failure factory steps: fixed slash-notation ambiguity by adding mandatory
#     state-assertion checkpoint after the two AND-chained Given steps.
#   - [OBJ-9] Added MaxRetries=1 boundary scenario: MaxRetries=1, first duplicate detected (no
#     force-dedup), second failure triggers force-dedup. Covers the critical off-by-one boundary.
#   - [OBJ-10] Added rg-rewritten path token node validity rule to glossary (Node identity entry)
#     and added standalone scenario: raw rg output token "src/foo.ts:42:keyword" fails node
#     identity validation. Closes the rg-output cross-subsystem node identity gap.
#   - [OBJ-11] GraphHaltCleanup halt-during-write: split the existing ambiguous scenario
#     (markdownState="stale" or "current") into two standalone scenarios with explicit markdownState
#     assertions in each Then clause.
#   - [OBJ-12] Added hook matching level glossary entry: states that hooks match on surface token
#     (not resolved cmdlet); every new PowerShell alias not enumerated in the hook script is a gap.
#   - [OBJ-13] Added S38 WritingAgentsCompletedBound boundary scenario: agentsCompleted=MaxAgents-1
#     entering writing state confirms agentsCompleted < MaxAgents invariant at the boundary.
#
# Revision: R16 — Addresses 16 blocking objections from unified-debate.md (twelfth session)
#   Changes from R15 (16 objections from twelfth debate session):
#   - [OBJ-1] Fixed hookPreOutputCrash Then steps (es-hook ~line 598, rg-hook ~line 683):
#     decomposed embedded TLA+ parenthetical explanations after em-dashes into separate
#     comment lines. Step text is now unambiguously automatable; the explanation is a comment,
#     not an assertion obligation. Both hooks fixed. Same defect class as B-6 (R15).
#   - [OBJ-2] Added routingState="validating" intermediate state: (1) added "validating" to
#     routingState glossary entry with L11 integration-test obligation note; (2) added L11
#     integration-test obligation note to Model Routing Feature header, analogous to the
#     B8-10/L9 pattern for "resolving". The L11 gap was previously unanchored at the BDD level.
#   - [OBJ-3] Resolved D19 StillDuplicate retryCount dual-truth in GraphRetryNodeStillDuplicate
#     and GraphRetryEdgeStillDuplicate scenarios. Added explicit RESOLUTION block: step
#     definitions MUST assert retryCount=0 (BDD observable contract); integration tests MUST
#     additionally verify D19 shared-budget semantics. Both assertions required; not contradictory.
#     Previous annotation identified the divergence but left step-definition authors without a
#     definitive assertion target.
#   - [OBJ-4] Added new Feature "Pipeline cannot reach done state while agentsCompleted is less
#     than MaxAgents — S25 negative path" with a named scenario seeding agentsCompleted=1,
#     MaxAgents=3 and asserting pipelineState="running" (NOT "done"). Provides the D31 S25
#     compensating integration test with an implementable BDD target.
#   - [OBJ-5] Fixed pipelineState glossary 'iff': decomposed biconditional into TWO DIRECTIONS
#     with explicit semantics — safety direction (instantaneous IMPLIES) vs. liveness direction
#     (LEADS-TO requiring SF fairness). "iff" conflated these; correct framing prevents step-
#     definition authors from treating liveness as an instantaneous safety invariant.
#   - [OBJ-6] Added "MaxGraphOps=0 zero-budget epoch" scenario to Knowledge Graph Duplicate
#     Detection Feature: every add-operation is immediately silently disabled; every epoch
#     produces an empty write; no node or edge is ever accepted. Silent misconfiguration with
#     no prior BDD regression protection.
#   - [OBJ-7] Added "MaxRetries=0 zero-retries configuration" scenario to Knowledge Graph
#     Duplicate Detection Feature: first duplicate immediately triggers force-dedup with no
#     agent notification. Silent misconfiguration with no prior BDD regression protection.
#   - [OBJ-8] Added "D18 crash-and-restart recovery" named scenario to Knowledge Graph Error
#     Handling Feature: crash after epoch 1 close hook succeeds; verify CLAUDE.md from epoch 1
#     persists and the recovery contract is explicitly tested. D18 compensating test obligation
#     was previously declared at category level only, with no named scenario target.
#   - [OBJ-9] Added "D32 single-node self-loop forced exhaustion via StillDuplicate alone"
#     scenario to Knowledge Graph Duplicate Detection Feature. D32 TLC-verified at model level;
#     BDD observable was previously unanchored. Step definitions must verify inherited D19
#     budget semantics and force-dedup fires after MaxRetries+1 total failures.
#   - [OBJ-10] Added "MaxGraphOps boundary with active dedup cycle" combined scenario: dedup
#     resolves successfully when graphOpsCount=MaxGraphOps; subsequent add-operations silently
#     disabled. Combined dual-silent-failure path with no prior BDD coverage.
#   - [OBJ-11] Added liveness bound assertion ("hook completes and rewrite is confirmed before
#     the tool call returns control to the agent") to D21 hook intercept scenarios — both es-hook
#     "Hook rewrites find to es" and rg-hook "Hook rewrites grep to rg". Prior scenarios asserted
#     functional outcomes only; no step asserted the within-event liveness bound.
#   - [OBJ-12] Added state-assertion checkpoint ("And the seeded state is verified: graphState=...
#     before the When step executes") to all four factory Given Scenario Outlines: node-fix,
#     edge-fix, node-resubmit, edge-resubmit. Silent seeding failure previously produced
#     false-positive rows with no detectable failure at the Given boundary.
#   - [OBJ-13] Added hookState reset verification to D3 sequential hook scenarios (both es-hook
#     and rg-hook): added comment block specifying the observable (two independent hook-execution
#     log entries per PreToolUse event) and added And step asserting two independent entries.
#     Step definitions now have an unambiguous automation target for the reset observable.
#   - [OBJ-14] Applied B8-1 Scenario Outline discipline to Hook Deployment Infrastructure
#     Feature: consolidated 10 structurally identical scenarios (5 parallel pairs differing only
#     by hook name) into 5 Scenario Outlines with 2-row Examples tables (es-hook.ps1 / rg-hook.ps1).
#     Each row is independently runnable; no row depends on another.
#   - [OBJ-15] Added S32/S37 cross-reference to pipelineState glossary entry: the sequencing
#     invariant "next pipeline stage MUST NOT begin before close hook completes" is anchored by
#     TLA+ S32 and S37. Previously declared in Knowledge Graph Feature context only; now
#     cross-referenced at the pipelineState glossary level to prevent future developers from
#     missing the pipeline-orchestration anchor.
#   - [OBJ-16] Added two scenarios (GraphRetryNodeSuccess and GraphRetryEdgeSuccess) anchoring
#     the retrying→building→collecting D7 transition path. Prior BDD covered GraphNodeBuildSuccess
#     from factory steps bypassing the retrying state; this scenario explicitly seeds
#     graphState="retrying" and asserts the D7-path transition at the step-definition level.
#
# Revision: R15 — Addresses blocking objections B-1 through B-6 from unified-debate.md (eleventh session)
#   Changes from R14 (unified-debate B-1 through B-6):
#   - [B-1] Added "retryCount is reset to 0" Then assertion to the mid-pipeline GraphWriteFail ELSE
#     branch scenario (B9). TLA+ GraphWriteFail sets retryCount'=0 in BOTH the terminal IF branch
#     (graphState→"warn") and the mid-pipeline ELSE branch (graphState→"collecting"). The epoch-boundary
#     retryCount reset was previously verified for the terminal IF branch only; the ELSE branch reset
#     was unverified by BDD. (1 expert blocking: expert-tla)
#   - [B-2] Added explicit D14-negative clarification to the addEdge-when-graphNodes={} scenario
#     comment. D14 (GraphWriteMarkdownRequiresCollecting) does NOT establish the graphNodes /= {}
#     guard on GraphAddEdge; D14 governs graphState guard sequencing for GraphWriteMarkdown only.
#     The correct source is the GraphAddEdge O2 fix (TLA+ ~line 1420). "D14" did not appear in the
#     R14 file text but the correct positive reference was not contrasted against D14, leaving the
#     cross-document audit chain ambiguous. Added explicit negative to foreclose future confusion.
#     (1 expert blocking: expert-bdd — factual cross-reference error)
#   - [B-3] Added GraphWriteSuccess ELSE branch scenario (symmetric partner to B9 GraphWriteFail ELSE):
#     with MaxAgents=3 and agentsCompleted=1, a successful mid-pipeline close hook must return
#     graphState to "collecting" (NOT "done"). The primary positive multi-agent scenario was absent
#     from R14; only the failure ELSE branch (B9) was covered. (1 expert blocking: expert-tdd)
#   - [B-4] Added dedicated multi-agent monotone scenario anchoring S30/S31 (GraphNodesMonotone,
#     GraphEdgesMonotone): seeds a two-epoch pipeline and asserts that graphNodes/graphEdges from
#     epoch 1 are still present after epoch 2. D31 lists compensating integration tests for these
#     TLC-unverified properties (MaxAgents=1 in .cfg); this BDD scenario provides the target anchor
#     for those integration tests. (1 expert blocking: expert-bdd)
#   - [B-5] Added bare-filename rejection scenario to Knowledge Graph Node Management Feature: passes
#     a bare filename "vibe.ps1" (no directory prefix) to .addNode() and asserts a build error. The
#     glossary declares bare filenames NOT valid node identities; no negative BDD test existed to
#     prevent regression. (1 expert blocking: expert-ddd)
#   - [B-6] Decomposed E2E triple-failure Then clauses: removed all inline TLA+ state notation
#     parentheticals — (routingState=error, pipelineState=halted), (graphState=warn), (hookState=error)
#     — from Then/And step text. Each state assertion is now a separate And step with an unambiguous
#     automation obligation. Step definition authors previously could not determine whether parentheticals
#     were implementation comments or assertion obligations. (1 expert blocking: expert-bdd)
#
#   Changes from R13 (unified-debate B8-1 through B8-14):
#   - [B4] Fixed factual cross-reference in Argument-translation equivalence contract glossary entry:
#     replaced "T8-9 candidate — CommandTokenRewriteOnlyIsDeclaredAbstraction" with the formally
#     registered designation "D33 — CommandTokenRewriteOnlyIsDeclaredAbstraction". D33 was registered
#     in TLA+ Revision 15; the interim "T8-9 candidate" label no longer exists. Restores the ASSUME
#     discipline auditability chain. (3 experts blocking: expert-bdd, expert-tdd, expert-ddd)
#   - [B5] Clarified agentsCompleted glossary entry to explicitly exclude GraphHaltCleanup abort path.
#     The prior definition "regardless of success or failure" correctly covered GraphWriteSuccess and
#     GraphWriteFail but could be misread to include GraphHaltCleanup, which does NOT increment
#     agentsCompleted (TLA+: agentsCompleted ∈ UNCHANGED for GraphHaltCleanup). Added explicit
#     IMPORTANT EXCLUSION paragraph. (2 experts blocking: expert-edge-cases, expert-ddd)
#   - [B7] Added scenario: GraphHaltCleanup with markdownState="current" — markdownState stays "current"
#     on pipeline abort. All prior GraphHaltCleanup scenarios seeded markdownState at "none" or "stale".
#     This scenario seeds markdownState="current" and asserts the observable distinction from
#     GraphWriteFail: GraphHaltCleanup leaves markdownState UNCHANGED (TLA+ S33 UNCHANGED), while
#     GraphWriteFail transitions current→stale. Without this scenario, a regression confusing these
#     two paths would pass all existing BDD scenarios. (1 expert blocking: expert-ddd)
#   - [B9] Added scenario: mid-pipeline GraphWriteFail returns graphState to "collecting" — not "warn".
#     Seeded with MaxAgents=3, agentsCompleted=1. Exercises the GraphWriteFail ELSE branch
#     (agentsCompleted+1 < MaxAgents → graphState="collecting") distinct from the final-agent IF
#     branch (→"warn"). Tagged with D31 TLC-unverified note: the ELSE branch requires MaxAgents>=2
#     and was not verified by TLC in the published model run (MaxAgents=1 in .cfg). Verified by
#     integration tests only. (2 experts blocking: expert-tla, expert-ddd)
#   Changes from prior revision (R12, unified-debate B1–B7):
#   - [B8-1] Replaced 6 structurally identical system prompt scenarios (one per role, lines 1562–1600
#     in prior revision) with a single Scenario Outline with a 6-row Examples table. Consistent
#     with the Scenario Outline discipline applied to node-fix, edge-fix, and resubmit outlines
#     elsewhere in this file. Each row is independently runnable.
#   - [B8-2] Added explicit hookState assertion to both hookPreOutputCrash scenarios (es-hook and
#     rg-hook): Then clause now asserts hookState does NOT transition to "error" — hookRewritten=FALSE
#     in this failure mode means the S3 invariant (hookState="error" => hookRewritten=TRUE) is not
#     violated; hookState remains "idle". Distinguishes hookPreOutputCrash observably from hookState=error.
#   - [B8-3] Added negative scenario for wrong hook registration order (rg-hook before es-hook): a
#     piped command "find ... | grep ..." is silently rewritten by rg (wrong tool) with no error or
#     warning surfaced. Added to Hook Ordering Feature as the counterpart to the positive ordering test.
#   - [B8-4] Added D27 BDD scenario (new Feature: "Hook rewrite can complete after pipelineState
#     transitions to 'halted'"): pipeline halts due to routing failure while hook rewrite is in-flight;
#     hook rewrite completes; pipelineState="halted" ∧ hookState="done" are jointly absorbing.
#     Closes the TLA+ D27 cross-document coverage gap identified in unified-debate B8-4.
#   - [B8-5] Fixed "Close hook fires exactly once" scenario: removed ambiguous data table with
#     prose-string session references ("session 1", "session 2"). Replaced with two explicit
#     standalone scenarios (one per agent session) whose Given/When/Then steps have unambiguous
#     column-binding for step definition authors.
#   - [B8-6] Added standalone graphOpsCount epoch-end reset scenario: seeded at graphOpsCount=2
#     with MaxGraphOps=3 (budget not exhausted) and retryCount=0 (no dedup cycle). Asserts
#     graphOpsCount resets to 0 at epoch close (GraphWriteSuccess/GraphWriteFail), independently
#     of retryCount behavior. Prior BDD only asserted graphOpsCount=0 as a secondary Then clause
#     embedded in the retryCount epoch-end reset scenario.
#   - [B8-7] Added close-hook sequencing negative test: specifies the detectable observable for a
#     sequencing violation — a next-stage-start log entry appears in the pipeline log (stdout) with
#     a timestamp BEFORE the close hook process exit timestamp. Without this negative path, the
#     positive sequencing assertion cannot be automated as a failing test.
#   - [B8-8] Added final-agent close hook producing graphState="done" scenario: the last agent's
#     close hook succeeds, agentsCompleted reaches MaxAgents, graphState transitions to "done" (not
#     "collecting"). Covers TLA+ GraphWriteSuccess terminal branch: agentsCompleted+1 >= MaxAgents.
#   - [B8-9] Added addEdge with graphNodes={} (entirely empty graph) boundary scenario: when no
#     nodes have been accepted into graphNodes, GraphAddEdge is silently disabled by its guard
#     (graphNodes /= {}). The call completes without error; no edge is recorded; no notification
#     sent. Distinct from the missing-endpoint scenarios that test non-empty graphNodes.
#   - [B8-10] Added routingState="resolving" integration-test obligation note to the Model Routing
#     Feature header: analogous to the D21 pattern on hook intercept scenarios. TLA+ L9
#     (ResolvingLeadsToInvokingOrError) closes the deadlock gap; BDD cannot assert the intermediate
#     directly. Integration tests must verify resolving always advances to invoking or error.
#   - [B8-11] Split former "Hook Registration" Feature by bounded context into two Features:
#     (1) "Hook Configuration Contracts" Feature — behavioral domain invariants (registration
#     existence, ordering contract). (2) "Hook Deployment Infrastructure" Feature — deployment
#     partial-state failures and schema misconfiguration, with explicit note that these have no
#     TLA+ counterpart (analogous to D11 for hookPreOutputCrash and closeHookTimeout).
#   - [B8-12] Added glossary entries disambiguating "build succeeds/fails": "Graph build
#     success/failure" (TLA+-modeled GraphNodeBuildSuccess/GraphEdgeBuildSuccess and duplicate-
#     detected events) vs. "tsx build success/failure" (tsx compilation outcomes, out of TLA+ scope).
#     Prevents step-definition authors from conflating the two contexts in test code.
#   - [B8-13] Added aggregate invariant scenario (markdownState="current" implies agentsCompleted>=1
#     and most recent close hook succeeded). No prior BDD scenario asserted the full conjunction;
#     individual arc scenarios existed but did not compose the aggregate invariant.
#   - [B8-14] Added "Argument-translation equivalence contract" glossary entry: "equivalent arguments"
#     in hook rewrite scenarios is declared as an abstraction boundary. A hook that rewrites the
#     command token but drops flags passes all token-check BDD assertions. Argument mapping is
#     unmodeled in TLA+ (T8-9 ASSUME candidate) and enforced by integration tests only.
#
#   Changes from prior revision (R11, third debate session 2026-04-17):
#   - Added scenario: pipeline with no search commands completes normally (hookState="idle" at
#     PipelineComplete) — closes D22 BDD coverage gap [B1]
#   - Added scenario: pipeline halts while graphState="writing" (GraphHaltCleanup writing-entry
#     case, TLA+ S33 generalized in Revision 12) [B2]
#   - Added glossary entry: "epoch" — one agent session = one epoch; MaxGraphOps-bounded collection
#     phase ending when the close hook fires; retryCount reset semantics anchored here [B3]
#   - Added glossary entry: "MaxAgents" — maximum number of agents; graph reaches "done" when
#     agentsCompleted = MaxAgents; cardinality anchor for pipeline termination condition [B4]
#   - Updated "Agent session ends" glossary entry to explicitly state that one agent session
#     constitutes exactly one epoch, anchoring both retryCount reset sites [B5]
#   - Added row {before:0, after:1} to "Agent re-submits duplicate without fix" Scenario Outline —
#     tests the first GraphRetry firing (retryCount increment 0→1) [B6]
#   - Added scenario: explicit model override to the same value as the centralized mapping resolves
#     (identity override, e.g., Role "reviewer" with Model "haiku") [B7]
#
#   Changes from prior revision (R10, second debate session 2026-04-17):
#   - GraphRetryNodeStillDuplicate: added "retryCount value of 0" Then assertion for new duplicate path
#     (BDD glossary: retryCount=0 at dedup_error entry for the new path; TLA+ carries prior count but
#     new path starts fresh cycle — BDD models the observable per-path behavior per the glossary contract)
#   - GraphRetryEdgeStillDuplicate: added "retryCount value of 0" Then assertion for replacement edge
#     (same rationale as node case above)
#   - MaxGraphOps scenario: rewrote Then steps to match TLA+ actual behavior (silent disable via guard
#     conditions on GraphAddNode/GraphAddEdge); removed "internally consistent" and conditional
#     "if rejected or triggers an epoch reset" language; updated glossary to remove TBD
#   - E2E triple-failure Given steps: refactored to factory Given steps ("a pipeline run seeded with
#     hookState=error / graphState=warn from a prior agent invocation") matching the dedup factory step
#     pattern; removed multi-line prose with embedded parenthetical narratives
#   - Added 5 rg-hook deployment partial-state scenarios (entry-exists/script-absent;
#     script-exists/entry-absent; incorrect matcher; wrong-case tool-name; invalid script path),
#     matching the 5 es-hook scenarios that already existed
#   - hookPreOutputCrash (es-hook and rg-hook): added Then clause specifying pipeline state
#     ("the pipeline continues after surfacing the hook error to the agent")
#   - Added hook registration order scenario: es-hook entry appears before rg-hook in settings.json
#   - Added inter-hook evaluation contract scenario: rg-hook receives the rewritten command from
#     es-hook, not the original command (sequential evaluation model)
#   - E2E triple-failure Then clauses: replaced "pipeline run state" references (undefined domain term)
#     with concrete observable assertions (pipeline log entries and agent context); added glossary entry
#     for "pipeline run state" with a concrete, observable definition
#   - Added scenario: config mapping entry resolves to model string not in {opus, sonnet, haiku}
#   - Added scenario: explicit Model override parameter value outside valid model enum
#   - Force-dedup language: replaced "removed from the graph" with "discarded — never accepted into
#     graphNodes/graphEdges" (TLA+ GraphForceDedup sets pendingNode/Edge to NULL; they were in pending
#     state, never committed to graphNodes/graphEdges)
#   - Typed-wrapper delegation: added explicit file path, enumerated all 12 delegated scenarios by
#     name, added minimum coverage assertion
#   - Added scenario: stale→stale→current arc (two consecutive write failures with prior CLAUDE.md
#     persisting as stale through both; regression test for R11 TLA+ bug fix)
#   - Added scenario: atomic write temp-file rename failure (distinct from crash-during-write: temp
#     file written successfully, rename step fails; prior CLAUDE.md intact, temp file persists on disk)
#   - Added glossary entry: closeHookTimeout (canonical term for tsx hang/timeout failure mode)
#   - Force-dedup [WARN] logging assertions: added TLA+ scope note (behavior not modeled in TLA+ formal
#     spec; verified by integration tests only), matching the callouts for hookPreOutputCrash and tsx hang
#   - "Agent fixes duplicate edge" scenario: added Then clause asserting retryCount=0 after successful
#     build (TLA+ GraphEdgeBuildSuccess sets retryCount'=0); also added to node fix scenario outline
#   - "Seeded at force-dedup trigger state" factory step: added glossary entry clarifying it means
#     graphState='dedup_error' ∧ retryCount=MaxRetries (force-dedup NOT yet fired)
#   - Added scenario: command ambiguous between file-search and text-search (find piped to grep);
#     asserts es-hook takes precedence by evaluation order, no double-rewrite
#   - Bare filenames in CLAUDE.md output scenarios fixed to full paths throughout (node identity rule:
#     full path only per glossary); affects close-hook output scenarios, error-handling scenarios, E2E
#   - Epoch-boundary reset scenario: split into two independent scenarios covering distinct TLA+ code
#     paths — (1) GraphAfterForceDedup intra-epoch reset (graphState force_dedup→collecting), and (2)
#     GraphWriteSuccess/GraphWriteFail epoch-end reset seeded at mid-cycle retryCount=2 (no force-dedup)
#   - Added scenario: explicit Model override with invalid value halts the pipeline
#
# Glossary — Ubiquitous Language
#   Model routing          — centralized mapping from pipeline role to Claude model, enforced at every Invoke-Claude call
#   Role                   — validated enum: elicitor, doc-writer, expert, moderator, reviewer, code-writer
#   Model mapping          — config/model-routing.psd1 PowerShell data file mapping each role to a model name
#   Valid model enum       — the set of accepted model strings: {opus, sonnet, haiku}. Any resolved or override
#                            model value outside this set (e.g., "gpt-4", "claude-opus-99") halts the pipeline.
#                            TLA+ ResolveModel guards: resolvedModel ∈ Models before invoking the Claude CLI.
#   Everything CLI (es)    — external search tool replacing find/ls/dir/Get-ChildItem/gci via PreToolUse hook
#   ripgrep (rg)           — external search tool replacing grep/egrep/fgrep/Select-String/sls via PreToolUse hook
#   PreToolUse hook        — Claude Code hook that fires before Bash/PowerShell tool execution, can rewrite commands
#   es-hook                — .claude/hooks/es-hook.ps1, rewrites file-search commands to es
#   rg-hook                — .claude/hooks/rg-hook.ps1, rewrites text-search commands to rg
#   Hook evaluation order  — the order in which PreToolUse hooks are evaluated for a given tool call, determined
#                            by array index in the "hooks" array in .claude/settings.json. Earlier array index
#                            means earlier evaluation. es-hook MUST appear before rg-hook in the array.
#   Sequential evaluation  — the hook evaluation model: hooks are evaluated in settings.json array order; each
#                            hook in the sequence receives the command as output by the previous hook. If es-hook
#                            rewrites "find ..." to "es ...", rg-hook receives "es ..." as its input — not the
#                            original "find ..." command.
#   Hook matching level    — [OBJ-12] PreToolUse hooks match on the SURFACE TOKEN of the command as
#                            issued by the agent — the literal text of the tool call as it arrives
#                            at the hook runner, BEFORE any shell alias expansion or PowerShell
#                            cmdlet resolution. A hook entry matching "Get-ChildItem" will NOT
#                            intercept a command issued as "gci" (the built-in alias) unless "gci"
#                            is explicitly enumerated as a separate match pattern in the hook script.
#                            Similarly, "Select-String" matching does not intercept "sls" unless
#                            "sls" is also listed. Every new PowerShell alias for a matched cmdlet
#                            that is NOT also listed in the hook's match patterns is a systematic
#                            coverage gap: agents using that alias bypass the hook entirely. The
#                            match sets MUST explicitly enumerate every alias form in use: es-hook
#                            enumerates {find, ls, dir, Get-ChildItem, gci}; rg-hook enumerates
#                            {grep, egrep, fgrep, Select-String, sls}. Any alias form not in the
#                            enumeration is an unmatched surface token that silently bypasses rewrite.
#   Hook-execution log     — the ordered list of hook names evaluated for a given PreToolUse event, written to
#                            Claude Code hook diagnostics output (stderr of the hook runner). Each entry is a line
#                            of the form: "[hook] <name> evaluated | result: <match|no-match|rewrite>".
#   hookState=error        — terminal condition where the PreToolUse es/rg search hook execution failed AFTER
#                            successfully rewriting the command (TLA+ HookExecuteFail action, state transition
#                            "rewriting" → "error"). The rewritten "es" or "rg" command fails at runtime; the
#                            error is surfaced to the agent as-is with no fallback to the original command.
#                            hookState=error does not prevent pipeline completion — the pipeline still reaches
#                            its terminal "done" state once routing and graph subsystems complete (TLA+ L7).
#                            DISTINCT from graphState=warn: hookState tracks the PreToolUse search hook
#                            state machine; graphState tracks the knowledge graph / close hook state machine.
#   hookPreOutputCrash     — failure mode where the hook script (es-hook.ps1 or rg-hook.ps1) exits with a
#                            non-zero code BEFORE producing any output to stdout (hookRewritten=FALSE). No rewrite
#                            occurs; the original command does not execute. The pipeline continues after the hook
#                            error is surfaced to the agent. DISTINCT from hookState=error: in hookState=error,
#                            the rewrite SUCCEEDED (hookRewritten=TRUE) but the rewritten command failed at
#                            runtime. hookPreOutputCrash has hookRewritten=FALSE and falls OUTSIDE the TLA+
#                            verification scope (TLA+ HookExecuteFail requires hookRewritten=TRUE and cannot
#                            model a pre-output crash). No corresponding TLA+ action exists for this failure mode.
#   hookKind               — [OBJ-3] the three-value enum tracking which hook kind matched for a given
#                            PreToolUse event: "none" (no hook has matched the command), "es" (the
#                            es-hook matched and rewrote the command to use Everything CLI), or "rg"
#                            (the rg-hook matched and rewrote the command to use ripgrep). hookKind
#                            is assigned during hook evaluation and determines which rewrite path
#                            executes (D15 hook enumeration). Relationship to hookState: hookKind
#                            records WHICH hook matched (or "none" if no hook matched); hookState
#                            records the lifecycle state of the match (idle → intercepting → rewriting
#                            → done | error). Hook evaluation order: es-hook evaluates first; if it
#                            matches, hookKind="es" and rg-hook receives the rewritten command. If
#                            es-hook does not match, rg-hook evaluates the original command and may
#                            set hookKind="rg". If neither matches, hookKind remains "none". TLA+
#                            invariant S28 (HookKindConsistent): hookState="done" IMPLIES hookKind ∈
#                            {"es","rg"} — a completed hook rewrite always has a non-"none" kind.
#                            hookKind is the primary observable for identifying which hook acted on a
#                            given command and is reported in the hook-execution log entry format:
#                            "[hook] <es-hook|rg-hook> evaluated | result: <match|no-match|rewrite>".
#   closeHookTimeout       — the maximum duration the close hook allows for "tsx graph/index.ts" to run before
#                            forcibly terminating the process. If the tsx process does not exit within this
#                            duration, the close hook terminates it, writes a [WARN] to the pipeline log (stdout),
#                            and continues to the next pipeline stage. The stale CLAUDE.md from the prior
#                            successful build persists unchanged. OUTSIDE TLA+ scope: no GraphTimeout or close-hook
#                            timeout action exists in the TLA+ model. Behavioral correctness verified by
#                            integration tests only, not by the formal model.
#   graphState=warn        — terminal condition for the knowledge graph state machine where a close-hook failure
#                            occurred with a non-duplicate error. TWO production sites:
#                            (1) TLA+ GraphWriteFail action — non-duplicate compilation failure during tsx execution.
#                            (2) TLA+ GraphHaltCleanup action — pipeline-abort before any write completes (e.g.,
#                            pipeline halts while the close hook is in-flight or before it begins in an abort path).
#                            NOTE: D12 formally documents that both production sites resolve to graphState=warn;
#                            the glossary here reflects D12 and supersedes any prior definition that listed only
#                            GraphWriteFail. In both cases: the pipeline continues with a [WARN] log entry to
#                            stdout; the stale CLAUDE.md from the prior successful build persists unchanged until
#                            the next successful close hook run. DISTINCT from hookState=error.
#   Pipeline run state     — the observable record of subsystem outcomes during a pipeline run. Observable via
#                            TWO channels: (1) the pipeline log (stdout) — receives [WARN] entries for
#                            close-hook failures (graphState=warn) and routing failures (routingState=error),
#                            and force-dedup entries; (2) the agent context — receives hook execution errors
#                            (hookState=error) surfaced directly to the agent. "Pipeline run state" has no
#                            separate persistence mechanism beyond these two channels. Step definitions
#                            implementing assertions about "pipeline run state" must check the appropriate
#                            channel per failure mode.
#   Knowledge graph        — TypeScript DirectedGraph at packages/vibe-cli/graph/ tracking codebase structure
#   Node                   — graph vertex: app, package, component, function, or file (expandable)
#   Edge                   — graph relationship: calls, imports, exports, depends_on, contains, tested_by, test_for
#   Self-loop edge         — an edge whose source and target are the same node (<<p,p>>); valid input, subject
#                            to the same dedup rules as any other edge
#   Node identity          — full path only; /dir1/file and /dir2/file are distinct; /dir/file registered twice is a
#                            duplicate regardless of type — same path with different types is still a duplicate.
#                            Bare filenames without a directory prefix are NOT valid node identities.
#                            RG OUTPUT FORMAT (OBJ-10): rg output tokens in the format
#                            "src/foo.ts:42:keyword" (file:line:content) are NOT valid node
#                            identities. The colon-delimited line number and content suffix make the
#                            token invalid as a pure file path. Agents using rg output to discover
#                            nodes MUST extract only the file path portion (before the first colon)
#                            and then separately verify that the extracted path contains a directory
#                            separator before using it as a node id. Passing a raw rg output token
#                            directly to .addNode() MUST produce a build error. This rule closes the
#                            cross-subsystem gap between the rg-hook rewrite and graph node ingestion.
#   Close hook             — per-agent hook that runs tsx graph/index.ts to rebuild CLAUDE.md after agent finishes
#   Agent session ends     — the moment Invoke-Claude returns; specifically, the Claude CLI process launched by
#                            Invoke-Claude exits. This is the gate event that triggers the per-agent close hook.
#                            The next pipeline stage MUST NOT begin before the close hook completes.
#                            EPOCH EQUIVALENCE: one agent session constitutes exactly one epoch. The agent
#                            session ending IS the epoch boundary. retryCount resets at epoch-end
#                            (GraphWriteSuccess/GraphWriteFail) are triggered by the agent session ending;
#                            retryCount resets mid-epoch (GraphAfterForceDedup) occur before the session ends.
#   Epoch                  — the collection phase for a single agent session. Bounded by MaxGraphOps
#                            add-operations. Ends when the agent session ends and the close hook fires
#                            (GraphWriteSuccess or GraphWriteFail). ONE AGENT SESSION = ONE EPOCH: these
#                            are the same event boundary, not two separate concepts. retryCount has two
#                            reset sites relative to an epoch: (1) intra-epoch reset via GraphAfterForceDedup
#                            (fires within the dedup state machine; the session has not yet ended); (2)
#                            epoch-end reset via GraphWriteSuccess/GraphWriteFail (fires when the session
#                            ends and the close hook completes). graphOpsCount also resets to 0 at epoch-end.
#   MaxAgents              — the maximum number of agents in the pipeline. Each agent's close hook
#                            increments agentsCompleted by 1. The graph subsystem reaches its "done"
#                            terminal state when agentsCompleted = MaxAgents (all agents have completed
#                            their close hooks). Defined analogously to MaxRetries and MaxGraphOps.
#                            Provides the cardinality anchor for the pipeline termination condition:
#                            "all agents complete their close hooks" is formally bounded by MaxAgents.
#   Force-dedup            — after MaxRetries failed retries, discard the pending duplicate (it was never accepted
#                            into graphNodes/graphEdges — TLA+ GraphForceDedup sets pendingNode/Edge to NULL),
#                            log the dropped path to the pipeline log, and continue pipeline
#   MaxRetries             — the maximum number of error messages sent to an agent for the same duplicate before
#                            force-dedup fires. Currently MaxRetries = 3. Force-dedup fires when retryCount has
#                            reached MaxRetries and the SUBSEQUENT build attempt also fails (i.e., the
#                            (MaxRetries+1)th failure). An agent whose retryCount = MaxRetries still has one
#                            remaining build attempt before force-dedup is triggered.
#   MaxGraphOps            — upper bound on graph add-operations within a single epoch, defined in the TLA+
#                            formal model via guard conditions on GraphAddNode and GraphAddEdge
#                            (both are guarded by graphOpsCount < MaxGraphOps). When graphOpsCount reaches
#                            MaxGraphOps, both add-actions become disabled. The behavior is a SILENT DISABLE:
#                            add-operation calls complete without returning an error; the graph does not record
#                            the operation; no agent notification is sent; no pipeline log entry is written.
#                            The agent can still complete its session and trigger the close-hook write.
#                            NOTE: The no-silent-drop invariant does NOT apply at this boundary — TLA+'s
#                            behavior is guard-based silent disable with no notification.
#   Dense markdown         — machine-readable CLAUDE.md format: node types as headers with comma-separated items,
#                            edge types as headers with comma-separated relationships
#   retryCount             — per-duplicate counter tracking how many retry attempts have been issued for the same
#                            duplicate path. 1-indexed: the first retry attempt sets retryCount=1 (GraphRetry
#                            increments retryCount from 0 to 1 on the first dedup_error→retrying transition).
#                            retryCount=0 when the system first enters dedup_error (before any retry fires).
#                            Scoped to the current dedup cycle. FORCE-DEDUP TRIGGER PREDICATE (OBJ-5):
#                            force-dedup fires when retryCount >= MaxRetries (>= not =) AND the
#                            subsequent build attempt also fails. The >= comparison ensures that any
#                            configuration or race condition where retryCount exceeds MaxRetries still
#                            triggers force-dedup. Resets to 0 at THREE distinct sites:
#                            (1) Intra-epoch success: GraphNodeBuildSuccess and GraphEdgeBuildSuccess
#                            set retryCount'=0 when the agent successfully fixes a duplicate during
#                            the retry cycle (dedup_error → collecting or retrying → collecting).
#                            (2) Intra-epoch force-dedup: GraphAfterForceDedup sets retryCount'=0
#                            after force-dedup completes, within the same collecting epoch
#                            (graphState transitions force_dedup → collecting).
#                            (3) Epoch-end: GraphWriteSuccess and GraphWriteFail both set
#                            retryCount'=0 at epoch close (also reset graphOpsCount'=0). This fires
#                            regardless of whether force-dedup or a successful fix occurred during
#                            the epoch. All three reset sites set retryCount to 0 (not to any other
#                            value). Step definitions MUST use 0 as the reset assertion target.
#   Graph dedup cycle seeded with retryCount=N — factory precondition used in Scenario Outlines and retry
#                            scenarios to establish dedup state independently without executing prior scenario
#                            steps. A step definition implementing this Given must directly set the duplicate
#                            path in the graph and set retryCount=N, bypassing the normal trigger→increment flow.
#                            This makes each retry scenario independently runnable.
#   Seeded at force-dedup trigger state — factory precondition establishing: graphState='dedup_error' ∧
#                            retryCount=MaxRetries (= 3) ∧ pendingNode or pendingEdge set to the duplicate
#                            path. Force-dedup has NOT yet fired. The next build failure for this same duplicate
#                            path will trigger GraphForceDedup. DISTINCT from graphState='force_dedup' (where
#                            GraphForceDedup has already executed and pendingNode/Edge are already NULL).
#                            A step definition implementing this Given must set retryCount=MaxRetries and
#                            establish the duplicate in pending state, without executing GraphForceDedup.
#   markdownState=none     — initial state of the knowledge graph markdown system; no CLAUDE.md has ever been
#                            successfully written for this pipeline run. A close-hook write failure in this
#                            state leaves no CLAUDE.md at the repo root for subsequent agents to read.
#   markdownState=stale    — state where a prior CLAUDE.md exists from an earlier successful build, but the most
#                            recent close hook failed; the stale file persists until the next successful write.
#   markdownState=current  — state where the most recent close hook ran successfully and CLAUDE.md reflects
#                            the current graph state. Transitions from "none" (first successful write in this
#                            pipeline run) or from "stale" (self-healing recovery after a prior write failure).
#                            The canonical CLAUDE.md at the repo root is up-to-date for the next agent to read.
#   Atomic CLAUDE.md write — the close hook writes graph output to a temp file then renames it to CLAUDE.md.
#                            A crash during write leaves either the old CLAUDE.md intact or the new CLAUDE.md
#                            complete — never a partial or truncated file at the canonical CLAUDE.md path.
#                            A rename failure (temp file written but rename step fails) is a distinct failure
#                            mode: the temp file exists on disk, the prior CLAUDE.md remains intact at the
#                            canonical path, and markdownState remains stale.
#   Pipeline log           — the stdout stream of the vibe-cli pipeline process. Each force-dedup event and each
#                            close-hook warning is written as a timestamped line prefixed with [WARN] to stdout.
#                            Force-dedup entries identify the dropped path. Warning entries identify the hook stage.
#   routingState           — the state machine variable tracking the model routing subsystem lifecycle.
#                            States: "idle" (initial), "validating" (role enum validation in
#                            progress; ValidateRole action fired — see L11 note below),
#                            "resolving" (mapping lookup in progress; ResolveModel action fired),
#                            "invoking" (Claude CLI invocation in progress), "done" (successful
#                            completion), "error" (validation or mapping failure — pipeline halts).
#                            TLA+ ValidateRole, ResolveModel, InvokeModel, ValidateRoleFail,
#                            MappingLookupFail all operate on routingState. Used in scenario steps
#                            throughout to assert routing subsystem outcomes.
#                            NOTE (L11 — ValidatingLeadsToResolvingOrError): routingState="validating"
#                            is an intermediate state that CANNOT be asserted directly by BDD
#                            scenarios (BDD asserts only terminal outcomes). TLA+ L11 closes the
#                            deadlock gap: from "validating" the system must always advance to
#                            "resolving" or "error" — it cannot block permanently. Integration tests
#                            must verify that routingState="validating" always advances without
#                            blocking. Analogous to the L9 liveness obligation for "resolving"
#                            (documented in the Model Routing Feature header, B8-10).
#   pipelineState          — the primary aggregate-level observable tracking the overall pipeline
#                            lifecycle. States: "running" (initial and normal operation), "done"
#                            (successful terminal state), "halted" (terminal failure state, reached
#                            only via routing failures: ValidateRoleFail or MappingLookupFail in TLA+).
#                            NOTE (OBJ-4 — "idle" exclusion): "idle" is a TLA+ initialization
#                            artifact and is NOT a domain-observable pipeline state. TLA+ Init
#                            establishes pipelineState="idle" as the initial value, but this
#                            transitions to "running" via PipelineInit before any domain event can
#                            observe it. The three domain-observable values are "running", "done",
#                            and "halted" only. Analogous to D24 (inputRole=NULL is a TLA+
#                            initialization artifact not representable as an Invoke-Claude argument).
#                            BDD scenarios MUST use only the three domain-observable values; any
#                            scenario asserting pipelineState="idle" is an error.
#                            Terminal condition — TWO DIRECTIONS with distinct semantics:
#                            Safety direction (instantaneous): pipelineState="done" IMPLIES
#                            routingState=done ∧ graphState∈{done,warn} ∧ hookState∈{idle,done,error}.
#                            Liveness direction (requires SF fairness): routingState=done ∧
#                            graphState∈{done,warn} ∧ hookState∈{idle,done,error} LEADS-TO
#                            pipelineState="done" via TLA+ SF-fair PipelineComplete action.
#                            Using "iff" conflates these directions: the safety direction holds
#                            instantaneously; the liveness direction requires SF fairness and is
#                            TLA+-verified only. BDD terminal-condition scenarios assert the safety
#                            direction only (pipelineState="done" implies all subsystems terminal);
#                            liveness is verified by TLA+ only.
#                            NOTE (S32/S37 — sequencing invariant): The pipeline-orchestration
#                            constraint "next pipeline stage MUST NOT begin before close hook
#                            completes" is anchored by TLA+ S32 (CloseHookPrecedesNextStage) and
#                            S37 (SequencingInvariantPersists). These invariants govern the
#                            transition INTO the next pipelineState and are NOT part of
#                            pipelineState's own definition. Step definition authors implementing
#                            close-hook sequencing scenarios MUST reference S32/S37.
#                            ASSUME (D25 — external pipeline abort): In TLA+, pipelineState="halted"
#                            can only originate from routing failures. BDD B2 describes an externally-
#                            signaled abort (pipelineState→"halted" from the pipeline controller);
#                            this path is out-of-TLA+ scope and enforced by the PowerShell runtime.
#   agentsCompleted        — the counter tracking how many agents have completed their close hooks in
#                            the current pipeline run. Incremented by 1 each time an agent's close hook
#                            exits (regardless of success or failure — GraphWriteSuccess and GraphWriteFail
#                            both increment agentsCompleted). The pipeline termination condition is anchored
#                            by agentsCompleted: the graph subsystem reaches its "done" terminal state when
#                            agentsCompleted = MaxAgents (all agents have completed their close hooks).
#                            Provides the cardinality anchor for the pipeline termination invariant
#                            alongside MaxAgents.
#                            IMPORTANT EXCLUSION: agentsCompleted is NOT incremented when GraphHaltCleanup
#                            fires. A pipeline abort bypasses the close-hook write entirely and leaves this
#                            counter unchanged (TLA+ line: agentsCompleted in UNCHANGED for
#                            GraphHaltCleanup). Only the two close-hook exit paths (GraphWriteSuccess and
#                            GraphWriteFail) increment agentsCompleted — the abort path does not.
#   Graph build            — [B8-12] a TLA+-modeled dedup state machine event. "Graph build success"
#   success/failure          refers to GraphNodeBuildSuccess or GraphEdgeBuildSuccess: the tsx build
#                            passed with no duplicate detected (graphState dedup_error→collecting or
#                            dedup_error→retrying→collecting). "Graph build failure" refers to
#                            GraphNodeDuplicateDetected or GraphEdgeDuplicateDetected: duplicate found,
#                            graphState→dedup_error. These are DISTINCT from tsx compilation outcomes.
#                            Step definitions for dedup scenarios MUST target graph-build events, not
#                            tsx compiler exit codes. TLA+ scope: formally modeled.
#   tsx build              — [B8-12] the outcome of running "tsx graph/index.ts" as a TypeScript
#   success/failure          compilation step. "tsx build fails with a type error" (e.g., invalid node
#                            or edge type) is a TypeScript compile-time error — the tsx process exits
#                            non-zero due to type checking, NOT a TLA+-modeled GraphDuplicateDetected
#                            event. Used in typed-wrapper scenarios only (see Knowledge Graph Typed
#                            Wrapper Feature). Step definitions for typed-wrapper scenarios must check
#                            the tsx process exit code and compiler diagnostics, NOT graph dedup state.
#                            TLA+ scope: OUT OF SCOPE — no TLA+ action models tsx compile-time errors.
#                            Disambiguation rule: "build succeeds/fails" in dedup scenarios = graph-build
#                            event (TLA+); in typed-wrapper scenarios = tsx compilation outcome (non-TLA+).
#   Argument-translation   — [B8-14] the mapping between original command flags/arguments and their
#   equivalence contract     equivalent form in the rewritten es or rg invocation. "Equivalent arguments"
#                            in hook rewrite scenarios means the rewritten command is expected to produce
#                            the same search results as the original command would have on the same file
#                            system. THIS CONTRACT IS UNMODELED: TLA+ HookRewrite sets hookRewritten=TRUE
#                            but encodes no argument mapping or flag-translation specification.
#                            ASSUME D33 — CommandTokenRewriteOnlyIsDeclaredAbstraction:
#                            TLA+ models hook rewrite as a boolean flag only. The specific command token
#                            replacement (find→es, grep→rg) and the argument-equivalence mapping (e.g.,
#                            "-name '*.ts'" translated to an es pattern) are unmodeled. A hook that
#                            correctly rewrites the command token but drops or mistranslates flags would
#                            pass every BDD hook intercept scenario that only checks the leading token.
#                            Enforcement: the argument-translation equivalence contract is enforced by
#                            the hook implementation (es-hook.ps1, rg-hook.ps1) and verified by
#                            integration tests only — not by TLA+ or BDD token-check assertions.
#                            BDD scenarios asserting "rewritten to use es/rg with equivalent arguments"
#                            are therefore integration test obligations for the argument-mapping path.

# =============================================================================
# Model Routing — Invoke-Claude Integration
# =============================================================================

Feature: Model routing selects the correct Claude model per pipeline role
  Invoke-Claude uses a centralized mapping to right-size the model for each role

  # NOTE (B8-10) — routingState="resolving" intermediate state: integration-test obligation.
  # TLA+ L9 (ResolvingLeadsToInvokingOrError, Revision 14) closes the deadlock gap: from
  # routingState="resolving" the system must always advance to "invoking" or "error" — it
  # cannot block permanently. BDD scenarios in this Feature assert only terminal outcomes
  # (pipeline halts or Claude CLI is invoked) and CANNOT assert the resolving intermediate
  # state directly. An integration test must verify that routingState="resolving" always
  # advances without blocking. This liveness constraint is TLA+-verified by L9 only.
  # Analogous to the D21 integration-test obligation pattern for hook intercept scenarios.
  #
  # NOTE (L11) — routingState="validating" intermediate state: integration-test obligation.
  # TLA+ L11 (ValidatingLeadsToResolvingOrError): from routingState="validating" (role enum
  # validation in progress via ValidateRole action) the system must always advance to
  # "resolving" or "error" — it cannot block permanently. BDD scenarios CANNOT assert the
  # validating intermediate state directly. An integration test must verify that
  # routingState="validating" always advances without blocking. Analogous to the L9/B8-10
  # pattern for "resolving" above. See also: routingState glossary entry, L11 note.

  Scenario: Elicitor role routes to opus
    Given the model mapping in "config/model-routing.psd1" maps "elicitor" to "opus"
    When Invoke-Claude is called with Role "elicitor"
    Then the Claude CLI is invoked with the "--model opus" flag

  Scenario: Doc-writer role routes to sonnet
    Given the model mapping in "config/model-routing.psd1" maps "doc-writer" to "sonnet"
    When Invoke-Claude is called with Role "doc-writer"
    Then the Claude CLI is invoked with the "--model sonnet" flag

  Scenario: Expert role routes to sonnet
    Given the model mapping in "config/model-routing.psd1" maps "expert" to "sonnet"
    When Invoke-Claude is called with Role "expert"
    Then the Claude CLI is invoked with the "--model sonnet" flag

  Scenario: Moderator role routes to opus
    Given the model mapping in "config/model-routing.psd1" maps "moderator" to "opus"
    When Invoke-Claude is called with Role "moderator"
    Then the Claude CLI is invoked with the "--model opus" flag

  Scenario: Reviewer role routes to haiku
    Given the model mapping in "config/model-routing.psd1" maps "reviewer" to "haiku"
    When Invoke-Claude is called with Role "reviewer"
    Then the Claude CLI is invoked with the "--model haiku" flag

  Scenario: Code-writer role routes to sonnet
    Given the model mapping in "config/model-routing.psd1" maps "code-writer" to "sonnet"
    When Invoke-Claude is called with Role "code-writer"
    Then the Claude CLI is invoked with the "--model sonnet" flag

  Scenario: Explicit Model parameter overrides the centralized mapping
    Given the model mapping in "config/model-routing.psd1" maps "reviewer" to "haiku"
    When Invoke-Claude is called with Role "reviewer" and Model "opus"
    Then the Claude CLI is invoked with the "--model opus" flag
    And the Claude CLI is not invoked with the "--model haiku" flag

  Scenario: Role parameter is required
    Given a valid model mapping exists in "config/model-routing.psd1"
    When Invoke-Claude is called without a Role parameter
    Then the pipeline halts with an error indicating Role is required
    And no Claude CLI invocation occurs

  Scenario: Unknown role halts the pipeline
    Given a valid model mapping exists in "config/model-routing.psd1"
    And the mapping does not contain a "debugger" role
    When Invoke-Claude is called with Role "debugger"
    Then the pipeline halts with an error indicating "debugger" is not a valid role
    And no Claude CLI invocation occurs

  Scenario: Missing mapping entry for a valid role halts the pipeline
    Given the model mapping in "config/model-routing.psd1" is missing an entry for "expert"
    When Invoke-Claude is called with Role "expert"
    Then the pipeline halts with an error indicating no mapping exists for "expert"
    And no Claude CLI invocation occurs

  Scenario: Config file missing entirely halts the pipeline
    Given the file "config/model-routing.psd1" does not exist
    When Invoke-Claude is called with Role "elicitor"
    Then the pipeline halts with an error indicating the config file is not found
    And no Claude CLI invocation occurs

  Scenario: Malformed config file halts the pipeline
    Given the file "config/model-routing.psd1" exists but contains invalid PowerShell data syntax
    When Invoke-Claude is called with Role "elicitor"
    Then the pipeline halts with an error indicating the config file failed to parse
    And no Claude CLI invocation occurs

  Scenario: Config mapping entry resolves to model string outside the valid model enum — halts pipeline
    # Distinct from missing mapping entry: the entry exists and parses correctly but maps to a string
    # not in {opus, sonnet, haiku}. TLA+ ResolveModel guards: resolvedModel ∈ Models before invoking
    # the Claude CLI. An out-of-enum resolved value (e.g., "gpt-4") must halt the pipeline.
    Given the file "config/model-routing.psd1" exists and contains a valid PowerShell data structure
    And the mapping entry for "elicitor" resolves to the value "gpt-4"
    When Invoke-Claude is called with Role "elicitor"
    Then the pipeline halts with an error indicating "gpt-4" is not a valid model
    And no Claude CLI invocation occurs

  Scenario: Explicit Model override parameter with value outside the valid model enum — halts pipeline
    # Distinct from the config-resolves-to-invalid-model case: the caller explicitly passes an
    # invalid override via the -Model parameter. TLA+ ResolveModel guards: inputModel ∈ Models
    # before using it. An invalid explicit override (e.g., "claude-opus-99") must halt the pipeline.
    Given the model mapping in "config/model-routing.psd1" maps "reviewer" to "haiku"
    When Invoke-Claude is called with Role "reviewer" and Model "claude-opus-99"
    Then the pipeline halts with an error indicating "claude-opus-99" is not a valid model
    And no Claude CLI invocation occurs

  Scenario: Explicit Model override to the same value the mapping would produce — identity override
    # B7: TLA+ ResolveModel uses inputModel when inputModel /= NULL /\ inputModel ∈ Models, regardless
    # of whether inputModel equals the mapping-resolved value. A bug that short-circuits the override
    # path on identity (i.e., silently ignores the override when override == mapping value) would not
    # be caught without this scenario.
    # ASSUME (B7-identity-path): No TLA+ variable distinguishes the explicit Model parameter code path
    # from the mapping lookup code path — both produce the same resolved model value (resolvedModel="haiku").
    # The assertion below is therefore restricted to the behavioral observable (the --model flag value
    # passed to the Claude CLI), not the internal code path taken. The code-path-distinction gap is
    # declared here: integration test required to verify the explicit override branch executes and that
    # short-circuit suppression of the override path is detectable (e.g., via audit log or instrumentation).
    Given the model mapping in "config/model-routing.psd1" maps "reviewer" to "haiku"
    When Invoke-Claude is called with Role "reviewer" and Model "haiku"
    Then the Claude CLI is invoked with the "--model haiku" flag
    And no pipeline halt or error occurs

# =============================================================================
# Everything CLI Hook — File Search Rewriting
# =============================================================================

Feature: Everything CLI hook rewrites file-search commands to es
  PreToolUse hook intercepts Bash and PowerShell file-search commands and rewrites them to use Everything CLI

  Background:
    Given the es-hook is registered as a PreToolUse hook in ".claude/settings.json"

  Scenario: Hook rewrites "find" to "es"
    # NOTE: D21 — TLA+ Design ASSUME D21 (HookInterceptFairnessWithoutLivenessPropertyIsDeclaredAbstraction):
    # WF_vars(HookInterceptEs) is included in Fairness but no named liveness property requires hook
    # intercepts to fire. PipelineComplete accepts hookState="idle" (ASSUME D22), so L1 witnesses can
    # complete without any hook firing. Integration tests must cover hook intercept scenarios end-to-end.
    # This scenario and the rg-hook equivalent are the primary integration test obligation for ASSUME D21.
    # LIVENESS BOUND (D21 integration-test obligation, OBJ-7): the hook must fire and confirm
    # completion within the same PreToolUse tool-call event — before the tool call returns control
    # to the agent. CONCRETE OBSERVABLE: the test-harness event constituting "control returned to
    # agent" is the PostToolUse event firing for this tool call. An integration test MUST assert:
    # the hook-execution audit log entry "es-hook: match | result: rewrite | hookRewritten=TRUE"
    # has a timestamp BEFORE the timestamp of the PostToolUse event for this tool call. If
    # hookRewritten=TRUE appears after PostToolUse, or does not appear at all before the next
    # PreToolUse event, the D21 liveness contract is violated. The PostToolUse event is the
    # definitive test-harness signal that control has returned to the agent.
    When an agent issues a Bash tool call containing "find . -name '*.ts'"
    Then the command is rewritten to use "es" with equivalent arguments
    And the hook-execution log entry for this tool call shows "es-hook: match | result: rewrite"
    And the hook-execution audit log records "hookRewritten=TRUE" with a timestamp before the PostToolUse event fires for this tool call

  Scenario: Hook rewrites "ls" to "es"
    When an agent issues a Bash tool call containing "ls src/components"
    Then the command is rewritten to use "es"
    And the hook-execution log entry for this tool call shows "es-hook: match | result: rewrite"

  Scenario: Hook rewrites "dir" to "es"
    When an agent issues a Bash tool call containing "dir /s *.ps1"
    Then the command is rewritten to use "es"

  Scenario: Hook rewrites "Get-ChildItem" to "es"
    When an agent issues a PowerShell tool call containing "Get-ChildItem -Recurse -Filter *.ts"
    Then the command is rewritten to use "es"

  Scenario: Hook rewrites "gci" alias to "es"
    When an agent issues a PowerShell tool call containing "gci -Path src -Include *.tsx"
    Then the command is rewritten to use "es"

  Scenario: Hook rewrites plain ls without flags to "es"
    When an agent issues a Bash tool call containing "ls"
    Then the command is rewritten to use "es"

  Scenario: Hook rewrites plain Get-ChildItem without flags to "es"
    When an agent issues a PowerShell tool call containing "Get-ChildItem"
    Then the command is rewritten to use "es"

  Scenario: Hook intercepts two sequential file-search commands from the same agent session
    # NOTE: D3 — TLA+ Design ASSUME D3 documents a known divergence: TLA+ models hookState as a
    # single-intercept absorbing state machine (S24 HookTerminalIsAbsorbing) with no reset from "done"
    # or "error" back to "idle". BDD documents per-call independence (the hook evaluates fresh for
    # every PreToolUse event). Multi-command sequential hook evaluation requires integration test;
    # the TLA+ formal model does not verify sequential same-session hook firing. See ASSUME D3.
    # HOOKSTATE RESET VERIFICATION (D3 integration-test obligation): step definitions MUST verify
    # that hookState is correctly reset between PreToolUse events. The observable for reset
    # correctness is the hook-execution log: each PreToolUse event produces an independent log
    # entry of the form "[hook] es-hook evaluated | result: rewrite". Two entries — one per event —
    # confirm that the hook evaluated fresh for each tool call. A single entry for two commands
    # would indicate the hook was suppressed (absorbing-state regression). Step definitions must
    # assert two independent log entries, not one, to satisfy the D3 integration-test obligation.
    When an agent issues a Bash tool call containing "find . -name '*.ts'"
    And later in the same agent session the agent issues a Bash tool call containing "find . -name '*.ps1'"
    Then both commands are rewritten to use "es"
    And each command executes exactly once
    And the hook-execution log contains exactly two independent entries — one per PreToolUse event — confirming hookState was evaluated fresh for each tool call

  Scenario: es not installed — rewritten command fails and error is surfaced to agent (hookState=error)
    # This is the HookExecuteFail path: hook successfully rewrites the command, then the rewritten
    # "es" command fails at runtime because es is not installed. hookState transitions to "error".
    Given "es" is not installed on the machine
    When an agent issues a Bash tool call containing "find . -name '*.ts'"
    And the es-hook rewrites the command to "es *.ts"
    Then the rewritten "es" command fails at runtime
    And the error is surfaced to the agent as-is with no fallback to "find"
    # hookState=error: rewrite succeeded; execution of the rewritten command failed

  Scenario: es-hook script itself exits with non-zero code before producing output (hookPreOutputCrash)
    # hookPreOutputCrash: hook process exits non-zero before writing any rewrite output (hookRewritten=FALSE).
    # DISTINCT from hookState=error, which requires hookRewritten=TRUE (rewrite succeeded, execution failed).
    # NOTE: Falls OUTSIDE the TLA+ verification scope — TLA+ HookExecuteFail requires hookRewritten=TRUE
    # and cannot model a pre-output crash. No corresponding TLA+ action exists. Behavioral correctness
    # verified by integration tests only, not by the formal model.
    Given the es-hook script exits with a non-zero code before producing output
    When an agent issues a Bash tool call containing "find . -name '*.ts'"
    Then the hook error is surfaced to the agent
    And the original "find" command does not execute
    And the pipeline continues after surfacing the hook error to the agent
    And hookState does NOT transition to "error"
    # OBJ-2: plain-English prose replaces prior TLA+ formula reference.
    # This failure mode produces no rewrite output — the hook script exited before writing to stdout,
    # so no rewrite was attempted. The S3 HookErrorImpliesRewritten invariant is not triggered because
    # that invariant applies only when a rewrite succeeds but the rewritten command then fails at
    # runtime. Here no rewrite was produced at all; hookState remains "idle" throughout, having never
    # advanced beyond the pre-intercept state. See ASSUME S3 cross-reference in the TLA+ spec.
    And markdownState is UNCHANGED
    # PreToolUse hook execution and the close-hook write mechanism are independent subsystems.
    # A pre-output crash in the PreToolUse hook path has no effect on the knowledge graph write
    # lifecycle or the canonical CLAUDE.md at the repo root.

  Scenario: Non-search Bash commands are not intercepted by es-hook
    When an agent issues a Bash tool call containing "cat src/index.ts"
    Then the command is not rewritten
    And the original command executes unchanged
    And the hook-execution log entry for this tool call shows "es-hook: no-match"

# =============================================================================
# ripgrep Hook — Text Search Rewriting
# =============================================================================

Feature: ripgrep hook rewrites text-search commands to rg
  PreToolUse hook intercepts Bash and PowerShell text-search commands and rewrites them to use ripgrep

  Background:
    Given the rg-hook is registered as a PreToolUse hook in ".claude/settings.json"

  Scenario: Hook rewrites "grep" to "rg"
    # NOTE: D21 — TLA+ Design ASSUME D21 (HookInterceptFairnessWithoutLivenessPropertyIsDeclaredAbstraction):
    # WF_vars(HookInterceptRg) is included in Fairness but no named liveness property requires hook
    # intercepts to fire. Integration tests must cover hook intercept scenarios end-to-end.
    # This scenario and the es-hook equivalent are the primary integration test obligation for ASSUME D21.
    # LIVENESS BOUND (D21 integration-test obligation, OBJ-7): the hook must fire and confirm
    # completion within the same PreToolUse tool-call event — before the tool call returns control
    # to the agent. CONCRETE OBSERVABLE: the test-harness event constituting "control returned to
    # agent" is the PostToolUse event firing for this tool call. An integration test MUST assert:
    # the hook-execution audit log entry "rg-hook: match | result: rewrite | hookRewritten=TRUE"
    # has a timestamp BEFORE the timestamp of the PostToolUse event for this tool call. If
    # hookRewritten=TRUE appears after PostToolUse, or does not appear at all before the next
    # PreToolUse event, the D21 liveness contract is violated. The PostToolUse event is the
    # definitive test-harness signal that control has returned to the agent.
    When an agent issues a Bash tool call containing "grep -r 'TODO' src/"
    Then the command is rewritten to use "rg" with equivalent arguments
    And the hook-execution log entry for this tool call shows "rg-hook: match | result: rewrite"
    And the hook-execution audit log records "hookRewritten=TRUE" with a timestamp before the PostToolUse event fires for this tool call

  Scenario: Hook rewrites "egrep" to "rg"
    When an agent issues a Bash tool call containing "egrep 'import|require' src/"
    Then the command is rewritten to use "rg"

  Scenario: Hook rewrites "fgrep" to "rg"
    When an agent issues a Bash tool call containing "fgrep 'exact string' file.ts"
    Then the command is rewritten to use "rg"

  Scenario: Hook rewrites "Select-String" to "rg"
    When an agent issues a PowerShell tool call containing "Select-String -Pattern 'TODO' -Path src/*.ts"
    Then the command is rewritten to use "rg"

  Scenario: Hook rewrites "sls" alias to "rg"
    When an agent issues a PowerShell tool call containing "sls 'export' *.ts"
    Then the command is rewritten to use "rg"

  Scenario: Get-Content piped to Select-String is rewritten to rg
    When an agent issues a PowerShell tool call containing "Get-Content src/index.ts | Select-String 'TODO'"
    Then the command is rewritten to use "rg"

  Scenario: Get-Content for plain file reading is NOT intercepted
    When an agent issues a PowerShell tool call containing "Get-Content src/index.ts"
    Then the command is not rewritten
    And the original command executes unchanged
    And the hook-execution log entry for this tool call shows "rg-hook: no-match"

  Scenario: Hook intercepts two sequential text-search commands from the same agent session
    # NOTE: D3 — TLA+ Design ASSUME D3 documents a known divergence: TLA+ models hookState as a
    # single-intercept absorbing state machine (S24 HookTerminalIsAbsorbing) with no reset from "done"
    # or "error" back to "idle". BDD documents per-call independence (the hook evaluates fresh for
    # every PreToolUse event). Multi-command sequential hook evaluation requires integration test;
    # the TLA+ formal model does not verify sequential same-session hook firing. See ASSUME D3.
    # HOOKSTATE RESET VERIFICATION (D3 integration-test obligation): step definitions MUST verify
    # that hookState is correctly reset between PreToolUse events. The observable for reset
    # correctness is the hook-execution log: each PreToolUse event produces an independent log
    # entry of the form "[hook] rg-hook evaluated | result: rewrite". Two entries — one per event —
    # confirm that the hook evaluated fresh for each tool call. A single entry for two commands
    # would indicate the hook was suppressed (absorbing-state regression). Step definitions must
    # assert two independent log entries, not one, to satisfy the D3 integration-test obligation.
    When an agent issues a Bash tool call containing "grep -r 'TODO' src/"
    And later in the same agent session the agent issues a PowerShell tool call containing "sls 'FIXME' *.ts"
    Then both commands are rewritten to use "rg"
    And each command executes exactly once
    And the hook-execution log contains exactly two independent entries — one per PreToolUse event — confirming hookState was evaluated fresh for each tool call

  Scenario: rg not installed — rewritten command fails and error is surfaced to agent (hookState=error)
    # This is the HookExecuteFail path: hook successfully rewrites the command, then the rewritten
    # "rg" command fails at runtime because rg is not installed. hookState transitions to "error".
    Given "rg" is not installed on the machine
    When an agent issues a Bash tool call containing "grep -r 'TODO' src/"
    And the rg-hook rewrites the command to "rg 'TODO' src/"
    Then the rewritten "rg" command fails at runtime
    And the error is surfaced to the agent as-is with no fallback to "grep"
    # hookState=error: rewrite succeeded; execution of the rewritten command failed

  Scenario: rg-hook script itself exits with non-zero code before producing output (hookPreOutputCrash)
    # hookPreOutputCrash: hook process exits non-zero before writing any rewrite output (hookRewritten=FALSE).
    # DISTINCT from hookState=error, which requires hookRewritten=TRUE (rewrite succeeded, execution failed).
    # NOTE: Falls OUTSIDE the TLA+ verification scope. Behavioral correctness verified by integration tests only.
    Given the rg-hook script exits with a non-zero code before producing output
    When an agent issues a Bash tool call containing "grep 'TODO' src/"
    Then the hook error is surfaced to the agent
    And the original "grep" command does not execute
    And the pipeline continues after surfacing the hook error to the agent
    And hookState does NOT transition to "error"
    # OBJ-2: plain-English prose replaces prior TLA+ formula reference.
    # This failure mode produces no rewrite output — the hook script exited before writing to stdout,
    # so no rewrite was attempted. The S3 HookErrorImpliesRewritten invariant is not triggered because
    # that invariant applies only when a rewrite succeeds but the rewritten command then fails at
    # runtime. Here no rewrite was produced at all; hookState remains "idle" throughout, having never
    # advanced beyond the pre-intercept state. See ASSUME S3 cross-reference in the TLA+ spec.
    And markdownState is UNCHANGED
    # PreToolUse hook execution and the close-hook write mechanism are independent subsystems.
    # A pre-output crash in the PreToolUse hook path has no effect on the knowledge graph write
    # lifecycle or the canonical CLAUDE.md at the repo root.

  Scenario: Non-search Bash commands are not intercepted by rg-hook
    When an agent issues a Bash tool call containing "curl https://api.example.com"
    Then the command is not rewritten
    And the original command executes unchanged
    And the hook-execution log entry for this tool call shows "rg-hook: no-match"

# =============================================================================
# PreToolUse Hook Execution Failure — hookState=error Pipeline Behavior
# =============================================================================

Feature: hookState=error from PreToolUse hook failure does not prevent pipeline completion
  When the es or rg rewritten command fails at runtime (hookState=error), the pipeline
  can still reach its terminal "done" state once routing and graph subsystems complete.
  This corresponds to TLA+ liveness property L7 (HookErrorEventuallyCompletsPipeline).

  Scenario: Pipeline completes in done state when PreToolUse hook execution failed (hookState=error)
    # L7: hookState="error" ~> pipelineState in {"done","halted"}
    # hookState=error = rewrite succeeded, rewritten command failed at runtime
    Given the rg-hook successfully rewrites "grep -r 'TODO' src/" to "rg 'TODO' src/"
    And the rewritten "rg" command fails at runtime with a non-zero exit code (hookState=error)
    And the model routing subsystem completed successfully (routingState=done)
    And the knowledge graph subsystem reached its terminal "done" state (graphState=done)
    When the pipeline evaluates its terminal condition
    Then the pipeline completes in the "done" state
    And hookState=error from the PreToolUse search hook does not prevent pipeline completion

  Scenario: Pipeline completes in done state when es rewritten command failed (hookState=error)
    Given the es-hook successfully rewrites "find . -name '*.ts'" to "es *.ts"
    And the rewritten "es" command fails at runtime (hookState=error)
    And the model routing subsystem completed successfully (routingState=done)
    And the knowledge graph subsystem reached its terminal "done" state (graphState=done)
    When the pipeline evaluates its terminal condition
    Then the pipeline completes in the "done" state
    And hookState=error from the PreToolUse search hook does not prevent pipeline completion

  Scenario: Pipeline completes in done state when hookState=error and graphState=warn are both present
    # Simultaneous-degraded-terminal: both PreToolUse hook and close hook have failed independently.
    # This joint state (hookState=error ∧ graphState=warn ∧ pipelineState=done) is accepted by
    # PipelineComplete's guard and is the most operationally likely combined degradation path.
    # Prior BDD covered each failure mode in isolation only; this scenario asserts the joint state.
    Given the rg-hook successfully rewrites "grep -r 'TODO' src/" to "rg 'TODO' src/"
    And the rewritten "rg" command fails at runtime (hookState=error)
    And the close hook for the agent session fails with a non-duplicate compilation error (graphState=warn)
    And the model routing subsystem completed successfully (routingState=done)
    When the pipeline evaluates its terminal condition
    Then the pipeline completes in the "done" state (pipelineState=done)
    And a [WARN] line is written to the pipeline log (stdout) for the close-hook failure (graphState=warn)
    And the agent-surfaced error from the rewritten "rg" failure is present in the agent context (hookState=error)
    And neither failure alone nor both failures together prevent pipeline completion

# =============================================================================
# hookState=idle — Pipeline Completion Without Any Search Commands
# =============================================================================

Feature: Pipeline completes normally when no search commands are issued (hookState="idle")
  When no agent issues any Bash or PowerShell search command during the pipeline run,
  hookState remains "idle" throughout. The pipeline must still reach its terminal "done" state.
  This corresponds to TLA+ liveness property L1 (PipelineTerminates) on the no-intercept path.
  D22 (Revision 12 TLA+) explicitly declared this a BDD coverage gap; this scenario closes it.

  Scenario: Pipeline with no search commands completes normally — hookState="idle" at PipelineComplete
    # B1: D22 BDD coverage gap. The no-intercept path (hookState="idle") is a valid liveness path
    # under L1/PipelineTerminates. hookState="idle" means no PreToolUse hook ever fired for a
    # search-command rewrite during this pipeline run — neither the es-hook nor the rg-hook matched
    # any tool call. This is the normal path for agents that perform no file-search or text-search
    # operations. The pipeline must still complete in the "done" state; hookState="idle" is a valid
    # terminal condition for the hook subsystem.
    Given a pipeline run where no agent issues any Bash or PowerShell search command
    And the es-hook and rg-hook are registered in ".claude/settings.json"
    And the model routing subsystem completes successfully
    And the knowledge graph subsystem reaches its terminal "done" state
    When the pipeline evaluates its terminal condition
    Then the pipeline completes in the "done" state
    And hookState was "idle" throughout the run (no PreToolUse hook matched any tool call)
    And no hook-execution log rewrite entries are present for this pipeline run
    And the absence of search-command interceptions does not prevent pipeline completion

# =============================================================================
# Hook Ordering — es-hook and rg-hook Coexistence
# =============================================================================

Feature: es-hook and rg-hook do not double-activate on the same command
  Each command triggers at most one hook; commands execute exactly once

  Background:
    Given the es-hook is registered as a PreToolUse hook in ".claude/settings.json"
    And the rg-hook is registered as a PreToolUse hook in ".claude/settings.json"

  Scenario: File-search command activates only es-hook
    When an agent issues a Bash tool call containing "find . -name '*.ts'"
    Then the final executed command starts with "es"
    And the final executed command does not start with "rg"
    And the hook-execution log entry for this tool call shows "es-hook: match | result: rewrite"
    And the hook-execution log entry for this tool call shows "rg-hook: no-match"
    And the command is executed exactly once

  Scenario: Text-search command activates only rg-hook
    When an agent issues a Bash tool call containing "grep -r 'TODO' src/"
    Then the final executed command starts with "rg"
    And the final executed command does not start with "es"
    And the hook-execution log entry for this tool call shows "rg-hook: match | result: rewrite"
    And the hook-execution log entry for this tool call shows "es-hook: no-match"
    And the command is executed exactly once

  Scenario: Non-search command activates neither hook and executes unchanged
    When an agent issues a Bash tool call containing "cat src/index.ts"
    Then the hook-execution log entry for this tool call shows "es-hook: no-match"
    And the hook-execution log entry for this tool call shows "rg-hook: no-match"
    And the original command "cat src/index.ts" executes unchanged

  Scenario: rg-hook receives the rewritten command from es-hook — not the original command
    # Sequential evaluation model contract: each hook receives the output of the previous hook.
    # After es-hook rewrites "find ..." to "es ...", rg-hook evaluates "es ..." as its input.
    # rg-hook produces no-match for "es ..." because "es" is not in rg-hook's pattern list.
    # This contract prevents double-rewrite and ensures consistent mutual exclusion.
    Given the es-hook is registered before the rg-hook in ".claude/settings.json"
    When an agent issues a Bash tool call containing "find . -name '*.ts'"
    And the es-hook rewrites the command to "es *.ts"
    Then the rg-hook receives "es *.ts" as its input command (not the original "find . -name '*.ts'")
    And the rg-hook produces no-match for "es *.ts"
    And the final executed command is "es *.ts"

  Scenario: Command ambiguous between file-search and text-search — es-hook takes precedence by evaluation order
    # Resolution rule for commands matching both hook patterns (e.g., "find ... | grep ..."):
    # hooks evaluate in settings.json array order; es-hook appears before rg-hook and matches first.
    # After es-hook rewrites, rg-hook evaluates the rewritten command and produces no-match.
    # Exactly one rewrite occurs; the command is not double-rewritten.
    Given the es-hook is registered before the rg-hook in ".claude/settings.json"
    When an agent issues a Bash tool call containing "find . -name '*.ts' | grep 'TODO'"
    Then the es-hook matches on the "find" keyword and rewrites the command
    And the rg-hook evaluates the rewritten command and produces no-match
    And the command is executed exactly once
    And the hook-execution log entry for this tool call shows "es-hook: match | result: rewrite"
    And the hook-execution log entry for this tool call shows "rg-hook: no-match"

  Scenario: WRONG hook order — rg-hook before es-hook causes silent wrong-tool rewrite with no error
    # [B8-3] Negative path for the registration order contract. When rg-hook appears before es-hook
    # in settings.json, a piped command containing both a file-search trigger ("find") and a
    # text-search trigger ("grep") is evaluated by rg-hook FIRST. rg-hook matches on "grep" and
    # rewrites the entire command to start with "rg". es-hook then evaluates the rg-rewritten
    # command, finds no file-search trigger, and produces no-match. The net result: a command with
    # file-search intent is rewritten by rg (wrong tool). No error or warning is surfaced to the
    # agent or written to the pipeline log. This is the highest-risk silent misbehavior: the
    # system runs, hooks fire, commands get rewritten — just to the wrong tool.
    # This scenario is the NEGATIVE COUNTERPART to the "es-hook entry appears before rg-hook" positive
    # ordering contract scenario in the Hook Configuration Contracts Feature.
    Given the rg-hook is registered BEFORE the es-hook in the ".claude/settings.json" PreToolUse hooks array (wrong order)
    When an agent issues a Bash tool call containing "find . -name '*.ts' | grep 'TODO'"
    Then the rg-hook fires first (it appears at an earlier array index) and matches on "grep"
    And the rg-hook rewrites the command to start with "rg" (file-search intent served by text-search tool)
    And the es-hook receives the rg-rewritten command as its input and produces no-match (no file-search trigger present)
    And the final executed command starts with "rg" — not "es"
    And no error or warning is surfaced to the agent
    And no [WARN] line is written to the pipeline log (stdout)
    And the hook-execution log entry shows "rg-hook: match | result: rewrite"
    And the hook-execution log entry shows "es-hook: no-match"
    # OBJ-6 — WRONG hook order CONCRETE AUTOMATABLE OBSERVABLE:
    # The hook-execution log IS the definitive test-harness observable for this silent misbehavior.
    # A test MUST assert BOTH log entries appear in the WRONG ORDER:
    #   (1) "rg-hook: match | result: rewrite" appears FIRST (wrong tool matched before es-hook)
    #   (2) "es-hook: no-match" appears SECOND (es-hook received the rg-rewritten command, found
    #       no file-search trigger, and produced no-match)
    # Compare against the CORRECT order log ("es-hook: match | result: rewrite" then
    # "rg-hook: no-match") to confirm the misbehavior. The "final executed command starts with rg"
    # assertion is the secondary confirmation. A test harness can fail automatically by comparing
    # the hook-execution log entry ORDER against the expected correct-order entries.

# =============================================================================
# Hook Completion After Pipeline Halt — D27 Concurrent-Halt Observable Path
# =============================================================================

Feature: Hook rewrite can complete after pipelineState transitions to "halted" — D27 observable
  TLA+ D27 (ASSUME D27 — HookConcurrentHaltIsDeclaredAbstraction, Revision 14) declares that
  HookRewrite, HookExecuteSuccess, and HookExecuteFail are not guarded on pipelineState and can
  therefore fire after pipelineState="halted". A concurrent routing failure while hookState="intercepting"
  sets pipelineState="halted" without preventing the in-flight hook rewrite from completing.
  The jointly absorbing terminal state is: pipelineState="halted" ∧ hookState="done" (or "error").
  This Feature closes the D27 BDD coverage gap identified in unified-debate B8-4.

  Scenario: Pipeline halts due to routing failure while hook rewrite is in-flight — hook rewrite completes
    # [B8-4] D27 observable path. The routing failure (e.g., missing config file) sets
    # pipelineState="halted" concurrently while the es-hook is mid-rewrite (hookState="intercepting").
    # Because TLA+ does not guard HookRewrite on pipelineState, the hook rewrite completes and
    # hookState transitions to "done". The jointly absorbing state pipelineState="halted" ∧
    # hookState="done" is then observable via two channels:
    #   (1) The pipeline log (stdout): routing-failure halt error entry (pipelineState="halted")
    #   (2) The hook-execution log: completed rewrite entry (hookState="done")
    # ASSUME (D27): the PowerShell runtime may enforce ordering in practice; this scenario asserts
    # the observable outcome in the race condition where the rewrite completes before termination.
    # The pipeline does NOT recover from "halted" — this state is terminal regardless of hookState.
    Given a pipeline is running with hookState="intercepting" (the es-hook is mid-rewrite for a "find . -name '*.ts'" command)
    And concurrently the routing subsystem encounters a missing "config/model-routing.psd1" file
    When the routing failure sets pipelineState to "halted"
    And the es-hook rewrite completes before the pipeline controller terminates the hook process
    Then hookState transitions to "done" (the rewrite completed successfully despite the pipeline halt)
    And pipelineState remains "halted" (the routing failure terminal state — not recoverable)
    And hookState="done" and pipelineState="halted" are jointly absorbing
    And the pipeline log (stdout) contains the routing-failure halt error entry for the missing config file
    And the hook-execution log records the completed rewrite entry (hookState="done" reached before process termination)
    And the pipeline does NOT transition to "done" — "halted" is the terminal state regardless of hook completion

# =============================================================================
# Hook Configuration Contracts — Behavioral Domain Invariants
# [B8-11] Split from former "Hook Registration" Feature. This Feature contains
# behavioral domain invariants: registration existence as a configuration contract,
# and the ordering contract that governs hook evaluation behavior.
# Distinct bounded context from Hook Deployment Infrastructure (below), which
# contains deployment partial-state and schema misconfiguration scenarios.
# =============================================================================

Feature: Hook configuration contracts enforce correct registration and evaluation ordering
  Hooks must be registered with the correct schema and in the correct array order to produce
  the expected behavioral outcomes. Registration correctness and evaluation ordering are
  behavioral domain invariants, not infrastructure failures.

  Background:
    Given the monorepo has a ".claude/settings.json" file

  Scenario: es-hook is registered for Bash tool calls
    When the settings are loaded
    Then a PreToolUse hook entry exists for "es-hook.ps1" targeting Bash tool calls

  Scenario: es-hook is registered for PowerShell tool calls
    When the settings are loaded
    Then a PreToolUse hook entry exists for "es-hook.ps1" targeting PowerShell tool calls

  Scenario: rg-hook is registered for Bash tool calls
    When the settings are loaded
    Then a PreToolUse hook entry exists for "rg-hook.ps1" targeting Bash tool calls

  Scenario: rg-hook is registered for PowerShell tool calls
    When the settings are loaded
    Then a PreToolUse hook entry exists for "rg-hook.ps1" targeting PowerShell tool calls

  Scenario: Hook scripts exist at expected paths
    When the hook installation is verified against the monorepo root directory
    Then ".claude/hooks/es-hook.ps1" exists and is a non-empty file
    And ".claude/hooks/rg-hook.ps1" exists and is a non-empty file

  Scenario: es-hook entry appears before rg-hook entry in settings.json PreToolUse array
    # Evaluation order follows settings.json array index. es-hook must appear at an earlier index
    # than rg-hook to enforce the sequential evaluation contract (es-hook evaluates before rg-hook).
    # The negative counterpart — wrong order producing silent wrong-tool rewrite — is covered
    # in the Hook Ordering Feature ("WRONG hook order" scenario).
    When the settings are loaded
    Then the "es-hook.ps1" entry appears before the "rg-hook.ps1" entry in the PreToolUse hooks array in ".claude/settings.json"

# =============================================================================
# Hook Deployment Infrastructure — Partial-State and Schema Misconfiguration
# [B8-11] Split from former "Hook Registration" Feature. This Feature contains
# deployment infrastructure scenarios: partial-state failures (entry exists but
# script absent, or vice versa) and schema misconfiguration (incorrect matcher,
# wrong-case tool-name, invalid script path).
# NOTE: These scenarios have NO TLA+ counterpart — analogous to the D11 annotation
# for hookPreOutputCrash and closeHookTimeout. Behavioral correctness is verified
# by integration tests and deployment validation scripts, not by the formal model.
# =============================================================================

Feature: Hook deployment infrastructure handles partial-state and schema misconfiguration
  Deployment failures occur when the hook registration and script file are not fully consistent,
  or when the settings.json schema is incorrectly configured. These are infrastructure invariants.

  Background:
    Given the monorepo has a ".claude/settings.json" file

  # [B8-1 Scenario Outline discipline applied] The 10 structurally identical scenarios (5 per hook)
  # differing only by hook name are consolidated into 5 Scenario Outlines, each with a 2-row
  # Examples table. Each row is independently runnable; no row depends on another row's execution.
  # This is consistent with the Scenario Outline discipline applied in the Duplicate Detection
  # feature (node-fix, edge-fix, resubmit outlines) and the System Prompt feature (B8-1).

  Scenario Outline: Deployment partial-state — settings.json entry exists but <hook> script file is absent
    # Registration exists so Claude Code will attempt hook invocation, but the script file is
    # absent — causing a fail-at-invocation error. The hook does NOT silently skip.
    # Applies to both es-hook (file-search) and rg-hook (text-search) identically.
    Given ".claude/settings.json" contains a valid PreToolUse entry for "<hook>"
    And the file ".claude/hooks/<hook>" does not exist on disk
    When an agent issues a Bash tool call containing "<trigger-command>"
    Then Claude Code attempts to invoke "<hook>" and fails with a script-not-found error
    And the error is surfaced to the agent
    And the original "<trigger-token>" command does not execute

    Examples:
      | hook         | trigger-command        | trigger-token |
      | es-hook.ps1  | find . -name '*.ts'    | find          |
      | rg-hook.ps1  | grep -r 'TODO' src/    | grep          |

  Scenario Outline: Deployment partial-state — <hook> script file exists but settings.json has no entry
    # Script exists but no registration: no PreToolUse event routes to it.
    # The hook silently never fires; search commands are not rewritten.
    # Applies to both es-hook (file-search) and rg-hook (text-search) identically.
    Given the file ".claude/hooks/<hook>" exists and is a non-empty file
    And ".claude/settings.json" contains no PreToolUse entry for "<hook>"
    When an agent issues a Bash tool call containing "<trigger-command>"
    Then the hook is never invoked
    And the original "<trigger-token>" command executes unchanged
    And no hook-execution log entry for "<hook>" appears for this tool call

    Examples:
      | hook         | trigger-command        | trigger-token |
      | es-hook.ps1  | find . -name '*.ts'    | find          |
      | rg-hook.ps1  | grep -r 'TODO' src/    | grep          |

  Scenario Outline: settings.json <hook> entry has incorrect matcher field value — hook silently never fires
    # Incorrect matcher (e.g., "BashTool" instead of "Bash"): the entry is syntactically valid
    # but semantically inert. Claude Code evaluates the entry and produces no match for any real
    # Bash tool call. Applies to both es-hook and rg-hook identically.
    Given ".claude/settings.json" contains a PreToolUse entry for "<hook>" with a matcher
      field value of "BashTool" instead of the correct "Bash"
    When an agent issues a Bash tool call containing "<trigger-command>"
    Then the hook is never invoked for the Bash tool call
    And the original "<trigger-token>" command executes unchanged
    And the hook-execution log entry shows no match for the "<hook>" entry

    Examples:
      | hook         | trigger-command        | trigger-token |
      | es-hook.ps1  | find . -name '*.ts'    | find          |
      | rg-hook.ps1  | grep -r 'TODO' src/    | grep          |

  Scenario Outline: settings.json <hook> entry has wrong-case tool-name target — hook silently never fires
    # Tool-name matching is case-sensitive in Claude Code settings. "bash" does not match "Bash";
    # the entry is silently inert. Applies to both es-hook and rg-hook identically.
    Given ".claude/settings.json" contains a PreToolUse entry for "<hook>" with tool-name "bash"
      (lowercase) instead of the correct case-sensitive value "Bash"
    When an agent issues a Bash tool call containing "<trigger-command>"
    Then the hook is never invoked for the Bash tool call
    And the original "<trigger-token>" command executes unchanged

    Examples:
      | hook         | trigger-command        | trigger-token |
      | es-hook.ps1  | find . -name '*.ts'    | find          |
      | rg-hook.ps1  | grep -r 'TODO' src/    | grep          |

  Scenario Outline: settings.json <hook> entry has syntactically invalid script path — hook fails at invocation
    # Invalid script path (e.g., unescaped space in path with no quoting) causes a
    # fail-at-invocation error when Claude Code attempts to launch the hook process.
    # The error is surfaced; the original command does not execute.
    # Applies to both es-hook and rg-hook identically.
    Given ".claude/settings.json" contains a PreToolUse entry for "<hook>" with a script
      path of "/.claude/hooks/<hook-with-space>" (contains an unescaped space with no quoting)
    When an agent issues a Bash tool call containing "<trigger-command>"
    Then Claude Code fails to invoke the hook due to the invalid script path
    And the error is surfaced to the agent
    And the original "<trigger-token>" command does not execute

    Examples:
      | hook         | hook-with-space  | trigger-command        | trigger-token |
      | es-hook.ps1  | es hook.ps1      | find . -name '*.ts'    | find          |
      | rg-hook.ps1  | rg hook.ps1      | grep -r 'TODO' src/    | grep          |

# =============================================================================
# Knowledge Graph — Node Management
# =============================================================================

Feature: Knowledge graph tracks codebase nodes with typed DirectedGraph
  Agents add nodes via .addNode() calls in TypeScript graph files under packages/vibe-cli/graph/

  Scenario: Agent adds a file node to the graph
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains a node with type "file" and id "packages/vibe-cli/vibe.ps1"

  Scenario: Agent adds a function node to the graph
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "function" and id "packages/vibe-cli/utils/invoke-claude.ps1#Invoke-Claude"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains a node with type "function" and id "packages/vibe-cli/utils/invoke-claude.ps1#Invoke-Claude"

  Scenario: Agent adds a package node to the graph
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "package" and id "packages/vibe-cli"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains a node with type "package" and id "packages/vibe-cli"

  Scenario: Agent adds a component node to the graph
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "component" and id "apps/web/src/components/Header.tsx"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains a node with type "component" and id "apps/web/src/components/Header.tsx"

  Scenario: Agent adds an app node to the graph
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "app" and id "apps/web"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains a node with type "app" and id "apps/web"

  Scenario: Nodes with same name but different paths are distinct
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/utils/helpers.ts"
    And an agent calls .addNode() with type "file" and id "packages/ethang-hono/utils/helpers.ts"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains 2 distinct file nodes
    And both nodes coexist without conflict

  Scenario: Raw rg output token "src/foo.ts:42:keyword" is rejected — not a valid node identity (OBJ-10)
    # Cross-subsystem gap: after the rg-hook rewrites grep to rg, agents receive rg output in
    # the format "file:line:content" (e.g., "src/foo.ts:42:  export function foo"). An agent that
    # passes a raw rg output token directly to .addNode() introduces a malformed node path.
    # The bare-filename rule alone does not cover this: "src/foo.ts:42:keyword" contains a
    # directory separator ("/" in "src/") but is NOT a valid node identity because the
    # colon-delimited line number and content suffix make it not a pure file path.
    # Correct agent behavior: extract the file path portion only ("src/foo.ts") before the first
    # colon, verify it contains a directory separator, then call .addNode() with "src/foo.ts".
    # This scenario verifies the build rejects raw rg output tokens unchanged.
    # TLA+ scope: this is an implementation-level path validation enforced by the typed wrapper;
    # no TLA+ action models rg output format parsing. Verified by integration tests only.
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "file" and id "src/foo.ts:42:keyword" (a raw rg output token containing a colon-delimited line number and match content)
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating "src/foo.ts:42:keyword" is not a valid node identity
    And the error message specifies that node ids must be pure file paths without colon-delimited line-number or content suffixes
    And no node with id "src/foo.ts:42:keyword" is added to the graph
    And no node with id "src/foo.ts:42:keyword" appears in the "CLAUDE.md" output

  Scenario: Bare filename without directory prefix is rejected at build time — NOT a valid node identity (B-5)
    # [B-5] Negative test for the node identity rule declared in the glossary:
    # "Bare filenames without a directory prefix are NOT valid node identities."
    # All existing node scenarios use full paths (e.g., "packages/vibe-cli/vibe.ps1").
    # This scenario tests the negative: a bare filename "vibe.ps1" (no leading directory segment)
    # must be rejected at build time. Without this test, a regression accepting bare filenames
    # would pass all existing BDD scenarios — none of which pass a bare filename.
    #
    # Node identity rule: a valid node id must contain at least one directory separator ("/"), so
    # that "packages/vibe-cli/vibe.ps1" is valid but "vibe.ps1" alone is not. The full-path
    # requirement ensures that /dir1/file and /dir2/file are treated as distinct nodes, and that
    # bare-name collisions across directories cannot silently occur.
    #
    # TLA+ scope: the bare-filename guard is an implementation-level type constraint enforced by
    # the typed wrapper (packages/vibe-cli/graph/wrapper.ts). No TLA+ action models bare-filename
    # rejection; this is a build-time assertion verified by tsx compilation only.
    Given the knowledge graph at "packages/vibe-cli/graph/" exists
    When an agent calls .addNode() with type "file" and id "vibe.ps1" (a bare filename — no directory prefix)
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating "vibe.ps1" is not a valid node identity
    And the error message specifies that a directory prefix is required (full path expected)
    And no node with id "vibe.ps1" is added to the graph
    And no node with id "vibe.ps1" appears in the "CLAUDE.md" output

# =============================================================================
# Knowledge Graph — Edge Management
# =============================================================================

Feature: Knowledge graph tracks codebase relationships with typed edges
  Agents add edges via .addEdge() calls linking existing nodes; both endpoint nodes must exist in the graph

  Scenario: Agent adds a "calls" edge between two existing nodes
    Given the graph contains node "packages/vibe-cli/vibe.ps1"
    And the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"

  Scenario: Agent adds an "imports" edge
    Given the graph contains node "apps/web/src/App.tsx"
    And the graph contains node "apps/web/src/components/Header.tsx"
    When an agent calls .addEdge() with type "imports" from "apps/web/src/App.tsx" to "apps/web/src/components/Header.tsx"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "imports" from "apps/web/src/App.tsx" to "apps/web/src/components/Header.tsx"

  Scenario: Agent adds a "tested_by" edge
    Given the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph contains node "packages/vibe-cli/tests/invoke-claude.test.ts"
    When an agent calls .addEdge() with type "tested_by" from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/tests/invoke-claude.test.ts"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "tested_by" from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/tests/invoke-claude.test.ts"

  Scenario: Agent adds a "test_for" edge
    Given the graph contains node "packages/vibe-cli/tests/invoke-claude.test.ts"
    And the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    When an agent calls .addEdge() with type "test_for" from "packages/vibe-cli/tests/invoke-claude.test.ts" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "test_for" from "packages/vibe-cli/tests/invoke-claude.test.ts" to "packages/vibe-cli/utils/invoke-claude.ps1"

  Scenario: Agent adds a "contains" edge
    Given the graph contains node "packages/vibe-cli"
    And the graph contains node "packages/vibe-cli/vibe.ps1"
    When an agent calls .addEdge() with type "contains" from "packages/vibe-cli" to "packages/vibe-cli/vibe.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "contains" from "packages/vibe-cli" to "packages/vibe-cli/vibe.ps1"

  Scenario: Agent adds a "depends_on" edge
    Given the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph contains node "packages/vibe-cli/config/model-routing.psd1"
    When an agent calls .addEdge() with type "depends_on" from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/config/model-routing.psd1"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "depends_on" from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/config/model-routing.psd1"

  Scenario: Agent adds an "exports" edge
    Given the graph contains node "packages/vibe-cli/graph/index.ts"
    And the graph contains node "packages/vibe-cli/graph/index.ts#buildMarkdown"
    When an agent calls .addEdge() with type "exports" from "packages/vibe-cli/graph/index.ts" to "packages/vibe-cli/graph/index.ts#buildMarkdown"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains an edge of type "exports" from "packages/vibe-cli/graph/index.ts" to "packages/vibe-cli/graph/index.ts#buildMarkdown"

  Scenario: Agent adds a self-loop edge from a node to itself
    # Self-loop edges (<<p,p>>) are valid inputs accepted by the graph.
    # Node identity is path-based; the source and target being identical does not invalidate the edge.
    Given the graph contains node "packages/vibe-cli/vibe.ps1"
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/vibe.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the graph contains a "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/vibe.ps1"

  Scenario: Two edges between the same nodes with different types are NOT duplicates
    # Compensates for TLA+ ASSUME O5 (EdgeTypeErasureIsDeclaredAbstraction): the TLA+ model treats
    # edges as indistinguishable by type — same-endpoint pairs dedup regardless of type in the model.
    # This scenario closes that verification gap: the implementation MUST treat typed edges as distinct.
    # A "calls" edge <<A,B>> and an "imports" edge <<A,B>> sharing the same endpoints are two separate edges.
    Given the graph contains node "packages/vibe-cli/vibe.ps1"
    And the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph contains a "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    When an agent calls .addEdge() with type "imports" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build succeeds without a duplicate-edge error
    And the graph contains a "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph contains an "imports" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And both typed edges coexist as distinct relationships in the graph

  Scenario: addEdge with unregistered source node is rejected at build time
    Given the graph does not contain a node with id "packages/vibe-cli/utils/missing-source.ps1"
    And the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/utils/missing-source.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating the source node "packages/vibe-cli/utils/missing-source.ps1" does not exist
    And no edge is added to the graph

  Scenario: addEdge with unregistered target node is rejected at build time
    Given the graph contains node "packages/vibe-cli/vibe.ps1"
    And the graph does not contain a node with id "packages/vibe-cli/utils/missing-target.ps1"
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/missing-target.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating the target node "packages/vibe-cli/utils/missing-target.ps1" does not exist
    And no edge is added to the graph

  Scenario: addEdge with both endpoint nodes unregistered is rejected at build time
    Given the graph does not contain a node with id "packages/vibe-cli/utils/missing-a.ps1"
    And the graph does not contain a node with id "packages/vibe-cli/utils/missing-b.ps1"
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/utils/missing-a.ps1" to "packages/vibe-cli/utils/missing-b.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating at least one endpoint node does not exist
    And no edge is added to the graph

  Scenario: addEdge when graphNodes is entirely empty — silently disabled (TLA+ GraphAddEdge guard)
    # [B8-9] Empty-graph boundary scenario. TLA+ GraphAddEdge is guarded on graphNodes /= {}.
    # When NO nodes have ever been accepted into graphNodes (graphNodes={}), GraphAddEdge is
    # DISABLED by its guard condition. This is DISTINCT from the missing-endpoint scenarios above,
    # which test when graphNodes contains at least one accepted node but the specific endpoint
    # is absent. The empty-graph case has an entirely different guard: the action is structurally
    # disabled, not rejected by an endpoint-presence check. Observable behavior follows the
    # same silent-disable pattern as MaxGraphOps boundary: the call completes without error,
    # no edge is recorded, no agent notification is sent.
    # NOTE (B-2 clarification): TLA+ GraphAddEdge O2 fix (~line 1420) formally establishes
    # graphNodes /= {} as the guard condition on GraphAddEdge. This guard is NOT derived from
    # D14 (GraphWriteMarkdownRequiresCollecting). D14 addresses graphState guard sequencing for
    # GraphWriteMarkdown (graphState must be "collecting" for the write action to fire) — it has
    # no bearing on graphNodes cardinality for GraphAddEdge. The O2 fix added the graphNodes /= {}
    # guard directly to GraphAddEdge as a separate design decision; the two guards exist on separate
    # TLA+ actions for independent reasons. Step definition authors: this scenario targets the
    # GraphAddEdge guard, not the GraphWriteMarkdown guard.
    # This scenario closes the gap where the missing-endpoint scenarios tested graphNodes ≠ {}
    # but graphNodes={} (the fully empty graph) was never exercised by BDD.
    Given the knowledge graph has no nodes — graphNodes is entirely empty (no addNode() calls have succeeded in this epoch)
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    Then the addEdge call is silently disabled by the graphNodes={} guard condition
    And the call completes without returning an error to the agent
    And no edge is recorded in the graph
    And no agent notification is sent for the silently disabled addEdge operation
    And no pipeline log entry is written for this boundary condition

# =============================================================================
# Knowledge Graph — Duplicate Detection
# =============================================================================

Feature: Knowledge graph rejects duplicate nodes and edges and retries up to MaxRetries times
  Duplicate detection uses full-path node identity. MaxRetries = 3 means the agent receives at most 3 error
  messages before force-dedup fires. The agent still gets one build attempt after the 3rd error; force-dedup
  fires only if that 4th attempt also fails (i.e., on the (MaxRetries+1)th total failure).
  retryCount is 1-indexed from the agent's perspective: retryCount=0 when the first duplicate error is
  detected (before any retry fires); retryCount=1 after the first retry attempt is issued; retryCount=2
  after the second; retryCount=3 after the third (= MaxRetries).
  Factory steps ("a graph dedup cycle seeded with retryCount=N") establish retry state independently,
  making each scenario runnable without executing prior scenario steps.

  Scenario: Duplicate node detected at build time sends error to agent with path and retryCount
    # retryCount=0 at dedup_error entry (before any GraphRetry fires). GraphRetry increments
    # retryCount from 0 to 1 only AFTER the error is emitted, during the dedup_error→retrying transition.
    Given the graph contains node "packages/vibe-cli/vibe.ps1" with type "file"
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate node "packages/vibe-cli/vibe.ps1"
    And the error sent to the agent contains the duplicate node path "packages/vibe-cli/vibe.ps1"
    And the error sent to the agent contains the current retryCount value of 0
    And the error sent to the agent instructs the agent to remove the duplicate .addNode() call

  Scenario: Duplicate edge detected at build time sends error to agent with path and retryCount
    # retryCount=0 at dedup_error entry (before any GraphRetry fires). GraphRetry increments
    # retryCount from 0 to 1 only AFTER the error is emitted, during the dedup_error→retrying transition.
    Given the graph contains an edge of type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the error sent to the agent contains the duplicate edge endpoints
    And the error sent to the agent contains the current retryCount value of 0

  Scenario: Duplicate self-loop edge is detected as a duplicate and triggers retry cycle
    # Self-loop edges (<<p,p>>) are subject to the same dedup rules as any other edge.
    # retryCount=0 at dedup_error entry (before any GraphRetry fires). GraphRetry increments
    # retryCount from 0 to 1 only AFTER the error is emitted, during the dedup_error→retrying transition.
    Given the graph contains a "calls" self-loop edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/vibe.ps1"
    When an agent calls .addEdge() again with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/vibe.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/vibe.ps1"
    And the error sent to the agent contains the current retryCount value of 0
    And the error sent to the agent instructs the agent to remove the duplicate .addEdge() call

  Scenario: Same path registered with different types is treated as a duplicate
    Given the graph contains a node with id "packages/vibe-cli/vibe.ps1" and type "file"
    When an agent calls .addNode() with type "function" and id "packages/vibe-cli/vibe.ps1"
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate node "packages/vibe-cli/vibe.ps1"
    And the error sent to the agent contains the duplicate node path "packages/vibe-cli/vibe.ps1"

  Scenario Outline: Agent fixes duplicate node at retry count <count> — build succeeds before force-dedup
    # Factory step: "a graph dedup cycle seeded with retryCount=<count>" establishes state independently
    # without depending on prior scenario execution. A step definition for this Given must directly set
    # the duplicate path in the graph and set retryCount=<count>, bypassing the normal trigger flow.
    # count=0 row covers GraphNodeBuildSuccess firing from retryCount=0 — the fix-before-any-retry
    # path where the agent removes the duplicate on the very first error (before any GraphRetry fires).
    # GraphNodeBuildSuccess can fire from retryCount=0; this path was previously untested.
    # Each row is independently runnable; no row depends on another row's execution.
    Given a graph dedup cycle is seeded with retryCount=<count> for duplicate node "packages/vibe-cli/vibe.ps1"
    And the seeded state is verified: graphState="dedup_error" and retryCount=<count> and pendingNode="packages/vibe-cli/vibe.ps1" before the When step executes
    When the agent removes the duplicate .addNode() call for "packages/vibe-cli/vibe.ps1"
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build succeeds
    And the graph contains exactly one node with id "packages/vibe-cli/vibe.ps1"
    And force-dedup was not triggered because the build succeeded before the force-dedup threshold
    And retryCount is reset to 0 after the successful build (TLA+ GraphNodeBuildSuccess sets retryCount'=0)

    Examples:
      | count |
      | 0     |
      | 1     |
      | 2     |
      | 3     |

  # count=0 row covers GraphEdgeBuildSuccess firing from retryCount=0 — the fix-before-any-retry
  # path where the agent removes the duplicate on the very first error (before any GraphRetry fires).
  # GraphEdgeBuildSuccess can fire from retryCount=0; this path was previously untested.
  Scenario Outline: Agent fixes duplicate edge at retry count <count> — build succeeds before force-dedup
    # Factory step: "a graph dedup cycle seeded with retryCount=<count> for duplicate edge" establishes
    # state independently without depending on prior scenario execution. A step definition for this Given
    # must directly set the duplicate edge in the graph and set retryCount=<count>, bypassing the normal
    # trigger flow. Each row is independently runnable; no row depends on another row's execution.
    Given a graph dedup cycle is seeded with retryCount=<count> for duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the seeded state is verified: graphState="dedup_error" and retryCount=<count> and pendingEdge=<<packages/vibe-cli/vibe.ps1,packages/vibe-cli/utils/invoke-claude.ps1>> before the When step executes
    When the agent removes the duplicate .addEdge() call for that "calls" edge
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build succeeds
    And the graph contains exactly one "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And force-dedup was not triggered because the build succeeded before the force-dedup threshold
    And retryCount is reset to 0 after the successful build (TLA+ GraphEdgeBuildSuccess sets retryCount'=0)

    Examples:
      | count |
      | 0     |
      | 1     |
      | 2     |
      | 3     |

  Scenario Outline: Agent re-submits duplicate node without fix — retryCount increments from <before> to <after>
    # Factory step: establishes dedup state independently at retryCount=<before>.
    # Each row is independently runnable; no row depends on another row's execution.
    # Row {0→1}: B6 — tests the first GraphRetry firing, where retryCount transitions from 0 to 1
    # on the dedup_error→retrying transition. This is the only row covering GraphRetry's first firing.
    # The "Duplicate node detected" scenario covers retryCount=0 at dedup_error entry but does NOT
    # re-submit without a fix; this Outline row closes that gap.
    Given a graph dedup cycle is seeded with retryCount=<before> for duplicate node "packages/vibe-cli/vibe.ps1"
    And the seeded state is verified: graphState="dedup_error" and retryCount=<before> and pendingNode="packages/vibe-cli/vibe.ps1" before the When step executes
    When the agent calls .addNode() again with type "file" and id "packages/vibe-cli/vibe.ps1" without removing the duplicate
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build fails again with an error indicating a duplicate node "packages/vibe-cli/vibe.ps1"
    And the error sent to the agent contains the current retryCount value of <after>

    Examples:
      | before | after |
      | 0      | 1     |
      | 1      | 2     |
      | 2      | 3     |

  Scenario Outline: Agent re-submits duplicate edge without fix — retryCount increments from <before> to <after>
    # Parallel of the node re-submit Scenario Outline for edges. GraphRetry is agnostic to pendingKind
    # and fires identically for both node and edge duplicates. Factory step: establishes dedup state
    # independently at retryCount=<before>. Each row is independently runnable; no row depends on
    # another row's execution.
    # Row {0→1}: tests the first GraphRetry firing for an edge duplicate, where retryCount transitions
    # from 0 to 1 on the dedup_error→retrying transition. The "Duplicate edge detected" scenario covers
    # retryCount=0 at dedup_error entry but does NOT re-submit without a fix; this Outline row closes
    # that gap for the edge path.
    Given a graph dedup cycle is seeded with retryCount=<before> for duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the seeded state is verified: graphState="dedup_error" and retryCount=<before> and pendingEdge=<<packages/vibe-cli/vibe.ps1,packages/vibe-cli/utils/invoke-claude.ps1>> before the When step executes
    When the agent calls .addEdge() again with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1" without removing the duplicate
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build fails again with an error indicating a duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the error sent to the agent contains the current retryCount value of <after>

    Examples:
      | before | after |
      | 0      | 1     |
      | 1      | 2     |
      | 2      | 3     |

  # retryCount=3 = MaxRetries: the factory Given establishes this state. The agent has received 3 error
  # messages and has exactly one remaining build attempt before force-dedup triggers on the next failure.
  Scenario: retryCount=MaxRetries boundary — fourth build failure triggers immediate force-dedup
    # When retryCount=3 (= MaxRetries), the agent has received all 3 error messages and has exactly
    # one remaining build attempt. If that attempt also fails, force-dedup fires immediately.
    # NOTE: [WARN] logging behavior for force-dedup is not modeled in the TLA+ formal specification
    # and is verified by integration tests only, not by the formal model.
    Given a graph dedup cycle is seeded with retryCount=3 for duplicate node "packages/vibe-cli/vibe.ps1"
    When the agent calls .addNode() again with type "file" and id "packages/vibe-cli/vibe.ps1" without removing the prior duplicate
    And the graph is rebuilt via "tsx graph/index.ts"
    Then force-dedup fires immediately without sending a 4th error message to the agent
    And the first entry for "packages/vibe-cli/vibe.ps1" is kept in the graph
    And the pending duplicate entry for "packages/vibe-cli/vibe.ps1" is discarded — it was never accepted into graphNodes (TLA+ GraphForceDedup sets pendingNode to NULL)
    And a [WARN] line is written to the pipeline log (stdout) recording that "packages/vibe-cli/vibe.ps1" was force-deduplicated
    And the pipeline continues

  Scenario: Force-dedup after MaxRetries exhausted for an edge
    # Factory step: seeded at the force-dedup trigger state for the duplicate edge.
    # "Seeded at force-dedup trigger state" means: graphState='dedup_error' ∧ retryCount=MaxRetries
    # (= 3) ∧ pendingEdge set to the duplicate. Force-dedup has NOT yet fired. See glossary entry.
    # NOTE: [WARN] logging behavior for force-dedup is not modeled in the TLA+ formal specification
    # and is verified by integration tests only, not by the formal model.
    Given a graph dedup cycle is seeded at the force-dedup trigger state for duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And retryCount=3 (= MaxRetries) and the next build attempt also fails with the same duplicate
    When the force-dedup process runs
    Then the first "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1" is kept in the graph
    And the pending duplicate edge is discarded — it was never accepted into graphEdges (TLA+ GraphForceDedup sets pendingEdge to NULL)
    And a [WARN] line is written to the pipeline log (stdout) recording that the duplicate "calls" edge was force-deduplicated
    And the pipeline continues

  Scenario: GraphRetryNodeStillDuplicate — substitute path on retry is also a duplicate
    # TLA+-modeled path: agent does not remove the original duplicate but instead substitutes a
    # different node path, and that substitute path is also already in the graph.
    # This re-enters dedup_error for the new duplicate path, starting a fresh retry cycle.
    #
    # D19 DUAL-TRUTH RESOLUTION — step definition authors MUST read this carefully:
    # TLA+ D19 (retryCount UNCHANGED semantics): in the TLA+ model, retryCount is a shared
    # budget across all duplicate cycles within an epoch. When a new path becomes the duplicate,
    # retryCount is NOT reset — it retains its inherited value from the prior cycle.
    # BDD observable contract (per-path, per-cycle): the error message sent to the agent MUST
    # report retryCount=0 for the new duplicate path at dedup_error entry. This is the observable
    # the agent receives and the value step definitions MUST assert. The BDD contract models
    # per-path observability; D19 describes the internal shared budget.
    # RESOLUTION: step definitions MUST assert retryCount=0 in the error message for the new
    # duplicate path (BDD observable). Integration tests MUST additionally verify the D19
    # shared-budget semantics: the total budget consumed across both cycles equals the sum
    # of both paths' retry counts (D19 integration-test obligation, not assertable via BDD alone).
    # Both assertions are required; they are not contradictory — they target different layers.
    Given a graph dedup cycle is seeded with retryCount=1 for duplicate node "packages/vibe-cli/vibe.ps1"
    And the seeded state is verified: graphState="dedup_error" and retryCount=1 and pendingNode="packages/vibe-cli/vibe.ps1" before the When step executes
    And the graph also contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    When the agent does NOT remove the original duplicate "packages/vibe-cli/vibe.ps1"
    And the agent substitutes .addNode() with type "file" and id "packages/vibe-cli/utils/invoke-claude.ps1" (also a duplicate)
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate node "packages/vibe-cli/utils/invoke-claude.ps1"
    And the error sent to the agent contains the new duplicate node path "packages/vibe-cli/utils/invoke-claude.ps1"
    And the error message reports retryCount=0 for the new duplicate path
    And the retry cycle re-enters dedup_error for the new duplicate path

  Scenario: GraphRetryEdgeStillDuplicate — substitute edge on retry is also a duplicate
    # TLA+-modeled path: agent substitutes a different edge on retry and that replacement is also
    # a duplicate, re-entering dedup_error for the replacement edge.
    #
    # D19 DUAL-TRUTH RESOLUTION — step definition authors MUST read this carefully:
    # TLA+ D19 (retryCount UNCHANGED semantics): in the TLA+ model, retryCount is a shared
    # budget. When a replacement edge becomes the duplicate, retryCount is NOT reset — it
    # retains its inherited value from the prior cycle.
    # BDD observable contract (per-path, per-cycle): the error message sent to the agent MUST
    # report retryCount=0 for the replacement edge at dedup_error entry. Step definitions MUST
    # assert retryCount=0 in the error message (BDD observable contract).
    # Integration tests MUST additionally verify D19 shared-budget semantics separately.
    # See GraphRetryNodeStillDuplicate scenario for the full resolution rationale.
    Given a graph dedup cycle is seeded with retryCount=1 for duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the seeded state is verified: graphState="dedup_error" and retryCount=1 and pendingEdge=<<packages/vibe-cli/vibe.ps1,packages/vibe-cli/utils/invoke-claude.ps1>> before the When step executes
    And the graph also contains an "imports" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    When the agent does NOT remove the original duplicate "calls" edge
    And the agent substitutes .addEdge() with type "imports" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1" (also a duplicate)
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate "imports" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the error message reports retryCount=0 for the replacement duplicate edge
    And the retry cycle re-enters dedup_error for the replacement duplicate edge

  Scenario: Post-force-dedup edge validity — edges referencing kept node remain structurally valid
    # After force-dedup keeps the first node registration and discards the pending duplicate, any edges
    # that were already registered against the kept node must remain structurally valid in the graph.
    Given the graph contains node "packages/vibe-cli/vibe.ps1" (first registration, to be kept)
    And the graph contains a "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And a force-dedup cycle seeded with a duplicate "packages/vibe-cli/vibe.ps1" entry fires and discards the pending duplicate
    When the graph is built via "tsx graph/index.ts" after force-dedup completes
    Then the build succeeds
    And the graph contains exactly one node with id "packages/vibe-cli/vibe.ps1"
    And the "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1" is still present
    And no dangling-reference error is reported for the kept node's edges

  Scenario: MaxGraphOps=0 zero-budget epoch — every add-operation is immediately silently disabled
    # Zero-budget misconfiguration: MaxGraphOps=0 means graphOpsCount < MaxGraphOps is NEVER
    # satisfied — both GraphAddNode and GraphAddEdge are disabled from the first call. Every epoch
    # produces an empty write: no node or edge is ever accepted into graphNodes or graphEdges.
    # The close hook still fires (the agent session ends normally); it writes a CLAUDE.md with
    # section headers but no items. No error is surfaced to agents for any add-operation.
    # SILENT MISCONFIGURATION: the system runs, hooks fire, close hook writes — but no graph data
    # is ever accumulated. Without this BDD scenario, a MaxGraphOps=0 misconfiguration would not
    # be caught by any BDD regression test.
    # NOTE: MaxGraphOps=0 is NOT modeled as a special case in TLA+ — the guard condition
    # graphOpsCount < MaxGraphOps evaluates to FALSE immediately for all add-operations.
    Given the knowledge graph is configured with MaxGraphOps=0 (zero add-operation budget)
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1"
    Then the add-operation is silently disabled by the graphOpsCount=MaxGraphOps guard condition (graphOpsCount=0 is never < MaxGraphOps=0)
    And the call completes without returning an error to the agent
    And no node with id "packages/vibe-cli/vibe.ps1" is added to the graph
    And no agent notification is sent for the silently disabled operation
    When an agent calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    Then the edge add-operation is also silently disabled
    And no edge is added to the graph
    When the agent session ends and the close hook runs "tsx graph/index.ts"
    Then the CLAUDE.md is written with section headers but no items (empty graph output)
    And no [WARN] line is written to the pipeline log for the empty write (this is not a failure — it is the configured behavior)
    And the pipeline continues

  Scenario: graphOpsCount at MaxGraphOps boundary — additional add-operation is silently disabled
    # TLA+ formal model: GraphAddNode and GraphAddEdge are both guarded by graphOpsCount < MaxGraphOps.
    # When graphOpsCount = MaxGraphOps, both add-actions are disabled by their guards.
    # The behavior is SILENT DISABLE: the add-operation call completes without returning an error to
    # the agent; the graph does not record the operation; no agent notification is sent; no pipeline
    # log entry is written. The agent can still complete its session and trigger the close-hook write.
    # NOTE: The no-silent-drop invariant does NOT apply at this boundary — TLA+'s guard-based disable
    # is intentionally silent. MaxGraphOps is defined in the TLA+ specification; the concrete value
    # must be confirmed in the implementation spec before this scenario can be fully step-defined.
    Given the knowledge graph has processed exactly MaxGraphOps add-operations in the current epoch
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/boundary-test-node.ts"
    Then the add-operation call completes without returning an error to the agent
    And the graph does not contain a node with id "packages/vibe-cli/boundary-test-node.ts"
    And no agent notification is sent for the silently disabled operation
    And no pipeline log entry is written for the boundary condition

  Scenario: retryCount resets to 0 after force-dedup completes — intra-epoch reset (GraphAfterForceDedup)
    # TLA+ GraphAfterForceDedup sets retryCount'=0 and graphState'="collecting" intra-epoch.
    # This is an INTRA-EPOCH reset: the agent session has not yet ended; the current epoch continues.
    # Distinct from the epoch-end reset (GraphWriteSuccess/GraphWriteFail): this fires within the
    # dedup state machine, allowing subsequent add-operations to start with a fresh retry budget.
    Given a graph dedup cycle reached force-dedup for node "packages/vibe-cli/vibe.ps1" (retryCount=3, force-dedup fires)
    When force-dedup completes (GraphAfterForceDedup action executes)
    Then retryCount is reset to 0 (TLA+ GraphAfterForceDedup sets retryCount'=0)
    And the graph state transitions to "collecting" (intra-epoch; the agent session has not ended)
    And subsequent add-operations by the same agent start with a fresh retry budget of MaxRetries=3

  Scenario: retryCount resets to 0 when the agent session ends — epoch-end reset (GraphWriteSuccess/GraphWriteFail)
    # TLA+ GraphWriteSuccess and GraphWriteFail both set retryCount'=0 at epoch close, also resetting
    # graphOpsCount'=0. This epoch-end reset fires regardless of whether force-dedup ran during the epoch.
    # Seeded at graphState="collecting" and retryCount=2 (force-dedup has NOT fired): GraphWriteMarkdown
    # requires graphState="collecting" as its precondition, so the factory Given must establish that state
    # directly. retryCount=2 tests the GraphWriteSuccess/GraphWriteFail reset path without conflating
    # GraphAfterForceDedup (which only fires when retryCount=MaxRetries and a force-dedup has occurred).
    Given a pipeline run is seeded with graphState="collecting" and retryCount=2 (force-dedup has NOT fired during this epoch)
    When the agent session ends and the close hook completes (Invoke-Claude returns; GraphWriteSuccess or GraphWriteFail executes)
    Then retryCount is reset to 0 for the next agent epoch (TLA+ GraphWriteSuccess/GraphWriteFail set retryCount'=0)
    And graphOpsCount is reset to 0 for the next agent epoch
    And the next agent that encounters a first-time duplicate for any node receives an error with retryCount=0

  Scenario: graphOpsCount resets to 0 at epoch-end independently of retryCount — standalone epoch-transition
    # [B8-6] Standalone graphOpsCount epoch-end reset. Prior BDD only asserted graphOpsCount=0 as a
    # secondary Then clause embedded in the retryCount epoch-end reset scenario (above). A standalone
    # scenario is needed to verify the graphOpsCount reset path independently, without conflating it
    # with retryCount behavior. TLA+ S35 covers the terminal-state invariant (graphOpsCount=0 in
    # terminal states); this scenario verifies the observable epoch-transition specifically.
    # Seeded at graphOpsCount=2 with MaxGraphOps=3 (add-budget not exhausted) and retryCount=0
    # (no dedup cycle active). Epoch ends via GraphWriteSuccess or GraphWriteFail.
    Given a pipeline run is seeded with graphState="collecting" and graphOpsCount=2 (MaxGraphOps=3, budget not exhausted)
    And retryCount=0 (no dedup cycle is active in this epoch)
    When the agent session ends and the close hook completes (Invoke-Claude returns; GraphWriteSuccess or GraphWriteFail executes)
    Then graphOpsCount is reset to 0 for the next agent epoch (TLA+ GraphWriteSuccess/GraphWriteFail set graphOpsCount'=0)
    And the next agent epoch begins with a full graphOpsCount budget of MaxGraphOps
    And retryCount remains 0 (no dedup reset occurs because retryCount was already 0 — this path is independent of retryCount)

  Scenario: retryCount resets to 0 after force-dedup — subsequent distinct node adds succeed with full retry allotment
    Given force-dedup completed for node "packages/vibe-cli/vibe.ps1" (retryCount was reset to 0 by GraphAfterForceDedup)
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/config/model-routing.psd1"
    And the graph is built via "tsx graph/index.ts"
    Then the build succeeds
    And the graph contains node "packages/vibe-cli/config/model-routing.psd1"
    And no force-dedup is triggered for "packages/vibe-cli/config/model-routing.psd1"

  Scenario: Second distinct duplicate encountered after force-dedup gets the full MaxRetries cycle
    # This is a first-detection event for the new path. retryCount=0 at dedup_error entry;
    # GraphRetry fires after the error is emitted and increments retryCount from 0 to 1.
    Given force-dedup completed for node "packages/vibe-cli/vibe.ps1" and retryCount was reset to 0
    And the graph now contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    When the agent calls .addNode() with type "file" and id "packages/vibe-cli/utils/invoke-claude.ps1" introducing a new duplicate
    And the graph is rebuilt via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate node "packages/vibe-cli/utils/invoke-claude.ps1"
    And the error sent to the agent contains the current retryCount value of 0
    And the agent has a full allotment of MaxRetries = 3 retry attempts for this new duplicate

  Scenario: MaxRetries=0 zero-retries configuration — first duplicate immediately triggers force-dedup with no agent notification
    # Zero-retries misconfiguration: MaxRetries=0 means force-dedup fires on the FIRST duplicate
    # detection event (no retry budget at all). The agent receives no error message warning before
    # force-dedup discards the pending duplicate. This is a silent misconfiguration: the system
    # runs, force-dedup fires, and the agent is never notified of the dropped entry.
    # NOTE: MaxRetries=0 is NOT modeled as a special case in TLA+ — the guard condition
    # "retryCount >= MaxRetries" evaluates immediately on the first detection event.
    # This scenario verifies that zero-retries configurations do not silently bypass the force-dedup
    # path and that the [WARN] log entry is written even when MaxRetries=0.
    # SILENT MISCONFIGURATION: no BDD coverage previously existed for this boundary. Without this
    # scenario, a MaxRetries=0 misconfiguration would not be caught by any BDD regression test.
    Given the graph is configured with MaxRetries=0 (zero retry budget — force-dedup fires on first duplicate)
    And the graph contains node "packages/vibe-cli/vibe.ps1"
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1" (first duplicate detection)
    And the graph is built via "tsx graph/index.ts"
    Then force-dedup fires immediately on the first detection event — no error message is sent to the agent
    And no retry error messages are sent to the agent (MaxRetries=0 means retryCount never reaches 1)
    And the pending duplicate "packages/vibe-cli/vibe.ps1" is discarded — it was never accepted into graphNodes
    And a [WARN] line is written to the pipeline log (stdout) recording that "packages/vibe-cli/vibe.ps1" was force-deduplicated
    And the pipeline continues

  Scenario: MaxRetries=1 boundary — force-dedup fires on the second failure, not the first (OBJ-9)
    # MaxRetries=1 is the critical off-by-one boundary: exactly one retry before force-dedup fires.
    # Two common implementation errors this scenario detects:
    #   (1) Bug: force-dedup fires on the FIRST failure (treating MaxRetries=1 as MaxRetries=0) —
    #       the agent would receive no error message before force-dedup silently discards the entry.
    #   (2) Bug: a SECOND error message is sent when retryCount=MaxRetries=1 (treating >= as >) —
    #       the agent would receive two error messages when only one is allowed.
    # Correct behavior: first failure → one error message (retryCount=0 < MaxRetries=1); GraphRetry
    # fires and sets retryCount=1 (= MaxRetries); second failure → force-dedup fires immediately
    # with no additional error message. Force-dedup trigger predicate: retryCount >= MaxRetries.
    Given the graph is configured with MaxRetries=1 (exactly one retry error before force-dedup)
    And the graph contains node "packages/vibe-cli/vibe.ps1"
    When an agent calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1" (first duplicate detection — retryCount=0 at dedup_error entry)
    And the graph is built via "tsx graph/index.ts"
    Then the build fails with an error indicating a duplicate node "packages/vibe-cli/vibe.ps1"
    And the error sent to the agent contains the current retryCount value of 0
    And force-dedup has NOT yet fired — the agent receives exactly one error message (retryCount=0 < MaxRetries=1, not yet at the trigger boundary)
    When the agent calls .addNode() again with type "file" and id "packages/vibe-cli/vibe.ps1" without removing the duplicate (second attempt — retryCount=MaxRetries=1 >= MaxRetries=1, force-dedup trigger fires)
    And the graph is rebuilt via "tsx graph/index.ts"
    Then force-dedup fires on the second failure — no second error message is sent to the agent (retryCount=1 >= MaxRetries=1)
    And the pending duplicate "packages/vibe-cli/vibe.ps1" is discarded — it was never accepted into graphNodes
    And a [WARN] line is written to the pipeline log (stdout) recording that "packages/vibe-cli/vibe.ps1" was force-deduplicated
    And the pipeline continues

  Scenario: GraphRetryNodeSuccess — retrying→building transition after agent fix (D7 observable)
    # D7 (TLA+-verified via TLC): after GraphRetry fires and graphState transitions to "retrying",
    # a successful build attempt by the agent causes graphState to transition from "retrying" to
    # "collecting" via GraphRetryNodeSuccess (or GraphRetryEdgeSuccess for edges).
    # The "building" state is the intermediate between "retrying" and the build outcome.
    # This scenario anchors the retrying→building→collecting path at the BDD step-definition level.
    # Prior BDD covered GraphNodeBuildSuccess from graphState="dedup_error" using factory steps that
    # bypassed the retrying state entirely. This scenario exercises the D7 path explicitly.
    # Integration test anchor: step definitions must observe graphState="retrying" as the precondition
    # and assert graphState="collecting" as the postcondition via the GraphRetryNodeSuccess action.
    Given a graph dedup cycle has entered graphState="retrying" for duplicate node "packages/vibe-cli/vibe.ps1" (GraphRetry fired; retryCount=1)
    And the seeded state is verified: graphState="retrying" and retryCount=1 and pendingNode="packages/vibe-cli/vibe.ps1" before the When step executes
    When the agent removes the duplicate .addNode() call for "packages/vibe-cli/vibe.ps1"
    And the graph is rebuilt via "tsx graph/index.ts" (the build attempt from graphState="retrying")
    Then the build succeeds (GraphRetryNodeSuccess fires)
    And graphState transitions from "retrying" to "collecting" (the retrying→building→collecting D7 path)
    And retryCount is reset to 0 (TLA+ GraphRetryNodeSuccess sets retryCount'=0)
    And the graph contains exactly one node with id "packages/vibe-cli/vibe.ps1"
    And no force-dedup entry is written to the pipeline log

  Scenario: GraphRetryEdgeSuccess — retrying→building transition after agent edge fix (D7 observable)
    # Parallel of the node case for edge duplicates. GraphRetryEdgeSuccess fires when the build
    # attempt from graphState="retrying" succeeds for an edge duplicate.
    # Integration test anchor: step definitions must observe graphState="retrying" as the precondition.
    Given a graph dedup cycle has entered graphState="retrying" for duplicate "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1" (GraphRetry fired; retryCount=1)
    And the seeded state is verified: graphState="retrying" and retryCount=1 and pendingEdge=<<packages/vibe-cli/vibe.ps1,packages/vibe-cli/utils/invoke-claude.ps1>> before the When step executes
    When the agent removes the duplicate .addEdge() call for that "calls" edge
    And the graph is rebuilt via "tsx graph/index.ts" (the build attempt from graphState="retrying")
    Then the build succeeds (GraphRetryEdgeSuccess fires)
    And graphState transitions from "retrying" to "collecting" (the retrying→building→collecting D7 path)
    And retryCount is reset to 0 (TLA+ GraphRetryEdgeSuccess sets retryCount'=0)
    And the graph contains exactly one "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And no force-dedup entry is written to the pipeline log

  Scenario: D32 — single-node self-loop forced exhaustion via StillDuplicate alone (GraphRetryEdgeSingleNodeForcedExhaustion)
    # D32 (GraphRetryEdgeSingleNodeForcedExhaustionIsDeclaredAbstraction): TLC-verified at model
    # level. Observable: when the ONLY node in the graph is "packages/vibe-cli/vibe.ps1" and the
    # agent keeps re-submitting a duplicate self-loop edge <<vibe.ps1,vibe.ps1>>, every retry
    # returns StillDuplicate (there is no alternative edge the agent can substitute that avoids
    # the duplicate). This forces exhaustion via StillDuplicate alone — the agent cannot break out
    # of the dedup cycle without removing the edge entirely. D19 inherited-budget semantics apply
    # throughout: retryCount increments monotonically with no per-cycle reset until force-dedup fires.
    # This scenario is the BDD observable anchor for D32. Step definitions must verify that:
    #   (1) each retry reports StillDuplicate (no alternative paths available)
    #   (2) retryCount increments via inherited D19 semantics (not per-cycle reset)
    #   (3) force-dedup fires after MaxRetries+1 total failures and discards the pending self-loop
    #   (4) the graph retains the original self-loop edge (first registration kept)
    Given the knowledge graph contains exactly one node: "packages/vibe-cli/vibe.ps1"
    And the graph contains a "calls" self-loop edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/vibe.ps1" (first registration — kept)
    And a dedup cycle is seeded at retryCount=MaxRetries (=3) for the duplicate self-loop edge (D19: inherited budget from prior retries)
    And the seeded state is verified: graphState="dedup_error" and retryCount=3 and pendingEdge=<<packages/vibe-cli/vibe.ps1,packages/vibe-cli/vibe.ps1>> before the When step executes
    When the agent re-submits the duplicate self-loop edge <<packages/vibe-cli/vibe.ps1,packages/vibe-cli/vibe.ps1>> again (no alternative edge available — single-node graph)
    And the graph is rebuilt via "tsx graph/index.ts"
    Then force-dedup fires (the (MaxRetries+1)th failure — no error message sent to agent; GraphForceDedup executes)
    And the pending duplicate self-loop edge is discarded — it was never accepted into graphEdges
    And the original "calls" self-loop edge from "packages/vibe-cli/vibe.ps1" to itself is retained in the graph
    And a [WARN] line is written to the pipeline log (stdout) recording that the self-loop edge was force-deduplicated
    And the pipeline continues

  Scenario: MaxGraphOps boundary with active dedup cycle — dedup resolves; subsequent add-operations silently disabled
    # Combined dual-silent-failure path: no single existing scenario covers both the dedup
    # resolution path AND the MaxGraphOps silent-disable boundary in the same epoch.
    # This scenario seeds graphOpsCount=MaxGraphOps at the moment a dedup cycle resolves.
    # After resolution, the next add-operation is silently disabled by the MaxGraphOps guard.
    # The observable: (1) dedup resolves cleanly via build success; (2) subsequent add-operation
    # completes without error but the operation is silently dropped; (3) no agent notification.
    # The dual-silent-failure risk: a regression allowing add-operations past MaxGraphOps during
    # or after a dedup cycle would not be caught without this combined scenario.
    Given the knowledge graph is in graphState="dedup_error" with a pending duplicate for node "packages/vibe-cli/vibe.ps1"
    And graphOpsCount is at MaxGraphOps (the epoch add-budget is fully consumed)
    And the seeded state is verified: graphState="dedup_error" and graphOpsCount=MaxGraphOps before the When step executes
    When the agent removes the duplicate .addNode() call for "packages/vibe-cli/vibe.ps1"
    And the graph is rebuilt via "tsx graph/index.ts" (dedup resolves — GraphNodeBuildSuccess fires)
    Then the build succeeds and graphState transitions to "collecting"
    And graphOpsCount remains at MaxGraphOps (the dedup resolution does not consume add-budget)
    And retryCount is reset to 0 (GraphNodeBuildSuccess sets retryCount'=0)
    When the agent then calls .addNode() with type "file" and id "packages/vibe-cli/new-node.ts" (a new, non-duplicate node)
    Then the add-operation is silently disabled by the graphOpsCount=MaxGraphOps guard condition
    And the call completes without returning an error to the agent
    And no node with id "packages/vibe-cli/new-node.ts" is added to the graph
    And no agent notification is sent for the silently disabled post-dedup operation

# =============================================================================
# Knowledge Graph — Build and CLAUDE.md Output
# =============================================================================

Feature: Knowledge graph close hook builds markdown and overwrites root CLAUDE.md
  Each agent's close hook runs tsx graph/index.ts to produce dense machine-readable markdown.
  The close hook fires exactly once per agent — when the agent session ends (Invoke-Claude returns).
  The next pipeline stage must not begin until the close hook completes.

  Scenario: Close hook fires when agent session ends
    Given an agent session was invoked via Invoke-Claude with Role "code-writer"
    When the Claude CLI process launched by Invoke-Claude exits (agent session ends)
    Then the close hook runs "tsx graph/index.ts" before the next pipeline stage begins

  Scenario: Close-hook sequencing contract — next pipeline stage must not begin until close hook completes
    # Named ordering invariant: the sequencing contract stated in the "Agent session ends" glossary
    # entry must be verifiable as a standalone BDD scenario, not only inferred from the glossary.
    # This scenario asserts the intermediate ordering state: the pipeline is in a "post-agent / pre-next-stage"
    # window that is only exited when the close hook process exits.
    Given an agent session ends (the Claude CLI process launched by Invoke-Claude exits)
    When the close hook "tsx graph/index.ts" begins executing
    Then no subsequent pipeline stage begins executing while the close hook is running
    And the subsequent pipeline stage begins only after the close hook process exits with any exit code
    And the ordering contract holds regardless of whether the close hook succeeds or fails

  Scenario: Close-hook sequencing VIOLATION — detectable observable when next stage begins prematurely
    # [B8-7] Negative test for the sequencing contract. Without a negative path, the step definition
    # for "no subsequent pipeline stage begins while the close hook is running" cannot be automated
    # as a failing test — there is no observable to assert AGAINST.
    # A sequencing violation is detectable via the pipeline log: if a next-stage log entry (e.g.,
    # "[STAGE] <name> started") appears in the pipeline log (stdout) BEFORE the close hook process
    # exits, this constitutes a detectable sequencing violation. The pipeline log is timestamped;
    # the close hook process exit time is measurable. The violation is defined as:
    #   timestamp(next-stage-start log entry) < timestamp(close hook process exit)
    # Step definitions for the positive sequencing contract scenario MUST use this same observable
    # (no next-stage log entry before hook process exit) as the failure criterion.
    Given an agent session has ended and the close hook "tsx graph/index.ts" is running
    And the close hook has NOT yet exited (the tsx process is still executing)
    When the pipeline controller prematurely starts the next pipeline stage before the close hook exits
    Then the pipeline log (stdout) contains a next-stage-start log entry
    And the timestamp of the next-stage-start log entry is BEFORE the timestamp of the close hook process exit
    And this timestamp ordering constitutes a detectable sequencing violation
    And a sequencing violation detector (integration test or pipeline harness check) can observe this as a test failure

  Scenario: Close hook fires exactly once per agent — first session (elicitor)
    # [B8-5] Split from the former data-table scenario that referenced "session 1" and "session 2"
    # as prose strings not bound to table columns. Replaced with two explicit standalone scenarios
    # (this one and the next) covering each agent session independently. Each scenario is
    # independently runnable by step definition authors without ambiguous table-column interpretation.
    Given an elicitor agent session completes (the Claude CLI process launched by Invoke-Claude for the elicitor exits)
    When the elicitor agent session ends
    Then the close hook fires exactly once for the elicitor session
    And the close hook does not fire zero times (missing exactly-once guarantee)
    And the close hook does not fire twice (double-fire guarantee)
    And the "tsx graph/index.ts" process is invoked exactly once for this elicitor session

  Scenario: Close hook fires exactly once per agent — second sequential session (code-writer)
    # [B8-5] Second explicit scenario covering the second sequential agent session in the same
    # pipeline run. Combined with the elicitor scenario above, these two scenarios assert the
    # exactly-once contract across all agent sessions without ambiguous table-binding.
    Given an elicitor agent session has already completed in this pipeline run (close hook fired once for it)
    And a code-writer agent session now completes (the Claude CLI process launched for the code-writer exits)
    When the code-writer agent session ends
    Then the close hook fires exactly once for the code-writer session
    And the close hook does not fire zero times for the code-writer session
    And the close hook does not fire twice for the code-writer session
    And the "tsx graph/index.ts" process has been invoked exactly 2 times total across the pipeline run (once per completed agent session)

  Scenario: Close hook generates CLAUDE.md with node sections
    # Node identity: full path only. Bare filenames are not valid node identities.
    Given the graph contains file nodes "packages/vibe-cli/vibe.ps1", "packages/vibe-cli/utils/invoke-claude.ps1", "packages/vibe-cli/config/state-repository.psd1"
    When the close hook runs "tsx graph/index.ts"
    Then the root "CLAUDE.md" contains a "## Files" header
    And the "## Files" section lists "packages/vibe-cli/vibe.ps1, packages/vibe-cli/utils/invoke-claude.ps1, packages/vibe-cli/config/state-repository.psd1" as comma-separated items

  Scenario: Close hook generates CLAUDE.md with edge sections
    # Node identity: full path only. Bare filenames are not valid node identities.
    Given the graph contains a "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And the graph contains a "depends_on" edge from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/config/state-repository.psd1"
    When the close hook runs "tsx graph/index.ts"
    Then the root "CLAUDE.md" contains a "## calls" header
    And the "## calls" section lists "packages/vibe-cli/vibe.ps1 -> packages/vibe-cli/utils/invoke-claude.ps1"
    And the root "CLAUDE.md" contains a "## depends_on" header
    And the "## depends_on" section lists "packages/vibe-cli/utils/invoke-claude.ps1 -> packages/vibe-cli/config/state-repository.psd1"

  Scenario: Close hook overwrites existing CLAUDE.md
    Given a root "CLAUDE.md" exists with prior graph content
    When the close hook runs "tsx graph/index.ts"
    Then the root "CLAUDE.md" is overwritten with the current graph state
    And prior content is fully replaced

  Scenario: Next agent reads updated CLAUDE.md from previous agent's close hook
    # Node identity: full path only.
    Given agent A's close hook wrote a "CLAUDE.md" containing nodes "packages/vibe-cli/vibe.ps1" and "packages/vibe-cli/utils/invoke-claude.ps1"
    When agent B starts
    Then agent B's context includes the "CLAUDE.md" with nodes "packages/vibe-cli/vibe.ps1" and "packages/vibe-cli/utils/invoke-claude.ps1"

  Scenario: Empty graph produces CLAUDE.md with section headers and no items
    Given the knowledge graph has no nodes or edges
    When the close hook runs "tsx graph/index.ts"
    Then the root "CLAUDE.md" is written
    And the file contains section headers but no items

  Scenario: Atomic write mechanism — close hook writes graph output to a temp file then renames to CLAUDE.md
    # Tests the write mechanism only. Behavioral guarantee is in the crash-during-write scenario.
    Given the close hook is configured to write "CLAUDE.md" atomically
    When the close hook runs "tsx graph/index.ts"
    Then the graph output is written to a temp file in the repo root directory first
    And the temp file is renamed to "CLAUDE.md" as the final atomic step

  Scenario: Crash during temp-file write preserves prior CLAUDE.md intact — no partial file at canonical path
    # Tests the behavioral postcondition only. Write mechanism is in the atomic write scenario.
    Given a prior "CLAUDE.md" exists at the repo root containing valid graph output
    When the tsx process crashes during the temp-file write phase before the atomic rename completes
    Then the canonical "CLAUDE.md" at the repo root remains intact and unchanged from the prior successful build
    And no partial or truncated content appears at the canonical "CLAUDE.md" path
    And the pipeline log records a [WARN] entry indicating the close-hook failed before completing the atomic rename

  Scenario: Atomic write temp-file rename failure — prior CLAUDE.md remains intact, temp file persists on disk
    # Distinct from crash-during-write: the temp file is written successfully but the rename step fails
    # (e.g., CLAUDE.md is locked by another process at the moment of rename). Observable state is
    # different from crash-during-write: the temp file exists and is complete; the prior CLAUDE.md is
    # intact at the canonical path. The operator recovery action is also different (unlock the target
    # and re-run the close hook, not investigate partial file corruption).
    Given a prior "CLAUDE.md" exists at the repo root containing valid graph output
    And the close hook writes the temp file to the repo root directory successfully
    When the atomic rename of the temp file to "CLAUDE.md" fails (e.g., "CLAUDE.md" is locked by another process)
    Then the canonical "CLAUDE.md" at the repo root remains intact and unchanged from the prior successful build
    And the temp file remains on disk (it was written successfully before the rename failed)
    And a [WARN] line is written to the pipeline log (stdout) describing the rename failure
    And the pipeline continues
    And markdownState remains "stale" (the canonical CLAUDE.md is the prior version, not the new content)

  Scenario: Final-agent close hook success transitions graphState to "done" — pipeline termination condition met
    # [B8-8] TLA+ GraphWriteSuccess terminal branch: agentsCompleted+1 >= MaxAgents → graphState="done".
    # Prior close-hook scenarios cover mid-pipeline agents (GraphWriteSuccess returns graphState to
    # "collecting" when agentsCompleted+1 < MaxAgents) or warn paths. This dedicated scenario covers
    # the final-agent terminal branch: when the last agent's close hook succeeds and agentsCompleted
    # increments to MaxAgents, graphState transitions to "done" (not back to "collecting").
    # The pipeline termination condition (PipelineComplete guard) is then met: routingState=done ∧
    # graphState=done ∧ hookState∈{idle,done,error}. This is the primary success terminal for the
    # knowledge graph subsystem.
    Given a pipeline run with MaxAgents=2 where the first agent's close hook has already succeeded (agentsCompleted=1)
    And the second (final) agent session completes its work and its close hook runs "tsx graph/index.ts" successfully
    When the final agent's close hook exits with exit code 0 (GraphWriteSuccess fires; agentsCompleted increments from 1 to 2)
    Then agentsCompleted reaches MaxAgents (agentsCompleted=2 = MaxAgents=2)
    And graphState transitions to "done" (NOT back to "collecting" — the terminal branch fires because agentsCompleted >= MaxAgents)
    And the pipeline termination condition is met: routingState=done ∧ graphState=done ∧ hookState∈{idle,done,error}
    And the pipeline reaches its terminal "done" state (pipelineState=done)
    And no [WARN] line is written to the pipeline log (stdout) for the final agent's close hook

  Scenario: tsx process hangs during close hook — pipeline continues after closeHookTimeout expires
    # closeHookTimeout: the maximum duration allowed for "tsx graph/index.ts" before forcible termination.
    # Pipeline hang risk: a hung tsx process blocks all subsequent pipeline stages.
    # NOTE: closeHookTimeout falls OUTSIDE the TLA+ verification scope. No GraphTimeout or close-hook
    # timeout action exists in the TLA+ model. Behavioral correctness verified by integration tests only.
    Given an agent session has ended (Invoke-Claude returns)
    And the close hook starts "tsx graph/index.ts"
    When the tsx process does not exit within the configured closeHookTimeout
    Then the close hook terminates the hung tsx process after the timeout expires
    And a [WARN] line is written to the pipeline log (stdout) indicating the close-hook timed out
    And the pipeline continues to the next stage
    And the stale "CLAUDE.md" from the previous successful build persists unchanged
    And markdownState remains "stale" — closeHookTimeout leaves the canonical CLAUDE.md from the prior successful build unmodified

# =============================================================================
# Knowledge Graph — Graph Starts Clean
# =============================================================================

Feature: Knowledge graph starts with no pre-seeded data
  The graph begins empty and is populated only by agent discoveries

  Scenario: Fresh graph has no nodes
    Given the "packages/vibe-cli/graph/" directory is initialized
    And no agents have run yet
    When the graph is queried for all nodes
    Then zero nodes are returned

  Scenario: Fresh graph has no edges
    Given the "packages/vibe-cli/graph/" directory is initialized
    And no agents have run yet
    When the graph is queried for all edges
    Then zero edges are returned

  Scenario: Undiscovered directories do not exist in graph
    Given agents have only discovered nodes under "packages/vibe-cli/"
    When the graph is queried for nodes under "apps/web/"
    Then no nodes are returned for "apps/web/"

# =============================================================================
# Knowledge Graph — Error Handling
# =============================================================================

Feature: Knowledge graph handles build errors gracefully
  Non-duplicate close-hook failures transition graphState to "warn" and allow the pipeline to continue.
  graphState=warn is a valid terminal condition — the pipeline reaches "done" with a warning.
  This is distinct from hookState=error (PreToolUse search hook failure): graphState tracks the
  knowledge graph / close-hook state machine; hookState tracks the es/rg rewriting hook.

  Scenario: Non-duplicate graph compilation failure logs warning and continues (graphState=warn)
    Given the graph contains valid nodes and edges
    And a non-duplicate compilation error occurs during "tsx graph/index.ts"
    When the close hook runs
    Then a [WARN] line is written to the pipeline log (stdout) describing the compilation failure
    And the pipeline continues
    And the stale "CLAUDE.md" from the previous successful build persists unchanged

  Scenario: Close hook write failure on first agent epoch — no prior CLAUDE.md exists (markdownState=none)
    # Distinct from the stale CLAUDE.md case: there is no prior CLAUDE.md to fall back to.
    # markdownState="none" means no successful write has ever occurred in this pipeline run.
    Given no "CLAUDE.md" exists at the repo root (markdownState="none")
    And the first agent's close hook fails with a non-duplicate compilation error during "tsx graph/index.ts"
    When the close hook exits with a non-zero code
    Then no "CLAUDE.md" is created at the repo root
    And a [WARN] line is written to the pipeline log (stdout) describing the close-hook failure
    And the pipeline continues
    And the next agent starts with no "CLAUDE.md" to read

  Scenario: Two consecutive close hook write failures leave no CLAUDE.md — third succeeds (none→none→current)
    # none→none→current recovery arc: two separate agent epochs both fail to write CLAUDE.md
    # (markdownState remains "none" after each), then a third epoch's close hook succeeds.
    # Qualitatively distinct from the stale→current arc: there is never a prior CLAUDE.md to fall
    # back to; each of the two failing agents operates with no CLAUDE.md context at all.
    Given no "CLAUDE.md" exists at the repo root (markdownState="none")
    And the first agent's close hook fails with a non-duplicate compilation error (markdownState remains "none")
    And the second agent starts with no "CLAUDE.md" (markdownState="none")
    And the second agent's close hook also fails with a non-duplicate compilation error (markdownState remains "none")
    And a third agent starts, discovers node "packages/vibe-cli/vibe.ps1", and its close hook succeeds
    When the third agent's close hook runs "tsx graph/index.ts" successfully
    Then the root "CLAUDE.md" is created for the first time in this pipeline run (markdownState transitions from "none" to "current")
    And the "CLAUDE.md" contains node "packages/vibe-cli/vibe.ps1"
    And no [WARN] line is written to the pipeline log (stdout) for the third agent's close hook
    And subsequent agents read the up-to-date "CLAUDE.md" reflecting the current graph state

  Scenario: Two consecutive close hook write failures with prior CLAUDE.md — third succeeds (stale→stale→current)
    # stale→stale→current recovery arc: regression test for R11 TLA+ bug fix.
    # R11 fixed the stale→none regression where a second consecutive write failure would incorrectly
    # transition markdownState to "none" (discarding the prior CLAUDE.md path). The correct behavior
    # is that markdownState remains "stale" through consecutive failures — the prior CLAUDE.md persists.
    # Qualitatively distinct from none→none→current: a prior CLAUDE.md exists throughout both failures
    # and subsequent agents can still read the stale file.
    Given a "CLAUDE.md" exists at the repo root containing node "packages/vibe-cli/vibe.ps1" (from a prior successful build)
    And the most recent agent's close hook failed with a non-duplicate compilation error (markdownState="stale" — first failure in this pair)
    And the next agent's close hook also fails with a non-duplicate compilation error (markdownState remains "stale" — second consecutive failure)
    And a subsequent agent starts, discovers node "packages/vibe-cli/config/model-routing.psd1", and its close hook succeeds
    When the subsequent agent's close hook runs "tsx graph/index.ts" successfully
    Then the root "CLAUDE.md" is overwritten with the current graph state (markdownState transitions from "stale" to "current")
    And the "CLAUDE.md" contains node "packages/vibe-cli/config/model-routing.psd1"
    And no [WARN] line is written to the pipeline log (stdout) for the successful close hook
    And subsequent agents read the up-to-date "CLAUDE.md" reflecting the current graph state

  Scenario: Agent creates node with wrong path becomes an orphan
    Given the graph contains node "packages/vibe-cli/nonexistent-file.ps1" with type "file"
    And no other node references "packages/vibe-cli/nonexistent-file.ps1"
    When the graph is built via "tsx graph/index.ts"
    Then the node "packages/vibe-cli/nonexistent-file.ps1" exists as an orphan node in the graph
    And no automatic cleanup is performed on the orphan node

  Scenario: Close hook failure preserves stale CLAUDE.md for the next agent (markdownState=stale)
    # Node identity: full path only.
    # markdownState="stale" means a prior CLAUDE.md exists but the most recent write failed.
    Given a prior "CLAUDE.md" exists containing nodes "packages/vibe-cli/vibe.ps1" and "packages/vibe-cli/utils/invoke-claude.ps1"
    And agent A's close hook fails due to a non-duplicate compilation error (graphState transitions to "warn")
    When agent B starts
    Then agent B's context contains the stale "CLAUDE.md" with nodes "packages/vibe-cli/vibe.ps1" and "packages/vibe-cli/utils/invoke-claude.ps1"
    And agent B's context does not reflect any nodes agent A discovered during its session

  Scenario: Successful close hook after a failed write recovers markdownState from stale to current
    # TLA+-verified self-healing path: markdownState transitions "stale" → "current" when a
    # subsequent agent's close hook succeeds after a prior write failure. The prior stale CLAUDE.md
    # is replaced by the new successful write. This scenario covers the recovery arc end-to-end.
    # Node identity: full path only.
    Given a "CLAUDE.md" exists at the repo root containing nodes "packages/vibe-cli/vibe.ps1" and "packages/vibe-cli/utils/invoke-claude.ps1"
    And the most recent close hook failed with a non-duplicate compilation error (markdownState="stale")
    And a subsequent agent session has run and discovered node "packages/vibe-cli/config/state-repository.psd1"
    When that subsequent agent's close hook runs "tsx graph/index.ts" successfully
    Then the root "CLAUDE.md" is overwritten with the current graph state (markdownState transitions to "current")
    And the "CLAUDE.md" now contains nodes "packages/vibe-cli/vibe.ps1", "packages/vibe-cli/utils/invoke-claude.ps1", and "packages/vibe-cli/config/state-repository.psd1"
    And no [WARN] line is written to the pipeline log (stdout) for this successful close hook
    And the next agent reads the up-to-date "CLAUDE.md" reflecting the current graph state

  Scenario: Mid-pipeline GraphWriteFail returns graphState to "collecting" — not "warn" (B9)
    # [B9] Missing scenario identified in unified-debate. All prior write-failure scenarios are
    # ambiguous between the FINAL-AGENT path (GraphWriteFail → graphState="warn") and the
    # MID-PIPELINE path (GraphWriteFail → graphState="collecting"). D31 declares this ELSE
    # branch TLC-unverified for MaxAgents > 1.
    #
    # TLA+ GraphWriteFail branching:
    #   IF agentsCompleted + 1 >= MaxAgents THEN graphState' = "warn"   (final agent — pipeline terminates)
    #   ELSE                                     graphState' = "collecting"  (mid-pipeline — collection resumes)
    #
    # This scenario explicitly seeds MaxAgents=3 and agentsCompleted=1 (the second agent's close hook
    # is failing — it is NOT the final agent). The ELSE branch fires: graphState returns to "collecting"
    # so that the third agent can still run its close hook and potentially reach "done" or "warn".
    #
    # NOTE (D31 — TLC-unverified): The GraphWriteFail ELSE branch (graphState→"collecting") is
    # structurally present in the TLA+ specification but was NOT verified by TLC in the published
    # model run because the .cfg file sets MaxAgents=1. With MaxAgents=1, every GraphWriteFail is
    # a final-agent failure (the IF branch always fires). The ELSE branch requires MaxAgents >= 2
    # and is verified by integration tests only, not by the formal model.
    Given a pipeline run with MaxAgents=3 and agentsCompleted=1 (the first agent's close hook has already completed)
    And the second agent's session ends and its close hook runs "tsx graph/index.ts"
    And the second agent's close hook fails with a non-duplicate compilation error
    When GraphWriteFail fires for the second agent (agentsCompleted+1 = 2 < MaxAgents = 3)
    Then graphState transitions to "collecting" — NOT to "warn" (the ELSE branch fires because agentsCompleted+1 < MaxAgents)
    And agentsCompleted is incremented to 2 (GraphWriteFail still increments agentsCompleted regardless of the graphState branch)
    And retryCount is reset to 0 (TLA+ GraphWriteFail sets retryCount'=0 in BOTH the terminal IF branch and this ELSE branch — epoch-boundary reset fires regardless of which graphState branch executes)
    And the pipeline continues — graphState="collecting" means the third agent can still run its close hook
    And a [WARN] line is written to the pipeline log (stdout) for the second agent's close-hook failure
    And the stale "CLAUDE.md" from the prior successful build persists unchanged

  Scenario: Mid-pipeline GraphWriteSuccess returns graphState to "collecting" — not "done" (B-3)
    # [B-3] Symmetric partner to B9 (GraphWriteFail ELSE branch). B9 covers the mid-pipeline FAILURE
    # case; this scenario covers the mid-pipeline SUCCESS case. Both exercise the ELSE branch:
    #   agentsCompleted + 1 < MaxAgents → graphState' = "collecting"  (mid-pipeline; collection resumes)
    # The terminal IF branch (agentsCompleted + 1 >= MaxAgents → graphState = "done") was covered by
    # the "Final-agent close hook success" scenario. The ELSE branch for GraphWriteSuccess was absent.
    #
    # TLA+ GraphWriteSuccess branching:
    #   IF agentsCompleted + 1 >= MaxAgents THEN graphState' = "done"      (final agent — terminal state)
    #   ELSE                                     graphState' = "collecting" (mid-pipeline — collection resumes)
    #
    # This scenario seeds MaxAgents=3, agentsCompleted=1 (the second agent's close hook succeeds —
    # it is NOT the final agent). The ELSE branch fires: graphState returns to "collecting" so that
    # the third agent can still run its close hook and eventually reach "done" or "warn".
    #
    # NOTE (D31 — TLC-unverified): The GraphWriteSuccess ELSE branch (graphState→"collecting") is
    # structurally present in the TLA+ specification but was NOT verified by TLC in the published
    # model run because the .cfg file sets MaxAgents=1. With MaxAgents=1, every GraphWriteSuccess is
    # a final-agent success (the IF branch always fires). The ELSE branch requires MaxAgents >= 2
    # and is verified by integration tests only, not by the formal model. Analogous to B9 (D31 note).
    Given a pipeline run with MaxAgents=3 and agentsCompleted=1 (the first agent's close hook has already completed)
    And the second agent's session ends and its close hook runs "tsx graph/index.ts" successfully
    When GraphWriteSuccess fires for the second agent (agentsCompleted+1 = 2 < MaxAgents = 3)
    Then graphState transitions to "collecting" — NOT to "done" (the ELSE branch fires because agentsCompleted+1 < MaxAgents)
    And agentsCompleted is incremented to 2 (GraphWriteSuccess increments agentsCompleted in both IF and ELSE branches)
    And retryCount is reset to 0 (TLA+ GraphWriteSuccess sets retryCount'=0 at epoch-end in both branches)
    And graphOpsCount is reset to 0 for the next agent epoch (TLA+ GraphWriteSuccess sets graphOpsCount'=0 in both branches)
    And the canonical "CLAUDE.md" is overwritten with the second agent's graph output (GraphWriteSuccess completed the write)
    And markdownState transitions to "current" (the successful write updates the markdown state)
    And the pipeline continues — graphState="collecting" means the third agent can still run its close hook
    And no [WARN] line is written to the pipeline log (stdout) for the second agent's close hook (the write succeeded)

  Scenario: D18 crash-and-restart recovery — CLAUDE.md from epoch 1 persists through process crash
    # D18 (CrashFreeExecutionIsDeclaredAbstraction): TLA+ models crash-free execution only.
    # D18 compensating test obligation was declared at category level ('TypeScript/PowerShell process
    # management') with no named crash+restart scenario. This scenario provides the specific named
    # integration test anchor that D18 requires.
    #
    # Named scenario: crash after epoch 1 close hook succeeds; verify CLAUDE.md from epoch 1 persists
    # and the recovery contract is explicitly tested.
    #
    # Recovery contract: after a process crash and restart, the CLAUDE.md written by epoch 1's
    # successful close hook must be intact at the canonical repo root path. The recovery is
    # observable via TWO channels:
    #   (1) CLAUDE.md file: present and unchanged from epoch 1's write (atomic rename completed
    #       before the crash — the file at the canonical path is always complete).
    #   (2) Next-agent context: agent reading CLAUDE.md after restart sees epoch 1's graph content.
    # NOTE: D18 scope is TypeScript/PowerShell process management — no TLA+ action models crash
    # semantics. Behavioral correctness verified by integration tests only, not by the formal model.
    Given a pipeline run where agent 1 (epoch 1) completed its session successfully
    And agent 1's close hook ran "tsx graph/index.ts" successfully and wrote "CLAUDE.md" containing node "packages/vibe-cli/vibe.ps1" (markdownState="current")
    And the atomic rename completed before the crash — the canonical "CLAUDE.md" at the repo root is the complete epoch-1 output
    When the vibe-cli pipeline process crashes (e.g., PowerShell process exits unexpectedly) after epoch 1 close hook completed but before epoch 2 begins
    And the pipeline process is restarted
    Then the "CLAUDE.md" at the repo root is still present and unchanged from epoch 1's successful write
    And the file contains node "packages/vibe-cli/vibe.ps1" — the epoch-1 graph content is intact
    And the restarted pipeline agent reads the preserved "CLAUDE.md" and receives epoch-1 graph context
    And no partial or corrupted CLAUDE.md is present at the canonical path
    And no recovery action (manual repair, re-seeding) is required for the CLAUDE.md file

  Scenario: Pipeline completes with warning when close hook write fails (graphState=warn)
    # graphState=warn is a valid terminal condition for the pipeline — does not halt.
    # This corresponds to TLA+ PipelineComplete accepting graphState in {"done","warn"}.
    Given all pipeline agent stages have completed
    And the final agent's close hook failed with a non-duplicate compilation error (graphState=warn)
    When the pipeline reaches its terminal state
    Then the pipeline completes in the "done" state
    And a [WARN] line is written to the pipeline log (stdout) indicating the close-hook error
    And the pipeline does not halt

  Scenario: Pipeline completes in done state even when close-hook write failed throughout (graphState=warn)
    Given an agent session completed all of its work
    And the close hook for that session exited with a non-zero code (graphState=warn)
    And no other failure conditions are present in the pipeline
    When the pipeline evaluates its terminal condition
    Then the pipeline state transitions to "done"
    And no pipeline halt or error escalation occurs due to close-hook write failure alone

  Scenario: CLAUDE.md filesystem write failure (locked or read-only path) logs warning and continues
    Given a prior "CLAUDE.md" exists at the repo root
    And the repo root directory is read-only or "CLAUDE.md" is locked by another process
    When the close hook runs "tsx graph/index.ts" and attempts to write the temp file
    Then the write fails with a filesystem error
    And a [WARN] line is written to the pipeline log (stdout) describing the filesystem write failure
    And the pipeline continues
    And the stale "CLAUDE.md" from the prior successful build persists unchanged

  Scenario: Pipeline abort while graphState="collecting" — GraphHaltCleanup preserves prior CLAUDE.md (markdownState UNCHANGED)
    # TLA+ S33 (GraphHaltCleanupPreservesMarkdown) covers all 7 active entry states; "collecting"
    # is the most operationally frequent abort state — agents spend the majority of their session in
    # graphState="collecting" (between add-operations). A pipeline abort arriving while the graph
    # subsystem is in graphState="collecting" (no close-hook write in progress) must transition
    # graphState to "warn" via GraphHaltCleanup and leave markdownState UNCHANGED. B2 covers the
    # "writing" entry state; this scenario covers "collecting" as the primary operational case.
    Given a prior "CLAUDE.md" exists at the repo root containing valid graph output (markdownState="stale" or "current")
    And the graph subsystem is in graphState="collecting" (the agent session is ongoing; no close-hook write is in progress)
    When the pipeline controller receives an abort signal and pipelineState transitions to "halted"
    Then graphState transitions to "warn" via the GraphHaltCleanup halt-cleanup path
    And markdownState is UNCHANGED — the canonical "CLAUDE.md" at the repo root is not modified by the abort
    And a [WARN] line is written to the pipeline log (stdout) indicating the pipeline was aborted while the graph was collecting

  Scenario: Pipeline abort while graphState="writing" with markdownState="stale" entry — GraphHaltCleanup leaves markdownState "stale" (OBJ-11a)
    # [OBJ-11] graphState="writing" is the highest-consequence GraphHaltCleanup entry state:
    # the tsx process has already begun writing the temp file when the pipeline abort arrives.
    # B2: TLA+ S33 (GraphHaltCleanupPreservesMarkdown) covers all 7 active entry states including
    # "writing". Two observable distinctions from GraphWriteFail: (1) the abort originates from the
    # pipeline controller (pipelineState→"halted"), not from a tsx compilation error; (2) the
    # in-flight temp file may be partially written. TLA+ S33: graphState transitions "writing" →
    # "warn" via GraphHaltCleanup (not GraphWriteFail). This scenario seeds markdownState="stale"
    # as the explicit entry state; the parallel scenario (OBJ-11b) seeds markdownState="current".
    Given a prior "CLAUDE.md" exists at the repo root from an earlier successful build (markdownState="stale" — the most recent close hook attempt failed)
    And the close hook has begun writing the temp file (graphState="writing")
    When the pipeline controller receives an abort signal and pipelineState transitions to "halted"
    Then the canonical "CLAUDE.md" at the repo root remains intact and unchanged
    And markdownState is "stale" — GraphHaltCleanup leaves markdownState UNCHANGED (TLA+ S33 markdownState ∈ UNCHANGED); the stale entry value is preserved
    And graphState transitions to "warn" via the GraphHaltCleanup halt-cleanup path (not GraphWriteFail)
    And a [WARN] line is written to the pipeline log (stdout) indicating the close-hook was interrupted by pipeline abort
    And the temp file (if partially written) does not appear at the canonical "CLAUDE.md" path

  Scenario: Pipeline abort while graphState="writing" with markdownState="current" entry — GraphHaltCleanup leaves markdownState "current" (OBJ-11b)
    # [OBJ-11] Parallel to OBJ-11a above: this scenario seeds markdownState="current" (the most
    # recent close hook succeeded before this abort-during-write). The observable distinction is
    # critical: markdownState stays "current" (not "stale") because GraphHaltCleanup sets
    # markdownState ∈ UNCHANGED — the value it holds on entry is the value after abort.
    # Compare with GraphWriteFail: GraphWriteFail transitions current→stale when a close-hook write
    # attempt fails. GraphHaltCleanup does NOT transition markdownState to stale; it leaves whatever
    # value was present. This test is the BDD falsifiability test for the highest-consequence
    # GraphHaltCleanup entry state with a non-stale markdownState input.
    Given the most recent close hook succeeded (markdownState="current" — the canonical "CLAUDE.md" reflects the current graph)
    And a subsequent agent's close hook has begun writing the temp file (graphState="writing")
    When the pipeline controller receives an abort signal and pipelineState transitions to "halted"
    Then the canonical "CLAUDE.md" at the repo root remains intact and unchanged
    And markdownState is "current" — GraphHaltCleanup leaves markdownState UNCHANGED (TLA+ S33 markdownState ∈ UNCHANGED); the current entry value is preserved
    And graphState transitions to "warn" via the GraphHaltCleanup halt-cleanup path (not GraphWriteFail)
    And agentsCompleted is NOT incremented — GraphHaltCleanup bypasses the close-hook write and leaves the counter unchanged
    And a [WARN] line is written to the pipeline log (stdout) indicating the close-hook was interrupted by pipeline abort
    And the temp file (if partially written) does not appear at the canonical "CLAUDE.md" path

  Scenario: Aggregate invariant — markdownState="current" implies agentsCompleted>=1 and most recent close hook succeeded
    # [B8-13] Composed aggregate postcondition. Individual markdownState arc scenarios exist
    # (stale→current recovery, none→current first-write, stale→stale→current two-failure-then-success)
    # but no prior BDD scenario directly asserts the FULL conjunction:
    #   markdownState="current" ∧ agentsCompleted >= 1 ∧ graphState ≠ "warn" (for the most recent close hook)
    # TLA+ structurally enforces this: markdownState="current" is only reachable via GraphWriteSuccess,
    # which also increments agentsCompleted and sets graphState to "collecting" or "done" (never "warn").
    # However, no named TLA+ safety property encodes the full conjunction either.
    # This scenario asserts the observable aggregate invariant as a composed assertion.
    Given a pipeline run where the most recent agent's close hook ran "tsx graph/index.ts" successfully
    And the close hook exited with exit code 0 (GraphWriteSuccess fired)
    And agentsCompleted was incremented to at least 1 by this or a prior successful close hook
    When markdownState is observed as "current" (the canonical "CLAUDE.md" reflects the current graph state)
    Then agentsCompleted is at least 1 — markdownState="current" cannot be reached with agentsCompleted=0
    And the most recent close hook completed without a non-duplicate compilation error — graphState is NOT "warn" for the most recent write
    And the "CLAUDE.md" at the repo root was written by the GraphWriteSuccess path (not by any GraphWriteFail or GraphHaltCleanup path)
    And an agent reading "CLAUDE.md" in this state receives a up-to-date graph context from the most recent successful epoch

  Scenario: Pipeline abort with markdownState="current" — GraphHaltCleanup leaves markdownState unchanged (stays "current")
    # [B7] Missing scenario identified in unified-debate. All existing GraphHaltCleanup scenarios
    # seed markdownState at "none" or "stale". This scenario seeds markdownState="current" and
    # asserts the DISTINCT observable: markdownState STAYS "current" after an abort.
    #
    # The key distinction from GraphWriteFail:
    #   GraphWriteFail: markdownState transitions current→stale (the write attempt failed; the
    #     previously-current CLAUDE.md is now the fallback stale copy).
    #   GraphHaltCleanup: markdownState is UNCHANGED (TLA+ S33: markdownState ∈ UNCHANGED).
    #     The abort fires before the close-hook write even begins; markdownState="current" remains
    #     "current" because the successful prior write is never touched.
    # This observable difference between the two abort-adjacent paths is the behavioral invariant
    # this scenario protects. Without this scenario, a regression that incorrectly transitions
    # markdownState current→stale on abort (confusing GraphHaltCleanup with GraphWriteFail) would
    # pass all existing BDD scenarios — none of which seed markdownState="current".
    Given the most recent agent's close hook succeeded (markdownState="current" — the canonical "CLAUDE.md" is up-to-date)
    And the graph subsystem is in graphState="collecting" (no close-hook write is in progress)
    When the pipeline controller receives an abort signal and pipelineState transitions to "halted" (GraphHaltCleanup fires)
    Then markdownState REMAINS "current" — the abort did not trigger a write attempt; the canonical "CLAUDE.md" is not touched
    And graphState transitions to "warn" via GraphHaltCleanup
    And agentsCompleted is NOT incremented — GraphHaltCleanup bypasses the close-hook write; the counter is left unchanged
    And the canonical "CLAUDE.md" at the repo root remains the same file written by the most recent successful close hook
    And a subsequent agent reading "CLAUDE.md" in this aborted pipeline state would still see up-to-date graph content
    And a [WARN] line is written to the pipeline log (stdout) indicating the pipeline was aborted

# =============================================================================
# Knowledge Graph — data-structure-typed DirectedGraph
#
# NOTE: Valid-type acceptance unit tests for all 5 node types and all 7 edge types are pure unit
# tests of the TypeScript wrapper class boundary with no pipeline involvement. These 12 scenarios
# MUST exist in: packages/vibe-cli/graph/wrapper.test.ts
#
# Minimum coverage assertion: all 12 scenarios listed below must exist and pass in wrapper.test.ts.
# Any CI pipeline running BDD scenarios must fail if fewer than 12 unit scenarios pass in that file.
#
# Delegated scenarios (must exist in packages/vibe-cli/graph/wrapper.test.ts):
#   Node type acceptance:
#     1. addNode with type "app" is accepted by the typed wrapper
#     2. addNode with type "package" is accepted by the typed wrapper
#     3. addNode with type "component" is accepted by the typed wrapper
#     4. addNode with type "function" is accepted by the typed wrapper
#     5. addNode with type "file" is accepted by the typed wrapper
#   Edge type acceptance:
#     6. addEdge with type "calls" is accepted by the typed wrapper
#     7. addEdge with type "imports" is accepted by the typed wrapper
#     8. addEdge with type "exports" is accepted by the typed wrapper
#     9. addEdge with type "depends_on" is accepted by the typed wrapper
#    10. addEdge with type "contains" is accepted by the typed wrapper
#    11. addEdge with type "tested_by" is accepted by the typed wrapper
#    12. addEdge with type "test_for" is accepted by the typed wrapper
#
# The two scenarios below confirm the type enforcement contract at INTEGRATION level: invalid types
# must produce build-time errors that surface through the pipeline build step, not only at the
# TypeScript class boundary.
# =============================================================================

Feature: Knowledge graph typed wrapper enforces node and edge type constraints at pipeline build
  The thin TypeScript wrapper's type enforcement must reach the pipeline build step — invalid types
  must not silently enter the graph and corrupt the CLAUDE.md output

  Scenario: Wrapper rejects invalid node type at pipeline build — build fails with type error
    # Integration-level confirmation: the type constraint surfaces as a build failure when
    # "tsx graph/index.ts" is run, not only as a TypeScript compile error in isolation.
    Given the typed wrapper is initialized
    And an agent calls .addNode() with type "service" and id "packages/vibe-cli/some-service.ts"
    When the graph is built via "tsx graph/index.ts"
    Then the build fails with a type error indicating "service" is not a valid node type
    And no node with type "service" is present in the graph or written to "CLAUDE.md"

  Scenario: Wrapper rejects invalid edge type at pipeline build — build fails with type error
    # Integration-level confirmation: the type constraint surfaces as a build failure when
    # "tsx graph/index.ts" is run, not only as a TypeScript compile error in isolation.
    Given the typed wrapper is initialized
    And the graph contains node "packages/vibe-cli/vibe.ps1"
    And the graph contains node "packages/vibe-cli/utils/invoke-claude.ps1"
    And an agent calls .addEdge() with type "blocks" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    When the graph is built via "tsx graph/index.ts"
    Then the build fails with a type error indicating "blocks" is not a valid edge type
    And no edge with type "blocks" is present in the graph or written to "CLAUDE.md"

# =============================================================================
# System Prompt Instructions for Agent Roles
# =============================================================================

Feature: All agent roles receive graph update instructions via system prompt
  Every pipeline agent is instructed to write .addNode() and .addEdge() calls for discovered elements

  Scenario Outline: <role> agent receives graph update instructions
    # [B8-1] Consolidated from 6 structurally identical scenarios (one per role) varying only by
    # role name. Replaced with a single Scenario Outline with a 6-row Examples table, consistent
    # with the Scenario Outline discipline applied to node-fix, edge-fix, and resubmit outlines
    # elsewhere in this file. Each row is independently runnable; no row depends on another.
    Given the pipeline is configured with system prompt instructions for graph updates
    When the "<role>" agent is invoked
    Then the agent's system prompt includes instructions to call .addNode() for discovered codebase elements
    And the agent's system prompt includes instructions to call .addEdge() for discovered codebase relationships

    Examples:
      | role        |
      | elicitor    |
      | doc-writer  |
      | expert      |
      | moderator   |
      | reviewer    |
      | code-writer |

# =============================================================================
# Knowledge Graph — Multi-Agent Monotone Accumulation (S30/S31)
#
# [B-4] D31 declares S30 (GraphNodesMonotone) and S31 (GraphEdgesMonotone) unverified for
# multi-agent runs (MaxAgents=1 in .cfg means TLC never exercised the cross-epoch accumulation
# path). D31 lists compensating integration tests for these properties. Without a BDD anchor,
# the D31 integration test obligation has no target scenario to implement against.
#
# S30 — GraphNodesMonotone: graphNodes grows monotonically across epochs; nodes added in epoch 1
#   are never removed by a subsequent epoch's close hook write.
# S31 — GraphEdgesMonotone: graphEdges grows monotonically across epochs; edges added in epoch 1
#   are never removed by a subsequent epoch's close hook write.
#
# NOTE (D31 — TLC-unverified): These properties require MaxAgents >= 2 to exercise the
# cross-epoch accumulation path. They are verified by integration tests only, not by TLC.
# The scenario below is the BDD target anchor for those integration tests.
# =============================================================================

# =============================================================================
# Knowledge Graph — Pipeline Termination Negative Path (S25 compensating test)
#
# S25 (AgentsCompletedMonotone): agentsCompleted is monotone and bounded by MaxAgents.
# TLA+ PipelineComplete guard: pipelineState can only transition to "done" when
# agentsCompleted = MaxAgents (all agents have completed their close hooks).
# D31 compensating integration tests for S25 require a BDD anchor for the NEGATIVE path:
# a scenario that seeds agentsCompleted < MaxAgents and asserts pipelineState is NOT "done".
# Without this negative-path scenario, the S25 compensating integration test has no
# implementable BDD target to implement against.
# =============================================================================

Feature: Pipeline cannot reach done state while agentsCompleted is less than MaxAgents — S25 negative path
  TLA+ S25 (AgentsCompletedMonotone) and the PipelineComplete guard ensure pipelineState
  cannot transition to "done" until all agents have completed their close hooks.
  This is the negative-path anchor for the D31 S25 compensating integration test.

  # NOTE (OBJ-1 — D31/S25 integration-test obligation, applying L11 annotation pattern):
  # The scenario below seeds agentsCompleted=1 with MaxAgents=3 — a parameter configuration
  # OUTSIDE the TLC-verified envelope. D31 explicitly states that the published TLC model
  # run uses MaxAgents=1 in the .cfg file; with MaxAgents=1, the PipelineComplete guard is
  # trivially satisfied by any single agent completing. The multi-agent guard behavior
  # (agentsCompleted < MaxAgents blocking PipelineComplete) requires MaxAgents >= 2 and has
  # NOT been verified by TLC. This scenario provides the BDD target anchor for the D31 S25
  # compensating integration test, but the assertion is not backed by a TLA+ proof at
  # MaxAgents=3. INTEGRATION TEST OBLIGATION (D31/S25): integration tests MUST verify this
  # negative path with MaxAgents >= 2 using the actual pipeline implementation. The BDD
  # scenario here is the automation target; TLC verification status for MaxAgents=3 remains
  # an open D31 scope limitation until a second .cfg with MaxAgents >= 2 is added.
  # Analogous to the L9 liveness obligation for routingState="resolving" (Model Routing
  # Feature header, B8-10) and the L11 obligation for routingState="validating".

  Scenario: pipelineState is NOT "done" when agentsCompleted < MaxAgents — S25 negative path
    # [D31 S25 compensating test anchor] Seeds agentsCompleted=1 with MaxAgents=3.
    # Two of three agents have not yet completed their close hooks. The PipelineComplete
    # guard (agentsCompleted = MaxAgents) is not satisfied. Even if routingState=done and
    # hookState∈{idle,done,error}, pipelineState MUST remain "running" — not "done".
    # Step definitions MUST assert pipelineState="running" (not "done") as the negative
    # invariant. The positive path (agentsCompleted reaching MaxAgents → "done") is covered
    # by the "Final-agent close hook success" scenario in the Build and CLAUDE.md Feature.
    # INTEGRATION TEST OBLIGATION (D31/S25): this negative path requires MaxAgents >= 2 and
    # was not verified by TLC in the published model run (MaxAgents=1 in .cfg). Verified by
    # integration tests only.
    Given a pipeline run with MaxAgents=3
    And the first agent's close hook has completed successfully (agentsCompleted=1)
    And the second and third agents have not yet completed their close hooks (agentsCompleted < MaxAgents)
    And the model routing subsystem has completed successfully (routingState=done)
    And hookState is in an acceptable terminal value (hookState∈{idle,done,error})
    When the pipeline evaluates its terminal condition
    Then pipelineState is NOT "done" — the PipelineComplete guard is not satisfied because agentsCompleted=1 < MaxAgents=3
    And pipelineState remains "running" until agentsCompleted reaches MaxAgents
    And no terminal transition to "done" or "halted" occurs solely because routing completed
    And graphState remains "collecting" — the graph subsystem is still awaiting close hooks from 2 remaining agents

Feature: Knowledge graph nodes and edges accumulate monotonically across agent epochs
  Nodes and edges added in one agent epoch persist through all subsequent epochs.
  No agent's close hook write removes nodes or edges registered by a prior agent.
  This corresponds to TLA+ safety invariants S30 (GraphNodesMonotone) and S31 (GraphEdgesMonotone).

  Scenario: graphNodes and graphEdges from epoch 1 are present after epoch 2 closes — S30/S31 cross-epoch invariant
    # [B-4] Two-epoch pipeline. Agent 1 (epoch 1) and Agent 2 (epoch 2) each discover different
    # nodes and edges. After both close hooks fire, ALL nodes and edges from BOTH epochs must be
    # present in the graph — no epoch-2 write overwrites or discards epoch-1 content.
    #
    # This scenario seeds concrete epoch-1 and epoch-2 additions so step definition authors have
    # unambiguous column-binding. Each agent is a separate Invoke-Claude call; each close hook
    # fires exactly once per agent session (per the exactly-once contract).
    #
    # Integration test obligation (D31): the step definition for the cross-epoch assertions below
    # must read graphNodes and graphEdges from the graph implementation (not from CLAUDE.md alone)
    # to verify the accumulation invariant at the graph data-structure level, not just the markdown
    # output level. CLAUDE.md output is also asserted as a secondary observable.
    #
    # TLA+ scope: S30/S31 are safety invariants declared in the specification but unverified by
    # TLC (MaxAgents=1 in .cfg). This scenario is the primary BDD obligation for both properties.
    Given a fresh pipeline run with an empty knowledge graph (graphNodes={}, graphEdges={})
    And agent 1 (epoch 1) calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1"
    And agent 1 calls .addEdge() with type "calls" from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1"
    And agent 1 also calls .addNode() with type "file" and id "packages/vibe-cli/utils/invoke-claude.ps1"
    And agent 1's session ends and its close hook runs "tsx graph/index.ts" successfully (epoch 1 closes)
    And the "CLAUDE.md" after epoch 1 contains node "packages/vibe-cli/vibe.ps1" and node "packages/vibe-cli/utils/invoke-claude.ps1"
    And agent 2 (epoch 2) calls .addNode() with type "file" and id "packages/vibe-cli/config/model-routing.psd1"
    And agent 2 calls .addEdge() with type "depends_on" from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/config/model-routing.psd1"
    When agent 2's session ends and its close hook runs "tsx graph/index.ts" successfully (epoch 2 closes)
    Then graphNodes contains "packages/vibe-cli/vibe.ps1" — the epoch-1 node is still present after epoch-2 write (S30)
    And graphNodes contains "packages/vibe-cli/utils/invoke-claude.ps1" — the epoch-1 node is still present after epoch-2 write (S30)
    And graphNodes contains "packages/vibe-cli/config/model-routing.psd1" — the epoch-2 node is present (S30)
    And graphEdges contains the "calls" edge from "packages/vibe-cli/vibe.ps1" to "packages/vibe-cli/utils/invoke-claude.ps1" — the epoch-1 edge is still present after epoch-2 write (S31)
    And graphEdges contains the "depends_on" edge from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/config/model-routing.psd1" — the epoch-2 edge is present (S31)
    And the "CLAUDE.md" after epoch 2 lists all 3 nodes and both edges (monotone accumulation visible in markdown output)
    And no node from epoch 1 was removed or overwritten by the epoch-2 close hook write
    And no edge from epoch 1 was removed or overwritten by the epoch-2 close hook write

# =============================================================================
# Knowledge Graph — S38 WritingAgentsCompletedBound (R19)
#
# S38 (R19) WritingAgentsCompletedBound: graphState="writing" => agentsCompleted < MaxAgents.
# The invariant states that when the close hook is actively writing (graphState="writing"),
# the agentsCompleted counter has not yet reached MaxAgents — meaning the current write is
# not yet counted and the graph subsystem is not yet in its terminal state.
# The boundary condition (agentsCompleted=MaxAgents-1 entering writing state) is the most
# falsifiable form: if an implementation counts agentsCompleted BEFORE the write completes,
# agentsCompleted would equal MaxAgents while graphState="writing", violating S38.
# This Feature provides the BDD-layer falsifiability test for S38.
# =============================================================================

Feature: S38 WritingAgentsCompletedBound — agentsCompleted < MaxAgents invariant holds during writing state
  While any agent's close hook is actively writing (graphState="writing"), agentsCompleted
  must be strictly less than MaxAgents. The increment to agentsCompleted only occurs AFTER
  the write completes (GraphWriteSuccess or GraphWriteFail fires), never during writing.

  Scenario: S38 boundary — agentsCompleted=MaxAgents-1 entering writing state confirms agentsCompleted < MaxAgents invariant (OBJ-13)
    # OBJ-13: S38 WritingAgentsCompletedBound has no BDD scenario exercising the boundary.
    # The boundary condition is agentsCompleted=MaxAgents-1 entering graphState="writing".
    # At this point agentsCompleted < MaxAgents holds (MaxAgents-1 < MaxAgents is trivially true)
    # but the implementation must NOT increment agentsCompleted until AFTER the write completes.
    # An implementation that increments agentsCompleted eagerly (before the write completes)
    # would violate S38: agentsCompleted would equal MaxAgents while graphState="writing".
    # This scenario seeds agentsCompleted=MaxAgents-1=2 with MaxAgents=3 and asserts the
    # invariant holds while graphState="writing", then confirms the increment fires only after
    # graphState exits "writing" (via GraphWriteSuccess or GraphWriteFail).
    Given a pipeline run with MaxAgents=3 and agentsCompleted=2 (the first two agents' close hooks have completed)
    And the third (final) agent's session has ended and the close hook has begun writing the temp file (graphState="writing")
    When graphState="writing" is observed during the final agent's close hook write
    Then agentsCompleted is 2 (= MaxAgents-1 = 3-1) — agentsCompleted < MaxAgents holds while graphState="writing" (S38 not violated)
    And agentsCompleted has NOT yet reached MaxAgents=3 — the write has not yet completed; the increment fires only after graphState exits "writing"
    And graphState="writing" and agentsCompleted=2 are jointly observable without violating S38
    When the close hook write completes (GraphWriteSuccess or GraphWriteFail fires and graphState exits "writing")
    Then agentsCompleted increments to 3 (= MaxAgents) — the increment fires exactly once, after the write completes
    And no state is observable where graphState="writing" and agentsCompleted=MaxAgents=3 simultaneously

# =============================================================================
# Integration — End-to-End Pipeline Flow
# =============================================================================

Feature: Token saving features integrate with the vibe-cli pipeline end-to-end
  All three subsystems work together within the pipeline lifecycle

  Scenario: Model routing invokes the agent with the correct model flag
    Given the model mapping maps "code-writer" to "sonnet"
    And the knowledge graph is empty
    When Invoke-Claude is called with Role "code-writer"
    Then the Claude CLI is invoked with "--model sonnet"

  Scenario: Close hook updates CLAUDE.md after agent session ends
    Given the code-writer agent completed its session and discovered nodes during that session
    When the Claude CLI process launched by Invoke-Claude exits (agent session ends)
    Then the close hook runs "tsx graph/index.ts"
    And the root "CLAUDE.md" is updated to include the agent's discovered nodes

  Scenario: Search hooks are transparent to agents during pipeline execution
    Given the es-hook and rg-hook are registered in ".claude/settings.json"
    When an agent issues "find . -name '*.test.ts'" during a pipeline run
    Then the command is silently rewritten to "es"
    And the agent receives the search results without knowing the rewrite occurred

  Scenario: Multiple agents accumulate graph state across the pipeline
    # Node identity: full path only.
    Given agent A discovers nodes "packages/vibe-cli/vibe.ps1" and "packages/vibe-cli/utils/invoke-claude.ps1" and a "calls" edge between them
    And agent A's close hook writes "CLAUDE.md" containing those nodes and the edge
    When agent B starts and discovers node "packages/vibe-cli/config/state-repository.psd1"
    And agent B adds a "depends_on" edge from "packages/vibe-cli/utils/invoke-claude.ps1" to "packages/vibe-cli/config/state-repository.psd1"
    And agent B's close hook writes "CLAUDE.md"
    Then the final "CLAUDE.md" contains all 3 nodes and both edges

  Scenario: Routing failure halts the pipeline before any agent session or hook runs
    Given the file "config/model-routing.psd1" does not exist
    When Invoke-Claude is called with Role "elicitor"
    Then the pipeline halts with a missing-config error
    And no agent session is started
    And no hook interception occurs
    And no graph update occurs

  Scenario: Graph build failure during pipeline propagates warning and stale CLAUDE.md persists
    # Node identity: full path only.
    Given a prior "CLAUDE.md" exists with content from a previous successful build
    And the current agent's close hook fails with a non-duplicate compilation error (graphState=warn)
    When the next pipeline stage begins
    Then the next agent reads the stale "CLAUDE.md" from the previous successful build
    And the pipeline does not halt
    And a [WARN] line is written to the pipeline log (stdout)

  Scenario: E2E dedup-retry — agent discovers duplicate node, retries, succeeds, pipeline completes
    # This is the primary integration scenario for the dedup subsystem
    Given a fresh pipeline run with an empty knowledge graph
    And the model mapping maps "code-writer" to "sonnet"
    And the es-hook and rg-hook are registered in ".claude/settings.json"
    When the code-writer agent is invoked via Invoke-Claude with Role "code-writer"
    And the agent issues "find . -name '*.ts'" (rewritten to "es" by the es-hook)
    And the agent calls .addNode() with type "file" and id "packages/vibe-cli/vibe.ps1" introducing a duplicate
    And the build fails and the error with retryCount=0 and path "packages/vibe-cli/vibe.ps1" is sent back to the agent
    # retryCount=0 at dedup_error entry; GraphRetry fires after error emission and increments retryCount to 1
    And the agent removes the duplicate .addNode() call for "packages/vibe-cli/vibe.ps1"
    And the graph is rebuilt via "tsx graph/index.ts" and succeeds
    And the Claude CLI process exits (agent session ends)
    And the close hook runs "tsx graph/index.ts" and writes the updated "CLAUDE.md"
    Then the root "CLAUDE.md" contains node "packages/vibe-cli/vibe.ps1"
    And the pipeline continues to the next stage
    And no force-dedup entry is present in the pipeline log (stdout)

  Scenario: E2E pipeline reaches done state when close hook write fails (graphState=warn)
    # graphState=warn does not prevent PipelineComplete.
    # TLA+ PipelineComplete accepts graphState in {"done","warn"}.
    Given a fresh pipeline run
    And the model mapping maps "elicitor" to "opus"
    When the elicitor agent is invoked and completes its session
    And the close hook for the elicitor agent fails with a non-duplicate compilation error (graphState=warn)
    And all remaining pipeline stages complete normally
    Then the pipeline reaches its terminal "done" state
    And a [WARN] line is written to the pipeline log (stdout) for the elicitor close-hook failure
    And the pipeline does not halt due to close-hook write failure

  Scenario: E2E pipeline reaches done state when PreToolUse search hook execution fails (hookState=error)
    # hookState=error (HookExecuteFail) does not prevent PipelineComplete.
    # TLA+ L7: (hookState="error") ~> (pipelineState in {"done","halted"}).
    # hookState=error is distinct from graphState=warn — they are different state machines.
    Given a fresh pipeline run
    And the model mapping maps "reviewer" to "haiku"
    When the reviewer agent is invoked and issues "grep -r 'TODO' src/" during its session
    And the rg-hook rewrites the command to "rg 'TODO' src/"
    And the rewritten "rg" command fails at runtime (hookState=error)
    And the reviewer agent completes its session
    And the close hook runs successfully and writes "CLAUDE.md" (graphState=done)
    And model routing completed successfully (routingState=done)
    Then the pipeline reaches its terminal "done" state
    And a [WARN] or error entry for the rg execution failure is surfaced to the agent
    And the pipeline does not halt due to hookState=error from the PreToolUse search hook

  Scenario: E2E simultaneous degraded terminal — hookState=error and graphState=warn both present, pipeline reaches done
    # Joint terminal degradation: both PreToolUse hook and close hook have failed independently
    # in the same pipeline run. PipelineComplete's guard accepts this state.
    # hookState=error ∧ graphState=warn ∧ pipelineState=done is the most operationally likely
    # combined degradation path; prior BDD covered each failure mode in isolation only.
    Given a fresh pipeline run
    And the model mapping maps "code-writer" to "sonnet"
    When the code-writer agent is invoked and issues "grep -r 'TODO' src/" during its session
    And the rg-hook rewrites the command to "rg 'TODO' src/"
    And the rewritten "rg" command fails at runtime (hookState=error)
    And the agent completes its session
    And the close hook fails with a non-duplicate compilation error (graphState=warn)
    And model routing completed successfully (routingState=done)
    Then the pipeline reaches its terminal "done" state (pipelineState=done)
    And a [WARN] line is written to the pipeline log (stdout) for the close-hook failure (graphState=warn)
    And the agent-surfaced error from the rg failure is present in the agent context (hookState=error)
    And the pipeline does not halt due to either failure mode individually or in combination

  Scenario: E2E triple failure — routing fails after prior hook error and graph warning, pipeline halts
    # [B-6] Triple-failure path. Prior R14 Then clauses embedded TLA+ state notation as inline
    # parentheticals — e.g., "Then the pipeline halts with a missing-config error (routingState=error,
    # pipelineState=halted)" — making it ambiguous whether parentheticals were implementation comments
    # or automation obligations. Each state assertion is now a separate And step.
    #
    # Triple-failure composition: routingState=error ∧ hookState=error ∧ graphState=warn ∧ pipelineState=halted.
    # Factory Given steps establish prior subsystem failures without multi-line prose narratives.
    # The pipeline must halt (not complete as "done") on routing failure regardless of what other
    # subsystem failures accumulated earlier in the same pipeline run.
    # Observable assertions reference the two channels of pipeline run state: pipeline log (stdout)
    # for routing/graph failures; agent context for hook execution failures. See glossary: Pipeline run state.
    Given a pipeline run seeded with hookState=error from a prior agent invocation
    And a pipeline run seeded with graphState=warn from a prior agent invocation
    And the seeded state is verified: hookState=error and graphState=warn are both confirmed before the When step executes
    # OBJ-8: mandatory state-assertion checkpoint. A defective harness that silently fails to seed
    # either subsystem failure would produce false-positive Then assertions without this checkpoint.
    # Step definitions MUST assert both hookState=error and graphState=warn are observable before
    # proceeding to the When step. This is the same checkpoint discipline applied to dedup factory
    # steps (seeded state verified: graphState="dedup_error" and retryCount=N).
    And the file "config/model-routing.psd1" does not exist for the current invocation
    When Invoke-Claude is called with Role "code-writer" for the next pipeline stage
    Then the pipeline halts with a missing-config error
    And routingState is "error" (the routing subsystem failed — mapping file not found)
    And pipelineState is "halted" — not "done" (routing failure is the only path to pipelineState="halted")
    And the pipeline log (stdout) contains a routing-failure error entry for the missing config file
    And a [WARN] entry for the close-hook failure from the prior invocation is present in the pipeline log (stdout)
    And graphState is "warn" from the prior close-hook failure (the graph subsystem reached its warn terminal state)
    And the agent context from the prior invocation contains the rg hook execution failure error
    And hookState is "error" from the prior rg hook execution failure (the PreToolUse hook subsystem reached its error terminal state)
