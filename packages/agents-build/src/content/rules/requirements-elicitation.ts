import { defineRule } from "../../define.ts";

export const requirementsElicitation = defineRule({
  content: `# Requirements Elicitation

## 1. Domain Theory and Conceptual Foundations
Software requirements elicitation is the disciplined, active engineering process of discovering, capturing, acquiring, and surfacing candidate requirements for a software system throughout its service life. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 2, elicitation is not a passive task of collecting ready-made specifications or simply recording stakeholder requests. Instead, it is an active, cognitive, and collaborative discovery process. Requirements are often hidden, unstated, or poorly understood by the stakeholders themselves. Incompleteness is one of the most common and critical problems in requirements work, and well-executed elicitation is the primary defense against incomplete specifications.

### 1.1 Requirements Sources
SWEBOK v4 emphasizes that requirements must be elicited from a comprehensive set of sources, all of which must be identified and evaluated systematically. These sources are broadly classified into human stakeholders and non-human sources.

#### Human Sources: Stakeholders
A stakeholder is defined as any person, group, or organization that is actively involved in the project, affected by the project's outcome, or capable of influencing its outcome. Key human stakeholder classes include:
- Clients: Those who pay for the software to be constructed, such as organizational sponsors or senior management.
- Customers: Those who decide whether a software product will be put into service or purchased.
- Users: Those who interact directly or indirectly with the software. SWEBOK v4 notes that users must be segmented into distinct user classes based on dimensions such as frequency of use, specific tasks performed, skill and knowledge levels, and privilege profiles.
- Subject Matter Experts (SMEs): Domain specialists who understand the business rules, policies, manual operations, and specific business procedures.
- Operations Staff: Those responsible for executing, deploying, and maintaining the software in production.
- First-Level Product Support Staff: Those who handle end-user queries, bug reports, and operational challenges.
- Professional Bodies and Regulatory Agencies: Entities that impose compliance standards, industry regulations, or legal frameworks.
- Special Interest Groups: Entities representing specific viewpoints, such as accessibility advocates.
- Negative Stakeholders: People who can be negatively affected if the project is successful.
- Developers: The technical staff responsible for implementation, architecture, and deployment.

#### Stakeholder Analysis and Stakeholder Classes
To prevent requirements bias toward well-represented groups, software engineers must perform a stakeholder analysis. This analysis identifies all relevant stakeholder classes, captures their distinct perspectives, and informs negotiation and conflict resolution when different stakeholder classes express conflicting needs. Relying on individual stakeholders without grouping them into classes risks missing critical viewpoints.

#### Non-Person and Other Sources
Requirements are also derived from non-person sources:
- Previous Versions: Analyzing legacy systems to understand existing capabilities and limitations.
- Defect Databases: Inspecting defect tracking systems from previous versions to identify unresolved problems or frequent user mistakes.
- Interfacing Systems: Evaluating systems that will exchange data or control signals with the system under development.
- Business Context: Documenting organizational policies, workflows, business strategies, and mission statements.
- Computing Environment: Identifying constraints imposed by the target platform, deployment infrastructure, or physical network.
- Literature and Benchmarking: Conducting literature searches, standards reviews, and competitive benchmarking.
- Design Artifacts: Analyzing concept of operations (ConOps) and product vision documents.

### 1.2 Elicitation Techniques
A wide variety of techniques can be deployed to surface candidate requirements. The choice of technique depends on the target stakeholder class and the nature of the application:
1. **Interviews**: Structured (guided by a predefined questionnaire) or unstructured (open-ended) conversations. Interviews are highly effective for extracting high-level goals but are limited by stakeholders' ability to articulate their needs.
2. **Meetings and Brainstorming**: Collaborative workshops designed to generate new ideas, identify potential features, and foster collaboration among diverse stakeholders.
3. **Facilitated Workshops**: Formal sessions, such as Joint Application Development (JAD) or Joint Requirements Planning (JRP), led by a neutral facilitator to reach agreement on requirements boundaries and resolve conflicts early.
4. **Protocol Analysis**: A cognitive technique where a user thinks aloud while performing a task, allowing the engineer to capture implicit decision steps, operational sequences, and validation checks.
5. **Focus Groups**: Moderated discussions with representative user classes to explore usability preferences, product concepts, and market expectations.
6. **Questionnaires and Surveys**: Quantitative questionnaires sent to large, distributed user groups to identify common patterns, usage frequencies, and general needs.
7. **Observation and Apprenticing**: Passive observation of users in their native working environment or active apprenticing (where the engineer learns the task by doing it). These are essential for surfacing tacit knowledge.
8. **Usage Scenario Descriptions**: Narrative scripts depicting the step-by-step interaction between an actor and the system under specific conditions.
9. **Requirements Decomposition**: Structuring complex capabilities into a hierarchy of epics, features, and user stories.
10. **Task Analysis**: Analyzing the manual and automated steps a user takes to accomplish a specific business goal.
11. **Design Thinking**: A user-centric, iterative framework consisting of five phases (empathize, define, ideate, prototype, test) to discover unmet user needs.
12. **Exploratory Prototyping**: Creating low-fidelity (sketches, wireframes) or high-fidelity (interactive user interfaces) prototypes to elicit feedback on UI behavior and layout.
13. **User Story Mapping**: Laying out user stories along a horizontal workflow axis and vertical priority axis to plan releases.
14. **Quality Function Deployment (QFD)**: Using structured methods like the House of Quality to map customer needs to technical design requirements.
15. **Standardized Quality Models**: Utilizing ISO/IEC 25010 SQuaRE models to prompt stakeholders for nonfunctional Quality of Service parameters.
16. **Security Abuse and Misuse Cases**: Modeling threat scenarios and malicious actor behaviors to discover security requirements.

### 1.3 Tacit Knowledge and the Challenge of Incompleteness
A fundamental challenge in requirements elicitation is the discovery of tacit knowledge. Stakeholders often possess deep operational expertise that has become so automated that they assume it is common knowledge. As a result, they leave this critical information unstated during interviews. For instance, a user might neglect to mention that an order must be verified against credit limits because they have performed the check unconsciously for years.
To combat this, the engineer must not remain passive. Passive collection leads to incomplete specifications. Engineers must employ active techniques like observation, protocol analysis, apprenticing, and exploratory prototyping. These methods force the execution of real-world scenarios, bringing hidden constraints, exception paths, and validation rules to the surface.

### 1.4 Elicitation in Different Development Lifecycles
The timing and frequency of elicitation activities vary significantly depending on the project's software lifecycle:
- In a waterfall or plan-driven lifecycle, elicitation is heavily concentrated in a discrete requirements phase at the beginning of the project, aiming to establish a complete and stable baseline before design and construction.
- In iterative and agile lifecycles, elicitation is an ongoing, incremental activity. High-level requirements are captured during inception, and detailed elicitation is conducted "just-in-time" at the beginning of each iteration or sprint, ensuring the software remains aligned with evolving stakeholder priorities.

## 2. Compliance Checklist
- [ ] Have all potential requirements sources, including human stakeholders and non-human legacy systems, been identified and documented?
- [ ] Has a formal stakeholder analysis been conducted to identify and document all stakeholder classes?
- [ ] Did the elicitation strategy account for representation bias by engaging with under-represented stakeholder groups?
- [ ] Have users been segmented into distinct user classes based on frequency of use, tasks, skill, and privilege levels?
- [ ] Were active elicitation techniques (e.g., protocol analysis, observation, apprenticing) utilized to surface tacit knowledge?
- [ ] Has a legacy system audit been performed, including a review of previous requirements, concept of operations, and defect tracking databases?
- [ ] Have external interfaces and computing environment constraints been elicited and documented?
- [ ] Are all candidate requirements traced back to their specific stakeholder source or non-human origin?
- [ ] Were facilitated workshops (such as JAD or JRP) or brainstorming sessions used to resolve conflicting needs at the source?
- [ ] Have usage scenario descriptions or user story mapping been used to structure the elicited capabilities?
- [ ] Has exploratory prototyping (low-fidelity or high-fidelity) been deployed to validate user interface behavior and assumptions?
- [ ] Did the elicitation process actively explore security requirements through abuse or misuse cases?
- [ ] Were Quality of Service constraints systematically elicited using quality frameworks such as ISO/IEC 25010?`,
  description:
    "active discovery, ubiquitous language, stakeholder clarification, user story mapping, mockups, Given-When-Then scenarios, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-elicitation",
  trigger: "model_decision"
});
