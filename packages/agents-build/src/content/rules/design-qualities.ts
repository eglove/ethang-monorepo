import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const designQualities = defineRule({
  content: [
    {
      level: 1,
      text: "Software Design Qualities",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software requirements and architectural directives guide the system toward specific operational characteristics, known as software design qualities. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 3, Section 3, design qualities are a critical subclass of design concerns that represent the system's quality attributes, behavioral expectations, and operational constraints. Unlike raw functional requirements that specify what a system must do, design qualities specify how the system must behave under various operational conditions. Designers use software design principles to construct architectures that systematically satisfy these qualities, balancing trade-offs and ensuring long-term maintainability.",
      type: "text"
    },
    {
      level: 3,
      text: "3.1 Concurrency",
      type: "header"
    },
    {
      text: "Design for concurrency concerns the partitioning of a software system into concurrent execution units—such as processes, tasks, and threads—and the structural consequences of those partitioning decisions. Operating systems and modern runtimes coordinate these units to utilize multi-core hardware architectures efficiently. When designing concurrent software, developers must analyze the execution boundaries of each unit and manage the following concerns:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Efficiency and Resource Utilization**: Balancing the overhead of context switching and thread creation against the performance gains of parallel execution."
        },
        {
          text: "**Atomicity**: Designing operations that execute completely or not at all, ensuring that shared state remains consistent during concurrent access."
        },
        {
          text: "**Synchronization**: Employing coordination primitives (such as mutexes, semaphores, locks, and condition variables) to serialize access to critical sections."
        },
        {
          text: "**Scheduling**: Understanding how the underlying operating system or runtime scheduler allocates execution time to threads, preventing starvation and priority inversion."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "A major challenge in concurrency design is avoiding synchronization anomalies, such as deadlocks (where processes are perpetually blocked waiting for each other), livelocks (where processes change states continuously without making progress), and race conditions (where output is non-deterministic due to timing variations).",
      type: "text"
    },
    {
      level: 3,
      text: "3.2 Control and Event Handling",
      type: "header"
    },
    {
      text: "Control and event handling is concerned with how to organize the system's control flow and how to handle reactive and temporal events. This design quality dictates how the system responds to external stimulus, time-based triggers, and internal state transitions.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Control Flow Organization**: Designers choose between centralized control (where a main controller coordinates sub-components) and decentralized control (where state and control are distributed across collaborating components)."
        },
        {
          text: "**Reactive and Temporal Events**: Systems must respond to reactive events (such as user actions, network messages, or hardware interrupts) and temporal events (such as schedule intervals or timeouts) predictably."
        },
        {
          text: "**Coordination Mechanisms**: Developers implement control flows using synchronization (direct coordination between executing threads), implicit invocation (event-driven dispatch where components announce events and listeners respond), and callbacks (passing execution references to be invoked upon task completion)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.3 Data Persistence",
      type: "header"
    },
    {
      text: "Data persistence concerns the storage, retrieval, and lifecycle management of data throughout the software system. It ensures that system state is preserved across application restarts, power cycles, and crashes.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Storage and Retrieval**: Selecting appropriate persistence mechanisms (such as relational databases, document stores, key-value caches, or file systems) based on data structure, query patterns, and access frequency."
        },
        {
          text: "**Data Lifecycle**: Managing the transition of data from transient in-memory structures to persistent records, and eventually to archive or deletion states."
        },
        {
          text: "**Serialization and Deserialization**: Designing data transformation pipelines to convert programming language objects into persistent formats (such as SQL tables, JSON documents, or binary streams) and back."
        },
        {
          text: "**Transaction Management**: Establishing transactional boundaries to guarantee the ACID (Atomicity, Consistency, Isolation, Durability) properties, preventing partial writes and ensuring data integrity during failures."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.4 Distribution of Components",
      type: "header"
    },
    {
      text: "Distribution concerns the allocation of software components across distinct physical or virtual hardware nodes (including computers, networks, and mobile devices) and how these components communicate.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Network Boundaries and Protocols**: Designing interfaces that cross network boundaries, choosing communication models (such as synchronous REST/gRPC or asynchronous message queues), and handling network latency."
        },
        {
          text: "**Quality of Service (QoS) in Distribution**: Ensuring distributed components collaborate to meet system-wide performance, scalability, availability, and reliability goals."
        },
        {
          text: "**Operational Resilience**: Addressing monitorability (collecting health and performance metrics across nodes), business continuity (redundant configurations to withstand individual node failures), and disaster recovery (geographic replication and backup restoration strategies)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.5 Errors and Exception Handling, Fault Tolerance",
      type: "header"
    },
    {
      text: "This concern pertains to how the software system prevents, avoids, mitigates, tolerates, and processes errors, anomalies, and exceptional conditions during execution.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Error Prevention and Avoidance**: Using defensive design patterns, input validation, and strict type constraints to catch invalid parameters before they cause execution faults."
        },
        {
          text: "**Exception Handling**: Structuring code to handle runtime exceptions locally (using try-catch blocks) or propagating them to centralized handlers to prevent application crashes and log diagnostic information."
        },
        {
          text: "**Fault Tolerance**: Implementing redundancy and recovery tactics (such as circuit breakers, retry-with-backoff, active-passive replication, and self-healing loops) to allow the system to continue operating in a degraded or backup state when a hardware or software component fails."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.6 Integration and Interoperability",
      type: "header"
    },
    {
      text: "Integration and interoperability address the challenges that arise when heterogeneous systems, applications, or components must interwork by exchanging data or accessing each other's services.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Enterprise-Level Interoperability**: Designing data exchange formats (such as JSON, XML, or Protocol Buffers) and API protocols that allow disparate systems to communicate regardless of their underlying language or operating system."
        },
        {
          text: "**Internal Component Integration**: Coordinating components designed using different frameworks, libraries, or protocols within a single application. This requires implementing adapters, translation layers, or facade patterns to bridge architectural mismatches and preserve uniform interfaces."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.7 Assurance, Security, and Safety",
      type: "header"
    },
    {
      text: "High-assurance systems require rigorous evidence that they will behave as intended under critical situations, particularly in safety-critical and security-sensitive domains.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Design for Security**: Restricting access to authorized users and protecting resources. Designers must implement controls to prevent unauthorized disclosure (confidentiality), unauthorized creation or change (integrity), and unauthorized deletion or denial of access (availability). Security design must limit damage from active attacks, provide service continuity, and assist in diagnostic repair and recovery."
        },
        {
          text: "**Design for Safety**: Managing software behavior under circumstances that could lead to injury, loss of human life, or severe damage to property and the environment. This includes implementing interlocks, physical barriers, fail-safe modes (where components default to a safe state during failure), and hazard monitoring."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "3.8 Variability",
      type: "header"
    },
    {
      text: "Variability concerns the design capability to support permissible variations in a software system, enabling the creation of system variants to accommodate different market segments, organizations, or contexts of use.",
      type: "text"
    },
    {
      items: [
        {
          text: "**System Families and Product Lines**: Designing a shared core architecture that can be customized with variant features to deploy distinct product versions without duplicate codebase maintenance."
        },
        {
          text: "**Adaptability**: Constructing systems that adapt dynamically to different contexts (such as location, screen size, user privilege profiles, or device capabilities)."
        },
        {
          text: "**Variability Mechanisms**: Implementing variation points through configuration files, modular plug-ins, runtime feature flags, compile-time flags, or feature models that bundle related requirements and dependencies together."
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
          text: "Have the concurrent execution units (processes, tasks, threads) been identified and structured to optimize resource utilization?"
        },
        {
          text: "Were synchronization primitives (mutexes, semaphores, atomic operations) selected and analyzed to prevent deadlocks and race conditions?"
        },
        {
          text: "Is the control flow organization (centralized vs. decentralized) aligned with the event handling requirements?"
        },
        {
          text: "Were reactive, temporal, and asynchronous events coordinated using robust callbacks, synchronization, or implicit invocation?"
        },
        {
          text: "Does the data persistence design match the structure, query patterns, and lifecycle requirements of the system's data?"
        },
        {
          text: "Have transactional boundaries been designed to guarantee ACID properties and prevent data corruption during failures?"
        },
        {
          text: "Are component distribution strategies aligned with expectations for latency, network bandwidth, scalability, and availability?"
        },
        {
          text: "Did the distributed design address monitoring, business continuity, and disaster recovery replication across nodes?"
        },
        {
          text: "Have exception handling paths been mapped out using local try-catch blocks and centralized error loggers?"
        },
        {
          text: "Were fault-tolerance mechanisms (circuit breakers, retries, redundancy) designed to keep the system running in a degraded state during component failures?"
        },
        {
          text: "Is the system interoperable with external heterogeneous services through standardized exchange formats and API protocols?"
        },
        {
          text: "Have internal adapters or translation layers been implemented to resolve architectural mismatches between different libraries or frameworks?"
        },
        {
          text: "Did the security design protect the confidentiality, integrity, and availability of system resources against unauthorized actions?"
        },
        {
          text: "Are recovery and damage-limitation controls defined to restore service continuity following a security policy violation?"
        },
        {
          text: "Has the design for safety identified potential hazards and implemented fail-safe states to prevent harm or property damage?"
        },
        {
          text: "Were variability requirements documented and implemented using structured variation mechanisms (feature flags, plugins, feature models)?"
        },
        {
          text: "Has the design been analyzed to verify that variability dependencies and exclusions are enforced at compile or runtime?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design qualities, concurrency, control flow, event handling, data persistence, component distribution, error handling, exception propagation, fault tolerance, integration, interoperability, security, safety, variability, feature flags, planning, plan mode, grill-me, or defining and auditing design characteristics using the antigravity cli",
  filename: "design-qualities",
  trigger: "model_decision"
});
