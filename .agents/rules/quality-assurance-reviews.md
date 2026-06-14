---
description: quality assurance reviews, peer code reviews, inspections, and checklists
trigger: model_decision
---

# Quality Assurance Reviews

## 1. Domain Theory and Conceptual Foundations
Quality assurance reviews are systematic, independent evaluation activities designed to verify that software work products, engineering processes, and test results conform to project standards, technical specifications, and regulatory requirements. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10 (Software Quality) and Chapter 6 (Software Construction), peer reviews are the most cost-effective method for early defect detection. Research shows that peer inspections can identify $60\%$ to $90\%$ of software defects before dynamic testing begins, dramatically reducing the overall cost of quality.

### 1.1 The Fagan Inspection Process
Developed by Michael Fagan, a formal software inspection is a structured, six-phase process designed to identify defects systematically:
1. **Planning**: Defining the review boundaries, selecting participants, and allocating roles.
2. **Overview**: The author provides a high-level briefing to the inspectors about the background and objectives of the work product.
3. **Preparation**: Inspectors independently review the work product using checklists, logging potential defects and questions.
4. **Inspection Meeting**: The reader paces the meeting through the code line-by-line. The recorder notes all identified defects. The author does not lead the meeting.
5. **Rework**: The author resolves the logged defects in the source files.
6. **Follow-up**: The moderator verifies that all rework items are completed and that no new defects were introduced.

### 1.2 Review Roles and Responsibilities
To ensure objectivity, formal reviews assign explicit roles to participants:
- **Moderator**: Leads the inspection process, schedules meetings, manages the pace, and ensures the review remains constructive and focused on defect detection.
- **Author**: The creator of the work product. The author is present to answer questions and learn from the feedback, but does not moderate or record.
- **Reader**: Paraphrases the code or document line-by-line during the meeting, driving the team's inspection pace.
- **Recorder (Scribe)**: Formally documents every identified defect, classification (major/minor), and action item.
- **Inspector**: Peer engineers who analyze the work product from different perspectives (e.g., security, performance, or database design).

### 1.3 Walkthroughs, Technical Reviews, and Audits
SWEBOK v4 distinguishes peer reviews based on their formality and objectives:
- **Walkthrough**: An informal, author-led review where the author walks participants through the code. It is primarily used for knowledge sharing and early design feedback, with low formality and no required follow-up.
- **Technical Review**: A formal, team-based evaluation of a product's technical adequacy, compliance with architectural plans, and readiness for release.
- **Software Audit**: An independent evaluation conducted by an external party to verify compliance with organizational standards, contracts, and regulatory rules.

### 1.4 Mathematical Evaluation of Review Effectiveness
The efficiency of a review process is measured using the Defect Detection Efficiency (DDE) metric:
$$DDE = \frac{D_{\text{review}}}{D_{\text{review}} + D_{\text{testing}}} \times 100\%$$

Where:
- $D_{\text{review}}$ is the number of defects discovered during peer reviews.
- $D_{\text{testing}}$ is the number of defects found during downstream testing, integration, and production.

A SWEBOK-aligned engineering team targets a $DDE \ge 70\%$. To maintain high efficiency, review sessions should be limited in size and duration. Cognitive fatigue significantly degrades defect detection rates if reviews exceed 400 lines of code (LOC) or last longer than 90 minutes.

### 1.5 Code Review Gates in Modern Monorepos
In automated monorepos, manual reviews are supported by static verification gates. Pull requests must pass linting, typechecking, and unit test suites before manual review can begin. Furthermore, static analysis tools analyze the PR for duplicated blocks, high complexity, and coverage regressions, preventing low-quality code from consuming human reviewer time.

### 1.6 Checklists as Organizational Knowledge Assets
SWEBOK emphasizes that checklists are not static templates; they are living artifacts that must capture historical failure modes, static analysis violations, and security threat vectors. The review checklists must be updated systematically after every post-incident review (PIR) to prevent recurring defects. By embedding historical defect classifications into the checklists, teams can continuously elevate the baseline quality of their reviews.

## 2. Standard Operating Procedures (SOP)
The agent must execute quality assurance reviews according to the following step-by-step procedures:

### Step 2.1: Perform Pre-Review Static Verification
Before submitting code for review, the agent must execute automated checks to ensure the pull request is clean:
- Run the compile, test, and lint commands using the token-saving workspace prefix:
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```
- Ensure the branch has zero compiler warnings and that all new code is covered by unit tests.

### Step 2.2: Scope and Structure the Pull Request
Prepare the work product for review, adhering to cognitive focus limits:
- Limit the scope of the pull request to under 400 lines of code. If a change is larger, partition it into logical, independent commits or separate pull requests.
- Provide a detailed pull request description outlining the implementation plan, verification results, and any design trade-offs.

### Step 2.3: Conduct Checklist-Based Preparation
During the independent preparation phase, review modified files against the project checklist:
- Verify that no relative paths cross package boundaries.
- Confirm that index-signature properties are accessed via bracket notation (`obj["prop"]`).
- Ensure all date operations utilize Luxon (`DateTime`) and native `Date` constructors are avoided.
- Verify that all mocked classes in Vitest are imported rather than declared in the test file scope.

### Step 2.4: Log and Classify Review Findings
Formally document all review observations. For every finding, log:
- The file path and line numbers.
- The defect classification (Major: functional bug, security vulnerability, interface contract breach; Minor: naming violation, style issue, redundant comment).
- The rationale and proposed correction.

### Step 2.5: Execute Rework and Follow-up
The author must address all logged findings:
- Correct the code to resolve each item.
- Re-run the automated verification suite to confirm that no regression was introduced.
- Update the review status, marking each issue as resolved with references to the fixing commits.

### Step 2.6: Update Walkthrough Documentation
Document the review results, logged findings, and rework commits in the project's active `walkthrough.md` file.

### Step 2.7: Track Review Metrics and Calibrate Checklists
Following review completion, record key metrics:
- Log the total time spent in preparation and meetings, the number of lines of code reviewed, and the total defect count.
- Update the shared review checklist if a new defect class is identified during rework or integration testing.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following quality assurance review rules:

- [ ] **Pre-Review Checks Run**: Did the agent run compiler, lint, and test checks before submitting the code?
- [ ] **Scope Bounds Respected**: Is the pull request size limited to under 400 lines of code or partitioned logically?
- [ ] **Checklist-Based Review Completed**: Were modified files audited against the project checklist items?
- [ ] **Findings Logged and Classified**: Are all review findings logged with file paths, line numbers, and classifications?
- [ ] **Vitest Mock Hoisting Checked**: Are all mocked classes imported rather than declared in the test file scope?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation (`obj["prop"]`)?
- [ ] **No Native Dates**: Does the code use Luxon (`DateTime`) for all date operations?
- [ ] **Void Assertions Wrapped**: Are unit test cases for void methods wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute tests and linter using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are the review logs, findings, and rework verification records updated in `walkthrough.md`?
- [ ] **Fagan Roles Followed**: Were the moderator, author, and reader roles respected during formal review sessions?
- [ ] **DDE Target Met**: Was the defect detection efficiency monitored and targeted to exceed 70%?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Metrics Tracked**: Were the review effort, defect count, and code size logged for process calibration?
