---
description: architectural description, viewpoints, notations, and documentation clarity
trigger: model_decision
---

# Architectural Documentation

## 1. Domain Theory and Conceptual Foundations
Architectural documentation is the engineering practice of capturing the structural design, behavioral patterns, and critical design decisions of a software system. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design), software architecture represents the high-level organization of a system, composed of structural components, their externally visible properties, and the relationships (interfaces) among them. Documentation serves as the shared blueprint for developers, project managers, security auditors, and operations staff, resolving stakeholder concerns and guiding system evolution.

### 1.1 Standard Architectural Viewpoints (The 4+1 Model)
To address the diverse concerns of different stakeholders, software architects use multiple views. The standard "4+1" architectural view model includes:
1. **Logical View**: Models the system's functional design, focusing on the class diagrams, object models, and package structures. It addresses end-user requirements and domain logic.
2. **Process View**: Explains the system's runtime behavior, focusing on concurrency, synchronization, non-blocking operations, data flows, and performance attributes. It addresses scalability, throughput, and system integration.
3. **Development View**: Represents the organization of software modules in the development environment, including file hierarchies, repository structure, packages, and dependency configuration (e.g., package manifests). It addresses build, configuration, and release management.
4. **Physical View**: Details the deployment topology, mapping software components to execution nodes (e.g., Cloudflare Edge routers, database servers, queues, third-party API hosts). It addresses latency, availability, security, and physical constraints.
5. **Scenarios (+1)**: Ties the other four views together using use cases or Given-When-Then user stories, showing how the views collaborate to satisfy system requirements.

### 1.2 Modeling Notations (C4 and UML)
To present views clearly, architects use standardized modeling notations:
- **UML (Unified Modeling Language)**: A standardized modeling language containing diagrams for structure (class, component) and behavior (sequence, state machine).
- **C4 Model**: A hierarchical notation for software architecture:
  - *Context*: The system's relationship to users and other software systems.
  - *Containers*: High-level technical containers (Web Apps, Databases, Workers).
  - *Components*: Component groups within containers (Controllers, Repositories).
  - *Code*: UML class/database schema definitions.
- **ADLs (Architecture Description Languages)**: Formal languages for specifying architectures, enabling automated verification.

### 1.3 adapted Vitruvian Principles
Software architecture must balance three fundamental attributes, derived from Vitruvius' architectural treatise:
- **Firmitas (Structural Strength)**: Software reliability, security, scalability, performance, and resistance to regression.
- **Utilitas (Utility)**: Software usability, business value, correctness, and fitness for stakeholder requirements.
- **Venustas (Clarity/Beauty)**: Maintainability, code readability, low coupling, high cohesion, and clean organizational structure.

### 1.4 Quality Attribute Scenarios
To document quality attributes (non-functional requirements) in a verifiable manner, architects use **Quality Attribute Scenarios**. A quality attribute scenario is a quality requirements specification comprising six parts:
- **Source of Stimulus**: The entity (user, external system, operator) that generates the stimulus.
- **Stimulus**: A condition that requires the system to respond (e.g., a peak load event, an API failure, a security breach).
- **Artifact**: The specific system element affected by the stimulus (e.g., the web server, the database).
- **Environment**: The system state during the stimulus (e.g., normal operation, high network latency, maintenance window).
- **Response**: The activity undertaken after the stimulus (e.g., routing requests to backup instances, logging error codes).
- **Response Measure**: The quantitative threshold to evaluate the response (e.g., database failover occurs within 2.0 seconds, 99.9% of requests complete within 500ms).

### 1.5 Architecture Decision Records (ADRs)
Architectural documentation must capture not only the final structure but also the *rationale* behind the design. An **Architecture Decision Record (ADR)** is a short text document that captures a significant architectural design decision, its context, and its consequences. Each ADR contains:
- **Title**: A short noun phrase naming the decision (e.g., "ADR 01: Use D1 SQLite for Local Rules Cache").
- **Context**: The environmental forces, trade-offs, and problems requiring a decision.
- **Decision**: The chosen course of action and why it was selected over alternatives.
- **Status**: The state of the decision (Proposed, Accepted, Superceded).
- **Consequences**: The implications of the decision, including technical debt, dependency requirements, and downstream work constraints.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures when creating and maintaining architectural documentation in this workspace:

