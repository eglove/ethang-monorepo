import { defineRule } from "../../define.ts";

export const performanceTuning = defineRule({
  content: `# Performance Tuning

## 1. Domain Theory and Conceptual Foundations
Performance tuning is the iterative process of optimizing software execution speed, memory consumption, and resource utilization based on empirical measurement and profiling. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design) and Chapter 6 (Software Construction), performance optimizations must always be driven by empirical data rather than developer intuition.

### 1.1 The Premature Optimization Fallacy
Donald Knuth famously stated: "Premature optimization is the root of all evil (or at least most of it) in programming." Optimizing code before measuring its actual performance:
- Degrades code readability and increases cognitive complexity.
- Wastes development effort on code paths that have negligible impact on overall run time.
- Introduces subtle regression bugs and concurrency issues.

Correctness and modifiability must always precede optimization. The software must first be made correct, then profiled, and only then optimized.

### 1.2 Profiling and the Pareto Principle (80/20 Rule)
Performance bottlenecks follow a Pareto distribution: approximately 80% of execution time is spent in 20% of the code (the "hot spots"). To locate these hot spots, developers use diagnostic tools:
- **CPU Profilers**: Measure the time spent in each function call, generating call graphs or flame graphs to highlight execution bottlenecks.
- **Memory Profilers / Heap Snapshots**: Trace memory allocations, garbage collection frequency, and object retention, helping developers locate memory leaks (e.g., uncleared interval timers, closures retaining outer scope variables, or detached DOM nodes).
- **Database Query Analyzers**: Render database execution plans, revealing slow queries, missing indexes, and un-optimized tables.

### 1.3 Algorithmic Refinement vs. Constant-Factor Tuning
Optimizations fall into two primary categories:
- **Algorithmic Optimizations**: Improving the theoretical time or space complexity of an algorithm (e.g., refactoring an $O(N^2)$ nested loop search into an $O(N)$ hash lookup). This provides scaling benefits that grow with input size.
- **Constant-Factor Tuning**: Micro-optimizations that reduce instruction counts or memory allocations without changing the algorithm's complexity class (e.g., using bitwise operations, inlining functions, or reusing object instances). These should only be applied to hot spots.

### 1.4 Cache Architectures and Query Optimization
In web applications, the most significant performance gains are achieved by optimizing database and network access:
- **Caching Policies**: Storing frequently accessed, read-heavy data in fast memory stores (such as Redis, edge KV caches, or client memory), bypassing database queries entirely.
- **N+1 Query Prevention**: Avoiding looping queries (where a parent query retrieves $N$ records, and a nested loop triggers $N$ individual child queries). Engineers resolve this by using relational SQL joins or batching query lookups.

### 1.5 Big-O Complexity and Algorithmic Tuning
Evaluating time and space complexity using Big-O notation is essential before selecting optimization tactics:
- **$O(1)$ Constant Time**: Ideal. Execution time is independent of input size (e.g., hash map lookups, array index retrieval).
- **$O(\\log N)$ Logarithmic**: Highly scalable. Time increases logarithmically with input size (e.g., binary search).
- **$O(N)$ Linear**: Scalable. Time grows proportionally with input size (e.g., single-pass array iteration).
- **$O(N \\log N)$ Linearithmic**: Acceptable for sorting and advanced algorithms (e.g., Merge Sort, Quick Sort).
- **$O(N^2)$ Quadratic**: Highly un-scalable. Nested loops that double execution cost for every item added (e.g., comparing every element in an array against every other element).

To optimize, engineers identify quadratic code blocks and apply data structures (like maps or sets) to reduce them to linear or constant time complexity. For example, replacing a nested loop lookup over a list of size $N$ with a single-pass creation of a Map, followed by $O(1)$ lookups, transitions the complexity from $O(N^2)$ to $O(N)$.

### 1.6 Database Query Profiling and Execution Plans
Optimizing persistent storage requires interpreting database query analyzer outputs (e.g., SQL \`EXPLAIN\` plans):
- **Full Table Scans**: The database engine reads every row in the table, indicating a missing index on the query's filter column. This must be resolved by adding an appropriate B-Tree or Hash index.
- **Index Scans**: The database traverses the index structure directly, representing a much faster lookup than a table scan.
  - **Index-Only Scan**: The database retrieves all requested fields directly from the index tree without loading the actual rows from the table, maximizing performance.
  - **Index Range Scan**: Traversing a range of values within the index (e.g., matching a date range).
- **Join Tactics**: Databases coordinate table joins using different algorithms:
  - **Nested Loops**: Best for small datasets. The engine loops over rows in one table and queries matching rows in another.
  - **Hash Joins**: Best for large datasets. The engine creates an in-memory hash table of the join keys from one table and scans the second table against it.
  - **Merge Joins**: Best for pre-sorted datasets. The engine scans two sorted indexes in parallel, merging matching keys.
- **Query Rewriting**: Refactoring complex subqueries into CTEs (Common Table Expressions) or joins to allow the optimizer to choose better execution paths.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when optimizing performance:

### Step 2.1: Establish Baseline Metrics
Before making any performance changes, the agent must measure and document baseline performance in the \`implementation_plan.md\`:
- Record response latency (average, 95th percentile, 99th percentile) under normal workload settings.
- Record memory utilization and CPU consumption metrics.
- Document the exact benchmarking environment and tools used.

### Step 2.2: Profile the Application to Locate Hot Spots
Run profilers on the code path being optimized:
- Capture flame graphs or execution traces during peak workloads.
- Audit database query plans for slow SQL queries, noting missing indexes or full table scans.
- Document the identified "hot spot" functions or queries in the \`implementation_plan.md\`.

### Step 2.3: Formulate and Implement Optimization Hypotheses
Develop and implement targeted optimizations:
- If a hot spot has quadratic complexity, rewrite it using lookup maps or indexes to reduce complexity to linear.
- If database N+1 queries exist, refactor the code to use joins or batch preloads.
- If repetitive network requests occur, configure caching with clear TTL and validation headers.

### Step 2.4: Execute Regression Benchmarking
Run the benchmarks again under the exact same conditions:
- Compare the new latency, CPU, and memory metrics directly against the baselines.
- Document the percentage improvements (e.g., "Latency reduced by 40%, memory allocation decreased by 15%").
- If the benchmarks show no significant improvement, revert the change to keep code simple.

### Step 2.5: Verify Code Correctness and Readability
Validate that optimizations have not introduced regressions:
- Run the full unit and integration test suite, ensuring no functional regressions exist.
- Ensure the optimized code remains readable and includes comments explaining non-obvious optimizations (e.g., explaining why a specific bitwise shift or custom hash is used).

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding performance tuning:

- [ ] **Baseline Performance Documented**: Are baseline latencies, memory, and CPU metrics recorded in the plan?
- [ ] **Profiler Execution**: Was a profiling tool run to identify actual hot spots before optimizing?
- [ ] **Hot Spot Isolation**: Is the optimization restricted to the identified hot spots (avoiding premature optimization)?
- [ ] **Big-O Complexity Audit**: Has the theoretical time complexity of the hot spot been analyzed and optimized?
- [ ] **N+1 Queries Resolved**: Did the agent verify that no database query loop (N+1) is present in the code?
- [ ] **Database Indexes Verified**: Are database indexes verified as present for all SQL query filter criteria?
- [ ] **Caching Strategy Implemented**: Is caching utilized for static, read-heavy, or expensive computed data?
- [ ] **Memory Allocation Audit**: Has the optimized code been checked to ensure it does not create memory leaks?
- [ ] **Edge Size Optimization**: Is the edge bundle size verified as remaining within environment limits?
- [ ] **Regression Benchmarking**: Were post-optimization benchmarks run and compared directly against the baseline?
- [ ] **Rollback on Null Improvement**: Did the agent revert the changes if benchmarking showed no significant gain?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Test Suite Green**: Did all unit and integration tests pass successfully after the optimizations were applied?
- [ ] **Code Readability Comments**: Are complex optimizations explained with clear inline comments?
- [ ] **Garbage Collection Check**: Was the code checked to ensure it doesn't trigger excessive garbage collection cycles?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` document the exact benchmarking metrics and profiling outcomes?
- [ ] **Task List Sync**: Do tasks in \`task.md\` outline baseline measurement, profiling, implementation, and benchmarking phases?
- [ ] **Query Execution Plan Checked**: Was SQL \`EXPLAIN\` run on all modified queries to verify index scans are used?
- [ ] **Explicit Member Access**: Are all methods and properties on optimization utility modules declared with explicit accessibility modifiers?`,
  description:
    "performance profiling, execution hot spots, database query plans, and targeted tuning",
  filename: "performance-tuning",
  trigger: "model_decision"
});
