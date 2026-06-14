import { defineRule } from "../../define.ts";

export const mutationTestingAdequacy = defineRule({
  content: `# Mutation Testing Adequacy

## 1. Domain Theory and Conceptual Foundations
Mutation testing is a fault-injection verification methodology used to quantitatively evaluate the adequacy, strength, and error-detecting capabilities of an automated test suite. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing), mutation testing goes beyond traditional structural coverage metrics (such as statement, branch, or path coverage) by evaluating whether the tests actually assert the correctness of execution outcomes rather than merely executing lines of code.

### 1.1 Mutants and Fault Injection
In mutation testing, a tool (such as Stryker) automatically creates multiple copies of the production code and introduces a single, minor, syntactically valid modification (a **mutant**) into each copy.
- **Arithmetic Mutants**: Swapping operators (e.g., changing \`+\` to \`-\` or \`*\` to \`/\`).
- **Relational Mutants**: Changing comparison gates (e.g., changing \`<\` to \`<=\` or \`==\` to \`!=\`).
- **Logical Mutants**: Inverting boolean evaluations (e.g., changing \`&&\` to \`||\` or prefixing a variable with \`!\`).
- **Statement Mutants**: Deleting code statements or forcing early function returns.

### 1.2 Killing vs. Surviving Mutants
Once mutants are generated, the test suite is executed against each mutated codebase:
- **Killed Mutant**: At least one test case fails in response to the injected mutant. This is the desired outcome, proving that the test suite successfully detects defects in that specific line of code.
- **Surviving Mutant**: All tests continue to pass despite the injected modification. A surviving mutant reveals a critical gap in test coverage: either a code path is completely untested, or the tests execute the code but fail to assert its outcome (the "weak assertion" anti-pattern).

### 1.3 The Mutation Score Metric
The overall adequacy of the test suite is measured by the **Mutation Score**, calculated as:
$$\\text{Mutation Score} = \\left( \\frac{\\text{Killed Mutants}}{\\text{Total Mutants} - \\text{Equivalent Mutants}} \\right) \\times 100\\%$$

A high mutation score (typically $> 80\\%$) indicates a highly robust test suite capable of catching regression defects, while a low score indicates that code coverage numbers are artificially inflated by tests with weak or missing assertions.

### 1.4 Equivalent Mutants (False Positives)
An **Equivalent Mutant** is a modification that changes the source code syntax but preserves its exact runtime semantics. For example, changing a loop condition \`for (let i = 0; i < 10; i++)\` to \`for (let i = 0; i !== 10; i++)\` compiles and behaves identically. Because the program's observable behavior is unchanged, no test suite can ever kill an equivalent mutant. These represent false positives in mutation analysis and must be manually classified and excluded from the score denominator.

### 1.5 Mutation Operators and JavaScript-Specific Mutators
Different categories of mutation operators reveal different test suite deficiencies:
- **Logical Operator Replacement (LOR)**: Replaces logical operators with others (e.g., swapping \`&&\` and \`||\`). If this mutant survives, it proves that the tests do not verify combined conditional expressions thoroughly.
- **Relational Operator Replacement (ROR)**: Replaces comparisons (e.g., \`<\` to \`<=\`). Survival indicates a lack of boundary-value testing, as off-by-one errors are ignored.
- **JavaScript-Specific Mutators**: Modern tools mutate JS-specific features, such as changing template literals (e.g., replacing \`\` \${user.name} \`\` with empty strings), swapping array method calls (e.g., replacing \`map\` with \`forEach\`), or changing optional chaining operators (\`?.\` to direct member access \`.\`). If these survive, they reveal weak verification of data structures and UI output.
- **Mutator Tuning and Exclusions**: Because mutation runs are computationally expensive, tools allow engineers to customize configurations (e.g. \`stryker.config.json\`) to exclude specific classes of mutators or target folders (like loggers, debug adapters, or test helpers) that do not impact core business rules, optimizing pipeline build times.

### 1.6 The Coverage-Assertion Gap
A test suite can achieve 100% statement coverage while failing to kill basic mutants. Consider a function \`calculateTax(income)\` that computes a fee and writes it to a log database. A test that executes \`calculateTax(100000)\` without checking the database record or return value will report 100% coverage, but when a mutant changes the tax calculation logic, the test still passes:
- **Execution without Assertion**: The test calls the function, but lacks assertions (\`expect\`) verifying the output or side effects. The code runs, the coverage report looks green, but the test proves nothing.
- **Inadequate Mocking**: Tests mock out dependencies too broadly, returning stubbed values that mask the behavior of the code under test.
- **State Transition Gaps**: The test checks only the nominal success path, ignoring error states or callback parameters.

Analyzing surviving mutants allows engineers to design targeted tests that assert the precise outcomes of logical decisions.

### 1.7 Advanced Mutation Analysis and Performance Optimization
Because mutation testing requires executing the test suite against dozens or hundreds of compiled mutants, it is computationally expensive. SWEBOK v4 emphasizes that for mutation testing to be viable in real-world pipelines, optimization strategies must be applied:
- **Test Selection (Impact Analysis)**: Modern mutation tools analyze the code coverage map first to determine which specific tests execute the mutated line. Instead of running the entire suite, only the covering tests are run. If none of those tests fail, the mutant survives.
- **Incremental Analysis**: Only mutate files that have been modified in the current version control commit or change request, ignoring unmodified codebase branches.
- **AST-Based Filtering**: Restrict mutation operators on lines that perform trivial operations, such as configuration loading, logging, or debugging output, preventing "equivalent mutants" and reducing testing overhead.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when conducting mutation analysis:

### Step 2.1: Run the Mutation Testing Tool
Execute the mutation runner (such as Stryker) on the target package or file:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build exec stryker run --mutate src/path/to/file.ts
\`\`\`
- Review the output report, noting the total mutant count, killed mutants, and mutation score.

### Step 2.2: Locate and Inspect Surviving Mutants
Open the mutation report (typically an HTML layout under \`reports/mutation/\`):
- Drill down to the specific files and lines marked with surviving (red) mutants.
- Analyze the exact change introduced by the mutation tool (e.g., "Changed line 45: \`if (status === 'active')\` to \`if (true)\`").

### Step 2.3: Formulate a Test Assertion Hypothesis
Determine why the existing tests failed to detect the modification:
- Open the corresponding test file and trace the test cases that execute the mutated line of code.
- Identify what assertions are missing (e.g., "The test executes the active status branch but never asserts that the user's role is updated in the database").

### Step 2.4: Implement the Missing Assertions
Write targeted assertions to kill the mutant:
- Add a new test case or expand an existing test block to explicitly verify the behavior changed by the mutant.
- Run the test suite locally to confirm that it passes when the code is unmodified.

### Step 2.5: Re-run Mutation Analysis to Verify Defect Detection
Re-execute the mutation runner on the modified module:
- Confirm that the previously surviving mutant is now marked as "Killed".
- Verify that the overall mutation score increases.
- If the mutant still survives, evaluate if it is an equivalent mutant and document the finding.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding mutation testing:

- [ ] **Mutation Tool Execution**: Was the mutation testing runner executed on the modified code files?
- [ ] **Mutation Score Calculated**: Is the quantitative mutation score documented in the verification results?
- [ ] **Surviving Mutant Audit**: Has the agent inspected every surviving mutant to identify gaps in test assertions?
- [ ] **Assertion Adequacy**: Did the agent verify that tests contain meaningful \`expect\` assertions, rather than merely executing code paths?
- [ ] **Logical Mutants Killed**: Are all logical operator (\`&&\`, \`||\`) mutants successfully killed?
- [ ] **Boundary Mutants Killed**: Are all relational operator (\`<\`, \`<=\`) mutants killed at partition margins?
- [ ] **Return Value Assertions**: Are all function return value mutations captured and killed by the tests?
- [ ] **No Dummy Tests**: Has the agent verified that no test case exists solely to inflate coverage without checking outcomes?
- [ ] **Equivalent Mutant Log**: Are manually identified equivalent mutants documented and excluded from score targets?
- [ ] **Mock Isolation Check**: Did the agent verify that mocks do not return dummy values that hide mutation faults?
- [ ] **Workspace Tool Optimization**: Was the mutation runner restricted to the modified file subset to optimize time?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Failing Path Mutants**: Did the agent verify that error throwing mutations are caught and asserted in tests?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` record the mutation score improvements and list the killed mutants?
- [ ] **Task List Sync**: Do tasks in \`task.md\` outline mutation execution, mutant analysis, and test assertion rework?
- [ ] **Object Mutation Checked**: Have mutations affecting object property assignments been verified as killed?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on mutation helper classes declared with explicit accessibility modifiers?`,
  description: "mutation testing, test adequacy, and behavioral assertions",
  filename: "mutation-testing-adequacy",
  trigger: "model_decision"
});
