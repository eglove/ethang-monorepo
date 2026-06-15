import { defineRule } from "../../define.ts";

export const reviewEdgeCases = defineRule({
  content: `# Review Edge Cases

## 1. Domain Theory and Conceptual Foundations
Peer reviews and technical inspections represent primary static verification techniques in software quality assurance. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10 (Software Quality) and Chapter 8 (Software Engineering Process), formal technical reviews (e.g., Fagan inspections) and modern lightweight reviews (e.g., Pull Request reviews) are designed to identify defects, share domain knowledge, and ensure conformance to architectural standards.

### 1.1 Michael Fagan's Inspection Process
Formal inspections, first defined by Michael Fagan, consist of six sequential phases:
1. **Planning**: Allocating roles (moderator, reader, recorder, inspector) and scheduling meetings.
2. **Overview**: Briefing the team on the design and requirements of the subsystem.
3. **Preparation**: Individual inspectors review code in isolation, recording potential defects.
4. **Inspection Meeting**: The reader walks through the code line-by-line, and the team logs defects.
5. **Rework**: The author resolves the identified defects.
6. **Follow-up**: The moderator verifies that all rework was completed correctly.

Modern Pull Request workflows represent a lightweight, asynchronous adaptation of Fagan's preparation and rework phases. While lighter, they must maintain similar rigor in defect classification and architectural alignment.

### 1.2 Cognitive Limits and Miller's Law
The efficiency of a code review is inversely proportional to the volume of changes and the cognitive load of the reviewer. Miller's Law suggests that a human can hold only \\(7 \\pm 2\\) chunks of information in working memory. When a pull request changes thousands of lines across different packages, the reviewer's cognitive capacity is overwhelmed, leading to "approval fatigue" and a sharp drop in defect detection rate. SCM guidelines recommend limiting PR sizes to under 400 lines of code.

### 1.3 Inspection Perspectives and Diversity
Modern software engineering processes leverage multi-perspective reviews (also known as scenario-based reading) to improve inspection effectiveness. Instead of a single reviewer trying to evaluate all quality attributes, different perspectives (e.g., Correctness, Architecture, Security, Performance) are applied. A security perspective focuses on data leakages and input sanitization, while an architectural perspective checks dependency direction and coupling.

## 2. Standard Operating Procedures (SOP)
The agent must execute specific review protocols when encountering exceptional Pull Request configurations or structural anomalies.

### Step 2.1: Handling PRs Lacking Descriptions
When querying the Pull Request details using the GitHub CLI (e.g., \`gh pr view {number}\`) and the body is empty or missing:
1. **Identify as Finding**: Note in the final review verdict that the PR lacks a description. Flag this as a non-blocking documentation finding.
2. **Proceed with Diff Analysis**: Do not block the review. Proceed using only the git diff, file layout changes, and branch name as context.
3. **Draft Verdict Rationale**: Explicitly state: *"Review conducted using only code diff and branch context; PR description was empty."*

### Step 2.2: Reviewing Draft Pull Requests
When the PR status is marked as \`isDraft: true\`:
1. **Annotate Output**: Include a prominent notification in the review header: *"This is a draft PR — findings are advisory."*
2. **Adjust Blocking Thresholds**: Modify the blocking severity criteria. Demote what would normally be blocking "High" severity design findings to advisory "Medium" recommendations, unless the author has explicitly requested a strict blocking review.
3. **Focus on Early Feedback**: Prioritize architectural direction and interfaces over minor styling issues or test coverage gaps.

### Step 2.3: Reviewing Extremely Large PRs (>2000 Lines)
When a PR contains changes exceeding 2000 lines (excluding lockfiles and auto-generated files):
1. **Warn the User**: Output a warning message in the terminal and draft review: *"This PR changes more than 2000 lines. Review accuracy may be reduced. Consider splitting the PR."*
2. **Split Diff by Perspective**: Do not feed the entire diff as a single block to the review model. Split the diff per-file or per-workspace package.
3. **Execute Independent Perspectives**: Run separate Correctness, Security, and Architecture review tasks sequentially, passing only relevant files to each.

### Step 2.4: Conducting Reviews with Failing CI Pipelines
When \`gh pr checks {number}\` reports pre-existing test or build failures:
1. **Isolate Findings**: Create a dedicated section in the review summary labeled *"Pre-existing CI Failures"*. List the failing jobs and logs.
2. **Complete the Review**: Do not let CI failures prevent you from reviewing the code. Post your review findings, but explicitly state that the PR cannot be merged until the CI pipeline is green.
3. **Differentiate Issues**: Clearly distinguish between errors introduced by the author's code changes and pre-existing failures in the main branch.

### Step 2.5: Reviewing Configuration-Only PRs
When the diff consists entirely of configuration or build files (e.g., \`package.json\`, \`tsconfig.json\`, \`wrangler.jsonc\`, \`*.toml\`, lockfiles):
1. **Skip Functional Perspectives**: Bypasses the Correctness and UI Component review perspectives.
2. **Execute Core Perspectives**: Run the Security (checking for key leakage or dependency risk) and Architecture (checking workspace organization or dependency drift) perspectives only.

### Step 2.6: Programmatic Review Checklist Auditor
Below is a TypeScript class implementing a PR Review Auditor that evaluates PR size, draft status, and file paths to programmatically determine the required inspection steps and perspectives.

\`\`\`typescript
import { vi } from "vitest";

interface PullRequestMetadata {
  linesChanged: number;
  isDraft: boolean;
  ciPassed: boolean;
  hasDatabaseChanges: boolean;
}

class ReviewAuditor {
  public determineReviewStrategy = (pr: PullRequestMetadata): string[] => {
    const strategies: string[] = [];

    if (pr["linesChanged"] > 2000) {
      strategies.push("split-diff-by-package");
    }

    if (pr["isDraft"]) {
      strategies.push("advisory-only-mode");
    } else {
      strategies.push("strict-quality-gates");
    }

    if (pr["hasDatabaseChanges"]) {
      strategies.push("database-migration-review");
    }

    if (!pr["ciPassed"]) {
      strategies.push("flag-ci-blocker");
    }

    return strategies;
  };
}

describe("ReviewAuditor tests", () => {
  it("should select correct strategies for large, draft database PRs with failing CI", () => {
    const auditor = new ReviewAuditor();
    const pr: PullRequestMetadata = {
      linesChanged: 2500,
      isDraft: true,
      ciPassed: false,
      hasDatabaseChanges: true
    };

    const strategies = auditor.determineReviewStrategy(pr);
    expect(strategies).toContain("split-diff-by-package");
    expect(strategies).toContain("advisory-only-mode");
    expect(strategies).toContain("database-migration-review");
    expect(strategies).toContain("flag-ci-blocker");
    expect(strategies).not.toContain("strict-quality-gates");
  });
});
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following review edge cases procedures during all review tasks:

- [ ] **Lightweight Peer Review**: Did the agent review the code using light, perspective-driven inspection steps?
- [ ] **Empty PR Body Handled**: If the PR body was empty, did the agent log a non-blocking finding and proceed?
- [ ] **Draft PR Flag Checked**: Was the draft status checked and were blocking severity thresholds adjusted accordingly?
- [ ] **Draft Advisory Message**: Was the advisory warning message included in the header of the draft PR review?
- [ ] **Large PR Warn Triggered**: If the diff exceeded 2000 lines, was the warning message issued to the user?
- [ ] **Diff Splitting Executed**: Was the large diff split into separate files or components to prevent context overflow?
- [ ] **Failing CI Isolated**: Were pre-existing CI check failures isolated from the review's design findings?
- [ ] **PR Checks Query Run**: Did the agent query the CI pipeline status using the GitHub CLI before posting findings?
- [ ] **Config-Only Diff Detected**: Did the agent check if the diff contained only build or configuration files?
- [ ] **Correctness Skip Confirmed**: For config-only PRs, did the agent bypass the functional correctness perspective?
- [ ] **Security Review Executed**: Was the Security perspective run on config files to check for dependency vulnerabilities?
- [ ] **Architecture Review Executed**: Was the Architecture perspective run to verify workspace configuration compliance?
- [ ] **Lines of Code Counted**: Did the agent count the total lines of code changed in the diff before selecting the review flow?
- [ ] **Review Rate Monitored**: Did the agent pace the review process to maintain high defect detection accuracy?
- [ ] **No Forbidden Terminology**: Has the review output been checked to ensure zero forbidden words (e.g. deprecated system identifiers) are present?
- [ ] **Arrow Functions Enforced**: Are all code snippets in the review comments written using arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript code blocks in comments rely on type inference?
- [ ] **Accessibility Modifiers Present**: Do mock classes in review feedback include explicit public/private modifiers?
- [ ] **Bracket Notation Applied**: Are Record property accesses in comments formatted using bracket notation?
- [ ] **No Git Commit executed**: Did the agent refrain from creating commits or pushing branches during the review?
- [ ] **SWEBOK Standards Grounding**: Does the review feedback align with SWEBOK v4 Chapter 10 static verification principles?
- [ ] **Database Migration Reviewed**: Did the agent evaluate Drizzle schema changes for backward compatibility?
- [ ] **Miller's Law Limit Applied**: Was the cognitive capacity limit respected when reviewing nested logic loops?
- [ ] **Perspective isolation**: Were different review findings isolated clearly in the review summary?`,
  description: "reviewing a pull request or diff",
  filename: "review-edge-cases",
  trigger: "model_decision"
});
