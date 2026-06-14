---
description: architectural evaluation, ATAM, design trade-offs, and quality attributes
trigger: model_decision
---

# Architectural Evaluation

## 1. Domain Theory and Conceptual Foundations
Architectural evaluation is the systematic software engineering practice of assessing a candidate architecture to verify that it satisfies all critical quality attributes (such as performance, security, availability, and modifiability) before construction begins. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design), evaluation mitigates risk by identifying design flaws early, when the cost of modification is orders of magnitude lower than during construction or deployment (complying with Boehm's cost-of-change curve).

### 1.1 Scenario-Based Evaluation Methodologies
Unlike code-level testing, which verifies executable units, architectural evaluation assesses structural design decisions. The most effective evaluations are **scenario-based**. A scenario is a concrete description of a system interaction, comprising:
- **Source of Stimulus**: The actor or entity generating the event (e.g., an end user, an external system, or an internal scheduler).
- **Stimulus**: The event itself (e.g., sending 5,000 concurrent API requests, or a database node going offline).
- **Environment**: The system state during the event (e.g., normal operations, peak load, or regional failover mode).
- **Artifact**: The specific portion of the system stimulated (e.g., the API gateway, or the replication broker).
- **Response**: The system's reaction (e.g., throttling requests, logging the error, or failing over to a read replica).
- **Response Measure**: The quantitative criteria used to assess success (e.g., failover completes in under 2 seconds, or error rates remain below 0.1%).

### 1.2 The Architecture Tradeoff Analysis Method (ATAM)
The **Architecture Tradeoff Analysis Method (ATAM)**, developed by the Software Engineering Institute, is the industry-standard evaluation framework. ATAM exposes how architectural decisions impact quality attributes, focusing on three core concepts:
- **Sensitivity Points**: Design decisions that directly control a specific quality attribute response (e.g., choosing a serverless model is highly sensitive for read latencies, as it eliminates geographic network hops).
- **Trade-off Points**: Design decisions that affect multiple quality attributes in opposing ways (e.g., encrypting all database columns improves security but increases CPU utilization and response latencies, representing a trade-off between security and performance).
- **Risk Themes**: Collections of individual architectural risks that threaten the system's viability if left unaddressed.

### 1.3 Pareto Optimality in Design Choices
Evaluation recognizes that it is impossible to optimize all quality attributes simultaneously. Architects operate in a multi-dimensional trade-off space, aiming for **Pareto Optimality**—a state where no quality attribute can be improved without degrading another. For instance, increasing system redundancy (availability) inevitably increases maintenance complexity (modifiability) and operational cost. Evaluating these tradeoffs explicitly prevents downstream design friction.

### 1.4 Scenario Trees and Utility Trees
To prioritize scenarios, evaluators build a **Utility Tree**. The root of the tree represents the overall utility (value) of the system. The next level refines utility into quality attributes (Availability, Security, etc.). The third level breaks attributes into specific concerns (e.g., transaction security vs. data-at-rest encryption). The leaves contain concrete scenarios, prioritized by their importance to the business and their technical difficulty (e.g., High/Medium/Low matrix).

### 1.5 Scenario-based Evaluation Frameworks
In addition to ATAM, several specialized evaluation frameworks are used depending on the architectural focus:
- **SAAM (Software Architecture Analysis Method)**: The precursor to ATAM, focusing primarily on evaluating modifiability. It maps concrete developer change scenarios to structural elements, estimating the number of modules affected to quantify architectural coupling.
- **ALMA (Architecture-Level Modifiability Analysis)**: A targeted method that evaluates the system's adaptability to future business changes. It focuses on predicting maintenance costs, comparing alternative architectures against change scenarios like swapping database vendors or UI frameworks.
- **CBAM (Cost Benefit Analysis Method)**: Extends ATAM by incorporating financial cost and return-on-investment (ROI) calculations. CBAM helps stakeholders select architectural options based on cost-benefit tradeoffs, ensuring budget alignment.

### 1.6 Continuous Architectural Conformance Audits
An architectural evaluation is only as good as the final implementation. To prevent "architectural drift" (where the code deviates from the evaluated design boundaries), teams must establish continuous conformance gates:
- **Static Analysis Tools**: Using tools like ArchUnit or ESLint import restriction plugins to statically assert that code dependencies conform to the evaluated layered structure (e.g., preventing the domain package from importing the infrastructure package).
- **Dependency Graph Visualizations**: Running automated tools to compile and render dependency structures on every major merge request. This highlights new or unexpected couplings that bypass architectural boundaries.
- **Automated Performance Gates**: Running CI/CD performance benchmarks to verify that the implemented code meets the evaluated latency and throughput response measures.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when evaluating architectures in this workspace:

### Step 2.1: Construct the Evaluation Scenario Matrix
Before implementing any major architectural changes (e.g., adding a database, modifying routing, or introducing new network APIs), the agent must document the evaluation scenarios in the `implementation_plan.md`:
- Create a markdown table mapping the Source, Stimulus, Environment, and Response Measure for each quality attribute.
- Ensure scenarios are quantitative and testable (do not use vague terms like "highly responsive").

### Step 2.2: Map Sensitivity and Trade-off Points
Analyze the proposed architectural design decisions:
- Identify which decisions are sensitivity points and document their impact (e.g., "Database index on user_uuid is a sensitivity point for read latency").
- Identify trade-offs and document the compromises (e.g., "Wrapping all writes in database transactions improves data consistency but increases locks, representing a trade-off between consistency and write concurrency").

### Step 2.3: Execute ATAM-Lite Analysis Cycles
Simulate how the architecture handles high-priority scenarios:
- Trace the flow of data and execution paths through the proposed design elements.
- Verify that every scenario has a defined response path (e.g., "Under peak load, Hono middleware intercepts requests, checks KV for rate limits, and responds with a 429 status code").

### Step 2.4: Catalog Risks and Document Mitigation
For any scenario where the architecture cannot satisfy the response measure:
- Document the finding as a formal "Architectural Risk" in the `implementation_plan.md`.
- Propose a specific technical mitigation (e.g., "Risk: Edge timeout exceeds 30 seconds for bulk reports. Mitigation: Move report generation to asynchronous background queue").

### Step 2.5: Write Conformance Tests and Benchmarks
To verify that the implementation adheres to the evaluated design boundaries:
- Implement unit tests verifying that safety mechanisms (e.g., circuit breakers, rate limiters, or caches) execute as expected.
- Run load tests or benchmarks during verification to validate performance response measures.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding architectural evaluation:

- [ ] **Scenario-Based Matrix**: Is there a quantitative, scenario-based evaluation matrix present in the plan?
- [ ] **Quantitative Response Measures**: Are all response measures defined with measurable metrics (seconds, bytes, error rates)?
- [ ] **Sensitivity Points Documented**: Have the sensitivity points of the design decisions been explicitly analyzed?
- [ ] **Trade-off Points Documented**: Are the architectural trade-offs (e.g., performance vs. security) clearly recorded?
- [ ] **Utility Tree Prioritization**: Were scenarios prioritized based on business importance and technical difficulty?
- [ ] **Risk Identification**: Were all design gaps logged as formal architectural risks?
- [ ] **Mitigation Plans**: Is there a clear technical mitigation documented for every identified risk?
- [ ] **Run-Time Boundary Check**: Has the design been verified against environmental constraints (e.g., edge runtime memory)?
- [ ] **Transactional Safety**: Are transactional boundaries evaluated to prevent partial database writes?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Data Access Pattern Validation**: Were the database query plans and indexing strategies evaluated for read/write performance?
- [ ] **Concurrency Evaluation**: Has the design been evaluated for potential race conditions or lock contention issues?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` verify that the implemented code meets the evaluated scenarios?
- [ ] **ATAM-Lite Walkthrough**: Did the agent simulate the execution path of the high-priority scenarios?
- [ ] **Client Error Mapping**: Have HTTP response codes (e.g., 401/403/429/500) been evaluated to ensure proper client recovery?
- [ ] **Task List Sync**: Do tasks in `task.md` include the construction of the evaluated mitigation mechanisms?
- [ ] **Conceptual Integrity Audit**: Did the agent verify that the evaluated pattern aligns with existing monorepo structures?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in `expect(() => ...).not.toThrow()`?
- [ ] **Explicit Member Access**: Are all methods and properties on evaluation helper classes declared with explicit accessibility modifiers?
