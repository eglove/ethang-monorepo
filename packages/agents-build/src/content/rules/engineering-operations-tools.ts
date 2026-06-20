import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringOperationsTools = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Operations Tools",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering operations tools represent the suite of utilities, platforms, and automated frameworks that manage the release, deployment, scaling, verification, and monitoring of software systems in staging and production environments. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6, Section 6, these tools play a critical role in bridging the gap between software construction and operational execution. Operations are no longer treated as a manual post-development handoff. Instead, they are codified, automated, and managed with the same engineering rigor as application source code. Operations tools allow teams to manage distributed systems at scale, establish predictable release gates, minimize release risk, and ensure high availability. By implementing declarative configurations and automated feedback loops, organizations convert operations into a repeatable, auditable, and resilient engineering discipline.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Container and Virtualization Orchestrators",
      type: "header"
    },
    {
      text: "Containerization and virtualization are core operational technologies that abstract execution environments from the underlying physical hardware. Virtualization creates multiple virtual machines, each running a guest operating system on shared hardware using a hypervisor. Containerization, conversely, provides lightweight, operating-system-level virtualization, sharing the host kernel while isolating the application process space, file system, and network stack. This abstraction provides two operational benefits: scalability and deployment standardization.",
      type: "text"
    },
    {
      items: [
        {
          text: "Deployment Standardization: Containers package an application with its dependencies, libraries, and configuration files. This immutable artifact runs identically across development, staging, and production environments. By standardizing the runtime, organizations eliminate configuration drift, where differences in host OS versions or libraries cause software to behave differently in production. This makes deployments predictable and facilitates recovery from host failures."
        },
        {
          text: "Scalability: Managing container instances requires an orchestrator. Container orchestrators automate scheduling, deployment, networking, and scaling of containers across clusters. Orchestrators monitor workloads and adjust instance counts using horizontal autoscaling policies. When traffic increases, the orchestrator provisions replicas and configures load balancers. When traffic subsides, it scales down instances to optimize costs. Orchestrators also handle service discovery, networking, storage mapping, and self-healing behaviors, such as automatically restarting crashed containers."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Deployment Tools and Configurations",
      type: "header"
    },
    {
      text: "Deployment tools automate the delivery of built software artifacts to target environments, establishing a repeatable pipeline that reduces the risk of human error. Modern deployment practices rely on continuous integration and continuous delivery (CI/CD) pipelines, which automate the path from code check-in to production release. These pipelines use deployment configurations to manage release strategies, such as rolling updates, blue-green deployments, and canary releases.",
      type: "text"
    },
    {
      items: [
        {
          text: "Descriptor Files and Declarative Configurations: To ensure deployments are repeatable, operations tools use descriptor files (written in JSON, XML, or other serialization formats) to define the desired environment state. These files specify container images, environment variables, secrets, network ports, firewall rules, storage volumes, and replica counts. Rather than executing manual commands to set up servers, engineers write these files and submit them to a control loop. The deployment tool compares actual infrastructure state with the desired state specified in the descriptor files and applies changes to reconcile differences. This infrastructure as code approach allows configurations to be versioned, reviewed, and rolled back."
        },
        {
          text: "Release Strategies: Deployment tools orchestrate gradual rollouts of new software versions to minimize downtime. In a blue-green deployment, the tool deploys the new version to an idle environment, verifies health, and switches the network router to direct traffic to it. In a canary release, the tool deploys the new version to a subset of servers or users, evaluates telemetry data for errors, and gradually increases distribution if the release is stable."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Automated Testing Tools in Operations",
      type: "header"
    },
    {
      text: "Automated testing tools in the operational phase verify that the deployed system behaves correctly in its target environment. While unit and integration testing occur during construction, operations testing focuses on verifying the system under realistic network, database, and infrastructure conditions.",
      type: "text"
    },
    {
      items: [
        {
          text: "Verification Gates: CI/CD pipelines embed automated verification gates that execute tests immediately after deployment. These gates run smoke tests, API contract verifications, and regression suites to ensure basic capabilities, database connections, and integrations are functioning. If any test fails, the pipeline halts the rollout, prevents the change from propagating, and alerts the team."
        },
        {
          text: "Synthetic Monitoring and Chaos Engineering: Testing tools also operate in production. Synthetic monitoring tools periodically execute scripts that simulate user workflows—such as logging in or running a search—to verify that key user journeys remain operational. Chaos engineering tools inject failures into the environment—such as shutting down servers or introducing network latency—while automated verifiers check that the orchestrator, databases, and application routing handle failures gracefully."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Monitoring and Telemetry Tools",
      type: "header"
    },
    {
      text: "Once software is deployed, monitoring and telemetry tools provide the observability needed to understand the health, performance, and behavior of the system. Telemetry involves the automated collection, transmission, and analysis of runtime data from applications, operating systems, and physical hardware. A robust observability strategy relies on four primary data sources:",
      type: "text"
    },
    {
      items: [
        {
          text: "Application Logs: Applications must emit structured logs capturing events, transaction boundaries, and errors. Operations tools collect, aggregate, and index logs from all running containers. Structured logging (typically using JSON formats) allows querying logs by attributes such as severity, timestamp, component name, user ID, or correlation ID. Correlation IDs are passed along requests across microservices, enabling engineers to trace the execution path of a single transaction and pinpoint where errors occurred."
        },
        {
          text: "Operating System Execution Traces: System telemetry tools collect execution traces from the host operating system. These traces capture low-level events, including kernel system calls, file system operations, context switches, page faults, and thread locking. OS execution traces are essential for diagnosing performance anomalies, such as thread contention, high I/O wait times, or memory access bottlenecks that cannot be resolved through application logging alone."
        },
        {
          text: "Server CPU and Memory Resource Utilization: Telemetry agents run on hosts and containers to monitor resource usage. They track metrics such as CPU usage (system and user CPU, throttle time), memory utilization (heap size, paging rate, swap space), disk storage capacity, read/write throughput, and network statistics. Monitoring resource utilization is critical for capacity planning, detecting memory leaks, identifying over-provisioned infrastructure, and diagnosing resource starvation."
        },
        {
          text: "Visualization Dashboards: To make telemetry data understandable, monitoring systems aggregate logs, traces, and resource metrics into dashboards. Dashboards display real-time graphs, charts, latency percentiles, and error heatmaps. These visualizations help operators detect trends, compare performance against baselines, and isolate anomalies. Monitoring tools evaluate these metrics against alerting rules (such as page load latency exceeding a threshold) to automatically notify on-call engineers of potential incidents."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. SWEBOK v4 Section 6.6 Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Were container runtimes and virtualization platforms selected to establish standard execution environments?"
        },
        {
          text: "Has a container orchestrator been configured to manage scheduling, networking, and service discovery across hosts?"
        },
        {
          text: "Are scaling policies defined in the orchestrator to dynamically adjust instances based on traffic load?"
        },
        {
          text: "Is deployment standardization enforced by packaging applications and configurations into immutable container images?"
        },
        {
          text: "Are deployment descriptor files version-controlled and reviewed to represent the desired state of infrastructure?"
        },
        {
          text: "Do deployment descriptor files define resource requests, resource limits, and network access policies for workloads?"
        },
        {
          text: "Are CI/CD pipelines utilized to automate the deployment process through development, staging, and production?"
        },
        {
          text: "Have health probes been configured in descriptor files to allow orchestrators to monitor container health?"
        },
        {
          text: "Are automated verification gates and smoke tests integrated into the pipeline to validate staging and production releases?"
        },
        {
          text: "Are rollback procedures automated in deployment tools to restore the stable state if a release fails health checks?"
        },
        {
          text: "Do automated testing tools continuously execute synthetic user journeys to verify critical workflows in production?"
        },
        {
          text: "Has a structured logging framework been configured to output application events, severity levels, and correlation IDs?"
        },
        {
          text: "Are application logs from all distributed instances aggregated and indexed in a central telemetry repository?"
        },
        {
          text: "Were system tracing and OS execution tracing tools configured on hosts to diagnose low-level resource issues?"
        },
        {
          text: "Are server CPU, memory, storage, and network utilization metrics continuously collected at regular intervals?"
        },
        {
          text: "Have dashboards been created to visualize key performance indicators, error rates, and resource utilization?"
        },
        {
          text: "Are automated alerting rules established with thresholds to notify operators of system degradation?"
        },
        {
          text: "Have fault-injection tools been evaluated to verify system self-healing and failover capabilities?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "container orchestrators, virtualization, deployment standardization, scalability, continuous integration, continuous delivery, CI/CD, descriptor files, automated testing, monitoring, telemetry, application logs, OS execution traces, CPU memory resource utilization, visualization dashboards",
  filename: "engineering-operations-tools",
  trigger: "model_decision"
});
