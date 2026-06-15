import { defineRule } from "../../define.ts";

export const empiricalExperiments = defineRule({
  content: `# Empirical Experiments

## 1. Domain Theory and Conceptual Foundations
Empirical experiments are controlled scientific studies designed to systematically test hypotheses, validate engineering assumptions, and compare different technical approaches. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 14 (Software Engineering Methodologies) and Chapter 10 (Software Quality), software engineering decisions must rely on empirical evidence rather than intuition or subjective preference. By applying the scientific method, software engineers can make informed choices about architectures, frameworks, algorithms, and development processes.

### 1.1 Empirical Research Methods
SWEBOK classifies empirical research into four primary methodologies:
1. **Controlled Experiments**: A highly structured investigation where the researcher manipulates one or more independent variables under controlled conditions to observe the effect on dependent variables. Subjects (developers or systems) are randomly assigned to treatment and control groups.
2. **Case Studies**: An in-depth, observational study of a project or team in its natural, real-world context. Case studies are useful for exploring complex phenomena where variables cannot be easily isolated.
3. **Surveys**: Retrospective studies that collect qualitative or quantitative data from a large sample of subjects using questionnaires or interviews to identify trends and correlations.
4. **Action Research**: An iterative, collaborative research method where the researcher actively participates in the process being studied to introduce interventions and measure their outcomes.

### 1.2 Hypothesis Formulation
An experiment begins with the formulation of two mutually exclusive and exhaustive hypotheses:
- **Null Hypothesis ($H_0$)**: The default assumption that there is no significant difference or effect between the treatment group and the control group (e.g. "Database library A has the same read latency as database library B").
- **Alternative Hypothesis ($H_1$)**: The hypothesis that the treatment produces a significant difference or effect (e.g. "Database library A has lower read latency than database library B").

The goal of statistical testing is to determine whether the empirical data provides sufficient evidence to reject the null hypothesis $H_0$ in favor of the alternative hypothesis $H_1$.

### 1.3 Control of Variables
To ensure the validity of an experiment, designers must identify and manage three classes of variables:
- **Independent Variables (Factors)**: The inputs or conditions that the experimenter deliberately manipulates (e.g. choice of algorithm, programming language, memory allocation limits).
- **Dependent Variables (Response Variables)**: The outcomes or metrics measured to observe the effect of the independent variables (e.g. execution time, memory footprint, defect density, code churn).
- **Confounding Variables (Nuisance Variables)**: External factors that can distort the relationship between the independent and dependent variables (e.g. background CPU load, network latency fluctuations, developer skill variance). Confounding variables are controlled using **randomization** (randomly assigning tasks), **blocking** (grouping subjects by skill level), and **balancing** (ensuring groups are equal in size and composition).

### 1.4 Statistical Significance and Errors
When analyzing experimental data, engineers use inferential statistics:
- **Significance Level ($$\\alpha$$)**: The probability threshold below which the null hypothesis is rejected. By convention, $$\\alpha = 0.05$$ ($$5\\%$$ chance of rejecting $$H_0$$ when it is true).
- **p-value**: The probability of obtaining the observed results (or more extreme results) assuming the null hypothesis is true. If $$p < \\alpha$$, the results are statistically significant, and $$H_0$$ is rejected.
- **Type I Error (False Positive / $$\\alpha$$)**: Rejecting the null hypothesis when it is actually true (e.g. claiming library A is faster when it is not).
- **Type II Error (False Negative / $$\\beta$$)**: Failing to reject the null hypothesis when it is actually false (e.g., claiming there is no difference in speed when library A is indeed faster).
- **Statistical Power ($$1 - \\beta$$)**: The probability that the experiment will correctly reject the null hypothesis when an effect exists. A power of $$0.80$$ ($$80\\%$$) is the standard target.

### 1.5 Parametric vs. Non-Parametric Tests
Statistical tests are classified based on their assumptions about the underlying data distribution:
- **Parametric Tests**: Assume that the data is drawn from a specific probability distribution (typically a normal distribution) and meets assumptions of homogeneity of variance. Examples include the Student's t-test (comparing two groups) and ANOVA (comparing three or more groups). These tests have higher statistical power when their assumptions are met.
- **Non-Parametric Tests**: Make no assumptions about the probability distribution of the data (distribution-free tests). Examples include the Mann-Whitney U test (comparing independent groups) and Wilcoxon signed-rank test (comparing paired groups). Non-parametric tests must be used for highly skewed data, ordinal measurements, or small sample sizes where normality cannot be verified.

## 2. Standard Operating Procedures (SOP)
The agent must design, execute, and document empirical benchmarks and experiments according to the following procedures:

### Step 2.1: Document the Experiment Proposal
Before conducting a performance benchmark, algorithm comparison, or tool evaluation:
- Write a formal experiment proposal in the implementation plan.
- Explicitly state the null hypothesis ($$H_0$$) and alternative hypothesis ($$H_1$$).
- Identify the independent variable, dependent variables, and the mechanisms used to control confounding variables (e.g., running benchmarks on isolated containers to avoid background CPU noise).

### Step 2.2: Implement Controlled Benchmarks
When writing performance benchmarking code:
- Ensure the environment is warmed up (running the target code multiple times before timing starts) to account for JIT compiler optimizations.
- Execute the code across a statistically significant number of runs (minimum 100 iterations) to calculate variance.
- Capture garbage collection pauses and network timing separately from core computation.
- Utilize a dedicated benchmarking file under the \`scratch/\` directory.

### Step 2.3: Analyze Benchmark Statistics
- Calculate the mean, standard deviation, and a $$95\\%$$ confidence interval for all measured execution runtimes.
- Do not rely solely on the mean; inspect the standard deviation and maximum latency (tail latency) to detect outliers.
- Formulate the confidence interval using double-escaped LaTeX:
$$\\text{CI} = \\bar{x} \\pm z \\times \\frac{s}{\\sqrt{N}}$$
where $$\\bar{x}$$ is the sample mean, $$s$$ is the standard deviation, $$N$$ is the sample size, and $$z$$ is the critical value (for $$95\\%$$, $$z = 1.96$$).

### Step 2.4: Execute Verification and Record Results
- Run the build and verification suites to ensure compilation:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
\`\`\`
- Document the final benchmark results, hardware specs, p-values, and statistical conclusions in the [walkthrough.md](file:///C:/Users/glove/.gemini/antigravity/brain/22cf77fe-0f6e-4156-adcf-97f72484c4fa/walkthrough.md) file.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following empirical experiments rules:

- [ ] **Hypotheses Stated**: Did the agent document a clear $H_0$ and $H_1$ prior to running the experiment?
- [ ] **Variables Identified**: Are independent, dependent, and confounding variables explicitly listed?
- [ ] **Confounding Factors Controlled**: Did the agent mitigate background noise or JIT effects in the benchmark?
- [ ] **Sample Size Adequate**: Are benchmarks executed for a minimum of 100 iterations to ensure statistical validity?
- [ ] **Descriptive Stats Calculated**: Are both the mean and standard deviation reported in the results?
- [ ] **Tail Latency Inspected**: Did the agent analyze maximum (p99) latency values to detect outlier states?
- [ ] **Confidence Interval Reported**: Is the $95%$ confidence interval calculated and documented for timing metrics?
- [ ] **No Native Dates Used**: Are timing measurements and logs calculated using Luxon (\`DateTime\`) or high-resolution timers (\`performance.now()\`)?
- [ ] **No Forbidden Terminology**: Has the rule been scanned to confirm no forbidden enterprise vocabularies are present?
- [ ] **Size Bounds Confirmed**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent run verification (build, test, lint) using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are hardware parameters, benchmark logs, and statistical conclusions documented in \`walkthrough.md\`?
- [ ] **Index Signature Bracket Access**: Are dynamic properties on index-signature objects accessed via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit test cases verifying lack of exceptions wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Arrow Functions Enforced**: Are all function declarations defined as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent compiler resolution mismatches?
- [ ] **Environment Documented**: Are node version, operating system, and hardware specs listed alongside results?
- [ ] **JIT Warmup Performed**: Did the benchmark code run warmup iterations before starting measurements?
- [ ] **Statistically Significant Conclusions**: Did the agent verify that the null hypothesis is rejected using a p-value calculation?
- [ ] **Outliers Cleaned**: Did the agent filter out startup overhead or network timeouts from the core benchmark data?`,
  description:
    "empirical experiments, hypothesis testing, benchmarking, and statistical analysis",
  filename: "empirical-experiments",
  trigger: "model_decision"
});
