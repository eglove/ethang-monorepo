# Implementation Plan: Token Saving

## Source Artifacts

| Artifact | Path |
|----------|------|
| Requirements Briefing | `packages/vibe-cli/docs/token-saving/elicitor.md` |
| BDD Scenarios | `packages/vibe-cli/docs/token-saving/bdd.feature` |
| TLA+ Specification | `packages/vibe-cli/docs/token-saving/tla/TokenSaving.tla` |

---

## TLA+ State Coverage Matrix

### States

**Pipeline (`pipelineState`)**
- `"idle"` — TLA+ Init artifact (D36); transitions to "running" atomically via StartPipeline
- `"running"` — normal operation; all three subsystems active
- `"halted"` — terminal failure; set only by ValidateRoleFail or MappingLookupFail
- `"done"` — successful terminal; set by PipelineComplete

**Model Routing (`routingState`)**
- `"idle"` — Init artifact
- `"validating"` — role enum check in progress
- `"resolving"` — config mapping lookup in progress
- `"invoking"` — Claude CLI invocation in progress
- `"done"` — successful completion
- `"error"` — validation or mapping failure

**Model Routing supporting variables**
- `resolvedModel` — NULL | opus | sonnet | haiku
- `inputRole` — NULL | elicitor | doc-writer | expert | moderator | reviewer | code-writer | InvalidRole
- `inputModel` — NULL | opus | sonnet | haiku (optional override)
- `mappingEntryExists` — TRUE | FALSE

**Search Hook (`hookState`)**
- `"idle"` — no hook active
- `"intercepting"` — hook matched, command captured
- `"rewriting"` — rewrite in progress
- `"done"` — rewrite succeeded, command executed
- `"error"` — rewritten command failed at runtime

**Search Hook supporting variables**
- `hookCommand` — NULL | "find" | "grep" | "get_content"
- `hookKind` — `"none"` | `"es"` | `"rg"`
- `hookRewritten` — FALSE | TRUE

**Knowledge Graph (`graphState`)**
- `"idle"` — graph not yet started
- `"collecting"` — accepting node/edge discovery ops
- `"building"` — pending node or edge being checked
- `"dedup_error"` — duplicate detected; agent notified
- `"retrying"` — agent submitted substitute; checking
- `"force_dedup"` — retries exhausted; discarding pending item
- `"writing"` — close hook tsx process running
- `"done"` — all agents' close hooks succeeded (terminal)
- `"warn"` — close hook failed or pipeline aborted (terminal)

**Knowledge Graph supporting variables**
- `graphNodes` — set of accepted node paths
- `graphEdges` — set of accepted `<<from,to>>` edge tuples
- `pendingKind` — `"none"` | `"node"` | `"edge"`
- `pendingNode` — NULL | node path string
- `pendingEdge` — NULL | `<<from,to>>` tuple
- `retryCount` — 0..MaxRetries
- `markdownState` — `"none"` | `"current"` | `"stale"`
- `agentsCompleted` — 0..MaxAgents
- `graphOpsCount` — 0..MaxGraphOps

---

### Transitions (Named Actions)

**Model Routing**
- `StartPipeline` — idle→running; assigns inputRole, inputModel, mappingEntryExists nondeterministically
- `ValidateRoleSuccess` — validating→resolving (inputRole ∈ Roles)
- `ValidateRoleFail` — validating→error; pipelineState→halted (inputRole ∉ Roles)
- `ResolveModel` — resolving→invoking; sets resolvedModel from mapping or override
- `MappingLookupFail` — resolving→error; pipelineState→halted (mappingEntryExists=FALSE)
- `InvokeClaude` — invoking→done (resolvedModel ≠ NULL)

**Search Hooks**
- `HookInterceptEs` — idle→intercepting; hookKind="es"; hookCommand ∈ FindCmds
- `HookInterceptRg` — idle→intercepting; hookKind="rg"; hookCommand ∈ GrepCmds
- `HookRewrite` — intercepting→rewriting; hookRewritten=TRUE
- `HookExecuteSuccess` — rewriting→done; hookCommand=NULL; hookKind="none"
- `HookExecuteFail` — rewriting→error; hookCommand=NULL; hookKind preserved

**Knowledge Graph**
- `GraphStartCollecting` — idle→collecting
- `GraphAddNode` — collecting→building; pendingNode set; graphOpsCount++
- `GraphAddEdge` — collecting→building; pendingEdge set; graphOpsCount++; requires graphNodes ≠ {}
- `GraphNodeBuildSuccess` — building→collecting; node accepted; retryCount=0
- `GraphEdgeBuildSuccess` — building→collecting; edge accepted; retryCount=0
- `GraphNodeDuplicateDetected` — building→dedup_error (pendingNode ∈ graphNodes)
- `GraphEdgeDuplicateDetected` — building→dedup_error (pendingEdge ∈ graphEdges)
- `GraphRetry` — dedup_error→retrying; retryCount++ (retryCount < MaxRetries)
- `GraphRetryNodeSuccess` — retrying→building; substitute node selected (∉ graphNodes, ≠ pendingNode)
- `GraphRetryEdgeSuccess` — retrying→building; substitute edge selected (∉ graphEdges, ≠ pendingEdge)
- `GraphRetryNodeStillDuplicate` — retrying→dedup_error; substitute also duplicate; retryCount unchanged
- `GraphRetryEdgeStillDuplicate` — retrying→dedup_error; substitute also duplicate; retryCount unchanged
- `GraphForceDedup` — dedup_error→force_dedup; pendingNode/Edge=NULL; pendingKind="none"; retryCount ≥ MaxRetries
- `GraphAfterForceDedup` — force_dedup→collecting; retryCount=0
- `GraphWriteMarkdown` — collecting→writing (SF-fair; agentsCompleted < MaxAgents)
- `GraphWriteSuccess` — writing→done/collecting; markdownState="current"; agentsCompleted++; graphOpsCount=0; retryCount=0
- `GraphWriteFail` — writing→warn/collecting; markdownState degraded; agentsCompleted++; graphOpsCount=0; retryCount=0
- `GraphHaltCleanup` — active→warn; from any of 7 active states when pipelineState="halted"
- `PipelineComplete` — running→done; requires routingState=done, graphState∈{done,warn}, hookState∈{idle,done,error}
- `Terminated` — absorbing stutter in {done, halted}

---

### Safety Invariants

