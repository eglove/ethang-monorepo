import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringOperationsPlanning = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Operations Planning",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 Operations Plan and Concept of Operations (CONOPS)",
      type: "header"
    },
    {
      text: "In the software engineering lifecycle, operations planning establishes the organizational and technical framework for deploying, managing, and maintaining software systems in production environments. Under the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6, Section 2, the Operations Plan and the Concept of Operations (CONOPS) serve as the primary guiding blueprints. CONOPS defines the system from a high-level operational perspective, describing how the software is utilized by end users, the distinct roles of operational staff, and the relationships between the software and its external ecosystem. It bridges business goals and the technical realities of software execution, ensuring operational feasibility. The Operations Plan details the specific processes, resources, schedules, and tools required to sustain the software post-release. This includes monitoring strategies, upgrade cycles, configuration control, incident response procedures, and operational readiness reviews. Together, these documents ensure that all operational stakeholders share a common understanding of system behavior, operational constraints, and service expectations.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Operations and Maintenance (O&M) Lifecycle Costs",
      type: "header"
    },
    {
      text: "A major portion of a software system's total cost of ownership is incurred during the Operations and Maintenance (O&M) phase. SWEBOK v4 emphasizes that O&M lifecycle costs must be planned, estimated, and managed with the same rigor as initial development. These costs are not limited to hosting fees; they encompass corrective maintenance (fixing defects), adaptive maintenance (updating the software to run on new hardware or operating systems), perfective maintenance (improving performance or maintainability), and preventive maintenance (addressing latent issues before they cause failures). Furthermore, operational costs include infrastructure consumption, license fees, developer operations tooling, monitoring services, and engineering personnel. By modeling O&M costs early, organizations can make informed architectural decisions. Choosing designs that minimize compute resources or simplify deployment can drastically reduce long-term operational expenditures (OpEx), preventing technical debt from translating into unsustainable operational costs.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Supplier Management and Cloud Providers",
      type: "header"
    },
    {
      text: "Modern software systems rely on external suppliers, including third-party vendors, open-source maintainers, and cloud service providers (IaaS/PaaS). Supplier management is a critical dimension of operations planning. SWEBOK v4 highlights the need for systematic evaluation, selection, and governance of these dependencies. When leveraging IaaS/PaaS, organizations delegate operational control to cloud providers, requiring clear contracts, service level expectations, and risk profiles. Teams must assess financial stability, security compliance, and service availability of suppliers. Furthermore, supplier management involves tracking software licenses, managing API deprecation schedules, and establishing mitigation plans for vendor lock-in. A robust supplier management plan ensures that changes in a supplier's pricing or software versions do not disrupt the availability or integrity of the host application, thereby protecting the software's operational continuity and shared responsibility models.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Development and Operational Environments Synchronization (IaC)",
      type: "header"
    },
    {
      text: "Deployment failures often stem from drift between development, testing, and operational environments. SWEBOK v4 Section 6.2 identifies environmental synchronization as a primary operational concern. Differences in configurations, platform versions, and dependencies lead to the 'works on my machine' issue. Modern software engineering addresses this via Infrastructure as Code (IaC), defining network topologies, server configurations, and environment variables in declarative, version-controlled files alongside application code. This ensures all environments are provisioned identically, enabling automated, repeatable deployments, simplifying debugging, and ensuring test runs reflect production behavior. Keeping environments synchronized requires strict discipline, forbidding manual config tweaks in production and requiring all environment changes to originate from code. Furthermore, tools for configuration drift detection should be utilized to audit environments continuously.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Software Availability, Continuity, and Service Levels (SLAs, SLIs, SLOs)",
      type: "header"
    },
    {
      text: "To measure and guarantee operational quality, organizations define metrics for availability and continuity. Service Level Agreements (SLAs) are formal contracts between service providers and customers specifying the expected level of service, including penalties for non-compliance. Within the engineering team, SLAs are supported by Service Level Objectives (SLOs), which are target reliability goals (such as uptime percentages), and Service Level Indicators (SLIs), which are the quantitative metrics used to measure compliance (such as latency or error rates). Continuity planning ensures the software functions during maintenance or unexpected disruptions. SWEBOK v4 notes that service levels must be defined during planning as they direct design. High availability requires redundancy, load balancing, and self-healing. Monitoring SLIs against SLOs helps teams identify degradation before SLAs are violated, allowing them to manage their reliability budgets effectively.",
      type: "text"
    },
    {
      level: 3,
      text: "1.6 Software Capacity Management",
      type: "header"
    },
    {
      text: "Software capacity management ensures infrastructure resources meet workload demands without wasting budget. SWEBOK v4 outlines that capacity management involves sizing exercises, workload estimation, and annual plans. Engineers analyze performance under load to determine CPU, memory, storage, and bandwidth needs. Sizing must account for normal baselines and peak usage spikes, using queueing theory and performance profiling. Workload estimation models how user growth affects resource consumption. An effective plan balances under-provisioning (outages) and over-provisioning (wasted costs). Modern systems leverage auto-scaling to adjust capacity dynamically, but static annual plans remain essential for budgeting, reserving capacity, and planning long-term infrastructure changes.",
      type: "text"
    },
    {
      level: 3,
      text: "1.7 Software Backup, Disaster Recovery, and Failover",
      type: "header"
    },
    {
      text: "Backup and disaster recovery planning safeguard against catastrophic failures. Software backups involve regularly capturing stateful database snapshots, configuration files, and application binaries to secure storage locations. Disaster Recovery (DR) plans define the strategies, personnel roles, and technical procedures required to restore systems to a functional state after a disruption. DR planning is guided by two critical metrics: the Recovery Point Objective (RPO), which is the maximum tolerable data loss window, and the Recovery Time Objective (RTO), which is the maximum tolerable downtime. Failover logic defines the automated or manual transition of services to redundant, geographically isolated secondary systems when the primary system fails. Engineers must design and validate failover mechanisms, such as active-active or active-passive topologies, to operate predictably under stress. Regular DR drills are mandatory to verify backup integrity, point-in-time recovery, failover paths, and RTO/RPO targets.",
      type: "text"
    },
    {
      level: 3,
      text: "1.8 Software and Data Safety, Security, and Integrity (DevSecOps)",
      type: "header"
    },
    {
      text: "Ensuring the safety, security, and integrity of software and its associated data is a continuous operational responsibility. SWEBOK v4 calls for the tight integration of security controls throughout the operational lifecycle, a practice formalized in modern DevSecOps. Security planning involves threat modeling, automated vulnerability scanning, and secure access controls such as the principle of least privilege. Data safety and integrity require protecting data both at rest and in transit using strong encryption, cryptographic hashing, and access auditing. In the operational phase, continuous security monitoring detects anomalies, unauthorized access attempts, and potential breaches. DevSecOps integrates these checks directly into the automated deployment pipelines, ensuring that every code change and infrastructure update is scanned for vulnerability and dependency issues before release. Furthermore, operations teams must establish detailed incident response plans to contain, analyze, and recover from security incidents, ensuring compliance with industry standards and data protection laws.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Agent Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Operations Plan and CONOPS Definition**: Has a Concept of Operations (CONOPS) been established to define user roles and operational scenarios, accompanied by a detailed Operations Plan outlining maintenance processes?"
        },
        {
          text: "**O&M Lifecycle Cost Estimation**: Were long-term operations and maintenance (O&M) lifecycle costs estimated during design, including hosting, corrective, adaptive, perfective, and preventive maintenance?"
        },
        {
          text: "**Supplier and Cloud Governance**: Has a supplier management strategy been documented to govern third-party components, open-source dependencies, and cloud providers (IaaS/PaaS) including lock-in risk assessment?"
        },
        {
          text: "**Environment Synchronization and IaC**: Are development, testing, staging, and operational environments synchronized using version-controlled Infrastructure as Code (IaC) to prevent configuration drift?"
        },
        {
          text: "**Service Level Definition (SLA, SLO, SLI)**: Have Service Level Agreements (SLAs), Service Level Objectives (SLOs), and Service Level Indicators (SLIs) been defined, and is monitoring implemented to track compliance?"
        },
        {
          text: "**Capacity Management Planning**: Was a capacity management plan compiled, incorporating sizing exercises, workload estimation, resource utilization benchmarks, and annual infrastructure plans?"
        },
        {
          text: "**Backup, Recovery, and Failover Validation**: Are regular software and data backups automated, and have the disaster recovery (DR) plans, failover logic, and RTO/RPO targets been validated through drills?"
        },
        {
          text: "**Safety and Security Controls Integration**: Has a DevSecOps approach been adopted, integrating security scanning, threat modeling, vulnerability assessments, and data integrity checks into the deployment pipeline?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "engineering operations planning, conops, software availability, disaster recovery, capacity management, supplier management, environments synchronization, slas, slis, slos, devsecops",
  filename: "engineering-operations-planning",
  trigger: "model_decision"
});
