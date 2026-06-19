import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const requirementsManagementActivities = defineRule({
  content: [
    {
      level: 1,
      text: "Requirements Management Activities",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 The Nature and Scope of Requirements Management",
      type: "header"
    },
    {
      text: 'According to the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 6, requirements engineering activities are divided into two primary disciplines: requirements development and requirements management. Requirements development focuses on the active elicitation, analysis, specification, and validation of requirements, which can be conceptually summarized as "reaching an agreement on what software is to be constructed." Requirements management, on the other hand, is the system of activities dedicated to "maintaining that agreement over time."',
      type: "text"
    },
    {
      text: "Requirements management starts as soon as a baseline of requirements is established and continues throughout the software product lifecycle, spanning development, release, operations, and maintenance. It is a critical component of Software Configuration Management (SCM). Requirements management ensures that requirements are uniquely identified, version-controlled, traceably linked to downstream artifacts, and subjected to a disciplined change control process. Without robust requirements management, projects suffer from scope creep, where undocumented changes gradually expand the project scope, leading to cost overruns, missed deadlines, and architectural decay.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Requirements Scrubbing",
      type: "header"
    },
    {
      text: "Requirements scrubbing is the process of reviewing the requirements set to identify and eliminate elements that do not contribute to the essential objectives of the software product. SWEBOK v4 defines the goal of requirements scrubbing as finding the smallest set of simply stated requirements that will meet stakeholder needs. ",
      type: "text"
    },
    {
      text: "Reducing the number and complexity of the requirements has direct engineering benefits. A smaller, more focused requirements set reduces the size and complexity of the resulting software architecture, which in turn minimizes the effort, cost, and schedule required to design, construct, verify, and maintain the system. ",
      type: "text"
    },
    {
      text: "Requirements scrubbing specifically involves identifying and eliminating requirements that fall into the following categories:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Out of Scope**: Requirements that do not align with the defined system boundaries, project charter, or release objectives."
        },
        {
          text: "**Insufficient Return on Investment (ROI)**: Requirements where the estimated engineering cost to design, build, and maintain the feature exceeds the projected business value or operational benefit it provides."
        },
        {
          text: '**Low Importance**: Requirements that represent "nice-to-have" features (gold-plating) but are not essential for satisfying the core goals of the system or its users.'
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Additionally, requirements scrubbing focuses on simplifying unnecessarily complicated requirements. When a requirement contains excessive logical paths or complex constraints, engineers must work to simplify it into smaller, more direct rules, reducing the risk of design errors and code defects.",
      type: "text"
    },
    {
      text: "The execution and timing of requirements scrubbing depends on the chosen software lifecycle model:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Waterfall and Plan-Based Lifecycles**: Requirements scrubbing is coordinated with the validation phase. It is executed as a precursor step immediately before the formal requirements validation review, ensuring that the team only validates and freezes requirements that are necessary and cost-justified."
        },
        {
          text: "**Agile and Iterative Lifecycles**: Requirements scrubbing happens implicitly as part of iteration planning and backlog refinement. The product owner and engineering team continuously audit the backlog, removing low-value items and only moving the highest-priority, refined user stories into the upcoming sprint."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Requirements Change Control",
      type: "header"
    },
    {
      text: "Requirements change control is the central discipline of requirements management. Because software operates in dynamic environments, change is inevitable. Shifts in user preferences, business strategies, technical platforms, or regulatory laws will prompt requests for requirements changes. ",
      type: "text"
    },
    {
      text: "For projects utilizing plan-based or waterfall lifecycles, SWEBOK v4 dictates that organizations must implement a formal requirements change control process. This process must include the following five key components:",
      type: "text"
    },
    {
      items: [
        {
          text: "**A Means to Request Changes**: A standardized mechanism (such as a Change Request form or system) to document proposed modifications to previously agreed-upon baseline requirements."
        },
        {
          text: "**Impact Analysis Stage**: A technical and economic evaluation of the proposed change. Requirements engineers and developers analyze the request to determine its benefits, risks, and estimated costs. This includes assessing the impact on software architecture, code components, test suites, database schemas, and project constraints (schedule, budget, resources)."
        },
        {
          text: "**Responsible Decision-Making Body**: A designated person or group—typically a Change Control Board (CCB) comprising stakeholders from management, development, quality assurance, and customer representatives—who reviews the change request and the impact analysis. The CCB is responsible for deciding whether to accept, reject, or defer the requested change."
        },
        {
          text: "**Stakeholder Notification**: A mechanism to communicate the CCB's decision to all affected stakeholders, ensuring that developers, testers, and customers are aligned on the new baseline."
        },
        {
          text: "**Closure Tracking**: A means to track the implementation of accepted changes through design, coding, testing, and documentation to ensure they are completed and validated."
        }
      ],
      type: "numberedList"
    },
    {
      text: "A fundamental principle of requirements change control is that all stakeholders must understand that accepting a change requires accepting its impact on schedule, resources, or a corresponding adjustment in scope elsewhere in the project. SWEBOK v4 highlights that, ideally, these changes in scope should be objectively quantifiable. This is achieved by measuring the functional size of the change in functional size units (such as function points or other standard sizing metrics).",
      type: "text"
    },
    {
      text: "In Agile lifecycles, change control is managed implicitly. Any request to change previously agreed-upon requirements is not subjected to a rigid CCB process. Instead, the request is added directly to the product backlog. The request remains in the backlog until the product owner prioritizes it highly enough relative to other backlog items to select it for an upcoming iteration or sprint.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Scope Matching",
      type: "header"
    },
    {
      text: "Scope matching is the activity of ensuring that the scope of the requirements to be designed, constructed, and validated does not exceed the project's real-world constraints, such as budget, schedule, team capacity, and staffing levels.",
      type: "text"
    },
    {
      text: "When a scope mismatch is detected—meaning the estimated effort to implement the requirements baseline exceeds the available project capacity—the engineering team and stakeholders must negotiate one or more of the following corrective actions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Scope Reduction**: Removing or deferring a sufficient number of the lowest-priority requirements to align the remaining scope with the project's capacity."
        },
        {
          text: "**Capacity Increase**: Increasing project resources, which can be accomplished by extending the project schedule, increasing the budget, or onboarding additional software engineers."
        },
        {
          text: "**Negotiated Combination**: Applying a balanced mix of scope reduction and capacity adjustments to achieve a realistic project baseline."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "SWEBOK v4 emphasizes that scope matching should be quantitative rather than qualitative. By measuring both requirements scope and development capacity in standard functional size units, organizations can make objective, data-driven decisions during negotiation.",
      type: "text"
    },
    {
      text: "The coordination of scope matching varies across lifecycles:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Plan-Based Lifecycles**: Scope matching is coordinated with requirements validation. It should occur immediately before the validation review, ensuring that the team does not freeze a requirements set that is mathematically impossible to deliver within the project's constraints."
        },
        {
          text: "**Agile Lifecycles**: Scope matching is performed through velocity-based sprint planning. The development team calculates its historical velocity (the amount of functional size or story points completed per iteration) and only commits to backlog items that fit within that demonstrated capacity for the upcoming sprint."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Agent Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Agreement Maintenance**: Has a clear baseline agreement been established, and is the agent actively maintaining it throughout the task lifecycle?"
        },
        {
          text: "**Scrubbing Verification**: Has the active requirements backlog been audited to identify and eliminate out-of-scope, low-ROI, or low-importance requirements?"
        },
        {
          text: "**Requirements Simplification**: Were complex or compound requirements simplified into simple, direct statements before design and implementation?"
        },
        {
          text: "**Change Request Process**: For any proposed requirements modifications, has a formal change request been logged with its description and rationale?"
        },
        {
          text: "**Change Impact Analysis**: Has a technical impact analysis been performed for each change request to evaluate its effect on architecture, schemas, and test coverage?"
        },
        {
          text: "**CCB Decisions**: Have all requirements changes been reviewed and formally accepted, rejected, or deferred by the designated decision-maker?"
        },
        {
          text: "**Quantified Scope Changes**: Were requirements changes quantified in functional size units or story points to evaluate their impact on project capacity?"
        },
        {
          text: "**Scope Matching Audit**: Has the total requirements scope been audited against cost, schedule, and staffing constraints to ensure no scope mismatch exists?"
        },
        {
          text: "**Agile Velocity Limits**: If operating in an agile lifecycle, was the iteration scope matched to the team's historical velocity to prevent capacity overload?"
        },
        {
          text: "**Scrubbing and Scope Matching Timing**: Were scrubbing and scope matching coordinated with requirements validation (occurring prior to validation reviews) or iteration planning?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "requirements management, change control, prioritization, traceability, process management, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-management-activities",
  trigger: "model_decision"
});
