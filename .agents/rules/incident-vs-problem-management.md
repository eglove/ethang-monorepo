---
description: incident management, problem management, 5-Whys root cause analysis, and systemic fixes
trigger: model_decision
---

# Incident vs. Problem Management

## 1. Domain Theory and Conceptual Foundations
Maintaining software systems in production requires robust operational processes to address failures and defects. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 12 (Software Maintenance) and Chapter 11 (Software Quality), operational support is divided into two distinct, complementary disciplines: Incident Management and Problem Management. Confusing these two processes leads to either prolonged system downtime or recurring systemic failures.

### 1.1 Incident Management: Restoring the Baseline
The primary objective of Incident Management is to restore degraded or failed software services to a normal operating state as quickly as possible, minimizing business disruption.
- **Focus**: Speed of recovery (Mean Time to Restore Service - MTRS).
- **Tactics**: Temporary patches, system restarts, failover routing, configuration hot-swaps, or immediate version rollbacks.
- **Acceptability of Workarounds**: During an incident, a temporary "workaround" (a solution that restores service without addressing the underlying defect) is highly acceptable and encouraged. Finding the perfect architectural fix is deferred to avoid prolonged outages.

### 1.2 Problem Management: Eliminating the Root Cause
Problem Management is a proactive and reactive investigation that begins after service has been restored. Its objective is to identify the root cause of one or more incidents, implement permanent fixes, and prevent future recurrences.
- **Focus**: Defect prevention and systemic reliability.
- **Tactics**: Log analysis, code audits, database profiling, static analysis reviews, and architecture refactoring.
- **Permanent Resolution**: A problem is resolved only when the underlying defect is permanently removed from the source code, configurations, or build pipeline.

### 1.3 Systemic Analysis and the 5-Whys Methodology
To prevent recurring defects, software engineers must look beyond the immediate physical cause of a failure. SWEBOK v4 advocates for systemic analysis techniques, such as the 5-Whys methodology, to identify organizational and procedural gaps:
- **Immediate Symptom**: The application crashed with a null pointer exception.
- **Why 1 (Technical)**: The user profile object was null.
- **Why 2 (Logic)**: The database query returned no records for the requested ID.
- **Why 3 (Validation)**: The API route did not validate that the user ID existed before querying the database.
- **Why 4 (Testing)**: The integration test suite did not cover missing user ID edge cases.
- **Why 5 (Process)**: The requirements elicitation phase did not define error states for missing database profiles, and the checklist did not enforce API parameter validation.

By tracing the problem back to the elicitation or testing process, the team can implement systemic fixes (e.g. updating validation rules and adding automated tests) that prevent entire classes of similar bugs.

### 1.4 Incident-to-Problem Lifecycle Mapping
In a mature software organization, the lifecycle of an operational issue maps directly between the two disciplines:
- An **Incident** is reported (e.g., users cannot checkout).
- Incident Management deploys a rollback to the previous version (checkout restored).
- A **Problem Record** is automatically created and assigned to the engineering team.
- The engineering team performs an RCA, finds the checkout bug, writes regression tests, and merges the fix.
- The Problem is resolved, and the fix is safely deployed in the next scheduled release.

### 1.5 The Cost of Software Quality (CoSQ)
SWEBOK Chapter 11 describes the Cost of Software Quality (CoSQ) model, which categorizes expenditures related to software quality into four components:
- **Prevention Costs**: Investment in activities to prevent defects, such as developer training, static analysis tools, and writing automated unit tests before coding.
- **Appraisal Costs**: Costs associated with evaluating software quality, such as code reviews, integration testing, and running QA walkthroughs.
- **Internal Failure Costs**: Expenses incurred when defects are detected before release, requiring debugging, code correction, and re-testing.
- **External Failure Costs**: The highest-risk category, representing costs incurred when defects escape to production. This includes incident management response, SLA breach penalties, customer support overhead, data restoration, and reputation damage.

Problem management is a key tool for shifting expenses from External Failure Costs (reactive incident handling) to Prevention and Appraisal Costs (proactive bug fixing, adding regression tests, and improving validation rules).

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when managing incidents and problems:

