import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const architectureDescription = defineRule({
  content: [
    {
      level: 1,
      text: "Software Architecture Description",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software architecture description is the formal engineering practice of modeling, specifying, and documenting the architectural design of a software system. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2, Section 2, having a mental model of an architecture is suitable for small systems or individuals, but for large-scale, complex software systems developed by teams, a concrete, tangible representation as a work product is essential. These work products are called Architecture Descriptions (ADs). They serve as the authoritative blueprint for designers, developers, and programmers during construction, and provide the baseline for secondary lifecycle activities, including testing, quality assurance, system certification, deployment, operations, and long-term maintenance.",
      type: "text"
    },
    {
      level: 3,
      text: "2.1 Architecture Views and Viewpoints",
      type: "header"
    },
    {
      text: "To capture the complexity of software systems, architects use a multi-perspective modeling approach. Rather than relying on a single all-encompassing model, an architecture description is partitioned into distinct architecture views. An architecture view represents one or more structural or behavioral aspects of the architecture to address specific stakeholder concerns. By separating concerns into distinct views, stakeholders can focus on a manageable set of system properties, reducing overall cognitive load and ensuring the system's structure is clear.",
      type: "text"
    },
    {
      text: "The conventions, notations, models, and analytical methods used to construct a view are defined by an architecture viewpoint. A viewpoint establishes the language, vocabulary, and rules of representation, linking specific stakeholder concerns with the appropriate modeling techniques. SWEBOK v4 outlines several common viewpoints:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Module Viewpoint**: Expresses the implementation structure of the software in terms of its static modules, packages, source classes, and their organizational hierarchies. It provides a blueprint for code organization and configuration management."
        },
        {
          text: "**Component and Connector Viewpoint**: Captures the runtime organization of the system. It models execution elements (components, such as services, processes, and clients) and the communication pathways (connectors, such as remote procedure calls, message queues, and databases) through which they interact during operation, addressing concurrency, synchronization, and performance."
        },
        {
          text: "**Logical Viewpoint**: Models the fundamental concepts, business domain entities, and operational capabilities of the software. It maps how the system will satisfy the functional requirements of end-users."
        },
        {
          text: '**Scenarios and Use Cases Viewpoint**: Illustrates how users and external actors interact with the system, demonstrating how the architectural components collaborate to satisfy functional requirements. It acts as the "+1" that ties other views together.'
        },
        {
          text: "**Information Viewpoint**: Details how key data entities are structured, processed, synchronized, and stored. It addresses concerns related to data consistency, transaction boundaries, and database constraints."
        },
        {
          text: "**Deployment Viewpoint**: Details the physical configuration of the software, mapping components to hardware nodes, edge runtimes, servers, and database hosts."
        }
      ],
      type: "numberedList"
    },
    {
      text: 'Other viewpoints can be created to address specialized concerns, such as availability, communication protocols, exception handling paths, performance budgets, reliability models, safety levels, and security domains. Clements et al. group viewpoints into three fundamental "viewtypes": module, component and connector, and allocation.',
      type: "text"
    },
    {
      text: "Architects generally use one of two primary approaches to construct views:",
      type: "text"
    },
    {
      items: [
        {
          text: '**Synthetic Approach**: Views of the system are constructed independently and integrated within the architecture description using explicit correspondence rules. A major risk here is the "multiple views problem," where independent views may become inconsistent, contradict each other, or fail to describe the same system. To mitigate this, architects use linkages, traceability matrices, or consistency check rules to cross-reference elements.'
        },
        {
          text: "**Projective Approach**: Derives each view mechanically by extracting information from a single, unified underlying model. This approach guarantees consistency across all views but is limited by the expressive capability of the underlying meta-model, which may not easily capture all arbitrary stakeholder concerns."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "2.2 Architecture Patterns, Styles, and Reference Architectures",
      type: "header"
    },
    {
      text: "Architectural styles and patterns represent reusable, codified templates that provide solutions to recurring structural design problems in specific contexts. While the terms are closely related, they represent different scales of application:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architectural Style**: Defines the large-scale organization of a system, establishing its characteristic features, the types of components and connectors allowed, and the constraints on how they can interact."
        },
        {
          text: "**Architectural Pattern**: Expresses a common solution to a recurring structural problem within the context of a system, but does not necessarily dictate the architecture of the entire system."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "SWEBOK v4 catalogs several prominent architectural styles and patterns grouped by paradigm:",
      type: "text"
    },
    {
      items: [
        {
          text: "**General Structures**: Includes layered styles (restricting dependencies between vertical stacks), call-and-return structures, pipes-and-filters (streaming data through decoupled transformation components), blackboards (multiple independent agents collaborating via a shared repository), and service-oriented or microservices architectures."
        },
        {
          text: "**Distributed Systems**: Includes client-server configurations, multi-tier (n-tier) designs, broker patterns (coordinating distributed communication), publish-subscribe, point-to-point networks, and Representational State Transfer (REST)."
        },
        {
          text: "**Method-Driven Paradigms**: Includes object-oriented structures, event-driven designs (decentralized components reacting to asynchronous state events), and data flow architectures."
        },
        {
          text: "**User-Computer Interaction**: Includes Model-View-Controller (MVC) and Presentation-Abstraction-Control (PAC) styles, separating domain logic from user presentation."
        },
        {
          text: "**Adaptive Systems**: Includes microkernels and reflection/meta-level architectures that support runtime modification."
        },
        {
          text: "**Virtual Machines**: Includes interpreters, rule-based runtimes, and process control loops."
        }
      ],
      type: "numberedList"
    },
    {
      text: "A **Reference Architecture (RA)** is a specialized architecture that guides or constrains other architectures within a specific application domain or organization. Reference architectures capture commonalities, standard components, and integration protocols to promote ease of development, system integration, and cross-platform interoperability.",
      type: "text"
    },
    {
      level: 3,
      text: "2.3 Architecture Description Languages (ADLs) and Frameworks",
      type: "header"
    },
    {
      text: "To specify architectures precisely and eliminate the ambiguity inherent in natural language and informal sketches, software engineers utilize formal languages and frameworks:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architecture Description Language (ADL)**: A domain-specific language designed to represent and analyze software architectures. Some ADLs target single domains or specific styles (such as MetaH for event-driven avionics systems), while others are wide-spectrum languages (such as ArchiMate). The Unified Modeling Language (UML) is also widely used as an ADL. ADLs often provide capabilities for automated structural checks, simulations, or code generation."
        },
        {
          text: "**Architecture Framework**: A coordinated set of conventions, principles, and practices for documenting architectures in a specific domain. Frameworks (such as AUTOSAR for automotive systems or OMG's UAF) provide a standardized set of viewpoints and templates to ensure consistency across multiple projects."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "2.4 Architecture as Significant Decisions",
      type: "header"
    },
    {
      text: "Modern software engineering recognizes that an architecture is not merely a set of diagrams; it is the collection of significant design decisions made during the project. These decisions are critical because they are costly to change later. A core tool for documenting these choices is the **Architecture Decision Record (ADR)**. Each ADR captures a single significant decision, the context in which it was made, the options considered, the rationale for the choice, and the consequences of the decision.",
      type: "text"
    },
    {
      text: "Documenting the **architecture rationale** is essential for maintaining design integrity:",
      type: "text"
    },
    {
      items: [
        {
          text: "It records not only the selected path but also the rejected alternatives and the criteria used to reject them."
        },
        {
          text: "This prevents future team members from revisiting decisions for forgotten reasons."
        },
        {
          text: "It helps the project adapt when environmental assumptions change."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "When decisions are deferred or shortcuts are taken to meet short-term deadlines, the project incurs **architectural technical debt**. This debt represents the future cost of refactoring and re-architecting the system to restore its modularity, evolvability, or performance. Left unmanaged, architectural technical debt compounds, slowing down development timelines and introducing regression defects.",
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
          text: "**Tangible Architecture Description**: Has a concrete architecture description been created to serve as a shared model and blueprint for construction, testing, deployment, and maintenance?"
        },
        {
          text: "**Multi-View Representation**: Does the architecture description use multiple distinct views (such as module, component-and-connector, and allocation views) to address different stakeholder concerns?"
        },
        {
          text: "**Viewpoint Conformity**: Is every view constructed in accordance with a defined viewpoint, documenting the notations, models, and conventions used?"
        },
        {
          text: "**Multiple Views Consistency**: Has a consistency check been performed between the views (using correspondence rules or a single underlying model) to prevent structural mismatches?"
        },
        {
          text: "**Style and Pattern Specification**: Are the selected architectural styles and patterns explicitly defined, showing how they govern the system's elements and connectors?"
        },
        {
          text: "**Reference Architecture Alignment**: If the system is built in a domain with a reference architecture, does the design align with its standardized components and interfaces?"
        },
        {
          text: "**ADL and Modeling Tool Selection**: Have appropriate modeling languages or notations (such as UML or specialized ADLs) been selected based on their utility for the stakeholder audience?"
        },
        {
          text: "**Architecture Framework Compliance**: Does the description comply with domain-specific architecture frameworks where applicable?"
        },
        {
          text: "**Architecture Decision Recording**: Are all significant design decisions documented in ADRs, detailing the options considered, rationale, and consequences?"
        },
        {
          text: "**Rationale Documentation**: Does the documented rationale capture why specific alternatives were rejected and the context or assumptions guiding the choice?"
        },
        {
          text: "**Architectural Technical Debt Audit**: Have the long-term consequences of deferred decisions and design shortcuts been analyzed and logged as technical debt?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software architecture description, views and viewpoints, 4+1 model, architecture patterns, styles, reference architectures, ADL, architecture frameworks, TOGAF, UML, C4 model, ADRs, significant decisions, planning, plan mode, grill-me, or documenting system structure and design choices before construction",
  filename: "architecture-description",
  trigger: "model_decision"
});
