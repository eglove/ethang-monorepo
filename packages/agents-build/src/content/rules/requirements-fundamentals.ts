import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const requirementsFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Requirements Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software requirements engineering is a core software engineering discipline concerned with establishing, validating, and managing the requirements of software systems throughout their entire service life. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, requirements represent the bridge between real-world operational problems and the technological solutions developed to address them. A software requirement is a property that must be exhibited by a software product to solve a specific problem or satisfy an objective. In professional engineering practice, requirements are not merely list items or ad-hoc feature requests; they constitute a disciplined system of statements that define the boundaries of the software system's behavior, performance, and constraints. Proper management of these fundamentals is critical to avoiding architectural drift, scope mismatch, and validation failures during software development lifecycle processes.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Definition of a Software Requirement",
      type: "header"
    },
    {
      text: "Formally, SWEBOK v4 defines a software requirement as a condition or capability needed by a user to solve a problem or achieve an objective. It is also defined as a condition or capability that must be met or possessed by a system or system component to satisfy a contract, standard, specification, or other formally imposed document. Finally, it refers to a documented representation of such conditions or capabilities. In practice, this definition is extended to include documented expressions of a software project's constraints, technological dependencies, and operational needs. At its most fundamental level, a requirement must represent a real-world need that must be automated or enforced.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Categories of Software Requirements",
      type: "header"
    },
    {
      text: "SWEBOK v4 classifies requirements into distinct categories to facilitate structured elicitation, analysis, specification, and validation. The primary division is between Software Product Requirements and Software Project Requirements. Software Product Requirements specify the form, fit, or function of the software itself. These are further categorized into Functional Requirements and Nonfunctional Requirements. Software Project Requirements (also known as process or business requirements) constrain the execution of the project itself, such as cost limits, development schedule, staffing boundaries, training requirements, or testing environments. While project requirements govern the project management aspects (such as those covered in Software Engineering Management), product requirements govern the engineering of the system.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Functional Requirements",
      type: "header"
    },
    {
      text: 'Functional requirements define the observable behaviors that the software must exhibit. These describe the processes the software must carry out and the business policies it must enforce. SWEBOK v4 illustrates that functional requirements capture the rules governing actions and data transformations within a domain. For instance, in a banking application, functional requirements specify policies like "an account balance must never be negative" and define the precise processes of depositing, withdrawing, and transferring funds. Even for highly technical infrastructure systems, such as network communication protocols, functional requirements define the state space transitions (e.g., listen, syn sent, established) and structural rules (e.g., connection-to-port mapping and segment deletion upon expiration).',
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Nonfunctional Requirements",
      type: "header"
    },
    {
      text: "Nonfunctional requirements do not specify observable behaviors or processes. Instead, they constrain the system's operation or the technologies utilized to build it. Nonfunctional requirements are sub-categorized into two groups: Technology Constraints and Quality of Service (QoS) Constraints. These categories have deep dependencies among themselves; modifying one nonfunctional requirement frequently impacts other constraints positively or negatively.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Technology Constraints",
      type: "header"
    },
    {
      text: "Technology constraints mandate or prohibit the use of specific named automation technologies, platforms, or infrastructures. Examples include requirements to use a particular operating system (e.g., Linux, Windows), a specific database engine (e.g., PostgreSQL, SQLite), a defined web browser family, or a specific programming language. They also include structural technology decisions (e.g., employing a relational database model) or prohibitions (e.g., banning pointers in memory management). Technology constraints limit the design space and must be explicitly identified to ensure compatibility with pre-existing organizational infrastructure.",
      type: "text"
    },
    {
      level: 3,
      text: "1.6 Quality of Service (QoS) Constraints",
      type: "header"
    },
    {
      text: "Quality of Service constraints specify the acceptable performance levels that the automated solution must deliver, without mandating specific technologies. These include performance characteristics such as response latency, data throughput, computational accuracy, reliability, safety, and scalability. ISO/IEC 25010 (System and Software Quality Models) provides a comprehensive standard catalog of these quality characteristics. Safety and security requirements are particularly critical QoS constraints that must be specified to prevent systemic failures and unauthorized access.",
      type: "text"
    },
    {
      level: 3,
      text: "1.7 Why Categorize Requirements This Way?",
      type: "header"
    },
    {
      text: "SWEBOK v4 outlines several key reasons for categorizing requirements:",
      type: "text"
    },
    {
      items: [
        {
          text: "Requirements in different categories tend to originate from different stakeholder sources."
        },
        {
          text: "Elicitation, analysis, and specification techniques vary significantly by category."
        },
        {
          text: "Different validation authorities are responsible for validating different requirements categories."
        },
        {
          text: "The different categories impact the resulting software architecture and code in distinct ways.\nAdditionally, categorization aids in complexity management through the classic engineering principle of divide and conquer. Software engineers can resolve policy and process complexities without being distracted by technical platform constraints. It also allows distinct areas of expertise to be isolated. Business domain experts can review functional business rules in their native vocabulary without needing to understand underlying technological details, while software developers can evaluate technical constraints independently."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Complexity Management: The Perfect Technology Filter",
      type: "header"
    },
    {
      text: 'To systematically separate functional business policies from nonfunctional technology constraints, engineers apply the Perfect Technology Filter. This conceptual filter poses the following question: "Would this requirement still need to be stated if we had a computer with infinite speed, unlimited memory, zero cost, and no operational failures?"\nIf the requirement must still be stated, it is a functional requirement representing a core business policy (e.g., "funds must be verified before transfer"). If the requirement is only necessary because of the limitations of real-world computing platforms, it is a nonfunctional technology or QoS constraint (e.g., "cache data to reduce database load"). Separating these concerns ensures that business logic remains clean, reusable, and independent of specific runtime environments.',
      type: "text"
    },
    {
      level: 3,
      text: "1.9 Recursive Design and Domain Decomposition",
      type: "header"
    },
    {
      text: "In large systems spanning multiple subject areas, recursive design illustrates how nonfunctional constraints in a parent domain can become or induce functional requirements in a child domain. For example, a parent domain's QoS constraint regarding data security (nonfunctional) will induce functional requirements in a child security domain (e.g., specifying cryptographic processes and access control policies). Similarly, auditing or transaction management constraints in a financial domain will induce functional requirements in specialized logging and transaction domains. Decomposing complex systems into a hierarchy of related domains is a vital practice for reducing cognitive load and maintaining structural sanity.",
      type: "text"
    },
    {
      level: 3,
      text: "1.10 System Requirements and Software Requirements",
      type: "header"
    },
    {
      text: "A system is defined by the International Council on Systems Engineering (INCOSE) as an interacting combination of elements (hardware, software, firmware, people, information, techniques, facilities, services) to accomplish a defined objective. SWEBOK v4 stresses the importance of distinguishing system requirements (which apply to the system as a whole) from software requirements (which apply only to the software components within that system). Software requirements are often derived from higher-level system requirements through a process of allocation. In systems where the software is itself the primary product of interest, system requirements and software requirements may merge, with hardware and operating systems treated simply as platform infrastructure.",
      type: "text"
    },
    {
      level: 3,
      text: "1.11 Derived Requirements",
      type: "header"
    },
    {
      text: "Derived requirements are requirements that are not directly imposed by stakeholders external to the project, but are instead generated internally by the development team as a consequence of architectural decisions or design choices. For example, an architect's decision to use a microservices or a pipes-and-filters architecture is a design choice from the perspective of external clients, but it imposes derived requirements on the sub-teams responsible for constructing each service or filter. These derived requirements must be tracked and validated to ensure they align with the parent requirements that motivated the design choice.",
      type: "text"
    },
    {
      level: 3,
      text: "1.12 Software Requirements Activities",
      type: "header"
    },
    {
      text: "The software requirements process is split into two primary operational areas:",
      type: "text"
    },
    {
      items: [
        {
          text: "Requirements Development: The activities of Elicitation (capturing candidate requirements), Analysis (evaluating consistency, feasibility, and economics), Specification (documenting requirements for communication), and Validation (confirming requirements represent true stakeholder needs)."
        },
        {
          text: "Requirements Management: The activities of Requirements Scrubbing (pruning obsolete requirements), Change Control (managing modifications to the baseline), and Scope Matching (balancing product features with cost, schedule, and staffing constraints)."
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
          text: "Has each requirement been classified as either a Software Product Requirement or a Software Project Requirement?"
        },
        {
          text: "Are the functional requirements clearly separated from nonfunctional requirements using the Perfect Technology Filter?"
        },
        {
          text: "Have the nonfunctional requirements been partitioned into Technology Constraints (mandating/prohibiting named platforms) and Quality of Service (QoS) Constraints (specifying performance levels)?"
        },
        {
          text: "Is there an explicit mapping showing how system-level requirements allocate and translate to specific software-level requirements?"
        },
        {
          text: "Are all derived requirements arising from architectural or design decisions documented and traced back to their parent decisions?"
        },
        {
          text: "Has recursive design been applied to decompose parent QoS constraints into child functional requirements?"
        },
        {
          text: "Are all Quality of Service constraints specified quantitatively (e.g., using response time, throughput, or accuracy parameters)?"
        },
        {
          text: "Has a clear boundary been established between the software requirements and the hardware/platform environment?"
        },
        {
          text: "Do the functional requirements focus strictly on business policies to be enforced and processes to be carried out?"
        },
        {
          text: "Have requirements development activities (elicitation, analysis, specification, validation) been planned and tailored to the project context?"
        },
        {
          text: "Have requirements management activities, including change control and scope matching, been defined to maintain the agreement baseline over time?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "requirements validation, planning, design discussions, plan mode, grill-me, or figuring out what needs to be done before implementing",
  filename: "requirements-fundamentals",
  trigger: "model_decision"
});
