import { defineRule } from "../../define.ts";

export const architecturalSynthesis = defineRule({
  content: `# Architectural Synthesis

## 1. Domain Theory and Conceptual Foundations
Architectural synthesis is the core software engineering discipline of translating requirements, constraints, and quality attributes into a cohesive system structure. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design), architectural synthesis requires systematic design cycles where architects select, combine, and refine structural patterns to satisfy the system's target objectives.

### 1.1 Architecturally Significant Requirements (ASRs)
Not all software requirements have an equal impact on system architecture. Architectural synthesis focuses primarily on **Architecturally Significant Requirements (ASRs)**. An ASR is a requirement—functional, non-functional, or environmental—that has a profound impact on the system's structure, cost, implementation difficulty, or risk profile. 
- **Identifying ASRs**: ASRs are typically extracted from high-priority quality attributes (e.g., sub-second global response latencies, strict data privacy compliance, or high availability guarantees during regional outages).
- **Utility Curves**: Architects use utility curves or scenarios to quantify quality attribute requirements, translating vague statements (e.g., "the system must be fast") into measurable stimuli and responses (e.g., "under a load of 10,000 concurrent writes, database response times must remain below 150ms").

### 1.2 Architectural Styles and Design Patterns
Architectural synthesis involves selecting appropriate design patterns and styles:
- **Layered Architecture**: Isolates concerns by grouping components into layers (e.g., presentation, application, domain, infrastructure) with strict top-to-bottom dependency rules.
- **Event-Driven Architecture**: Uses decoupled, asynchronous producers and consumers connected via brokers or queues, optimizing scalability and modifiability.
- **Serverless / Edge Compute**: Distributes code execution to geographically distributed nodes (e.g., Cloudflare Workers), optimizing latency and cold start overhead.
- **Adapter & Repository Patterns**: Decouples domain logic from external libraries or database engines, facilitating unit testing and swapability.

### 1.3 Architectural Design Decisions (ADDs)
An **Architectural Design Decision (ADD)** is a documented selection of an architectural style, design pattern, or technology choice. To maintain conceptual integrity, ADDs must document:
- **The Design Rationale**: The explicit reasoning explaining why a particular pattern was chosen.
- **The Rejected Alternatives**: The other architectures considered and why they were deemed unsuitable.
- **The Trade-offs**: The compromises made (e.g., choosing a serverless model optimizes global read latency but imposes limits on execution timeouts and memory size).

### 1.4 Synthesis Methodology: Attribute-Driven Design (ADD)
Software architects use the **Attribute-Driven Design (ADD)** method (developed by the Software Engineering Institute) to systematically synthesize architectures:
1. **Choose Design Elements**: Select a portion of the system to design (e.g., the data ingestion layer).
2. **Identify Candidate Tactics**: Review architectural tactics that address the target ASRs (e.g., implementing backpressure to prevent downstream exhaustion).
3. **Instantiate Design Elements**: Map the chosen tactics to concrete software modules and interfaces.
4. **Verify and Refine**: Evaluate the synthesized structure against the ASRs to identify sensitivity points and risks.

### 1.5 Architectural Styles Taxonomy
Selecting the right style requires categorizing patterns by their primary design characteristics:
- **Broker Style**: Used in distributed systems with decoupled components that interact via remote service calls. A broker component coordinates communication, such as forwarding requests and transmitting results, insulating clients from routing complexities.
- **Peer-to-Peer Style**: Decentralized network design where nodes act as both clients and servers, sharing execution loads and data directly without a central authority.
- **Blackboard Style**: A data-centric pattern where multiple independent subsystems (knowledge sources) collaborate by reading from and writing to a shared data repository (the blackboard). This is highly useful for non-deterministic problems where the solution path is not predefined.
- **Pipe-and-Filter Style**: Breaks execution into a sequence of data processing steps. Each step is encapsulated in a filter component, and data flows between filters via pipes. This optimizes modifiability and reuse since filters can be rearranged or swapped.

### 1.6 Evaluating Synthesis Fit
During the synthesis cycle, architects must evaluate whether candidate structures are fit for purpose:
- **Prototyping**: Implementing lightweight spike solutions to test critical architectural assumptions (e.g., verifying that a serverless worker can successfully communicate with a D1 database within regional latency constraints).
- **Simulation**: Executing execution models or simulated workloads to observe system behaviors under stress, detecting potential bottlenecks or synchronization race conditions.
- **Mathematical Modeling**: Calculating formal bounds for resources (e.g., network bandwidth, database write throughput, storage expansion) to prove that the architecture can scale to the target limits.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures during architectural design:

### Step 2.1: Elicit and Prioritize ASRs
Before modifying or creating any core system architecture, the agent must document the ASRs in the \`implementation_plan.md\`:
- Categorize the ASRs by quality attribute (Availability, Performance, Modifiability, Security).
- Assign a quantitative stimulus-response scenario for each ASR (e.g., "When an external service goes offline, the API must failover to local cache within 2 seconds").

### Step 2.2: Evaluate and Select Architectural Patterns
Compare alternative styles that address the documented ASRs:
- Document at least two alternative patterns in the \`implementation_plan.md\`.
- Analyze how each alternative impacts the quality attributes, highlighting the trade-offs (e.g., "Option A provides higher performance but increases coupling, while Option B is decoupled but adds network latency").

### Step 2.3: Document the Formal ADD
Write a dedicated "Architectural Design Decision" section in the \`implementation_plan.md\`:
- Clearly state the chosen approach and its structural patterns.
- Record the technical rationale and the specific ASRs it satisfies.
- Explicitly list the trade-offs and any environmental constraints it introduces.

### Step 2.4: Implement Structural Boundaries and Interfaces
Implement the chosen architecture while maintaining strict boundary integrity:
- Place code in the correct monorepo packages (e.g., separating serverless worker handlers from core domain business rules).
- Define clear interface abstractions (repositories, adapters) to decouple application layers.
- Do not bypass architectural layers (e.g., do not write inline SQL queries directly inside frontend render components).

### Step 2.5: Perform Architectural Drift Audits
Verify that the implementation conforms to the synthesized architecture:
- Review imports to ensure dependencies only flow from outer layers to inner layers (dependency inversion).
- Verify that custom adapters are used for all third-party integrations.
- Confirm that unit tests mock the repository layer to isolate domain business rules.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding architectural synthesis:

- [ ] **ASR Identification**: Have the architecturally significant requirements been explicitly identified and listed?
- [ ] **Quantitative Scenarios**: Is every quality attribute requirement defined using a measurable stimulus-response scenario?
- [ ] **Pattern Selection Rationale**: Is the reason for choosing the specific architectural pattern documented in the plan?
- [ ] **Alternative Comparison**: Were at least two alternative architectural choices evaluated and recorded?
- [ ] **ADD Documentation**: Is there a formal Architectural Design Decision block present in the \`implementation_plan.md\`?
- [ ] **Strict Layering Rules**: Does the code respect layered boundaries with no layer bypasses?
- [ ] **Dependency Inversion**: Do outer infrastructure layers depend on inner domain interfaces (not vice versa)?
- [ ] **Adapter Integration**: Are all third-party services isolated behind local wrapper adapters?
- [ ] **Workspace Tool Optimization**: Has the code been structured to optimize edge compile size and cold start performance?
- [ ] **Mocked Repository Boundaries**: Do domain-level unit tests mock out all database and network interactions?
- [ ] **Task Alignment**: Do tasks in \`task.md\` outline the step-by-step implementation of the synthesized components?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Attribute Trade-off Mapping**: Has the agent documented the trade-off impact on secondary quality attributes?
- [ ] **Design Review Check**: Was an architectural review checklist drafted to verify structural integrity?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` document how the implemented code maps to the synthesized design?
- [ ] **Conceptual Integrity Audit**: Did the agent verify that the chosen pattern aligns with existing patterns in the monorepo?
- [ ] **Environmental Constraints Audit**: Were environmental boundaries (memory limits, serverless runtimes) checked for compatibility?
- [ ] **Attribute-Driven Design Step**: Did the agent trace each component's design back to a specific architectural tactic?
- [ ] **Explicit Member Access**: Are all methods and properties on synthesized architectural classes declared with explicit accessibility modifiers?`,
  description: "ASRs, architectural synthesis, design patterns, and ADDs",
  filename: "architectural-synthesis",
  trigger: "model_decision"
});
