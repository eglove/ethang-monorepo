---
description: design completeness, state coverage, and requirements mapping
trigger: model_decision
---

# Design Completeness

## 1. Domain Theory and Conceptual Foundations
Design completeness is the software engineering discipline of ensuring that a software design systematically covers all specified functional requirements, non-functional quality attributes, and environmental constraints without omission. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design), a design is complete only when every requirement can be traced to a concrete architectural or code element, and when the system's behavior is fully defined for all possible input states, execution paths, and error conditions.

### 1.1 State Space and State Coverage
A critical metric of design completeness is **state coverage**. A software system can be modeled as a Finite State Machine (FSM) or statechart, where its behavior is defined by:
- **States ($S$)**: The distinct conditions or modes of the system (e.g., Unauthenticated, Loading, Loaded, Error, Empty).
- **Inputs/Events ($E$)**: The triggers that prompt state changes (e.g., button clicks, API responses, timeout expirations).
- **Transitions ($T$)**: The logical paths connecting states ($S_i \xrightarrow{E} S_j$).
- **Actions ($A$)**: The operations executed during a transition.

A design is incomplete if there are unhandled input events in any state, leaving the system in an "undefined" state. For example, if a UI component is in the "Loading" state and receives an "API Error" event, the design must define how the system transitions to the "Error" state and recovers, rather than hanging indefinitely.

### 1.2 State Transition Tables
To verify completeness, engineers construct **State Transition Tables** which map out the state space exhaustively:

| Current State | Input / Event | Next State | Guard / Action |
| :--- | :--- | :--- | :--- |
| Idle | SUBMIT_FORM | Loading | Validate inputs |
| Loading | FETCH_SUCCESS | Loaded | Render list |
| Loading | FETCH_FAILURE | Error | Display alert & log error |
| Loaded | RESET_CLICKED | Idle | Clear cache |

By enumerating every cell in this matrix, engineers identify unhandled state-event combinations (e.g., "What happens if the user clicks SUBMIT while in the Loading state?"). A complete design either handles the event (e.g., disabling the button) or rejects it explicitly.

### 1.3 UI State Progressions
In modern web applications, design completeness mandates mapping the complete lifecycle of UI views:
- **Initial/Idle State**: The default state before user interaction.
- **Loading/Progress State**: Visual feedback during asynchronous background operations.
- **Success/Loaded State**: The interface rendering the retrieved or processed data.
- **Empty State**: The user-facing view when a success state returns zero records.
- **Error State**: The recovery view when an exception occurs, offering troubleshooting instructions or retry actions.

### 1.4 Exception and Error Boundary Design
Completeness requires defining error handling and exception bounds:
- **Try-Catch Boundaries**: Localizing errors to prevent system-wide crashes.
- **Fallback Configurations**: Providing default values or simplified operations when dependencies fail.
- **Durable Executions**: Designing transactional writes and database rollbacks to prevent corrupting database invariants during partial failures.

### 1.5 State Modeling Standards (Harel Statecharts)
To model complex system behavior without suffering from "state space explosion" (where the number of states grows exponentially with the number of variables: $S = S_1 \times S_2 \times ... \times S_n$), engineers use David Harel's **Statecharts** (1987). Statecharts extend classical FSMs with three essential constructs:
- **Hierarchy (Nested States)**: Substates are nested within parent states. This allows transitions to be inherited; for example, an "Exit" transition on a parent state automatically applies to all nested substates, eliminating redundant transition definitions and reducing visual complexity.
- **Concurrency (Orthogonal Regions)**: Statecharts support independent, parallel sub-regions. A system can be in state A and state B concurrently (e.g., a text editor can have active orthogonal regions for formatting styles like Bold, Italic, and Underline, which operate independently without creating a combined state for every permutation).
- **Communication (History and Event Broadcasting)**: The chart can remember which substate was active before exiting a hierarchical state via the History indicator. When the state is re-entered, the history transition restores that specific substate. Additionally, events triggered in one orthogonal region can be broadcast to other regions, enabling synchronized state updates.

