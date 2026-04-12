# Implementation Plan: Parallel Debates

> **Revision 2** — Addresses 8 Priority-1 debate amendments, atomic merge constraint,
> TLA+ fairness gap, and artifact versioning scope note.

## Source Artifacts

| Artifact | Path |
|----------|------|
| Requirements Briefing | `docs/parallel-debates/elicitor.md` |
| BDD Scenarios | `docs/parallel-debates/bdd.feature` |
| TLA+ Specification | `docs/parallel-debates/tla/ParallelDebates.tla` |

## Amendments Applied

| # | Amendment | Resolution |
|---|-----------|------------|
| 1 | Fix Resume-Pipeline marker format | Step 1 defines `STAGE_COMPLETE:<N>:<feature>` as shared constant `$StageCompletePattern`; Step 9 rewrites `Resume-Pipeline` regex to match |
| 2 | Assign Stage 1 marker ownership | Step 1 includes sub-task to update `1-elicitor.ps1` to emit `STAGE_COMPLETE:1:<feature>` |
| 3 | Fix T4 dependency contradiction | Step 4 has no dependencies; T4 moved to Tier 1 |
| 4 | Decompose Step 10 into 3 focused sub-steps | Old Step 10 split into Step 10 (file creation), Step 11 (vibe.ps1 rewiring + inter-stage validation), Step 12 (delete old files) |
| 5 | ConsensusRevision failure recovery path | Step 6 and Step 7 add explicit tests: failure terminates without `STAGE_COMPLETE:3`, successful revision preserved but stage fails, no rollback of successful writer |
| 6 | unified-debate.md on max-rounds path | Step 6 adds explicit test that `unified-debate.md` is written on max-rounds exit, matching TLA+ `MaxRoundsFinalize` which produces `unified_debate` artifact |
| 7 | PowerShell job scope isolation | Step 2 specifies `-ArgumentList` mechanism for passing dependencies into job scriptblocks; tests verify isolated scope |
| 8 | Write-PipelineLog backward compatibility | Step 1 adds `-Color` as no-op parameter (accepted, ignored with deprecation warning) AND updates all known callers in the same step |
| — | Tiers 3-4 atomic merge | Noted in Execution Tiers: Tiers 2-3 develop in worktrees, atomic merge before Tier 4 wiring |
| — | WF_vars(RoundFinish) fairness gap | Noted in State Coverage Audit; TLA+ spec should add `WF_vars(RoundFinish)` — does not affect implementation plan |
| — | Artifact versioning within stage 3 | Noted in State Coverage Audit as intentionally unmodeled; revisions overwrite in-place per BDD Item 4 line 310-315 |

---

## TLA+ State Coverage Matrix

### States

- **pipelineStage**: 0 (not started), 1 (elicitor), 2 (parallel-writers), 3 (unified-debate), 4 (post-debate), 5 (impl-writer), 6 (impl-debate), 7 (coding), 8 (done/terminal)
- **stageResult[1..7]**: `none`, `running`, `success`, `fail`
- **writerState[Writers]**: `idle`, `running`, `succeeded`, `failed`
- **artifacts**: `elicitor`, `bdd_feature`, `tla_spec`, `unified_debate`, `fixture_json`, `impl_plan_md`, `impl_plan_json`, `impl_debate`
- **debateRound**: 0..MaxDebateRounds (0 = not in debate, 1..10 = active round)
- **debateVerdict**: `none`, `partial_consensus`, `consensus_reached`, `max_rounds`
- **objTargets**: subset of `{"bdd", "tla"}` — writers with objections this round
- **revisionState[Writers]**: `idle`, `running`, `succeeded`, `failed`
- **consensusRevState[Writers]**: `idle`, `running`, `succeeded`, `failed`
- **entryMode**: `fresh`, `resume`
- **resumeStage**: 0 (fresh) or 1..7 (resume target)
- **completionMarkers**: set of stage numbers 1..7 that have written `STAGE_COMPLETE`
- **pipelineFailed**: `TRUE` / `FALSE`

### Transitions

- **Stage1Succeed** — Stage 1 completes, produces `elicitor` artifact, writes marker, advances to stage 2
- **Stage1Fail** — Stage 1 fails, pipeline terminates
- **Stage2Begin** — Validates artifacts for stage 2, dispatches both writers to `running`
- **WriterSucceed(w)** — Writer `w` completes, adds its artifact to disk
- **WriterFail(w)** — Writer `w` fails, no artifact produced
- **Stage2Finish** — Both writers done; if both succeeded -> stage 3, else -> terminate
- **DebateBegin** — Validates stage 3 artifacts, starts round 1
- **ModeratorVerdict** — Moderator renders `consensus_reached`, `partial_consensus`, or `max_rounds`
- **DispatchRevisions** — Routes revision jobs to writers in `objTargets`
- **RevisionSucceed(w)** — Revision for writer `w` succeeds
- **RevisionFail(w)** — Revision for writer `w` fails
- **RoundFinish** — All dispatched revisions done; if any failed -> terminate, else -> next round
- **ConsensusRevisionDispatch** — At consensus, dispatches final recommendations to ALL writers
- **ConsensusRevSucceed(w)** — Final consensus revision for writer `w` succeeds
- **ConsensusRevFail(w)** — Final consensus revision for writer `w` fails
- **ConsensusFinalize** — Both consensus revisions done; if any failed -> terminate, else -> stage 4
- **MaxRoundsFinalize** — Max rounds hit, produces `unified_debate`, advances to stage 4
- **Stage4Succeed / Stage4Fail** — Post-debate stage success/failure
- **Stage5Succeed / Stage5Fail** — Implementation writer success/failure
- **Stage6Succeed / Stage6Fail** — Implementation debate success/failure
- **Stage7Succeed / Stage7Fail** — Coding stage success/failure
- **Done** — Terminal stuttering step at pipelineStage = 8

