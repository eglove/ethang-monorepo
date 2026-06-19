import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringOperationsFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Operations Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering operations represent the systematic study, management, and execution of processes required to run software systems in active production environments. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6, Section 1, operations must be treated as a disciplined, repeatable engineering activity rather than an ad-hoc administrative task. The transition of software from development to production introduces complex requirements for environment consistency, system reliability, diagnostic visibility, and customer support. Effective operations rely on standardized processes to prepare, perform, manage results, and support customers. By automating installations, configuring environments, utilizing advanced testing methodologies, and optimizing traffic distribution through load balancing, operations engineering ensures that software systems consistently deliver their specified quality of service.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 The Definition and Role of Operations",
      type: "header"
    },
    {
      text: "Software engineering operations encompass all processes and activities required to keep a software system running, healthy, and aligned with stakeholder needs in production. Unlike development, which focus on construction and feature delivery, operations focus on preservation, availability, stability, and efficiency. This discipline addresses the inherent tension between change (introducing new features) and stability (maintaining uninterrupted system availability). Operations engineers manage this balance by establishing operational readiness standards, defining Service Level Agreements (SLAs), Service Level Objectives (SLOs), and Service Level Indicators (SLIs), and creating feedback loops that inform future design iterations.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Operations Processes: Prepare, Perform, Manage Results, and Support Customer",
      type: "header"
    },
    {
      text: "SWEBOK v4 structures software operations into four core processes that govern the operational lifecycle:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Prepare**: This phase establishes operational readiness. It includes configuring infrastructure, validating configuration files, establishing environment variables, verifying network paths, and testing rollback plans. Operational documentation must be reviewed, and system constraints must be analyzed to ensure the production environment can handle the expected load."
        },
        {
          text: "**Perform**: This phase executes the transition of software changes into production. It includes deploying code packages, executing database schema migrations, updating directory structures, updating registry entries, and starting services. Performance of this step must be monitored in real time to catch installation anomalies immediately."
        },
        {
          text: "**Manage Results**: This phase collects, aggregates, and analyzes system telemetry. Engineers monitor runtime logs, trace exceptions, evaluate resource utilization (CPU, memory, storage, network bandwidth), and audit access patterns. Telemetry data is parsed to detect security incidents, predict capacity bottlenecks, and verify compliance with operational level agreements."
        },
        {
          text: "**Support Customer**: This phase addresses user feedback and system failures. It involves incident management (identifying, isolating, and resolving outages), problem management (determining root causes to prevent recurrence), and customer support channels. Feedback from support operations is structured to inform development teams of defect patterns or usability friction."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Software Installation: Scripting, Configuration, and Verification",
      type: "header"
    },
    {
      text: "A critical operational activity is software installation, which translates compiled packages into active runtime configurations. Manual installation processes are prone to human error and lead to configuration drift:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Scripted Setup**: Installation steps must be automated using repeatable scripts or infrastructure-as-code. These scripts handle package extraction, permission settings, user account creation, and dependency resolution."
        },
        {
          text: "**Directory and Registry Configuration**: Installation scripts configure file system paths, directory access control lists, and operating system registry keys. These changes must be tracked, and configurations must be parameterized to allow identical deployment scripts to target development, staging, and production environments without manual alterations."
        },
        {
          text: "**Post-Installation Verification**: After deployment, the installation must be validated through automated verification checks. These checks verify that processes are running, dependencies are resolved, communication channels are open, and the system version matches the target release baseline. If verification fails, automated rollback mechanisms should restore the previous state to maintain system availability."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Repetitive Task Automation through Scripting",
      type: "header"
    },
    {
      text: "Repetitive operational tasks—such as backup generation, log rotation, database maintenance, user provisioning, and health checking—must be automated to prevent human error and ensure consistency:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Script Quality and Structure**: Operations scripts must adhere to software quality standards. They must be stored in version control, peer-reviewed, and documented. Scripts should include robust error-handling, log execution steps, and return standard exit codes to signal success or failure."
        },
        {
          text: "**Idempotence**: Automation scripts must be designed to be idempotent, meaning executing the script multiple times with the same inputs produces the same system state without causing side effects or errors. This property is crucial for auto-recovery processes where scripts are retried after network timeouts or transient failures."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Testing and Troubleshooting: Diagnostics, Canary Testing, and Dark Launches",
      type: "header"
    },
    {
      text: "Production systems require specialized testing and troubleshooting techniques to validate changes under real-world conditions while minimizing the risk of widespread outages:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Operational Diagnostics**: Diagnosing production failures requires comprehensive logging and tracing. Diagnostic logs should provide clear error messages, stack traces, correlation IDs (to track requests across microservices), and contextual metadata. High-integrity troubleshooting uses structural metrics to isolate bottlenecks without compromising sensitive user data."
        },
        {
          text: "**Canary Testing**: This technique deploys a new software release to a small subset of the production infrastructure or a restricted percentage of users. Traffic is routed to the canary instance, and its performance and error rates are monitored against a control group. If the canary shows no anomalies, the release is gradually rolled out to the rest of the infrastructure. If defects are detected, traffic is immediately rerouted, limiting the impact of the failure."
        },
        {
          text: "**Dark Launches**: A dark launch deploys software changes to production while keeping them invisible to users. For example, frontend components are hidden behind feature flags, or backend services process real traffic in parallel with existing systems but discard the results. This allows operations to test the performance, databases, and scalability of the new code under production load without affecting the user experience."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Performance, Reliability, and Traffic Management",
      type: "header"
    },
    {
      text: "To maintain the required quality of service, operations must actively manage system performance and reliability under varying load conditions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Load Balancing**: Traffic distribution is critical for scaling applications. Load balancers distribute incoming user requests across a pool of servers based on routing algorithms (such as round-robin, least connections, or IP hashing). Layer 4 load balancing routes traffic based on network protocol headers (IP, port), while Layer 7 load balancing routes traffic based on application data (URLs, cookies, HTTP headers)."
        },
        {
          text: "**Health Probing**: Load balancers continuously monitor the health of backend instances using active health probes. If an instance fails a probe (e.g., returns an HTTP 500 error or times out), the load balancer removes it from the routing pool. Once the instance recovers and passes the health checks, it is restored to the pool."
        },
        {
          text: "**Reliability Engineering**: System reliability is enhanced through redundancy, failover mechanisms, circuit breakers, and rate limiting. Operations engineers design systems to handle hardware failures, network partitions, and traffic spikes without catastrophic failure, ensuring the application remains available to users."
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
          text: "Has a formal operational readiness review been conducted before transitioning software changes from the staging environment to production?"
        },
        {
          text: "Were the operations processes (prepare, perform, manage results, and support customer) documented and validated to ensure baseline stability?"
        },
        {
          text: "Is software installation automated using repeatable, version-controlled scripts to eliminate manual errors and configuration drift?"
        },
        {
          text: "Were directory access permissions, system registry configurations, and environment variables parameterized for each target environment?"
        },
        {
          text: "Did the post-installation verification check confirm that all services, dependencies, and network paths are active and correct?"
        },
        {
          text: "Are repetitive operational tasks (such as database backups, log rotation, and maintenance) automated using peer-reviewed scripts?"
        },
        {
          text: "Are operational scripts designed to be idempotent to prevent side effects when retried after network timeouts or system failures?"
        },
        {
          text: "Were diagnostic logging structures established, including correlation IDs, to trace requests and exceptions across distributed systems?"
        },
        {
          text: "Is canary testing configured to route production traffic to a small subset of servers to validate release stability before a global rollout?"
        },
        {
          text: "Were dark launches used to deploy new features invisibly, validating backend performance and databases under real production load?"
        },
        {
          text: "Is traffic distributed across backend instances using layer 4 or layer 7 load balancers with active health checks to ensure availability?"
        },
        {
          text: "Were SLOs, SLAs, and SLIs established to measure system performance and reliability, feeding operational insights back to development?"
        },
        {
          text: "Has an incident management and root-cause analysis process been implemented to address and learn from production failures?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering operations, operations processes, prepare, perform, manage results, support customer, software installation, scripting, directory/registry config, verification, scripting/automation, repetitive tasks, testing, troubleshooting, diagnostics, canary testing, dark launches, performance, reliability, load balancing",
  filename: "engineering-operations-fundamentals",
  trigger: "model_decision"
});
