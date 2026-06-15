import { defineRule } from "../../define.ts";

export const tableDrivenConstruction = defineRule({
  content: `# Table-Driven Construction

## 1. Domain Theory and Conceptual Foundations
Table-driven construction is a software construction methodology where complex, deeply nested conditional control flows (such as long \`if-else\` chains or large \`switch\` statements) are replaced by data-driven lookup tables. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6 (Software Construction), table-driven construction is a powerful technique for reducing cyclomatic and cognitive complexity, isolating logical variations, and improving code maintainability.

### 1.1 Cyclomatic and Cognitive Complexity Reduction
- **Cyclomatic Complexity**: Measures the number of linearly independent paths through a program's source code, calculated using Thomas McCabe's formula: $M = E - N + 2P$ (where $E$ is edges, $N$ is nodes, and $P$ is connected components). Every conditional branch (\`if\`, \`case\`, \`&&\`, \`||\`) increases cyclomatic complexity, making code harder to comprehend, test, and maintain.
- **Cognitive Complexity**: Measures how difficult a control flow is to understand for a human reader. Nested conditionals degrade cognitive flow, as the reader must hold multiple nested states in working memory.

Table-driven construction flattens this complexity. By replacing branches with an $O(1)$ lookup table, the cyclomatic complexity of the execution block drops to 1, regardless of how many logical branches are handled by the data structure.

### 1.2 Data-Control Separation and Modifiability
The core philosophy of table-driven design is the strict separation of **data** (the options, parameters, and rules) from **control flow** (the execution engine). When rules or behaviors change:
- In control-driven code, developers must modify and compile executable code blocks, risking regression bugs in adjacent branches.
- In table-driven code, developers merely update the lookup table data. The execution logic remains untouched, allowing modifications to be made safely and sometimes even dynamically at runtime (e.g., loading config rules from JSON files or KV stores).

### 1.3 Lookup Methods: Direct, Indexed, and Stair-Step
Table lookups are classified by how keys map to values:
- **Direct Access**: The search key maps directly to the table index or key (e.g., using an enum or string identifier directly as a map key). This is the simplest and fastest lookup pattern.
- **Indexed Access**: Used when keys are sparse or non-sequential. Instead of creating a massive, sparse direct table, an intermediate index table translates the search key into a sequential index, which is then used to access the main data table.
- **Stair-Step Access**: Used when keys fall into continuous ranges or brackets (e.g., mapping grading percentages to letter grades, or age groups to tax rates). The table stores the upper/lower bounds of each range, and the logic iterates through the bounds to locate the target bracket.

### 1.4 Dynamic Behavior Tables (Function Tables)
Tables do not just store static values. In modern programming languages (such as JavaScript and TypeScript, where functions are first-class citizens), lookup tables can store function references, lambdas, or command objects. This allows the system to resolve and execute behaviors dynamically based on the lookup key, replacing polymorphic switch blocks or complex class factory designs.

### 1.5 Lookup Methods Taxonomy
Selecting the appropriate lookup structure depends on the key distribution and complexity requirements:
- **Hash Table Mapping**: Provides $O(1)$ average-case lookup time. Best suited for discrete string or enum keys. The javascript engine translates keys into array offsets using an internal hash function. However, hash tables incur spatial memory overhead since they store both keys and values and require internal padding to prevent collision degradation.
- **Binary Search Trees / Sorted Arrays**: Provides $O(\\log N)$ search time. Best suited for stair-step ranges where keys are numbers or dates. Instead of scanning linearly, the lookup binary-searches the sorted keys to find the active bracket. This has minimal memory overhead ($O(N)$ space) and requires sorting the keys prior to lookups.
- **Parallel Arrays**: A historical pattern where two or more arrays of equal size are coordinated (e.g., one storing keys, the other values). While simple, this is prone to synchronization errors during maintenance, and modern developers must use array of tuples or unified maps instead.

### 1.6 Dynamic Behavioral and Hierarchical Tables
Storing executable behavior inside data structures allows for dynamic runtime composition:
- **Command Dispatchers**: Instead of a massive \`switch\` block handling API command strings, dispatchers use a map: \`Map<string, CommandHandler>\`. When a message arrives, the dispatcher retrieves the command from the map and executes it.
- **State Transition Matrices**: FSM transitions can be fully modeled as a table: \`Map<State, Map<Event, State>>\`. Transition validation and execution are handled by querying this table, eliminating nested conditional logic inside state machine engines.
- **Hierarchical Lookup Tables**: Handling multi-dimensional decision spaces (e.g., resolving a logic tree based on country, user role, and operation status) by nesting lookup tables: \`Map<Country, Map<Role, Config>>\`. This flattens what would be a nested triple-loop conditional structure into nested lookup references.
- **Lambda Registries**: Allowing plugins or submodules to register their custom handlers at runtime, promoting open-closed design principles.
- **Rules Engines**: Tables storing combinations of predicates (functions returning booleans) and actions. The engine loops over the table, executing the action of the first predicate that returns true.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when implementing table-driven logic:

### Step 2.1: Identify Candidate Conditional Logic
Scan the codebase for candidate refactoring blocks:
- Long \`if-else\` or \`switch\` blocks (greater than 4 branches) checking the same variable.
- Deeply nested conditional structures that compute a static configuration or execute a set of discrete tasks.

### Step 2.2: Define the Table Schema and Access Key
Design the lookup map structure:
- If keys are discrete strings or enums, define a TypeScript type representing the table schema, ensuring full type safety:
\`\`\`typescript
type Handler = (data: RequestData) => Promise<Response>;
const routeMap: Record<string, Handler> = {
  "/users": getUsersHandler,
  "/billing": getBillingHandler,
};
\`\`\`
- If values fall in continuous ranges, design a stair-step array sorted in ascending order.

### Step 2.3: Populate the Lookup Structure
Extract the logic branches into the lookup data:
- Declare the map or array as a static constant outside the execution function.
- Ensure all lookup values or function references are fully defined.
- Provide a clear fallback default value or error handler for missing keys.

### Step 2.4: Refactor the Control Flow
Replace the conditional branches with the lookup access:
- Use brackets notation to access the table dynamically based on the search key:
\`\`\`typescript
const handler = routeMap[urlPath];
if (!handler) {
  return handleNotFound();
}
return handler(data);
\`\`\`
- Ensure the complexity of the calling function remains flat and easy to read.

### Step 2.5: Write Parameterized Tests for the Table
Implement exhaustive tests verifying all lookup cases:
- Use Vitest \`it.each\` tables to verify every key-value mapping.
- Test boundary values (such as range edges in stair-step lookups).
- Test that missing keys correctly trigger the fallback default value or throw the expected exception.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding table-driven construction:

- [ ] **Conditional Refactoring**: Have large conditional chains (greater than 4 branches) been refactored into lookup tables?
- [ ] **Data-Control Separation**: Is the lookup table declared as a static data structure outside the execution function?
- [ ] **Type-Safe Schema**: Is the lookup table typed explicitly using TypeScript record or interface types?
- [ ] **Lookup Method Selection**: Was the correct lookup style (Direct, Indexed, or Stair-step) applied for the data domain?
- [ ] **Fallback Handler Configured**: Is there a default fallback value or handler registered for unmapped keys?
- [ ] **No Hardcoded Lookups**: Did the agent verify that lookups are dynamic and do not contain inline hardcoded exceptions?
- [ ] **Cognitive Complexity Reductions**: Has the calling function's cognitive complexity been verified as minimized?
- [ ] **Function Reference Usage**: If executing behaviors, does the table store function references or command instances?
- [ ] **Stair-Step Sorting**: If implementing a stair-step range lookup, is the array sorted in ascending order?
- [ ] **it.each Parameterized Tests**: Were parameterized tests (\`it.each\`) written to assert lookups for all inputs?
- [ ] **Boundary Tests for Ranges**: Are the range boundaries (bounds - 1, bounds, bounds + 1) tested for stair-step tables?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Dynamic Registries Checked**: If the table is dynamic, are there thread-safe or concurrency protections during writes?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` document the transition from control-flow to table-lookup?
- [ ] **Task List Sync**: Do tasks in \`task.md\` outline table schema definition, mapping, and parameterized testing?
- [ ] **Index Signature Property Access**: Are table lookups using bracket notation (\`obj[key]\`) rather than dot notation?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on lookup helper classes declared with explicit accessibility modifiers?`,
  description:
    "table-driven construction, lookup tables, and state transition maps",
  filename: "table-driven-construction",
  trigger: "model_decision"
});
