import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const designProcesses = defineRule({
  content: [
    {
      level: 1,
      text: "Software Design Processes",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software design is a continuous, multi-stage software engineering lifecycle process that translates high-level customer requirements and architectural directives into concrete, implementable specifications. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 3, Section 2, the design process is not a single, monolithic activity but rather a progression of distinct stages. Each stage is characterized by its level of abstraction, its target stakeholders, its primary deliverables, and the specific design problems it aims to solve. The transition through these stages ensures that the system is decomposed from global, system-wide structures down to local, compiler-ready source code units.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Stages of the Software Design Process",
      type: "header"
    },
    {
      text: "SWEBOK v4 decomposes the design process into three primary stages:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architectural Design**: Focuses on the system as a whole and its relationship with its environment. It establishes the global computational model, defines major component boundaries, and articulates system-wide architectural styles, patterns, and protocols. system-wide styles include layered (n-tier) architectures, client-server models, peer-to-peer configurations, event-driven pipelines, and microservices. It also addresses major crosscutting architectural concerns such as security boundaries, global performance targets, and data storage paradigms."
        },
        {
          text: "**High-Level Design**: Focuses on the outward-facing relationships of major system components. It specifies how these components interact with the environment, other systems, users, and devices. High-level design focuses on defining component roles, interfaces, APIs, external events, message formats, sequence ordering, timing relationships, and data persistence models."
        },
        {
          text: "**Detailed Design**: Focuses on the inward-facing characteristics of major components. It refines the components defined in high-level design into concrete modules, program units, and data structures. Detailed design specifies internal component state machines, module interconnections, local variables, visibilities, scope rules, and specific algorithms."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Flow of Obligations and Constraints",
      type: "header"
    },
    {
      text: "The stages of design are tightly coupled through a chain of obligations:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architecture Constraints**: The architecture establishes the envelope within which high-level design operates. High-level design must conform to architectural styles (such as layered architectures, client-server models, or event-driven frameworks), observe mandated protocols, and reuse approved interfaces."
        },
        {
          text: "**High-Level Constraints**: High-level design defines the public boundaries and roles of components. Detailed design must operate within these interfaces, ensuring the component's outward obligations are fully met without violating encapsulation."
        },
        {
          text: "**Detailed Design Outcomes**: Detailed design produces specifications that are sufficiently complete for programmers to code the components during the software construction phase. The code is the final representation of the design solution, structured such that a compiler or interpreter can execute it."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Stage Flexibility and Hoisting",
      type: "header"
    },
    {
      text: "While these stages represent a logical progression, SWEBOK v4 emphasizes that there are no rigid or absolute boundaries regarding what must be done and when. Under ordinary circumstances, the choice of a specific sorting or data manipulation algorithm is deferred to construction or detailed design. However, in high-performance or safety-critical systems, a specific algorithm or data structure may have system-wide significance, forcing its definition to be hoisted early into the architectural design stage. For example, if a system must handle high-throughput event processing under strict latency limits, selecting a specific lock-free concurrency queue algorithm is not a minor detailed design choice—it is a critical architectural decision that determines whether the software requirements can be met at all.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Detailed Design Characteristics, Concerns, and Deliverables",
      type: "header"
    },
    {
      text: "To maintain design integrity throughout the lifecycle, developers must understand the differing concerns, stakeholders, and deliverables of each design stage:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architectural Design**:\n- *Concerns*: Computational model, crosscutting concerns (performance, security, safety), system-wide styles (e.g., pipeline vs. n-tier).\n- *Stakeholders*: system architects, product owners, lead engineers.\n- *Deliverables*: Software Architecture Description (SAD), component communication protocols."
        },
        {
          text: "**High-Level Design**:\n- *Concerns*: Outward-facing interactions, environment integrations, external events, end-to-end transaction threads, and database persistence schemas.\n- *Stakeholders*: Lead developers, integration engineers, external systems developers.\n- *Deliverables*: API specifications, Zod data payload contracts, sequence diagrams."
        },
        {
          text: "**Detailed Design**:\n- *Concerns*: Inward-facing characteristics, refinement of components into program units, internal class states, algorithms, local variables, and visibilities.\n- *Stakeholders*: Software constructors, programmers, unit testers.\n- *Deliverables*: Software Design Document (SDD), pseudo-code, class diagrams, statecharts."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Outward-Facing High-Level Design Details",
      type: "header"
    },
    {
      text: "High-level design focuses on external interactions. SWEBOK v4 specifies the following key areas that must be addressed:",
      type: "text"
    },
    {
      items: [
        {
          text: "**External Events and Messages**: Documenting the complete inventory of stimuli to which the system must respond, and the events it must produce in return."
        },
        {
          text: "**Data Formats and Protocols**: Defining the serialization formats (e.g., JSON, Protocol Buffers) and protocols used for component communication."
        },
        {
          text: "**Ordering and Timing Relationships**: Specifying the sequence, concurrency constraints, and timing boundaries of inputs and outputs."
        },
        {
          text: "**Transaction Tracing**: Mapping end-to-end transaction threads and event propagation across components."
        },
        {
          text: "**Data Persistence**: Specifying how data is stored, cached, and managed within the system."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Inward-Facing Detailed Design Details",
      type: "header"
    },
    {
      text: "Detailed design focuses on the internal mechanics. SWEBOK v4 specifies the following key areas:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Component Refinement**: Decomposing high-level components into modules and program units, including identifying opportunities for off-the-shelf reuse."
        },
        {
          text: "**Responsibility Allocation**: Assigning specific behaviors and data ownership to modules."
        },
        {
          text: "**Module Interactions**: Detailing how internal modules communicate."
        },
        {
          text: "**Scope and Visibility**: Enforcing visibility and access modifiers to protect module internals."
        },
        {
          text: "**Component States and Transitions**: Mapping states, transitions, and guards."
        },
        {
          text: "**Data and Control Interdependencies**: Tracking how data flow and control flow propagate."
        },
        {
          text: "**Data Organization and Packaging**: Structuring internal data containers and storage structures."
        },
        {
          text: "**User Interfaces**: Defining the screens, layouts, and user interactions."
        },
        {
          text: "**Requisite Algorithms and Data Structures**: Specifying the algorithms and data structures needed to implement the module's behavior."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Design Compliance Checklist",
      type: "header"
    },
    {
      text: "This checklist outlines the criteria derived directly from the SWEBOK v4 Software Design Processes topics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architectural Envelope Alignment**: Does the design align with the system-wide computational model and style constraints established by the software architecture?"
        },
        {
          text: "**Outward-Facing Interface Specification**: Are all outward-facing component interfaces, external events, and messages fully defined?"
        },
        {
          text: "**Data Formats and Protocols**: Are the serialization formats and communication protocols for all events and messages specified?"
        },
        {
          text: "**Timing and Ordering Constraints**: Have sequence ordering and timing relationships between input events and output events been defined?"
        },
        {
          text: "**Transaction and Event Tracing**: Is there a documented trace of end-to-end transactions and event threads across the system?"
        },
        {
          text: "**Data Persistence Strategy**: Has the database persistence, storage, and caching design been specified?"
        },
        {
          text: "**Inward-Facing Refinement**: Are the high-level components decomposed into detailed modules, classes, and program units?"
        },
        {
          text: "**Responsibility Allocation**: Are design and execution responsibilities explicitly allocated to individual modules?"
        },
        {
          text: "**Module Interaction Definition**: Are the interfaces and communication paths between internal modules fully documented?"
        },
        {
          text: "**Scope and Visibility Restrictions**: Are strict visibility rules and access modifiers specified to protect internal module data?"
        },
        {
          text: "**State Machine Modeling**: Are component modes, states, and transition guards modeled for all stateful elements?"
        },
        {
          text: "**Data and Control Interdependencies**: Have data flow and control flow dependencies between internal elements been analyzed?"
        },
        {
          text: "**Data Packaging and Organization**: Is the internal data packaging, structuring, and representation specified?"
        },
        {
          text: "**Requisite Algorithms and Data Structures**: Have the sorting, search, or processing algorithms and internal data structures been selected and justified?"
        },
        {
          text: "**Hoisting Evaluation**: Was the architectural significance of local algorithms and data structures evaluated to determine if they should be hoisted early in the lifecycle?"
        },
        {
          text: "**Stakeholder Communication**: Is the design documented in a format (such as an SDD or models) suitable for the target audience (constructors, testers, certifiers)?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design processes, high-level design, detailed design, architectural design, outward-facing design, inward-facing design, external events, end-to-end transactions, algorithms, data structures, planning, plan mode, grill-me, or decomposing software systems, defining component interfaces, mapping transaction threads, and transitioning from high-level to detailed implementation using the antigravity cli",
  filename: "design-processes",
  trigger: "model_decision"
});
