import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const designFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Design Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software design is a core software engineering lifecycle activity situated between requirements elicitation and software construction. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 3, Section 1, software design systematically applies engineering principles, technical theories, and cognitive models to transform customer requirements into implementable specifications. Unlike ad-hoc programming, design is a formal problem-solving process that establishes blueprints, interfaces, data architectures, and algorithms. It creates the structural envelope within which construction takes place, defines constraints guiding verification, and provides the baseline representations required for long-term maintenance.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Software Design as a Problem-Solving Activity",
      type: "header"
    },
    {
      text: 'In a general sense, design is a goal-oriented problem-solving activity. SWEBOK v4 references "wicked problems" to describe the limits of design. First articulated by Horst Rittel and Melvin Webber, a wicked problem lacks a definitive, closed-form formulation. Wicked problems are characterized by:',
      type: "text"
    },
    {
      items: [
        {
          text: "**No Definitive Formulation**: The problem cannot be fully described in isolation; its formulation is only clarified as solutions emerge."
        },
        {
          text: "**No Stopping Rule**: There is no objective criteria for completion; design ends due to constraints like budget, time, or resource depletion."
        },
        {
          text: "**Qualitative Solutions**: Solutions are not binary (correct/incorrect), but rather qualitative (better, worse, or sufficient)."
        },
        {
          text: "**Shifting Constraints**: The problem definition changes dynamically as the solution is explored, reacting to external shifts."
        },
        {
          text: "**One-Shot Operations**: Every implemented solution is consequential and cannot be easily undone without significant cost."
        }
      ],
      type: "numberedList"
    },
    {
      text: "To navigate this complex design space, software engineers must systematically identify and manipulate five fundamental design elements:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Goals**: The functional capabilities and quality attribute requirements that the software system is expected to fulfill."
        },
        {
          text: "**Constraints**: Technological, organizational, temporal, or budgetary limits imposed on the solution space (such as execution environments, database paradigms, or compliance requirements)."
        },
        {
          text: "**Alternatives**: The set of candidate architectural styles, patterns, algorithms, or component structures explored by the designer."
        },
        {
          text: "**Representations**: The notations, schemas, diagrams, and models used to express, communicate, and analyze design ideas."
        },
        {
          text: "**Solutions**: The final realized component structure and behaviors that satisfy the design goals within the defined constraints."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Design Thinking as a Linguistic Activity",
      type: "header"
    },
    {
      text: "Software design is fundamentally a linguistic process of modeling concepts. SWEBOK v4 highlights the formulation of design thinking by Ross, Goodenough, and Irvine, which decomposes software design into five distinct, sequential linguistic steps:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Crystallize a Purpose or Objective**: Clearly identify the customer need or operational problem to be addressed, establishing the target goals."
        },
        {
          text: "**Formulate a Concept**: Devise a high-level conceptual model or architectural paradigm describing how the purpose can be achieved."
        },
        {
          text: "**Devise a Mechanism**: Select or construct the concrete structural entities (classes, components, or services) and behavioral patterns that realize the conceptual structure."
        },
        {
          text: "**Introduce a Notation**: Establish a formal vocabulary and notation (such as APIs, TypeScript interfaces, and schemas) to express the capabilities of the mechanism and invoke its use."
        },
        {
          text: "**Describe the Usage of the Notation**: Map specific problem instances and scenarios to the notation to trigger the underlying mechanism, thereby solving the purpose."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Under this framework, software design creates the necessary vocabulary (notations, types, and interfaces) to express a problem, its solution, and its implementation. It transforms an informal problem statement into a structured, implementable solution.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Context of Software Design in the Software Lifecycle",
      type: "header"
    },
    {
      text: "Software design sits at the center of the software engineering lifecycle, interacting bidirectionally with other key activities:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Relationship with Software Requirements**: Requirements establish the problem space that design must solve by translating functional requirements and quality of service constraints into implementable specifications."
        },
        {
          text: "**Relationship with Software Architecture**: Architecture captures system-wide concerns, component boundaries, and styles, establishing the structural envelope within which design operates."
        },
        {
          text: "**Relationship with Software Construction**: Design provides the implementation blueprint, defining module structures, interfaces, and algorithms for constructors."
        },
        {
          text: "**Relationship with Software Testing**: Design provides the structural foundation for unit and integration testing by defining clear inputs, outputs, and component boundaries."
        },
        {
          text: "**Relationship with Software Maintenance**: Recording design decisions in a Software Design Description (SDD) establishes a baseline for impact analysis, enabling safe post-deployment modifications."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Key Issues and Quality Concerns",
      type: "header"
    },
    {
      text: "Software designers must resolve system-wide concerns during the design process, which can be categorized into:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Quality Attribute Concerns**: system-wide properties that affect all modules, such as performance, security, reliability, availability, usability, safety, and maintainability."
        },
        {
          text: '**Behavioral and Crosscutting Concerns**: Systemic properties that do not align with functional decomposition boundaries. SWEBOK v4 refers to these as "aspects" (e.g., concurrency control, error handling, logging, caching, and data persistence). These aspects crosscut multiple modules, requiring specialized design tactics to prevent code duplication and ensure system stability.'
        },
        {
          text: "**Component Organization**: Decisions regarding how to refine, organize, package, and interconnect software components to optimize system structure."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Foundational Software Design Principles",
      type: "header"
    },
    {
      text: "SWEBOK v4 outlines ten core design principles that serve as the foundation for reasoning about software structures:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Abstraction**: A view of an object that focuses on the information relevant to a particular purpose and ignores the remainder of the information. Abstraction helps identify essential properties common to superficially different entities."
        },
        {
          text: "**Separation of Concerns (SoC)**: Identifying and isolating distinct areas of interest so that designers can focus on each concern in isolation. Dijkstra noted that separation of concerns is the only available technique for the effective ordering of one's thoughts."
        },
        {
          text: "**Modularization and Decomposition**: Structuring large software into smaller, named components with well-defined interfaces. David Parnas advocated that each module should have a single responsibility, making components easier to understand, construct, and maintain."
        },
        {
          text: "**Encapsulation and Information Hiding**: Restricting direct access to a module's internal state and implementation details. Encapsulation hides volatile design decisions (secrets) behind stable public interfaces."
        },
        {
          text: "**Separation of Interface and Implementation**: Defining components via public APIs and isolating the client from the details of how the component is built. This ensures internal changes do not affect external consumers."
        },
        {
          text: "**Coupling**: The measure of the degree of interdependence between modules. Designers strive for loose coupling to minimize the ripple effect of changes. SWEBOK v4 emphasizes that modules should be loosely or weakly coupled. The coupling scale ranges from Content, Common, Control, Stamp, Data, to message coupling."
        },
        {
          text: "**Cohesion**: The measure of the strength of association of the elements within a module. Most design methods advocate that modules should maximize cohesion and localization, grouping elements based on their relatedness. The cohesion scale ranges from coincidental, logical, temporal, procedural, communicational, sequential, to functional cohesion."
        },
        {
          text: "**Uniformity**: Enforcing consistency in naming schemes, notations, syntax, and interface structures across all components. This is achieved through conventions such as rules, formats, and styles."
        },
        {
          text: "**Completeness and Sufficiency**: Ensuring a design captures all essential characteristics of an abstraction, maps all states and modes, and demonstrates how requirements are met."
        },
        {
          text: "**Verifiability**: Structuring the design so that it can be audited, traced to requirements, and validated. This is critical for high-assurance systems with safety or security concerns."
        },
        {
          text: "**Ethically Aligned Design**: Addressing human values, transparency, accountability, data agency, and dependability in AI-enabled or autonomous systems. SWEBOK v4 highlights eight principles: Human Rights, Well-being, Data Agency, Effectiveness, Transparency, Accountability, Awareness of Misuse, and Competence."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "2. Design Compliance Checklist",
      type: "header"
    },
    {
      text: "This checklist outlines the criteria derived directly from the SWEBOK v4 Software Design Fundamentals topics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Wicked Problem Bounds**: Has the design identified design space limits and defined explicit boundaries?"
        },
        {
          text: "**Design Thinking Steps**: Have the five design thinking steps been applied to model the design vocabulary?"
        },
        {
          text: "**Linguistic Modeling**: Are interfaces, models, types, and APIs defined as a precise vocabulary?"
        },
        {
          text: "**Lifecycle Context Tracing**: Is the design traced to requirements and constrained by architecture?"
        },
        {
          text: "**Testability and Verification**: Is the design structured with clear boundaries to support testing?"
        },
        {
          text: "**Quality Attribute Mitigation**: Does the design explicitly address quality concerns (performance, security)?"
        },
        {
          text: "**Aspect and Crosscutting Isolation**: Are crosscutting concerns (aspects) isolated from functional logic?"
        },
        {
          text: "**Abstraction Application**: Does the design focus on essential properties while ignoring volatile details?"
        },
        {
          text: "**Separation of Concerns**: Are distinct areas of interest isolated to allow independent reasoning?"
        },
        {
          text: "**Modular Cohesion and Coupling**: Does the design minimize coupling and maximize cohesion?"
        },
        {
          text: "**Single Responsibility**: Do decomposed components adhere to single responsibility principles?"
        },
        {
          text: "**Information Hiding**: Are implementation details and volatile decisions hidden behind stable interfaces?"
        },
        {
          text: "**Interface-Implementation Decoupling**: Are public interfaces separated from implementation details?"
        },
        {
          text: "**Uniformity and Consistency**: Are naming, parameter orders, notations, and syntax consistent?"
        },
        {
          text: "**State and Mode Completeness**: Is the design complete with respect to all operational modes and states?"
        },
        {
          text: "**High-Assurance Verifiability**: For critical components, is the design verifiable against requirements?"
        },
        {
          text: "**Ethical Alignment**: Have ethically aligned principles (data agency, transparency, accountability) been met?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design fundamentals, design thinking, design principles, abstraction, separation of concerns, modularization, encapsulation, interface and implementation, uniformity, ethically aligned design, planning, plan mode, grill-me, or designing software components, structuring codebases, and establishing modular interfaces before construction using the antigravity cli",
  filename: "design-fundamentals",
  trigger: "model_decision"
});