### 1.6 Completeness in Architectural Handshakes
In distributed edge environments like Cloudflare Workers, design completeness requires defining robust architectural handshakes between independent components:
- **Backpressure**: Standardizing data flow rates. If a database or ingestion pipeline is overwhelmed, the edge worker must recognize downstream pressure signals and throttle or buffer incoming requests, preventing cascade failures.
- **Circuit Breakers**: Intercepting queries to failing services. When an external dependency shows high latency or error rates, the circuit breaker trips, returning cached fallbacks directly and avoiding resource exhaustion.
- **Idempotency Keys and Delivery Semantics**: Under "at-least-once" delivery guarantees, messages may be duplicated. Design completeness requires including unique idempotency keys in request headers, allowing receiver endpoints to recognize duplicate transmissions and avoid applying double transactions.
- **Rate-Limiting & Retries**: Handling external HTTP status codes (such as 429 Too Many Requests) using exponential backoff with jitter to ensure system reliability.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to ensure design completeness in this workspace:

### Step 2.1: Enumerate States and Inputs
Before writing code, the agent must identify all possible states and events for the feature. The agent must document this as an "FSM State Inventory" in the `implementation_plan.md`.

### Step 2.2: Construct the State Transition Table
The agent must write a complete State Transition Table in the `implementation_plan.md` mapping every state against all possible events. The agent must verify that:
- Every state has a defined transition for success and failure events.
- Actions and guard conditions (e.g., "if authorized") are explicitly specified.

### Step 2.3: Design UI Views (for Frontend Features)
For any UI modification, the agent must document the visual layout and behavior for:
- Loading spinners or skeleton cards.
- Empty states with a call-to-action (CTA).
- Error messages with retry buttons.
- Success lists with pagination.

### Step 2.4: Map Exception Boundaries and Recovery
The agent must define error handling strategies in the `implementation_plan.md`:
- Identify where try-catch blocks will be placed (e.g., around API fetch calls or JSON parsing).
- Document the fallback values or error UI transitions.
- Ensure database writes use transactions where atomic execution is required.

### Step 2.5: Verify State Coverage with Parameterized Tests
To mathematically verify completeness, the agent must implement parameterized unit tests (using Vitest `it.each` tables) that cover all rows of the State Transition Table. The agent must write tests verifying:
- Valid state transitions.
- Guard condition rejections (e.g., attempting a transition with invalid parameters).
- Error recovery paths.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding design completeness:

- [ ] **State Space Enumeration**: Have all possible system states and event inputs been identified and listed?
- [ ] **State Transition Table**: Is there an exhaustive State Transition Table documented in the plan?
- [ ] **Omission Check**: Have all cells in the state-event matrix been evaluated to ensure no undefined behaviors exist?
- [ ] **UI State Progression**: Are Loading, Empty, Loaded, and Error views designed for every new UI screen?
- [ ] **Try-Catch Boundaries**: Have error boundaries been defined around all network queries and data parsers?
- [ ] **Retry CTAs**: Do all error views contain a retry or recovery action for the user?
- [ ] **Database Transaction Audit**: Are multi-table database writes wrapped in transactions to prevent partial states?
- [ ] **Fallback Values**: Are default states or fallback values specified for missing or corrupted configurations?
- [ ] **User Permission States**: Has the design defined how the system behaves for different authorization levels?
- [ ] **Constraint Bounds Checked**: Has the design been verified against environmental constraints (timeout limits, size caps)?
- [ ] **Traceability Verification**: Are all states and transition paths mapped back to functional requirements?
- [ ] **Task List Sync**: Do tasks in `task.md` cover the implementation of all states and error boundaries?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Boundary Value States**: Have edge-case inputs (empty array, null fields, max length values) been mapped to specific states?
- [ ] **Race Condition Safeguards**: Does the process view design handle double-clicks or concurrent requests?
- [ ] **State Persistence Design**: Is it documented whether states are ephemeral (in-memory) or persistent (database/KV/session)?
- [ ] **FSM Unit Testing**: Have parameterized tests (`it.each`) been written to assert every transition in the FSM?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` confirm that all states have been successfully implemented and tested?
- [ ] **Harel Statecharts nesting**: Have nested states and orthogonal regions been analyzed to prevent state space explosion?
- [ ] **API Circuit Breaker**: Are circuit breakers or rate-limit retry logic designed for external API connections?
- [ ] **Data Race Defenses**: Does the design include locks, event queues, or queue brokers to defend against race conditions?
- [ ] **FSM State Persistence**: Is the state transition history logged in debug environments to assist troubleshooting?