### Safety Invariants

- **TypeOK** — All variables remain within their declared domains
- **S1: WritersIndependent** — During stage 2, a running writer cannot observe the other writer's output artifact
- **S2: FailureIsolation** — One writer failing does not kill the other; failed writer does not force co-worker to terminal state
- **S3: ConsensusRequiresBoth** — `consensus_reached` only when `objTargets = {}`; no partial graduation
- **S4: ArtifactPreconditions** — Stage N only starts if all cumulative prior-stage artifacts exist
- **S5: DebateRoundBound** — `debateRound` never exceeds MaxDebateRounds
- **S6: MarkersOnlyForSuccess** — Completion markers are written only for stages that succeeded
- **S7: StageOrdering** — Stages execute in order; no stage runs before its predecessor completes
- **S8: EntryModeConsistent** — Resume mode implies a valid resumeStage in 1..7
- **S9: Stage2SuccessImpliesArtifacts** — When stage 2 succeeds, both `bdd_feature` and `tla_spec` are in artifacts
- **S10: RevisionRoutingCorrect** — Only writers in `objTargets` receive revision instructions
- **S11: ArtifactPreservation** — Artifacts once produced are never removed (monotonically non-decreasing)
- **S12: ConsensusRevisionTargetsAll** — Consensus revision dispatches to ALL writers, not a subset
- **S13: MaxRoundsBoundaryStrict** — At `debateRound = MaxDebateRounds`, `partial_consensus` is impossible

### Liveness Properties

- **L1: PipelineTerminates** — Pipeline eventually reaches `pipelineStage = 8`
- **L2: Stage2Terminates** — If both writers are running, they eventually finish
- **L3: DebateTerminates** — Active debate eventually reaches success or fail
- **L4: ConsensusRevisionTerminates** — Dispatched consensus revisions eventually complete

---

## Implementation Steps

### Step 1: Consolidate Write-PipelineLog with Mutex and Stage 1 Marker

**Files:**
- `utils/pipeline-log.ps1` (modify — rewrite as single authoritative definition)
- `utils/config.ps1` (modify — remove Write-PipelineLog definition)
- `stages/1-elicitor.ps1` (modify — emit `STAGE_COMPLETE:1:<feature>` on success)

**Description:**
BDD Item 13 requires exactly one `Write-PipelineLog` definition across the codebase. The current codebase has two competing definitions: one in `config.ps1` (with `-Color` parameter, using `$global:PipelineLogFile`) and one in `pipeline-log.ps1` (with `-Root` parameter). This step consolidates into a single definition in `pipeline-log.ps1` that:

1. Accepts `-Message` and `-Root` as primary parameters.
2. Accepts `-Color` as a **no-op parameter** for backward compatibility — the parameter is bound but ignored, and a one-time deprecation warning is emitted to the console (not to the log file). **(Amendment 8)**
3. Uses a named mutex (`Global\VibePipelineLog`) for atomic writes so parallel jobs do not corrupt `pipeline.log`.
4. Defines a shared constant `$StageCompletePattern = 'STAGE_COMPLETE:(\d+):(.+)'` that both the log writer and `Resume-Pipeline` can reference. **(Amendment 1)**
5. Updates all existing callers that pass `-Color` to drop the parameter (belt-and-suspenders: callers are updated AND the parameter is accepted as no-op). **(Amendment 8)**

Additionally, `stages/1-elicitor.ps1` is updated to call `Write-PipelineLog -Message "STAGE_COMPLETE:1:$featureName" -Root $root` after successful elicitor completion. Currently Stage 1 emits no marker. **(Amendment 2)**

**Dependencies:** None

**Test (write first):**
- `tests/pipeline-log.Tests.ps1` — Test that `Write-PipelineLog -Message "STAGE_COMPLETE:2:auth-flow" -Root $testRoot` appends exactly that line (with timestamp prefix) to `pipeline.log` under `$testRoot`. Test that concurrent calls from parallel runspaces do not produce interleaved characters (spawn 10 runspaces writing simultaneously, verify each line is intact). Test that the function is defined in only one file (`pipeline-log.ps1`). Test that `-Color 'Red'` is accepted without error (no-op). Test that `$StageCompletePattern` is exported and matches `STAGE_COMPLETE:3:auth-flow` capturing group 1 = `3`, group 2 = `auth-flow`. Test that `config.ps1` does NOT define `Write-PipelineLog`.
- `tests/1-elicitor.Tests.ps1` (modify) — Test that after `Invoke-Elicitor` succeeds, `pipeline.log` contains `STAGE_COMPLETE:1:<feature>`. Test that if `Invoke-Elicitor` fails, no `STAGE_COMPLETE:1` marker is written. **(Amendment 2)**

**TLA+ Coverage:**
- State: `completionMarkers` — the log write mechanism for stage completion markers
- Transition: Stage1Succeed — Stage 1 now writes its own marker **(Amendment 2)**
- Invariant: S6 (MarkersOnlyForSuccess) — markers are written atomically, only on success
- Invariant: S11 (ArtifactPreservation) — log entries, once written, are preserved
- BDD Item 13 (out of TLA+ scope — implementation concern)

---

### Step 2: Invoke-Parallel Utility with Scope Isolation

**Files:**
- `utils/invoke-parallel.ps1` (create)

**Description:**
Creates the reusable `Invoke-Parallel` function that dispatches multiple scriptblocks as PowerShell jobs and collects keyed results. Each job returns a typed result object with `.Success`, `.Output`, and `.Error` fields. The function waits for ALL jobs to complete (failure isolation — one failing does not kill the other). Supports an optional `-TimeoutSeconds` parameter; jobs exceeding the timeout are terminated with an error result.

