import { defineRule } from "../../define.ts";

export const architectureFundamentals = defineRule({
  content: `# Software Architecture Fundamentals

## 1. Domain Theory and Conceptual Foundations

Software architecture is a critical subdiscipline of software engineering that deals with the high-level organization, structure, and foundational properties of software systems. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2, Section 1, software architecture serves as the vital bridge between requirements engineering and detailed software design. It establishes the structural framework within which a system is built, constraining downstream design choices and defining how a system interacts with its broader environment.

### 1.1 The Definition and Evolution of Software Architecture
The definition of software architecture has evolved as software complexity has grown. Early literature relied on structural definitions, such as IEEE Std 610.12-1990: "the organizational structure of a system or component." This was recognized as insufficient because it failed to distinguish architecture from detailed design (such as a module's internal logic) or from build configurations. It also ignored the relationships and behaviors that emerge from those components.

To address these limitations, the software engineering community formulated broader, more robust definitions during the mid-1990s. Bass, Clements, and Kazman defined software architecture as "the set of structures needed to reason about the system. These structures comprise software elements, relations among them, and properties of both." This definition highlights that a software system is composed of multiple concurrent structures, which cannot be captured in a single model. Reasoning about performance, security, or modifiability requires examining different structures (such as module structures, runtime component-and-connector structures, and physical allocation structures).

The current consensus is reflected in ISO/IEC/IEEE 42010:2011, which defines architecture as the "fundamental concepts or properties of a system in its environment embodied in its elements, relationships, and in the principles of its design and evolution." This modern definition introduces three crucial insights:
1. **Focus on the Fundamental**: Architecture is not concerned with every minor detail, interface, or line of code. Instead, it encompasses only those elements, relations, and principles that are essential to the system's identity, quality attributes, and lifecycle.
2. **System in its Environment**: Unlike classical programming, which focuses on closed algorithms, software architecture is outward-looking. It explicitly considers the system in its operational, business, social, and organizational contexts, mapping how the software interacts with people, organizations, other software systems, hardware, and physical environments.
3. **Principles of Design and Evolution**: Architecture is not static. It includes the design rationale, the history of decisions, and the principles that govern how the architecture will adapt and evolve over time without degrading.

### 1.2 The Senses of "Architecture"
In professional practice, the term "architecture" is employed in three distinct but closely interrelated senses:
1. **Architecture as a Discipline**: This represents the art and science of designing and constructing software-intensive systems. It encompasses the accumulated body of knowledge, concepts, principles, processes, and methods discovered and adopted by the software community.
2. **Architecture as a Process**: This refers to the engineering lifecycle and activities through which the discipline is realized. Software architecture process is integrated into the broader software design lifecycle, typically divided into three primary stages: the architectural design stage, the high-level design stage, and the detailed design stage. Architectural design sets the boundaries, while high-level and detailed design elaborate on the internal logic of the partitioned components.
3. **Architecture as an Outcome**: This refers to the concrete structural layout and properties of the system resulting from the architectural design process. Architectures as outcomes are documented and communicated via architecture descriptions.

Within these senses, a critical distinction must be maintained between prescriptive and descriptive architectures:
- **Prescriptive Architecture**: Represents the design intent—the planned or specified structures, constraints, and principles of a system before implementation. It acts as the authoritative blueprint that guides construction.
- **Descriptive Architecture**: Represents the actual, as-built structure of the system as implemented in the source code, database schemas, and deployment configurations.
- **Architectural Drift and Erosion**: Occurs when the descriptive architecture deviates from the prescriptive design. This deviation is typically driven by ad-hoc developer modifications, shortcut integrations, or undocumented dependencies. Over time, architectural drift degrades the structural integrity of the system, leading to erosion, increased technical debt, and eventual unmaintainability.

Furthermore, engineers must distinguish software architecture from system architecture and detailed design:
- **System Architecture**: A comprehensive viewpoint encompassing hardware nodes, physical networks, operational workflows, business processes, and human-machine interfaces.
- **Software Architecture**: A specialized subset focusing on the organization of software elements, their runtime connectors, and data allocation boundaries.
- **Detailed Design**: Focuses on the internal implementation details of individual modules (e.g., local algorithms, object structures, class properties), operating strictly within the boundaries established by the software architecture.

### 1.3 Stakeholders and Concerns
A software system must satisfy diverse stakeholders with different interests, termed concerns. Dijkstra's "separation of concerns" is the key cognitive technique to manage this, allowing engineers to study one aspect in isolation for consistency while knowing it is only one facet. Stakeholders include:
- **Customers**: Concerned with cost, schedule, and business alignment.
- **Users**: Concerned with functionality, usability, performance, and availability.
- **Developers**: Concerned with maintainability, testability, modularity, and clear interfaces.
- **Operations**: Concerned with deployability, scalability, monitorability, and resource utilization.
- **Security/Safety Officers**: Concerned with confidentiality, integrity, availability, and safety.

These stakeholder concerns encompass developmental, technological, business, operational, organizational, political, economic, legal, regulatory, ecological, and social influences. They can be classified into:
1. **Functional Concerns**: What the system is expected to do, including use cases, business rules, and domain interactions.
2. **Quality Attribute Concerns**: How well the system performs, representing the "ilities" (reliability, scalability, performance, security, and modifiability) and emergent properties (both desired behaviors and prohibited safety hazards).
3. **Constraint Concerns**: Boundaries placed on development, such as technology limitations, legacy system interfaces, development budgets, regulatory compliance, and time-to-market.

Concerns are not static; they evolve over the system's lifecycle as technologies and societal priorities shift. For example, modern software systems must increasingly address energy efficiency and sustainability as primary architectural concerns due to the growing awareness of climate change and operational cost constraints.

### 1.4 Uses of Software Architecture
A documented software architecture serves several critical purposes in the engineering lifecycle:
1. **Stakeholder Communication**: Provides a high-level vocabulary allowing diverse stakeholders to discuss and align on system properties and requirements.
2. **Early Analysis**: Enables evaluating design alternatives (using simulation or prototyping) before construction, reducing risk and rework costs.
3. **Design Guidance**: Establishes rules, styles, and patterns that downstream developers must follow during construction, preventing design erosion.
4. **Testing and Integration**: Defines subsystem boundaries and interfaces, providing a blueprint for integration, system, and acceptance tests.
5. **Software Product Lines**: Enables reuse by identifying commonalities and managing variabilities across a family of related programs, supporting customizable components.
6. **Conway's Law and Mirroring**: Organizations design systems that mirror their communication structures. Architects must analyze this alignment: when aligned, it enhances collaboration; when misaligned, it introduces overhead.
7. **Reverse Architecting**: Allows understanding legacy systems by reconstructing the architecture to identify dependencies, evaluate technical debt, and plan changes.

## 2. Compliance Checklist

- [ ] **Senses of Architecture Mapping**: Has the system been analyzed through its three distinct senses: as a discipline (applying established methods), as a process (architectural, high-level, and detailed design stages), and as an outcome (producing a concrete architecture description)?
- [ ] **Prescriptive vs. Descriptive Alignment**: Have the prescriptive design intent and the descriptive as-built structures been audited to identify and mitigate architectural drift or erosion?
- [ ] **Environment Context Analysis**: Has the software system been evaluated in its environment, documenting interactions with external stakeholders, organizations, other software systems, and hardware devices?
- [ ] **Stakeholder Concern Separation**: Have the concerns of all key stakeholders (acquirers, users, developers, operations, security officers) been identified, documented, and separated to prevent design conflicts?
- [ ] **Quality Attribute & Emergent Property Mapping**: Have quality attributes and emergent properties (such as reliability, security, availability, modifiability, sustainability, and energy efficiency) been mapped to specific structural components?
- [ ] **Constraint Identification**: Have functional, non-functional, and constraint concerns (including regulatory, ecological, and economic constraints) been classified and analyzed?
- [ ] **Early Alternative Evaluation**: Has the architecture been used as a baseline to analyze, simulate, and evaluate alternative design solutions before downstream construction begins?
- [ ] **Reverse Architecting Feasibility**: Is the architecture described with sufficient clarity to support reverse engineering/reverse architecting for future maintenance and evolution?
- [ ] **Conway's Law and Mirroring Check**: Has the design been analyzed to determine if its structure mirrors the organization's communication paths, evaluating if this mirroring represents a strength or weakness?
- [ ] **Product Line and Variability Analysis**: If the software belongs to a program family or software product line, has a commonality and variability analysis been performed to support reusable and customizable components?`,
  description:
    "software architecture fundamentals, system design, architectural patterns, stakeholders and concerns, uses of architecture, get_architecture, codebase graph, SARA CLI, rtk sara, planning, plan mode, grill-me, or defining architectural boundaries and significant decisions before construction",
  filename: "architecture-fundamentals",
  trigger: "model_decision"
});
