import { defineRule } from "../../define.ts";

export const conwaysLaw = defineRule({
  content: `# Conway's Law

## 1. Domain Theory and Conceptual Foundations
Melvin Conway's classic thesis (1967) asserts: "Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations." In the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Software Design and Software Engineering Management chapters, Conway's Law is recognized as a fundamental social-technical force that shapes software architectures. If team communication paths do not mirror the desired software design, the communication patterns will inevitably override the design plans, leading to tight coupling, interface mismatches, and coordination bottlenecks.

### 1.1 Social-Technical Alignment
Software design is not purely a technical activity; it is a social-technical coordination challenge. When a team organization is structured around specialized functional silos (e.g., separate database admins, backend developers, frontend developers, and QA engineers), the system architecture will naturally reflect this separation. This structure leads to:
- **High Coordination Overhead**: Implementations require continuous cross-silo handoffs and meetings, slowing development velocity.
- **Tight Coupling**: Subsystems develop ad-hoc dependencies to bypass communication blockages, breaking clean boundaries.
- **Architectural Drift**: The actual code structure drifts away from the documented design to match the social organization.

To build clean, modular systems, organizations must align their communication structures with their technical architecture.

### 1.2 The Inverse Conway Maneuver
The **Inverse Conway Maneuver** is the architectural practice of organizing team structures and communication channels to promote a target software architecture. If an organization desires a decentralized, loosely coupled system (such as microservices or independent Bounded Contexts), it must first organize developers into small, autonomous, cross-functional, and "stream-aligned" teams. By giving each team full ownership of a single subsystem, the interfaces between teams will naturally map to the API contracts between subsystems.

### 1.3 Team Topologies
In modern software engineering, team structures are classified using Matthew Skelton and Manuel Pais' **Team Topologies** framework, which defines four fundamental team types and three interaction modes:
- **Stream-Aligned Team**: Focused on a continuous flow of work aligned to a single business domain or feature category. They own features from ideation to production.
- **Platform Team**: Provides internal services, libraries, and toolkits (e.g., the build systems, runtime frameworks) to enable stream-aligned teams to deliver features autonomously.
- **Enabling Team**: Composed of specialists (e.g., security auditors, QA experts) who assist other teams in adopting new technologies or practices, avoiding long-term dependencies.
- **Complicated-Subsystem Team**: Focused on a specific component requiring deep specialty knowledge (e.g., cryptographic engines, mathematical modeling packages).

Interaction modes:
- *Collaboration*: Teams working closely together to discover interfaces.
- *X-as-a-Service*: Clear service-provider relationships using stable APIs.
- *Facilitation*: One team helping another to clear roadblocks.

### 1.4 Domain-Driven Design (DDD) Boundaries
In DDD, Conway's Law dictates that team boundaries must align strictly with Bounded Contexts. A single Bounded Context must be owned by one team. If multiple teams write code in the same Bounded Context, the shared domain model will fragment, leading to conflicting definitions, logical regression bugs, and coordination failures. When contexts must integrate, teams must define formal **Context Maps** (e.g., Customer/Supplier, Shared Kernel, or Anti-Corruption Layer) to manage communication and interface boundaries.

### 1.5 Cognitive Load and Architectural Limits
A primary goal of Conway's Law and Team Topologies is managing the **Cognitive Load** of developers. John Sweller's cognitive load theory classifies mental effort into three types:
- **Intrinsic Cognitive Load**: The effort associated with the fundamental task (e.g., "What is a React component?").
- **Extraneous Cognitive Load**: The effort spent on environmental factors not directly related to the problem (e.g., "How do I build this package?" or "Where do I configure Webstorm?"). High extraneous load slows down velocity and causes frustration.
- **Germane Cognitive Load**: The mental energy devoted to processing information and constructing cognitive schemas (e.g., "How do I design this business logic?").

By structuring software around Team Topologies, organizations ensure that the codebase "fits in the developer's head" (Dan North's concept of software that fits in your head). Each team's system boundaries are restricted to what can be fully comprehended within human short-term memory limits.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when designing subagent architectures and assigning work tasks in this workspace:

### Step 2.1: Analyze Task and Subagent Communication Pathways
Before launching any subagents or dividing work, the agent must document the team topology of the task. The agent must add a "Subagent Topology and Communication Plan" section in the \`implementation_plan.md\`:
- Identify if the task crosses Bounded Context boundaries or distinct package zones (e.g., \`packages/agents-build\` vs frontend packages).
- Determine if multiple subagents will run concurrently and define their roles (e.g., researcher, developer, auditor).

### Step 2.2: Apply the Inverse Conway Maneuver to Tasks
The agent must structure task assignments so that each subagent is assigned to exactly one Bounded Context or modular subsystem. The agent must NOT create tasks where multiple subagents write code in the same file or directory concurrently. If subagents must coordinate, they must do so through defined interface contracts.

### Step 2.3: Define Stable Interface Contracts
For any cross-context task, the agent must define:
- **Data Schemas**: Zod schemas, TypeScript types, or database columns.
- **API Endpoints**: Input/output models and method signatures.
- **Event Schemas**: Message structures and payload types.
These contracts must be documented in the \`implementation_plan.md\` and approved by the user before any subagents begin implementation.

### Step 2.4: Limit Cognitive Load and Communication Overhead
To ensure high performance, the agent must keep the scope of each subagent narrow:
- Limit the files each subagent can read or write. Use the \`Workspace\` parameter in the \`invoke_subagent\` call:
  - Use \`Workspace: "branch"\` to create an isolated workspace branch, preventing conflicting edits.
  - Use \`Workspace: "share"\` to share the underlying repository while allowing independent branching.
- Communication between the parent agent and subagents must follow the *X-as-a-Service* or *Facilitation* mode. Avoid ad-hoc, circular message loops that indicate poorly defined boundaries.

### Step 2.5: Document Team Alignment in Walkthrough
Upon completion, the agent must verify that the codebase boundaries match the task division:
- Document which files were created/modified by which agents.
- Confirm that no circular dependencies exist between the components using a static analysis check.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding Conway's Law and team alignment:

- [ ] **Context Boundary Mapping**: Has the system boundary been mapped to identify Bounded Contexts and packages?
- [ ] **Subagent Allocation**: Is each subagent restricted to working within a single, distinct subsystem or context?
- [ ] **Concurrent Writer Audit**: Has the agent verified that no two subagents are editing the same files concurrently?
- [ ] **Stable Interface Definition**: Are all interface contracts (types, schemas, endpoints) documented and frozen?
- [ ] **Cognitive Load Check**: Is the scope of each task small enough to be fully understood by a single subagent?
- [ ] **Context Map Definition**: Is there a documented context map (e.g. customer/supplier) for integrations?
- [ ] **Mermaid Communication Diagram**: Is a Mermaid sequence diagram embedded to show subagent communications?
- [ ] **Communication Loop Check**: Have circular message loops between subagents been eliminated?
- [ ] **User Gate Approval**: Did the agent obtain user approval on the subagent topology and interface contracts?
- [ ] **Platform Tooling Alignment**: Are build, test, and lint configurations treated as platform services?
- [ ] **TDD Task Alignment**: Is each requirement ID mapped to a single subagent for TDD execution?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Workspace Isolation**: Was the \`Workspace\` field in subagent invocations set to \`branch\` or \`share\` where isolation was needed?
- [ ] **API Contract Conformity**: Has the agent verified that the implemented code conforms exactly to the approved API schemas?
- [ ] **Shared Kernel Auditing**: If a Shared Kernel pattern was used, is it kept minimal and locked down?
- [ ] **Team Topologies Mapping**: Are the subagent roles explicitly defined as stream-aligned, platform, or enabling?
- [ ] **Clean Integration Paths**: Are the event queues or REST APIs documented as the only communication paths between modules?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` document the final subagent execution topology?
- [ ] **Cognitive Load Type Audit**: Has the agent verified that extraneous cognitive load (build setup, tool config) is minimized for subagents?
- [ ] **Interface Isolation**: Have public boundaries been isolated using types or interfaces rather than sharing concrete classes?
- [ ] **Interaction Mode Verification**: Are the interaction modes between subagents (collaboration, X-as-a-Service) explicitly defined?
- [ ] **Dan North Conformity**: Has the agent verified that the modified codebase section is small enough to fit in a single developer's head?`,
  description:
    "Conway's Law, alignment of boundaries, and communication structure",
  filename: "conways-law",
  trigger: "model_decision"
});