**PowerShell job scope isolation (Amendment 7):** Scriptblocks execute in separate PowerShell runspaces with no access to the caller's variables or functions. Dependencies are passed explicitly via `-ArgumentList` on each job definition. The function signature accepts a hashtable of `@{ Name = @{ Script = [scriptblock]; Args = @(...) } }` entries. Each scriptblock receives its `Args` as `$args[0]`, `$args[1]`, etc. Functions needed inside the job (e.g., `Write-PipelineLog`, `Invoke-Claude`) must be passed as script text in Args and dot-sourced inside the scriptblock, OR the scriptblock must dot-source the utility file by path. The recommended pattern is: pass the `$Root` path as an argument, and dot-source `"$Root/utils/pipeline-log.ps1"` inside the scriptblock. Tests verify that jobs cannot access caller-scope variables.

**Dependencies:** None

**Test (write first):**
- `tests/invoke-parallel.Tests.ps1` — Test two jobs both succeed: result hashtable has keys `"alpha"` and `"beta"`, both `.Success` = `$true`, `.Output` contains job output. Test one job fails: `$results["alpha"].Success` = `$false`, `.Error` = error message, `.Output` = `$null`; `$results["beta"].Success` = `$true`. Test both fail: both `.Success` = `$false` with respective `.Error` values. Test results are keyed by caller-provided names. Test timeout: job exceeding timeout is terminated, `.Success` = `$false`, `.Error` contains `"timed out"`. Test that a failing job does not terminate the other (failure isolation). **Test scope isolation (Amendment 7):** define `$outerVar = "secret"` in the caller scope, verify that a job scriptblock accessing `$outerVar` gets `$null` (not `"secret"`). Test that `-ArgumentList` values are received correctly inside the job scriptblock as `$args`.

**TLA+ Coverage:**
- Transition: Stage2Begin (parallel dispatch), WriterSucceed/WriterFail (per-job completion)
- Invariant: S2 (FailureIsolation) — one job failing does not kill the other
- Invariant: S1 (WritersIndependent) — jobs run in isolation with no shared state
- BDD Item 2 (out of TLA+ scope — API shape, timeout semantics)

---

### Step 3: Unified Debate Moderator Agent Prompt

**Files:**
- `agents/unified-debate-moderator.md` (create)

**Description:**
Creates the agent prompt for the unified debate moderator. The moderator orchestrates expert opinions across both BDD and TLA+ documents simultaneously. It does NOT evaluate documents directly — it determines consensus based on expert feedback. It draws experts from the existing `agents/experts/` directory. Its JSON output schema includes `result` (CONSENSUS_REACHED | PARTIAL_CONSENSUS), `objections` array with per-objection `target` field ("bdd" | "tla"), `experts` array, `recommendation` object with `bdd` and `tla` keys, and `sessionFile` field.

**Dependencies:** None

**Test (write first):**
- `tests/unified-debate-moderator.Tests.ps1` — Test that `agents/unified-debate-moderator.md` exists. Test that the prompt references the experts directory. Test that the prompt defines the expected JSON schema fields. Test that the prompt explicitly states the moderator does not evaluate documents directly.

**TLA+ Coverage:**
- Transition: ModeratorVerdict — the moderator renders the verdict
- Invariant: S3 (ConsensusRequiresBoth) — consensus requires both documents approved
- Invariant: S13 (MaxRoundsBoundaryStrict) — prompt instructs moderator behavior at max rounds
- BDD Items 5, 11 (out of TLA+ scope — schema and prompt engineering)

---

### Step 4: Resolve-PipelineState for 7-Stage Cumulative Validation

**Files:**
- `utils/resolve-pipeline-state.ps1` (create — extract from vibe.ps1 inline stub)
- `vibe.ps1` (modify — remove inline stub, dot-source new file)

**Description:**
Extracts `Resolve-PipelineState` from the inline stub in `vibe.ps1` into its own utility file and rewrites it for the new 7-stage pipeline with cumulative artifact validation. Each stage validates ALL artifacts from ALL prior stages (not just the immediately preceding stage). Stage 2 requires `elicitor.md`. Stage 3 adds `bdd.feature` and a `.tla` file. Stage 4 adds `unified-debate.md`. Stage 5 adds `fixture.json`. Stage 6 adds `implementation-plan.md` and `.json`. Stage 7 adds `implementation-debate.md`. Returns a state object with paths to all validated artifacts.

**Dependencies:** None **(Amendment 3 — spurious T1 dependency removed; Resolve-PipelineState does not depend on Write-PipelineLog)**

**Test (write first):**
- `tests/resolve-pipeline-state.Tests.ps1` — For each stage 2-7: test that validation passes when all required cumulative artifacts exist and the returned state object contains the expected path keys. Test that validation throws when any single required artifact is missing (one test per missing artifact per stage). Test cumulative behavior: stage 3 fails if elicitor.md is missing even if bdd.feature and .tla exist. Test stage 4 fails if unified-debate.md is missing. Test stage 5 fails if fixture.json or unified-debate.md is missing.

**TLA+ Coverage:**
- State: `artifacts` set — maps to file-system artifact checks
- Operator: `RequiredArtifacts(stage)`, `ArtifactsValid(stage)` — direct mapping to cumulative validation
- Invariant: S4 (ArtifactPreconditions) — stage N only starts if all prior artifacts exist
- Invariant: S7 (StageOrdering) — enforced structurally by requiring prior outputs

---

### Step 5: Stage 2 — Parallel Writers

**Files:**
- `stages/2-parallel-writers.ps1` (create)

