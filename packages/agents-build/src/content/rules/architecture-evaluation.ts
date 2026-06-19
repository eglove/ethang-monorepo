import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const architectureEvaluation = defineRule({
  content: [
    {
      level: 1,
      text: "Software Architecture Evaluation",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software architecture evaluation is the systematic software engineering practice of assessing a candidate software architecture to determine its suitability, quality, and conformance to requirements, stakeholder needs, and design constraints. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2, Section 4, architecture evaluation is typically conducted at predefined project milestones as an objective assessment, often involving independent reviewers. Evaluation serves as a critical risk-reduction gate, ensuring that the prescriptive design is sound, feasible, and economically viable before substantial development effort and resources are committed to construction.",
      type: "text"
    },
    {
      level: 3,
      text: '4.1 "Goodness" in Software Architecture',
      type: "header"
    },
    {
      text: 'Evaluating the "goodness" of a software architecture requires comparing the design against formal requirements, operational expectations, and domain norms. Because software systems serve multiple stakeholders with diverse goals, goodness cannot be measured by a single metric. SWEBOK v4 grounds software architecture goodness in the classic Vitruvian Triad, adapting three fundamental criteria from classical building architecture to software engineering:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Firmitas (Strength and Robustness)**: Refers to the structural integrity and stability of the system. Is the software architecture robust over its operational lifetime? Can it support future evolution, technology updates, and adaptive changes without experiencing structural degradation or erosion? In software terms, this translates directly to reliability, fault tolerance, scalability, and modifiability."
        },
        {
          text: "**Utilitas (Utility and Fitness for Purpose)**: Refers to the system's ability to satisfy stakeholder needs. Is the architecture fit for its intended use? Does it support all required functional capabilities and conform to quality of service constraints? This maps to functional suitability, interoperability, and capability."
        },
        {
          text: "**Venustas (Beauty, Clarity, and Elegance)**: Refers to the readability and aesthetic order of the design. Is the architecture clear, clean, and understandable to the developers, maintainers, and operators who must construct and evolve the system? It highlights the importance of conceptual integrity, consistency, and clean modular boundaries."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Goodness also requires resolving the inevitable conflicts between quality attributes. For example, a highly secure system might require multiple encryption layers, which can increase latency and degrade performance. A highly modular system might introduce multiple layers of abstraction, increasing developmental complexity. Goodness is achieved by finding a Pareto-optimal design, where tradeoffs are explicitly analyzed and balanced.",
      type: "text"
    },
    {
      text: "SWEBOK v4 catalogs several standardized evaluation frameworks:",
      type: "text"
    },
    {
      items: [
        {
          text: "**ATAM (Architecture Tradeoff Analysis Method)**: A structured method for evaluating quality attributes. It leverages a prioritized utility tree to define key quality scenarios. It identifies **Sensitivity Points** (architectural decisions that directly control a quality attribute response), **Tradeoff Points** (decisions that affect multiple attributes in opposing ways), and **Risks** (structural weaknesses that threaten the system)."
        },
        {
          text: "**SAAM (Software Architecture Analysis Method)**: Focuses primarily on analyzing system modifiability. SAAM evaluates how easily the architecture can accommodate future changes by categorizing changes into direct scenarios (supported by the existing components) and indirect scenarios (requiring structural modifications)."
        },
        {
          text: "**QAW (Quality Attribute Workshop)**: Conducted during the earliest phases of requirements and design to elicit, define, and prioritize quality attributes before the architecture is finalized. The QAW is a facilitated stakeholder meeting that moves systematically through scenario elicitation, prioritization, and scenario refinement."
        },
        {
          text: "**SARA Report (Software Architecture Review and Assessment)**: A standardized, repeatable framework and guidelines for conducting comprehensive architectural reviews and assessments. SARA provides a template for roles, processes, and reporting formats to make assessments predictable and actionable."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "4.2 Reasoning about Architectures",
      type: "header"
    },
    {
      text: "Reasoning about architectures involves analyzing and querying the structural representations of the system to verify its correctness. This reasoning is most effective when it is based on robust, formal, and up-to-date Architecture Descriptions (ADs).",
      type: "text"
    },
    {
      items: [
        {
          text: "**Querying and Inspecting ADs**: Evaluators analyze views (such as module, runtime, and deployment views) to trace execution paths, check interface compatibilities, and verify component coordination. By examining relationships and properties, they can reason about the system's runtime properties and static complexity."
        },
        {
          text: "**Specialized Reasoning Frameworks**: Specialized concerns (e.g., reliability, safety, and security) often require distinct, domain-specific representations. For example, evaluating safety might require fault trees, while evaluating security requires threat models and attack surface maps."
        },
        {
          text: "**Use Case Mapping**: Evaluators map specific operational scenarios or use cases directly to the architectural elements involved in executing those scenarios. By stepping through the use case, the evaluator verifies that every required communication link, data store access, and processing component is present and properly coordinated. This checks the completeness and consistency of the design."
        },
        {
          text: "**Handling Incomplete Documentation**: In real-world projects, architecture documentation is often incomplete or outdated. In such cases, the evaluation must rely systematically on the structured elicitation of participant expertise and developer interviews, using questionnaires to reconstruct the structural models."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "4.3 Architecture Reviews",
      type: "header"
    },
    {
      text: "An architecture review is a static verification gate designed to assess the health of the architecture and identify risks. Reviews can range from informal walkthroughs to highly formal, institutionalized processes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Active Design Reviews**: Proposed by Parnas and Weiss, active reviews overcome the limitations of passive checklists, which often result in superficial verification. In an active design review, reviewers are given specific, active tasks or questionnaires that require them to read, query, and write mock code using the architecture description (e.g., tracing a specific data flow or writing a consumer client against an interface). This forces reviewers to study the architecture in depth to find structural gaps."
        },
        {
          text: "**SARA Framework Reviews**: Provide structured guidelines for defining, executing, and documenting reviews, ensuring that findings are reported as actionable risks with clear mitigation strategies. The process identifies stakeholders, scopes the evaluation goals, conducts the review sessions, and publishes a formal report."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "4.4 Architecture Metrics",
      type: "header"
    },
    {
      text: 'An architecture metric is a quantitative measure of a structural or behavioral characteristic of the design. Many architecture metrics are derived by "lifting" traditional source code or detailed design metrics to a higher level of abstraction:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Structural Metrics**:\n- **Component Dependency**: Measures the inbound and outbound dependencies between components, checking if dependencies flow toward stable components.\n- **Cyclicity**: Detects circular dependencies (cycles) between components or packages. Circular dependencies prevent independent deployment and testing, violating modularity boundaries.\n- **Coupling and Cohesion**: Measures the degree of interdependence between components (coupling) and the logical unity within a single component (cohesion). High cohesion and low coupling are primary indicators of a maintainable design.\n- **Nesting and Complexity**: Tracks nesting levels and structural complexity, checking compliance with patterns, styles, and required APIs."
        },
        {
          text: "**DevOps and Process Metrics**: In modern continuous delivery and DevOps paradigms, the health of the software architecture is often evaluated indirectly by measuring the responsiveness of the development process. SWEBOK v4 notes that process metrics serve as strong indicators of the architectural state:\n- **Lead Time for Changes**: The time it takes for a commit to reach production. High lead times suggest low modifiability, poor modular boundaries, and structural rigidity.\n- **Deployment Frequency**: How often the system is released. High frequency indicates high decoupling, independent deployability, and small, well-bounded modules.\n- **Mean Time to Restore (MTTR)**: The time required to recover from a production failure, indicating availability, system diagnostic capabilities, and fault recovery tactics.\n- **Change Failure Rate**: The percentage of deployments that cause failures, indicating structural fragility, lack of safety gates, and poor testing isolation."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Requirements-Based Goodness**: Has the architecture been evaluated against formal requirements, stakeholder expectations, and domain norms?"
        },
        {
          text: "**Vitruvian Triad Analysis**: Has the design been audited against the criteria of Firmitas (structural strength), Utilitas (functional utility), and Venustas (clarity/understandability)?"
        },
        {
          text: "**Trade-off and Pareto Optimality Check**: Were tradeoffs between conflicting quality attributes (e.g., security vs. performance) analyzed to establish a Pareto-optimal design?"
        },
        {
          text: "**ATAM Evaluation Execution**: Was a structured ATAM-aligned evaluation conducted to identify sensitivity points, tradeoff points, and architectural risks?"
        },
        {
          text: "**Quality Scenario Prioritization**: Were quality attribute scenarios prioritized using a utility tree to guide the evaluation?"
        },
        {
          text: "**Use Case Mapping**: Were functional use cases mapped step-by-step to specific components and connectors to verify structural completeness and consistency?"
        },
        {
          text: "**Active Review Tasks**: Were reviews structured as active design reviews, assigning reviewers specific tasks to verify structural details rather than using passive checklists?"
        },
        {
          text: "**Structural Metrics Audit**: Have component dependency, cyclicity, coupling, and cohesion metrics been quantitatively measured to identify design violations?"
        },
        {
          text: "**Process Metrics Analysis**: Have DevOps metrics (lead time for changes, deployment frequency, MTTR, change failure rate) been monitored as indicators of architectural modifiability and stability?"
        },
        {
          text: "**Review Outcome Documentation**: Were all identified risks, tradeoffs, and sensitivity points recorded along with concrete technical mitigations?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software architecture evaluation, goodness in architecture, reasoning about architectures, architecture reviews, architecture metrics, active reviews, ATAM, SAAM, QAW, SARA report, Vitruvian triad, Pareto optimality, component dependency, cyclicity, coupling and cohesion, DevOps metrics, lead time, deployment frequency, MTTR, change failure rate, planning, plan mode, grill-me, or evaluating and auditing design documents, structural health, and quality attributes using the antigravity cli",
  filename: "architecture-evaluation",
  trigger: "model_decision"
});
