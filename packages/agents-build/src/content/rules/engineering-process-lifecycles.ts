import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringProcessLifecycles = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Process Life Cycles",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering process life cycles represent the overarching structural frameworks that guide a software system from conception to retirement. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 10, Section 2, a process life cycle provides a systematic, disciplined approach to managing the complexity, risk, and evolution of software product development. Rather than treating development as an ad-hoc activity, software engineering requires a structured orchestration of activities, tasks, and constraints. Adopting a defined life cycle model enables organizations to coordinate teams, establish baseline expectations, and align engineering processes with business objectives. The selection and adaptation of a life cycle model are critical engineering choices that directly influence product quality, development velocity, predictability, and long-term maintainability.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Life Cycle Definition",
      type: "header"
    },
    {
      text: 'A life cycle is defined as the "evolution of a system, product, service, project or other human-made entity from conception through retirement" (ISO/IEC/IEEE 12207). In software engineering, this concept is applied to software systems—those where software plays a primary, critical role for stakeholders. The necessity of a life cycle arises because merely listing individual processes is insufficient to manage the intricate dependencies and constraints of modern systems. A software system\'s life cycle encompasses the technical, managerial, and organizational processes required to transition a system through its various stages.\nAccording to ISO/IEC/IEEE 12207, these processes are categorized into four primary groups:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Technical Processes**: Engineering activities to define, build, verify, validate, operate, and dispose of the software system. They include mission analysis, stakeholder needs, software requirements, architecture, design, system analysis, implementation, integration, verification, transition, validation, operation, maintenance, and disposal."
        },
        {
          text: "**Technical Management Processes**: Planning, control, and governance mechanisms. They cover project planning, assessment and control, decision management, risk management, configuration management, information management, measurement, and quality assurance."
        },
        {
          text: "**Organizational Project-Enabling Processes**: Establish infrastructure and resource capabilities, managing the life cycle model, infrastructure, portfolio, human resources, quality, and organizational knowledge."
        },
        {
          text: "**Agreement Processes**: Define contractual and relational boundaries, covering acquisition and supply."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Rationale",
      type: "header"
    },
    {
      text: "The rationale for process life cycles is to manage software complexity. Software processes are highly interrelated; outputs of one process (e.g., requirements or design templates) serve as inputs for subsequent ones (e.g., coding or verification). This interdependency makes ad-hoc development unpredictable and prone to regressions. Specifying a formal life cycle applies engineering principles to govern these transitions. A clear life cycle serves as a shared communication tool, allowing stakeholders to coordinate activities, perform measurements, assess quality, and continuously improve processes.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Process/Life Cycle Models",
      type: "header"
    },
    {
      text: "A process model represents a software process, while a life cycle model (SLCM) defines a project-specific sequence of activities created by mapping standard processes onto a structured paradigm. Engineering teams do not operate directly on abstract standards; they instantiate a life cycle model conforming to those standards. Well-known models include waterfall, V-model, incremental, spiral, and Agile. The choice of model dictates how activities are sequenced, risks are managed, and deliverables are verified.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Paradigms",
      type: "header"
    },
    {
      text: "Development life cycle models generally fall into distinct paradigms:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Predictive (Plan-Driven)**: Assumes that the project scope, schedule, and cost are determined early. It operates under the assumption that requirements form a closed set that will not undergo substantive change. Success is measured by adherence to the initial plan."
        },
        {
          text: "**Iterative**: Recognizes that product understanding increases over time. The scope is defined early, but schedule and cost estimates are routinely refined. The product is developed through a series of repeated cycles (iterations), allowing developers to refine previous work."
        },
        {
          text: "**Evolutionary**: The product changes continuously over its lifetime. Requirements are introduced in successive steps as customer needs and market conditions evolve."
        },
        {
          text: "**Incremental**: Focuses on delivering functional capabilities in successive steps. The product is built through iterations, with each iteration adding new functionality. The system is complete only after the final increment is integrated."
        },
        {
          text: '**Continuous**: Leverages automation to enable frequent, rapid releases of software increments to staging or production environments. It minimizes the time between code changes and deployment.\nA life cycle model can be "closed to change," enforcing strict boundaries that forbid requirements modifications once a phase is complete, or "open to change," allowing requirements to be renegotiated at any point.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Engineering Dimension",
      type: "header"
    },
    {
      text: 'The historical evolution of software engineering models reflects a continuous effort to address the "software crisis" and manage increasing system scale:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Waterfall and V-Model**: These predictive, document-driven models introduce structured, sequential phases. The V-model explicitly maps verification and validation activities to their corresponding design phases. While useful for introducing discipline, their rigid boundaries present high risk in volatile environments."
        },
        {
          text: "**Spiral Model**: Proposed by Barry Boehm, the spiral model is an evolutionary, risk-driven framework. It structures development as cycles where each iteration involves identifying risks, evaluating alternatives, and prototyping before proceeding."
        },
        {
          text: "**Unified Process (UP/RUP/OpenUP)**: Iterative and incremental framework. It divides development into inception, elaboration, construction, and transition phases."
        },
        {
          text: "**Agile Mindset**: Agile emphasizes communication, customer collaboration, and responsiveness to change. It focuses on small, functional software increments rather than a single massive delivery. It balances values (e.g., technical excellence) with practical disciplines (e.g., pair programming, sprint planning, retrospectives)."
        },
        {
          text: "**DevOps**: Extending Agile principles into operations, DevOps bridges the gap between development and IT operations. It advocates for continuous improvement, automation, and shared responsibility across the entire life cycle."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Management",
      type: "header"
    },
    {
      text: "A standard software system life cycle comprises six primary stages:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Concept**: Exploring solutions, identifying stakeholder needs, and defining the business case."
        },
        {
          text: "**Development**: Refining requirements, designing architecture, implementing code, and conducting verification and validation."
        },
        {
          text: "**Production**: Replicating, manufacturing, and testing the software product."
        },
        {
          text: "**Utilization**: Operating the system in its target environment to deliver value to users."
        },
        {
          text: "**Support**: Providing ongoing maintenance, operational assistance, and corrective updates."
        },
        {
          text: "**Retirement**: Decommissioning, transitioning, and systematically disposing of the system."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.7 Process Management",
      type: "header"
    },
    {
      text: "Software engineering process management operates at three distinct organizational levels:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Technical Level**: Focuses on the execution of specific engineering tasks and technical processes."
        },
        {
          text: "**Technical Management Level**: Covers project planning, assessment, control, and tracking of individual engineering projects."
        },
        {
          text: "**Organizational/Executive Level**: Focuses on organizational project-enabling processes, portfolio management, infrastructure, and life cycle model management."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.8 Adaptation",
      type: "header"
    },
    {
      text: "No single life cycle model fits all projects. Organizations must adapt (or tailor) standard models to suit specific project characteristics and stakeholder needs. This adaptation involves identifying product factors (such as size, safety criticality, complexity) and external factors (such as team experience, stakeholder capabilities, and organizational maturity). Tailoring decisions and their underlying rationales must be documented. Standards like ISO/IEC 29110 provide specialized guidelines for adapting processes to Very Small Entities (VSEs).",
      type: "text"
    },
    {
      level: 3,
      text: "1.9 Practical Considerations",
      type: "header"
    },
    {
      text: "A critical lesson in software process engineering is that estimations and measurements are essential to success. Wrong or overly optimistic estimations lead to project failure. Modern software engineering emphasizes continuous delivery and frequent validation to reduce uncertainty. By avoiding long, monolithic development phases without intermediate deliverables, organizations limit risk. Process definitions must incorporate metrics that provide realistic, accurate information about the status of both the process and the product.",
      type: "text"
    },
    {
      level: 3,
      text: "1.10 Infrastructure/Tools",
      type: "header"
    },
    {
      text: "Defining and executing processes requires supporting infrastructure, notations, and integrated tools. Common notations for process definition include natural language, activity lists, data-flow diagrams, state charts, Petri nets, UML activity diagrams, and Business Process Model and Notation (BPMN). Computer-Aided Software Engineering (CASE) environments historically attempted to automate these processes. Today, the integration of tools—such as linking version control systems, testing frameworks, and issue tracking tools—is essential for maintaining process visibility and traceability.",
      type: "text"
    },
    {
      level: 3,
      text: "1.11 Process Monitoring",
      type: "header"
    },
    {
      text: "Monitoring the execution of a software process is critical for assessing risk and verifying that project objectives are met. Process monitoring must not occur in isolation; it requires a joint, holistic approach that evaluates both process metrics (e.g., velocity, defect injection rates) and product metrics (e.g., code quality, defect density). Empirical methods and measurements are used to analyze this relationship, providing the evidence needed to make informed process improvement decisions.",
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
          text: "Is the software life cycle defined from initial concept through system retirement according to standard process categories?"
        },
        {
          text: "Are all technical, technical management, organizational, and agreement processes identified and coordinated?"
        },
        {
          text: "Does the selected life cycle model align with the project's requirements volatility and risk profile?"
        },
        {
          text: "Has the team documented the rationale for choosing either a predictive, iterative, evolutionary, or incremental paradigm?"
        },
        {
          text: "Were the transition criteria between different stages of the life cycle defined?"
        },
        {
          text: "Is the adaptation or tailoring of the standard life cycle model documented along with the justification for any excluded processes?"
        },
        {
          text: "Are project estimations and process measurements calculated using historical data to minimize uncertainty?"
        },
        {
          text: "Has a joint process and product monitoring strategy been implemented to evaluate execution quality?"
        },
        {
          text: "Were process definitions mapped using standard notations such as BPMN, UML activity diagrams, or Petri nets?"
        },
        {
          text: "Are the software engineering tools integrated across different processes (e.g., linking testing with configuration management)?"
        },
        {
          text: "Are empirical methods and metrics defined to guide continuous process assessment and improvement?"
        },
        {
          text: "Has the organization defined the management levels (technical, project management, and organizational enabling) for process control?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering process life cycles, life cycle definition, process categories, process models, paradigms, engineering dimension, management stages, adaptation, infrastructure, tools, monitoring",
  filename: "engineering-process-lifecycles",
  trigger: "model_decision"
});