**Description:**
Creates the new stage 2 that dispatches BDD and TLA+ writers concurrently using `Invoke-Parallel`. Both writers receive only the elicitor briefing (`docs/<feature>/elicitor.md`) as input — neither receives the other writer's output. Each writer's scriptblock receives the elicitor path and `$Root` via `-ArgumentList` and dot-sources required utilities inside the job scope **(Amendment 7)**. On success of both writers, writes `STAGE_COMPLETE:2:<feature>` to the pipeline log and advances to stage 3. If either writer fails, the stage waits for the other to complete (failure isolation), preserves any successful output on disk, and fails with an error reporting which writer(s) failed. BDD writer produces `docs/<feature>/bdd.feature`; TLA+ writer produces files under `docs/<feature>/tla/` with TLC verification.

**Dependencies:** Step 1 (Write-PipelineLog), Step 2 (Invoke-Parallel), Step 4 (Resolve-PipelineState)

**Test (write first):**
- `tests/2-parallel-writers.Tests.ps1` — Test that both writers receive `elicitor.md` as sole input (mock Invoke-Claude, verify prompt content). Test that neither writer receives the other's output. Test that `Invoke-Parallel` is called with two jobs: `"bdd"` and `"tla"`. Test success path: both artifacts exist on disk, `STAGE_COMPLETE:2` marker written. Test one-fail path: surviving writer's output preserved, stage fails with error naming the failed writer. Test both-fail path: stage fails reporting both failures. Test BDD writer produces valid Gherkin file. Test TLA+ writer's process includes TLC verification.

**TLA+ Coverage:**
- Transition: Stage2Begin, WriterSucceed(w), WriterFail(w), Stage2Finish
- State: `writerState` transitions idle -> running -> succeeded/failed
- State: `artifacts` += `bdd_feature`, `tla_spec` on writer success
- State: `completionMarkers` += 2 on stage success
- Invariant: S1 (WritersIndependent) — writers don't see each other's output
- Invariant: S2 (FailureIsolation) — one writer failing doesn't kill the other
- Invariant: S6 (MarkersOnlyForSuccess) — marker only on both-succeed
- Invariant: S9 (Stage2SuccessImpliesArtifacts) — both artifacts present when stage 2 succeeds

---

### Step 6: Invoke-UnifiedDebateLoop

**Files:**
- `utils/unified-debate-loop.ps1` (create)

**Description:**
Creates `Invoke-UnifiedDebateLoop`, the function managing the two-writer unified debate. It: (1) invokes the unified debate moderator with both documents, (2) parses the moderator's verdict and objection targets, (3) groups objections by `target` field and dispatches revisions only to targeted writers (using `Invoke-Parallel` when both have objections, single dispatch when only one does), (4) at `CONSENSUS_REACHED`, dispatches per-writer final recommendations to BOTH writers in parallel, (5) at `MAX_ROUNDS`, exits with current document versions **and writes unified-debate.md before returning (Amendment 6)**. Returns a structured result: `{ Result, RoundsCompleted, FinalGherkinPath, FinalTlaDir, SessionFile, UnresolvedObjections }`. Writes the full debate transcript to `unified-debate.md` on **all exit paths** (consensus, max-rounds, and failure).

**Consensus revision failure behavior (Amendment 5):** If one consensus revision fails and the other succeeds, the function: (a) does NOT write `STAGE_COMPLETE:3`, (b) preserves the successful writer's revision on disk (no rollback — the successful revision's file changes remain), (c) returns with `.Result = "CONSENSUS_REVISION_FAILED"` and `.Error` describing which writer failed. The rationale: rolling back the successful revision would discard valid work; the preserved revision is the best available version. Stage 3 then terminates the pipeline. This matches TLA+ `ConsensusFinalize` lines 368-373: on failure, `stageResult[3] = "fail"`, `pipelineFailed = TRUE`, artifacts and completionMarkers unchanged.

**Artifact versioning within stage 3 (intentionally unmodeled):** During the debate loop, revisions overwrite artifacts in-place. There is no versioning of intermediate artifacts within stage 3. The TLA+ spec models artifacts as a monotonic set (produced once); intra-stage overwrite is an implementation detail outside the spec's state space. This matches BDD Item 4 lines 310-315 which describe "latest successful" revisions persisting on disk.

TLC verification runs as part of TLA+ writer revisions (not as a separate hook).

**Dependencies:** Step 2 (Invoke-Parallel), Step 3 (unified debate moderator prompt)

**Test (write first):**
- `tests/unified-debate-loop.Tests.ps1`:
  - **Consensus path:** moderator returns `CONSENSUS_REACHED` with empty objections -> dispatches per-writer recommendations to both writers -> returns `.Result = "CONSENSUS_REACHED"`, `.RoundsCompleted`, `.UnresolvedObjections = @()`. Verify `unified-debate.md` is written.
  - **Partial consensus:** moderator returns objections for one writer -> only that writer gets revision instructions -> next round starts.
  - **Both-writer objections:** both writers receive parallel revisions via `Invoke-Parallel`.
  - **Max rounds (10):** loop exits with `.Result = "MAX_ROUNDS_REACHED"`, unresolved objections listed. **Verify `unified-debate.md` is produced (Amendment 6).** Verify `unified-debate.md` includes all 10 rounds of debate history.
  - **Revision failure (partial consensus):** any revision failing causes stage exit with error. Successful revision from same round preserved on disk.
  - **Consensus revision failure (Amendment 5):** mock one consensus revision failing, other succeeding. Verify: `.Result = "CONSENSUS_REVISION_FAILED"`, no `STAGE_COMPLETE:3` marker, successful writer's revision preserved on disk (not rolled back), `.Error` names the failed writer. Test both consensus revisions failing: same behavior, `.Error` names both.
  - **BDD-only objections** skip TLA+ writer. **TLA-only objections** skip BDD writer.
  - **unified-debate.md** captures all rounds on all exit paths.
  - **S12 test:** consensus revision dispatches to ALL writers.
  - **S13 test:** at round 10, only consensus or max_rounds verdict (never partial_consensus).
  - **Return contract** matches specified shape.

