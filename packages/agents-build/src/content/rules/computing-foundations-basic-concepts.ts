import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsBasicConcepts = defineRule({
  content: [
    {
      level: 1,
      text: "Computing Foundations - Basic Concepts of a System or Solution",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering is distinguished from basic computer programming by its focus on systematic, disciplined, and quantifiable approaches to the development, operation, and maintenance of software systems. According to the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, a programmer typically focuses on converting a specific algorithm into a set of computer instructions, compiling the code, linking libraries, loading the program, and running it to produce output. In contrast, a software engineer is responsible for a much broader scope: studying requirements, designing system blocks, identifying optimal algorithms, selecting appropriate communication and database systems, establishing performance criteria, formulating test and acceptance plans, and defining engineering processes. Grounded in the basic concepts of computing, a software engineer must analyze a problem from multiple dimensions to deliver an optimized system or solution.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Problem Analysis and Solution Delineation",
      type: "header"
    },
    {
      text: "The initial phase of engineering any software solution is the rigorous analysis of the problem. Delineating the problem space (what needs to be solved from the stakeholder perspective) from the solution space (how the system will implement the resolution) is a fundamental engineering task. Problem analysis must evaluate the following key dimensions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Functional Requirements**: Establishing the core operations, transactions, and behaviors that the system must perform to satisfy business rules and user needs."
        },
        {
          text: "**User Interactions**: Modeling how human users will interact with the system, determining the inputs required, and defining the corresponding outputs to ensure user satisfaction."
        },
        {
          text: "**Performance Requirements**: Defining constraints on execution speed, latency, response times, throughput, and resource utilization under various operational loads."
        },
        {
          text: "**Device Interfaces**: Specifying how the software interacts with external hardware subsystems, sensors, actuators, and peripheral devices."
        },
        {
          text: "**Security**: Identifying threat models, defining authentication and authorization boundaries, and ensuring data protection at rest and in transit."
        },
        {
          text: "**Vulnerability**: Analyzing potential security weaknesses, injection vectors, and logical flaws to minimize the system's attack surface."
        },
        {
          text: "**Durability**: Ensuring the software can withstand prolonged operation, manage resource exhaustion (such as memory leaks), and maintain reliability over its intended lifecycle."
        },
        {
          text: "**Upgradability**: Designing the system to support future enhancements, patches, and version updates without requiring complete rewrites or causing extensive downtime."
        }
      ],
      type: "numberedList"
    },
    {
      text: "An engineered solution must balance these often competing requirements, using trade-off analysis to determine the optimal balance between performance, security, cost, and maintainability.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 System and Subsystem Architecture",
      type: "header"
    },
    {
      text: "A system is defined as an integrated set of subsystems, modules, and components that cooperate to perform specific functions. In software engineering, partitioning a complex system into manageable subsystems is the primary method of managing complexity. Subsystems can include both software and hardware elements, where the hardware is selected or designed to support the software's execution and meet user interface and performance goals. The partitioning of software subsystems must adhere to three foundational design characteristics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Modularity**: Subsystems and modules should be designed as uniform, manageable chunks of code. Modularity ensures that the codebase is structured into logical packages, making it easier for developers to comprehend, test, and maintain separate parts of the system."
        },
        {
          text: "**Cohesion**: Cohesion is a measure of how strongly focused the responsibilities of a single subsystem or module are. High cohesion is the ideal; each subsystem or module should perform one specific, well-defined task. When a module is highly cohesive, it is easier to understand, reuse, and modify without introducing unintended side effects."
        },
        {
          text: "**Coupling**: Coupling is a measure of the degree of interdependence between different subsystems or modules. Loose coupling is the ideal; each subsystem should function as independently as possible. Loosely coupled subsystems communicate through well-defined, minimal interfaces, allowing changes to be made within one module without requiring corresponding changes in other modules."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Subsystems may be further decomposed into smaller modules and sub-modules, each of which must continually maintain these characteristics of high cohesion and loose coupling.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Subsystem Characteristics and Operational Environments",
      type: "header"
    },
    {
      text: "Software engineers must design subsystems to fit specific operational environments and paradigms. The selection of these paradigms is determined during the problem analysis phase and affects the choice of underlying technologies:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Manual vs. Automated Systems**: Systems can range from purely manual workflows to semi-automated processes (where human intervention is required at specific decision points) to fully automated systems (operating autonomously based on predefined logic and inputs)."
        },
        {
          text: "**Real-Time vs. Non-Real-Time Systems**: Real-time systems must operate within strict time constraints, where the correctness of the system depends not only on the logical result of the computation but also on the time at which the result is delivered. Hard real-time systems have deadlines that must be met under all circumstances to prevent catastrophic failure, whereas soft real-time systems allow for minor deadline misses without system failure. Non-real-time systems (such as batch processing) prioritize throughput over latency."
        },
        {
          text: "**Online vs. Offline Systems**: Online systems require continuous network connectivity and interact with live data, providing immediate updates to users. Offline systems run independently of network connections, caching data locally and synchronizing with central repositories at a later time."
        },
        {
          text: "**Distributed vs. Single-Location Systems**: Distributed systems run on multiple computing nodes connected via a network, sharing the processing load and data storage. They offer scalability and fault tolerance but introduce challenges in consistency, latency, and network partition management. Single-location systems execute on a single physical machine, simplifying design but limiting scalability."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.4 Architectural Decision-Making and Technology Selection",
      type: "header"
    },
    {
      text: "When designing a computing solution, the software architect must consider and choose the most appropriate technologies and structures. This decision-making process is guided by the requirements gathered during problem analysis and includes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Technology and Tools**: Selecting frameworks, build tools, and deployment platforms that align with the team's capabilities and the system's operational needs."
        },
        {
          text: "**Data Structures**: Choosing representation models for data that optimize memory usage and processing speed for the application's common use cases."
        },
        {
          text: "**Operating Systems**: Selecting operating systems (such as general-purpose OS or real-time OS) that provide the necessary resource management, scheduling, and hardware driver support."
        },
        {
          text: "**Databases**: Evaluating data storage needs to choose between relational, non-relational, or hybrid database systems, considering constraints on consistency, availability, and write speeds."
        },
        {
          text: "**User Interfaces**: Choosing the interface technologies (command line, graphical, voice, or touch) that best suit the target user profile and operational context."
        },
        {
          text: "**Programming Languages**: Selecting languages based on execution efficiency, safety features, ecosystem support, and compiler capabilities (static vs. dynamic typing)."
        },
        {
          text: "**Algorithms**: Identifying the optimal computational procedures to solve specific logic problems while meeting performance and security requirements."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "By systematically addressing these basic concepts, the software engineer ensures that the solution is robust, maintainable, and aligned with engineering principles.",
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
          text: "**Functional and Non-Functional Delineation**: Have the functional requirements been clearly separated from performance, security, and device interface constraints?"
        },
        {
          text: "**User Interaction Mapping**: Has the user interaction model been fully documented, specifying all inputs, expected outputs, and interface transition steps?"
        },
        {
          text: "**Performance Criteria Specification**: Are the performance requirements (latency, throughput, resource bounds) explicitly defined and quantifiable?"
        },
        {
          text: "**Device Interface Definitions**: Have all external hardware, sensor, and actuator interfaces been specified with timing and data format protocols?"
        },
        {
          text: "**Security and Threat Modeling**: Has a threat model been established, and are the boundaries for authentication and authorization clearly delineated?"
        },
        {
          text: "**Vulnerability Mitigation**: Have the system designs been analyzed to identify and mitigate potential vulnerabilities, such as injection points or logical bypasses?"
        },
        {
          text: "**Durability and Reliability Planning**: Does the design include strategies to ensure durability, such as memory management, connection pooling, and resource limits?"
        },
        {
          text: "**Upgradability Path**: Is there a documented plan for upgrading and patching the software subsystems without causing system-wide failures or extensive downtime?"
        },
        {
          text: "**Subsystem Partitioning Strategy**: Has the overall system been partitioned into logical subsystems and modules to manage complexity?"
        },
        {
          text: "**Modularity and Uniformity Check**: Are the partitioned modules designed with a uniform structure and manageable size to facilitate comprehension?"
        },
        {
          text: "**Cohesion Verification**: Has each module been reviewed to ensure it has a single, well-defined responsibility, maximizing cohesion?"
        },
        {
          text: "**Coupling Analysis**: Are module interfaces minimized and well-defined to ensure loose coupling, preventing cascading changes?"
        },
        {
          text: "**Automation Level Selection**: Is the level of automation (manual, semi-automated, fully automated) explicitly aligned with the user requirements?"
        },
        {
          text: "**Real-Time Constraint Handling**: If the system has real-time requirements, have the deadlines been classified (hard vs. soft) and has deterministic scheduling been validated?"
        },
        {
          text: "**Connectivity Paradigm Alignment**: Has the system's connectivity model (online, offline, hybrid) been selected and designed to handle network dropouts?"
        },
        {
          text: "**Deployment Distribution Model**: Has the choice between single-location and distributed architectures been justified based on scalability and fault tolerance requirements?"
        },
        {
          text: "**Architectural Decision Rationale**: Is there a recorded design rationale for the chosen programming languages, operating systems, databases, and algorithms?"
        },
        {
          text: "**SWEBOK Standards Conformance**: Does the overall design process align with the engineering principles defined in the SWEBOK v4 Computing Foundations framework?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "computing foundations, system concepts, solution architecture, modularity, cohesion, coupling, real-time systems, distributed systems, technology selection, system design",
  filename: "computing-foundations-basic-concepts",
  trigger: "model_decision"
});
