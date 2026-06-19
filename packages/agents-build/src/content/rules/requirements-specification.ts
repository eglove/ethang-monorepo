import { defineRule } from "../../define.ts";

export const requirementsSpecification = defineRule({
  content: `# Requirements Specification

## 1. Domain Theory and Conceptual Foundations
Software requirements specification is the engineering discipline of recording and documenting requirements to ensure they are accurately remembered, verified, and communicated to all stakeholders throughout the software lifecycle. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 4, the primary purpose of specification is to establish a shared, unambiguous agreement on what system is to be constructed. SWEBOK v4 stresses that the chosen specification format should be determined by the nature of the software being constructed, rather than the development lifecycle. Downstream maintainers should not be able to discern whether a waterfall, iterative, or agile lifecycle was used based on the requirements documentation alone; the lifecycle should only affect the completeness of the requirements at any given point in time.

### 1.1 Audience Analysis and Configuration Management
A core principle of requirements specification is **audience analysis**. Requirements are consumed by diverse groups, including clients, customers, project managers, software developers, system architects, software testers, security auditors, and operations staff. The requirements engineer must analyze these audiences to package and present information in formats that satisfy each consumer's needs with minimal cognitive effort. For example:
- Clients and customers require high-level conceptual summaries, business rules, and user stories that validate their business objectives without drowning them in technical details.
- Software developers and architects require precise structured natural language, behavioral statecharts, and structural data models to guide system design and code construction.
- Software testers require clear, pass/fail acceptance criteria and BDD scenarios to derive functional test cases.
- Operations and support staff require operational profiles, deployment dependencies, and performance constraints.

Documented software requirements must be subject to the same configuration management practices as other software engineering deliverables. Individual requirements should be tracked in a database or requirements management tool to manage their attributes, change history, version baselines, and bidirectional traceability. This configuration baseline ensures that changes are introduced through formal review cycles and prevent undocumented scope creep.

### 1.2 Specification Techniques
SWEBOK v4 classifies requirements specification techniques into several general categories:

#### Unstructured Natural Language Specifications
These express requirements in common, everyday language (e.g., "The system shall..."). While highly accessible, unstructured natural language is inherently ambiguous, subjective, and prone to misinterpretation. This format is commonly used to express business rules, which define or constrain some aspect of the structure or behavior of the business to be automated. An example is: "A student cannot register in next semester's courses if there remain any unpaid tuition fees." Unstructured text should be restricted to high-level policies.

#### Structured Natural Language Specifications
To increase precision and conciseness, structured natural language imposes grammatical and formatting constraints. Key structured formats include:
- **Actor-Action Format**: Decomposes requirements into structured statements containing an optional triggering event, an actor (the entity responsible for carrying out the action), an action (what must happen), and an optional condition or qualification. An example is: "When an order is shipped, the system shall create an invoice unless the order terms are prepaid." This format eliminates passive voice and clarifies responsibility.
- **Use Case Specifications**: Detailed templates that document use cases, specifying attributes such as Use Case Name, Triggering Events, Parameters, Pre-conditions (Requires), Post-conditions (Guarantees), Normal Course (step-by-step success flow), Alternative Courses, and Exceptions.
- **User Stories**: A standard format ("As a <user class>, I want <capability> so that <benefit>") used primarily in agile and iterative contexts to capture user needs from their perspective.
- **Decision Tables**: Tabular representations that map combinations of input conditions to specific system outputs, which are highly effective for capturing complex business rules.

#### Acceptance Criteria-Based Specifications
This approach translates requirements into precise test language to eliminate ambiguity:
- **Acceptance Test-Driven Development (ATDD)**: A three-step process (select a unit of functionality, collaborate with business and QA experts to agree on a set of pass/fail acceptance test cases before design or construction begins, and write or modify code to pass the tests). ATDD test cases serve as precise, unambiguous requirements statements.
- **Behavior-Driven Development (BDD)**: A structured approach expressing user stories as concrete scenarios using Given-When-Then syntax. Given defines the initial context, When defines the stimulus, and Then defines the expected outcome. BDD scenarios directly map to acceptance test cases and are highly readable for business stakeholders. While acceptance criteria-based specifications address ambiguity, they do not solve incompleteness. To minimize incompleteness, they must be combined with functional test coverage criteria such as Domain Testing, Boundary Value Analysis, and Pairwise Testing.

#### Model-Based Specifications
These use graphical, technology-free modeling languages (such as UML or SysML) to precisely specify requirements. Requirements models fall into:
- **Structural Models**: Specify business policies and conceptual data structures (e.g., conceptual class models, entity-relationship diagrams).
- **Behavioral Models**: Specify operational processes (e.g., use cases, sequence diagrams, interaction diagrams, statecharts, activity diagrams, and data-flow models).
Formality ranges from Agile Modeling (informal sketches prioritizing communication over notation rules), Semiformal Modeling (modeling language with defined semantics that are not mathematically proved), and Formal Modeling (formal specification languages like Z, VDM, or SDL with mathematically defined semantics). Formal models allow mechanical analysis to prove properties like the absence of deadlock (correctness by construction). Wing's compromise suggests using formally defined underpinnings (Z) for human-readable surface syntaxes (UML statecharts) to balance readability and rigor.

### 1.3 Requirements Attributes and Gilb's Planguage
To manage and trace requirements effectively, documenting additional metadata is useful. Key SWEBOK v4 attributes include: tag (unique identifier for tracing), description, rationale (why it is important), source (stakeholder authorizer), use case/triggering event, type (functional vs. QoS), dependencies, conflicts, acceptance criteria, priority, stability, common/variant classification (for product family development), supporting materials, and change history.
**Gilb's Planguage** (Planning Language) defines quantitative attributes for specifying Quality of Service (QoS) constraints:
- **Scale**: The dimension of measurement (e.g., transactions per second).
- **Meter**: The device or mechanism used to measure the scale in a running system.
- **Minimum**: The fail point or limit of acceptable performance.
- **Target**: The desired level of performance.
- **Outstanding**: Exceptional or stretch performance goals.
- **Past**: The performance level of the previous system.
- **Trend**: The industry average or benchmark.
- **Record**: The best-in-class benchmark.

### 1.4 Incremental vs. Comprehensive Specifications
Projects document requirements using one of two primary strategies:
- **Incremental Specification**: Documents only the differences (additions, modifications, deletions) from the previous baseline, reducing document volume.
- **Comprehensive Specification**: Documents all active requirements in a single, unified view, making it easier for readers to understand the system without tracking a history of cumulative deltas.
Organizations often combine these: intermediate iterations utilize incremental specifications, while major releases consolidate them into a comprehensive specification baseline.

## 2. Compliance Checklist
- [ ] Has an audience analysis been conducted to map requirements packaging and presentation to different consumer needs?
- [ ] Are the requirements documented in a format that is independent of the project's software development lifecycle?
- [ ] Are unstructured natural language statements used exclusively for high-level business rules?
- [ ] Have functional requirements been specified using structured natural language formats (such as Actor-Action, BDD, or Use Cases)?
- [ ] Do BDD Given-When-Then scenarios cover both normal and exception courses of the functional flows?
- [ ] Have the acceptance criteria and test cases been defined prior to design and construction activities?
- [ ] Are Quality of Service (QoS) constraints specified quantitatively using Planguage attributes (Scale, Meter, Minimum, Target)?
- [ ] Have structural policies (conceptual data models) and behavioral processes (statecharts, data flow) been modeled using technology-free UML or SysML?
- [ ] Was the appropriate level of model formality (Agile, Semiformal, or Formal) selected based on project risk and safety profile?
- [ ] Are individual requirements assigned unique identifiers and documented with metadata (source, rationale, priority, stability)?
- [ ] Has each requirement been classified as common or variant to support product family development?
- [ ] Are requirements documents managed under the configuration baseline, with change history and version controls?
- [ ] Has the specification strategy been defined as either Incremental or Comprehensive?`,
  description:
    "requirements specification, natural language, actor-action, BDD scenarios, UML modeling, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-specification",
  trigger: "model_decision"
});
