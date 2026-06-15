import { defineRule } from "../../define.ts";

export const processMeasurement = defineRule({
  content: `# Process Measurement

## 1. Domain Theory and Conceptual Foundations
Process measurement is the systematic collection, analysis, and application of software engineering process metrics to evaluate, control, and continuously improve software development workflows. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 8 (Software Engineering Process) and Chapter 7 (Software Engineering Management), software measurement is a prerequisite for process maturity. Without empirical measurement, process management remains subjective, and teams cannot reliably evaluate the impact of workflow changes or predict release schedules.

### 1.1 The Goal-Question-Metric (GQM) Paradigm
To prevent collecting useless metrics that create measurement overhead without providing actionable insights, organizations employ Victor Basili's GQM paradigm:
1. **Conceptual Level (Goal)**: Define the business or engineering goal (e.g., "Reduce the time required to merge pull requests without degrading code quality").
2. **Operational Level (Question)**: Formulate questions that characterize the goal (e.g., "What is the average duration a pull request spends in the review phase?" and "What percentage of pull requests fail static checks?").
3. **Quantitative Level (Metric)**: Select the metrics required to answer the questions (e.g., "Pull Request Cycle Time in hours" and "Build Failure Rate in percent").

### 1.2 Taxonomy of Software Process Metrics
SWEBOK v4 categorizes process metrics into several key groups:
- **Defect Density ($$DD$$)**: The number of defects discovered in a work product divided by its size (measured in KLOC or Function Points):
$$DD = \\frac{\\text{Defect Count}}{\\text{Size}}$$

- **Cycle Time ($$CT$$)**: The elapsed time from when engineering work begins on a task to when it is successfully merged and verified.
- **Lead Time ($$LT$$)**: The elapsed time from when a task is requested or logged in the backlog to when it is fully delivered.
- **Defect Escape Rate ($$DER$$)**: The percentage of defects found by users in production versus the total defects discovered throughout the lifecycle:
$$DER = \\frac{D_{\\text{production}}}{D_{\\text{development}} + D_{\\text{production}}} \\times 100\\%$$

- **Build Failure Rate ($$BFR$$)**: The ratio of failed build runs to total build runs, highlighting instability in local configurations or the integration pipeline.

### 1.3 Process Control and Capability
To evaluate if a development process is stable, organizations analyze metric distributions. Process capability models (such as CMMI) categorize organizations based on their ability to control processes quantitatively. A stable process exhibits predictable cycle times with low variance, allowing teams to make accurate commitments. High variance in cycle times indicates external dependencies, bottlenecked review gates, or unstable environments.

### 1.4 The PDCA Cycle and Continuous Improvement
Process metrics are consumed by the **Plan-Do-Check-Act (PDCA)** cycle:
- **Plan**: Identify a process bottleneck and plan improvements (e.g., automate dependency auditing to reduce manual verification time).
- **Do**: Implement the process change on a pilot scale.
- **Check**: Measure the process metrics post-change and compare against the baseline.
- **Act**: Standardize the process change if it successfully optimized the targeted metric.

When a process failure occurs (e.g., a critical defect escapes to production, or a build remains broken for hours), teams conduct a **5-Whys Root Cause Analysis** to trace the systemic process gap behind the symptom.

### 1.5 Process Assessments and Improvement Frameworks
Process assessments evaluate an organization's development capability against international standards:
- **CMMI (Capability Maturity Model Integration)**: Rates process maturity across five levels: Initial, Managed, Defined, Quantitatively Managed, and Optimizing.
- **ISO/IEC 15504 (SPICE)**: Exposes a multi-dimensional framework for process assessment, evaluating process capability from Level 0 (Incomplete) to Level 5 (Optimizing).

Measurement is the mechanism that transitions an organization from Level 3 (Defined) to Level 4 (Quantitatively Managed).

### 1.6 Statistical Process Control (SPC)
Statistical Process Control applies statistical methods to monitor and control a development process. By calculating the mean ($\\mu$) and standard deviation ($\\sigma$) of historical cycle times:
$$\\mu = \\frac{1}{N} \\sum_{i=1}^{N} CT_i$$
$$\\sigma = \\sqrt{\\frac{1}{N} \\sum_{i=1}^{N} (CT_i - \\mu)^2}$$

Teams establish an Upper Control Limit ($UCL$) and a Lower Control Limit ($LCL$):
$$UCL = \\mu + 3\\sigma$$
$$LCL = \\mu - 3\\sigma$$

Any task exceeding the $UCL$ is flagged as an out-of-control process variation requiring root cause analysis.

## 2. Standard Operating Procedures (SOP)
The agent must execute process measurement practices according to the following step-by-step procedures:

### Step 2.1: Instrument Process Metric Collection
Configure workspace tools to record key process performance metrics:
- Track the start and completion times of engineering tasks to compute Cycle Time.
- Record compilation times, test suite execution times, and linter warning counts.
- Run static checks and test runs using the token-saving command prefix:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
\`\`\`

### Step 2.2: Compute Defect and Quality Metrics
Evaluate the quality of the modifications:
- Track the number of linter warnings or compiler errors fixed during refactoring.
- Log the unit test line and block coverage metrics.
- Ensure all void-returning function tests are wrapped in \`expect(() => ...).not.toThrow()\` to prevent unstable test assertions from distorting quality reports.

### Step 2.3: Document Process Metrics in Walkthroughs
For every completed task or sprint:
- Record the actual Cycle Time and compare it against the expected effort estimate ($E_{t}$).
- Document the build status, test pass rates, and coverage statistics in the active \`walkthrough.md\` file.

### Step 2.4: Log Process Anomalies and Retrospectives
If a task requires more than $30\\%$ extra time or experiences build failures:
- Conduct a 5-Whys root cause analysis to isolate the process bottleneck (e.g., unstable third-party API, merge conflicts, or complex compiler errors).
- Document the 5-Whys analysis and the corresponding process improvement recommendations in the walkthrough.

### Step 2.5: Calibrate Checklists and Task Templates
Update engineering checklists based on process measurement findings:
- If a specific defect keeps escaping, add a new targeted validation item to the active compliance checklist.
- Refactor the \`task.md\` template to reflect updated process gates.

### Step 2.6: Apply Statistical Process Controls (SPC)
Calculate process control limits weekly. Identify tasks that exceed the Upper Control Limit ($UCL$) and schedule process optimization reviews to decouple blocking dependencies.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following process measurement rules:

- [ ] **Cycle Time Tracked**: Did the agent record the start and completion timestamps of the task?
- [ ] **Baseline Estimates Documented**: Was the actual execution time compared against the expected estimate ($E_{t}$)?
- [ ] **Quality Metrics Logged**: Are unit test coverages, compile outputs, and lint status documented?
- [ ] **5-Whys Performed on Deviations**: Was a root cause analysis conducted if the task exceeded its estimate by 30%?
- [ ] **Vitest Mock Hoisting Checked**: Are all mocked classes imported rather than declared in the test file scope?
- [ ] **Index Signature Bracket Access**: Are properties on index-signature objects accessed via bracket notation (\`obj["prop"]\`)?
- [ ] **No Native Dates**: Are process schedules, cycle times, and timestamps calculated strictly using Luxon?
- [ ] **Void Assertions Wrapped**: Are unit test cases for metric collectors wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted \`git restore\` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are cycle times, quality metrics, and retrospective findings documented in \`walkthrough.md\`?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **GQM Goals Formulated**: Were the specific GQM goals and questions for process metrics documented?
- [ ] **Defect Escape Rate Audited**: Did the agent analyze production/staging bug data to compute the defect escape rate?
- [ ] **Checklist Calibrated**: Was the shared review checklist updated to prevent repeating discovered process gaps?
- [ ] **Build Failure Rate Logged**: Was the local and CI/CD build failure frequency tracked for stability analysis?
- [ ] **CMMI Maturity Checked**: Was the process improvement aligned with CMMI quantitatively managed level practices?
- [ ] **Statistical Limits Plotted**: Were SPC mean and standard deviation limits calculated for team velocity tracking?`,
  description:
    "process measurement, development metrics, defect density, cycle time, and process improvement",
  filename: "process-measurement",
  trigger: "model_decision"
});
