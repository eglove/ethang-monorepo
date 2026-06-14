import { defineRule } from "../../define.ts";

export const stateBasedModeling = defineRule({
  content: `# State-Based Modeling

## 1. Domain Theory and Conceptual Foundations
State-based modeling is a mathematical and engineering methodology used to model, analyze, implement, and verify the behavior of reactive and stateful systems. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 11 (Software Models and Methods) and Chapter 5 (Software Testing), state-based modeling represents a system as a discrete set of states, transitions between those states triggered by events, and guards that restrict transitions. This approach is essential for verifying system completeness, eliminating race conditions, and designing deterministic software architectures.

### 1.1 Finite State Machines: Moore vs. Mealy
At the core of state-based modeling are Finite State Machines (FSMs), which represent mathematical models of computation. An FSM is defined by a 5-tuple:
$$M = (S, \\Sigma, \\delta, s_0, F)$$

Where:
- $S$ is a finite set of states.
- $\\Sigma$ is a finite set of input symbols (events).
- $\\delta$ is the state transition function: $\\delta: S \\times \\Sigma \\to S$.
- $s_0 \\in S$ is the initial state.
- $F \\subseteq S$ is the set of final (terminal) states.

FSMs are classified into two primary categories based on how outputs are generated:
1. **Moore Machines**: Outputs are determined solely by the current state. The output function is defined as $\\lambda: S \\to Y$, where $Y$ is the output alphabet. Output changes occur only when the state changes.
2. **Mealy Machines**: Outputs are determined by both the current state and the input event. The output function is defined as $\\lambda: S \\times \\Sigma \\to Y$. Mealy machines often require fewer states than Moore machines to represent the same logic, but state transitions can trigger immediate outputs.

### 1.2 Harel Statecharts
Traditional FSMs suffer from the state explosion problem when applied to complex systems; the number of states grows exponentially as concurrent variables are added. David Harel introduced Harel Statecharts to solve this by adding hierarchy, concurrency, and history:
- **Hierarchy (OR-states)**: States can contain nested sub-states. If a system is in a sub-state, it is also implicitly in the parent super-state. This allows sharing of common transitions and reduces duplicate transition lines.
- **Concurrency (AND-states / Orthogonal Regions)**: Statecharts can be divided into orthogonal regions that run in parallel. The system is simultaneously in one sub-state of each region (e.g. a text editor being in 'Bold' and 'Italic' states concurrently). The state-space is the Cartesian product of the orthogonal states:
$$S_{\\text{total}} = S_1 \\times S_2 \\times \\dots \\times S_n$$
- **History (H / H\\*)**: History states allow a region to remember its last active sub-state before transitioning out. When re-entering, the statechart returns to the remembered state instead of resetting to the default initial sub-state. Shallow history ($H$) remembers the top-level sub-state; deep history ($H\\*$) recursively remembers nested sub-states.
- **Actions and Guards**: Transitions can execute actions on entry (\`entry/\`), on exit (\`exit/\`), or during transition (\`effect/\`). Guards ($[G]$) are boolean conditions that must evaluate to true for the transition to fire.

### 1.3 State Transition Tables
A state transition table is a tabular representation of the state transition function $\\delta$. It exhaustively maps every combination of current state (rows) and input event (columns) to the resulting next state and output action.

| Current State | Input / Event | Guard Condition | Next State | Action / Output |
| :--- | :--- | :--- | :--- | :--- |
| \`idle\` | \`FETCH_DATA\` | -- | \`loading\` | \`triggerFetch()\` |
| \`loading\` | \`FETCH_SUCCESS\` | \`data.length > 0\` | \`loaded\` | \`renderTable()\` |
| \`loading\` | \`FETCH_SUCCESS\` | \`data.length === 0\` | \`empty\` | \`renderEmpty()\` |
| \`loading\` | \`FETCH_FAILURE\` | -- | \`error\` | \`showBanner()\` |

Exhaustive state tables ensure that every possible event is accounted for in every state, preventing unhandled transitions (which lead to undefined behavior or silent crashes).

### 1.4 State Verification and Reachability Analysis
State-based verification ensures that the FSM design satisfies safety and liveness properties:
- **Safety**: "Bad things never happen" (e.g., the system never enters an invalid state like transferring funds from an empty account). Verified by showing that no sequence of events leads from $s_0$ to an unsafe state.
- **Liveness**: "Good things eventually happen" (e.g., if a request is sent, a response is eventually received). Verified using reachability analysis to ensure there are no deadlocks (states with no outgoing transitions except for valid terminal states) or livelocks (infinite loops between non-terminal states that perform no useful work).

## 2. Standard Operating Procedures (SOP)
The agent must design and verify stateful code according to the following procedures:

### Step 2.1: Enumerate States, Transitions, and Guards
Before writing any code or tests:
- Review the acceptance criteria to identify all states, inputs/transitions, and guards.
- Construct a state transition table using the Markdown template in [tdd-state-coverage.md](file:///c:/Users/glove/projects/ethang-monorepo/.agents/rules/tdd-state-coverage.md).
- Enumerate the initial state and all terminal states.

### Step 2.2: Implement Deterministic FSMs in TypeScript
To implement the FSM without side-effects:
- Use discriminated union types for the FSM states and events to enforce compile-time type safety.
- Keep the state representation flat and readonly.
- Implement the transition function as a pure reducer:
\`\`\`typescript
type State = 
  | { readonly type: "idle" }
  | { readonly type: "loading" }
  | { readonly type: "loaded"; readonly data: readonly string[] }
  | { readonly type: "error"; readonly message: string };

type Event = 
  | { readonly type: "FETCH" }
  | { readonly type: "SUCCESS"; readonly data: readonly string[] }
  | { readonly type: "FAILURE"; readonly error: string };

const stateReducer = (state: State, event: Event): State => {
  switch (state.type) {
    case "idle":
      return event.type === "FETCH" ? { type: "loading" } : state;
    case "loading":
      if (event.type === "SUCCESS") {
        return event.data.length > 0
          ? { type: "loaded", data: event.data }
          : { type: "idle" }; // or empty state
      }
      return event.type === "FAILURE" ? { type: "error", message: event.error } : state;
    default:
      return state;
  }
};
\`\`\`

### Step 2.3: Handle Side-Effects Separately
- Do not execute asynchronous actions or API requests inside the transition reducer. The reducer must remain a pure function.
- Trigger side-effects in response to state changes (e.g. using React \`useEffect\` or TanStack Query callbacks) by observing state transitions.

### Step 2.4: Write Parametric Tests for State Coverage
- Map every row of the state transition table directly to a test case in a Vitest test file.
- Use Vitest \`it.each\` to verify multiple transitions in a single parameterized block:
\`\`\`typescript
const transitionCases = [
  { current: "idle", event: { type: "FETCH" }, expected: "loading" },
  { current: "loading", event: { type: "FAILURE", error: "Failed" }, expected: "error" }
] as const;

it.each(transitionCases)("transitions from $current to $expected", ({ current, event, expected }) => {
  // Setup and assertion logic
});
\`\`\`
- Verify both the success (guard true) and fail (guard false) paths of guarded transitions.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following state-based modeling rules:

- [ ] **State Table Written**: Did the agent document a complete state transition table in the design phase or plan?
- [ ] **Initial State Identified**: Is the initial system state explicitly defined and tested?
- [ ] **Terminal States Verified**: Are all terminal states identified, verified as terminal, and covered by test assertions?
- [ ] **Discriminated Unions Used**: Are FSM states and events implemented as TypeScript discriminated unions?
- [ ] **State Reducer is Pure**: Is the state transition function a pure function free of API calls, timers, or side-effects?
- [ ] **Guard Conditions Enforced**: Are all transition guard conditions modeled explicitly in the code and tested?
- [ ] **Exhaustiveness Checked**: Does the state reducer utilize typescript \`never\` exhaustiveness checks in switch-case default branches?
- [ ] **Immutability Enforced**: Are all state types and event interfaces defined with the \`readonly\` keyword?
- [ ] **Orthogonal Regions Documented**: If the system contains orthogonal regions, is their Cartesian state space documented?
- [ ] **Parameterized Tests Utilized**: Did the agent use Vitest \`it.each\` to test the state transition table rows?
- [ ] **Livelock/Deadlock Checked**: Did the agent verify that there are no unhandled states that trap the execution flow?
- [ ] **Guard True and False Tested**: Were all transition guards verified with conditions evaluating to both true and false?
- [ ] **No Native Dates**: Are state models using Luxon (\`DateTime\`) for any date-based transitions or invariants?
- [ ] **Forbidden Words Checked**: Has the rule been scanned to confirm no banned enterprise names or forbidden tools are mentioned?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are state transitions, guard metrics, and test coverage logs documented in \`walkthrough.md\`?
- [ ] **Index Signature Bracket Access**: Are object attributes accessed via bracket notation on dynamic index-signature objects?
- [ ] **Void Assertions Wrapped**: Are unit test cases for void assertions wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Arrow Functions Preferred**: Are all functions declared as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent resolution mismatches?`,
  description:
    "state-based modeling, finite state machines, statecharts, transition tables, and state verification",
  filename: "state-based-modeling",
  trigger: "model_decision"
});
