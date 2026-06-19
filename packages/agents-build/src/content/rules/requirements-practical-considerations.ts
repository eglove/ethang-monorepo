import { defineRule } from "../../define.ts";

export const requirementsPracticalConsiderations = defineRule({
  content: `# Requirements Practical Considerations

## 1. Domain Theory and Conceptual Foundations

### 1.1 Iterative Nature of the Requirements Process
According to the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 7, requirements for typical software products possess both wide breadth and significant depth. Breadth refers to the scope of the system across its various domains, subsystems, and external interfaces, while depth refers to the detailed operational specifications, constraints, and business logic of individual features. 

The simultaneous demand for breadth-wise and depth-wise requirements knowledge creates a natural tension in real-world software engineering projects. It is highly unlikely, if not impossible, that all requirements activities can be successfully completed in a single, linear pass through the subject matter. In practice, software engineers must execute requirements activities iteratively. Elicitation and analysis fluctuate: at certain stages of the lifecycle, the team focuses on expanding the breadth of requirements knowledge to identify new stakeholders and system boundaries, whereas at other stages, they must focus on expanding the depth of specific requirements to support detailed architectural design and implementation. This iterative cycle continues throughout the project to incorporate feedback from design, construction, and early deployments.

### 1.2 Requirements Prioritization
Prioritizing requirements is a critical practical activity throughout the software lifecycle. Its primary purpose is to help the development team focus on delivering the most valuable functionality as early as possible. Prioritization provides the analytical foundation for supporting intelligent trade-off decisions, particularly during conflict resolution and scope matching activities. Additionally, prioritized requirements support long-term system maintenance; defects raised against higher-priority requirements can be addressed before those raised against lower-priority ones.

Determining the priority of a requirement requires evaluating several relevant factors:
- **Value and Desirability**: The positive impact of the requirement on client, customer, and user satisfaction.
- **Undesirability and Dissatisfaction (The Kano Model)**: SWEBOK v4 emphasizes that evaluating value alone can lead to erroneous priorities. Engineers must analyze how unhappy stakeholders would be if a requirement were not satisfied. Under the Kano model, requirements are categorized into different classes of customer needs. For example, a basic need (such as handling email attachments in an email client) might not generate high satisfaction if implemented because users expect it as a default capability. However, its absence will cause extreme dissatisfaction, making it a high-priority requirement. Conversely, a delighter feature (such as an advanced search filter) might generate high satisfaction but cause zero dissatisfaction if omitted.
- **Cost to Deliver**: The total engineering effort, resources, and time required to design, implement, and validate the requirement.
- **Cost to Maintain**: The long-term costs associated with operating, supporting, and maintaining the software feature over its service life.
- **Technical Risk**: The probability of encountering technical difficulties, performance bottlenecks, or architectural constraints during implementation.
- **User-Adoption Risk**: The risk that users will fail to adopt or utilize the feature even if it is successfully implemented.

To convert these factors into a priority expression, organizations utilize objective functions or mathematical formulas. The choice of measurement schemes (e.g., ratio scales vs. ordinal scales) constrains the structure of the objective function. Once priorities are established, they must be specified in a clear, communicable format. SWEBOK v4 identifies three common prioritization schemes:
- **Enumerated Scale**: Grouping requirements into discrete categories (e.g., "must have," "should have," "nice to have").
- **Numerical Scale**: Assigning a relative score (e.g., 1 to 10) to each requirement.
- **Sorted Lists**: Arranging requirements in a single, ordered list from highest to lowest priority.

Rather than building overly rigorous measurement scales or debating minor differences, effective requirements prioritization focuses on grouping requirements with similar priorities to support release planning and sprint selection.

### 1.3 Requirements Tracing
Requirements tracing is the process of documenting the relationships between requirements and other software engineering artifacts. SWEBOK v4 identifies two primary purposes for requirements tracing:

1. **Work Product Consistency (Accounting Exercise)**: Tracing serves as an engineering audit to verify consistency between pairs of related project work products. By checking if design elements exist for each requirement, engineers ensure that every requirement is satisfied in the design. If a requirement lacks a matching design element, it remains unsatisfied. Conversely, by checking if requirements exist for each design element, engineers can identify "gold-plating" (unnecessary design elements that do not trace back to any approved requirement) or uncover incomplete requirements.
2. **Impact Analysis of Proposed Changes**: Tracing is essential for analyzing the technical impact of a requirements change. If a system requirement changes, tracing allows engineers to identify the linked software requirements, design elements, code components, and test cases that must be updated. This creates a clear "footprint" of the work required to implement the change, allowing the team to estimate costs, schedules, and regression risks accurately.

Traceability operates in two directions:
- **Backward Tracing**: Linking software requirements back to their original sources, such as system requirements, standards documents, or customer requests.
- **Forward Tracing**: Linking software requirements forward to design components, source code files, requirements-based test cases, and sections of the user manual.

### 1.4 Requirements Stability and Volatility
Requirements stability measures how likely a requirement is to remain unchanged over the software product's service life, whereas requirements volatility refers to the rate at which requirements are modified, added, or deleted during a project. 

SWEBOK v4 notes that requirements vary in their stability:
- **Highly Stable Requirements**: Core domain capabilities that are unlikely to change (e.g., calculating interest on a banking account).
- **Volatile Requirements**: Requirements that are susceptible to external changes, such as shifting government regulations, tax laws, or market competition (e.g., specific tax-free account rules).
- **Highly Unstable Requirements**: Requirements that change multiple times during the active development project.

Assessing the likelihood of change for each requirement allows software engineers to design architectures that are tolerant of change, localizing volatile requirements within modular boundaries to prevent regression cascades.

### 1.5 Measuring Requirements
Measuring requirements provides quantitative visibility into the requirements engineering process and the software's scale. SWEBOK v4 highlights the utility of measuring requirements size or volume to estimate development costs, task durations, and to serve as a denominator for other software metrics.

Common requirements measurement techniques include:
- **Functional Size Measurement (FSM)**: A standardized technique (such as IFPUG or COSMIC function points) that evaluates the size of a software product based on its functional requirements, independent of implementation technology.
- **Story Points**: An agile sizing metric used to represent the relative effort and complexity of user stories.
- **Quality Indicators**: Metrics that evaluate individual requirements and the requirements specification document as a whole, derived from basic analysis properties (e.g., measuring the percentage of unambiguous, traceable, and verified requirements in a specification).

### 1.6 Requirements Process Quality and Improvement
This subtopic addresses the quality and continuous improvement of the requirements engineering process itself. SWEBOK v4 stresses that requirements process quality has a direct impact on product cost, development timeliness, and customer satisfaction.

Process quality and improvement include:
- **Process Maturity Standards**: Evaluating the organization's requirements engineering process against established maturity frameworks (such as CMMI).
- **Process Measures and Benchmarking**: Collecting metrics on requirements engineering performance (e.g., requirements defect density, requirements leak rate) and comparing them against industry benchmarks.
- **Improvement Planning and Implementation**: Identifying process bottlenecks and implementing structured changes to requirements activities.
- **Security/CIA Improvement Planning**: Planning and implementing improvements focused on maintaining the confidentiality, integrity, and availability (CIA) of the requirements data and the resulting software system.

---

## 2. Agent Compliance Checklist

- [ ] **Iterative Execution**: Have the requirements activities (elicitation, analysis, specification, validation) been planned and executed iteratively to balance breadth-wise and depth-wise system knowledge?
- [ ] **Prioritization Analysis**: Was a requirements prioritization analysis performed, weighing factors such as value, cost, technical risk, user-adoption risk, and long-term maintenance costs?
- [ ] **Kano Model Dissatisfaction Check**: Did the prioritization consider the dissatisfaction stakeholders would experience if a requirement was omitted, rather than focusing solely on positive feature value?
- [ ] **Priority Specification**: Are requirements priorities clearly specified using an enumerated scale, numerical scale, or sorted lists, and communicated to stakeholders?
- [ ] **Bidirectional Traceability**: Has bidirectional requirements tracing been established, linking software requirements backward to their sources and forward to design elements, source code files, and test cases?
- [ ] **Traceability Audit**: Were consistency checks performed to ensure no design elements exist without justifying requirements (preventing gold-plating) and all requirements have matching design elements?
- [ ] **Volatility Risk Assessment**: Have volatile and unstable requirements (such as those tied to regulatory changes) been identified, and was the system architecture designed defensively to tolerate their change?
- [ ] **Requirements Sizing**: Has the volume or size of the requirements been measured quantitatively using Functional Size Measurement (FSM) or story points to support estimation?
- [ ] **Process Quality Benchmarking**: Were requirements process quality metrics (such as requirements defect density or leak rate) collected and evaluated against standard process improvement models?
- [ ] **Security and CIA Planning**: Have process improvements and planning been implemented to ensure confidentiality, integrity, and availability of the requirements baseline?`,
  description:
    "requirements practical considerations, prioritization, tracing, stability, measurement, process improvement, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-practical-considerations",
  trigger: "model_decision"
});
