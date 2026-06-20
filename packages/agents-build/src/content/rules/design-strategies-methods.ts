import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const designStrategiesMethods = defineRule({
  content: [
    {
      level: 1,
      text: "Software Design Strategies and Methods",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software design strategies and methods provide structured guidelines, frameworks, and organizing themes to guide the design process. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 3, Section 5, these methods govern how software designers decompose complex requirements, structure modular boundaries, and partition system behavior. Most design methods are characterized by the prominent design concept they choose as their central organizing theme (whether functions, data structures, objects, interfaces, events, or domain rules). By selecting a specific method, designers establish a structured vocabulary and a systematic approach to proceed from initial concepts to detailed design specifications.",
      type: "text"
    },
    {
      level: 3,
      text: "5.1 General Strategies",
      type: "header"
    },
    {
      text: "General design strategies represent universal, paradigm-independent problem-solving heuristics used throughout the software engineering lifecycle:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Divide-and-Conquer and Stepwise Refinement**: Recursively decomposing a complex system into smaller, more manageable sub-problems, and incrementally detailing the execution steps."
        },
        {
          text: "**Top-Down vs. Bottom-Up Strategies**: Top-down starts from the highest level of abstraction and refines downward, while bottom-up builds reusable lower-level components and aggregates them into larger structures."
        },
        {
          text: "**Heuristics and Patterns**: Utilizing informal design heuristics (such as maximizing local cohesion) and formalized design pattern languages."
        },
        {
          text: "**Iterative and Incremental Design**: Evolving the design through feedback cycles, delivering small functional increments, and refactoring architectural boundaries continuously."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "5.2 Function-Oriented (Structured) Design",
      type: "header"
    },
    {
      text: "Function-Oriented or Structured Design is one of the classical software design methods. The primary organizing theme is the system's execution functions. Designers perform functional decomposition to identify major software operations and refine them in a hierarchical, top-down manner. Structured design often follows structured analysis, mapping data flow diagrams (DFDs) into high-level design representations called structure charts. These charts illustrate call hierarchies and detail the data elements and control parameters exchanged between subroutines.",
      type: "text"
    },
    {
      level: 3,
      text: "5.3 Data-Centered Design",
      type: "header"
    },
    {
      text: "Data-Centered Design starts from the organization and structures of the data the program manipulates, rather than the functions it performs. The designer specifies the input and output data structures, and then derives the program units that transform input structures into output structures. This method is highly effective for file processing, data translation pipelines, and compilers. Heuristics are applied to handle special cases, such as structure clashes where the input data organization does not directly align with the required output layout.",
      type: "text"
    },
    {
      level: 3,
      text: "5.4 Object-Oriented Design (OOD)",
      type: "header"
    },
    {
      text: "Object-Oriented Design organizes software around classes and objects that encapsulate both state (attributes) and behavior (methods), relying on inheritance and polymorphism for extensibility. SWEBOK v4 details two key aspects of OOD:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Responsibility-Driven Design**: An alternative to data-driven design where classes are defined by their dynamic roles, actions, and collaboration protocols rather than static attributes."
        },
        {
          text: "**Design Principles**: Enforcing mnemonics like the **SOLID** principles for class design (Single-responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion) and the **SOFA** principles for method design (Short, One thing, Few arguments, Abstraction level consistency) to achieve modularity and low coupling."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "5.5 User-Centered Design",
      type: "header"
    },
    {
      text: "User-Centered Design is a multidisciplinary approach focusing on understanding user needs, tasks, and environments as the basis for designing user experiences. It involves analyzing user workflows, mapping tasks to decision flows, creating interactive prototypes or mockups of user interfaces, and evaluating the design solutions iteratively against original usability requirements.",
      type: "text"
    },
    {
      level: 3,
      text: "5.6 Component-Based Design (CBD)",
      type: "header"
    },
    {
      text: "Component-Based Design decomposes a system into standalone, deployable components that communicate strictly through well-defined interfaces and conform to a standardized component model. A component is an independent unit of composition and deployment. CBD focuses on the development, provision, and integration of reusable components. It emphasizes common APIs for all components to ensure uniform lifecycle management and specialized APIs to execute specific system services, utilizing reflection to inspect component metadata at runtime.",
      type: "text"
    },
    {
      level: 3,
      text: "5.7 Event-Driven Design",
      type: "header"
    },
    {
      text: "Event-Driven Design structures software around the production, detection, and consumption of events, where components invoke operations in reaction to events (indirect invocation).",
      type: "text"
    },
    {
      items: [
        {
          text: "**Publish/Subscribe Messaging**: Senders (producers) publish events to a broker using named channels (topics), decoupling them from receivers (consumers) who subscribe to those topics. This contrasts with point-to-point messaging where senders must explicitly know receivers."
        },
        {
          text: "**Event Processing Models**: Categorized into simple event processing, event stream processing, and complex event processing (CEP) which aggregates multiple events to detect complex patterns. Asynchronous, anonymous event processing is a core strategy for building highly scalable systems."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "5.8 Aspect-Oriented Design (AOD)",
      type: "header"
    },
    {
      text: "Aspect-Oriented Design is a method that uses aspects to implement crosscutting concerns (such as security, logging, transaction boundaries, and error handling) that cannot be cleanly localized within standard class or function hierarchies. AOD allows designers to define these concerns separately and inject them dynamically into the main codebase, often utilized through application framework configurations.",
      type: "text"
    },
    {
      level: 3,
      text: "5.9 Constraint-Based Design",
      type: "header"
    },
    {
      text: "Constraint-Based Design uses physical, software, or operational constraints to limit the size of the design space, excluding unacceptable or infeasible alternatives. Forcing early decisions based on constraints accelerates the design process. The constrained design space is then explored using systematic search, backtracking, or constraint approximation algorithms. It is frequently applied in user interface layouts, scheduling systems, and game design.",
      type: "text"
    },
    {
      level: 3,
      text: "5.10 Domain-Driven Design (DDD)",
      type: "header"
    },
    {
      text: "Domain-Driven Design is a strategy where designers use a domain-specific vocabulary—known as a Ubiquitous Language—shared with stakeholders and analysts to build the software design. This shared language ensures that domain objects, roles, events, and business rules defined in the requirements map directly to structural components, schemas, and API definitions in the design specifications, preventing semantic translation drift.",
      type: "text"
    },
    {
      level: 3,
      text: "5.11 Other Methods",
      type: "header"
    },
    {
      text: "Modern development environments also utilize other design methods:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Service-Oriented Methods**: Building distributed systems using modular web services that communicate across network nodes using standard protocols (such as HTTP, REST, SOAP) to exchange messages and access remote actions."
        },
        {
          text: "**Iterative and Adaptive Methods**: Emphasizing adaptive planning and rapid software delivery, reducing the need for exhaustive upfront requirements and static design specifications."
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
          text: "Has a primary software design method (structured, data-centered, object-oriented, event-driven, or domain-driven) been selected to guide the design process?"
        },
        {
          text: "Were general design strategies (divide-and-conquer, stepwise refinement, top-down vs. bottom-up) systematically applied during decomposition?"
        },
        {
          text: "For structured designs, did the functional decomposition map functions into hierarchical structure charts detailing call parameters?"
        },
        {
          text: "For data-centered designs, were the program units derived directly from the input and output data structures?"
        },
        {
          text: "Have potential structure clashes or mismatches between input and output data organizations been identified and resolved?"
        },
        {
          text: "Did the object-oriented design apply responsibility-driven design to define class responsibilities and collaboration protocols?"
        },
        {
          text: "Was class design audited against the SOLID principles to minimize coupling and maximize cohesion?"
        },
        {
          text: "Are class methods structured in compliance with the SOFA principles (Short, One thing, Few arguments, Abstraction level consistency)?"
        },
        {
          text: "Has User-Centered Design been utilized to map user workflows, decision paths, and interactive UI mockups?"
        },
        {
          text: "Does Component-Based Design partition the system into standalone components that conform to a standardized component model?"
        },
        {
          text: "Do component interactions occur exclusively via well-defined, public interfaces?"
        },
        {
          text: "Is Event-Driven Design configured to run asynchronously and anonymously through topics, keeping event producers decoupled from consumers?"
        },
        {
          text: "Have crosscutting concerns (such as logging or authentication) been isolated using aspect-oriented configurations or framework middleware?"
        },
        {
          text: "Did the design utilize constraint-based strategies to limit the search space and exclude unacceptable design alternatives?"
        },
        {
          text: "Has a shared Ubiquitous Language (Domain-Driven Design) been used to map requirements vocabulary directly to design symbols and schemas?"
        },
        {
          text: "For service-oriented architectures, are distributed services designed to interwork using standardized communication protocols (such as HTTP/REST)?"
        },
        {
          text: "Were iterative and adaptive strategies selected to align design documentation detail with the project's delivery cycle?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design strategies and methods, design strategies, structured design, function-oriented design, data-centered design, object-oriented design, OOD, SOLID principles, SOFA principles, user-centered design, component-based design, CBD, event-driven design, pub-sub, message brokers, aspect-oriented design, constraint-based design, domain-driven design, DDD, ubiquitous language, service-oriented architecture, SOA, web services, planning, plan mode, grill-me, or selecting and applying design methods using the antigravity cli",
  filename: "design-strategies-methods",
  trigger: "model_decision"
});