**TLA+ Coverage:**
- Transition: DebateBegin, ModeratorVerdict, DispatchRevisions, RevisionSucceed/Fail, RoundFinish
- Transition: ConsensusRevisionDispatch, ConsensusRevSucceed/Fail, ConsensusFinalize, MaxRoundsFinalize
- State: `debateRound` 0->1->...->10, `debateVerdict` transitions, `objTargets`, `revisionState`, `consensusRevState`
- Invariant: S3 (ConsensusRequiresBoth) — consensus only with empty objTargets
- Invariant: S5 (DebateRoundBound) — round never exceeds 10
- Invariant: S10 (RevisionRoutingCorrect) — only targeted writers get revisions
- Invariant: S12 (ConsensusRevisionTargetsAll) — both writers get consensus revisions
- Invariant: S13 (MaxRoundsBoundaryStrict) — no partial_consensus at round 10

---

### Step 7: Stage 3 — Unified Debate

**Files:**
- `stages/3-unified-debate.ps1` (create)

**Description:**
Creates the new stage 3 script that wires `Invoke-UnifiedDebateLoop` into the pipeline. Validates stage 3 input artifacts via `Resolve-PipelineState` (elicitor.md, bdd.feature, .tla file). Passes both documents and the moderator prompt path (`agents/unified-debate-moderator.md`) to `Invoke-UnifiedDebateLoop`. On completion with success (consensus or max-rounds), writes `STAGE_COMPLETE:3:<feature>` marker. On consensus revision failure, does NOT write the marker and terminates pipeline **(Amendment 5)**. On resume, stage 3 restarts from round 1 with a fresh 10-round budget (BDD Item 3: round counter is not persisted).

**Dependencies:** Step 4 (Resolve-PipelineState), Step 6 (Invoke-UnifiedDebateLoop), Step 3 (moderator prompt)

**Test (write first):**
- `tests/3-unified-debate.Tests.ps1`:
  - Test that the debate moderator file path points to `agents/unified-debate-moderator.md`.
  - Test that `Invoke-UnifiedDebateLoop` is called (not `Invoke-DebateLoop`).
  - Test that stage receives both bdd.feature and tla spec.
  - Test completion marker `STAGE_COMPLETE:3` is written on consensus success.
  - Test completion marker `STAGE_COMPLETE:3` is written on max-rounds exit.
  - **Test no `STAGE_COMPLETE:3` marker on consensus revision failure (Amendment 5).** Verify pipeline terminates with error.
  - Test that resume replays stage 3 entirely (round counter resets to 1).
  - Test that `unified-debate.md` is produced on all exit paths (consensus, max-rounds).

**TLA+ Coverage:**
- Transition: DebateBegin (stage entry with artifact validation)
- Transition: ConsensusFinalize (success path writes marker; failure path does not)
- Transition: MaxRoundsFinalize (writes marker and produces unified_debate artifact)
- State: `stageResult[3]` transitions none -> running -> success/fail
- State: `completionMarkers` += 3 on success only (S6)
- Invariant: S4 (ArtifactPreconditions) — validates cumulative artifacts before starting

---

### Step 8: Stage 4 — Post-Debate Artifacts

**Files:**
- `stages/4-post-debate.ps1` (create)

**Description:**
Creates the new stage 4 that generates post-debate artifacts. Reads the final `bdd.feature` and generates `fixtures/<feature>/bdd/fixture.json` using existing `ConvertFrom-Gherkin` and `Export-BddFixture` utilities. The fixture write is atomic (temp file + `Move-Item -Force`). Validates that `bdd.feature` exists and contains parseable Gherkin. Writes `STAGE_COMPLETE:4:<feature>` on success. This moves the fixture generation that was previously inline in `vibe.ps1` (after stage 3) into its own dedicated stage.

**Dependencies:** Step 4 (Resolve-PipelineState)

**Test (write first):**
- `tests/4-post-debate.Tests.ps1` — Test that fixture JSON is generated from bdd.feature. Test atomic write (temp file pattern). Test failure when bdd.feature is missing. Test failure when bdd.feature contains invalid Gherkin. Test that `STAGE_COMPLETE:4` marker is written on success. Test that stage 4 validates all cumulative artifacts (elicitor.md, bdd.feature, .tla file, unified-debate.md).

**TLA+ Coverage:**
- Transition: Stage4Succeed, Stage4Fail
- State: `artifacts` += `fixture_json` on success
- State: `stageResult[4]`, `completionMarkers` += 4
- Invariant: S4 (ArtifactPreconditions) — cumulative check before execution

---

### Step 9: Resume-Pipeline and vibe.ps1 Parameter Refactor

**Files:**
- `utils/resume.ps1` (modify — update for 7-stage, STAGE_COMPLETE markers, validation)
- `vibe.ps1` (modify — change param block, remove -Stage/-Feature, add -Resume switch)

**Description:**
Updates `Resume-Pipeline` to: (1) use `$StageCompletePattern` from `pipeline-log.ps1` to scan for `STAGE_COMPLETE:N:feature` markers instead of the current `"Stage $s complete"` literal string match **(Amendment 1)**, (2) work with 7-stage numbering (reject stage numbers > 7 as incompatible old format), (3) detect the most recent feature by scanning markers in reverse chronological order when multiple features exist in the log, (4) extract the feature name from the marker's capture group 2 (e.g., `STAGE_COMPLETE:3:auth-flow` -> feature = `auth-flow`) **(Amendment 1)**, (5) fail with clear errors when pipeline.log is missing, empty, or corrupted. Updates `vibe.ps1` param block to `param($Seed, [switch]$Resume)` — removes `-Stage` and `-Feature` parameters. `$Seed` and `-Resume` are mutually exclusive. Fresh run requires `$Seed`; `-Resume` calls `Resume-Pipeline` to auto-detect feature and stage.

