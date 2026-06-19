import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const requirementsAnalysis = defineRule({
  content: [
    {
      level: 1,
      text: "Requirements Analysis",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software requirements analysis is the systematic process of checking, refining, and evaluating candidate requirements to understand their meaning, implications, and consistency. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 3, requirements are rarely elicited in their final, correct form. Instead, elicited information is often unstructured, incomplete, and conflicting. Requirements analysis serves as the critical analytical feedback loop between elicitation and specification. It aims to resolve contradictions, verify technical and economic feasibility, and ensure that the requirements baseline represents a stable foundation for design, construction, and testing. Detecting and correcting requirements defects during this analysis phase prevents cascade failures, which are exponentially more expensive to resolve once implementation begins.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Basic Requirements Analysis",
      type: "header"
    },
    {
      text: "During basic requirements analysis, software engineers evaluate the requirements collection to establish several core properties:",
      type: "text"
    },
    {
      items: [
        {
          text: "Complete: The requirements must adequately address all known states, boundary conditions, exception paths, and security needs. Complete specifications map out every input scenario to a deterministic outcome."
        },
        {
          text: "Concise: The collection must be free of redundant prose, gold-plating, or extraneous content. Extra words introduce semantic noise."
        },
        {
          text: "Internally Consistent: No requirement may contradict or conflict with another requirement in the baseline. For example, a system cannot be both fully synchronous and asynchronously deferred at the same point."
        },
        {
          text: "Externally Consistent: The requirements must align with all original source materials, corporate policies, and stakeholder needs."
        },
        {
          text: "Feasible: A viable, cost-effective solution must be constructible within the project's cost, schedule, staffing, and technical constraints."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "At the individual statement level, the analyst refines requirements to ensure they exhibit desirable properties. Each requirement should be:",
      type: "text"
    },
    {
      items: [
        {
          text: "Unambiguous: Interpretable in only one way by both business stakeholders and engineers. Natural language is notoriously ambiguous, and analysis must resolve dual meanings."
        },
        {
          text: 'Testable (Quantified): Expressed in measurable terms so that compliance or noncompliance can be empirically demonstrated. For example, replacing vague goals like "fast response" with quantified limits such as response latency within two hundred milliseconds.'
        },
        {
          text: "Binding: Essential to the business objective, meaning clients are willing to pay for it and unwilling to proceed without it."
        },
        {
          text: "Atomic: Representing a single decision or business rule to prevent hidden complexity."
        },
        {
          text: "Representative: Reflecting actual stakeholder needs using their domain-specific vocabulary."
        },
        {
          text: "Acceptable: Approved and agreed upon by all relevant stakeholders."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "A common failure mode is treating a stakeholder's proposed solution as the actual problem. For example, a request to add a specific database index is a solution, whereas the underlying problem is slow page load times. To discover the true requirement, engineers apply the 5-Whys Technique, repeatedly asking \"Why is this the requirement?\" until the answer converges on the root problem. The root problem is reached when omitting the proposed action would leave the stakeholder's core business problem unsolved. Typically, the true problem is uncovered within two or three cycles of questioning.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Economics of Quality of Service (QoS) Constraints",
      type: "header"
    },
    {
      text: "Quality of Service (QoS) constraints (e.g., latency, capacity, throughput, and reliability) present a significant engineering challenge because they are rarely analyzed from an economic perspective. SWEBOK v4 models the value of QoS constraints as a function of performance. For constraints where higher performance is better (e.g., throughput), value increases with performance. For constraints where lower performance is better (e.g., response latency or mean time to repair), the value curve is vertically mirrored.",
      type: "text"
    },
    {
      text: "The QoS value curve contains two critical threshold points:",
      type: "text"
    },
    {
      items: [
        {
          text: "Perfection Point: The performance level beyond which no additional business benefit is gained. Exceeding this point yields excess capacity that cannot be utilized. For example, supporting a user capacity greater than the addressable market has zero extra value."
        },
        {
          text: "Fail Point: The performance level below which the system's utility drops to zero. Below this point, the software cannot be placed in service."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Quantified requirements are often arbitrary targets. A system can still provide significant business value even if it falls short of the stated requirement, provided it remains above the fail point. Conversely, exceeding the requirement may unlock extra value. ",
      type: "text"
    },
    {
      text: "The cost to deliver a given QoS level is typically a step function, where additional investments (e.g., hardware upgrades or network clusters) enable higher performance limits. The most cost-effective QoS level is the performance point that maximizes the positive difference between the value delivered and the cost to achieve it: the optimal performance level is where value minus cost is maximized.",
      type: "text"
    },
    {
      text: "Software engineers must also analyze the interrelationships between QoS constraints. Some constraints are mutually supporting (e.g., writing highly modifiable code automatically improves reliability by reducing defect rates). Others represent conflicting trade-offs (e.g., optimizing code for raw execution speed increases complexity, which reduces modifiability).",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Formal Analysis",
      type: "header"
    },
    {
      text: "For high-integrity, safety-critical systems, formal analysis uses mathematical specification languages with formally defined semantics (such as Z notation, VDM, or SDL) to express requirements. Formal analysis provides two major benefits:",
      type: "text"
    },
    {
      items: [
        {
          text: "Precision and Conciseness: It eliminates the ambiguity of natural language, reducing misinterpretation."
        },
        {
          text: "Reasoning Capability: It permits static validation, allowing engineers to mathematically prove that the specified system exhibits desired properties (such as the absence of deadlock, race conditions, or unhandled terminal states) before any production code is written.\nFormal analysis typically involves theorem proving (using mathematical logic to prove properties) and model checking (exhaustively searching the state space of a model to verify invariants). SWEBOK v4 notes that while these tools provide high assurance, they require specialized mathematical competence to operate."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Addressing Conflict in Requirements",
      type: "header"
    },
    {
      text: "As the number of stakeholders increases, conflicting requirements become inevitable. Engineers must identify and manage these conflicts using two primary approaches:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Negotiation**: Consulting stakeholders to reach a consensus resolution rather than making unilateral developer decisions. All resolved decisions must be traceable to the authorizing customer. This negotiation balances product requirements with project-level constraints (cost, schedule, staffing)."
        },
        {
          text: '**Product Family Development**: Separating requirements into:\n- Invariant Requirements: Core business rules that all stakeholders agree upon. These are implemented using "design to invariants" principles.\n- Variant Requirements: Points of conflict where customization is required. These are designed using "design for change" patterns, establishing configuration properties to adapt instances of the system to individual stakeholder needs.'
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.5 Requirements Refinement and Analysis Process Quality",
      type: "header"
    },
    {
      text: "The analysis process is highly iterative, feeding back into elicitation when gaps are discovered and preparing the requirements for formal specification. Evaluating the quality of the analysis process involves tracking requirements defect density (the number of requirements defects found per page of specification) and requirements volatility (the frequency of changes over time). Collecting these metrics helps benchmark organizational productivity and guide continuous process improvement initiatives. High-quality analysis ensures that the architectural design phase begins with a clear, stable, and mathematically sound requirements baseline, minimizing the risk of expensive downstream changes, reducing project delivery costs, and lowering subsequent software maintenance efforts.",
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
          text: "Have the candidate requirements been evaluated for completeness, conciseness, feasibility, and consistency?"
        },
        {
          text: "Has every requirement been checked to ensure it is unambiguous, testable, binding, atomic, and representative?"
        },
        {
          text: "Was the 5-Whys Technique applied to distinguish stakeholders' proposed solutions from the actual business problems?"
        },
        {
          text: "For each Quality of Service (QoS) constraint, have the perfection point and fail point been identified and documented?"
        },
        {
          text: "Did the analysis determine the most cost-effective performance level by evaluating the value-to-cost trade-offs?"
        },
        {
          text: "Have the positive and negative interrelationships between conflicting QoS constraints been analyzed?"
        },
        {
          text: "Was formal analysis considered or applied to mathematically prove safety properties (e.g., absence of deadlock)?"
        },
        {
          text: "Are conflicting requirements resolved through structured stakeholder negotiation rather than unilateral developer decisions?"
        },
        {
          text: "Are negotiated requirements resolutions traceable to the authorizing customer?"
        },
        {
          text: "Has product family development been applied to separate invariant requirements from variant requirements?"
        },
        {
          text: "Are variant requirements designed with configuration customization points to accommodate different stakeholder needs?"
        },
        {
          text: "Did the requirements analysis process evaluate requirements defect density and requirements volatility?"
        },
        {
          text: "Have all resolved conflicts been documented and integrated back into the baseline specifications?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "requirements analysis, quality of service economics, conflict resolution, formal analysis, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-analysis",
  trigger: "model_decision"
});
