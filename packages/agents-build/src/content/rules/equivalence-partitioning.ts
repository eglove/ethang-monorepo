import { defineRule } from "../../define.ts";

export const equivalencePartitioning = defineRule({
  content: `# Equivalence Partitioning

## 1. Domain Theory and Conceptual Foundations
Equivalence Partitioning (EP) is a black-box test design technique that divides the input domain of a software component into distinct classes or partitions of data, under the assumption that all values within a given partition will be processed in a similar manner by the system. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing), EP is a foundational technique for maximizing state coverage while minimizing test redundancy, ensuring comprehensive input validation without requiring exhaustive testing of every individual input value.

### 1.1 The Equivalence Class Assumption
The core assumption of EP is that the behavior of the software is uniform across the entire span of an equivalence class:
- If a test case chooses a single representative value from a partition and the software handles it correctly, the system is assumed to handle all other values within that same partition correctly.
- Conversely, if a representative value exposes a defect, that same defect is assumed to be triggered by all other values in that partition.

Exhaustive testing (evaluating every possible input value) is mathematically impossible for even simple input domains. EP solves this by grouping infinite input spaces into finite, manageable classes.

### 1.2 Valid vs. Invalid Partitions
Input domains must be divided into:
- **Valid Partitions**: Classes of data that represent expected, correct inputs that the program must process successfully according to its specifications.
- **Invalid Partitions**: Classes of data that represent unexpected, out-of-range, or malformed inputs. The system must reject these inputs safely, logging validation failures and returning structured errors rather than crashing.

### 1.3 Identifying Partitions across Data Types
Partitions are derived from specifications and data type bounds:
- **Numeric Ranges**: If a specification accepts values between $a$ and $b$, three partitions are created: values $< a$ (invalid), values between $a$ and $b$ inclusive (valid), and values $> b$ (invalid).
- **String Inputs**: Partitions can represent string lengths (empty string, valid length, exceeding max length) and string formats (valid email pattern, malformed email, non-alphanumeric characters).
- **Collection Sets (Arrays/Objects)**: Partitions represent size bounds: empty collections, single-item collections, normal multi-item collections, and collections exceeding maximum size limits.
- **Enumerated Sets**: If the input is restricted to a set of enums, the valid partition contains the enum members, while the invalid partition contains any value outside that set.

### 1.4 Test Case Minimization and Coverage Efficacy
By selecting exactly one representative value from each partition, engineers significantly reduce the size of the test suite without decreasing its bug-detection probability. This prevents "test clutter" (hundreds of duplicate tests verifying the same code paths) and optimizes execution speed, which is critical for maintaining fast feedback loops in CI/CD pipelines.

### 1.5 Valid and Invalid Partition Boundaries and Non-Overlapping Constraints
To construct tests, developers map the boundaries where partitions interface:
- **Lower Boundaries**: The transition index from the lower invalid partition to the valid partition.
- **Upper Boundaries**: The transition index from the valid partition to the upper invalid partition.
- **Type Transitions**: The transition from correct data types (e.g., numbers) to incorrect types (e.g., strings, null, undefined).
- **Non-Overlapping Constraints**: A critical rule of partition design is that equivalence classes must be disjoint (non-overlapping). A single input value must belong to exactly one partition. If a value falls into multiple classes, the partition boundaries are poorly defined, leading to ambiguous test results.
Selecting representative values near these boundaries (or combining EP with Boundary-Value Analysis) ensures that both nominal execution paths and transition limits are thoroughly validated.

### 1.6 Multi-Dimensional Input Spaces and Combination Tactics
When a function accepts multiple independent parameters, the input space becomes multi-dimensional:
- **Cartesian Product**: Testing every combination of partitions across all inputs. If a function has three inputs with three partitions each, the Cartesian product yields $3 \\times 3 \\times 3 = 27$ test cases. This can cause test suite size explosion.
- **Each Choice**: Ensures that every partition of every input is tested at least once. This is the least rigorous combination tactic but minimizes the test count.
- **Base Choice**: A highly structured tactic where one "base choice" containing only valid partitions is selected (representing the golden nominal execution path). Subsequent test cases are created by holding all variables at their base choice value except one, which is toggled to an invalid partition. This isolates the error response paths cleanly.
- **Pairwise (All-Pairs) Testing**: A combinatorial method that tests all possible pairs of input parameters. Studies show that most software bugs are triggered by single input parameters or interactions between two parameters; pairwise testing maximizes defect detection while drastically reducing test counts relative to the Cartesian product.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when designing equivalence partition tests:

### Step 2.1: Enumerate the Input Domain Partitions
Analyze the specification or signature of the unit under test:
- List all input arguments and variables.
- Divide each variable's domain into valid and invalid partitions.
- Document these partitions in a table in the \`implementation_plan.md\`:

| Input Variable | Partition ID | Description | Valid / Invalid | Representative Value |
| :--- | :--- | :--- | :--- | :--- |
| score | P1_valid | $0 \\le$ score $\\le 100$ | Valid | 75 |
| score | P2_invalid | score $< 0$ | Invalid | -10 |
| score | P3_invalid | score $> 100$ | Invalid | 150 |

### Step 2.2: Select Representative Values
Choose exactly one input value for each defined partition:
- Ensure the representative value lies comfortably within the partition bounds.
- Avoid using boundary values for EP tests (keep them distinct from BVA tests to clarify test intent).

### Step 2.3: Design and Write Parameterized Tests
Implement the test cases using Vitest's parameterized syntax:
- Declare an \`it.each\` table containing columns for the representative input, partition name, and expected outcomes:
\`\`\`typescript
it.each([
  [75, "P1_valid", true],
  [-10, "P2_invalid", false],
  [150, "P3_invalid", false],
])("should handle score %i from partition %s", (score, partitionId, expectedValid) => {
  const result = validateScore(score);
  expect(result.isValid).toBe(expectedValid);
});
\`\`\`

### Step 2.4: Test Invalid Partitions for Robust Handling
Verify that the system handles invalid partitions safely:
- Assert that inputs from invalid partitions throw custom validation errors or return structured error messages (e.g., HTTP 400 Bad Request).
- Verify that no invalid partition input causes an unhandled system crash or unhandled promise rejection.

### Step 2.5: Execute and Validate Coverage
Run the target test suite:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build exec vitest run src/path/to/module.test.ts
\`\`\`
- Confirm that all test cases turn green, and verify that the code handles all partitions correctly.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding equivalence partitioning:

- [ ] **Input Domain Enumeration**: Have all input parameters been analyzed and partitioned?
- [ ] **Valid Partitions Defined**: Are expected, valid input classes explicitly documented?
- [ ] **Invalid Partitions Defined**: Are unexpected, malformed, or out-of-range input classes explicitly documented?
- [ ] **Representative Selections**: Is exactly one representative value chosen for each partition?
- [ ] **it.each Parameterization**: Are the partition test cases implemented using a parameterized \`it.each\` table?
- [ ] **Empty State Partition**: Is there a partition representing empty collection inputs (\`[]\`, \`{}\`, \`""\`)?
- [ ] **Null/Undefined Partition**: Is there an invalid partition representing missing values?
- [ ] **Error Path Assertions**: Do tests for invalid partitions assert that proper validation errors are thrown or returned?
- [ ] **No Overlapping Tests**: Did the agent verify that tests do not redundantly evaluate the same partition?
- [ ] **Zod Schema Alignment**: Do Zod validation schemas match the partitions verified by the tests?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Pairwise Optimization**: If testing multiple variables, was base choice or pairwise selection used to optimize combinations?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` document the partition mappings and testing outcomes?
- [ ] **Task List Sync**: Do tasks in \`task.md\` include partition enumeration, value selection, and test case construction?
- [ ] **Unchecked Index Access Safeguards**: Do test assertions use optional chaining when evaluating array results?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on partitioning helper classes declared with explicit accessibility modifiers?`,
  description:
    "equivalence partitioning, input domains, and optimizing test coverage",
  filename: "equivalence-partitioning",
  trigger: "model_decision"
});