**Dependencies:** Step 1 (Write-PipelineLog for marker format and `$StageCompletePattern`), Step 4 (Resolve-PipelineState)

**Test (write first):**
- `tests/resume.Tests.ps1` (modify):
  - Test `STAGE_COMPLETE:N:feature` marker parsing with 7-stage numbering using `$StageCompletePattern`.
  - Test feature name extraction from marker (capture group 2).
  - Test most-recent-feature detection when multiple features exist.
  - Test rejection of stage numbers > 7 (old 8-stage format).
  - Test error when pipeline.log is missing.
  - Test error when pipeline.log is empty.
  - Test error when pipeline.log is corrupted (garbled text).
- `tests/vibe.Tests.ps1` (modify):
  - Test that `$Seed` and `-Resume` together fails validation.
  - Test that no `-Stage` or `-Feature` parameters exist.
  - Test fresh run requires `$Seed`.
  - Test `-Resume` with no other args calls `Resume-Pipeline`.

**TLA+ Coverage:**
- State: `entryMode` = `fresh` | `resume`
- State: `resumeStage` — auto-detected from log
- Init operator — fresh (pipelineStage=1, empty artifacts) vs resume (artifacts pre-populated, stage=resumeStage)
- Invariant: S8 (EntryModeConsistent) — resume implies valid resumeStage
- Invariant: S7 (StageOrdering) — resume validates prior stages completed

---

### Step 10: Renumber Downstream Stages (Create Stages 5-7 Files)

**Files:**
- `stages/5-implementation-writer.ps1` (create — content from existing `6-implementation-writer.ps1`, renumbered)
- `stages/6-implementation-debate.ps1` (create — content from existing `7-implementation-debate.ps1`, renumbered)
- `stages/7-coding.ps1` (create — content from existing `8-coding.ps1`, renumbered)

**Description:**
**(Amendment 4, part 1 of 3: file creation.)** Creates the three renumbered downstream stage files. Old 6->5, old 7->6, old 8->7. Stage 5 (implementation-writer) is updated to read `unified-debate.md` instead of separate `bdd-debate.md`/`tla-debate.md`. Stage 6 (implementation-debate) uses existing `Invoke-DebateLoop` (not `Invoke-UnifiedDebateLoop`). Stage 7 is the existing coding stage renumbered. All three stages write `STAGE_COMPLETE:N:<feature>` markers on success.

This step creates the files but does NOT rewire `vibe.ps1` — that happens in Step 11.

**Dependencies:** Step 4 (Resolve-PipelineState — used by each stage for artifact validation)

**Test (write first):**
- `tests/stage-renumbering.Tests.ps1`:
  - Test that `stages/5-implementation-writer.ps1` exists and reads `unified-debate.md`.
  - Test that `stages/6-implementation-debate.ps1` exists and uses `Invoke-DebateLoop`.
  - Test that `stages/7-coding.ps1` exists.
  - Test that stages 5-7 each write `STAGE_COMPLETE:N` markers on success (mock execution, verify marker).
  - Test that stage 5 does NOT reference `bdd-debate.md` or `tla-debate.md`.

**TLA+ Coverage:**
- Transition: Stage5Succeed/Fail, Stage6Succeed/Fail, Stage7Succeed/Fail
- State: `stageResult[5..7]`, `completionMarkers` += 5,6,7
- State: `artifacts` += `impl_plan_md`, `impl_plan_json`, `impl_debate`

---

### Step 11: Rewire vibe.ps1 Stage Dispatch with Inter-Stage Validation

**Files:**
- `vibe.ps1` (modify — update stage dispatch to call all 7 stages in sequence, add inter-stage validation, update dot-source paths)

**Description:**
**(Amendment 4, part 2 of 3: vibe.ps1 rewiring and inter-stage validation.)** Updates `vibe.ps1` to dot-source all new stage scripts (2-parallel-writers, 3-unified-debate, 4-post-debate, 5-implementation-writer, 6-implementation-debate, 7-coding) and dispatch them in sequence. Removes the inline BDD fixture generation that was previously after old stage 3 (now handled by stage 4). Adds fresh-run inter-stage validation: `Resolve-PipelineState` runs before each stage (not just on resume) to catch missing artifacts early — if a stage completes but its expected outputs are missing (writer bug), the next stage fails immediately instead of passing garbage forward.

**Dependencies:** Step 5 (stage 2), Step 7 (stage 3), Step 8 (stage 4), Step 9 (resume/params), Step 10 (stages 5-7)

**Test (write first):**
- `tests/vibe-wiring.Tests.ps1`:
  - Test that `vibe.ps1` dot-sources all 7 stage scripts.
  - Test that no old stage scripts (2-bdd-writer, 3-bdd-debate, 4-tla-writer, 5-tla-debate, 8-coding) are referenced.
  - Test full sequential execution order: 1->2->3->4->5->6->7.
  - Test that every .ps1 in `stages/` is called by vibe.ps1 (no uncalled scripts).
  - **(Amendment 4, part 3: inter-stage validation)** Test that `Resolve-PipelineState` runs between stages on fresh runs. Mock stage 2 succeeding but not producing bdd.feature -> verify stage 3 fails with artifact error before executing.

**TLA+ Coverage:**
- Invariant: S7 (StageOrdering) — full pipeline order enforced
- Invariant: S4 (ArtifactPreconditions) — inter-stage validation before every stage
- Invariant: S11 (ArtifactPreservation) — validated at each stage boundary

---

### Step 12: Delete Old Stage Files and Update Test References

