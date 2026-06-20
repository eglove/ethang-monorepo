import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const constructionManagement = defineRule({
  content: [
    {
      level: 1,
      text: "Managing Construction",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Managing construction is the engineering discipline of planning, sequencing, monitoring, measuring, and coordinating dependencies during the active implementation phase of a software system. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4, Section 2, managing construction ensures that coding, debugging, unit testing, and integration activities proceed systematically, efficiently, and predictably. ",
      type: "text"
    },
    {
      text: "Software construction is rarely a solitary, unstructured coding activity; rather, it requires managing the interaction between project lifecycles, component integration order, progress measurements, and the external software dependency supply chain. Successful construction management minimizes integration friction, prevents dependency vulnerabilities, controls structural drift, and ensures release quality. The primary objective is to align construction activities with project constraints, resource allocations, and quality standards, bridging the gap between design specifications and working software.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Construction in Software Development Lifecycle Models",
      type: "header"
    },
    {
      text: "The role, scope, and definition of software construction depend heavily on the software development lifecycle model selected for the project. The choice of model determines the timing of construction activities, the entry and exit gates for implementation, and the relationship between coding and other software engineering phases:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Linear Lifecycle Models**: Lifecycle models such as the waterfall and staged-delivery models treat construction as a distinct, sequential activity that begins only after prerequisite requirements, architecture design, and project planning are fully completed. In these models, construction is primarily focused on translating design specifications into code and performing local debugging. The entry criteria are strict, requiring signed-off design documentation and baseline plans. The advantage is clear traceability, but the disadvantage is that design mistakes are only discovered very late, during the subsequent integration or system testing phases."
        },
        {
          text: "**Iterative and Agile Lifecycle Models**: Lifecycle models such as Scrum, Kanban, Extreme Programming, and evolutionary prototyping treat construction as an ongoing, overlapping activity that occurs concurrently with requirements discovery, detailed design, and release planning. These models mix design, coding, testing, and integration into continuous, short iteration loops, treating the combination of activities as construction. The code is constructed in small increments, allowing developers to get early feedback and adapt to evolving user requirements. The dynamic nature of construction in iterative models requires flexible coding practices and constant refactoring to prevent technical debt from accumulating."
        },
        {
          text: "**Continuous Delivery and Deployment**: These models represent modern operational extensions of iterative lifecycles that further integrate construction with operations. The deployment pipeline automates compilation, verification testing, packaging, and release delivery, allowing software updates to flow continuously from construction directly into production environments. Whenever a developer commits code, the pipeline automatically compiles the system, runs static analysis checks, executes unit and integration tests, packages the application, and deploys it. This automation shifts the focus to pipeline configuration, build reliability, and immediate feedback loops."
        },
        {
          text: "**Backend-as-a-Service Delegation**: Modern lifecycle models leverage cloud-provided Backend-as-a-Service (BaaS) solutions, delegating infrastructural backend code (such as authentication, push notifications, databases, and content storage) to cloud providers, which reshapes the scope of custom construction to focus on business-specific logic. Instead of constructing low-level infrastructural code (like database connection pools and encryption routines), construction is centered on writing business logic, orchestrating APIs, and managing the integration points between various cloud services. This reduces the custom construction footprint but increases the complexity of integration planning and dependency management."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Construction Planning and Sequencing",
      type: "header"
    },
    {
      text: "Construction planning is the activity that defines how the implementation will be executed, integrated, and verified. It establishes the operational framework for the development team:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Choice of Construction Method**: Selecting the development approach (e.g., test-first programming, prototyping, formal specification modeling, or grammar-based construction) which determines the extent to which construction prerequisites are performed and the order of prerequisite gates. Each method has different prerequisites, resource requirements, and risk profiles."
        },
        {
          text: "**Component Sequencing**: Defining the order in which components are created, tested, and integrated. Designers choose between top-down, bottom-up, or feature-thread sequencing based on architectural risks and dependency availability.\n- *Top-Down Sequencing*: Construction begins with high-level control structures and user interface components. Lower-level components are replaced by stubs (temporary mock routines that return dummy data). This allows early verification of control flow, but low-level performance bottlenecks or database integration issues are discovered late.\n- *Bottom-Up Sequencing*: Construction starts with low-level utility libraries, database access objects, and core algorithms. High-level control structures are simulated using test drivers. This ensures that the foundation of the system is highly optimized and verified, but the integration of user interfaces and end-to-end user transactions is delayed.\n- *Feature-Thread Sequencing*: Developers build vertical slices of functionality (from user interface down to data persistence) for individual user stories. This is the preferred sequence in agile lifecycles, as it delivers working, end-to-end features incrementally."
        },
        {
          text: "**Integration Strategies**:\n- *Phased Integration (Big Bang)*: Developing components independently and combining them all at once. This strategy is highly risky as it makes isolating and debugging interface mismatches extremely difficult. A failure could be due to a bug in a component, a mismatch between components, or a configuration error.\n- *Incremental Integration*: Combining components one by one and testing the system at each step. This minimizes the diagnostic search space for faults, making debugging far more efficient. Additional test infrastructure, including stubs, drivers, and mock objects, is usually needed to enable incremental integration."
        },
        {
          text: "**Quality Management Planning**: Setting entrance and exit criteria for code reviews, defining automated static analysis lint rules, and establishing target unit and integration test coverage thresholds."
        },
        {
          text: "**Resource and Task Allocation**: Assigning construction tasks to specific software engineers based on expertise, module boundaries, and parallel execution paths, ensuring that developers working on tightly coupled modules communicate frequently and that parallel construction streams do not conflict."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Construction Measurement and Metrics",
      type: "header"
    },
    {
      text: "Construction measurement gathers objective metrics to monitor implementation progress, assess quality, and drive process improvement:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Code Churn**: Tracks code volumes developed, modified, reused, and destroyed over time. High churn in stabilized modules indicates requirements volatility or structural instability."
        },
        {
          text: "**Complexity Metrics**: Cyclomatic complexity (independent execution paths) and nesting depth measurements prevent untestable code. Low complexity guarantees easier testing and maintenance."
        },
        {
          text: "**Inspection Statistics**: Defect densities, unit test pass rates, and fault find-to-fix ratios evaluate the effectiveness of quality gates and reviews."
        },
        {
          text: "**Effort and Scheduling**: Comparing actual hours with baseline estimates calibrates future estimation models and alerts managers to schedule slippage."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Managing Dependencies and Supply Chain Security",
      type: "header"
    },
    {
      text: "Software products often heavily rely on dependencies, including internal and external (commercial or open-source) dependencies, which allow developers to reuse common functionalities instead of reinventing the wheel and substantially improve developers’ productivity.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Dependency Automation**: Utilizing package managers to automate the process of installing, upgrading, configuring, and removing dependencies."
        },
        {
          text: "**Dependency Supply Chain Risks**: The direct and indirect dependencies of software products constitute a dependency supply chain network. Any dependency in the supply chain network can introduce potential risk to software products and should be managed by developers or tools:\n- *Security Risks*: Vulnerabilities or backdoors in transitive dependencies can propagate into the product. Teams must scan dependency trees to block untrusted or compromised packages.\n- *Legal Risks*: Copyleft licenses (GPL, AGPL) carry viral terms requiring proprietary code to be open-sourced, whereas permissive licenses (MIT, Apache 2.0) allow commercial use. Automated pipelines must check and block unauthorized copyleft libraries.\n- *Performance Risks*: Unnecessary dependencies cause bundle bloat, increasing compile times and slowing execution (e.g., cold starts). Regular pruning and imports structured for tree-shaking optimize performance.\n- *Monitoring Regulations*: Policies and automated checks should govern dependency additions. Any new library must be justified by verifying its maintenance health, security logs, and community support."
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
          text: "Has the construction plan been aligned with the project's selected software development lifecycle model?"
        },
        {
          text: "Were the entrance and exit criteria for construction prerequisites (requirements and design baselines) verified before coding began?"
        },
        {
          text: "Has the integration strategy (incremental integration vs. phased big-bang) been defined and documented?"
        },
        {
          text: "Is the sequence of component creation and integration structured to minimize architectural risks?"
        },
        {
          text: "Were quality management processes (such as target test coverage, static analysis rules, and peer review schedules) established?"
        },
        {
          text: "Has a package manager been configured to automate dependency installation, configuration, and removal?"
        },
        {
          text: "Did the manager review the dependency supply chain to avoid unnecessary or redundant packages, optimizing build efficiency?"
        },
        {
          text: "Was an automated dependency vulnerability scanner executed to prevent the propagation of defects into the system?"
        },
        {
          text: "Have external dependency licenses been audited to prevent legal conflicts and protect intellectual property?"
        },
        {
          text: "Are code volume and code churn metrics (code developed, modified, reused, destroyed) monitored to detect design instability?"
        },
        {
          text: "Were code inspection statistics and fault-fix/find rates recorded to evaluate the quality of the construction process?"
        },
        {
          text: "Has actual construction effort and scheduling progress been measured and compared against the baseline project estimates?"
        },
        {
          text: "Did the team implement monitoring regulations to prevent developers from introducing untrusted or unverified third-party libraries?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "managing construction, construction planning, construction measurement, dependency management, package managers, dependency supply chain, license compliance, integration strategies, code churn, code metrics, project lifecycle, agile development, continuous delivery, planning, plan mode, grill-me, or managing dependencies and planning integration using the antigravity cli",
  filename: "construction-management",
  trigger: "model_decision"
});
