import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringOperationsDelivery = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Operations Delivery",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Operational software engineering represents the disciplined synthesis of software development activities and system runtime management. According to the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6 (Software Engineering Operations) and Chapter 8 (Software Engineering Process), operations delivery acts as the final gate between code construction and value realization in production environments. This domain is governed by the principles of high-reliability organization theory, system safety engineering, and queuing theory. These disciplines prioritize throughput, stability, and fast feedback loops, ensuring that systems run reliably under varying workloads.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Operational Testing, Verification, and Acceptance",
      type: "header"
    },
    {
      text: "Operational testing is the validation phase where a software system is evaluated in a production-like or actual production environment to ensure it satisfies operational requirements. Unlike unit or integration testing, which verify correct functional logic, operational testing verifies non-functional attributes including performance stability, scalability under load, security posture, and failover capabilities.\nWithin this framework, Test-Driven Development (TDD) and Acceptance Test-Driven Development (ATDD) expand into the operational domain. While traditional TDD guides code design, operational TDD utilizes automated validation harnesses to verify environment conditions, database connection pools, network paths, and cloud resources before traffic routing. ATDD principles translate into automated operational acceptance tests, which formalize business and operational expectations. These acceptance checks verify that third-party integrations, external database instances, and content delivery networks respond within defined service level objectives (SLOs) before a release is finalized.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Deployment and Release Engineering",
      type: "header"
    },
    {
      text: "Deployment and release engineering are distinct yet closely related disciplines within the delivery pipeline. Deployment is the technical process of installing, configuring, and executing an application version across server nodes. Release engineering is the business and risk governance process of making those deployed capabilities active for end users.\nModern release engineering relies on artifact packaging, environment configuration management, and smoke testing:",
      type: "text"
    },
    {
      items: [
        {
          text: "Artifact Packaging: Software must be built into immutable packages (such as container images, archive bundles, or compiled modules) that are versioned and signed. This ensures that the exact code verified in staging is deployed to production."
        },
        {
          text: "Configuration Management: Environmental configurations (connection strings, external URLs, API tokens) must be decoupled from the code packages and injected dynamically at runtime, preventing configuration-drift issues across staging and production."
        },
        {
          text: "Smoke Testing: Immediately post-deployment, automated non-destructive verification scripts run against the live system. These smoke tests check critical pathways (e.g. database read/write readiness, essential service availability) to confirm that the environment is healthy before routing user traffic."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Rollback and Data Migration Governance",
      type: "header"
    },
    {
      text: "Deployments frequently encounter failures due to environmental mismatches, configuration errors, or latent software defects. Rollback engineering is the strategic plan for returning a system to a known good state. This requires planned and rehearsed rollback procedures to minimize mean time to recovery (MTTR).\nA major challenge in rollback engineering is data migration governance. When a database schema change accompanies a release, reverting the code without managing the data schema can lead to database corruption or data loss. High-stability architectures implement forward and backward-compatible data migrations using the expand-contract pattern. This pattern performs schema updates in phases, adding new database structures side-by-side with old ones to support concurrent execution of both application versions before deprecating obsolete schemas. In the event of a deployment failure, the database restoration protocol must support point-in-time recovery (PITR) or active-passive switchovers. Rehearsing these recovery paths in staging environments is required to guarantee that data integrity is maintained when a rollback is executed.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Change Management and Risk Assessment",
      type: "header"
    },
    {
      text: "Change management is the organizational process designed to control modifications to production systems. The primary goal is to minimize service disruptions while facilitating rapid product delivery. Change governance requires rigorous risk assessments that evaluate the potential impact, complexity, and blast radius of each modification.\nRather than batching numerous modifications into infrequent, high-risk releases, modern operations delivery promotes the continuous delivery of small units of change on demand. This approach reduces the complexity of each deployment, making rollback paths simpler and lessening the cognitive load required to verify changes. Risk assessment frameworks evaluate changes based on historical deployment failure rates, code churn metrics, and the sensitivity of affected subsystems, routing high-risk modifications through additional human-agent review checkpoints.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Problem Management and Root Cause Analysis",
      type: "header"
    },
    {
      text: "Problem management is the process of identifying, analyzing, and resolving the underlying causes of incidents in production systems. While incident management focuses on immediate service restoration, problem management seeks to prevent the reoccurrence of incidents.\nEffective problem management relies on monitoring, logging, and profiling systems:",
      type: "text"
    },
    {
      items: [
        {
          text: "Monitoring and Logging: Continuous telemetry streams capture system performance metrics (CPU, memory, latency) and audit trails, providing the data needed to detect anomalies."
        },
        {
          text: "Profiling: Profiling tools capture stack traces and memory allocation during runtime anomalies to identify performance bottlenecks."
        },
        {
          text: "Root Cause Analysis (RCA): When a failure occurs, a multidisciplinary team investigates the contributing factors. RCAs should focus on systemic issues (e.g., process gaps, tooling failures, or environmental drift) to improve long-term resilience."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Conceptual Engineering Guidelines",
      type: "header"
    },
    {
      text: "Operational excellence requires that systems be designed for deployability, observability, and recoverability. These guidelines highlight the conceptual principles that govern delivery:",
      type: "text"
    },
    {
      items: [
        {
          text: "Configuration Isolation: All credentials, connection details, and variable tokens must be stored in external configuration engines, ensuring that code artifacts remain environment-agnostic."
        },
        {
          text: "Deployment Sandbox Partitioning: To verify new versions safely, deployments should target isolated network partitions or canary environments where initial smoke testing can run without exposing live user traffic to unverified code."
        },
        {
          text: "Schema Migration Versioning: Database schemas must be modified using a multi-phase transition pattern. Schema changes must be applied in a way that allows older application instances to continue writing to the database, ensuring zero-downtime rollbacks are always possible."
        },
        {
          text: "Controlled Change Isolation: All modifications to infrastructure, application configurations, or business logic must go through automated delivery pipelines, ensuring that every deployment is tracked and reproducible."
        },
        {
          text: "Multidisciplinary Problem Analysis: Diagnostic investigations must bring together software constructors, systems engineers, and quality assurance personnel to analyze data from logs, telemetry, and profiling tools."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "3. Operations Delivery Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Has the deployment package been built into an immutable, versioned artifact that cannot be modified post-compilation?"
        },
        {
          text: "Are all environment-specific configurations decoupled from the code and injected dynamically at runtime?"
        },
        {
          text: "Has a formal risk assessment been performed to evaluate the blast radius and complexity of the delivery package?"
        },
        {
          text: "Is there an automated smoke test suite configured to execute immediately post-release to verify critical system health?"
        },
        {
          text: "Has the rollback procedure for both application binaries and configuration settings been documented and rehearsed in staging?"
        },
        {
          text: "Do database migrations follow a multi-phase pattern to ensure backward compatibility with the previous application version?"
        },
        {
          text: "Are point-in-time recovery (PITR) backups active and verified to support database restoration in the event of migration failures?"
        },
        {
          text: "Have operational acceptance criteria been established and verified in a staging environment prior to production scheduling?"
        },
        {
          text: "Is the delivery package structured as a small unit of change to minimize deployment risk and simplify troubleshooting?"
        },
        {
          text: "Are monitoring and logging hooks active across the application to capture system performance and runtime metrics?"
        },
        {
          text: "Has a blameless root cause analysis process been defined to investigate incidents and establish systemic corrections?"
        },
        {
          text: "Are profiling tools available to capture stack traces and memory allocation during performance degradation incidents?"
        },
        {
          text: "Has the deployment pipeline been configured to require automated static checks and unit testing before release authorization?"
        },
        {
          text: "Are API endpoints versioned or designed to be backward-compatible to prevent breaking client integrations during release?"
        },
        {
          text: "Has the team confirmed that all external dependencies are pinned to specific versions to prevent unvetted dependency updates?"
        },
        {
          text: "Are canary or blue-green routing configurations defined to enable gradual user traffic exposure for new releases?"
        },
        {
          text: "Have alert thresholds been set on key system metrics to notify the operational team of anomalies post-deployment?"
        },
        {
          text: "Is there a process to audit configuration-drift in staging and production to maintain environment parity?"
        },
        {
          text: "Has load testing been conducted on staging systems to establish baseline limits for CPU and memory usage?"
        },
        {
          text: "Are third-party APIs monitored continuously to verify that integration latency remains within defined limits?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "SWEBOK v4 Section 6.3: Software Engineering Operations Delivery, covering operational testing, deployment, release engineering, rollback, data migration, change management, and problem management.",
  filename: "engineering-operations-delivery",
  trigger: "model_decision"
});
