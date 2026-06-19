import { defineRule } from "../../define.ts";

export const engineeringManagementPlanning = defineRule({
  content: `# Engineering Management Planning

## 1. Domain Theory and Conceptual Foundations
Software engineering management planning is the systematic application of engineering and management principles to the definition, organization, estimation, and control of software projects. As outlined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 7 (Software Engineering Management), planning is a continuous, iterative activity that spans the entire software lifecycle. A project plan serves as a living document that coordinates resources, manages uncertainty, mitigates technical and process risks, and establishes quality assurance baselines. Effective planning requires understanding the continuum of software development lifecycles, establishing rigorous estimation processes, organizing responsibilities, managing risks proactively, and implementing systematic quality gates.

### 1.1 Software Development Lifecycle (SDLC) Model Selection and Tailoring
A primary step in software project planning is the selection and tailoring of an appropriate Software Development Lifecycle (SDLC) model. This decision is driven by the project's scope, the nature of its requirements, technical complexity, the application domain, and the initial risk assessment. SDLC models are not rigid templates; rather, they must be tailored to align the development process with project constraints. Tailoring involves customizing phase boundaries, definition of deliverables, verification milestones, and the roles of team members. Factors such as safety-critical constraints, regulatory compliance requirements, and integration complexity dictate whether a project requires highly structured phase gates or highly iterative, feedback-driven workflows.

### 1.2 The Predictive versus Adaptive Planning Continuum
Software project lifecycles occupy a continuum ranging from highly predictive (plan-driven) to highly adaptive (change-driven).
- **Highly Predictive Lifecycles**: These models, including waterfall and incremental development, emphasize exhaustive upfront requirements specification, detailed architectural design, and meticulous schedule planning. Predictive planning assumes that requirements and constraints are stable and well-understood. Risk and cost are managed by minimizing deviations from the baseline plan. Stakeholder involvement is typically structured around formal milestones (e.g., system requirements reviews, software design reviews) rather than continuous collaboration.
- **Highly Adaptive Lifecycles**: These models, characterized by Agile software development approaches, are designed to accommodate emergent requirements and high uncertainty. Planning is progressive and occurs in short, iterative cycles. Risk and cost are mitigated by producing functional increments of software frequently, allowing stakeholders to evaluate progress and refine requirements in real time. Rather than relying on a rigid upfront schedule, adaptive projects utilize progressive elaboration to adjust plans dynamically based on empirical feedback.

### 1.3 Quality Management, SQA, and Verification & Validation (V&V) Planning
Software quality management processes must be integrated directly into the initial project plan. Quality planning establishes the procedures, responsibilities, and standards required to ensure that all project deliverables satisfy stakeholder needs. This involves specifying plans for Software Quality Assurance (SQA) to monitor process compliance and prevent defects, Verification and Validation (V&V) to ensure the product conforms to its specifications and fulfills its intended purpose, and scheduled technical reviews or audits of design artifacts and code bases to enforce quality gates.
Quality requirements must be identified both quantitatively and qualitatively, aligning with the ISO/IEC 25000 (Systems and Software Quality Requirements and Evaluation - SQuaRE) series of standards. These standards classify quality attributes into categories such as safety, security (cybersecurity), reliability, availability, performance efficiency, usability, and maintainability. This structured taxonomy ensures that quality measurement is consistent with ISO/IEC/IEEE 15939 and practical software and systems measurement (PSM) frameworks, enabling teams to define and track objective, quantitative metrics.

### 1.4 Effort, Schedule, and Cost Estimation
Estimating the resources, schedule, and cost of a software project is an inherently error-prone process. The primary source of variability is the human element, which includes individuals' experience levels, capabilities, team dynamics, communication effectiveness, and the culture of the development environment. Furthermore, dynamic factors such as rapid technology evolution, emergent requirements, and the intangible nature of software products introduce significant uncertainty.
To manage this uncertainty, software managers should utilize multiple estimation techniques and reconcile their differences:
- **Calibrated Estimation Models**: Parametric models that estimate effort based on historical size (such as function points or lines of code) and team productivity data.
- **Bottom-Up Estimation**: Techniques where the individuals responsible for performing the work estimate their individual tasks, which are then aggregated to establish a project-wide estimate.
Task dependencies must be identified and mapped to define concurrent and sequential execution paths. These paths are typically documented using Gantt charts or network diagrams to identify the critical path. In predictive projects, this schedule is established upfront; in adaptive projects, overall schedule constraints are negotiated, and resources are allocated to a budgeted number of iterative cycles.

### 1.5 Resource Allocation and the RACI Responsibility Model
Resource planning translates the demand for personnel, specialized tools, and facilities into concrete cost estimates. The estimation and allocation of these resources is an iterative process of negotiation and revision among stakeholders. To coordinate tasks, responsibilities are assigned using a RACI matrix model: Responsible (R) roles execute the work; Accountable (A) roles have ultimate decision-making and approval authority (restricted to one role per task); Consulted (C) experts provide guidance; and Informed (I) stakeholders are kept updated. This model prevents organizational ambiguities and ensures clear ownership.

### 1.6 Risk Management and Project Abandonment
Risk is the effect of uncertainty on project objectives, characterized by negative consequences (threats) or positive consequences (opportunities). SWEBOK v4 defines risk management as a continuous process containing identification, analysis, prioritization, planning, and monitoring. Risk identification and analysis utilize expert judgment, historical checklists, and decision trees, documenting findings in a Risk Register. Risk handling strategies formulate proactive or reactive responses, including risk avoidance, mitigation, transfer, acceptance (active with contingency reserves, or passive), and contingency planning.
Software projects face unique risks, including the intangible nature of software and "gold plating" (the tendency of engineers to add unneeded features that increase architectural complexity and maintenance costs). Project planning must establish objective project abandonment conditions. These are pre-agreed triggers (e.g., cost overruns, schedule delays, or unfeasible quality requirements) where all stakeholders agree to terminate the project to prevent further wasteful expenditure.

### 1.7 Plan Management and the Role of the PMO
Plans must be systematically monitored, controlled, and revised. Supporting plans—such as those for software configuration management (SCM), documentation, and problem resolution—must also be managed.
In predictive projects, project managers put substantial effort into upfront plan development, often supported by specialized estimation experts in a Project Management Office (PMO). The PMO standardizes processes, collects historical project data, and helps calibrate estimation models.
In adaptive projects, where formal upfront plans are minimized, managers focus on establishing monitoring and control processes—specifically requirements traceability—to maintain coordination among teams as emerging plans are implemented. Requirements traceability ensures that every requirement can be traced to design, code, and test cases, providing visibility and alignment throughout the project lifecycle.

## 2. Compliance Checklist
1. Has a formal Software Development Lifecycle (SDLC) model been selected and tailored based on the project scope, software requirements, and a risk assessment?
2. Were the positions of the software project lifecycle on the predictive-to-adaptive continuum explicitly defined, including requirements handling and stakeholder involvement?
3. Were application domain characteristics, technical complexity, and software quality requirements formally evaluated when tailoring the lifecycle model?
4. Is there an initial risk assessment that documents and gains stakeholder acceptance of the project's risk profile?
5. Has a software quality management plan been established that defines procedures and responsibilities for software quality assurance (SQA), verification and validation (V&V), technical reviews, and audits?
6. Are there defined processes and responsibilities for the ongoing review and revision of the project plan throughout its lifecycle?
7. Were multiple estimation approaches used to estimate effort, schedule, and cost, and were their differences reconciled?
8. Does the cost estimation account for human elements, including individual capability, team dynamics, and culture of the development environment?
9. Was a calibrated estimation model based on historical size and effort data utilized and reconciled with bottom-up estimation?
10. Are task dependencies identified and documented using a visualization tool (e.g., a Gantt chart) showing concurrent and sequential paths?
11. Has a RACI matrix (Responsible, Accountable, Consulted, Informed) been established to assign tasks and deliverables?
12. Is there a continuous risk management process that identifies, analyzes, prioritizes, and develops mitigation plans for risks?
13. Is a formal risk register maintained to track risk factors, probabilities, impacts, exposures, and compliance data?
14. Have explicit project abandonment conditions been negotiated and agreed upon by all relevant stakeholders?
15. Are software-unique risk factors, such as the tendency of engineers to add unneeded features or the intangible nature of software, accounted for?
16. Are software quality requirements, specifically safety and security (cybersecurity), prioritized in the risk management plan?
17. Does the quality plan align with the ISO/IEC 25000 series of standards and ISO/IEC/IEEE 15939 measurement frameworks?
18. Are plans and processes for supporting activities (e.g., software configuration management, documentation, problem resolution) managed?
19. Does the project monitoring and reporting mechanism match the chosen SDLC and actual constraints of the project?
20. In adaptive lifecycles, is requirements traceability implemented to monitor coordination and control as emerging plans evolve?`,
  description:
    "software project planning, SDLC model selection, cost/schedule estimation, risk assessment, and plan management",
  filename: "engineering-management-planning",
  trigger: "model_decision"
});