### Step 2.1: Detect and Mitigate the Incident
Upon receiving an alert or bug report:
- Verify the system failure. Identify if the service is degraded (slow) or completely down.
- Focus exclusively on restoring service. If the defect is in a recent deployment, execute the rollback plan immediately:
```bash
rtk git status
# revert or restore to the last stable state if local
```
- Re-route traffic or apply a known workaround to restore service.

### Step 2.2: Log and Transition the Issue to Problem Management
Once service is restored:
- Document the incident in the system log or walkthrough (e.g., in `walkthrough.md`), recording the outage duration, symptoms, and the workaround applied.
- Transition the issue to a **Problem** state: open a tracking task in `task.md` to investigate the root cause.

### Step 2.3: Conduct the 5-Whys Root Cause Analysis (RCA)
Trace the failure back to its systemic origin:
- Trace the code path that triggered the failure.
- Document the 5-Whys chain, mapping out each layer of failure from syntax to process.
- Save this analysis in the project's permanent documentation or in a post-mortem section of the `walkthrough.md`.

### Step 2.4: Write the Red Failing Test
Before modifying any production code to fix the problem, follow TDD discipline:
- Write a unit or integration test case that replicates the exact condition that triggered the incident.
- Run the test suite and confirm that the new test fails (red):
```bash
rtk pnpm --filter <package-name> exec vitest run src/path/to/test.test.ts
```
- This proves that the test successfully catches the defect and serves as a regression block.

### Step 2.5: Implement the Permanent Code Fix
Write the minimum production code required to make the failing test pass:
- Ensure the code complies with all static rules (explicit member access, index signature bracket notation, no forbidden terminology).
- Compile the package to verify build integrity.

### Step 2.6: Verify and Close the Problem
Run the full verification suite to ensure no regressions were introduced:
```bash
rtk pnpm test
rtk pnpm lint
```
- Verify that the test turns green, the linter reports zero issues, and the problem is permanently resolved. Mark the task as completed in `task.md`.

### Step 2.7: Incident Post-Mortem and SLA Compliance Audits
After resolving the problem, conduct a formal post-mortem review:
- Audit the total restore time (MTRS) against SLA (Service Level Agreement) thresholds.
- Verify that all temporary workarounds deployed during Step 2.1 have been deactivated and replaced by the permanent fix.
- Archive the 5-Whys RCA document and the associated regression test reports in the project documentation directory to preserve organizational knowledge.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding incident and problem management:

- [ ] **Restoration Prioritized**: During an active incident, did the agent focus on restoring service before writing code fixes?
- [ ] **Rollback Executed Correctly**: Was the rollback plan executed safely without using destructive global resets (`git reset --hard`)?
- [ ] **Workaround Documented**: If a temporary workaround was applied, is it documented in `walkthrough.md`?
- [ ] **Problem State Initiated**: Was a root cause tracking task opened in `task.md` after service restoration?
- [ ] **5-Whys RCA Documented**: Is a complete 5-Whys chain recorded in the walkthrough or post-mortem?
- [ ] **Red Test First**: Was a failing regression test created and run (red) before production code was modified?
- [ ] **Green Verification Met**: Did the production code change make the regression test pass (green)?
- [ ] **No Systemic Regressions**: Were global integration tests run to confirm that the fix did not break adjacent features?
- [ ] **Typecheck and Lint Clean**: Did the fix compile and pass linter checks with zero warnings?
- [ ] **No Secrets Exposed**: Did the agent verify that no sensitive incident logs or keys were committed to SCM?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Task List Sync**: Are incident mitigation, RCA, TDD test creation, and final validation tracked in `task.md`?
- [ ] **Index Signature Safety**: Do incident audit scripts use bracket notation to access properties on index-signature log objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Explicit Member Access**: Are all methods and properties on support helpers declared with explicit accessibility modifiers?
- [ ] **Walkthrough Record Completed**: Does `walkthrough.md` document the final regression test outputs and resolution state?
