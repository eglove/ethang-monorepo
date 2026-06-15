---
description: boundary-value analysis, test design, and off-by-one error detection
trigger: model_decision
---

# Boundary-Value Analysis

## 1. Domain Theory and Conceptual Foundations
Boundary-Value Analysis (BVA) is a fundamental black-box test design technique that focuses on identifying and testing values at the margins of equivalence partitions. As documented in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing), software defects are highly concentrated around the edges of input domains rather than inside them. Consequently, BVA is a highly efficient technique for exposing coding defects with a minimal number of test cases.

### 1.1 The Equivalence Partitioning Synergy
BVA cannot be conducted in isolation. It relies on **Equivalence Partitioning (EP)**:
- **Equivalence Partitioning**: The practice of dividing the input domain of a program into classes of data (partitions) from which test cases can be derived. The core assumption is that if one value in a partition exposes a bug, all other values in that same partition will also expose it.
- **Boundary-Value Analysis**: Focuses test design directly at the transition edges between adjacent partitions, where the behavior of the system changes from valid to invalid, or between different processing modes.

### 1.2 The Mechanics of Off-by-One Errors
Boundary values are highly error-prone due to the implementation details of conditional branching and loops. Common developer mistakes include:
- Using incorrect comparison operators (e.g., using `<` instead of `<=`, or `>` instead of `>=`).
- Loop termination errors, where iterations run one time too many or too few.
- Off-by-one index calculations when parsing arrays or substrings.

By targeting the exact transition boundaries, BVA mathematically guarantees the exposure of these off-by-one errors.

### 1.3 Boundary Selection Tactics (2-Value vs. 3-Value Testing)
Test designers use two primary models for boundary testing:
1. **2-Value Testing**: For each boundary ($b$), the designer tests the boundary value itself ($b$) and the value immediately adjacent to it on the opposite side of the boundary ($b+1$ or $b-1$, depending on whether it is an upper or lower boundary).
2. **3-Value Testing**: For each boundary ($b$), the designer tests three values: the boundary value itself ($b$), the value immediately below ($b-1$), and the value immediately above ($b+1$). While 3-value testing increases the test count, it is essential for verifying strict inequalities where the transition margin is narrow.

### 1.4 Extreme and Environmental Boundaries
In addition to specification-defined boundaries, engineers must evaluate environmental limits:
- **Empty States**: Zero-length inputs (empty strings, empty arrays, or empty tables).
- **Null and Undefined**: Missing properties and undefined objects.
- **Overflow Values**: Max integers, number limits, or string lengths that exceed buffer sizes.
- **Index Out-of-Bounds**: Accessing offsets beyond array bounds.

### 1.5 Multi-Variable Boundary Collision and Equivalence Partitioning Synergy
To apply BVA effectively, developers first map out the partitions. For example, if a function accepts a age input between 18 and 65:
- **Partition 1 (Invalid)**: Age $< 18$.
- **Partition 2 (Valid)**: $18 \le$ Age $\le 65$.
- **Partition 3 (Invalid)**: Age $> 65$.

BVA evaluates the transition margins:
- Lower Boundary (18): Test 17 (invalid), 18 (valid), and 19 (valid).
- Upper Boundary (65): Test 64 (valid), 65 (valid), and 66 (invalid).

In complex systems, **Multi-Variable BVA** must be used. When a system's behavior depends on multiple bounded inputs simultaneously (e.g., age and income), testing boundaries in isolation is insufficient. Engineers must test the intersections of boundaries (the corner cases) where boundary values collide (e.g., testing age 18 exactly with minimum wage limits).
Additionally, testing boundaries on floating-point numbers requires declaring a precision tolerance ($\epsilon$, e.g., $10^{-6}$). Because binary representations of floats suffer from rounding errors, checking $b \pm 1$ is inappropriate; instead, engineers test $b \pm \epsilon$ to verify the exact decision threshold.

