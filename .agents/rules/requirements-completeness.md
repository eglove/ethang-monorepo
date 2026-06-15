---
description: requirements completeness, consistency, feasibility, and quality criteria
trigger: model_decision
---

# Requirements Completeness

## 1. Domain Theory and Conceptual Foundations
A software requirements specification (SRS) or product backlog cannot be evaluated solely on the quality of its individual statements; it must be audited as a coherent, integrated collection. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, requirements validation requires assessing the requirements collection for completeness, consistency, non-redundancy, and conciseness. 

The collection-level quality attributes are defined as:
1. **Completeness**: The requirements collection must contain all functional specifications, quality attributes (non-functional requirements), structural constraints, design limitations, and regulatory rules required to implement the system. No required behaviors must be left undefined, unstated, or marked with temporary placeholders (e.g., "TBD" or "details to follow").
2. **Consistency**: No two requirement statements in the collection may contradict or conflict with each other. SWEBOK classifies conflicts into:
   - *Logical Conflicts*: Two requirements dictate contradicting behaviors for the same event (e.g., one requires immediate transaction routing, while another requires batching overnight).
   - *Temporal Conflicts*: Contradictions in timing, ordering, or synchronization constraints.
   - *Data Conflicts*: Inconsistent definitions of data structures, database schemas, or validation rules across modules.
   - *Resource Conflicts*: Requirements demanding overlapping, mutually exclusive hardware, network, or processing limits.
3. **Non-Redundancy**: Each requirement must be specified exactly once in the collection. Duplicate requirement statements increase maintenance cost and lead to inconsistent updates as the specification evolves.
4. **Conciseness**: The collection must present all specifications using minimal, direct text, avoiding extraneous narrative, design specifications, or tutorials.
5. **Structural Organization**: The collection must be organized logically (e.g., partitioned by bounded context, feature area, or user role) using standard markdown structures to facilitate comprehensibility and search.

Audit checks for these collection-level attributes are essential to ensure the requirements are sufficient to guide design and testing without introducing architectural gaps.

### 1.1 The Lifecycle of Requirements and the Cost of Omission
Empirical software engineering studies show that the cost of correcting a software defect increases exponentially the later it is discovered. A requirement omission or contradiction resolved during design costs very little. If discovered in production, remediation costs up to 100 times more. This "Cost of Change" curve (popularized by Barry Boehm) justifies rigorous completeness audits before construction begins.

An incomplete requirements specification propagates errors downstream:
- **Design Gaps**: Architects make assumptions that may not align with business needs, leading to incorrect database schemas or API contracts.
- **Testing Deficiencies**: Quality assurance engineers cannot design valid test cases for behaviors that are unstated, leading to untested code paths.
- **Project Delays**: Unresolved requirements lead to mid-iteration halts when developers discover blockers.

### 1.2 Quality Attributes and System Boundaries
Completeness includes non-functional quality attributes: security, performance, reliability, and scalability:
- **Network Boundaries**: Timeout values, retry strategies, and circuit-breaker thresholds.
- **Data Boundaries**: Payload limits, validation regex patterns, and character encodings.
- **Performance Boundaries**: Maximum latency percentiles (e.g., p95, p99), throughput, and resource limits.
- **Security Boundaries**: Authentication (JWT, OAuth), role-based access control, and encryption rules.

Without these specifications, developers are forced to make arbitrary choices, resulting in inconsistent behavior and security vulnerabilities.

### 1.3 Logical Integrity and State Completeness
A requirements collection must represent a closed logical system. Every possible combination of inputs and system states must map to a deterministic outcome. This is conceptualized through finite state machines (FSM). For any state $S$ and input $I$, there must be a defined transition to state $S'$. If any transition is undefined, the specification is incomplete. The requirements must explicitly detail the system behavior when:
- The backend or third-party service is unavailable (network error).
- The returned data is empty or malformed.
- The input violates validation rules.
- Multiple actions are triggered concurrently (race conditions).

## 2. Standard Operating Procedures (SOP)
The agent must execute a requirements completeness audit using the following procedure:

### Step 2.1: Structural Organization & Partitioning
Organize all elicited requirements into a logical structure in the implementation plan. Group them by Bounded Context (e.g., payments, notifications) or feature folder, ensuring that each group has a clear heading and table of contents. Establish unique identifiers for each requirement (e.g., REQ-PAY-01, REQ-NOTIFY-02) to enable tracing throughout design, implementation, and testing.

### Step 2.2: Completeness Audit & State Coverage
Scan the entire requirements document for incomplete statements, placeholder comments, or unresolved items (e.g., "TBD", "TBC", "details pending"). Verify that the specification covers all operational system states (loading, empty, loaded, error) and handles both successful flows and exception failures. If gaps are found, halt the planning phase and elicit the missing requirements from the user.

To manage and track state transitions programmatically, implement state-machine helpers. Here is an example of a state machine manager that maps inputs to transitions without using explicit return types, utilizing arrow functions, explicit member accessibility, and bracket notation for index signatures:

