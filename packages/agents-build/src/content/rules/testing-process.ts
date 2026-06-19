import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const testingProcess = defineRule({
  content: [
    {
      level: 1,
      text: "Software Test Process",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "The software test process establishes a structured, multi-layered framework of policies, strategies, activities, and resources necessary to plan, manage, execute, and evaluate testing. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5, Section 5, testing is not an ad hoc activity performed solely at the end of construction, but a continuous engineering process integrated into the software development life cycle. According to international standards (such as ISO/IEC/IEEE 29119-2), the test process operates across three hierarchical tiers: the organizational level (defining corporate policies and test strategies), the test management level (governing planning, monitoring, control, and completion), and the dynamic test level (governing design, environment setup, execution, and incident reporting). Fostering collaborative attitudes, managing detailed documentation, establishing independent validation boundaries, and applying controlled experimental principles are key to executing a professional test process.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Organizational, Management, and Dynamic Test Process Levels",
      type: "header"
    },
    {
      text: "A standardized test process distributes activities across distinct levels of authority and operational scope to ensure complete quality governance:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Organizational Test Process**: This level defines the long-term, structural assets that govern all testing activities within an organization. It includes creating and maintaining organizational test policies (which state the purpose, goals, and scope of testing) and organizational test strategies (which provide general guidelines on how testing is performed, such as specifying standard testing levels, target quality attributes, and compliance frameworks). These assets serve as the baseline for all individual projects."
        },
        {
          text: "**Test Management Process**: This level governs the lifecycle of testing within a specific project. It comprises sub-processes for test planning (identifying scope, estimating resources, and scheduling), test monitoring and control (collecting execution metrics to ensure alignment with the plan and mitigating quality risks), and test completion (verifying that all objectives are met, documenting final reports, and archiving assets)."
        },
        {
          text: "**Dynamic Test Process**: This level covers the execution-level activities of testing. It defines the sequence of design and implementation (translating requirements into test cases), test environment setup and maintenance (provisioning hardware, software, and firmware configurations), test execution (running the test cases against a specified version of the SUT), and test incident reporting (capturing failures, cataloging defects, and notifying development teams)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Practical Considerations in Test Process Management",
      type: "header"
    },
    {
      text: "Executing a test process in a real-world project requires addressing human, organizational, and technical constraints:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Attitudes and Egoless Programming**: A critical factor in testing success is a collaborative, constructive culture. Testers and developers must work together toward quality assurance rather than view defect discovery as personal failure. Egoless programming principles encourage developer openness to peer review and independent validation. Shift-left methodologies (such as Agile or DevOps) emphasize continuous communication and shared responsibility for quality, breaking down traditional silos between engineering roles."
        },
        {
          text: "**Risk-Based and Scenario-Based Testing**: To optimize testing under resource constraints, organizations apply risk-based testing. This approach identifies product risks (based on failure likelihood and business impact) and uses them to prioritize the test strategy and allocate verification resources. Scenario-based testing focuses test case generation on user stories, system scenarios, and product backlog items to validate that the SUT satisfies behavioral specifications under realistic usage workflows."
        },
        {
          text: "**Hierarchical Test Documentation**: Documenting the test process provides auditability, traceabilities, and replication. Organizational documentation records policies and corporate strategies. Management documentation includes the project test plan (defining scopes and resource constraints), status reports (tracking progress against milestones), and completion reports. Dynamic documentation includes test specifications (test designs, test cases, and test procedures), test data requirements, environment specifications, readiness reports, execution logs, and incident reports. All testing documentation must be placed under software configuration control to prevent drift."
        },
        {
          text: "**Testing Team Independence**: The organization of the test team involves balancing cost, schedule, and objectivity. Testing can be performed by the developers themselves, by an internal independent QA team, or by external auditors. Independent testing teams provide an unbiased perspective, increasing the likelihood of identifying architectural or requirement-level errors that developers might overlook. Modern shift-left processes integrate testers directly into development squads to ensure rapid feedback while preserving their specialized quality focus."
        },
        {
          text: "**Test Process Measures and Completion Criteria**: Test managers monitor process metrics to evaluate progress and manage risks. Key measures include the number of test cases specified, executed, passed, and failed, alongside defect metrics like cumulative defects open/closed, residual risk, test progress trends, and defect detection percentage. Test completion criteria define when a testing phase can stop. While structural coverage (statement, branch) and fault density estimates are valuable indicators, the stopping decision also involves assessing the business risk and financial cost of remaining defects versus the cost of continued testing."
        },
        {
          text: "**Test Reusability**: Designing testing assets (test cases, test data, and execution environments) for reusability is essential to reduce long-term maintenance costs. Test reusability requires classifying testing knowledge in repositories, making it searchable, and linking test cases to requirements so that when requirements change, the test suite is updated systematically. Reusable test assets are vital for regression testing, feature-based development, and product-line engineering."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Sub-Processes and Dynamic Execution",
      type: "header"
    },
    {
      text: "The dynamic execution of testing relies on scientific rigor and controlled environmental parameters to ensure valid outcomes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Test Planning, Design, and Implementation**: Test planning coordinates personnel, defines equipment, and manages project risks. During design, engineers analyze test objectives to select appropriate techniques. Automated test generators are often used to ingest specifications or source code and produce test cases. Test oracle facilities can automatically determine expected results, enabling full execution automation."
        },
        {
          text: "**Test Environment Development and Setup**: Provisioning the test environment involves selecting the hardware, software, firmware, and tools required to run tests. Environments can be simulated, controlled, and run in vitro (isolated virtual environments) or in vivo (live staging environments). Setup includes configuring monitoring and logging infrastructure to record SUT state transitions and performance metrics during execution."
        },
        {
          text: "**Controlled Experiments and Replicability**: Software testing must adhere to scientific experimentation principles. All testing activities must follow documented procedures and target a clearly defined version of the SUT, ensuring that any engineer can replicate the results under identical conditions. Controlled studies, such as A/B testing, are also used to statistically evaluate user behaviors and preferences."
        },
        {
          text: "**Test Incident Reporting and Evaluation**: When a test fails, the dynamic process requires systematic data collection, documenting when the failure occurred, who executed the test, the software configuration, and the observed symptoms. Unexpected results are cataloged in a problem reporting system to support debugging. Not all anomalies are faults; some may represent environment noise, requiring formal review boards to analyze the results."
        },
        {
          text: "**Staffing, Hiring, and Training**: Staffing defines testing roles (such as test leads, QA analysts, performance engineers, and test automation architects) and assigns responsibilities. Project managers must plan hiring schedules and specify training needs (including classroom instruction, self-paced courses, and mentoring) to ensure the team has the skills required to validate complex systems."
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
          text: "Were corporate test policies and strategies documented at the organizational level to establish a quality baseline?"
        },
        {
          text: "Did the test management process specify subprocesses for planning, monitoring, control, and phase completion?"
        },
        {
          text: "Was the dynamic test process structured to govern design, environment setup, execution, and incident reporting?"
        },
        {
          text: "Did the team foster a collaborative, egoless programming culture to facilitate unbiased failure discovery?"
        },
        {
          text: "Was risk-based testing applied to prioritize test suites and allocate validation resources based on product risk profiles?"
        },
        {
          text: "Were organizational, management, and dynamic test documentations maintained under version control?"
        },
        {
          text: "Did the project plan define the level of testing team independence to balance objectivity with resource constraints?"
        },
        {
          text: "Were test process measures (executed tests, open defects, progress trends, defect detection percentage) monitored to manage risks?"
        },
        {
          text: "Were quantitative stopping criteria (coverage metrics, fault density, residual risk, business cost) defined to determine test completion?"
        },
        {
          text: "Were testing assets (test cases, environments, configurations) stored in searchable repositories to support test reusability?"
        },
        {
          text: "Did the test planning process identify personnel, define completion criteria, and establish risk mitigation strategies?"
        },
        {
          text: "Were automated test generators and test oracle facilities integrated to optimize design and implementation?"
        },
        {
          text: "Was the test environment provisioned with monitored logging facilities to capture SUT execution states?"
        },
        {
          text: "Did the testing process adhere to scientific controlled experimentation principles to ensure replicability of results?"
        },
        {
          text: "Were test incidents documented in a problem reporting system with complete configuration and execution metadata?"
        },
        {
          text: "Were unexpected outcomes evaluated to distinguish between actual software faults and test environment noise?"
        },
        {
          text: "Did the staffing plan specify test-related roles, responsibilities, hiring timelines, and required training activities?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software testing process, test planning, dynamic test process, test documentation, test team, test completion, test reusability, test environment, test incident reporting, staffing, training",
  filename: "testing-process",
  trigger: "model_decision"
});