**Files:**
- `stages/2-bdd-writer.ps1` (delete)
- `stages/3-bdd-debate.ps1` (delete)
- `stages/4-tla-writer.ps1` (delete)
- `stages/5-tla-debate.ps1` (delete)
- `stages/6-implementation-writer.ps1` (delete — content moved to 5-implementation-writer.ps1)
- `stages/7-implementation-debate.ps1` (delete — content moved to 6-implementation-debate.ps1)
- `stages/8-coding.ps1` (delete — content moved to 7-coding.ps1)

**Description:**
**(Amendment 4, part 3 of 3: cleanup.)** Removes the four replaced sequential writer/debate stages and the three old-numbered downstream stages (whose content has been moved to new filenames in Step 10). Updates any remaining test files that reference old stage scripts. Ensures no dead imports or broken dot-source paths exist in the codebase.

**Dependencies:** Step 11 (new stages must be wired before deleting old ones)

**Test (write first):**
- `tests/deleted-stages.Tests.ps1` — Test that none of the 7 deleted stage files exist on disk. Test that no .ps1 file in the project contains dot-source references to the deleted filenames. Test that `vibe.ps1` does not reference any deleted stage.

**TLA+ Coverage:**
- BDD Item 10 (out of TLA+ scope — filesystem cleanup)

---

### Step 13: End-to-End Pipeline Integration Tests

**Files:**
- `tests/pipeline-e2e.Tests.ps1` (modify — update for 7-stage pipeline)

**Description:**
Updates the existing end-to-end test suite to verify the full 7-stage pipeline flow. Tests artifact handoff between stages: elicitor->parallel writers->unified debate->post-debate->implementation writer->implementation debate->coding. Tests resume at each stage boundary. Tests that fresh runs validate inter-stage artifacts before proceeding. Tests the complete liveness properties: pipeline terminates, stage 2 terminates, debate terminates, consensus revision terminates.

**Dependencies:** Step 11 (full wiring), Step 12 (old files deleted)

**Test (write first):**
- `tests/pipeline-e2e.Tests.ps1`:
  - Test elicitor output flows into parallel writers (both receive elicitor.md).
  - Test parallel writer output flows into unified debate (both files received).
  - Test unified debate output flows into post-debate (fixture generated from final bdd.feature).
  - Test post-debate output flows into implementation writer (fixture, unified-debate.md, both specs available).
  - Test resume at stage 3 loads bdd.feature and .tla from disk.
  - Test resume at stage 4 validates unified-debate.md.
  - Test resume at stage 5 validates fixture.json.
  - Test fresh run catches missing artifacts between stages (Resolve-PipelineState inter-stage validation).
  - Test full pipeline completes with all `STAGE_COMPLETE:1..7` markers.
  - **Test consensus revision failure does not write `STAGE_COMPLETE:3` (Amendment 5).**
  - **Test unified-debate.md exists after max-rounds exit (Amendment 6).**

**TLA+ Coverage:**
- Liveness: L1 (PipelineTerminates) — full pipeline reaches stage 8
- Liveness: L2 (Stage2Terminates) — both writers finish
- Liveness: L3 (DebateTerminates) — debate reaches success or fail
- Liveness: L4 (ConsensusRevisionTerminates) — consensus revisions complete
- Invariant: S11 (ArtifactPreservation) — artifacts produced by each stage survive to later stages
- Invariant: S7 (StageOrdering) — resume and fresh runs both respect stage order

---

## State Coverage Audit

### States — All Covered

| State | Covered By |
|-------|-----------|
| pipelineStage 0-8 | Steps 1, 5, 7, 8, 9, 10, 11, 13 |
| stageResult values | Steps 1, 5, 7, 8, 10, 13 |
| writerState | Steps 2, 5 |
| artifacts (all 8) | Steps 4, 5, 6, 7, 8, 10, 13 |
| debateRound 0..10 | Step 6 |
| debateVerdict (all 4) | Steps 3, 6, 7 |
| objTargets | Steps 3, 6 |
| revisionState | Step 6 |
| consensusRevState | Step 6 |
| entryMode | Step 9 |
| resumeStage | Step 9 |
| completionMarkers | Steps 1, 5, 7, 8, 10, 11 |
| pipelineFailed | Steps 5, 6, 7, 8, 10 |

### Transitions — All Covered

| Transition | Covered By |
|-----------|-----------|
| Stage1Succeed/Fail | Step 1 (marker emission), Step 11 (wiring) |
| Stage2Begin | Step 5 |
| WriterSucceed/Fail | Steps 2, 5 |
| Stage2Finish | Step 5 |
| DebateBegin | Steps 6, 7 |
| ModeratorVerdict | Steps 3, 6 |
| DispatchRevisions | Step 6 |
| RevisionSucceed/Fail | Step 6 |
| RoundFinish | Step 6 |
| ConsensusRevisionDispatch | Step 6 |
| ConsensusRevSucceed/Fail | Step 6 |
| ConsensusFinalize | Steps 6, 7 |
| MaxRoundsFinalize | Steps 6, 7 |
| Stage4-7 Succeed/Fail | Steps 8, 10 |
| Done | Step 13 |

### Safety Invariants — All Covered

| Invariant | Verified By |
|-----------|------------|
| TypeOK | All steps (structural) |
| S1: WritersIndependent | Steps 2, 5 tests |
| S2: FailureIsolation | Steps 2, 5 tests |
| S3: ConsensusRequiresBoth | Steps 3, 6 tests |
| S4: ArtifactPreconditions | Steps 4, 11 tests |
| S5: DebateRoundBound | Step 6 tests |
| S6: MarkersOnlyForSuccess | Steps 1, 5, 6, 7, 8, 10, 13 tests |
| S7: StageOrdering | Steps 9, 11, 13 tests |
| S8: EntryModeConsistent | Step 9 tests |
| S9: Stage2SuccessImpliesArtifacts | Step 5 tests |
| S10: RevisionRoutingCorrect | Step 6 tests |
| S11: ArtifactPreservation | Steps 11, 13 tests |
| S12: ConsensusRevisionTargetsAll | Step 6 tests |
| S13: MaxRoundsBoundaryStrict | Step 6 tests |