```typescript
export type SystemState = "LOADING" | "EMPTY" | "LOADED" | "ERROR";
export type SystemEvent = "FETCH_SUCCESS" | "FETCH_EMPTY" | "FETCH_ERROR" | "RESET";

export class StateTracker {
  private currentState: SystemState;

  public constructor(initialState: SystemState) {
    this.currentState = initialState;
  }

  public getStatus = () => {
    return this.currentState;
  };

  public transition = (event: SystemEvent) => {
    const matrix: Record<SystemState, Partial<Record<SystemEvent, SystemState>>> = {
      EMPTY: {
        RESET: "LOADING",
      },
      ERROR: {
        RESET: "LOADING",
      },
      LOADED: {
        RESET: "LOADING",
      },
      LOADING: {
        FETCH_EMPTY: "EMPTY",
        FETCH_ERROR: "ERROR",
        FETCH_SUCCESS: "LOADED",
      },
    };

    const stateTransitions = matrix[this.currentState];
    const nextState = stateTransitions ? stateTransitions[event] : undefined;
    this.currentState = nextState ?? this.currentState;
  };
}
```

### Step 2.3: Pairwise Consistency Analysis
Analyze each requirement statement against all other statements in the collection to detect logical, temporal, data, or resource conflicts. If a contradiction is identified (e.g., one requirement mandates a 200ms response time while another requires calling a third-party API that averages 1.5 seconds), document the conflict and present resolution options to the user.

Here is an example validation utility showing how to enforce consistency limits across configuration properties:

```typescript
export type ConfigLimits = {
  maxTimeoutMs: number;
  minRetryCount: number;
};

export const checkConfigConsistency = (config: Record<string, number>, limits: ConfigLimits) => {
  const currentTimeout = config["timeoutMs"];
  const currentRetry = config["retryCount"];

  if (currentTimeout === undefined || currentRetry === undefined) {
    return false;
  }

  const isTimeoutValid = currentTimeout <= limits["maxTimeoutMs"];
  const isRetryValid = currentRetry >= limits["minRetryCount"];

  return isTimeoutValid && isRetryValid;
};
```

### Step 2.4: Consolidating Redundancies
Identify and eliminate any duplicated requirement statements. If a requirement applies to multiple modules, centralize its definition under a "Shared Constraints" section and reference it using its unique identifier, ensuring a single source of truth.

### Step 2.5: Establishing Requirements Traceability Matrix
Construct a Requirements Traceability Matrix (RTM) matching requirements to engineering files, routes, and test suites. 

| Req ID | Description | Hono Route / Component | Test File |
|--------|-------------|------------------------|-----------|
| REQ-01 | Fetch account details | GET /accounts | accounts.test.ts |
| REQ-02 | Validate user input | AccountForm | account-form.test.ts |

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria before baselining a requirements collection:

- [ ] **No Placeholders**: Has the agent verified that the requirements collection contains zero "TBD", "TBC", or other placeholder tokens?
- [ ] **State Coverage**: Does the requirements collection cover all FSM states (initial loading, data-loaded, empty-state, error-state)?
- [ ] **Conflict Resolution**: Has a pairwise consistency check been performed, and have all logical, temporal, and data conflicts been resolved?
- [ ] **Non-Redundancy**: Is each requirement specified exactly once, with zero duplicate statements in the collection?
- [ ] **Concise Wording**: Has all extraneous text, implementation bias, and tutorial content been pruned from the specification?
- [ ] **Logical Structure**: Is the collection organized systematically using headings, unique IDs, and section partitions?
- [ ] **Full Boundary Specification**: Are the bounds for all inputs, payload sizes, and network timeouts specified for every module?
- [ ] **Security Completeness**: Are authentication, authorization, and data encryption rules specified for every feature path?
- [ ] **Performance Bounds**: Are latency limits, concurrent user capacities, and throughput metrics specified for the system?
- [ ] **Traceability Matrix**: Is every requirement in the collection mapped in a Traceability Matrix to prevent missing code coverage?
- [ ] **Data Model Consistency**: Are data formats, database schemas, and validation rules consistent across all requirement statements?
- [ ] **Deployment Criteria**: Are the deployment requirements, environment configurations, and rollback triggers specified?
- [ ] **Internationalization Scope**: Is the internationalization scope (languages, locales, formatting standards) completely defined?
- [ ] **Operational Logging**: Are logging, monitoring, auditing, and SLA reporting requirements completely specified?
- [ ] **User Approval**: Has the complete requirements collection been reviewed and formally approved by the user?
- [ ] **Concurrency Gaps**: Has the system behavior during concurrent operations (e.g. double form submissions, overlapping network requests) been specified?
- [ ] **Fallback Mechanisms**: Are grace degradation pathways and fallback states clearly detailed for external integration failures?
- [ ] **Forbidden Terms Scan**: Has the requirements specification been audited to ensure no restricted platform vocabulary is present?
