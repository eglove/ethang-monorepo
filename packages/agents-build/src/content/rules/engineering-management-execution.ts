import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringManagementExecution = defineRule({
  content: [
    {
      level: 1,
      text: "Engineering Management Execution",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software project execution, or project enactment, represents the operational phase within the software engineering management lifecycle where planned models, architectures, and processes are implemented. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 9 (Software Engineering Management), execution is the disciplined instantiation of the processes, methods, and procedures embodied in the project plan. The primary focus during execution is strict adherence to the selected Software Development Life Cycle (SDLC) processes, with the guiding expectation that process discipline is the most reliable mechanism to satisfy stakeholder requirements and achieve project objectives. Project enactment requires active management across three concurrent dimensions: monitoring, controlling, and reporting.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Implementation of Plans",
      type: "header"
    },
    {
      text: "The implementation of plans demands that all engineering activities follow the project plan and its supporting plans (including quality assurance, configuration management, risk management, and measurement plans). Project activities consume key organizational resources, categorized as personnel (skills, effort, and cognitive capacity of the team), technology (development environments, compilers, static analyzers, and test runners), and funding (infrastructure and tooling). The consumption of these resources generates concrete, high-value work products, including software designs, source code, and comprehensive software test cases. Adhering to the plans prevents scope creep, ensures resource efficiency, and establishes a clear path of execution.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Software Acquisition and Supplier Contract Management",
      type: "header"
    },
    {
      text: "In modern software engineering, software is rarely developed entirely from scratch. Software acquisition and supplier contract management have become core aspects of project execution. Software acquisition refers to the process of obtaining software components, libraries, services, or complete systems from external entities. While modern package managers simplify the acquisition of third-party libraries, they also introduce significant supply chain risks and expand the attack surface of applications. Unrestricted and un-audited inclusion of external libraries exposes projects to dependency confusion, typosquatting, and malicious code injections. To mitigate these risks, organizations must implement technical and procedural controls, such as locked dependency files, private package repositories, automated security vulnerability scanners, software review boards, and licensing audits.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Classes of Software Acquisition and COTS Integration",
      type: "header"
    },
    {
      text: "SWEBOK v4 defines several software acquisition classes:",
      type: "text"
    },
    {
      items: [
        {
          text: '**Commercial Off-The-Shelf (COTS)**: Existing products acquired "as is" under commercial license terms, offering rapid deployment but limited customization.'
        },
        {
          text: "**Custom Developed Software**: Software built specifically for the organization, which may customize COTS products."
        },
        {
          text: "**Open Source Software**: Nominally free software requiring license reviews (permissive vs. restrictive copyleft) to identify usage restrictions."
        },
        {
          text: "**Customer Loaned Software**: Software provided by the customer for simulation or integration testing."
        },
        {
          text: "**Software as a Service (SaaS)**: Rented cloud-hosted applications or environments (e.g., hosting, version control)."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Regardless of the acquisition class, validation and verification activities must be performed: verifying that each component is complete, correct, and consistent with the architectural design; integrating the components; verifying that the integrated components are complete and correct; and validating that the integrated system satisfies its intended purpose in the target operating environment.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Contractual Structures, Risk Allocation, and Quality Requirements",
      type: "header"
    },
    {
      text: "Supplier management requires appropriate contract types:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Fixed-Price Contracts**: Suitable when requirements are stable, transferring risk to the supplier."
        },
        {
          text: "**Time-and-Materials (T&M) Contracts**: Buyer pays based on actual hours and material costs, preferred when scope is fluid."
        },
        {
          text: "**Cost Plus Fixed Fee Contracts**: Reimburses actual costs plus a fixed fee, useful for high-risk research projects."
        },
        {
          text: "**Cost-Plus Incentive Fee Contracts**: Reimburses costs and pays a fee that varies based on supplier performance against targets."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Supplier agreements must specify the scope of work, deliverables, penalty clauses for late or non-delivery, intellectual property (IP) rights, and explicit software quality requirements. Data set acquisition is also critical in many agreements, involving the licensing, provisioning, custom extraction, or integration of external datasets.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Implementation of the Measurement Process",
      type: "header"
    },
    {
      text: "Data-driven project management requires the systematic implementation of the measurement process during execution. This process ensures that relevant, objective, and useful data is collected. Measurement data provides quantitative visibility into the project's health and progress. Key metrics include product size (lines of code, function points), quality (defect density, test coverage), effort (personnel hours worked), and schedule (milestone completion rates). Collecting these metrics at regular intervals builds a historical baseline that enables accurate project tracking, informs future estimation, and provides the quantitative foundation for statistical analysis and variance calculation.",
      type: "text"
    },
    {
      level: 3,
      text: "1.6 The Project Monitoring Process and Variance Analysis",
      type: "header"
    },
    {
      text: "Project monitoring continuously assesses progress against plans regarding scope, schedule, budget, and quality:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Task Evaluation**: Evaluating outputs and completion criteria for individual tasks."
        },
        {
          text: "**Deliverable Inspection**: Assessing deliverables through inspections or functional demonstrations."
        },
        {
          text: "**Resource Analysis**: Analyzing effort expenditure, schedule adherence, resource use, and costs to date."
        },
        {
          text: "**Risk Re-evaluation**: Regularly updating risk profiles and recalculating exposure."
        },
        {
          text: "**Variance Analysis**: Identifying deviations between actual and expected values (e.g., cost overruns, schedule slippage, defect rates)."
        },
        {
          text: "**Outlier Identification**: Locating anomalies in quality and measurement data."
        },
        {
          text: "**Reporting Thresholds**: Reporting outcomes when variance thresholds are exceeded."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 The Project Control Process and Configuration Control",
      type: "header"
    },
    {
      text: "The control process uses the insights gained from monitoring to make decisions and direct corrective actions. When variance analysis indicates that project performance deviates significantly from the plans, management must intervene to steer the project back on track. Corrective actions may include reallocating resources, adjusting schedules, or retesting software components to address quality regressions. In cases of requirements uncertainty, management may incorporate prototyping as an additional action to validate requirements with stakeholders. When deviations cannot be resolved through minor corrections, the control process may require revising the project plan, software requirements specification, or, in extreme circumstances, abandoning the project entirely. Throughout all control activities, the software team must adhere strictly to configuration control and configuration management procedures, ensuring that all changes to code, designs, or specifications are formally requested, reviewed, approved, and documented.",
      type: "text"
    },
    {
      level: 3,
      text: "1.8 Reporting and Communication of Project Status",
      type: "header"
    },
    {
      text: "Progress reporting is the communication channel that keeps internal and external stakeholders informed of project status. Reports must be delivered at specified and agreed-upon intervals, such as weekly status updates or monthly milestone reviews. The content of these reports must be tailored to the information needs of the target audience. High-level stakeholders, such as steering committees, clients, or executive sponsors, require summaries of milestone achievements, budget status, high-level risks, and major variances rather than the low-level, detailed task tracking used by the development team. Tailored reporting ensures transparent communication and facilitates timely decision-making at all levels of the organization.",
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
          text: "Does the software project execution strictly follow the established SDLC processes and baseline plans?"
        },
        {
          text: "Are all project activities utilizing authorized personnel, technology, and funding resources as defined in the resource allocation plan?"
        },
        {
          text: "Are all generated work products (designs, code, test cases) verified against their parent requirements and architectural specifications?"
        },
        {
          text: "Is there a technical control mechanism (e.g., lockfiles, private registry) implemented to scan and approve acquired third-party package libraries before integration?"
        },
        {
          text: "Has the risk profile of each acquired commercial off-the-shelf (COTS) component been evaluated for security, legality, and license compliance?"
        },
        {
          text: "Has a formal license review been conducted for all open-source software components to identify and mitigate copyleft or usage restrictions?"
        },
        {
          text: "Are customer-loaned software components protected, simulated, and integrated according to safety and security specifications?"
        },
        {
          text: "Are all integrated software components validated for operational correctness and completeness within the target environment?"
        },
        {
          text: "Do supplier agreements explicitly define the scope of work, quality requirements, delivery schedule, and intellectual property ownership?"
        },
        {
          text: "Is data set acquisition (licensing, integration, provisioning) governed by formal agreements and verified for correctness?"
        },
        {
          text: "Has the measurement process been successfully enacted to collect quantitative metrics on size, effort, schedule, and quality?"
        },
        {
          text: "Is the project monitoring process conducted at predetermined intervals to assess scope, schedule, and cost performance?"
        },
        {
          text: "Is variance analysis performed on the collected metrics to detect schedule slippage, cost overruns, or defect density spikes?"
        },
        {
          text: "Are corrective actions (such as component retesting or resource shifting) triggered when variance thresholds are exceeded?"
        },
        {
          text: "Is prototyping utilized when requirements validation is needed to address stakeholder feedback?"
        },
        {
          text: "Are all project changes, document revisions, and control decisions formally managed under configuration control?"
        },
        {
          text: "Are control decisions (including potential project abandonment) documented and communicated to all relevant stakeholders?"
        },
        {
          text: "Do project progress reports focus on the specific information needs of the target audience rather than internal team details?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software project execution, plan implementation, process monitoring, and acquisition management",
  filename: "engineering-management-execution",
  trigger: "model_decision"
});