### Step 2.1: Identify Architectural Impact
Before making any changes, the agent must check if the feature alters the system's structure. If the change introduces new files, database tables, API routes, or Bounded Context boundaries, the agent must document the architecture under a "System Architecture" section in the `implementation_plan.md`.

### Step 2.2: Define the Viewpoints
The agent must document the four viewpoints as they apply to the proposed changes:
- **Logical View**: List the primary modules, classes, and helper utilities. In DDD, describe the aggregate roots and value objects.
- **Process View**: Detail the sequence of events (e.g., client requests a route, the router parses parameters, the handler queries the database, and the result is returned). Highlight any asynchronous operations or queues.
- **Development View**: Detail where the new files will reside (e.g., `src/content/rules/` or `packages/agents-build/`) and package dependency updates.
- **Physical View**: Outline the deployment details (e.g., running as a Cloudflare edge worker, connecting to a D1 SQLite database, or third-party webhooks).

### Step 2.3: Construct Mermaid Diagrams
To visualize component interactions and database schemas, the agent must embed Mermaid diagrams in the `implementation_plan.md`.
- Use sequence diagrams for process flows.
- Use entity-relationship diagrams (ERDs) for database schema definitions.
- Ensure all node labels containing special characters are enclosed in quotes to prevent syntax compilation errors.

### Step 2.4: Document Quality Attributes and Trade-Offs
The agent must document how the architecture satisfies quality attributes and state the rationale for design decisions (e.g., using a flat table schema instead of normalization to reduce query latency). This must be written under a "Design Rationale and Trade-Offs" section in the `implementation_plan.md`.

### Step 2.5: Freeze and Trace in Matrix
Link the documented architectural components directly to the requirements in the Traceability Matrix, mapping each design component to its corresponding `REQ-XX` ID.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria during architectural documentation activities:

- [ ] **Viewpoint Completeness**: Are the Logical, Process, Development, and Physical views represented in the documentation?
- [ ] **Logical View Details**: Are the aggregate roots, entities, and helper modules documented?
- [ ] **Process View Sequences**: Is the runtime behavior of the feature mapped from request entry to response output?
- [ ] **Development View Paths**: Are the file paths and repository organization details documented?
- [ ] **Physical View Nodes**: Is the target runtime environment (e.g., Cloudflare Workers, Edge node, D1 SQLite) specified?
- [ ] **Mermaid Diagram Quality**: Are Mermaid diagrams embedded for complex process flows or schema relationships?
- [ ] **Diagram Syntax Check**: Are all special characters in Mermaid node labels enclosed in quotes?
- [ ] **Vitruvian Firmitas (Strength)**: Does the documentation address error boundaries, security scanners, and performance?
- [ ] **Vitruvian Utilitas (Utility)**: Does the design align with the user requirements and Given-When-Then scenarios?
- [ ] **Vitruvian Venustas (Clarity)**: Has the design been analyzed to ensure low coupling and high cohesion?
- [ ] **Design Rationale Recorded**: Is the technical rationale for architectural decisions and trade-offs documented?
- [ ] **Traceability Matrix Integration**: Are all design components mapped to their corresponding requirement IDs?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **API Contracts Documented**: Are all public API endpoints, models, payloads, and integration events defined?
- [ ] **Database Schema Defined**: Is the database design, including columns, keys, and indexes, documented?
- [ ] **Concurrency Control**: Has the Process view analyzed potential race conditions or lock-ups in asynchronous flows?
- [ ] **Task Checklist Match**: Are the architectural implementation tasks mapped to items in `task.md`?
- [ ] **Clean-Up Verification**: Have all temporary visual mocks or drawings been removed from final source folders?
- [ ] **Quality Attribute Scenarios**: Are non-functional requirements specified using the 6-part scenario format?
- [ ] **ADR Registration**: Have all major architectural decisions been documented as ADR sections in the plan?
- [ ] **Mermaid Validation**: Has the agent validated that all Mermaid diagrams render correctly in standard markdown editors?
- [ ] **Integration Interfaces**: Are the APIs and event structures connecting Bounded Contexts fully specified?
