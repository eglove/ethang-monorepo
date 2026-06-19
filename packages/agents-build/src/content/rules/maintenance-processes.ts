import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const maintenanceProcesses = defineRule({
  content: [
    {
      level: 1,
      text: "Software Maintenance Processes",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software maintenance processes provide the structured framework necessary to manage, execute, and verify changes to operational software systems. As defined in SWEBOK v4 Chapter 7, Section 3 and the international standard ISO/IEC/IEEE 14764, a mature maintenance process coordinates the lifecycle of modification requests (MRs) and problem reports (PRs) from ingestion to release. The process begins with transition—the controlled transfer of the software system from development to operations—and continues through request validation, impact assessment, execution, configuration management, and software quality assurance. To ensure operational stability, maintenance must be guided by organizational business plans, service-level agreements (SLAs), strict configuration control boards, and rigorous quality audits.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 SWEBOK and ISO/IEC/IEEE 14764 Maintenance Processes",
      type: "header"
    },
    {
      text: "The standard maintenance process defined by ISO/IEC/IEEE 14764 involves a sequential flow of activities designed to preserve system integrity:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Transition**: This is a controlled, coordinated phase where the software, test suites, and documentation are transferred from the development organization to the maintenance team. Proper transition ensures that the maintainer is equipped to support the system."
        },
        {
          text: "**Ingestion and Help Desk**: Modification requests (MRs) and problem reports (PRs) are logged via a coordinated help desk function."
        },
        {
          text: "**Validation and Costing**: Maintainers analyze each request to determine its validity, feasibility, size, and complexity. Requests that exceed agreed boundaries or introduce unacceptable risk may be rejected or redirected to a separate development project."
        },
        {
          text: "**Implementation and Review**: Approved changes are implemented, tested, and reviewed before release."
        },
        {
          text: "**Unique Process Activities**: Maintenance introduces activities not found in standard development, such as program understanding (comprehending existing logic) and request gating (deciding whether a request is within scope or should be deferred)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Planning Activities",
      type: "header"
    },
    {
      text: "Planning is critical for aligning maintenance activities with resources and stakeholder expectations:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Business Planning (Organizational Level)**: This involves budgeting, resource allocation, and policy definition. Organizations must forecast maintenance workloads and establish funding mechanisms for long-term support."
        },
        {
          text: "**Maintenance Planning (Transition Level)**: This planning defines the specific support environment, transition schedules, training requirements, and release cycles for a given software product."
        },
        {
          text: "**Service-Level Agreements (SLAs)**: Contractual agreements that define the required quality of service, response times, and system availability. Maintainers monitor Service Level Indicators (SLIs) and Service Level Objectives (SLOs) to verify compliance."
        },
        {
          text: "**Resource Forecasting**: Establishing human resource requirements, support infrastructure (such as databases and call centers), and software licenses needed to maintain the software."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Configuration Management in Maintenance",
      type: "header"
    },
    {
      text: "Configuration management (SCM) is the bedrock of software maintenance:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Change Control**: All modifications must be authorized by a Change Control Board (CCB) or equivalent governance body. This prevents unauthorized changes and ensures that all stakeholders understand the impact of a release."
        },
        {
          text: "**Version Control and Release Tracking**: Maintainers use version control systems to branch code, manage concurrent changes, and tag releases. Build and configuration metadata must be preserved to allow reproduction of past states."
        },
        {
          text: "**Traceability**: SCM processes must maintain traceability between requirements, modification requests, modified source files, and verification test cases."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Software Quality and Audits",
      type: "header"
    },
    {
      text: "Software Quality Assurance (SQA) in maintenance ensures that modifications do not degrade system quality:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Reviews and Walkthroughs**: Code modifications and updated documentation must undergo peer reviews to identify defects and verify compliance with standards."
        },
        {
          text: "**Security and Vulnerability Assessments**: Maintenance processes must include regular vulnerability scanning and security audits, particularly when updating third-party libraries or infrastructure."
        },
        {
          text: "**Customer Satisfaction Monitoring**: SQA processes actively monitor user feedback and incident metrics to evaluate the effectiveness of the maintenance service."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Emergency Modification Handling",
      type: "header"
    },
    {
      text: "When critical production incidents occur, the maintenance process must accommodate emergency modifications (hotfixes) while protecting system integrity:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Fast-Track Routing**: Establishing a shortened validation and approval path to authorize immediate patches."
        },
        {
          text: "**Safety Nets**: Requiring at least a basic set of automated regression tests and peer reviews before hotfixes are deployed."
        },
        {
          text: "**Post-Hotfix Retrospectives**: Following up emergency deployments with a full impact analysis, updated documentation, and permanent code fixes if the hotfix was a temporary workaround."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Software Configuration Auditing",
      type: "header"
    },
    {
      text: "Configuration auditing verifies that the operational system matches the documented baseline:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Functional Configuration Audit (FCA)**: Verifying that all modifications have been completed and tested, and that the system performs as specified."
        },
        {
          text: "**Physical Configuration Audit (PCA)**: Verifying that the correct versions of all software elements, configuration files, and documentation are present in the release package."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Detailed Ingestion and Request Lifecycle",
      type: "header"
    },
    {
      text: "The life of a modification request follows a strict pathway to prevent unauthorized code changes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Receipt and Registration**: The help desk records the request with metadata including submitter, description, date, and related modules."
        },
        {
          text: "**Initial Classification**: Categorizing the input into bug reports (corrective), environment changes (adaptive), optimizations (perfective), or refactoring (preventive)."
        },
        {
          text: "**Technical Analysis**: Analyzing the request feasibility, tracing its impact on modules, and estimating implementation effort."
        },
        {
          text: "**Gating Decisions**: The Change Control Board evaluates the analysis against current resource limits, deciding to approve, reject, defer, or route the request to a separate development project."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Service-Level Agreement Management",
      type: "header"
    },
    {
      text: "SLA monitoring ensures that the maintenance organization meets contractual support quality targets:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Metric Definitions**: Standard parameters include Mean Time to Detect (MTTD), Mean Time to Repair (MTTR), and SLA compliance rates."
        },
        {
          text: "**SLIs and SLOs**: Establishing Service Level Indicators (like query response latency) and mapping them to Service Level Objectives (99% of queries under 200ms)."
        },
        {
          text: "**Audit Reports**: Periodically publishing performance metrics to stakeholders to review process effectiveness."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.9 Governance, Compliance, and Maturity Models",
      type: "header"
    },
    {
      text: "Sraw process quality requires aligning with mature development models and regulatory guidelines:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Maturity Models**: Utilizing frameworks like the Software Maintenance Maturity Model (S3M) or April-Abran model to benchmark maintenance processes and structure incremental improvements."
        },
        {
          text: "**Regulatory Auditing**: Ensuring that changes comply with industry standards (e.g., ISO/IEC 12207, ISO/IEC 14764) and organizational governance policies."
        },
        {
          text: "**Escalation Paths**: Defining clear hierarchical pathways for resolving disputes or routing extremely high-effort modification requests back to development."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.10 Pre-Transition Audit and Verification",
      type: "header"
    },
    {
      text: "Before the transition phase completes, the maintenance team must conduct a pre-transition verification audit. This involves:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Documentation Verification**: Confirming that user manuals, system administration guides, configuration files, and database schemas are accurate and up-to-date."
        },
        {
          text: "**Test Baseline Audit**: Verifying that the development regression test suites execute successfully in the target support environment."
        },
        {
          text: "**License Integrity Check**: Confirming that all third-party software, database engines, and SaaS licenses are active and transferred."
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
          text: "Was a formal transition plan executed to transfer the software, tests, and documentation from the developers to the maintainers?"
        },
        {
          text: "Are all modification requests (MRs) and problem reports (PRs) logged, tracked, and validated via a central help desk function?"
        },
        {
          text: "Has each modification request been evaluated for size, complexity, and risk, with formal criteria for acceptance or rejection?"
        },
        {
          text: "Were business planning budgets and resource allocations established at the organizational level to fund long-term maintenance?"
        },
        {
          text: "Did the maintenance plan define the transition schedule, training requirements, and release cycles for the software product?"
        },
        {
          text: "Are SLAs, SLOs, and SLIs monitored continuously to verify compliance with contractual service agreements?"
        },
        {
          text: "Are all software changes approved and tracked by a formal change control board or designated authority?"
        },
        {
          text: "Were version control branching strategies and release tags used to manage and track concurrent modifications?"
        },
        {
          text: "Has traceability been maintained between the modification request, the affected source files, and the validating test cases?"
        },
        {
          text: "Did all code modifications undergo peer reviews or walkthroughs before integration into the release branch?"
        },
        {
          text: "Were vulnerability assessments and security audits performed on the system during the release cycle?"
        },
        {
          text: "Has customer satisfaction been monitored through user feedback loops and incident response time metrics?"
        },
        {
          text: "Did the maintenance team conduct regular software configuration audits to verify that the operational baseline matches design documentation?"
        },
        {
          text: "Are emergency modifications (hotfixes) subject to a fast-track review process followed by retrospective analysis and full regression testing?"
        },
        {
          text: "Were maintenance processes tailored and documented to meet the specific size and technology constraints of the software product?"
        },
        {
          text: "Did the team conduct Functional Configuration Audits (FCA) to confirm that all approved change requests were fully implemented?"
        },
        {
          text: "Was a Physical Configuration Audit (PCA) performed to verify the exact build components and versions in the release baseline?"
        },
        {
          text: "Did the team log and track help desk metrics (MTTD, MTTR) to measure SLA compliance?"
        },
        {
          text: "Were processes assessed using maintenance maturity models (like S3M) to establish continuous improvement plans?"
        },
        {
          text: "Were pre-transition documentation, test baselines, and third-party software licenses validated and signed off before support handover?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software maintenance processes, standards, iso iec ieee 14764, transition, modification request, problem report, validation, acceptance, rejection, help desk, planning activities, configuration management, software quality, sqa, audits, reviews",
  filename: "maintenance-processes",
  trigger: "model_decision"
});