- **S1** `UnknownRoleNeverInvokes` — unknown role → resolvedModel=NULL, routingState≠done, routingState=error⇒halted
- **S2** `MissingMappingNeverInvokes` — valid role + missing entry → resolvedModel=NULL, routingState∉{invoking,done}, error⇒halted
- **S3** `NoHookFallback` — hookState=error ⇒ hookRewritten=TRUE
- **S4** `RetryBounded` — retryCount ≤ MaxRetries
- **S5** `ForceOnlyAfterRetries` — force_dedup ⇒ retryCount ≥ MaxRetries
- **S6** `HaltedMeansRoutingError` — halted ⇒ routingState=error *(model-structural; see D25)*
- **S7** `ResolvedModelValid` — resolvedModel ≠ NULL ⇒ resolvedModel ∈ {opus,sonnet,haiku}
- **S8** `DoneImpliesRoutingDone` — pipelineState=done ⇒ routingState=done
- **S9** `InvokeRequiresModel` — resolvedModel=NULL ⇒ routingState∉{invoking,done}
- **S10** `NodeDuplicateDetectionIsAccurate` — dedup_error ∧ pendingKind=node ⇒ pendingNode ∈ graphNodes
- **S11** `EdgeDuplicateDetectionIsAccurate` — dedup_error ∧ pendingKind=edge ⇒ pendingEdge ∈ graphEdges
- **S12** `PlainReadNeverIntercepted` — intercepting ⇒ hookCommand ∉ PlainCmds
- **S13** `EsHookOnlyForFind` — intercepting ∧ hookKind=es ⇒ hookCommand ∈ FindCmds
- **S14** `RgHookOnlyForGrep` — intercepting ∧ hookKind=rg ⇒ hookCommand ∈ GrepCmds
- **S15** `HookCleanupComplete` — hookState=done ⇒ hookCommand=NULL ∧ hookKind="none"
- **S16** `GraphTerminalClean` — graphState∈{done,warn} ⇒ pendingNode=NULL ∧ pendingEdge=NULL ∧ pendingKind="none"
- **S17** `HookErrorAllowsCompletion` — hookState=error ∧ halted ⇒ routingState=error
- **S18** `AgentsCompletedBounded` — agentsCompleted ∈ 0..MaxAgents
- **S19** `GraphOpsCountBounded` — graphOpsCount ∈ 0..MaxGraphOps
- **S20** `RetryCountClean` — graphState∈{idle,collecting,writing,done,warn} ⇒ retryCount=0
- **S21** `NoGhostEdges` — ∀e ∈ graphEdges: e[1] ∈ graphNodes ∧ e[2] ∈ graphNodes
- **S22** `HaltedIsAbsorbing` — □(halted ⇒ □halted)
- **S23** `DoneIsAbsorbing` — □(done ⇒ □done)
- **S24** `HookTerminalIsAbsorbing` — □(hookState∈{done,error} ⇒ □hookState∈{done,error})
- **S25** `PipelineCompletionRequiresAllAgents` — pipelineState=done ⇒ agentsCompleted=MaxAgents
- **S26** `HookErrorHaltedIsJointlyAbsorbing` — □(hookState=error ∧ halted ⇒ □(hookState=error ∧ halted))
- **S27** `PendingCoherence` — pendingKind coherence for node/edge/none; building/retrying ⇒ pendingKind∈{node,edge}
- **S28** `HookErrorPreservesKind` — hookState=error ⇒ hookKind∈{es,rg}
- **S29** `InterHookMutualExclusion` — hookState∈{intercepting,rewriting} ⇒ hookKind∈{es,rg}
- **S30** `GraphNodesMonotone` — □[graphNodes ⊆ graphNodes']ᵥₐᵣₛ
- **S31** `GraphEdgesMonotone` — □[graphEdges ⊆ graphEdges']ᵥₐᵣₛ
- **S32** `CloseHookPrecedesNextEpoch` — □[agentsCompleted' > agentsCompleted ⇒ graphState="writing"]ᵥₐᵣₛ
- **S33** `GraphHaltCleanupPreservesMarkdown` — halt-cleanup from any of 7 states leaves markdownState unchanged
- **S34** `MarkdownStateMonotone` — □[(markdownState∈{stale,current}) ⇒ markdownState'≠"none"]ᵥₐᵣₛ
- **S35** `GraphTerminalOpsClean` — graphState∈{done,warn} ⇒ graphOpsCount=0
- **S36** `HookErrorClearsCommand` — hookState=error ⇒ hookCommand=NULL
- **S37** `WritingStateGatesAgentsCompleted` — □[graphState≠"writing" ⇒ agentsCompleted'=agentsCompleted]ᵥₐᵣₛ
- **S38** `WritingAgentsCompletedBound` — graphState=writing ⇒ agentsCompleted < MaxAgents

---

### Liveness Properties

- **L1** `PipelineTerminates` — ◇(pipelineState∈{done,halted})
- **L2** `ValidRoleLeadsToModel` — (inputRole∈Roles ∧ mappingEntryExists) ↝ resolvedModel≠NULL
- **L3** `InvalidRoleLeadsToHalt` — (inputRole∉Roles ∧ inputRole≠NULL) ↝ halted
- **L3b** `MissingMappingLeadsToHalt` — (inputRole∈Roles ∧ ¬mappingEntryExists) ↝ halted
- **L4** `DuplicateEventuallyResolves` — dedup_error ↝ graphState∈{collecting,done,warn}
- **L4b** `DuplicateEventuallyResolvedFully` — (dedup_error ∧ running) ↝ graphState∈{done,warn}
- **L5** `GraphEventuallyFinishes` — (collecting ∧ pendingKind=none ∧ running) ↝ graphState∈{done,warn}
- **L6** `HookEventuallySettles` — hookState∈{intercepting,rewriting} ↝ hookState∈{done,error}
- **L7** `HookErrorEventuallyCompletsPipeline` — hookState=error ↝ pipelineState∈{done,halted}
- **L8** `InvokingLeadsToDone` — routingState=invoking ↝ routingState=done
- **L9** `ResolvingLeadsToInvokingOrError` — routingState=resolving ↝ routingState∈{invoking,error}
- **L10** `WritingLeadsToNextState` — graphState=writing ↝ graphState∈{done,warn,collecting}
- **L11** `ValidatingLeadsToResolvingOrError` — routingState=validating ↝ routingState∈{resolving,error}
- **L12** `BuildingLeadsToCollectingOrDedupErrorOrWarn` — graphState=building ↝ graphState∈{collecting,dedup_error,warn}
- **L13** `RetryingLeadsToBuildingOrDedupError` — graphState=retrying ↝ graphState∈{building,dedup_error,warn}
- **L14** `InterceptingLeadsToRewriting` — hookState=intercepting ↝ hookState=rewriting

---

## Implementation Steps

### Step 1: Model Routing Config Data File

**Files:**
- `packages/vibe-cli/config/model-routing.psd1` (create)
- `packages/vibe-cli/tests/model-routing.Tests.ps1` (create)

**Description:**
Creates the centralized PowerShell Data File mapping each pipeline role to its Claude model. This is the single source of truth for the `RoleMapping` constant in TLA+. The six required mappings are: elicitor→opus, doc-writer→sonnet, expert→sonnet, moderator→opus, reviewer→haiku, code-writer→sonnet. The file must be a valid `.psd1` hashtable readable by `Import-PowerShellDataFile`.

**Dependencies:** None

**Test (write first):**
Write a Pester test that:
1. Calls `Import-PowerShellDataFile` on the `.psd1` path and verifies the result is a hashtable.
2. Asserts all six role keys are present: `elicitor`, `doc-writer`, `expert`, `moderator`, `reviewer`, `code-writer`.
3. Asserts each maps to one of `opus`, `sonnet`, or `haiku`.
4. Asserts the specific canonical mapping (elicitor→opus, doc-writer→sonnet, expert→sonnet, moderator→opus, reviewer→haiku, code-writer→sonnet).
5. Asserts no extra keys are present beyond the six roles.
6. **Malformed `.psd1` rejection (Rec9 — parser enforcement):** Write a temp file containing a syntactically invalid `.psd1` (e.g., `@{ elicitor = 'opus'` with a missing closing brace). Call `Import-PowerShellDataFile` on the temp file path. Assert that a terminating error is thrown (a `ParseException` or equivalent PowerShell parse error) — verifying that the routing config's structural validity is enforced by the PowerShell data file parser itself, and that a partially-written or corrupted file cannot silently pass as valid configuration. Clean up the temp file in an `AfterEach` block.

**TLA+ Coverage:**
- State: `resolvedModel` domain `{Opus, Sonnet, Haiku}`
- State: `inputRole` domain `Roles = {Elicitor, DocWriter, Expert, Moderator, Reviewer, CodeWriter}`
- Constant: `RoleMapping` — centralized role-to-model function
- Invariant: **S7** `ResolvedModelValid` — resolved model always ∈ valid set

---

### Step 2: TypeScript Graph Base Wrapper

**Files:**
- `packages/vibe-cli/graph/types.ts` (create)
- `packages/vibe-cli/graph/graph.ts` (create)
- `packages/vibe-cli/graph/index.ts` (create)
- `packages/vibe-cli/package.json` (modify — add `data-structure-typed` dependency)
- `packages/vibe-cli/graph/graph.test.ts` (create)

**Description:**
Creates the TypeScript knowledge graph subsystem foundation. `types.ts` declares the typed node and edge enumerations (NodeType: `app | package | component | function | file`; EdgeType: `calls | imports | exports | depends_on | contains | tested_by | test_for`). `graph.ts` wraps `data-structure-typed`'s `DirectedGraph` with a thin typed API exposing `.addNode(path, type)` and `.addEdge(from, to, type)`. Node identity is the full path — bare filenames without a directory separator are rejected with a build error; rg output tokens (`src/foo.ts:42:keyword`) are rejected because they contain colon-delimited line/content suffixes. `GraphAddEdge` requires both endpoints to exist in the graph (S21 NoGhostEdges — equivalent to the TLA+ guard `graphNodes ≠ {}`). `index.ts` is the tsx entry point that will be called by the close hook.

**Dependencies:** None

**Test (write first):**
Write a Vitest test that:
1. Constructs the graph wrapper and calls `.addNode("packages/vibe-cli/vibe.ps1", "file")` — asserts no error.
2. Asserts that `.addNode("vibe.ps1", "file")` (bare filename, no directory separator) throws a build error containing "invalid node identity".
3. Asserts that `.addNode("src/foo.ts:42:keyword", "file")` throws a build error containing "invalid node identity" (rg output token).
4. **Ghost-edge error type and message (R5):** Asserts that `.addEdge("packages/a/x.ts", "packages/b/y.ts", "imports")` called before adding either endpoint node throws a `GraphBuildError` instance (a named subclass of `Error`, not a plain `Error`) with a `message` matching `"NoGhostEdges: endpoint 'packages/a/x.ts' not in graph"` (the first missing endpoint is named in the message; if both are missing, the first argument is reported). Using a named `GraphBuildError` class allows callers to discriminate build-time contract violations from unexpected runtime errors via `instanceof` checks.
5. Adds both endpoints, then calls `.addEdge` — asserts success.
6. Verifies the graph returns the correct node/edge counts after a sequence of adds.

**TLA+ Coverage:**
- Action: `GraphStartCollecting` (graph enters collecting when initialized)
- Action: `GraphAddNode` (validated add — node path identity rule)
- Action: `GraphAddEdge` (ghost-edge guard, graphNodes ≠ {})
- Invariant: **S21** `NoGhostEdges` — edge endpoints must be in graphNodes
- State: `graphState = "idle"` / `"collecting"` (initialization lifecycle)

---

### Step 3: es-hook.ps1 (File-Search Rewriter)

**Files:**
- `.claude/hooks/es-hook.ps1` (create)
- `.claude/hooks/` directory (create if absent)
- `packages/vibe-cli/tests/es-hook.Tests.ps1` (create)

**Description:**
Creates the PreToolUse hook script that intercepts file-search commands and rewrites them to `es` (Everything CLI). The hook reads the tool-call command from stdin (JSON payload from Claude Code), checks whether the command surface token matches any of `find`, `ls`, `dir`, `Get-ChildItem`, or `gci`, and if so rewrites the token to `es` with equivalent arguments. Hook matching is on the **surface token** — the literal text as issued by the agent before shell alias expansion (D38, hook matching level glossary). If a matching command is detected and the rewrite succeeds, the hook outputs the rewritten payload and exits 0. If the hook script fails before producing output (hookPreOutputCrash), it exits non-zero with no stdout; the error surfaces to the agent as-is with no fallback. Get-Content commands are never intercepted (S12). Self-contained: no dependencies on other steps.

> **⚠ BDD GLOSSARY INVERSION — OBJECTION 1 (Debate Rev 20):**
> The `bdd.feature` glossary entry for `hookKind` (OBJ-3) incorrectly attributes `hookState="done" IMPLIES hookKind ∈ {"es","rg"}` to TLA+ S28. This is factually inverted. The correct TLA+ postconditions are:
> - **S15 `HookCleanupComplete`**: `hookState="done" ⇒ hookKind="none"` — the success terminal **clears** hookKind.
> - **S28 `HookErrorPreservesKind`**: `hookState="error" ⇒ hookKind ∈ {"es","rg"}` — the error terminal **preserves** hookKind.
>
> Any test written against the BDD glossary's `hookState="done"→hookKind∈{"es","rg"}` assertion will produce a false positive for the wrong state. Tests 8 and 9 below explicitly enforce the correct TLA+ postconditions and MUST be written before implementation to catch this inversion.

**Dependencies:** None

**Test (write first):**
Write a Pester test that:
1. Pipes a JSON payload with `command: "find . -name '*.ts'"` to the script; asserts the output rewrites `find` to `es` and that `hookRewritten` would be TRUE (output contains `es`).
2. Tests each of the five surface tokens: `find`, `ls`, `dir`, `Get-ChildItem`, `gci` — asserts each is rewritten.
3. Pipes a payload with `command: "Get-Content ./foo.ps1"` — asserts no rewrite occurs (S12 PlainReadNeverIntercepted).
4. Pipes a payload with `command: "grep foo bar"` — asserts no rewrite (rg-hook's domain, not es-hook).
5. Asserts hookKind would be "es" for any matched command (S13 EsHookOnlyForFind).
6. Asserts the hook does not fall back to the original command on failure — it surfaces the error (S3 NoHookFallback — hookRewritten must be TRUE before hookState=error is reachable).
7. **[INTEGRATION — D3 ASSUME]** Asserts that two sequential find-command payloads each produce independent rewrite results. This is an integration-level verification per D3 (multi-intercept reset): D3's ASSUME declares that the multi-intercept state reset is an implementation-level concern not modeled in TLA+. The test exercises the real reset path by piping two distinct `find` payloads in sequence and asserting the second rewrite is not contaminated by the first.
8. **hookKind at the done terminal (S15 — corrects BDD glossary inversion):** Mock a complete es-hook cycle (intercept→rewrite→execute-success); assert `hookKind="none"` at `hookState=done`. This assertion is the **opposite** of what the BDD glossary entry for `hookKind` implies (which incorrectly says `hookState="done" IMPLIES hookKind ∈ {"es","rg"}`). The test MUST assert `hookKind="none"` — not `hookKind="es"` — and must fail if the implementation leaves hookKind non-"none" at the done terminal (S15 HookCleanupComplete).
9. **hookKind at the error terminal (S28 — the invariant the BDD glossary misattributed to done):** Mock a cycle where rewrite succeeds but the rewritten `es` command fails at runtime (`hookState` transitions to `error`); assert `hookKind="es"` is **preserved** — not cleared. This is the path S28 (`HookErrorPreservesKind`) actually governs: the error terminal retains `hookKind` so that the failure can be attributed to the correct hook subsystem.
10. **L14 failing-first mechanism — seed hookState=intercepting (R3 — Pester Mock specified):** Seed the hook pipeline in `hookState="intercepting"` by supplying a test input that has already matched the es-hook surface token (e.g., a `find`-command payload in captured state) but has not yet been rewritten. Disable `HookRewrite` using the Pester `Mock` cmdlet with an empty body: `Mock Invoke-EsHookRewrite { }` (or the actual function name exported by `es-hook.ps1`; use `InModuleScope 'es-hook'` if the function is module-private). Assert using `$result.hookState | Should -Not -Be 'rewriting'` — the test MUST FAIL at this assertion when the mock is active, proving `HookRewrite` is load-bearing. Then restore by scoping the mock inside a nested `Context` block (Pester mock scope is `Describe`/`Context`-bounded; removing the inner `Context` exits the mock scope automatically) and re-run — assert `$result.hookState | Should -Be 'rewriting'`. Confirm the mock was called using `Should -Invoke Invoke-EsHookRewrite -Times 0` in the disabled phase and `-Times 1` in the restored phase. This is the explicit failing-first mechanism for L14 (`InterceptingLeadsToRewriting`): any implementation that never invokes `HookRewrite` will be caught at the `-Not -Be 'rewriting'` assertion regardless of what other tests pass. The test must be written RED (failing mock assertion) before implementation begins.
11. **D11 pre-output crash — distinct from post-rewrite failure (TDD blocking objection):** Inject a fault that causes the hook script to exit with a non-zero status code before any stdout byte is produced (simulate by replacing the script body entry point with an immediate `exit 1` or equivalent mock). Assert: (a) no rewritten payload appears on stdout; (b) `hookRewritten` is NOT set to TRUE — the pre-output crash does NOT set `hookRewritten=TRUE` because `HookRewrite` was never executed; (c) the error surfaces to the agent as-is with the original command unmodified. This failure mode is architecturally distinct from the post-rewrite failure path (tests 6 and 9 above), where `HookRewrite` succeeds (`hookRewritten=TRUE`) and then the rewritten `es` command fails at runtime (`hookState="error"`). A pre-output crash does NOT produce `hookState="error"` via the TLA+ transition path because the `HookRewrite` action never fired. **Backlog note (D11-PREOUTPUT):** This failure mode has no TLA+ ASSUME declaration; D11 covers only closeHookTimeout. A formal `D11-PREOUTPUT` ASSUME is recommended for a future spec revision. See Out-of-TLA+ Scope section.

**TLA+ Coverage:**
- Action: `HookInterceptEs` (hookKind="es", hookCommand ∈ FindCmds)
- Action: `HookRewrite` (hookRewritten=TRUE)
- Action: `HookExecuteSuccess` (hookCommand=NULL, hookKind="none" → S15; NOT hookKind∈{"es","rg"} — see BDD inversion warning above)
- Action: `HookExecuteFail` (hookCommand=NULL, hookKind preserved as "es" → S28, S36)
- Invariant: **S3** `NoHookFallback`
- Invariant: **S12** `PlainReadNeverIntercepted`
- Invariant: **S13** `EsHookOnlyForFind`
- Invariant: **S15** `HookCleanupComplete` — done terminal: hookKind="none" (tests 1–2 confirm active-state hookKind; test 8 confirms terminal clearance)
- Invariant: **S28** `HookErrorPreservesKind` — error terminal only: hookKind∈{es,rg} (test 9; does NOT apply to done terminal)
- Invariant: **S29** `InterHookMutualExclusion`
- Invariant: **S36** `HookErrorClearsCommand`
- Liveness: **L6** `HookEventuallySettles`
- Liveness: **L14** `InterceptingLeadsToRewriting` — explicit failing-first test via test 10 (Pester `Mock Invoke-EsHookRewrite { }` disables HookRewrite; `Should -Not -Be 'rewriting'` confirms test is non-vacuous; scope exit restores)

---

### Step 4: rg-hook.ps1 (Text-Search Rewriter)

**Files:**
- `.claude/hooks/rg-hook.ps1` (create)
- `packages/vibe-cli/tests/rg-hook.Tests.ps1` (create)

**Description:**
Creates the PreToolUse hook script that intercepts text-search commands and rewrites them to `rg` (ripgrep). Matches surface tokens: `grep`, `egrep`, `fgrep`, `Select-String`, `sls`. Does **not** intercept `Get-Content` used for plain file reads — only matches when the command token is one of the five enumerated patterns (S12, D38). In the sequential evaluation model (D28), this hook receives the command as rewritten by es-hook, so if es-hook already rewrote `find` to `es`, this hook receives `es` and does not match. Failures surface as-is with no fallback to the original command (S3).

> **⚠ BDD GLOSSARY INVERSION — OBJECTION 1 (Debate Rev 20):**
> Identical issue as Step 3. The BDD `hookKind` glossary incorrectly states `hookState="done" IMPLIES hookKind ∈ {"es","rg"}` (citing S28). The correct TLA+ postconditions are:
> - **S15**: `hookState="done" ⇒ hookKind="none"` — success clears hookKind.
> - **S28**: `hookState="error" ⇒ hookKind ∈ {"es","rg"}` — error preserves hookKind.
>
> Tests 8 and 9 below enforce the correct postconditions for the rg-hook path. Do not write tests that assert `hookKind="rg"` at the done terminal — that assertion is wrong and would pass a broken implementation.

**Dependencies:** None

**Test (write first):**
Write a Pester test that:
1. Pipes a JSON payload with `command: "grep -r 'pattern' ."` — asserts rewritten to `rg -r 'pattern' .`.
2. Tests each of the five surface tokens: `grep`, `egrep`, `fgrep`, `Select-String`, `sls` — asserts each is rewritten.
3. Pipes a payload where es-hook has already rewritten `find` to `es` — asserts no additional rewrite (sequential evaluation contract).
4. Asserts `Get-Content` with no search pattern is not intercepted (S12).
5. Asserts hookKind would be "rg" for any matched command (S14 RgHookOnlyForGrep).
6. Asserts two sequential grep-command payloads each produce independent rewrite results.
7. **[INTEGRATION — D3 ASSUME]** Verifies a piped command `find . | grep keyword` (ambiguous): es-hook rewrites `find` to `es`; rg-hook then receives `es ... | grep keyword` and rewrites the grep portion to `rg` — no double-rewrite of the find portion. This is an integration-level hook-ordering scenario per D3 ASSUME (multi-intercept state reset is an implementation-level concern). Use mock payloads to drive the unit-level portion; the full sequential delegation chain test belongs in Step 7.
8. **hookKind at the done terminal (S15 — corrects BDD glossary inversion):** Mock a complete rg-hook cycle (intercept→rewrite→execute-success); assert `hookKind="none"` at `hookState=done`. The BDD glossary entry incorrectly implies `hookKind="rg"` at done; this test enforces the correct S15 postcondition (clearance). Must fail if hookKind is not cleared on success.
9. **hookKind at the error terminal (S28 — the invariant the BDD glossary misattributed to done):** Mock a cycle where the rewrite succeeds but the `rg` command fails at runtime; assert `hookKind="rg"` is preserved at `hookState=error` (S28 HookErrorPreservesKind — error terminal preserves kind for attribution).
10. **L14 failing-first mechanism — seed hookState=intercepting (R3 — Pester Mock specified):** Seed the hook pipeline in `hookState="intercepting"` using a test input that has already matched the rg-hook surface token (e.g., a `grep`-command payload in captured state) but has not yet been rewritten. Disable `HookRewrite` using the Pester `Mock` cmdlet with an empty body: `Mock Invoke-RgHookRewrite { }` (or the actual function name exported by `rg-hook.ps1`; use `InModuleScope 'rg-hook'` if the function is module-private). Assert using `$result.hookState | Should -Not -Be 'rewriting'` — the test MUST FAIL at this assertion when the mock is active, proving `HookRewrite` is load-bearing. Restore by scoping the mock inside a nested `Context` block and re-run — assert `$result.hookState | Should -Be 'rewriting'`. Confirm via `Should -Invoke Invoke-RgHookRewrite -Times 0` in the disabled phase and `-Times 1` in the restored phase. The test must be written RED (failing mock assertion) before implementation begins.
11. **D11 pre-output crash — distinct from post-rewrite failure (TDD blocking objection):** Inject a fault that causes the hook script to exit with a non-zero status code before any stdout byte is produced (simulate by replacing the script body entry point with an immediate `exit 1` or equivalent mock). Assert: (a) no rewritten payload appears on stdout; (b) `hookRewritten` is NOT set to TRUE — the pre-output crash does NOT set `hookRewritten=TRUE` because `HookRewrite` was never executed; (c) the error surfaces to the agent as-is with the original command unmodified. This failure mode is architecturally distinct from the post-rewrite failure path (tests 6 and 9 above), where `HookRewrite` succeeds (`hookRewritten=TRUE`) and then the rewritten `rg` command fails at runtime (`hookState="error"`). A pre-output crash does NOT produce `hookState="error"` via the TLA+ transition path because the `HookRewrite` action never fired. **Backlog note (D11-PREOUTPUT):** See Step 3 test 11 and Out-of-TLA+ Scope section for shared D11-PREOUTPUT backlog note.

**TLA+ Coverage:**
- Action: `HookInterceptRg` (hookKind="rg", hookCommand ∈ GrepCmds)
- Action: `HookRewrite`, `HookExecuteSuccess` (hookKind="none" at done → S15; NOT hookKind∈{"es","rg"}), `HookExecuteFail` (hookKind="rg" preserved → S28, S36)
- Invariant: **S3**, **S12**, **S14**
- Invariant: **S15** `HookCleanupComplete` — done terminal clears hookKind to "none" (test 8)
- Invariant: **S28** `HookErrorPreservesKind` — error terminal preserves hookKind as "rg" (test 9; does NOT apply to done terminal)
- Invariant: **S29**, **S36**
- Liveness: **L6**, **L14** `InterceptingLeadsToRewriting` — explicit failing-first test via test 10 (Pester `Mock Invoke-RgHookRewrite { }` disables HookRewrite; scope exit restores; non-vacuousness confirmed by `-Not -Be 'rewriting'` assertion)

---

### Step 5: Invoke-Claude with `$Role` and `$Model` Parameters

**Files:**
- `packages/vibe-cli/utils/invoke-claude.ps1` (modify)
- `packages/vibe-cli/tests/invoke-claude.Tests.ps1` (create or modify)

**Description:**
Updates `Invoke-Claude` to accept `[Parameter(Mandatory)][ValidateSet(...)] [string]$Role` and `[string]$Model` (optional override). The function:
1. Reads `config/model-routing.psd1` via `Import-PowerShellDataFile`.
2. Validates `$Role` against the enum — unknown role halts with an error (ValidateRoleFail → S1).
3. Looks up `$Role` in the mapping — missing entry halts (MappingLookupFail → S2).
4. If `$Model` is provided, validates it ∈ `{opus,sonnet,haiku}` — invalid override halts (D23 BDD: invalid model enum → halt).
5. Resolves the final model: `$Model` if provided and valid, else the mapped value (ResolveModel with override logic).
6. Adds `--model <resolved>` to the `$args_` array before the `claude` CLI invocation (InvokeClaude → S7, S9).
All existing callers must pass `$Role`. The routing state machine (validating → resolving → invoking → done | error) is fully implemented here.

> **⚠ HALT SIGNAL DESIGN DECISION — OBJECTION 3 (Debate Rev 21):**
> BDD and TDD reviewers identified a blocking design gap: no operator-visible discriminating signal was specified between `hookState=error` (hook rewrite failed at runtime; does NOT halt the pipeline per S17) and routing halts (`ValidateRoleFail`, `MappingLookupFail`). Without a specified signal format, no test can assert the signal exists, and operators cannot distinguish failure modes from logs or exit codes alone.
>
> **Specified halt signal format (binding for this step and Step 11):**
> All halt-producing code paths MUST emit a structured stderr line using the following prefix codes before exiting:
> - `[ROUTING-HALT:INVALID-ROLE <role>]` — emitted by `ValidateRoleFail`: the supplied `$Role` value is not a member of the `Roles` enumeration (S1, L3).
> - `[ROUTING-HALT:MISSING-MAPPING <role>]` — emitted by `MappingLookupFail`: `$Role` is valid but has no entry in `model-routing.psd1` (S2, L3b).
> - `[ROUTING-HALT:INVALID-MODEL <model>]` — emitted by the D23 invalid-model-string path: `$Model` is provided but is not a member of `{opus,sonnet,haiku}`.
> - `[HOOK-FAIL:<hookKind>]` — emitted by es-hook/rg-hook on post-rewrite command failure at runtime; hookState=error. Does NOT halt the pipeline (S17 `HookErrorAllowsCompletion`); preserved alongside `hookKind` for operator attribution (S28).
>
> These four codes are operator-distinguishable without inspecting internal state variables. A pipeline monitor watching stderr can assert which failure path fired. Tests 10 and 11 below assert the correct routing halt codes are emitted. Step 11 test 9 adds the cross-subsystem discrimination test. The signal format applies to all routing halt paths and must be implemented before the pipeline wiring step.

**Dependencies:** Step 1 (T1)

**Test (write first):**
Write a Pester test that:
1. Calls `Invoke-Claude -Role elicitor` and asserts `--model opus` is passed to the claude CLI (L2, S7).
2. Calls `Invoke-Claude -Role reviewer` and asserts `--model haiku` is passed.
3. Calls `Invoke-Claude -Role expert -Model haiku` (override) and asserts `--model haiku` is passed instead of sonnet (D29 identity override also covered).
4. Calls `Invoke-Claude -Role expert -Model opus` (override differs from mapping) and asserts `--model opus`.
5. Asserts that an unknown role (e.g., `"oracle"`) throws/halts with an error before any `claude` invocation (S1, L3).
6. Simulates `mappingEntryExists=FALSE` by temporarily renaming/mocking the .psd1 file; asserts halt with error (S2, L3b).
7. Calls with `$Model "gpt-4"` and asserts halt before invocation (D23 invalid model string).
8. Verifies `resolvedModel ∈ {opus,sonnet,haiku}` for every valid role (S7).
9. Integration test (separate describe block): asserts routingState progresses through validating→resolving→invoking→done without deadlock (L9, L11 liveness obligations).
10. **Routing halt signal — INVALID-ROLE (halt signal discrimination, BDD + TDD blocking objection):** Calls `Invoke-Claude -Role oracle` (invalid role); captures stderr; asserts a line matching `[ROUTING-HALT:INVALID-ROLE oracle]` appears before exit. Asserts no `claude` CLI invocation occurred. Asserts `[ROUTING-HALT:MISSING-MAPPING]` does NOT appear in stderr (wrong halt code would indicate the wrong error path fired — both must be distinguishable).
11. **Routing halt signal — MISSING-MAPPING (halt signal discrimination, symmetric):** Mocks a missing mapping entry for a valid role (e.g., removes `elicitor` from `model-routing.psd1`); calls `Invoke-Claude -Role elicitor`; captures stderr; asserts a line matching `[ROUTING-HALT:MISSING-MAPPING elicitor]` appears before exit. Asserts `[ROUTING-HALT:INVALID-ROLE]` does NOT appear in stderr (`elicitor` is a valid role — only the mapping entry is missing; the wrong code means the wrong validation branch fired).

**TLA+ Coverage:**
- Action: `ValidateRoleSuccess` / `ValidateRoleFail`
- Action: `ResolveModel` (with override branch)
- Action: `MappingLookupFail`
- Action: `InvokeClaude`
- Invariant: **S1**, **S2**, **S6**, **S7**, **S8**, **S9** — S1 and S2 halt signals are operator-verifiable via `[ROUTING-HALT:...]` stderr codes (tests 10–11)
- Liveness: **L2**, **L3**, **L3b**, **L8**, **L9** (integration), **L11** (integration)

---

### Step 6: Graph Dedup and Retry State Machine

**Files:**
- `packages/vibe-cli/graph/dedup.ts` (create)
- `packages/vibe-cli/graph/dedup.test.ts` (create)

**Description:**
Implements the duplicate-detection and retry state machine as a TypeScript module. When `.addNode()` or `.addEdge()` in `graph.ts` detects a duplicate (path already in graphNodes/graphEdges), it calls into `dedup.ts`. The dedup module:
1. Enters `dedup_error` state; notifies the agent with the duplicate path and current `retryCount` value (D30 notification payload).
2. Increments `retryCount` and enters `retrying` state (GraphRetry; retryCount < MaxRetries).
3. Accepts a substitute path from the agent. If the substitute is also a duplicate, re-enters `dedup_error` with `retryCount` **unchanged** (D19 shared-budget semantics — BDD uses per-cycle retryCount=0 observable; implementation must reset the observable counter at dedup_error entry per BDD contract while the internal shared budget tracks exhaustion).
4. If `retryCount ≥ MaxRetries` and the build fails again, fires `GraphForceDedup`: discards the pending item (sets pendingNode/Edge to NULL, pendingKind to "none"), logs a `[WARN: force_dedup path=<dropped-path>]` line to stdout (see [WARN] Format Standard in Out-of-TLA+ Scope), then calls `GraphAfterForceDedup` (retryCount=0, graphState→collecting).
5. On any successful build (GraphNodeBuildSuccess / GraphEdgeBuildSuccess), resets `retryCount=0`.
All state transitions must be reflected in observable `graphState` values. `retryCount` resets at the three canonical sites (S20, retryCount glossary).

**Dependencies:** Step 2 (T2)

**Test (write first):**
Write a Vitest test that:
1. Adds a node, then tries to add the same node again — asserts `graphState="dedup_error"` and the agent receives a notification with the duplicate path (S10, S27).
2. Agent submits a different (non-duplicate) path — asserts `graphState="collecting"`, node accepted, `retryCount=0` (GraphRetryNodeSuccess, S20, L13).
3. Agent submits the same duplicate again (substitute is also a duplicate) — asserts `graphState="dedup_error"`, **`retryCount=0`** per BDD per-cycle observable (R10: the implementation resets the per-cycle observable counter to 0 at every dedup_error entry; the internal shared budget is tracked separately and is not directly observable per D19. An implementation that exposes the raw internal retryCount — which would be UNCHANGED from the prior GraphRetry — would fail this assertion. The test must fail RED if the implementation does not reset the observable to 0 on dedup_error re-entry).
4. With `retryCount=MaxRetries` and a failing build, asserts `GraphForceDedup` fires: dropped path appears in stdout as `[WARN: force_dedup path=<dropped-path>]` (see [WARN] Format Standard), `retryCount=0`, `graphState="collecting"` (S4, S5, L4).
5. Adds an edge with a duplicate endpoint tuple — asserts edge dedup fires (S11, GraphEdgeDuplicateDetected).
6. GraphRetryEdgeSuccess with a non-duplicate substitute — asserts accepted (S27, L12, L13).
7. **Fail-first injection (R6):** Asserts `graphOpsCount` does NOT increment during retry cycles (D17 ASSUME). *Fail-first:* Before implementing the graphOpsCount guard, stub the retry path to naively call `graphOpsCount++` on every loop iteration — the test will fail because graphOpsCount exceeds the value set before the first duplicate. Remove the spurious increment to pass. This verifies the guard is load-bearing, not vacuous.
8. **Fail-first injection (R6):** MaxRetries=1 boundary: first duplicate fires dedup_error (no force-dedup yet, retryCount=1 after GraphRetry); second attempt with a still-duplicate substitute triggers force-dedup immediately (OBJ-9 MaxRetries=1 boundary scenario). *Fail-first:* Initially wire the force-dedup trigger condition as `retryCount > MaxRetries` (strictly greater, off-by-one). The test will fail because force-dedup does not fire at exactly MaxRetries=1. Correct to `retryCount >= MaxRetries` to pass. This detects the common off-by-one in boundary conditions before implementation is complete.
9. **Fail-first injection (R6):** Asserts `graphState ∈ {idle,collecting,writing,done,warn} ⇒ retryCount=0` (S20 RetryCountClean). *Fail-first:* Omit the `retryCount=0` reset in `GraphNodeBuildSuccess` and `GraphEdgeBuildSuccess` initially — the test will fail because retryCount is non-zero in collecting state after a successful build. Add the reset to pass. Proves the canonical reset sites are load-bearing.
10. **Fail-first injection (R6):** Asserts `graphState="building" ⇒ pendingKind ∈ {node,edge}` and `graphState="retrying" ⇒ pendingKind ∈ {node,edge}` (S27 PendingCoherence). *Fail-first:* Stub `GraphAddNode` to transition to `graphState="building"` without setting `pendingKind` (leaving it at `"none"`). The test will fail because pendingKind="none" in building state. Add the `pendingKind="node"` assignment to `GraphAddNode` before the state transition to pass. Confirms PendingCoherence is actively enforced, not accidentally true.
11. **graphState='force_dedup' direct assertion (R1):** Assert that `graphState` transiently equals `"force_dedup"` between `GraphForceDedup` firing and `GraphAfterForceDedup` completing. Set up with `MaxRetries=1` and a still-duplicate substitute. After the second still-duplicate submission (which triggers `GraphForceDedup`), assert `graphState="force_dedup"` **before** allowing `GraphAfterForceDedup` to fire. In the implementation this is achieved by inserting a synchronization point (e.g., an awaited Promise or a state-capture callback injected via test double) between the two actions. Then release the synchronization and assert `graphState="collecting"` (GraphAfterForceDedup completed). This test is the only coverage of `graphState="force_dedup"` as a directly observable transient state — without it, `force_dedup` is only inferred from the `collecting` outcome, which does not prove the intermediate state was entered.

**TLA+ Coverage:**
- Action: `GraphNodeDuplicateDetected`, `GraphEdgeDuplicateDetected`
- Action: `GraphRetry`, `GraphRetryNodeSuccess`, `GraphRetryEdgeSuccess`
- Action: `GraphRetryNodeStillDuplicate`, `GraphRetryEdgeStillDuplicate`
- Action: `GraphForceDedup`, `GraphAfterForceDedup`
- Action: `GraphNodeBuildSuccess`, `GraphEdgeBuildSuccess`
- State: `graphState = "force_dedup"` — directly asserted in test 11 (R1)
- Invariant: **S4**, **S5**, **S10**, **S11**, **S16**, **S20**, **S27**
- Liveness: **L4**, **L4b**, **L12**, **L13**

---

### Step 7: Hook Registration in `.claude/settings.json`

**Files:**
- `.claude/settings.json` (modify)
- `packages/vibe-cli/tests/hook-registration.Tests.ps1` (create)

**Description:**
Registers the es-hook and rg-hook as `PreToolUse` hooks in the monorepo `.claude/settings.json` for both `Bash` and `PowerShell` tool types. The es-hook entry **must appear before** the rg-hook entry in the `hooks` array (D28 sequential evaluation model; hook evaluation order invariant from BDD glossary). The hook runner path must point to the actual `.ps1` files. Each hook entry specifies the script path and the set of surface-token matchers. The settings file must remain valid JSON after modification.

**Dependencies:** Step 3 (T3), Step 4 (T4)

**Test (write first):**
Write a Pester test that:
1. Reads `.claude/settings.json` and parses it as JSON — asserts no parse error.
2. Asserts a `PreToolUse` hook block exists for both `Bash` and `PowerShell` tool types.
3. Asserts `es-hook.ps1` appears at a **lower array index** than `rg-hook.ps1` in the hooks array (ordering contract; BDD WRONG hook order negative scenario).
4. Asserts the es-hook entry includes all five surface-token matchers: `find`, `ls`, `dir`, `Get-ChildItem`, `gci`.
5. Asserts the rg-hook entry includes all five matchers: `grep`, `egrep`, `fgrep`, `Select-String`, `sls`.
6. Asserts the script paths for both hooks are valid absolute or workspace-relative paths that point to existing `.ps1` files.
7. Negative: swaps the hook order and asserts the ordering contract is violated (verifying the test catches the wrong order).

**TLA+ Coverage:**
- State: `hookKind` domain `{"none","es","rg"}` (D37)
- Constant: `FindCmds = {"find"}` representative for `{find,ls,dir,Get-ChildItem,gci}` (D38)
- Constant: `GrepCmds = {"grep"}` representative for `{grep,egrep,fgrep,Select-String,sls}` (D38)
- ASSUME: **D28** `HookEvaluationOrderAndDelegationChainIsDeclaredAbstraction`

---

### Step 8: Graph Write Engine (Markdown Writer + Write/Fail/Halt Actions)

**Files:**
- `packages/vibe-cli/graph/markdown.ts` (create)
- `packages/vibe-cli/graph/index.ts` (modify — wire write lifecycle into tsx entry point)
- `packages/vibe-cli/graph/markdown.test.ts` (create)

**Description:**
Implements the `GraphWriteMarkdown → GraphWriteSuccess/GraphWriteFail` lifecycle and `GraphHaltCleanup`. `markdown.ts` renders the dense machine-readable CLAUDE.md format: node types as headers with comma-separated full paths, edge types as headers with comma-separated `from -> to` relationships. The write is **atomic**: output to a temp file (`CLAUDE.md.tmp`), then rename to `CLAUDE.md` at the repo root (D26 two-phase write collapse). A rename failure is a distinct `GraphWriteFail` path: temp file exists, prior CLAUDE.md intact, `markdownState` remains stale (D26). `markdownState` transitions: `"none"→"current"` on first success, `"stale"→"current"` on recovery, `"current"→"stale"` on failure (never `"stale"→"none"` — S34). `graphOpsCount` and `retryCount` reset to 0 at epoch boundary (GraphWriteSuccess/Fail — S35). `GraphHaltCleanup` preserves `markdownState` unchanged across all 7 active entry states (S33). `index.ts` is updated to call `markdown.ts` after collecting all graph data, enforcing the `agentsCompleted < MaxAgents` guard (S38).

**Dependencies:** Step 6 (T6)

**Test (write first):**
Write a Vitest test that:
1. Builds a graph with two nodes and one edge; calls the markdown writer; asserts the output matches the dense format (`## file\n<paths>\n\n## imports\n<from -> to>`).
2. Asserts `markdownState="current"` after a successful write (GraphWriteSuccess → S34).
3. Simulates a write failure (mock filesystem error on the temp-file write); asserts `markdownState` transitions `current→stale` (GraphWriteFail → S34).
4. Calls GraphWriteFail twice consecutively; asserts `markdownState` stays `"stale"` (never `"stale"→"none"` — S34, MarkdownStateMonotone).
5. Simulates GraphHaltCleanup from `markdownState="current"` — asserts `markdownState` unchanged (S33 for "current" entry case).
6. Simulates GraphHaltCleanup from `markdownState="stale"` — asserts unchanged.
7. **Expanded: GraphHaltCleanup during active write (Rec1 — most critical S33 case):** Set up the graph in `graphState="writing"` with `markdownState="current"` (previous epoch succeeded). Inject a halt signal (`pipelineState="halted"`) while the markdown write is in progress — simulate by using a mock filesystem that suspends mid-write, then sets pipelineState to halted before the rename completes, then releases the suspension. Assert `GraphHaltCleanup` fires from `graphState="writing"` (one of the 7 active abort states per S33). Assert `markdownState` remains `"current"` (unchanged — the partial in-progress write does NOT degrade markdownState). Assert `graphState="warn"` after cleanup. Assert `CLAUDE.md` on disk is NOT partially overwritten (the temp file rename was aborted). This is the most critical S33 test case because the writing state is the only active state where a real file-system operation is in flight when the halt fires.
8. Asserts `graphOpsCount=0` and `retryCount=0` after GraphWriteSuccess and GraphWriteFail (S35, S20).
9. Asserts `graphState="writing" ⇒ agentsCompleted < MaxAgents` (S38) by attempting to enter writing with `agentsCompleted=MaxAgents` and asserting an error.
10. Asserts `pendingNode=NULL ∧ pendingEdge=NULL ∧ pendingKind="none"` after GraphWriteSuccess/Fail/HaltCleanup (S16).
11. **Integration test — multi-agent epoch boundary (Rec2 — Given/When/Then):**
    - **Given:** A graph instance configured with `MaxAgents=2` and `agentsCompleted=0`. One node and one edge have been accepted into the graph (graphState="collecting", pendingKind="none").
    - **When:** `GraphWriteMarkdown` is invoked for the first agent epoch.
    - **Then:** `graphState` returns to `"collecting"` (the ELSE branch fires because `agentsCompleted=1 < MaxAgents=2`); `agentsCompleted=1`; `markdownState="current"`.
    - **When:** `GraphWriteMarkdown` is invoked a second time (agent 2 epoch).
    - **Then:** `graphState="done"` (the IF branch fires because `agentsCompleted=2 = MaxAgents=2`); `agentsCompleted=2`; `markdownState="current"` (S25, D31 multi-agent path).
12. **D26 rename-failure distinct from write-failure (R7 — production reliability gap):** Set up a mock filesystem that permits the temp-file write to succeed (`CLAUDE.md.tmp` is created with correct content) but causes the subsequent rename-to-`CLAUDE.md` to fail (e.g., mock `fs.rename` to throw `EACCES`). Assert: `markdownState` does NOT advance to `"current"` — it remains `"stale"` (or stays at its prior value if already stale); the GraphWriteFail path fires. Assert: `CLAUDE.md.tmp` exists on the mock filesystem (the temp write succeeded). Assert: `CLAUDE.md` is NOT updated (the prior CLAUDE.md content is intact; the rename never completed). This is D26's "rename-failure counterpart" — the TLA+ spec collapses both write and rename into a single `GraphWriteMarkdown` action, but the implementation must treat them as distinct failure modes. An implementation that catches only write errors but not rename errors would pass test 3 while failing test 12.

**TLA+ Coverage:**
- Action: `GraphWriteMarkdown` (collecting→writing, SF-fair)
- Action: `GraphWriteSuccess` (agentsCompleted++, markdownState="current", graphOpsCount/retryCount reset)
- Action: `GraphWriteFail` (agentsCompleted++, markdownState degraded, reset)
- Action: `GraphHaltCleanup` (from all 7 active states, markdownState UNCHANGED)
- Invariant: **S16**, **S18**, **S19**, **S25**, **S30**, **S31**, **S33**, **S34**, **S35**, **S37**, **S38**
- Liveness: **L5**, **L10**

---

### Step 9: Agent System Prompt Instructions

**Files:**
- `packages/vibe-cli/agents/graph-instructions.md` (create)
- Agent role files (modify each of the 6 role system prompts to append graph instructions)

**Description:**
Creates a canonical graph-instructions document and appends it to each of the six agent role system prompts (elicitor, doc-writer, expert, moderator, reviewer, code-writer). Instructions tell agents to: (1) write `.addNode(fullPath, nodeType)` calls into the appropriate `graph/<dir>/nodes.ts` file when they discover a file, package, component, or function; (2) write `.addEdge(fromPath, toPath, edgeType)` calls when they discover a relationship; (3) use only full paths with directory separators as node identities (bare filenames and rg output tokens are rejected); (4) not add edges before adding their endpoint nodes. These instructions implement `GraphStartCollecting` → `GraphAddNode/Edge` by guiding agents through the correct API. The instructions also document the dedup notification: if an agent receives a duplicate error, it must submit a different full path.

**Pre-condition (Rec7):** All six agent role files (`elicitor.md`, `doc-writer.md`, `expert.md`, `moderator.md`, `reviewer.md`, `code-writer.md` in `packages/vibe-cli/agents/`) must already exist before this step executes. If any role file is absent, the append operation for that role will fail and the corresponding test will report a missing-file error rather than a content-assertion failure. The task dispatcher must verify all six files exist before dispatching T9.

**Dependencies:** Step 2 (T2)

**Test (write first):**
Write a Pester test. **Note: these are content-existence tests (Rec3) — they assert that required text is present in the artifact files, not that the instructions produce dynamic behavioral outcomes. Dynamic behavior (agents actually calling `.addNode`/`.addEdge`) is covered by Step 6 (unit) and Step 12 (E2E). These tests verify artifact completeness only.**
1. Reads each of the six agent system prompt files and asserts the graph-instructions content is appended.
2. Asserts the instructions include the `.addNode(fullPath, type)` signature with all five valid node types (`app`, `package`, `component`, `function`, `file`).
3. Asserts the instructions include the `.addEdge(from, to, type)` signature with all seven valid edge types (`calls`, `imports`, `exports`, `depends_on`, `contains`, `tested_by`, `test_for`).
4. Asserts the instructions explicitly state that bare filenames (no directory separator) are invalid node identities.
5. Asserts the instructions explain the dedup notification protocol (duplicate path sent to agent; retry with different path).

**TLA+ Coverage:**
- Action: `GraphAddNode` (agents drive this via system prompt instructions)
- Action: `GraphAddEdge` (agents drive this; graphNodes ≠ {} guard)
- Constant: node types `{app, package, component, function, file}`
- Constant: edge types `{calls, imports, exports, depends_on, contains, tested_by, test_for}`
- State: `graphState = "collecting"` (active collection phase driven by agents)

---

### Step 10: Close Hook PowerShell Script

**Files:**
- `packages/vibe-cli/utils/close-hook.ps1` (create)
- `packages/vibe-cli/tests/close-hook.Tests.ps1` (create)

**Description:**
Creates the per-agent close hook script (`close-hook.ps1`) that fires after each `Invoke-Claude` returns. The script:
1. Runs `tsx packages/vibe-cli/graph/index.ts` with a `closeHookTimeout` deadline; kills the process if it exceeds the timeout, logs `[WARN: closeHookTimeout agent=<agent-index>]` to stdout (see [WARN] Format Standard in Out-of-TLA+ Scope), and continues (closeHookTimeout is outside TLA+ scope per D11/BDD glossary).
2. On success: transitions `agentsCompleted++`, `markdownState="current"` (GraphWriteSuccess).
3. On failure: transitions `agentsCompleted++`, `markdownState` degraded (GraphWriteFail).
4. Critically: `agentsCompleted` is only incremented here — **after** the tsx write attempt completes — never before (S32 CloseHookPrecedesNextEpoch, S37 WritingStateGatesAgentsCompleted).
5. The next pipeline stage must not begin until this script returns (sequencing invariant, S32, S37).
6. GraphHaltCleanup behavior: if the pipeline is already halted when the close hook fires, the graph subsystem transitions to `graphState="warn"` without modifying `markdownState`.

**Dependencies:** Step 8 (T8)

**Test (write first):**
Write a Pester test that:
1. Mocks a successful tsx run; asserts `agentsCompleted` increments by 1 after the close hook completes (S18, S25).
2. Mocks a failing tsx run; asserts `agentsCompleted` still increments and `markdownState` is degraded (GraphWriteFail branch).
3. Asserts that `agentsCompleted` is **not** incremented until after the tsx process exits (S32 CloseHookPrecedesNextEpoch).
4. Simulates timeout: tsx process hangs beyond `closeHookTimeout`; asserts the process is killed and `[WARN: closeHookTimeout agent=<agent-index>]` is written to stdout; asserts pipeline continues.
5. Asserts that the close hook, when called on a halted pipeline, does not increment `agentsCompleted` and does not modify `markdownState` (GraphHaltCleanup — agentsCompleted UNCHANGED per BDD glossary exclusion note).
6. Integration test: runs two consecutive close hooks (MaxAgents=2); asserts `agentsCompleted` reaches 2 after both complete, and `graphState="done"` on the second (S25, L1 progress toward termination).

**TLA+ Coverage:**
- Action: `GraphWriteSuccess` (agentsCompleted++, markdownState="current")
- Action: `GraphWriteFail` (agentsCompleted++, markdownState degraded)
- Action: `GraphHaltCleanup` (agentsCompleted UNCHANGED, markdownState UNCHANGED)
- Invariant: **S18**, **S25**, **S32**, **S37**
- Liveness: **L7**, **L10**

---

### Step 11: Pipeline Wiring — Integrate All Subsystems

**Files:**
- `packages/vibe-cli/vibe.ps1` (modify — add close hook call after each agent invocation)
- Relevant `stages/*.ps1` files (modify — pass `$Role` to all `Invoke-Claude` calls)
- `packages/vibe-cli/tests/pipeline-wiring.Tests.ps1` (create)

**Description:**
Wires all three subsystems into the live pipeline:
1. All `Invoke-Claude` call sites in `stages/` now pass the correct `$Role` argument for each stage/agent role.
2. After each `Invoke-Claude` returns, `close-hook.ps1` is called (GraphWriteMarkdown → GraphWriteSuccess/Fail lifecycle).
3. The next pipeline stage does not begin until `close-hook.ps1` returns (S32, S37).
4. `PipelineComplete` fires when `routingState=done ∧ graphState∈{done,warn} ∧ hookState∈{idle,done,error}` — the pipeline runner checks all three subsystem terminals before declaring done (S8, S22-S26).
5. Pipeline `done` and `halted` are absorbing states — no transition back to running (S22, S23).

**Dependencies:** Step 5 (T5), Step 10 (T10)

**Test (write first):**
Write a Pester test that:
1. Mocks the full pipeline with correct `$Role` arguments for each stage; asserts no `Invoke-Claude` call lacks a `$Role` argument.
2. Asserts that for a pipeline with MaxAgents=3, `PipelineComplete` is not reached until `agentsCompleted=3` (S25, negative path: agentsCompleted=1 with MaxAgents=3 → pipelineState must remain "running").
3. Asserts that a routing failure (unknown role) halts the pipeline and graphState eventually reaches "warn" via GraphHaltCleanup (S22, S6).
4. Asserts that `hookState=error` alone (with routing success) does not halt the pipeline — pipelineState reaches "done" (S17, L7).
5. Asserts `hookState=error ∧ pipelineState=halted` is jointly absorbing once reached (S26).
6. Asserts `pipelineState=done` implies `routingState=done ∧ agentsCompleted=MaxAgents` (S8, S25).
7. Integration test: runs the pipeline with no search commands — asserts pipeline completes normally with `hookState="idle"` at three specific checkpoints: (1) immediately after `StartPipeline` fires (no intercept triggered, `hookState="idle"`); (2) immediately after `InvokeClaude` succeeds (`routingState="done"`, `hookState` still `"idle"` — confirmed by asserting no hook audit log entries exist at this point); (3) at `PipelineComplete` (`pipelineState="done"`, `hookState="idle"` — confirmed by reading the final pipeline state object). Replacing `"throughout"` with these three explicit checkpoints ensures the test fails if hookState changes at any of the observable boundaries, not merely at pipeline end (Rec4, D22, BDD "no search commands" scenario).
8. Integration test: runs the full pipeline with a hook intercept; asserts the hook rewrite completes before the PostToolUse event (D21/D7 liveness obligation: hookRewritten=TRUE confirmed in audit log before control returns).
9. **Hook-vs-routing halt signal discrimination (BDD + TDD blocking objection):** Run a pipeline where the rg-hook's rewritten command fails at runtime (post-rewrite failure: `hookRewritten=TRUE`, `hookState="error"`). Capture stderr. Assert: a line matching `[HOOK-FAIL:rg]` appears in stderr. Assert: NO line matching `[ROUTING-HALT:INVALID-ROLE]` appears in stderr. Assert: NO line matching `[ROUTING-HALT:MISSING-MAPPING]` appears in stderr. Assert: NO line matching `[ROUTING-HALT:INVALID-MODEL]` appears in stderr (R4 — closed set: these are the only three routing halt codes; asserting all three by name ensures no new routing-halt code is accidentally emitted on a hook-failure path). Assert: `pipelineState="done"` (S17 `HookErrorAllowsCompletion` — hook failure does not halt the pipeline). This is the cross-subsystem halt signal disambiguation test: an operator watching stderr can reliably distinguish a hook failure (`[HOOK-FAIL:...]`) from any routing halt (`[ROUTING-HALT:...]`) without inspecting internal state variables. Must be written RED before the `[HOOK-FAIL:...]` emitter is implemented in es-hook/rg-hook.
10. **D27 4-step hook-completion-after-halt integration test (R2):** This test reproduces the exact four-step action interleaving that D27 extended (Revision 20, O-7 fix) requires all integration tests to simulate:
    - **Step 1:** Fire `StartPipeline` — assert `pipelineState="running"`, `hookState="idle"`.
    - **Step 2:** Fire `HookInterceptEs` with a `find`-command payload — assert `hookState="intercepting"`. Suspend `HookRewrite` (use `Mock Invoke-EsHookRewrite { Start-Sleep -Seconds 9999 }` or a Pester-controlled wait handle) so the hook is stuck in `"intercepting"`.
    - **Step 3:** Fire `ValidateRoleFail` concurrently (inject an invalid role into the routing path or call the halt signal directly) — assert `pipelineState="halted"`. Assert `hookState` is STILL `"intercepting"` (the halt does NOT abandon the in-progress intercept — D27 design choice: no pipelineState guard on hook actions).
    - **Step 4:** Release `HookRewrite` (remove the mock or release the wait handle) — assert `hookState` advances to `"rewriting"`, then to `"done"` or `"error"`. Assert `hookState ∈ {"done","error"}` even with `pipelineState="halted"`. Assert `hookRewritten=TRUE`.
    This four-step interleaving is the canonical test specified by D27. Any alternative simulation (e.g., injecting an artificial delay without actually halting, or testing only the halt without freezing HookRewrite) does not satisfy D27's compensating-test obligation. Must be written RED before implementing hook-action independence from pipelineState.

**TLA+ Coverage:**
- Action: `StartPipeline`, `PipelineComplete`, `Terminated`
- Action: `HookRewrite`, `HookExecuteSuccess/Fail` — D27 hook-after-halt path (test 10)
- Invariant: **S8**, **S17**, **S22**, **S23**, **S24**, **S25**, **S26** — S17 and S1/S2/D23 halt paths are operator-distinguishable via the halt signal format specified in Step 5 (test 9 verifies cross-subsystem discrimination with closed-set negative assertion)
- Liveness: **L1**, **L7**
- ASSUME: **D27** `HookActionsCompleteAfterHaltIsDeclaredAbstraction` — test 10 exercises the canonical 4-step interleaving

---

### Step 12: E2E Integration Tests and Completeness Verification

**Files:**
- `packages/vibe-cli/tests/pipeline-e2e.Tests.ps1` (create)
- `packages/vibe-cli/graph/integration.test.ts` (create)

**Description:**
The final step writes comprehensive end-to-end and integration tests covering multi-subsystem interactions, then verifies all unit, integration, and E2E tests pass with the feature fully wired. The E2E tests target the scenarios explicitly required by the elicitor ("Every feature MUST include unit tests, integration tests, and end-to-end (e2e) tests") and cover the TLC-unverified properties identified in D31 (multi-agent paths S25/S30/S31, L4/L5 multi-epoch).

**Dependencies:** Step 5 (T5), Step 7 (T7), Step 11 (T11)

**Test (write first):**
Write both Pester E2E tests and Vitest integration tests:

*Pester E2E (`pipeline-e2e.Tests.ps1`):*
1. Triple-failure E2E: seed pipeline with `hookState=error`, `graphState=warn`, `routingState=error`; assert `pipelineState=halted` after routing failure; `graphState=warn` (GraphHaltCleanup path); `hookState=error` persists. Assert all three states are independently observable.
2. Multi-agent monotone test: run a 2-agent pipeline where agent 1 adds nodes A and B; agent 2 adds node C; assert after epoch 2 that A, B, AND C are all present in CLAUDE.md (S30/S31 cross-epoch accumulation, D31 compensating test).
3. Pipeline-done requires all agents: MaxAgents=3 pipeline; run 2 agents; assert `pipelineState="running"`; run 3rd agent; assert `pipelineState="done"` (S25 compensating test).
4. Dedup multi-epoch: 2-agent pipeline where agent 1 submits a duplicate; force-dedup fires; agent 1's epoch completes; agent 2 runs; pipeline reaches "done" (L4 multi-epoch compensating test, D31).
5. Hook rewrite audit: run pipeline with a find-command; assert `hookRewritten=TRUE` appears in the hook audit log BEFORE the PostToolUse event fires (D21 integration-test obligation; D7 BDD liveness bound).
6. **Close hook sequencing with timestamp injection (Rec5):** Assert that no next-stage-start log entry appears before the close hook process exit timestamp. Timestamps are injected using a test double: replace the timestamp provider (`Get-Date` or equivalent module function) with a monotonic integer counter (`$script:TestClock = 0; Mock Get-Date { $script:TestClock++ }`) that increments on each call. All log entries (close-hook-exit, next-stage-start) record this counter value as their timestamp. Assert that `closeHookExitTimestamp < nextStageStartTimestamp` (strict inequality on the counter values). This injection prevents flaky failures from OS clock resolution (two events within the same millisecond would produce equal timestamps with the real clock, falsely passing a non-strict test). (S32/S37 sequencing invariant — negative test: the counter values confirm ordering without relying on wall-clock precision.)
7. Crash-and-restart recovery: after epoch 1 close hook succeeds, assert CLAUDE.md persists if the pipeline is restarted (D18 compensating test).
8. **Multi-agent force-dedup cross-epoch (OBJECTION 2 — D31 TokenSaving-MultiAgent.cfg TLC-verified path):** `MaxRetries=1`, `MaxAgents=2` pipeline. Agent-1 epoch: add node A (collecting→building→collecting); then add node A again (building→dedup_error, S10); GraphRetry fires (dedup_error→retrying, retryCount=1); submit substitute node A' which is also a duplicate (retrying→dedup_error, retryCount UNCHANGED=1, D19); retryCount≥MaxRetries=1 → GraphForceDedup fires (pendingNode=NULL, pendingKind="none", retryCount=0, force_dedup→collecting, S4/S5); close hook succeeds (GraphWriteMarkdown→writing→collecting, agentsCompleted=1, markdownState="current"). Agent-2 epoch starts: add node B (collecting→building→collecting); close hook succeeds (agentsCompleted=2=MaxAgents, graphState=done, markdownState="current"). Assert: graphState="done", agentsCompleted=2, graphNodes contains A and B (A' discarded by force-dedup, never in graphNodes), stdout contains a `[WARN: force_dedup path=A']` entry for the discarded node (see [WARN] Format Standard), no routing failures. This scenario is TLC-verified under `TokenSaving-MultiAgent.cfg` (MaxAgents=2, MaxRetries=1, added in Revision 20 D31 extension) but had **zero** prior BDD or implementation-plan coverage — filling the gap declared by Objection 2.
9. **D12 epoch-relative freshness — CLAUDE.md file content inspection (OBJECTION 3):** `MaxAgents=2` pipeline. Epoch-1: add nodes P and Q, close hook succeeds (agentsCompleted=1, markdownState="current"); **First assert `Test-Path 'CLAUDE.md' | Should -Be $true`** (R8 — file existence confirmed before content inspection; a missing file would cause a misleading "file not found" error rather than a meaningful content assertion failure). Then inspect CLAUDE.md file content — assert P and Q appear as nodes. Epoch-2: add node R (graphState→building→collecting, graphOpsCount=1), do NOT fire close hook — instead fire GraphHaltCleanup (pipelineState set to halted). Assert: graphState="warn", markdownState UNCHANGED="current" (S33 GraphHaltCleanupPreservesMarkdown). **Then assert `Test-Path 'CLAUDE.md' | Should -Be $true` again** and inspect CLAUDE.md file content directly (do NOT rely on markdownState alone): assert P and Q are still in CLAUDE.md; assert R is NOT present in CLAUDE.md (epoch-2 discovery was lost without a write). This test enforces D12's compensating-test obligation from Revision 20: `markdownState="current"` after halt reflects epoch-1 data only; the file content is the sole reliable signal that epoch-2 data is missing. A test that checks only `markdownState="current"` would produce a false-positive signal of full freshness.

*Vitest integration (`integration.test.ts`):*
1. **MaxGraphOps boundary with D20 operator observability and off-by-one assertion (BDD blocking objection — D20-DESIGN, R9):** With MaxGraphOps=3, attempt 4 add-operations. Assert: (a) the **3rd add-operation succeeds** (graphState="building" accepted, graphOpsCount=3 — this is the boundary operation that must NOT be silently disabled; an off-by-one that disables at `graphOpsCount >= MaxGraphOps` rather than `graphOpsCount > MaxGraphOps` would reject the 3rd operation and fail this assertion); (b) the 4th add-operation is silently disabled with respect to the agent — no `dedup_error` state, no agent notification, no retry cycle is triggered (D20-DESIGN: silence-to-agent is a deliberate design decision, not an implementation gap; see Out-of-TLA+ Scope → D20-DESIGN); (c) a `[WARN: graphOpsCount=MaxGraphOps epoch-boundary enforced]` log entry appears on stderr (operator-observable channel — operators MUST rely on this log entry, not on an agent notification, to detect the epoch boundary); (d) epoch completes via GraphWriteMarkdown containing only the first 3 ops (the 4th op's data is absent from the written output). Asserting only "the epoch completes" is insufficient to verify D20-DESIGN — the test MUST separately assert the 3rd success, the silence (no agent notification event), AND the operator log entry.
2. MaxGraphOps=0 zero-budget: every add-operation is disabled immediately; epoch produces empty write (BDD MaxGraphOps=0 scenario).
3. MaxRetries=0 zero-retries: first duplicate immediately triggers force-dedup (BDD MaxRetries=0 scenario).
4. Inter-agent concurrent write race: inject two simultaneous tsx write attempts; assert the losing agent's error is surfaced and pipeline continues with the winning agent's CLAUDE.md (D26 inter-agent race compensating test).
5. **D19 boundary — shared budget vs per-cycle BDD observable (TLA+ objection, recommended):** MaxRetries=2. Stage 1 (within a single agent epoch): submit duplicate node X → `graphState=dedup_error`, `retryCount=1` (GraphRetry fires). Submit X again as substitute (still duplicate) → `graphState=dedup_error`, `retryCount=1` UNCHANGED (D19 StillDuplicate: retryCount does not increment on still-duplicate). Retries remain; submit valid substitute X' → `GraphRetryNodeSuccess` fires: `graphState=collecting`, `retryCount=0` (budget reset at success boundary). GraphWriteMarkdown → `agentsCompleted=1`. Stage 2 (new epoch or continued): submit a NEW duplicate node X. Assert: at `graphState=dedup_error` entry in stage 2 after GraphRetry, `retryCount=1` (one retry consumed in stage 2's fresh dedup cycle). Assert: `retryCount` did NOT carry over from stage 1 (stage-1 success reset retryCount=0; stage-2 dedup starts fresh). If an implementation fails to reset retryCount at GraphRetryNodeSuccess, stage-2's retryCount would start from 1 pre-GraphRetry, causing GraphRetry to push it to 2 and prematurely trigger MaxRetries behavior — this test detects that leak. Verifies the D19 abstraction boundary: BDD per-cycle observable (fresh retryCount at dedup_error entry relative to the current dedup event) is satisfied; TLA+ shared budget correctly resets at success boundaries.

**TLA+ Coverage:**
- Invariants: **S22**, **S23**, **S24**, **S25**, **S26**, **S30**, **S31** (multi-agent paths)
- Invariants: **S4**, **S5**, **S10**, **S33** (Pester test 8: force-dedup cross-epoch; Pester test 9: halt cleanup preserves markdown)
- Liveness: **L1** (end-to-end), **L4**, **L4b**, **L5** (multi-epoch paths)
- D12 epoch-relative freshness compensating integration test (Pester test 9 — file existence + content inspection, not markdownState alone)
- D18, D20, D21, D26, D31 compensating integration test obligations
- D31 TokenSaving-MultiAgent.cfg TLC-verified path (Pester test 8 — MaxRetries=1 force-dedup cross-epoch, zero prior BDD coverage)
- D19 boundary compensating integration test (Vitest test 5 — shared budget reset verified across success boundaries)

---

## State Coverage Audit

All TLA+ states, transitions, safety invariants, and liveness properties from `TokenSaving.tla` Revision 20 are covered by the implementation steps. Ten required changes and nine recommended improvements from the Round 3 debate have been applied; see resolutions below.

### Coverage Summary

| Category | Total | Covered | Steps |
|----------|-------|---------|-------|
| Pipeline states | 4 | 4 | Steps 5, 11 |
| Routing states | 6 | 6 | Step 5 |
| Hook states | 5 | 5 | Steps 3, 4 |
| Graph states | 9 | 9 | Steps 2, 6, 8 |
| Named transitions | 31 | 31 | Steps 2–11 |
| Safety invariants (S1–S38) | 38 | 38 | Steps 2–11 |
| Liveness properties (L1–L14) | 14 | 14 | Steps 3–12 |

### Debate Objection Resolutions (Revision 20)

**Objection 1 — hookKind glossary inversion in bdd.feature:**
The BDD `hookKind` glossary entry (OBJ-3) incorrectly states `hookState="done" IMPLIES hookKind ∈ {"es","rg"}` and attributes this to S28 (`HookKindConsistent`). This is factually inverted: TLA+ S15 (`HookCleanupComplete`) asserts `hookState="done" ⇒ hookKind="none"` (success clears hookKind), while S28 (`HookErrorPreservesKind`) asserts `hookState="error" ⇒ hookKind ∈ {"es","rg"}` (error path preserves hookKind). The glossary entry mislabels both the invariant name and the antecedent state. **Resolution:** Warning blocks added to Steps 3 and 4 descriptions. New test points 8 and 9 in each step's test description explicitly enforce `hookKind="none"` at the done terminal (S15) and `hookKind∈{"es","rg"}` preserved at the error terminal (S28). These tests MUST be written first to catch any implementation following the inverted BDD glossary.

**Objection 2 — Missing multi-agent force-dedup + cross-epoch BDD scenario:**
The `TokenSaving-MultiAgent.cfg` (added in Revision 20, D31 extension) TLC-verifies a path with `MaxAgents=2, MaxRetries=1` where agent-1 exhausts its force-dedup budget within epoch-1, the epoch-1 close hook succeeds, and agent-2 proceeds to `graphState=done`. This path exercises S4, S5, S10, L4, and the cross-epoch return branch of GraphWriteSuccess. No prior BDD scenario or implementation-plan test covered this path. **Resolution:** Step 12 Pester E2E test 8 added, describing the full state walk (dedup_error→retrying→dedup_error→force_dedup→collecting→writing→collecting→writing→done across two agent epochs) with explicit assertions on graphNodes, `[WARN: force_dedup path=A']` stdout entry, and terminal graphState.

**Objection 3 — Missing D12 epoch-relative freshness BDD scenario:**
TLA+ D12 (Revision 20 extension) declares that `markdownState="current"` does not encode which epoch was written — a halt after epoch-1 leaves `markdownState="current"` but CLAUDE.md contains only epoch-1 data while epoch-2 discoveries are silently lost. No prior test verified this by inspecting CLAUDE.md file content, and relying on `markdownState` alone would give a false-positive freshness signal. **Resolution:** Step 12 Pester E2E test 9 added, enforcing a 2-epoch pipeline where GraphHaltCleanup fires during epoch-2 collection (before GraphWriteMarkdown), then directly reads CLAUDE.md to assert epoch-1 nodes are present and epoch-2 node R is absent — satisfying D12's compensating-test obligation with file-existence check + file-content verification rather than state-variable inspection.

### Debate Objection Resolutions (Revision 21)

**Objection — L14 InterceptingLeadsToRewriting has no failing-first test (TDD: blocking):**
L14 was listed in the TLA+ Coverage sections of Steps 3 and 4 but lacked any test that seeded `hookState="intercepting"` to prove the `HookRewrite` transition is load-bearing. Without this, a dead implementation of `HookRewrite` (one that is never called) could pass all prior tests while L14 is vacuously satisfied — the liveness property would hold because the system never enters intercepting in tests. **Resolution:** Tests 10 in Steps 3 and 4 add the required failing-first mechanism: seed intercepting state, disable HookRewrite, assert hook gets stuck (test FAILS here if HookRewrite is absent — confirming the test is not vacuous), re-enable HookRewrite, assert progress to rewriting. The test must be written RED before implementing HookRewrite. Any implementation omitting or dead-stubbing HookRewrite will be caught at test 10 regardless of other passing tests.

**Objection — D11 pre-output crash is a distinct failure mode with no test (TDD: blocking; edge-cases: accept with backlog note):**
The hook's pre-output crash (script crashes before stdout, hookRewritten=FALSE) was described in Step 3's description text but had no corresponding test. **Resolution:** Tests 11 in Steps 3 and 4 cover the pre-output crash path, asserting hookRewritten=FALSE and no rewritten payload on stdout. A `D11-PREOUTPUT` backlog note is added to the Out-of-TLA+ Scope section recommending a formal ASSUME in a future TLA+ revision.

**Objection — Halt signal disambiguation has no specification (BDD + TDD: blocking):**
No operator-visible discriminating signal was specified between `hookState=error` (hook post-rewrite failure; does NOT halt the pipeline per S17) and routing halts. **Resolution:** A halt signal design decision block added to Step 5 specifies four structured stderr prefix codes: `[ROUTING-HALT:INVALID-ROLE <role>]`, `[ROUTING-HALT:MISSING-MAPPING <role>]`, `[ROUTING-HALT:INVALID-MODEL <model>]`, and `[HOOK-FAIL:<hookKind>]`. Tests 10–11 in Step 5 assert correct routing halt code emission. Test 9 in Step 11 adds the cross-subsystem discrimination test with a closed-set negative assertion (R4: all three routing halt codes named explicitly).

**Objection — D20 silent MaxGraphOps must be an explicit documented design decision (BDD: blocking):**
The MaxGraphOps epoch boundary caused silent add-operation discard without any documented design decision. **Resolution:** Step 12 Vitest integration test 1 updated to assert BOTH the silence (no agent notification event generated) AND a `[WARN: graphOpsCount=MaxGraphOps epoch-boundary enforced]` operator log entry on stderr. A `D20-DESIGN` entry added to the Out-of-TLA+ Scope section explicitly documents the silence-to-agent as a deliberate design choice. The test now also asserts the 3rd operation succeeds (R9 off-by-one boundary guard).

**Objection — D19 retryCount shared budget has no T12 compensating test (TLA+ only: recommended):**
The D19 abstraction gap had no integration-level boundary test confirming the two views remain consistent across success boundaries. **Resolution:** Step 12 Vitest integration test 5 added, covering a two-stage scenario where retryCount accumulates in stage 1, resets correctly at GraphRetryNodeSuccess, and starts fresh in stage 2. Detects budget-leak regressions.

### Debate Objection Resolutions (Round 3 — Required Changes R1–R10)

**R1 — graphState='force_dedup' never directly asserted (required):**
`force_dedup` was covered only inferentially: Step 6 test 4 asserted the outcome (graphState="collecting" after GraphAfterForceDedup) but never directly observed `graphState="force_dedup"` as a transient state. An implementation that skips the `force_dedup` intermediate state and transitions directly from `dedup_error` to `collecting` would pass test 4 while leaving this TLA+ state uncovered. **Resolution:** Step 6 test 11 added, using a synchronization point (awaited Promise or state-capture callback) to observe `graphState="force_dedup"` before `GraphAfterForceDedup` fires, then verifying the transition to `"collecting"`.

**R2 — D27 4-step hook-completion-after-halt has no implementation-plan test (required):**
D27 (Revision 20 extension) specified a canonical four-step interleaving sequence that integration tests must reproduce, but no test in the plan implemented that sequence. Without it, the D27 design choice (hook actions lack pipelineState guards) could be accidentally violated without any test catching it. **Resolution:** Step 11 test 10 added, reproducing the exact D27 four-step sequence: StartPipeline → HookInterceptEs (suspended) → ValidateRoleFail → HookRewrite-released. The test must be written RED before implementing hook-action independence from pipelineState.

**R3 — Pester Mock mechanism for HookRewrite stub in Steps 3/4 test 10 was unspecified (required):**
"Disable HookRewrite by mocking the rewrite function to throw or return immediately without output" left the Pester mechanism ambiguous — two engineers could write incompatible implementations (one using `Mock`, one using a manually-swapped function reference). **Resolution:** Steps 3 and 4 test 10 now specify `Mock Invoke-EsHookRewrite { }` / `Mock Invoke-RgHookRewrite { }` (Pester `Mock` cmdlet with empty body), `InModuleScope` guidance for module-private functions, `Should -Invoke` for invocation count verification, and `Context`-block scoping for mock cleanup.

**R4 — Step 11 test 9 negative assertion used open-ended pattern [ROUTING-HALT:...] (required):**
The original `NO line matching [ROUTING-HALT:...]` was a wildcard assertion that would fail to catch a future fourth routing halt code accidentally emitted during a hook failure. **Resolution:** Step 11 test 9 now enumerates all three routing halt codes by name in the negative assertion: `[ROUTING-HALT:INVALID-ROLE]`, `[ROUTING-HALT:MISSING-MAPPING]`, `[ROUTING-HALT:INVALID-MODEL]`. This closes the set and ensures any new routing halt code addition triggers a test update review.

**R5 — Ghost-edge error in Step 2 test 4 had no type or message specification (required):**
"throws a build error (NoGhostEdges, S21)" did not specify the error class or message format, making assertions implementation-dependent. **Resolution:** Step 2 test 4 now specifies `GraphBuildError` as the required error class (named subclass of `Error`, `instanceof`-discriminable) with message format `"NoGhostEdges: endpoint '<path>' not in graph"` naming the first missing endpoint.

**R6 — Step 6 tests 7–10 had no fail-first injection descriptions (required):**
Tests 7–10 in Step 6 were stated as invariant assertions with no description of how to write them RED before implementation. Without fail-first descriptions, a developer could write these tests after implementation (in which case the test was never actually RED and cannot prove the assertion is load-bearing). **Resolution:** Each of tests 7–10 in Step 6 now includes an explicit `Fail-first:` injection description specifying which stub or bug to introduce, which assertion will fail, and which implementation fix makes it pass.

**R7 — .tmp-write-success/rename-fail path had no distinct test in Step 8 (required):**
Test 3 in Step 8 simulates "a write failure (mock filesystem error)" but covers only the temp-write phase. D26 explicitly declared the rename phase as a distinct failure mode. An implementation that catches write errors but not rename errors would pass test 3. **Resolution:** Step 8 test 12 added, specifically mocking `fs.rename` to throw `EACCES` while the temp-file write succeeds — asserting `markdownState` stays stale, `CLAUDE.md.tmp` exists, and `CLAUDE.md` is unmodified.

**R8 — Step 12 Pester test 9 inspects file content without asserting file existence first (required):**
If `CLAUDE.md` is absent (e.g., implementation never created it), `Get-Content` would throw a "file not found" error that could be misread as a content-assertion failure, masking the root cause. **Resolution:** Two `Test-Path 'CLAUDE.md' | Should -Be $true` assertions added to Pester test 9: once before the epoch-1 content inspection, and once before the epoch-2 content inspection after GraphHaltCleanup.

**R9 — Step 12 Vitest test 1 did not assert the 3rd operation succeeds (required):**
The MaxGraphOps=3 test asserted the 4th operation is disabled but did not assert the 3rd succeeds, leaving an off-by-one gap: an implementation that silences operations at `graphOpsCount >= MaxGraphOps` (disabling the 3rd) would pass test 1's 4th-disabled assertion while silently rejecting the boundary operation. **Resolution:** Step 12 Vitest test 1 now explicitly asserts the 3rd add-operation succeeds (`graphOpsCount=3` accepted) before asserting the 4th is disabled.

**R10 — Step 6 test 3 retryCount assertion used "UNCHANGED" (required):**
"retryCount unchanged (D19 observable contract: BDD asserts retryCount=0 at dedup_error entry)" was internally contradictory — UNCHANGED means the budget value is preserved, but BDD's per-cycle observable shows retryCount=0. Any test asserting UNCHANGED would validate a broken implementation that does not reset the observable. **Resolution:** Step 6 test 3 now asserts `retryCount=0` per BDD per-cycle observable, with explanatory text clarifying that the internal shared budget is tracked separately and is not directly observable per D19. A RED-phase note explains that an implementation exposing the raw internal retryCount (which would be UNCHANGED) will fail this assertion.

### Recommended Improvements (Round 3)

**Rec1 — Expand Step 8 test 7 description:** Test 7 now specifies mock setup details (suspend mid-write, set pipelineState=halted, release) and explicitly asserts CLAUDE.md is not partially overwritten. The "most critical" label is explained: it is the only active state with a real filesystem operation in flight when halt fires.

**Rec2 — Add Given/When/Then to Step 8 test 11:** Test 11 now uses explicit Given/When/Then structure with named state values at each transition checkpoint.

**Rec3 — Label Step 9 tests as content-existence not behavioral:** The Step 9 test section now opens with an explicit note: "these are content-existence tests — they verify artifact completeness, not dynamic behavior."

**Rec4 — Replace 'throughout' in Step 11 test 7 with specific checkpoints:** "hookState='idle' throughout" replaced with three named checkpoints: after StartPipeline, after InvokeClaude, and at PipelineComplete — each with a specific observable signal.

**Rec5 — Specify timestamp injection in Step 12 Pester test 6:** Test 6 now specifies `Mock Get-Date { $script:TestClock++ }` monotonic counter injection to prevent flaky failures from OS clock resolution on rapid test execution.

**Rec6 — Re-label Steps 3/4 test 7 as integration-level per D3 ASSUME:** Tests 7 in Steps 3 and 4 now carry the `[INTEGRATION — D3 ASSUME]` prefix explaining the integration-level classification.

**Rec7 — Add T9 pre-condition note for agent role files:** Step 9 description now includes a Pre-condition block naming all six required role files and noting that the task dispatcher must verify their existence before dispatching T9.

**Rec8 — Specify [WARN] format string:** All `[WARN]` log entries throughout the plan now use standardized formats. See [WARN] Format Standard in Out-of-TLA+ Scope.

**Rec9 — Add malformed .psd1 test case to Step 1:** Test 6 added to Step 1, verifying `Import-PowerShellDataFile` throws a `ParseException` on a syntactically invalid `.psd1` (unclosed hashtable brace), with `AfterEach` cleanup.

---

### Out-of-TLA+ Scope (Declared Abstractions Requiring Integration Tests Only)

The following are outside TLA+ verification scope per ASSUME declarations and are covered by integration tests in Steps 10–12:

- **[WARN] Format Standard (Rec8):** All `[WARN]` log entries emitted by the implementation use the following standardized format strings. Tests that assert WARN output MUST match these exact formats:
  - `[WARN: force_dedup path=<dropped-path>]` — emitted to stdout when GraphForceDedup discards a pending node or edge (Step 6 test 4; Step 12 Pester test 8).
  - `[WARN: closeHookTimeout agent=<agent-index>]` — emitted to stdout when the close hook tsx process exceeds the timeout deadline (Step 10 test 4).
  - `[WARN: graphOpsCount=MaxGraphOps epoch-boundary enforced]` — emitted to stderr when an add-operation is silently disabled because graphOpsCount has reached MaxGraphOps (Step 12 Vitest test 1). Note: stdout vs. stderr distinction is intentional — force_dedup and closeHookTimeout warnings are graph-subsystem events (stdout); epoch-boundary enforcement is an operator-monitoring event (stderr).

- **D11/BDD closeHookTimeout** — tsx timeout/kill behavior (Step 10, test 4)
- **D11-PREOUTPUT pre-output crash [BACKLOG]** — hook script crashes before producing any stdout (hookRewritten=FALSE); distinct from post-rewrite failure where hookRewritten=TRUE and hookState=error. Tests 11 in Steps 3 and 4 establish the boundary behavior. The TLA+ spec has no ASSUME for this failure mode (D11 covers closeHookTimeout only); a formal `D11-PREOUTPUT` ASSUME is recommended for a future revision to document this gap in the spec.
- **D12 EpochRelativeFreshness** — markdownState="current" does not encode which epoch was written; file-existence check + file-content inspection required (Step 12, Pester test 9 — D12 Revision 20 compensating-test obligation)
- **D18 CrashFreeExecution** — CLAUDE.md persistence across restart (Step 12, test 7)
- **D20-DESIGN silent MaxGraphOps** — when `graphOpsCount` reaches `MaxGraphOps`, additional add-operations are silently disabled with respect to the agent (no `dedup_error`, no retry cycle, no agent notification). This silence is a deliberate design decision: the graph subsystem self-manages the epoch boundary without burdening agents with capacity feedback. Operators who need to detect this boundary MUST monitor stderr for `[WARN: graphOpsCount=MaxGraphOps epoch-boundary enforced]` log entries; they MUST NOT wait for an agent notification that will never arrive. Step 12 Vitest integration test 1 asserts: the 3rd operation succeeds (off-by-one guard), the 4th is silently disabled (no agent notification event), and the operator log entry appears on stderr.
- **D21 HookInterceptFairness** — liveness audit log assertion (Step 11, test 8; Step 12, test 5)
- **D23 InvalidModelStrings** — "gpt-4" halt path emits `[ROUTING-HALT:INVALID-MODEL <model>]` (Step 5, test 7; Step 11 test 9 closed-set negative assertion)
- **D24 NullInputRole** — missing `$Role` halt path (Step 5 — PowerShell `[Parameter(Mandatory)]` enforces this)
- **D26 Inter-agent concurrent write race** — two tsx processes colliding (Step 12, integration test 4); rename-failure distinct test (Step 8, test 12 — D26 production reliability gap)
- **D27 HookActionsCompleteAfterHalt** — canonical 4-step interleaving test (Step 11, test 10 — D27 Revision 20 compensating-test obligation)
- **D28 HookEvaluationOrder** — sequential delegation chain (Step 7, tests 3–5)
- **D29 IdentityOverride** — identity override code path (Step 5, test 3)
- **D30 DedupErrorNotificationPayload** — payload content delivery (Step 6, test 1)
- **D31 MaxAgents multi-epoch** — S25/S30/S31/L4/L5 beyond TLC scope (Step 12, tests 2–4); TokenSaving-MultiAgent.cfg TLC-verified force-dedup cross-epoch path (Step 12, Pester test 8)
- **D33 CommandTokenRewrite** — actual token replacement semantics (Steps 3, 4 hook script tests)
- **D38 FindCmds/GrepCmds enumeration** — full alias set coverage (Steps 3, 4, tests 1–2)
- **Halt signal format** — four structured stderr prefix codes discriminate halt paths: `[ROUTING-HALT:INVALID-ROLE <role>]` (ValidateRoleFail), `[ROUTING-HALT:MISSING-MAPPING <role>]` (MappingLookupFail), `[ROUTING-HALT:INVALID-MODEL <model>]` (D23 invalid model string), `[HOOK-FAIL:<hookKind>]` (post-rewrite hook failure; does NOT halt pipeline per S17). Tests in Step 5 (tests 10–11) and Step 11 (test 9, closed-set assertion) verify correct emission and discrimination.

---

## Execution Tiers

### Tier 1: Foundation — no dependencies

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Model routing config data file |
| T2 | Step 2 | TypeScript graph base wrapper |
| T3 | Step 3 | es-hook.ps1 (file-search rewriter) |
| T4 | Step 4 | rg-hook.ps1 (text-search rewriter) |

### Tier 2: Core logic — depends on Tier 1

| Task ID | Step | Title |
|---------|------|-------|
| T5 | Step 5 | Invoke-Claude with `$Role`/`$Model` parameters |
| T6 | Step 6 | Graph dedup and retry state machine |
| T9 | Step 9 | Agent system prompt instructions |

### Tier 3: Integration wiring — depends on Tier 2

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 7 | Hook registration in `.claude/settings.json` |
| T8 | Step 8 | Graph write engine (markdown writer + lifecycle) |

### Tier 4: Close hook — depends on Tier 3

| Task ID | Step | Title |
|---------|------|-------|
| T10 | Step 10 | Close hook PowerShell script |

### Tier 5: Pipeline wiring — depends on Tier 4

| Task ID | Step | Title |
|---------|------|-------|
| T11 | Step 11 | Pipeline wiring — integrate all subsystems |

### Tier 6: E2E completeness — depends on all

| Task ID | Step | Title |
|---------|------|-------|
| T12 | Step 12 | E2E integration tests and completeness verification |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Model routing config data file | 1 | `powershell-writer` | `pester-writer` | None | `.psd1` is a PowerShell Data File; Pester validates structure, contents, and malformed-file rejection (test 6) |
| T2 | TypeScript graph base wrapper | 1 | `typescript-writer` | `vitest-writer` | None | TypeScript `data-structure-typed` wrapper with `GraphBuildError` typed errors; Vitest unit tests including ghost-edge error type assertion (test 4) |
| T3 | es-hook.ps1 | 1 | `powershell-writer` | `pester-writer` | None | PreToolUse hook is a PowerShell script; Pester tests include L14 failing-first via `Mock Invoke-EsHookRewrite { }` (test 10) and D11-PREOUTPUT (test 11) |
| T4 | rg-hook.ps1 | 1 | `powershell-writer` | `pester-writer` | None | Symmetric with T3; `Mock Invoke-RgHookRewrite { }` for L14 failing-first (test 10) and D11-PREOUTPUT (test 11) |
| T5 | Invoke-Claude with `$Role`/`$Model` | 2 | `powershell-writer` | `pester-writer` | T1 | Modifies existing PowerShell utility; four halt signal codes `[ROUTING-HALT:...]` and `[ROUTING-HALT:INVALID-MODEL]` specified and tested (tests 10–11) |
| T6 | Graph dedup/retry state machine | 2 | `typescript-writer` | `vitest-writer` | T2 | TypeScript state machine; includes force_dedup transient state direct assertion (test 11) and fail-first injection descriptions (tests 7–10) |
| T9 | Agent system prompt instructions | 2 | `agent-writer` | `pester-writer` | T2 | Claude Code AGENT.md / system prompt artifacts; Pester verifies content-existence (not behavior); pre-condition: all six role files must exist |
| T7 | Hook registration in settings.json | 3 | `powershell-writer` | `pester-writer` | T3, T4 | Settings JSON modification; hook script paths must exist first |
| T8 | Graph write engine | 3 | `typescript-writer` | `vitest-writer` | T6 | TypeScript markdown formatter and atomic write lifecycle; includes rename-fail distinct test (test 12) and expanded halt-during-write test (test 7) |
| T10 | Close hook PowerShell script | 4 | `powershell-writer` | `pester-writer` | T8 | Orchestrates tsx invocation; `[WARN: closeHookTimeout agent=<n>]` format enforced in test 4 |
| T11 | Pipeline wiring | 5 | `powershell-writer` | `pester-writer` | T5, T10 | Wires all call sites; closed-set halt code discrimination (test 9: all three ROUTING-HALT codes named); D27 4-step interleaving (test 10) |
| T12 | E2E integration tests | 6 | `powershell-writer` | `pester-writer` | T5, T7, T11 | End-to-end verification; D20-DESIGN 3rd-op-success boundary (Vitest test 1); timestamp injection for sequencing (Pester test 6); file-existence guards in Pester test 9 |
