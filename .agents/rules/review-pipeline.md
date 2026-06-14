---
description: reviewing pull requests, verifying code changes, or writing review comments
trigger: model_decision
---

# PR Review

Execute this pipeline when asked to review a pull request or diff. The main agent coordinates the
review using native Antigravity CLI tools, fanning out perspectives and tests to specialized subagents
defined at runtime (via `define_subagent` and `invoke_subagent`), and producing native artifacts
with `RequestFeedback` for approval gates.

Produces a single native artifact: `review-comments.md` — ready-to-post comment drafts backed by
failing tests with domain-language naming where applicable.

---

## Phase 1: Intake

Gather the diff and context. Fan out the reads in parallel using `invoke_subagent` with the
`research` subagent type:

- **Subagent A — Metadata & Diff:**
  - Accept any of the following:
    - A GitHub PR number or URL → use `gh pr view {number}` and `gh pr diff {number}`
    - A branch name → use `git diff master...{branch}`
    - No argument → use `git diff master...HEAD`
  - Read PR metadata (if GitHub PR) using:
    `gh pr view {number} --json title,body,author,baseRefName,headRefName,isDraft,additions,deletions,changedFiles`
- **Subagent B — CI Status:**
  - Run `gh pr checks {number}` to check CI status.

Collect the results via `send_message` when the subagents report back.

From the collected diff, determine:
- **Frontend files** (`.tsx`, `.ts`, `.css` under `src/` or `app/`): set `HAS_FRONTEND_CHANGES=true`
- **Worker/API files** (packages containing `wrangler.jsonc`, or path includes `worker`/`api`/`server`): set `HAS_WORKER_CHANGES=true`
- **Test files** (`*.test.ts`, `*.spec.ts`): note separately
- **Config/build files** (`*.json`, `*.toml`, `*.jsonc`, `wrangler.jsonc`): set `HAS_CONFIG_CHANGES=true`
- **Total lines changed**: additions + deletions

> Produces: `DIFF`, `PR_METADATA`, `CI_STATUS`, `DIFF_CLASSIFICATION`

---

## Phase 2: Plan

Determine which review perspectives to apply.

- **Always**: Security, correctness
- **If HAS_FRONTEND_CHANGES**: react-components, typescript-quality, accessibility
- **If HAS_WORKER_CHANGES**: hono-routes, drizzle-data
- **If performance-sensitive code touched** (loops over collections, DB queries, Worker hot paths): performance
- **If total diff >500 lines**: architecture
- **If draft PR**: note in verdict; reduce blocking threshold (author may be seeking early feedback)
- **If CI is red**: note pre-existing failures separately from review findings; do not block the review but call out the state

**Produce the plan as a native CLI artifact:**

Use `write_to_file` to create `review-plan.md` in the artifact directory with:
- `ArtifactMetadata.UserFacing: true`
- `ArtifactMetadata.RequestFeedback: true`
- `ArtifactMetadata.Summary`: list of the review perspectives that will be executed

**This is a hard gate.** Wait for the user to click **Proceed** before running the review.

> Produces: `REVIEW_PLAN` (native artifact)

---

## Phase 3: Multi-Dimension Review

Use `define_subagent` to create specialized review subagents (e.g. `security-reviewer`,
`frontend-reviewer`, `performance-reviewer`) for each perspective in the plan.
Instruct the subagents to follow the [role-reviewer](./role-reviewer.md) instructions,
along with the matching checklists ([review-design-checklist](./review-design-checklist.md) or
[review-security-checklist](./review-security-checklist.md)) and the [ddd-tactical](./ddd-tactical.md) rule.
Guide the process using the [SWEBOK glossary](../skills/swebok/SKILL.md).

Launch the review subagents in parallel using `invoke_subagent`.
Coordinate and collect their findings via `send_message` as they report back.

Also read all changed test files and assess test coverage directly — note files changed without accompanying test changes.

> Produces: `REVIEW_FINDINGS` per perspective, `COVERAGE_GAPS`

---

## Phase 4: Consolidate Findings

Merge all `REVIEW_FINDINGS`. Deduplicate. Sort by severity:

**Critical → High → Medium → Low → Nitpick → Documentation**

Classify each finding:
- **Blocking** (Critical or High): must be resolved before merge
- **Non-blocking** (Medium, Low, Nitpick, Documentation): suggested improvements

Cross-reference `COVERAGE_GAPS`: for each gap, determine if a failing test can demonstrate the missing behavior. If yes, mark for Phase 5.

> Produces: `CONSOLIDATED_FINDINGS`

---

## Phase 5: Write Failing Tests per Blocking Finding

For each blocking (Critical/High) finding that describes a behavioral defect or coverage gap:

Use `define_subagent` to spawn a specialized `test-writer` subagent. Launch the subagent via
`invoke_subagent` to write a minimal failing Vitest test co-located with the source file.

The test-writer subagent must name `describe` and `it` blocks using domain language from the PR
context — not technical jargon.

Good: `"when a customer has a pending balance, applying a credit does not double-count the amount"`
Bad: `"when hasPendingBalance is true, applyCredit does not set total twice"`

The subagent runs the test and confirms it fails for the expected reason.
The subagent must delete this temporary failing test file immediately after verification to prevent polluting the workspace and breaking subsequent build, test, or CI runs.

Style/naming/documentation findings: prose only — no test.
Architecture opinion findings: prose only — no test.

> Produces: `FAILING_TEST_CODE` per finding (where applicable)

---

## Assembly: Write review-comments.md

Format the output according to the [role-reporter](./role-reporter.md) review report instructions.

**Produce the comments as a native CLI artifact:**

Use `write_to_file` to write `review-comments.md` to the artifact directory with:
- `ArtifactMetadata.UserFacing: true`
- `ArtifactMetadata.Summary`: summary of the review results, including the final verdict and findings counts

The file starts with Comment 1 — no summary header before the first comment.

For each finding in order (Critical → High → Medium → Low → Nitpick → Documentation):

**Finding with failing test:**
```markdown
## Comment {N}: {Finding Title}

**Anchor:** {LINE src/path/to/file.ts:131-140 | FILE src/path/to/file.ts | GENERAL}
**Severity:** {severity}
**Blocking:** {true if Critical/High | false otherwise}

{One sentence: what is wrong and why it matters, using domain terms from the PR context.}

\`\`\`ts
{failing test code}
\`\`\`
*(Test demonstrates the defect — not committed to this PR)*

---
```

**Finding without test (Style/Naming/Documentation/Architecture-opinion):**
```markdown
## Comment {N}: {Finding Title}

**Anchor:** {LINE | FILE | GENERAL}
**Severity:** {severity}
**Blocking:** false

{One sentence describing the issue and its consequence.}

---
```

**Verdict block at the end:**
```markdown
## Verdict

**Result:** APPROVE | REQUEST CHANGES | COMMENT
**Blocking findings:** N
**Non-blocking findings:** N
**CI status:** {passing | failing | unknown}
**Test coverage:** {adequate | gaps noted — see Comments N, M}
```

---

## Edge Cases

See the `review-edge-cases` rule for: no PR description, draft PRs, very large PRs (>2000 lines), red CI, and config-only diffs.
