import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const architectureProcess = defineRule({
  content: [
    {
      level: 1,
      text: "Software Architecture Process",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "The software architecture process is the systematic software engineering lifecycle of analyzing, synthesizing, evaluating, and evolving architectural designs to satisfy quality attribute requirements and business goals. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2, Section 3, the architecture process represents a structured engineering discipline that balances technical constraints, organizational boundaries, and stakeholder concerns. Rather than treating design as a casual sketching activity, the architecture process embeds structural development within the broader software engineering lifecycle.",
      type: "text"
    },
    {
      level: 3,
      text: "3.1 Architecture in Context",
      type: "header"
    },
    {
      text: "Software architecture design does not occur in a vacuum; it is shaped by, and in turn shapes, the engineering contexts in which it is situated. SWEBOK v4 outlines four primary contexts that define how architectural design is conducted:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Traditional Lifecycle Context**: In sequential or iterative-waterfall lifecycles, there is a dedicated architectural design stage positioned after requirements engineering but before detailed design and construction. During this stage, the architect identifies key architectural drivers and makes high-level structural decisions, deferring minor details to later phases."
        },
        {
          text: "**Product Line and Product Family Contexts**: In these settings, a core product line architecture is developed against a baseline set of shared organizational needs. Individual product instances are then developed by extending this baseline architecture, managing variability to satisfy specific customer requirements while maximizing components reuse."
        },
        {
          text: '**Agile Development Context**: In typical agile methodologies, a dedicated, upfront architecture design stage is often omitted. Instead, the architecture is expected to "emerge" incrementally through a rapid series of development cycles as user stories are implemented. SWEBOK v4 notes that while this emerging design approach can succeed for user-centric systems, it is highly challenging for complex, safety-critical, embedded, or cyber-physical systems, where critical architectural properties (such as real-time constraints, fault tolerance, and hardware-software safety boundaries) are rarely expressed in simple user stories.'
        },
        {
          text: "**Enterprise and system-of-Systems Contexts**: Here, the software architecture must conform to an overarching enterprise architecture or system-of-systems framework. This broader context imposes constraints, interface requirements, API specifications, and conformance suites that the software architecture must respect."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "3.1.1 Relation of Architecture to Design",
      type: "header"
    },
    {
      text: 'The boundary between software architecture and detailed software design is often blurred, leading to the colloquialism that "architecture is the set of decisions that one cannot trust to downstream designers." However, SWEBOK v4 clarifies several distinct contrasts:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Scope and Focus**: Detailed design focuses on satisfying a specific, established set of local requirements within a single module. Architecture focuses on the global structure, shaping requirements through active stakeholder negotiation and analyzing cross-cutting concerns that may not be formal requirements."
        },
        {
          text: "**Decomposition Levels**: Architecture focuses on the decomposition of the system into major subsystems, defining their responsibilities, communication connectors, and interfaces. Detailed design focuses on the internal structures of those subsystems, including local algorithms, class relationships, and data structures."
        },
        {
          text: "**Abstraction and Economics**: Architectural decisions are structurally and economically significant because they are costly to change later. A mistake in detailed design can often be resolved locally, whereas a mistake in architectural design (e.g., selecting the wrong database paradigm or communication style) can require extensive, high-cost refactoring. This relationship is often analyzed via Boehm's cost-of-change curve, which demonstrates that fixing a structural defect during construction or post-deployment can cost up to 100 times more than correcting it during the architectural design stage."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.2 The Core Architectural Design Iteration",
      type: "header"
    },
    {
      text: "Architectural design is an iterative process consisting of three core, concurrent activities: analysis, synthesis, and evaluation. These activities are performed at multiple levels of granularity throughout the development lifecycle, as represented in Hofmeister et al.'s general model of software architecture design:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architecture Analysis**: This activity gathers and formulates the Architecturally Significant Requirements (ASRs). An ASR is defined as any requirement (functional, quality attribute, or constraint) that has a direct, profound influence on the system's architecture. SWEBOK v4 emphasizes that requirements and constraints often conflict (e.g., performance vs. security). When such conflicts occur, the architect must lead negotiations with stakeholders to adjust expectations, requirements, and budgets, establishing a feasible set of ASRs and system design principles."
        },
        {
          text: "**Architecture Synthesis**: This activity develops candidate structural solutions to address the ASRs formulated during analysis. During synthesis, the architect selects appropriate architectural styles, patterns, and tactics, and constructs the components and connectors. The outcomes of synthesis provide feedback to analysis, refining the ASRs and leading to further design decisions."
        },
        {
          text: "**Architecture Evaluation**: This activity validates whether the synthesized candidate structures satisfy the ASRs and quality expectations, identifying where design rework is required before construction."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "3.3 Architecture Practices, Methods, and Tactics",
      type: "header"
    },
    {
      text: "To achieve specific quality attribute responses during synthesis, engineers leverage architectural tactics. A tactic is a targeted design decision that controls a single quality attribute response. SWEBOK v4 references a taxonomy of tactics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Availability Tactics**: Used to detect faults (ping-echo, heartbeat), recover from faults (redundancy, checkpoints, rollback), and prevent faults (removing elements from service)."
        },
        {
          text: "**Performance Tactics**: Used to manage demand (rate limiting, load shedding) and manage resources (caching, database indexing, parallel processing)."
        },
        {
          text: "**Security Tactics**: Used to resist attacks (authentication, authorization, encryption), detect attacks (audit trails, integrity checks), and recover from attacks (session rotation)."
        },
        {
          text: "**Modifiability Tactics**: Used to minimize change propagation by localizing changes (semantic cohesion, encapsulation) and deferring binding times."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Synthesis methods such as Attribute-Driven Design (ADD) systematically apply these tactics. In ADD, the architect identifies quality attribute scenarios (often organized in a utility tree that prioritizes scenarios based on business value and technical risk), decomposes the selected module, maps the tactics to components, and verifies that the resulting structure satisfies the quality goals.",
      type: "text"
    },
    {
      level: 3,
      text: "3.4 Architecting in the Large",
      type: "header"
    },
    {
      text: "Software architecting extends far beyond the initial design stage, spanning the entire system lifecycle. SWEBOK v4 highlights four key activities for architecting in the large:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Architecture Implementation**: Overseeing the construction phase and certifying that the descriptive as-built implementation conforms to the prescriptive architectural design, preventing erosion."
        },
        {
          text: "**Architecture Maintenance**: Managing, adapting, and extending the architecture after the initial release to accommodate new technologies, business models, or user needs."
        },
        {
          text: "**Architecture Management**: Coordinating a portfolio of interrelated software architectures across an enterprise, ensuring interoperability."
        },
        {
          text: "**Architecture Knowledge Management**: Extracting, documenting, maintaining, and sharing reusable architectural assets—including design decisions, lessons learned, specifications, and design rationales—across the development organization. This ensures that organizational learning is preserved and that technical decisions are transparent and searchable."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Context Policy Alignment**: Has the architecture process been structured to match the target development context (traditional, product line, agile, or enterprise system-of-systems)?"
        },
        {
          text: "**ASR Formulation**: Have all architecturally significant requirements (ASRs) been identified, formulated, and separated from minor functional requirements?"
        },
        {
          text: "**Stakeholder Negotiation**: Was a formal negotiation conducted with stakeholders to resolve conflicting requirements, quality attributes, and constraints?"
        },
        {
          text: "**Synthesis Alternatives compared**: Did the synthesis phase evaluate multiple candidate architectural styles, patterns, and tactics before selecting the baseline design?"
        },
        {
          text: "**Quality Tactic Mapping**: Are specific quality attribute goals (availability, performance, security, modifiability) mapped to corresponding architectural tactics?"
        },
        {
          text: "**Iteration Feedback Loop**: Has a concurrent feedback loop been established where synthesis outcomes refine the ASR analysis, and evaluation validates candidate designs?"
        },
        {
          text: "**Implementation Conformance Check**: Is there a verification step to ensure that the descriptive as-built implementation conforms to the prescriptive design, preventing drift?"
        },
        {
          text: "**Evolvability and Maintenance Plan**: Does the architecture process include plans for long-term architecture maintenance and evolution without degrading structural integrity?"
        },
        {
          text: "**Portfolio Management**: If the system interacts with other enterprise architectures, has its alignment and conformance with the global architecture portfolio been verified?"
        },
        {
          text: "**Knowledge Management Capture**: Have all architectural decisions, design rationales, lessons learned, and reusable design assets been captured in the knowledge base?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software architecture process, architectural synthesis, architectural evaluation, architectural tactics, ATAM, quality attributes, design trade-offs, architecture design, ASRs, planning, plan mode, grill-me, or defining architectural structures and evaluating design options before implementation",
  filename: "architecture-process",
  trigger: "model_decision"
});
