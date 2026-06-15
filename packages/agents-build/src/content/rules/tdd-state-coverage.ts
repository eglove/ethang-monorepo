import { defineRule } from "../../define.ts";

export const tddStateCoverage = defineRule({
  content: `# State Machine Coverage

## 1. Domain Theory and Conceptual Foundations
The application of Finite State Machine (FSM) theory to software testing is a foundational methodology in software quality assurance, as defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5 (Software Testing) and Chapter 11 (Software Quality). In complex software architectures, especially those handling asynchronous events, user interfaces, or network state transitions, systems are best understood as reactive entities. A reactive system does not merely compute a function from input to output and terminate; instead, it maintains an ongoing interaction with its environment, transitioning between discrete configurations in response to external stimuli.

Formally, a Finite State Machine is modeled as a mathematical quintuple:

$$M = (S, \\Sigma, \\delta, s_0, F)$$

Where:
- $S$ is a finite, non-empty set of state configurations representing the stable rest points of the system.
- $\\Sigma$ is a finite set of input events or stimuli that trigger state transitions.
- $\\delta$ is the state transition function mapping the current state and input to the next state: $\\delta: S \\times \\Sigma \\to S$.
- $s_0 \\in S$ is the designated initial state of the machine.
- $F \\subseteq S$ is the set of final, accepting, or terminal states.

### 1.1 Mealy vs. Moore Machines in Web Engineering
In state machine theory, two primary models dictate output generation:
- **Mealy Machine**: The output values are determined by both its current state and the current inputs (triggers). Mealy models are common in action-oriented systems (e.g., executing a database write during a transition).
- **Moore Machine**: The output values are determined solely by its current state. Moore models are common in state-oriented UI rendering, where the interface is a pure function of the state.

Understanding this distinction allows developers to design clean state machines where side-effects (Mealy outputs) are cleanly decoupled from state transitions (Moore renders).

### 1.2 State Space Explosion and Hierarchical Statecharts
A primary challenge in FSM testing is the state space explosion, where concurrent state variables combine to create an unmanageable number of possible global states. If a system has $n$ binary variables, the state space is $2^n$. To mitigate this, developers apply David Harel's Statecharts, which extend FSMs by introducing:
- **Hierarchy (Nested States)**: States can contain other sub-states. A transition from a parent state applies to all sub-states.
- **Concurrency (Orthogonal Regions)**: Multiple state machines run in parallel, representing independent variables (e.g., network connectivity status running orthogonally to the authentication state).
- **History States**: A transition can return to the last active sub-state when entering a composite state.

## 2. Standard Operating Procedures (SOP)
To achieve complete state coverage, developers and agents must adhere to the following procedures during requirements analysis, software construction, and test implementation.

### Step 2.1: Requirements Parsing and State Identification
Analyze the acceptance criteria of the feature to extract states, events, guards, and terminal states:
1. **State Extraction**: Look for adjectives and status indicators in the requirements (e.g., "loading", "pending approval", "empty search results", "disconnected").
2. **Event Extraction**: Identify action verbs and asynchronous inputs (e.g., "user clicks submit", "fetch resolves", "socket disconnects", "timer expires").
3. **Guard Extraction**: Isolate conditional logic that determines if an event should proceed (e.g., "only if the cart is not empty", "if the user has the Administrator role").
4. **Terminal State Extraction**: Identify final states where the system ceases active processing or redirects the user (e.g., "payment confirmed", "session expired").

### Step 2.2: Establish the State Transition Table
Before writing any code or tests, document the state machine in a structured table. This table serves as the specification against which test cases are designed.

| Source State | Trigger Event | Guard Condition | Target State | Expected Output Behavior |
|---|---|---|---|---|
| \`uninitialized\` | \`MOUNT\` | None | \`loading\` | Trigger API request, show skeleton UI |
| \`loading\` | \`LOAD_SUCCESS\` | \`data.length === 0\` | \`empty-state\` | Hide spinner, render "No Results" message |
| \`loading\` | \`LOAD_SUCCESS\` | \`data.length > 0\` | \`display-list\` | Hide spinner, render list of items |
| \`loading\` | \`LOAD_FAILURE\` | None | \`error-state\` | Hide spinner, render error banner with retry |
| \`display-list\` | \`EDIT_CLICK\` | \`user.role === "admin"\` | \`editing-modal\` | Render overlay editor with selected item data |
| \`display-list\` | \`EDIT_CLICK\` | \`user.role !== "admin"\` | \`display-list\` | Show unauthorized toast, suppress modal |
| \`editing-modal\`| \`SUBMIT_SUCCESS\`| None | \`display-list\` | Show success notification, refresh list data |
| \`error-state\` | \`RETRY\` | None | \`loading\` | Clear error, re-trigger API request |

### Step 2.3: Type-Safe State Machine Implementation
Implement the transition function in TypeScript using discriminated unions:

\`\`\`typescript
import { vi } from "vitest";

type State = 
  | { readonly status: "uninitialized" }
  | { readonly status: "loading" }
  | { readonly status: "display-list"; readonly items: string[] }
  | { readonly status: "error-state"; readonly message: string };

type Event = 
  | { readonly type: "MOUNT" }
  | { readonly type: "LOAD_SUCCESS"; readonly payload: string[] }
  | { readonly type: "LOAD_FAILURE"; readonly error: string };

class AccountStateController {
  private state: State;

  public constructor() {
    this.state = { status: "uninitialized" };
  }

  public getState = (): State => {
    return this.state;
  };

  public transition = (event: Event): void => {
    const currentState = this.state;

    if ("uninitialized" === currentState["status"] && "MOUNT" === event["type"]) {
      this.state = { status: "loading" };
      return;
    }

    if ("loading" === currentState["status"]) {
      if ("LOAD_SUCCESS" === event["type"]) {
        this.state = { status: "display-list", items: event["payload"] };
        return;
      }
      if ("LOAD_FAILURE" === event["type"]) {
        this.state = { status: "error-state", message: event["error"] };
        return;
      }
    }
  };
}
\`\`\`

### Step 2.4: Parameterized State Testing using Vitest
Convert the rows of the state table directly into a parameterized test suite using Vitest's \`it.each\` method.

\`\`\`typescript
describe("AccountStateController Transitions", () => {
  it("should initialize in uninitialized state", () => {
    const controller = new AccountStateController();
    expect(controller.getState()["status"]).toBe("uninitialized");
  });

  it("should transition to loading on MOUNT", () => {
    const controller = new AccountStateController();
    controller.transition({ type: "MOUNT" });
    expect(controller.getState()["status"]).toBe("loading");
  });

  it.each([
    {
      events: [{ type: "MOUNT" as const }, { type: "LOAD_SUCCESS" as const, payload: ["Item 1", "Item 2"] }],
      expectedStatus: "display-list",
      assertion: (state: State) => {
        expect(state["status"]).toBe("display-list");
        if ("display-list" === state["status"]) {
          expect(state["items"]).toHaveLength(2);
        }
      }
    },
    {
      events: [{ type: "MOUNT" as const }, { type: "LOAD_FAILURE" as const, error: "Network Error" }],
      expectedStatus: "error-state",
      assertion: (state: State) => {
        expect(state["status"]).toBe("error-state");
        if ("error-state" === state["status"]) {
          expect(state["message"]).toBe("Network Error");
        }
      }
    }
  ])("should transition events to status $expectedStatus", ({ events, assertion }) => {
    const controller = new AccountStateController();
    for (const event of events) {
      controller.transition(event);
    }
    assertion(controller.getState());
  });
});
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following state machine criteria during implementation:

- [ ] **State Enumeration Complete**: Did the agent compile a complete list of all states, events, and transitions?
- [ ] **State Transition Table Present**: Is the State Transition Table documented in the execution plan or code comments?
- [ ] **Initial State Tested**: Is there a unit test asserting the system's default state on initialization?
- [ ] **State Coverage Achieved**: Does the test suite visit every state defined in the state transition table?
- [ ] **Transition Coverage Achieved**: Is every defined transition pathway exercised by at least one test case?
- [ ] **Guard Conditions Partitioned**: Are all guards tested with inputs evaluating to both true and false?
- [ ] **Terminal States Verified**: Do unit tests confirm that terminal states block further transitions?
- [ ] **Vitest Parameterization**: Are the state transitions verified using Vitest's \`it.each\` parameterized test?
- [ ] **FSM Determinism Verified**: Did the agent verify that there are no non-deterministic transitions in the code?
- [ ] **Complexity Mitigation**: Are orthogonal state variables isolated to prevent state space explosion?
- [ ] **No Copy-Pasted Test Cases**: Did the agent verify that no duplicate test blocks exist for different states?
- [ ] **Arrow Functions Enforced**: Are all test functions, hooks, and helpers written as arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript methods in test controllers rely on type inference?
- [ ] **Explicit Member Modifiers**: Are all properties and methods of the mock state controller annotated with accessibility?
- [ ] **Bracket notation**: Are dynamic properties on the state object accessed using bracket notation?
- [ ] **Void assertion wrapping**: Are transitions returning void tested using \`expect(() => ...).not.toThrow()\`?
- [ ] **No Forbidden Terminology**: Has the code been scanned to verify that no forbidden words (e.g. deprecated system labels) are present?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were made?
- [ ] **SWEBOK Quality Alignment**: Does the state modeling approach conform to SWEBOK v4 Chapter 5/11 quality criteria?
- [ ] **Mealy/Moore Decoupling**: Are transition side effects separated from state evaluation logic?
- [ ] **Type-Safe transitions enforced**: Did the compiler verify that all events conform to the Event union type?
- [ ] **Statecharts hierarchy checked**: If nested states exist, does a parent state transition correctly bubble?`,
  description:
    "Covers FSM enumeration (states, transitions, guards, terminal states), the state table template, a completeness checklist, common web app patterns (async loading, form lifecycle, auth-gated, optimistic UI, toggles), and Vitest it.each generation from state tables. Use before building any test inventory.",
  filename: "tdd-state-coverage",
  trigger: "model_decision"
});
