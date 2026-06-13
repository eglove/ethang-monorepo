import { defineSkill } from "../../../define.ts";

export const ciReviewPipelineSkill = defineSkill({
  content: `# SWEBOK Enterprise Verification & Transition Pipeline

A multi-agent, enterprise-grade software verification, validation, and transition pipeline based on IEEE SWEBOK v4.0 and ISO/IEC/IEEE 12207 Technical Processes. Integrates DevSecOps (OWASP), software quality measurement, refactoring, and deployment configuration within a formal engineering process.

The main agent orchestrates specialized subagents (via \`define_subagent\` and \`invoke_subagent\`), produces native artifacts (via \`write_to_file\` with \`ArtifactMetadata\`), and coordinates work through \`send_message\`. Follow every stage in order — do not skip or abbreviate.

**Automatic hard gates:** Stage 5 SonarCloud quality gate and Security OWASP review — pipeline must not advance to Stage 6 if either fails.

---

## Stage 5: Production Phase — Verification & Validation

**ISO/IEC/IEEE 12207: 6.4.9 Verification, 6.4.11 Validation**
**SWEBOK KA: Software Quality (Ch 12), Software Testing (Ch 5), Software Engineering Measurement (Ch 8), Computing Foundations / Security (Ch 13)**

With tests green, first commit the changes, push them to a remote PR branch, and wait for the remote CI pipeline/checks to finish before checking for Sonar issues.

Define and fan out relevant subagent reviewers in parallel. In addition to the three listed below, dynamically create other domain-specific review subagents as needed:

**Subagent A — Quality Analyst (Measurement & Quality Gate):**
Load and follow the [quality-analyst](resources/quality-analyst.md) resource. Run SonarCloud quality gate check, validate test coverage (100% on new/changed code), perform validation traceability against the approved \`requirements.md\`. For frontend features, apply the \`web-perf\` skill to audit Core Web Vitals.

**Subagent B — Security Analyst (OWASP Top 10 Review):**
Load and follow the [security-analyst](resources/security-analyst.md) resource in **Stage 5 mode**. Review all changed files against OWASP Top 10. Verify every HIGH and CRITICAL STRIDE mitigation from the \`THREAT_MODEL\` was implemented in Stage 4.

**Subagent C — DDD Refactoring (Software Maintenance):**
Load and follow the [ddd-tactical](resources/ddd-tactical.md) resource. Review the GREEN code and identify refactoring opportunities: CQRS separation, Specification Pattern (3+ condition guards), branded Value Objects, past-tense Domain Event naming, dead code elimination, and complexity reduction. Apply improvements while keeping tests green; re-run \`pnpm --filter <package> test\` after each change.

Wait for all reviewers to report back.

**Automatic hard gates (non-negotiable before Stage 6):**
1. **SonarCloud quality gate must be PASS** — if FAIL, identify and fix issues, re-run until green.
2. **OWASP Security review must PASS** — if CRITICAL or HIGH findings remain, fix them and re-run. Confirm STRIDE mitigations are all verified.

If any issues, bugs, code smells, or security vulnerabilities are found during Stage 5, write failing red tests for those issues and return to Stage 4 to implement fixes.

> Produces: \`QUALITY_ANALYSIS\`, \`OWASP_REVIEW\`, \`REFACTORED_CODE\`

---

## Stage 6: Utilization & Support Phase (Transition & Maintenance Handoff)

**ISO/IEC/IEEE 12207: 6.4.10 Transition, 6.4.12 Operation, 6.4.13 Maintenance**
**SWEBOK KA: Software Engineering Operations (Ch 10), Software Maintenance (Ch 7)**

Prepare the software for transition to the operational environment.

**Generate transition artifacts using installed skills:**

1. **Deployment configuration:** Load the \`wrangler\` skill to generate a correctly-formed \`wrangler.jsonc\` configuration stub and a GitHub Actions workflow YAML (\`.github/workflows/<feature-name>.yml\`) targeting this monorepo's Cloudflare deployment pattern. Present these as inline code blocks for the user to review and integrate.

2. **Final transition report** — provide inline to the user:

\`\`\`
TRANSITION_REPORT:

## Stakeholder Needs Satisfaction (Validation)
For each STAKEHOLDER_NEED from Stage 1: [need] → satisfied by [FR-N] → verified by [test name] ✅/❌

## Requirements Traceability (Verification)
For each FR-N: [requirement] → implemented in [file] → covered by [test] → SonarCloud: [pass/fail] ✅/❌

## Security Summary
STRIDE threats identified: [N] | Mitigated: [N] | Deferred: [N]
OWASP findings: [N] CRITICAL | [N] HIGH | [N] MEDIUM | [N] LOW resolved

## Quality Gate Summary
SonarCloud: PASSED | Coverage: [X%] | Bugs: [N] | Vulnerabilities: [N] | Tech Debt Rating: [A-E]

## Deployment Artifacts Generated
- wrangler.jsonc stub: [inline or file path]
- GitHub Actions workflow: [inline or file path]

## Maintenance Handoff
Maintenance class (if applicable): Corrective | Adaptive | Perfective | Preventive
Technical debt deferred: [list or "None"]
Recommended next maintenance actions: [list]
\`\`\`

---`,
  description:
    "Production and utilization verification pipeline: verification, quality gate check, OWASP review, refactoring, and transition/deployment handoff.",
  name: "ci-review"
});
