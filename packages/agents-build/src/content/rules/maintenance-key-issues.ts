import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const maintenanceKeyIssues = defineRule({
  content: [
    {
      level: 1,
      text: "Key Issues in Software Maintenance",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software maintenance operates within a complex web of technical, managerial, and economic challenges that distinguish it from initial software development. As outlined in Chapter 7, Section 2 of the IEEE Software Engineering Body of Knowledge (SWEBOK v4), managing these key issues is vital for sustaining system utility and controlling the total cost of ownership. Technical issues, such as the limited understanding of legacy architectures, the complexity of testing modified code, and the necessity of thorough impact analysis, directly affect modification speed and reliability. Managerial challenges require aligning maintenance activities with broader organizational objectives, motivating and staffing maintenance teams, elevating process maturity, and managing third-party suppliers. Finally, economic considerations dictate that organizations must accurately estimate maintenance costs and evaluate the long-term impact of technical debt using structured cost-estimation frameworks.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Technical Issues",
      type: "header"
    },
    {
      text: "Technical challenges in software maintenance stem from the inherent difficulty of modifying existing, complex systems:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Limited Understanding**: Maintenance engineers rarely have complete knowledge of the system. Legacy code is often poorly documented, uses outdated design patterns, and contains undocumented dependencies. This limited understanding increases the risk of introducing unintended side effects when modifying the code."
        },
        {
          text: "**Testing Modified Code**: Regression testing is critical to ensure that changes do not break existing functionality. However, maintaining comprehensive test suites, identifying which tests to run for a specific change, and validating edge cases in complex systems is highly resource-intensive."
        },
        {
          text: "**Impact Analysis**: Before implementing any change, maintainers must conduct a detailed impact analysis. This analysis identifies all software modules, database schemas, interfaces, and documentation affected by the proposed modification. Failure to perform impact analysis leads to incomplete changes and system instability."
        },
        {
          text: "**Complexity Growth**: As modifications are made, the internal complexity of the software tends to grow. If left unchecked, this complexity growth degrades system maintainability, increases defect density, and accelerates architectural decay. Maintainers must allocate effort to refactor code and simplify structures during modifications."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Management Issues",
      type: "header"
    },
    {
      text: "Managing software maintenance requires addressing unique organizational and human factors:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Alignment with Organizational Objectives**: Maintenance must be treated as a strategic activity that supports business goals. This involves prioritizing modifications that deliver the highest value to the organization, balancing feature requests against technical debt remediation, and coordinating release schedules."
        },
        {
          text: "**Staffing and Motivation**: Maintenance is sometimes perceived as less prestigious than new product development. Managers face the challenge of recruiting, training, and motivating maintenance engineers. Establishing clear career paths, recognizing the value of maintenance, and rotating engineers between development and maintenance tasks help sustain team morale."
        },
        {
          text: "**Process Maturity**: Adopting mature software engineering processes (such as CMMI or ISO/IEC 15504) improves the predictability and quality of maintenance activities. Mature processes define clear roles, entry and exit criteria for modifications, and metrics for continuous process improvement."
        },
        {
          text: "**Supplier Management**: Modern systems rely heavily on third-party libraries, cloud platforms, and commercial off-the-shelf (COTS) components. Maintainers must monitor supplier roadmaps, manage license agreements, and plan for updates or deprecations of external dependencies."
        },
        {
          text: "**Organizational Aspects**: The structure of the maintenance organization (e.g., co-located support, decentralized teams, or specialized maintenance groups) affects communication and coordination. Clear boundaries and responsibilities must be established to ensure efficient request routing."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Software Maintenance Costs and Technical Debt",
      type: "header"
    },
    {
      text: "Economic constraints shape all maintenance decisions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Technical Debt Cost Estimation**: Technical debt represents the cost of additional rework caused by choosing an easy solution now instead of a better approach. Maintainers must quantify technical debt, analyze its compounding interest (increased maintenance effort), and prioritize refactoring tasks to prevent debt from overwhelming the budget."
        },
        {
          text: "**Maintenance Cost Estimation**: Estimating the cost and effort of maintenance is challenging due to the unpredictable nature of modifications. Engineers use models like COCOMO II (Constructive Cost Model), which includes parameters specifically for software maintenance (such as software transition effort, annual change traffic, and maintenance experience factor)."
        },
        {
          text: "**Architecture Impact**: The quality of the software architecture directly determines long-term maintenance costs. High-cohesion, low-coupling, and modular designs reduce the scope of modifications, simplify testing, and lower the overall cost of sustaining the system."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Complexity Metrics and Structural Health",
      type: "header"
    },
    {
      text: "Maintaining the structural health of a codebase requires the continuous collection and analysis of complexity metrics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Cyclomatic Complexity**: Measuring the number of linearly independent paths through a program's source code. High cyclomatic complexity indicates brittle, hard-to-test code that is prone to regression defects."
        },
        {
          text: "**Cognitive Complexity**: Assessing how difficult a code segment is for a human developer to understand. Reducing cognitive complexity simplifies maintenance tasks and decreases the onboarding time for new team members."
        },
        {
          text: "**Coupling and Cohesion**: Modifying code should not require changes to cascade across decoupled modules. Maintainers monitor coupling metrics to identify architectural violations and schedule targeted refactoring."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Onboarding and Knowledge Retention",
      type: "header"
    },
    {
      text: "As maintenance teams evolve, retaining system knowledge and onboarding new engineers are critical tasks:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Design Recovery**: Utilizing static analysis tools to reconstruct visual design models, database schemas, and data flow models from the source code."
        },
        {
          text: "**Knowledge Bases**: Documenting common diagnostic procedures, configuration setups, and system dependencies in a centralized, searchable repository."
        },
        {
          text: "**Pair Programming**: Pairing experienced maintainers with new hires during complex modifications to transfer tacit knowledge and design rationale."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Risk Management in Maintenance Operations",
      type: "header"
    },
    {
      text: "Every software modification carries inherent risk, which must be systematically managed:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Risk Assessment**: Evaluating modifications based on their size, complexity, affected modules, and potential impact on system availability."
        },
        {
          text: "**Mitigation Strategies**: Implementing safety nets, such as comprehensive unit tests, automated integration testing, and canary deployments, to contain failures."
        },
        {
          text: "**Rollback Planning**: Developing detailed, rehearsed plans to restore the previous stable system state if a deployment introduces critical errors in production."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Advanced Maintenance Cost Estimation Models",
      type: "header"
    },
    {
      text: "Estimating effort and costs for maintaining software over its operational lifecycle requires sophisticated models:",
      type: "text"
    },
    {
      items: [
        {
          text: "**COCOMO II Parameters**: The COCOMO II model incorporates specific multipliers for maintenance, such as Software Modification Effort (SME) and Annual Change Traffic (ACT). ACT represents the fraction of the software product's code that is modified or added in a typical year."
        },
        {
          text: "**Maintenance Effort Multipliers**: The model utilizes factors like product complexity, developer capability, platform difficulty, and personnel continuity. For example, high personnel turnover increases the effort required due to lost system familiarity."
        },
        {
          text: "**Lehman's Conservation of Familiarity**: This law limits release sizes. If a release changes too much code, the maintenance team's familiarity with the system drops, leading to an exponential increase in defect rates. Cost models must account for this constraint to avoid scheduling overly large updates."
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
          text: "Were impact analysis procedures conducted and documented for every modification request before code changes began?"
        },
        {
          text: "Has a regression testing strategy been defined to validate that modifications do not degrade existing system functions?"
        },
        {
          text: "Did the team update system documentation, design models, and test cases to reflect all implemented software changes?"
        },
        {
          text: "Were legacy code structures refactored during maintenance to manage complexity growth and prevent architectural drift?"
        },
        {
          text: "Are maintenance activities aligned with current organizational objectives, prioritizing value-driven system modifications?"
        },
        {
          text: "Has a staffing and rotation plan been implemented to motivate maintenance teams and prevent knowledge silos?"
        },
        {
          text: "Were maintenance processes defined, measured, and reviewed to evaluate and improve process maturity over time?"
        },
        {
          text: "Is third-party supplier management active, tracking dependency lifecycles, licensing, and security advisories?"
        },
        {
          text: "Did the organization establish a technical debt registry to track, estimate, and schedule remediation for deferred design work?"
        },
        {
          text: "Are maintenance effort and cost estimates calculated using structured models (such as COCOMO II) based on change traffic?"
        },
        {
          text: "Were architectural quality metrics (such as coupling, cohesion, and cyclomatic complexity) monitored to control long-term costs?"
        },
        {
          text: "Has a post-modification review been conducted to assess the accuracy of effort estimates and identify process improvements?"
        },
        {
          text: "Are external software licenses, cloud platform SLAs, and hardware support contracts reviewed annually by the maintenance group?"
        },
        {
          text: "Was an operational risk assessment performed for modifications targeting critical software modules or data storage layers?"
        },
        {
          text: "Are regression test suites optimized periodically to ensure they provide adequate code path coverage within acceptable build times?"
        },
        {
          text: "Are onboarding materials and system knowledge bases kept up-to-date with architectural modifications to support new maintainers?"
        },
        {
          text: "Was a formal rollback plan documented and tested for every high-risk production deployment?"
        },
        {
          text: "Were COCOMO II maintenance multipliers (such as Annual Change Traffic) calibrated using historical organizational data?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "key issues in software maintenance, technical issues, limited understanding, testing modified code, impact analysis, management issues, organizational alignment, staffing, motivation, process maturity, supplier management, costs, technical debt, cocomo ii, cost estimation",
  filename: "maintenance-key-issues",
  trigger: "model_decision"
});
