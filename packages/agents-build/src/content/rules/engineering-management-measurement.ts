import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringManagementMeasurement = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Measurement and Management Tools",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering measurement is a vital discipline in software engineering management, providing the quantitative basis for objective decision-making, process improvement, and product quality assurance. As defined in SWEBOK v4 Chapter 9, measurement is a cornerstone of organizational maturity. Rather than relying on subjective assessments, it establishes a structured, repeatable, and verifiable process to characterize, evaluate, predict, and control projects, processes, and work products. The measurement process is guided by the ISO/IEC/IEEE 15939 standard, which defines the activities to implement a software measurement process. This standard is further elaborated in the Practical Software Measurement (PSM) framework, which outlines continuous, iterative approaches for aligning measurement with business objectives, risks, and technical requirements across SDLC models. Through systematic measurement, organizations gain visibility into project status, identify bottlenecks, manage risks proactively, and ensure the delivery of high-quality software systems.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Establishing and Sustaining Measurement Commitment",
      type: "header"
    },
    {
      text: "A successful measurement program requires a formal and sustained commitment from management and stakeholders. According to ISO/IEC/IEEE 15939, this begins with establishing clear measurement requirements guided by business objectives (e.g., reducing time-to-market, improving reliability, or minimizing costs) to ensure the program delivers tangible value.",
      type: "text"
    },
    {
      text: "The scope of measurement must be explicitly defined, specifying the organizational unit (functional area, project, site, or entire enterprise) to which activities apply. The temporal scope must also be considered. Capturing time-series data over multiple project lifecycles is critical for calibrating effort, schedule, and cost estimation models, providing the historical baseline necessary for statistical forecasting.",
      type: "text"
    },
    {
      text: "Sustaining this commitment requires formal communication and resource allocation. The organization must assign responsibility to specialized roles, such as the measurement analyst (who designs measures and analyzes data) and the measurement librarian (who manages storage and security of measurement data). Funding, training, tools, and ongoing support must be committed to conduct the measurement process effectively without disrupting development.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Planning the Measurement Process",
      type: "header"
    },
    {
      text: "Planning translates measurement goals into operational procedures. The process starts with characterizing the organizational unit to define the context. This characterization documents the unit's processes, domains, technology stacks, interfaces, structure, and constraints.",
      type: "text"
    },
    {
      text: "The next step is identifying information needs representing the questions, risks, or problems stakeholders must address. These needs are derived from business goals, product requirements, regulatory compliance, or constraints, and must be prioritized, documented, and reviewed.",
      type: "text"
    },
    {
      text: "Engineers select measures directly linked to prioritized information needs. Selection criteria include need priorities, collection cost, process disruption, ease of obtaining accurate data, and ease of analysis. While external quality characteristics are often specified in contracts, measuring internal characteristics (complexity, coupling, coverage) is critical as an early indicator of potential external issues.",
      type: "text"
    },
    {
      text: "Planning also defines data collection, analysis, and reporting procedures. These specify collection frequencies, storage, verification gates, analysis methods, reporting schedules, and configuration management. Stakeholders must establish evaluation criteria to ensure information products (reports and dashboards) are accurate and actionable.",
      type: "text"
    },
    {
      text: "Finally, stakeholders must review and approve the measurement plan, including procedures, schedules, and responsibilities. Review criteria established at the organizational unit level or higher should consider experience, resource availability, and potential disruptions. Formal approval demonstrates commitment to the process.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Performing the Measurement Process",
      type: "header"
    },
    {
      text: "Performing the measurement process involves executing the defined plan and integrating activities into the software engineering workflow. To ensure data quality and minimize overhead, data collection should be integrated directly into existing processes. This may require modifying processes to automatically capture data, while balancing employee morale and human factors. Training must be provided to data providers to ensure they understand the procedures.",
      type: "text"
    },
    {
      text: "Data collection is followed by verification and secure storage. Modern projects leverage automated Software Engineering Management (SEM) tools to collect, aggregate, and transform data. The analysis uses statistical methods to generate information products (such as trend charts, probability curves, or numeric indicators) designed to directly answer the stakeholders' original information needs.",
      type: "text"
    },
    {
      text: "Analysis results are reviewed through process gates. Both data providers and measurement users should participate in these reviews to verify that the findings are accurate and contextually valid. Once verified, information products are documented and communicated to stakeholders to guide corrective actions and process improvements.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Evaluating the Measurement Program and Products",
      type: "header"
    },
    {
      text: "Continuous improvement of the measurement program is necessary to maintain its relevance and effectiveness. Under ISO/IEC/IEEE 15939, the process and its information products must be periodically evaluated against specified criteria. This evaluation is conducted via internal reviews or external audits, actively soliciting feedback from measurement users.",
      type: "text"
    },
    {
      text: "Lessons learned—including data collection issues, analysis errors, or communication failures—must be recorded in an organizational database. Based on these evaluations, engineers identify potential improvements, such as modifying indicators, adjusting units, or reclassifying categories. Before implementing changes, a cost-benefit analysis must show that improvements justify the resource requirements. Proposed changes must be submitted to the process owner and stakeholders for review and formal approval.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Software Engineering Management (SEM) Tools",
      type: "header"
    },
    {
      text: "Software Engineering Management (SEM) tools provide visibility, control, and structure to management processes. The industry trend favors integrated tool suites supporting planning, data collection, monitoring, control, and reporting throughout the lifecycle. These tools are categorized into four primary domains:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Project Planning and Tracking**: Used to estimate effort, cost, and schedules. Automated scheduling tools analyze Work Breakdown Structure (WBS) tasks, task durations, precedence relationships, and resource assignments to produce Gantt charts. Tracking tools monitor milestones, iteration cycles, and action items."
        },
        {
          text: "**Risk Management**: Support risk identification, analysis, and monitoring. These tools utilize decision trees or simulation models to evaluate cost-payoff tradeoffs. Monte Carlo simulation tools produce probability distributions of effort, schedule, and risk by combining multiple input distributions."
        },
        {
          text: "**Communication**: Facilitate consistent information distribution to stakeholders. Examples include automated notifications, meeting minutes repositories, and dashboards showing progress, backlogs, and maintenance request resolutions."
        },
        {
          text: "**Measurement**: Support gathering, analyzing, and reporting measurement data. Because few tools are fully automated, measurement programs often combine automated extraction scripts with spreadsheets or reporting dashboards to aggregate and visualize metrics."
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
          text: "Are measurement requirements explicitly guided by business objectives and linked to documented stakeholder information needs?"
        },
        {
          text: "Has the scope of measurement (functional area, project, site, or enterprise) and its temporal scope for time-series calibration been defined?"
        },
        {
          text: "Has the team's commitment to measurement been formally established, supported by resources, and assigned to specific roles (analyst, librarian)?"
        },
        {
          text: "Has the organizational unit been characterized in terms of processes, domains, technologies, interfaces, and operational constraints?"
        },
        {
          text: "Were stakeholder information needs systematically identified, prioritized, documented, communicated, and reviewed before selecting measures?"
        },
        {
          text: "Are measures selected based on information need priorities, collection cost, process disruption, ease of collection, and ease of analysis?"
        },
        {
          text: "Are internal quality characteristics (complexity, coupling, coverage) measured to provide early indicators of potential external issues?"
        },
        {
          text: "Are precise procedures for data collection, storage, verification, analysis, reporting, and configuration management defined and documented?"
        },
        {
          text: "Have appropriate stakeholders reviewed and approved the measurement plan, including procedures, evaluation criteria, schedules, and responsibilities?"
        },
        {
          text: "Are data collection, analysis, and reporting procedures integrated into relevant software processes to minimize disruption and address human factors?"
        },
        {
          text: "Is collected data verified, securely stored, aggregated, and analyzed using appropriate statistical or analytical methods?"
        },
        {
          text: "Do data providers and measurement users participate in reviewing analysis results to ensure they are meaningful and accurate?"
        },
        {
          text: "Are information products documented and communicated to stakeholders to inform conclusions, recommendations, and reasonable actions?"
        },
        {
          text: "Are information products and the measurement process evaluated against specified criteria using internal reviews or external audits?"
        },
        {
          text: "Are lessons learned recorded in a database, and are potential improvements (indicators, units, categories) analyzed and approved?"
        },
        {
          text: "Are automated project planning, tracking, risk simulation, and communication tools integrated into the measurement process?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering measurement, ISO/IEC/IEEE 15939, PSM framework, establishing commitment, planning measurement process, performing measurement, evaluating measurement, SEM tools, project planning, tracking, risk management, Monte Carlo simulation, communication tools, measurement tools",
  filename: "engineering-management-measurement",
  trigger: "model_decision"
});
