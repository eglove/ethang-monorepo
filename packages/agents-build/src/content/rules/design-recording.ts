import { defineRule } from "../../define.ts";

export const designRecording = defineRule({
  content: `# Recording Software Designs

## 1. Domain Theory and Conceptual Foundations
Recording software designs is the systematic engineering practice of capturing, documenting, and archiving the knowledge, structures, behaviors, and design decisions generated during the software design process. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 3, Section 4, the work products of software design serve as the blueprints for implementation. These descriptions translate the problem domain's vocabulary into a technical solution vocabulary, establishing a shared understanding among stakeholders. Software design descriptions (SDDs) or design specifications can take the form of texts, diagrams, structural models, and interactive prototypes.

An essential concept in design recording is distinguishing between in-process ("working") specifications and final design products. Working specifications are produced by and for the design team as transient, evolving documents to guide synthesis and explore alternatives. Final design products are formal deliverables created for external stakeholders, such as customers, implementers, quality assurance teams, and system certifiers. A project must make conscious, cost-driven decisions about which design specifications are needed based on the target audience, level of detail required, and long-term maintenance needs. In agile lifecycles, the evolving design may remain implicit in code or refactored unit tests, whereas plan-driven or high-assurance lifecycles demand explicit, independent, and comprehensive design specifications.

### 4.1 Model-Based Design (MBD)
Model-Based Design represents a paradigm shift from traditional document-centric artifacts to executable, tool-supported models where models serve as the primary source of truth. Document-centric design, which relies on natural language texts and isolated sketches, often introduces semantic ambiguity, incompleteness, and fragmentation. Important architectural relationships are often spread across separate documents, making design analysis and verification difficult. Model-Based Design addresses these limits by leveraging automated tools to gather, organize, and validate design information in a unified structure:
- **Simulation and Animation**: Allowing designers to animate and execute models, run what-if analyses, and evaluate performance trade-offs under simulated workloads before writing production code.
- **Traceability**: Providing automated, interactive links that connect high-level requirements to specific design components, code implementations, and verification tests.
- **Rapid Prototyping**: Generating functional user interfaces and mockups directly from design models to secure early stakeholder feedback.
- **Model-Driven Development (MDD)**: A development approach where models are formal, machine-readable specifications from which source code, database schemas, test cases, and documentation are automatically generated, minimizing coding errors.

### 4.2 Structural Design Descriptions (Static Views)
Structural design descriptions capture the static organization of a software system, modeling the major components, modules, interfaces, and their physical or logical connections.
- **Class and Object Diagrams**: Graphically representing classes, objects, properties, methods, and their static relationships (inheritance, association, aggregation, composition).
- **Component Diagrams**: Representing replaceable, modular elements that conform to and implement specific interfaces, showing packaging and dependency boundaries. These component models evolved from early module interconnection languages into the package and module systems of modern programming runtimes.
- **Class-Responsibility-Collaborator (CRC) Cards**: A collaborative design technique documenting the name of a component, its primary responsibilities, and the other components (collaborators) it interacts with to fulfill those responsibilities.
- **Deployment Diagrams**: Modeling the physical allocation of software components, containers, and database instances onto execution environments, cloud nodes, and hardware topologies.
- **Entity-Relationship Diagrams (ERDs)**: Modeling the conceptual, logical, or physical data structures and cardinalities stored in relational databases or information repositories.
- **Interface Description Languages (IDLs)**: Program-like languages used to define component interfaces (method signatures, parameter types, exceptions, and return values) independently of the implementation language.
- **Structure Charts**: Describing the calling hierarchy of programs, showing which subroutines call and are called by other modules.

### 4.3 Behavioral Design Descriptions (Dynamic Views)
Behavioral design descriptions model the dynamic characteristics, execution flows, and state transitions of the software system during runtime execution.
- **Activity Diagrams**: Modeling the flow of computations from one activity to another, capturing control flows, conditional decisions, object flows, and opportunities for parallel execution.
- **Interaction Diagrams**: Capturing communication patterns among groups of collaborating objects. This includes **Sequence Diagrams** (which emphasize the temporal ordering of messages) and **Communication/Collaboration Diagrams** (which emphasize the structural connections and links on which messages are exchanged).
- **Data Flow Diagrams (DFDs)**: Mapping the flow of information through a network of processing elements. DFDs are also used in security analysis to identify trust boundaries and potential paths for attack or unauthorized data disclosure.
- **Decision Tables and Diagrams**: Graphical or tabular representations mapping complex combinations of logical conditions to specific operational actions.
- **Flowcharts**: Diagrammatic representations of control flows, sequential execution paths, and associated actions.
- **State Transition Diagrams and Statecharts**: Modeling how a component's behavior changes dynamically in response to external events, defining states, transitions, event triggers, guards, and entry/exit actions.
- **Formal Specification Languages**: Mathematically grounded textual notations (often using logic, set theory, and sequences) that define interfaces and behaviors in terms of pre-conditions, post-conditions, and class invariants, enabling formal correctness proofs.
- **Pseudocode and Program Design Languages (PDLs)**: Structured, language-like textual walkthroughs used to outline algorithms at the detailed design stage.

### 4.4 Design Patterns and Styles
A design pattern is a proven, reusable solution to a recurring design problem within a specific context. Applying design patterns establishes a shared vocabulary, documents architectural decisions, and promotes structural reuse.
- **Creational Patterns**: Decouple the system from how its objects are instantiated, providing flexible object creation mechanisms (e.g., Builder, Factory Method, Abstract Factory, Prototype, Singleton).
- **Structural Patterns**: Focus on class and object composition, designing relationships to assemble larger, cohesive structures while maintaining interface flexibility (e.g., Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy).
- **Behavioral Patterns**: Address the delegation of responsibilities and algorithms, coordinating communication and control flows between objects (e.g., Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor).
- **Architectural Styles**: Patterns "in the large" that define the global structural organization, component types, and communication constraints of the entire system.

### 4.5 Specialized and Domain-Specific Languages (DSLs)
Certain design concerns are not easily captured by standard structural or behavioral diagrams. User interface design, for instance, requires a hybrid representation that mixes static screen layouts with the behavioral logic of screen sequencing based on user actions.
- **Domain-Specific Languages (DSLs)**: Specialized languages that codify the concepts, constructs, and constraints of a particular application domain (e.g., simulation parameters, game mechanics, user interface layouts, test scripts).
- **Grammar-Driven Tools**: Maturing tools that parse a DSL definition to automatically generate graphical user interfaces, compilers, syntax checkers, and linkers, streamlining the path from design to execution.

### 4.6 Design Rationale
Design rationale documents the underlying reasoning, assumptions, and constraints behind architectural and design choices. It records *why* a design decision was made, rather than just *what* was implemented.
- **Decision Tracking**: Logging assumptions made, alternatives considered, trade-offs analyzed, and selection criteria applied.
- **Rejected Alternatives**: Explicitly documenting which design options were rejected and the specific reasons for their rejection.
- **Long-Term Maintainability**: Enhancing the viability of the software during maintenance by preventing future developers from re-evaluating failed design paths when assumptions or requirements change.

## 2. Compliance Checklist
- [ ] Has the target audience and purpose of the design documentation been identified to determine the appropriate level of detail?
- [ ] Were design specifications structured to represent both the structural organization and the behavioral dynamics of the system?
- [ ] Was Model-Based Design (MBD) evaluated to replace document-based design to support simulations or automated testing?
- [ ] Have structural design descriptions been created using appropriate notations (class, component, deployment, ERD, IDL)?
- [ ] Are physical hardware allocations and network configurations recorded in a deployment diagram?
- [ ] Did the data storage architecture trace back to a conceptual or physical Entity-Relationship Diagram (ERD)?
- [ ] Were behavioral design descriptions (sequence, activity, statechart, flowchart) selected to represent complex runtime execution paths?
- [ ] Is the temporal sequence of messages and object interactions documented in sequence diagrams?
- [ ] Have complex combinations of conditions and logical rules been structured into decision tables?
- [ ] Are state-dependent components modeled with statecharts detailing states, transitions, events, and guards?
- [ ] Have proven creational, structural, or behavioral design patterns been utilized to resolve common design problems?
- [ ] Did the design utilize or define Domain-Specific Languages (DSLs) to model specialized concerns like user interfaces or simulation parameters?
- [ ] Is the design rationale documented for every nontrivial design decision?
- [ ] Did the design rationale capture the assumptions, alternatives considered, and trade-offs analyzed?
- [ ] Have rejected design alternatives been logged along with the reasons for their rejection?
- [ ] Were design descriptions verified as containing both the problem vocabulary and the technical solution vocabulary?
- [ ] Are design descriptions baseline-locked and tracked in version control to support regression reviews?`,
  description:
    "recording software designs, design descriptions, design specifications, model-based design, structural design, behavioral design, class diagrams, component diagrams, CRC cards, deployment diagrams, entity-relationship diagrams, interface description languages, IDL, sequence diagrams, activity diagrams, statecharts, flowcharts, data flow diagrams, design patterns, creational structural behavioral patterns, domain-specific languages, DSL, design rationale, design decisions, architectural blueprints, planning, plan mode, grill-me, or documenting software designs and specifications using the antigravity cli",
  filename: "design-recording",
  trigger: "model_decision"
});