### 1.6 Timezone and Calendar Boundaries
Loop boundaries represent a frequent source of index out-of-bounds crashes:
- **Loop Initialization and Termination**: Testing the first element index (usually 0) and the final index (`length - 1`).
- **Array Offsets**: Accessing index `length` (which must return undefined or throw an exception in strict environments).
- **Date and Timezone Boundaries**: Dates represent highly complex boundaries due to leap years, leap seconds, Gregorian calendar transitions, and timezone offsets. Under timezone transformations, a boundary date (like midnight on December 31) can shift forward or backward by hours (e.g., shifting from Eastern Standard Time (EST) to Coordinated Universal Time (UTC) introduces a 5-hour boundary offset), causing off-by-one calculation failures. The **Year 2038 Problem** represents another critical epoch boundary, where 32-bit signed integers overflow, wrapping Unix timestamps back to 1901. Native `Date` manipulation and constructor calls are strictly banned in this workspace to prevent timezone boundary drift; engineers must use the Luxon `DateTime` library to explicitly localize and clamp dates to a fixed zone, ensuring test execution consistency across different development environments and CI servers.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when designing boundary tests:

### Step 2.1: Enumerate Input Partitions and Boundaries
Analyze the feature specification or function signature:
- Identify all input variables and their constraints (e.g., string lengths, number ranges, array capacities).
- Document the valid and invalid partitions and their boundaries in the `implementation_plan.md`.

### Step 2.2: Select the Boundary Target Values
For each identified boundary:
- Select the exact boundary value ($b$).
- Select the value just below ($b-1$).
- Select the value just above ($b+1$).
- Document these values as the "Boundary Test Cases" in the plan.

### Step 2.3: Write Parameterized Boundary Tests
Implement the test cases using Vitest's parameterized syntax:
- Declare an `it.each` table containing columns for the input value, expected validation result, and expected output or error message:
```typescript
it.each([
  [17, false, "Underage"],
  [18, true, "Success"],
  [19, true, "Success"],
  [64, true, "Success"],
  [65, true, "Success"],
  [66, false, "Overage"],
])("should validate age %i correctly", (age, expectedValid, expectedResult) => {
  const result = validateAge(age);
  expect(result.isValid).toBe(expectedValid);
});
```

### Step 2.4: Assert Extreme and Empty Boundaries
Ensure that edge case structures are explicitly verified in the test file:
- Pass empty arrays (`[]`), empty objects (`{}`), and empty strings (`""`) to the unit under test.
- Verify that the module handles these inputs gracefully (e.g., returning an empty list, throwing a validation error, or using fallback values) without throwing unhandled exceptions.

### Step 2.5: Run the Verification Suite
Execute the tests locally:
```bash
rtk pnpm --filter @ethang/agents-build exec vitest run src/path/to/module.test.ts
```
- Confirm that all boundary cases pass.
- Fix any off-by-one errors in the production code if tests fail.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding boundary-value analysis:

- [ ] **Boundary Identification**: Have all input partitions and their transition boundaries been identified and documented?
- [ ] **3-Value Testing Applied**: Are test cases written for the boundary ($b$), just below ($b-1$), and just above ($b+1$)?
- [ ] **it.each Parameterization**: Are the boundary test cases implemented using a parameterized `it.each` table?
- [ ] **Empty String tested**: Is the behavior of empty string inputs (`""`) explicitly asserted?
- [ ] **Empty Array tested**: Is the behavior of empty array inputs (`[]`) explicitly asserted?
- [ ] **Null/Undefined Handling**: Has the agent verified that null and undefined values do not cause runtime crashes?
- [ ] **Max Length Constraints**: Are inputs that meet or exceed maximum length constraints included in the tests?
- [ ] **Off-by-One Loop Verification**: Has the code been inspected to ensure comparison operators (`<` vs `<=`) match specifications?
- [ ] **Integer Overflow checked**: Are maximum integer limits tested if working with numeric bounds?
- [ ] **Validation Schema Alignment**: Do Zod or schema constraints match the boundaries verified by the tests?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Failure paths tested**: Are invalid boundary inputs verified as throwing or returning structured errors?
- [ ] **Index Out-of-Bounds Guard**: Did the agent verify that array slicing and index offsets are guarded against out-of-bounds errors?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` confirm that all boundary tests have been executed successfully?
- [ ] **Task List Sync**: Do tasks in `task.md` include the enumeration and testing of boundary values?
- [ ] **Unchecked Index Access Safeguards**: Do test assertions use optional chaining when accessing array indices?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Explicit Member Access**: Are all methods and properties on boundary helper classes declared with explicit accessibility modifiers?
