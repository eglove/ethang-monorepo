import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringFoundationsFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Engineering Foundations - The Engineering Process",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Engineering is defined by the Institute of Electrical and Electronics Engineers (IEEE) as the application of a systematic, disciplined, quantifiable approach to structures, machines, products, systems, or processes. As software engineering has matured, it has become increasingly clear that it shares core conceptual and operational foundations with all traditional engineering disciplines. Rather than treating software development as an ad-hoc, artistic, or purely craft-based activity, software engineering adopts the rigorous methodologies, mathematical modeling, empirical verification, and systematic decision-making processes that define the engineering profession. At the heart of this discipline lies the engineering process—a structured, iterative framework designed to solve complex, open-ended problems under constraints.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 The Iterative Nature of the Engineering Process",
      type: "header"
    },
    {
      text: "The classical engineering process is not a linear, single-pass sequence. Instead, it is necessarily iterative. As engineers explore the problem space, design solutions, and gather empirical data, their understanding of the constraints, requirements, and system behaviors evolves. This newly acquired knowledge frequently triggers feedback loops, requiring designers to revisit previous phases, refine specifications, and adjust design decisions. ",
      type: "text"
    },
    {
      text: "The process is structured around a sequence of key activities, each serving as a quality gate and a decision point:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Understanding the Real Problem**: Engineering begins when a need is recognized and no existing solution satisfies it. However, the problem initially presented by stakeholders is rarely the true underlying problem that needs to be solved. Engineers must use systematic root cause analysis techniques to separate symptoms from causes, discovering the core issue before proposing solutions."
        },
        {
          text: "**Defining Selection Criteria**: Decisions in engineering must be based on objective, quantifiable criteria. These criteria represent the multi-dimensional value space of the project, including financial limits (cost, return on investment), resource availability, time-to-market, regulatory requirements, safety tolerances, and quality attributes (performance, reliability, maintainability)."
        },
        {
          text: "**Identifying Technically Feasible Solutions**: The optimal solution is rarely the first one that comes to mind. To avoid local design maxima, engineers must systematically generate and consider multiple reasonable, technically feasible solutions. This requires a broad knowledge of the domain and the discipline's state of the art."
        },
        {
          text: "**Evaluating Solutions Against Selection Criteria**: Each candidate solution must be rigorously analyzed and evaluated against the predefined criteria. This evaluation often involves mathematical modeling, computer simulation, prototyping, and cost-benefit analysis."
        },
        {
          text: "**Selecting the Preferred Option**: Once candidate solutions are evaluated, engineers use structured decision-making techniques to choose the alternative that best satisfies the criteria while balancing trade-offs."
        },
        {
          text: "**Monitoring Real-World Performance**: Because engineering decisions depend on estimates, projections, and models, they are subject to error. Continuous monitoring of the selected solution's real-world performance is essential to validate design assumptions and determine if alternative designs or corrections are necessary."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Problem Formulation and Root Cause Isolation",
      type: "header"
    },
    {
      text: "A fundamental failure mode in engineering is solving the wrong problem. Premature design synthesis—jumping to design solutions before fully understanding the problem space—often leads to project failure, cost overruns, and fragile systems. ",
      type: "text"
    },
    {
      text: "To prevent this, engineers employ root cause analysis (RCA) at the very beginning of the lifecycle. By analyzing the system's operational environment, historical failure modes, and stakeholder feedback, engineers trace undesirable outcomes back to their underlying causes. This diagnostic phase ensures that the subsequent design activities target the true source of the problem, rather than merely treating superficial symptoms. Understanding the real problem also establishes the baseline against which all proposed solutions are evaluated.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Establishing Objective Selection Criteria",
      type: "header"
    },
    {
      text: "Selection criteria act as the constraints and objective functions for the engineering design space. These criteria are typically categorized into:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Explicit Constraints**: Imposed limits that cannot be violated, such as project budget, development schedule, staffing limitations, physical dimensions, or specific technical standards."
        },
        {
          text: "**Implicit Constraints**: Constraints derived from the laws of nature, physics, or logical systems (such as computational complexity bounds, network latency limits, or physical material properties)."
        },
        {
          text: "**Value Criteria**: Criteria that can be optimized, such as system availability, operational efficiency, user satisfaction, and lifecycle cost."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "In software systems, these criteria often translate to quality attributes (non-functional requirements) and financial metrics. The Software Engineering Economics KA highlights that engineering decisions are fundamentally economic decisions. An engineer must be able to express the value of technical quality attributes in financial terms to justify design choices to stakeholders.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Solution Generation and the Feasibility Boundary",
      type: "header"
    },
    {
      text: "The search for solutions must be broad and systematic. Relying on a single design path limits innovation and introduces cognitive bias. The engineering discipline requires defining a feasibility boundary—the threshold that separates viable solutions from non-viable ones based on constraints. ",
      type: "text"
    },
    {
      text: "Generating a set of diverse, technically feasible options allows engineers to perform comparative analysis. If only one solution is considered, there is no baseline for comparison, making it impossible to determine if the selected path is optimal. Engineers must look to established reference architectures, industry standards, design patterns, and prior empirical studies to compile this candidate set.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Multi-Criteria Decision Evaluation",
      type: "header"
    },
    {
      text: "Evaluating candidate solutions requires comparing multidimensional attributes that often conflict. For example, a solution that maximizes performance may also increase cost and reduce maintainability. To resolve these conflicts, engineers use structured decision-making methodologies.",
      type: "text"
    },
    {
      text: "These methods can be classified into:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Compensatory Techniques**: Methods where a high score in one criterion can offset a low score in another (e.g., weighted scoring models, multi-attribute utility theory)."
        },
        {
          text: "**Non-Compensatory Techniques**: Methods where a candidate is rejected if it fails to meet a strict threshold on any single criterion, regardless of its performance in other areas (e.g., dominance analysis, lexicographic ordering)."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Through these techniques, engineers systematically analyze the trade-offs of each candidate, ensuring that the selection of the preferred option is rational, transparent, and documented.",
      type: "text"
    },
    {
      level: 3,
      text: "1.6 Operational Monitoring and Design Validation",
      type: "header"
    },
    {
      text: "The engineering process does not end when a solution is deployed. Real-world conditions often differ from laboratory environments, test suites, and simulation models. Therefore, continuous monitoring of the system in production is required to gather empirical data on reliability, performance, resource consumption, and user behavior.",
      type: "text"
    },
    {
      text: "This operational data serves two purposes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Design Validation**: Verifying that the implemented system actually meets the predefined selection criteria and solves the original problem."
        },
        {
          text: "**Feedback for Iteration**: Identifying performance gaps, unexpected failure modes, or shifting requirements that trigger subsequent iterations of the engineering process."
        }
      ],
      type: "numberedList"
    },
    {
      text: "By maintaining this closed-loop feedback system, organizations ensure that their engineering processes remain adaptive, self-correcting, and aligned with long-term quality goals.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Iterative Lifecycle Conformance**: Has the system engineering process been structured as an iterative loop, explicitly planning for feedback and design revisions based on early validation data?"
        },
        {
          text: "**Problem Understanding Audit**: Did the team perform a structured investigation (such as root cause analysis) to verify that the problem being solved is the true underlying need, rather than a symptom or a premature solution request?"
        },
        {
          text: "**Selection Criteria Quantifiable**: Are the selection criteria (financial, performance, reliability, safety) explicitly defined, measurable, and documented before evaluating candidate solutions?"
        },
        {
          text: "**Multi-Solution Generation**: Have at least three distinct, technically feasible candidate solutions been identified and documented to avoid single-solution cognitive bias?"
        },
        {
          text: "**Feasibility Boundary Check**: Has a feasibility analysis been conducted for each candidate solution to verify it complies with all explicit and implicit constraints?"
        },
        {
          text: "**Economic Justification**: Are design decisions backed by an economic analysis (such as total cost of ownership or return on investment) in alignment with engineering economics principles?"
        },
        {
          text: "**Multi-Criteria Trade-Off Analysis**: Has a structured trade-off evaluation (using compensatory or non-compensatory techniques) been conducted and documented for all candidate solutions?"
        },
        {
          text: "**Stakeholder Value Alignment**: Have the selection criteria and candidate evaluations been reviewed with and approved by the key project stakeholders?"
        },
        {
          text: "**Performance Estimations Logged**: Were the design estimations (such as expected system load, resource usage, and cost) formally documented to serve as a baseline for future monitoring?"
        },
        {
          text: "**Operational Monitoring Plan**: Is there an automated monitoring and telemetry plan in place to measure the real-world performance of the selected solution against its design estimates?"
        },
        {
          text: "**Deviation Action Plan**: Is there a defined threshold and response plan for when real-world performance deviates significantly from design estimates?"
        },
        {
          text: "**State-of-the-Art Review**: Has the team reviewed current industry literature, reference architectures, and standards to ensure candidate solutions leverage the state of the discipline's knowledge?"
        },
        {
          text: "**Risk and Uncertainty Assessment**: Have the risks and uncertainties associated with each candidate solution (such as technology maturity or dependency stability) been identified and quantified?"
        },
        {
          text: "**Regulatory and Safety Compliance**: Has the selected design been audited against all applicable safety codes, regulatory mandates, and industry compliance standards?"
        },
        {
          text: "**Environmental and Societal Impact**: Have the environmental, cultural, and societal impacts of the proposed solutions been evaluated as part of the selection criteria?"
        },
        {
          text: "**Process Quality Audit**: Has the engineering process itself been audited to ensure compliance with organizational quality management systems and maturity frameworks?"
        },
        {
          text: "**Requirements Traceability Maintenance**: Are the requirements, design decisions, and evaluation results mapped in a traceability matrix to support verification and validation?"
        },
        {
          text: "**Feedback Loop Closure**: Has the operational monitoring data from previous deployments been analyzed and used to refine the selection criteria and designs of the current iteration?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "engineering process, problem formulation, selection criteria, feasible solutions, multi criteria evaluation, operational monitoring, iterative feedback loop",
  filename: "engineering-foundations-fundamentals",
  trigger: "model_decision"
});
