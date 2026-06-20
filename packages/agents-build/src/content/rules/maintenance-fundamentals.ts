import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const maintenanceFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Maintenance Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software maintenance represents the systematic and disciplined application of software engineering principles to support and modify existing software applications after their initial delivery. As defined in the international standard ISO/IEC/IEEE 14764, software maintenance is a critical technical lifecycle process aimed at keeping software systems functional, secure, and aligned with user requirements while preserving their internal integrity. The scope of maintenance spans both pre-delivery planning and post-delivery operations. Over the total operational lifespan of a software system, maintenance activities consume the vast majority of resources, making it a dominant cost driver in software engineering economics. Understanding the definitions, nature, evolutionary dynamics, and specific classifications of software maintenance is crucial for managing software engineering processes and maintaining high-quality systems over time.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Definitions, Terminology, and Standards",
      type: "header"
    },
    {
      text: "The primary reference standard for software maintenance is ISO/IEC/IEEE 14764, which outlines the processes, activities, and tasks required to sustain operational systems. In this framework, software maintenance is defined as the totality of activities required to provide cost-effective support for software in operation. A software maintainer is a specific role or organization designated to carry out maintenance tasks. The maintainer must interface with developers to acquire system knowledge and with operators to monitor runtime performance. The objective is to make modifications to the system (including code, schemas, tests, and documentation) without compromising its existing capabilities. Importantly, the standard stresses pre-delivery activities, such as establishing transition plans and conducting maintainability reviews during active development, to reduce post-deployment effort. Furthermore, the role of a maintainer is distinct from that of a developer. While developers focus on bringing a new system from concept to launch, maintainers must absorb the operational context and work with existing codebases, often in the absence of the original design team, requiring a strong focus on program comprehension and legacy code adaptation.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 The Nature of Software Maintenance",
      type: "header"
    },
    {
      text: "The nature of software maintenance is defined by the constraints of working on an existing system. Unlike initial system construction, where developers design components with few legacy dependencies, maintenance engineers must operate within a pre-existing architectural structure. Every modification has the potential to introduce unintended side effects or regression defects due to hidden coupling. Maintainers must perform detailed program comprehension, reverse-engineer undocumented logic, and navigate system constraints. The maintainer's day-to-day work is driven by external feedback, including incident reports, user complaints, and changing business requirements. These inputs are logged as Modification Requests (MRs) or Problem Reports (PRs) and must be tracked through a controlled change process. This context shifts the software engineering discipline from active creation to continuous preservation, requiring a deep understanding of operational conditions, hardware configurations, and network environments.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Need for Software Maintenance",
      type: "header"
    },
    {
      text: "Software maintenance is needed because software is never complete. Once deployed, applications must change to satisfy evolving user requirements, fix latent defects, adapt to new operating environments, and mitigate security threats. The need for maintenance is driven by several factors:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Correcting Faults**: Deployed software inevitably contains latent defects and design errors that are only uncovered under production workloads."
        },
        {
          text: "**Enhancing Capabilities**: As business requirements evolve, users demand new features, improved user interfaces, and extended functionality."
        },
        {
          text: "**Adapting Environments**: System platforms change. Operating systems, databases, runtime environments, and third-party APIs are continuously updated, requiring adaptive changes to keep the application compatible."
        },
        {
          text: "**Preventing Obsolescence**: Security threats evolve constantly, requiring maintainers to patch vulnerabilities, update third-party libraries, and refactor brittle components to prevent future failures."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Majority of Maintenance Costs and Economic Impact",
      type: "header"
    },
    {
      text: "In software economics, it is widely recognized that the majority of software lifecycle costs are incurred during the maintenance and operations phase. Empirical data shows that maintenance accounts for sixty to eighty percent of the total cost of ownership of a software product. This cost distribution is a function of time: while initial development may span several months, the system remains in active production use for years or even decades. The costs are driven by continuous regression testing, environment configuration, staffing, and technical debt. Choosing to deliver software quickly by cutting corners during development increases the maintenance burden, as brittle designs are harder and more expensive to modify. Modern organizations adopt DevOps practices to merge development and operations, reducing organizational silos and lowering lifecycle costs. By focusing on maintainability during the design phase, teams can significantly reduce the long-term effort required to sustain the system in production.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Evolution of Software and Lehman's Laws",
      type: "header"
    },
    {
      text: "Software evolution refers to the continuous cycle of modification that systems undergo to maintain utility. In the 1970s and 1980s, Manny Lehman and Les Belady formulated a set of laws governing the evolution of proprietary software systems (E-type systems):",
      type: "text"
    },
    {
      items: [
        {
          text: "**Continuous Change**: An operational system must undergo continuous change to remain satisfactory to its users in a changing environment."
        },
        {
          text: "**Increasing Complexity**: As a system evolves, its complexity increases unless active work (such as refactoring) is done to simplify it."
        },
        {
          text: "**Self-Regulation**: The evolution process exhibits a self-regulating behavior with statistically determinable trends and indicators."
        },
        {
          text: "**Organizational Stability**: The average activity rate in an evolutionary process is constant over a project's lifetime, regardless of resource changes."
        },
        {
          text: "**Conservation of Familiarity**: The content of successive releases remains statistically constant to prevent user disruption and maintain understanding."
        },
        {
          text: "**Continuing Growth**: The functional content of a system must grow continually to maintain user satisfaction over time."
        },
        {
          text: "**Declining Quality**: System quality will appear to decline unless the software is actively adapted to its changing environment."
        },
        {
          text: "**Feedback System**: Evolutionary processes constitute multi-loop, multi-agent feedback systems and must be managed as such to control drift.\nUnderstanding these laws allows organizations to anticipate code decay and plan proactive refactoring."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.6 Categories of Software Maintenance",
      type: "header"
    },
    {
      text: "ISO/IEC/IEEE 14764 classifies software maintenance into four distinct categories based on the intent of the modification:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Corrective Maintenance**: Reactive modification of a software product performed after delivery to correct discovered problems and runtime defects."
        },
        {
          text: "**Adaptive Maintenance**: Modification of a software product performed after delivery to keep it usable in a changed or changing environment, such as porting to new hardware."
        },
        {
          text: "**Perfective Maintenance**: Modification performed after delivery to improve performance, maintainability, or usability. This includes optimizing database queries and refactoring code."
        },
        {
          text: "**Preventive Maintenance**: Modification performed after delivery to detect and correct latent faults before they manifest as operational failures, such as applying security patches.\nMaintainers must track and analyze maintenance efforts across these categories to identify cost drivers and guide process improvements."
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
          text: "Has a designated software maintainer role or team been assigned and integrated into the project during the development phase?"
        },
        {
          text: "Were pre-delivery maintainability assessments conducted to verify code quality, modularity, test coverage, and documentation completeness?"
        },
        {
          text: "Did the team establish a formal transition plan defining schedules, training, support environments, and transfer checklists?"
        },
        {
          text: "Are all post-delivery modifications designed to preserve the operational integrity, reliability, and security of the existing system?"
        },
        {
          text: "Were active surveillance and monitoring channels configured to capture and log runtime exceptions and performance bottlenecks?"
        },
        {
          text: "Did the maintenance group establish and operate a structured user support mechanism (such as a help desk) to log incoming requests?"
        },
        {
          text: "Is every change request tracked as a formal Modification Request (MR) or Problem Report (PR) through a controlled change process?"
        },
        {
          text: "Were corrective maintenance activities prioritized and scheduled to resolve critical bugs and security vulnerabilities?"
        },
        {
          text: "Did the team execute adaptive maintenance to maintain compatibility when interfaced databases, operating systems, or APIs were upgraded?"
        },
        {
          text: "Was perfective maintenance (such as code refactoring and database index tuning) scheduled to prevent design decay and performance drift?"
        },
        {
          text: "Were preventive maintenance tasks (including dependency updates and security patches) applied to resolve latent faults before failure?"
        },
        {
          text: "Are Lehman's laws of software evolution monitored to guide refactoring schedules and control complexity growth?"
        },
        {
          text: "Were maintenance efforts tracked and reported by category (corrective, adaptive, perfective, preventive) to analyze lifecycle cost drivers?"
        },
        {
          text: "Is DevOps alignment practiced to ensure continuous delivery, automated testing, and synchronization between development and operations?"
        },
        {
          text: "Are third-party dependencies monitored for technical obsolescence, with planned upgrades before vendor support terminates?"
        },
        {
          text: "Have maintainability audits been conducted on new code deliveries to ensure they conform to long-term operational standards?"
        },
        {
          text: "Was a formal post-delivery review performed to assess system stability and verify that the maintenance objectives are met?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software maintenance fundamentals, definitions, terminology, nature of maintenance, need for maintenance, majority of maintenance costs, evolution of software, lehman laws, categories of maintenance, corrective, adaptive, perfective, preventive",
  filename: "maintenance-fundamentals",
  trigger: "model_decision"
});