### Liveness Properties — All Covered

| Property | Verified By |
|----------|------------|
| L1: PipelineTerminates | Step 13 (E2E) |
| L2: Stage2Terminates | Steps 2, 5 (unit), Step 13 (E2E) |
| L3: DebateTerminates | Step 6 (unit), Step 13 (E2E) |
| L4: ConsensusRevisionTerminates | Step 6 (unit), Step 13 (E2E) |

All TLA+ states, transitions, safety invariants, and liveness properties are covered by the implementation plan.

### TLA+ Spec Gaps (not blocking implementation)

- **WF_vars(RoundFinish) missing from Fairness:** The TLA+ spec's `Fairness` definition (line 478-496) omits `WF_vars(RoundFinish)`. This means TLC cannot guarantee the `RoundFinish` transition fires when enabled, which could allow the model checker to stutter indefinitely after all revisions complete. The implementation is unaffected (PowerShell has no stuttering), but the spec should be patched before re-running TLC liveness checks. **Recommendation:** Add `WF_vars(RoundFinish)` to the `Fairness` conjunction after line 488.

- **Artifact versioning within stage 3 is intentionally unmodeled.** The TLA+ spec models `artifacts` as a monotonic set (once added, never removed). Within stage 3, revisions overwrite BDD and TLA+ files in-place — this is correct behavior per BDD Item 4 lines 310-315 ("latest successful" revision persists). The spec's `artifacts` set does not change during stage 3 revisions because the artifact names (`bdd_feature`, `tla_spec`) were added during stage 2 and remain present. Intra-stage content changes are outside the spec's abstraction.

---

## Execution Tiers

> **Atomic merge constraint:** Tiers 2 and 3 develop in parallel worktrees. All branches from
> Tiers 2-3 must be merged atomically before Tier 4 begins, because Tier 4 (vibe.ps1 rewiring)
> depends on all stage scripts existing simultaneously. Develop in worktrees; merge together.

### Tier 1: Foundation Utilities (no dependencies)

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Consolidate Write-PipelineLog + Stage 1 marker |
| T2 | Step 2 | Invoke-Parallel utility with scope isolation |
| T3 | Step 3 | Unified debate moderator agent prompt |
| T4 | Step 4 | Resolve-PipelineState for 7-stage validation |

### Tier 2: Core Domain Logic and Stage Scripts (depends on Tier 1)

| Task ID | Step | Title |
|---------|------|-------|
| T5 | Step 5 | Stage 2 — Parallel writers |
| T6 | Step 6 | Invoke-UnifiedDebateLoop |
| T7 | Step 8 | Stage 4 — Post-debate artifacts |
| T8 | Step 9 | Resume-Pipeline + vibe.ps1 params |
| T9 | Step 10 | Renumber downstream stages (create 5-7 files) |

### Tier 3: Stage 3 Script (depends on Tier 2 — specifically T6)

| Task ID | Step | Title |
|---------|------|-------|
| T10 | Step 7 | Stage 3 — Unified debate |

### Tier 4: Pipeline Wiring (atomic merge of Tiers 2-3 required first)

| Task ID | Step | Title |
|---------|------|-------|
| T11 | Step 11 | Rewire vibe.ps1 + inter-stage validation |

### Tier 5: Cleanup and Validation (depends on Tier 4)

| Task ID | Step | Title |
|---------|------|-------|
| T12 | Step 12 | Delete old stage files |
| T13 | Step 13 | E2E integration tests |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Write-PipelineLog + Stage 1 marker | 1 | powershell-writer | pester-writer | None | PowerShell utility with mutex + backward compat; Pester tests atomic writes and -Color no-op |
| T2 | Invoke-Parallel with scope isolation | 1 | powershell-writer | pester-writer | None | PowerShell job dispatch with -ArgumentList; Pester tests concurrency and scope isolation |
| T3 | Unified debate moderator prompt | 1 | agent-writer | pester-writer | None | Agent prompt artifact; Pester validates prompt structure |
| T4 | Resolve-PipelineState | 1 | powershell-writer | pester-writer | None | PowerShell validation logic; Pester tests per-stage cumulative checks |
| T5 | Stage 2 — Parallel writers | 2 | powershell-writer | pester-writer | T1, T2, T4 | Stage script using Invoke-Parallel; Pester tests isolation and marker |
| T6 | Invoke-UnifiedDebateLoop | 2 | powershell-writer | pester-writer | T2, T3 | Debate orchestration with consensus rev failure path; Pester tests all exit paths |
| T7 | Stage 4 — Post-debate | 2 | powershell-writer | pester-writer | T4 | Fixture generation; Pester tests parsing and atomic write |
| T8 | Resume + vibe.ps1 params | 2 | powershell-writer | pester-writer | T1, T4 | Entry point refactor with new marker regex; Pester tests param validation |
| T9 | Renumber stages 5-7 | 2 | powershell-writer | pester-writer | T4 | File creation with unified-debate.md input; Pester tests marker emission |
| T10 | Stage 3 — Unified debate | 3 | powershell-writer | pester-writer | T3, T4, T6 | Stage script wiring debate loop with consensus failure handling; Pester tests all paths |
| T11 | Rewire vibe.ps1 + validation | 4 | powershell-writer | pester-writer | T5, T7, T8, T9, T10 | Full pipeline assembly with inter-stage checks; Pester tests stage ordering |
| T12 | Delete old files | 5 | powershell-writer | pester-writer | T11 | Filesystem cleanup; Pester tests absence of old files |
| T13 | E2E integration tests | 5 | powershell-writer | pester-writer | T11, T12 | Full pipeline validation; Pester E2E test suite |
