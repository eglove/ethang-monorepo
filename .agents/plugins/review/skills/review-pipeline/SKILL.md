---
name: review-pipeline
description: "Primary review skill. Execute when asked to review a pull request or diff. Drives the full review pipeline: intake via gh CLI or local git diff, multi-dimension review (correctness, design, security, maintainability, test coverage), findings classified blocking/non-blocking, structured verdict, report written."
---

# PR Review Pipeline

Execute this pipeline when asked to review a pull request or diff.

Produces a single artifact: `review-comments.md` — ready-to-post comment drafts backed by failing tests with domain-language naming where applicable.

## Skills

### `reviewer`

Load for each review perspective (react-components, typescript-quality, hono-routes, drizzle-data, security, accessibility, performance, architecture, maintainability). Follow its operating procedure for the named perspective.

### `reporter`

Load to produce the final review-results.md report in non-technical stakeholder format after findings are assembled.

### `review-design-checklist`

Load during design/architecture/typescript-quality perspective reviews. Covers React component design, Hono route design, Drizzle patterns, layer violations, DDD tactical patterns.

### `review-security-checklist`

Load during the security perspective review. Covers React XSS controls, Hono/Worker auth and CORS, Drizzle SQL injection, OWASP Top 10 stack-specific checks, and PII controls.

---

## Phase 1: Intake

Gather the diff and context. Run all reads in parallel.

### 1a. Identify the source

Accept any of the following:
- A GitHub PR number or URL → use `gh pr view {number}` and `gh pr diff {number}`
- A branch name → use `git diff master...{branch}`
- No argument → use `git diff master...HEAD`

### 1b. Read PR metadata (if GitHub PR)

Run in parallel:
- `gh pr view {number} --json title,body,author,baseRefName,headRefName,isDraft,additions,deletions,changedFiles`
- `gh pr checks {number}` — CI status

### 1c. Read the diff

```
gh pr diff {number}
# or
git diff master...HEAD
```

### 1d. Classify the diff

From the diff output, determine:
- **Frontend files** (`.tsx`, `.ts`, `.css` under `src/` or `app/`): set `HAS_FRONTEND_CHANGES=true`
- **Worker/API files** (packages containing `wrangler.jsonc`, or path includes `worker`/`api`/`server`): set `HAS_WORKER_CHANGES=true`
- **Test files** (`*.test.ts`, `*.spec.ts`): note separately
- **Config/build files** (`*.json`, `*.toml`, `*.jsonc`, `wrangler.jsonc`): set `HAS_CONFIG_CHANGES=true`
- **Total lines changed**: additions + deletions

> Produces: `DIFF`, `PR_METADATA`, `CI_STATUS`, `DIFF_CLASSIFICATION`

---

## Phase 2: Plan

Determine which review perspectives to apply.

**Always**: Security, correctness

**If HAS_FRONTEND_CHANGES**: react-components, typescript-quality, accessibility

**If HAS_WORKER_CHANGES**: hono-routes, drizzle-data

**If performance-sensitive code touched** (loops over collections, DB queries, Worker hot paths): performance

**If total diff >500 lines**: architecture

**If draft PR**: note in verdict; reduce blocking threshold (author may be seeking early feedback)

**If CI is red**: note pre-existing failures separately from review findings; do not block the review but call out the state

Present the plan to the user and ask: "Proceed with this review plan? Yes / Adjust / Cancel." Wait for the answer.

> Produces: `REVIEW_PLAN`

---

## Phase 3: Multi-Dimension Review

Load and follow the `reviewer` skill for each perspective in the plan. Run all perspectives in parallel.

For each perspective, the reviewer skill produces `REVIEW_FINDINGS [{perspective}]`.

Also run: read all changed test files and assess test coverage directly — note files changed without accompanying test changes.

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

Write a minimal failing Vitest test co-located with the source file that proves the specific issue exists.

Name `describe` and `it` blocks using domain language from the PR context — not technical jargon.

Good: `"when a customer has a pending balance, applying a credit does not double-count the amount"`
Bad: `"when hasPendingBalance is true, applyCredit does not set total twice"`

Run the test and confirm it fails for the expected reason (not a setup/import error).

Style/naming/documentation findings: prose only — no test.
Architecture opinion findings: prose only — no test.

> Produces: `FAILING_TEST_CODE` per finding (where applicable)

---

## Assembly: Write review-comments.md

Write `review-comments.md` to the output path (current directory or `{output-path}/` if specified).

File starts with Comment 1 — no summary header before the first comment.

For each finding in order (Critical → High → Medium → Low → Nitpick → Documentation):

**Finding with failing test:**
```markdown
## Comment {N}: {Finding Title}

**Anchor:** {LINE src/path/to/file.ts:131–140 | FILE src/path/to/file.ts | GENERAL}
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
