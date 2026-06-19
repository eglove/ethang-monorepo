import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringManagementReviewEvaluation = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Management: Review and Evaluation",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering management requires systematic observation, assessment, and adjustment to align project execution with organizational goals and quality standards. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 13 (Software Engineering Management) and Chapter 8 (Software Engineering Process), review and evaluation are the primary mechanisms for assessing the fitness of both the software product and the processes that produce it. These activities occur at prespecified intervals or in response to specific project triggers, ensuring that overall progress toward stated objectives is transparently evaluated. Rather than treating reviews as a retrospective formality, they must be integrated into the management lifecycle to measure requirements satisfaction, evaluate process effectiveness, and review the performance of personnel and tooling. Managers use these evaluations to identify deviations from plans, manage risks, and implement corrective actions, establishing a closed-loop control system that governs the project's evolution.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Stakeholder Satisfaction and Requirements Fulfillment",
      type: "header"
    },
    {
      text: "Achieving stakeholder satisfaction—including users, customers, and sponsors—is a principal goal of the software engineering manager. Requirements satisfaction requires periodic assessment against baseline specifications, comparing software increments against defined acceptance criteria. Software configuration management (SCM) procedures must be followed to ensure discovered variances from requirements are documented as change requests and processed through a configuration change board. Decisions to alter plans or modify the baseline must be documented and communicated to stakeholders, ensuring traceability. Furthermore, evaluation data must be recorded as part of the measurement process to provide historical baselines for future estimation and process improvement.",
      type: "text"
    },
    {
      text: 'Managers rely on SCM to provide a stable evaluation baseline, preventing the "moving target" problem where code changes during a review. Decisions made during reviews must be logged, and if deviations from requirements are revealed, plans must be revised. This feedback loop ensures the project remains aligned with stakeholder expectations. Quantitative metrics, such as requirements coverage (percentage of requirements tested) and defect removal efficiency, are tracked to identify quality escapes before project delivery.',
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Milestone Evaluations and Iterative Cycle Retrospectives",
      type: "header"
    },
    {
      text: "Milestones and iterative boundaries serve as checkpoints for software reviews. SWEBOK v4 Chapter 13 distinguishes between milestone evaluations, which assess whether a major phase (such as architectural design or technical review) met its entry/exit criteria, and iterative cycle retrospectives, which evaluate the product increment at the end of a sprint. Milestone reviews focus on macro objectives, verifying architectural quality attributes like performance, maintainability, and security before implementation. In contrast, retrospectives focus on micro adjustments, evaluating velocity, defect density, and collaboration.",
      type: "text"
    },
    {
      text: "Both evaluation types require stakeholder participation to validate project direction and refine schedules. Milestone evaluations are formal reviews determining if the project can transition to the next phase, involving experts, customers, and developers for sign-off. Conversely, retrospectives are internal team meetings evaluating the immediately preceding development cycle to analyze what went well, what went poorly, and how to improve. By combining both, managers maintain project alignment while fostering continuous improvement.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Reviewing and Evaluating Performance",
      type: "header"
    },
    {
      text: "Evaluating project performance requires a multi-dimensional approach spanning personnel, processes, methods, and tools. SWEBOK v4 Chapters 8 and 10 emphasize that high-quality products result from well-managed processes executed by skilled personnel. Evaluating product performance involves verifying that the software meets its non-functional requirements, such as performance, reliability, and security, under production workloads using performance profiling and monitoring.",
      type: "text"
    },
    {
      text: "Evaluating personnel performance involves assessing contributions of individuals and the team. Periodic reviews provide insight into whether team members adhere to project plans and defined processes. These reviews focus on objective criteria, such as code quality, test coverage, and collaboration, helping identify areas where team members experience difficulty (e.g., technical challenges or training needs) to maintain velocity.",
      type: "text"
    },
    {
      text: "Evaluating process performance involves systematically assessing the effectiveness and efficiency of the software development process. Managers collect and analyze process metrics (e.g., mean time to repair, defect removal efficiency, and release predictability) to determine if the process is achieving its objectives. If the process evaluation reveals inefficiencies or bottlenecks, the manager must implement process improvements, adjusting workflows, or updating tools.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Personnel Performance Reviews and Team Dynamics",
      type: "header"
    },
    {
      text: "Personnel performance reviews are a critical tool for aligning individual goals with project objectives, but they must be managed with sensitivity to team dynamics. In a software team, individual performance is interdependent; a developer's output depends on the quality of requirements, architectural constraints, and peer collaboration. Therefore, personnel reviews must not focus solely on individual metrics (such as lines of code written), which can be easily gamed. Instead, reviews should assess contributions to collective goals, including participation in peer reviews and helpfulness to others.",
      type: "text"
    },
    {
      text: "Managing team dynamics is a core competency. Software projects often involve high pressure, tight deadlines, and complex technical decisions, which can lead to team member conflicts. Managers must monitor team dynamics and intervene when conflicts arise to prevent them from disrupting progress. Common sources of conflict include disagreements over technical designs, perceived imbalances in workload, and communication breakdowns. Managers should establish clear protocols for conflict resolution, promoting open communication, active listening, and objective decision-making. Constructive conflict resolution builds trust, improves psychological safety, and fosters a high-performing team culture.",
      type: "text"
    },
    {
      text: "Performance reviews also provide opportunities to identify training and development needs. Software engineering is a rapidly evolving field, and team members must continuously update their skills to remain effective. During performance reviews, managers and team members should collaborate to define professional development goals and identify training opportunities, such as courses, workshops, or mentoring. This investment in personnel improves individual performance and enhances overall team capability and versatility.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Tools, Methods, and Process Assessment",
      type: "header"
    },
    {
      text: "The tools, methods, and processes used by a software engineering team must be systematically and periodically evaluated. A tool or method that was suitable for a small project may become a bottleneck or introduce unnecessary complexity as the project scales. SWEBOK v4 Chapter 13 highlights the importance of evaluating project methods, tools, and techniques to ensure they support goals and do not introduce waste. Tools include integrated development environments, version control systems, build servers, and testing tools. Methods include software design methodologies, coding standards, and testing techniques.",
      type: "text"
    },
    {
      text: "Evaluating tools and methods involves assessing their utility, usability, and cost-effectiveness, considering whether they improve developer productivity, reduce defect density, or simplify integration. If a tool or method is found to be ineffective or to introduce excessive overhead, it should be replaced or modified. The manager must manage the transition to new tools and methods carefully, providing training and support to minimize disruption.",
      type: "text"
    },
    {
      text: "Process assessment is a formal evaluation of the software development process against a process reference model (such as ISO/IEC 33020 or CMMI) to determine the maturity and capability of the organization's processes. The assessment involves collecting evidence (documentation, metrics, interview transcripts) and comparing it against reference model criteria, outputting a profile of process strengths and weaknesses and recommendations for improvement. This helps organizations transition from ad-hoc, chaotic practices to disciplined, predictable, and continuously improving software engineering processes.",
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
          text: "Have the prespecified times and triggers for overall progress evaluations been documented in the project plan?"
        },
        {
          text: "Is the satisfaction of stakeholder requirements assessed periodically against a defined baseline using objective criteria?"
        },
        {
          text: "Are milestones established with explicit, measurable entry and exit criteria that must be verified during milestone evaluations?"
        },
        {
          text: "Does the software engineering manager perform retrospectives at the completion of each iterative development cycle to evaluate process and product increments?"
        },
        {
          text: "Were the software configuration control and software configuration management procedures followed for all changes resulting from review decisions?"
        },
        {
          text: "Are all decisions, action items, and variances identified during review sessions formally documented and communicated to relevant parties?"
        },
        {
          text: "Are project plans, schedules, and resource allocations revisited and revised when progress reviews indicate significant variances from the baseline?"
        },
        {
          text: "Has the measurement data collected during review and evaluation activities been recorded in the project's measurement repository?"
        },
        {
          text: "Are periodic performance reviews conducted for project personnel to evaluate their adherence to project plans and defined processes?"
        },
        {
          text: "Does the manager actively monitor and address team dynamics, including the identification and constructive resolution of team member conflicts?"
        },
        {
          text: "Are the project's engineering methods, techniques, and tools systematically evaluated for their effectiveness and appropriateness to the current project scale?"
        },
        {
          text: "Is the project's software process periodically and systematically assessed for relevance, utility, and efficacy?"
        },
        {
          text: "Are process improvements and project adjustments formally managed, tracked, and verified to prevent process drift?"
        },
        {
          text: "Have the criteria for measuring stakeholder satisfaction been defined, agreed upon, and mapped to verifiable requirements?"
        },
        {
          text: "Is there an established feedback loop ensuring that outcomes from personnel, tool, and process evaluations are used to update training plans and toolchains?"
        },
        {
          text: "Are external experts or independent review boards engaged for high-risk milestone evaluations to ensure objective assessment?"
        },
        {
          text: "Does the project team track review efficiency and defect removal metrics to evaluate the quality and effectiveness of the review process itself?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software review and evaluation, requirements satisfaction, stakeholder satisfaction, milestone evaluations, iterative cycle retrospectives, reviewing performance, personnel reviews, team dynamics, tools and methods evaluation, process assessment",
  filename: "engineering-management-review-evaluation",
  trigger: "model_decision"
});
