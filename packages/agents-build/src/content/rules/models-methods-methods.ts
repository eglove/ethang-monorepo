import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const modelsMethodsMethods = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Methods: Heuristic, Formal, Prototyping, and Agile Methods",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering methods provide an organized and systematic approach to developing software for target computer environments. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 11, these methods guide software engineers through the lifecycle, providing techniques to visualize details, establish logic, and transform abstractions into functional code and data. Software engineering methods vary widely in scope and philosophy. To ensure project success, engineers must evaluate and select appropriate methods based on requirements, complexity, organizational culture, and stakeholder needs. The four primary families of software engineering methods are heuristic methods, formal methods, prototyping methods, and Agile methods.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Heuristic Methods",
      type: "header"
    },
    {
      text: "Heuristic methods are experience-based techniques that are widely practiced across the software industry. They structure development by organizing requirements and designs from specific viewpoints. SWEBOK v4 classifies heuristic development into five broad categories:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Structured Analysis and Design Methods**: These methods model the system primarily from a functional or behavioral perspective. Development begins with a high-level, macro view of the software (including data and control flows) and progressively decomposes it into increasingly detailed subcomponents until the specifications are detailed enough to be coded."
        },
        {
          text: "**Data Modeling Methods**: These methods analyze software requirements from the perspective of data or information resources. System structure is defined in terms of data tables, entities, relationships, and constraints, providing the foundation for database designs."
        },
        {
          text: "**Object-Oriented Analysis and Design (OOAD) Methods**: These methods model the system as a collection of interacting objects that encapsulate data and behavior. OOAD uses graphical representations (such as UML) to represent views of the software. It refines these models iteratively, often utilizing frameworks like the Unified Process (UP) or Rational Unified Process (RUP)."
        },
        {
          text: '**Aspect-Oriented Development (AOD) Methods**: AOD separates crosscutting concerns (such as logging, security, or transaction management) from core business logic to prevent code scattering and tangling. It encapsulates these concerns into "aspects" and uses a "weaver" to merge advices at defined join points using pointcut predicates.'
        },
        {
          text: "**Model-Driven (MDD) and Model-Based (MBD) Methods**: MDD treats models as the primary development artifacts, using automated tools to transform design models directly into source code. MBD uses models to analyze, simulate, and design control systems, signal processing pipelines, or software architectures (Model-Based Design/Architecture)."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Formal Methods",
      type: "header"
    },
    {
      text: "Formal methods apply rigorous, mathematically based notations and languages to specify, develop, and verify software. Formal specifications allow engineers to analyze software models for consistency, completeness, and correctness using mathematical proofs, reducing ambiguity and preventing defects.\nFormal methods encompass the following areas:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Specification Languages**: Higher-level mathematical languages (distinct from third-generation programming languages) used to describe expected system input/output behaviors during requirements and design. They provide formal notation, syntax, semantics, and relations."
        },
        {
          text: "**Program Refinement and Derivation**: The process of successively transforming high-level formal specifications into lower-level, increasingly detailed representations, ultimately deriving executable source code with precise semantic properties."
        },
        {
          text: "**Formal Verification**: Model checking is a formal verification technique that performs state-space explorations or reachability analyses on finite-state automata models to prove that the software preserves critical properties (such as verifying correct behavior under all possible interleavings of concurrent messages)."
        },
        {
          text: "**Logical Inference**: A design method that specifies preconditions and postconditions around code blocks and proves mathematically that the contracts hold under all valid inputs, predicting behavior without executing the software."
        },
        {
          text: "**Lightweight Formal Methods**: Practical approaches that balance usability and mathematical rigor. For example, Alloy uses simple, expressive notation based on set theory and first-order logic, replacing complex theorem proving with fully automated, bounded analysis to provide immediate design feedback."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Prototyping Methods",
      type: "header"
    },
    {
      text: "Software prototyping is the activity of creating incomplete, minimally functional versions of a software application. Prototyping is typically used to explore poorly understood requirements, try out new features, evaluate design options, or solicit early feedback on user interfaces.\nThe prototyping process is characterized by:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Prototyping Styles**: Styles include throwaway prototypes (disposable code or paper mockups), evolutionary prototypes (functional code designed to be continuously refactored into the final product), and executable specifications."
        },
        {
          text: "**Prototyping Targets**: The target of a prototype can be a requirements specification, an architectural design element, an algorithm, or a human-machine interface."
        },
        {
          text: "**Evaluation Techniques**: Prototypes are tested and evaluated against user requirements or simulated workloads. The results serve as a design guide for future software development."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Agile Methods",
      type: "header"
    },
    {
      text: "Agile methods are lightweight, iterative approaches developed to reduce the documentation and process overhead associated with heavyweight, plan-based methodologies. Agile methods apply the Deming Plan-Do-Check-Act (PDCA) cycle incrementally to software construction.\nPopular Agile methods include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**EVO (Evolutionary Development)**: An early Agile approach focused on incremental delivery and continuous feedback loops."
        },
        {
          text: "**RAD (Rapid Application Development)**: A database-centric development method using specialized tooling to quickly build, test, and deploy business software."
        },
        {
          text: "**eXtreme Programming (XP)**: A developer-centric approach emphasizing user stories, test-first development (TDD), pair programming, continuous integration, code refactoring, and active customer involvement."
        },
        {
          text: '**Scrum**: An incremental management framework where development is divided into "sprints" (lasting 30 days or less). A Scrum Master coordinates activities, a Product Owner prioritizes Product Backlog Items (PBIs), and the team collaborates during daily Scrum meetings.'
        },
        {
          text: "**Feature-Driven Development (FDD)**: A short, iterative, model-driven approach focusing on a five-phase process (develop model, build features list, plan by feature, design by feature, code/test/integrate). FDD assigns individual code ownership and prioritizes architectural design over continual refactoring."
        },
        {
          text: "**Lean Software Development**: Adapts manufacturing principles (from the Toyota Production System) to software, focusing on building a Minimum Viable Product (MVP), gathering rapid user feedback, and optimizing the entire value flow (design, build, sales, and delivery) while eliminating process waste. Kanban is often used within Lean to support workflow management and visualization."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "In modern engineering, Agile and plan-based methods are frequently combined to form hybrid approaches that balance flexibility and process control to satisfy organizational business needs. Furthermore, DevOps and release engineering bridge the gap between development and operations, using automated continuous integration (CI) systems to manage promotion schedules, builds, and test cycles.",
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
          text: "Was the software engineering method selected systematically based on system complexity, requirements stability, and business needs?"
        },
        {
          text: "Does the development team combine heuristic, formal, prototyping, or Agile methods when appropriate to address specific project constraints?"
        },
        {
          text: "If structured analysis is used, is the system model decomposed progressively from a functional viewpoint?"
        },
        {
          text: "Are data modeling methods applied to define database designs and data constraints?"
        },
        {
          text: "Does the team apply object-oriented analysis and design (OOAD) methods to model system entities and encapsulation?"
        },
        {
          text: "When using aspect-oriented development (AOD), are crosscutting concerns isolated and merged using defined weavers and pointcuts?"
        },
        {
          text: "If using Model-Driven Development (MDD), are design models automatically transformed into executable code using verified tools?"
        },
        {
          text: "Did the team evaluate formal methods for safety-critical or security-critical software components?"
        },
        {
          text: "Does the formal specification language provide a mathematically rigorous notation and semantic framework?"
        },
        {
          text: "Was program refinement used to derive source code from mathematical specifications through verifiable transformations?"
        },
        {
          text: "Is model checking or reachability analysis used to formally verify correct concurrent execution and prevent deadlocks?"
        },
        {
          text: "Are preconditions and postconditions mathematically proven to hold under all inputs using logical inference?"
        },
        {
          text: "If theorem proving is unfeasible, are lightweight formal methods (such as Alloy) used for bounded model verification?"
        },
        {
          text: "Is the prototyping style (throwaway, evolutionary, executable specification) selected based on urgency and target quality?"
        },
        {
          text: "Are prototyping targets (requirements, algorithms, UI, architecture) defined and evaluated against success criteria?"
        },
        {
          text: "Does the prototyping process start with the least understood aspects of the software to resolve uncertainty?"
        },
        {
          text: "Are Agile processes designed to deliver demonstrable, working software increments in short, iterative cycles?"
        },
        {
          text: "If Scrum is used, are sprints managed by a Scrum Master and is the backlog prioritized by a Product Owner?"
        },
        {
          text: "If Feature-Driven Development (FDD) is used, is an overall architectural model established prior to planning feature iterations?"
        },
        {
          text: "Do Lean software development practices focus on delivering a Minimum Viable Product (MVP) to gather rapid user feedback?"
        },
        {
          text: "Is continuous integration (CI) implemented to automate the compilation, assembly, and testing of code releases?"
        },
        {
          text: "Are release management procedures established to bridge the collaboration gap between development and operations?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design methods, structured, data modeling, object-oriented, aspect-oriented, model-driven development, MDD, model-based design, MBD, formal methods, specification languages, program refinement, formal verification, model checking, logical inference, lightweight formal, Alloy, prototyping, throwing away, evolutionary, agile, XP, Scrum, FDD, Lean, Kanban, DevOps, release engineering",
  filename: "models-methods-methods",
  trigger: "model_decision"
});
