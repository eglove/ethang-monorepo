import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const economicsMultipleAttribute = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Economics: Multiple-Attribute Decision-Making",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 Foundations of Multiple-Attribute Decision-Making (MADM)",
      type: "header"
    },
    {
      text: "Within software engineering economics, as described in SWEBOK v4 Chapter 15, most traditional decision-making models evaluate alternatives using a single monetary criterion (e.g., maximizing present worth, minimizing cost, or selecting the highest internal rate of return). However, real-world software engineering decisions are rarely governed by financial metrics alone. Aside from basic technical feasibility, engineers must frequently weigh multiple competing nonmonetary criteria—such as security, usability, maintainability, scalability, vendor reputation, developer experience, and licensing constraints.",
      type: "text"
    },
    {
      text: "Multiple-Attribute Decision-Making (MADM) provides formal, structured techniques for incorporating nonmonetary criteria into the selection process. These techniques are essential when evaluating complex software architectures, cloud services, development frameworks, or third-party libraries where a purely financial comparison would omit critical quality characteristics. MADM methods are broadly classified into two categories: compensatory techniques and non-compensatory techniques.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Compensatory Techniques (Single-Dimensioned)",
      type: "header"
    },
    {
      text: "Compensatory techniques, also referred to as single-dimensioned techniques, collapse multiple diverse criteria into a single, unified figure of merit (a score or index) for each alternative. This category is called compensatory because a low score in one criterion can be compensated by—or traded off against—a exceptionally high score in another criterion. For example, a software library with poor documentation might still be chosen if it offers unmatched performance and low memory utilization.",
      type: "text"
    },
    {
      text: "Key compensatory methods include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Nondimensional Scaling**: Normalizes raw attribute measurements (which may have different units, such as seconds, megabytes, or subjective ratings) into a common dimensionless scale (typically 0 to 1 or 0 to 100) to allow direct comparison and aggregation."
        },
        {
          text: "**Additive Weighting**: Assigns a weight (w_j) to each attribute representing its relative importance, and multiplies this weight by the normalized score (s_ij) of alternative i on attribute j. The overall score (S_i) for each alternative is the sum of these weighted products:"
        }
      ],
      type: "numberedList"
    },
    {
      text: "S_i = Sum_{j=1..m} (w_j * s_ij)",
      type: "text"
    },
    {
      text: "Specifically, for a benefit-oriented attribute where a higher score is preferred (such as system throughput or reliability), the raw score r_ij is normalized to s_ij using:",
      type: "text"
    },
    {
      text: "s_ij = (r_ij - min(r_ij)) / (max(r_ij) - min(r_ij))",
      type: "text"
    },
    {
      text: "For a cost-oriented attribute where a lower score is preferred (such as latency or page load time), the raw score is normalized using:",
      type: "text"
    },
    {
      text: "s_ij = (max(r_ij) - r_ij) / (max(r_ij) - min(r_ij))",
      type: "text"
    },
    {
      text: "This normalization scales all values to a dimensionless range [0, 1], where 1.0 represents the best performance and 0.0 represents the worst performance among the evaluated set.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Analytic Hierarchy Process (AHP)**: Decomposes a complex decision into a hierarchical structure of goals, criteria, sub-criteria, and alternatives. Decision-makers perform pairwise comparisons between elements at each level of the hierarchy, yielding a mathematically rigorous weight distribution and consistency check. AHP, formulated by Thomas Saaty, involves constructing a pairwise comparison matrix A where the element a_kl represents the relative importance of attribute k over attribute l on a scale of 1 to 9. The priority vector (weights) is derived by finding the principal eigenvector of A associated with the largest eigenvalue lambda_max. To ensure the decision-maker's judgments are transitive and logical, AHP computes a Consistency Index (CI):"
        }
      ],
      type: "numberedList"
    },
    {
      text: "CI = (lambda_max - m) / (m - 1)",
      type: "text"
    },
    {
      text: "where m is the number of attributes. The Consistency Ratio (CR) is then calculated as CR = CI / RI, where RI is the Random Index (the average CI of randomly generated matrices). A CR <= 0.10 is required to accept the pairwise weights; if CR > 0.10, the comparisons are inconsistent and the decision-maker must re-evaluate their pairwise inputs.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Gilb's Impact Estimation**: A structured method that maps proposed engineering designs to specific, quantified performance and cost targets, estimating the percentage impact of each design alternative on each goal."
        },
        {
          text: '**Architectural Tradeoff Analysis Method (ATAM)**: Developed by the Software Engineering Institute (SEI), ATAM is a specialized compensatory method focused on evaluating software designs. It helps stakeholders identify tradeoffs among quality attributes (e.g., how a security enhancement affects system latency) and locate sensitivity points and risks in the architecture. Quality attributes are structured in a Utility Tree, which prioritizes quality attributes (like performance, security, modifiability) using scenarios. During evaluation, architects map design decisions to quality attribute achievements, identifying "Sensitivity Points" (architectural parameters that significantly impact a quality attribute, such as database connection pool size on query latency) and "Tradeoff Points" (architectural decisions that affect multiple attributes in opposite directions, such as end-to-end encryption which increases security but increases execution latency). By exposing these relationships, ATAM structures the compensatory trade-off discussion among stakeholders.'
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.3 Non-Compensatory Techniques (Fully Dimensioned)",
      type: "header"
    },
    {
      text: "Non-compensatory techniques, also referred to as fully dimensioned techniques, do not allow tradeoffs among different criteria. Each attribute is treated as an independent, non-negotiable entity in the evaluation process. A poor score in a high-priority attribute cannot be offset by a perfect score in other attributes. These methods are particularly useful for enforcing security baselines, regulatory compliance, or strict performance thresholds.",
      type: "text"
    },
    {
      text: "Key non-compensatory methods include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Dominance**: A screening technique where an alternative is eliminated if there is another alternative that performs better or equal in every single attribute, and strictly better in at least one. Dominant alternatives represent the Pareto-optimal frontier. For example, suppose alternative A has 99.9% uptime and costs $100/month, and alternative B has 99% uptime and costs $150/month. Alternative A strictly dominates B, allowing B to be pruned from the decision space immediately."
        },
        {
          text: "**Satisficing**: Establishes a minimum acceptable threshold (a cutoff value) for each attribute. Any alternative that fails to meet the threshold for even a single attribute is immediately rejected, regardless of its performance on other attributes. For example, a cloud database might be rejected if its uptime SLA is below 99.9%, even if it is free and performs well. Satisficing acts as a boolean conjunctive filter, ensuring that all chosen options meet the absolute baseline before any trade-offs are considered."
        },
        {
          text: "**Lexicography**: Ranks all decision attributes in order of relative importance. The alternatives are compared first on the highest-priority attribute. The alternative with the best score on this primary attribute is selected. If there is a tie, the tied alternatives are compared on the second-highest priority attribute, and the process repeats until the tie is broken. Lexicographical ordering is useful when there is a clear, non-negotiable dominant quality attribute."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.4 Selection and Hybrid Strategies",
      type: "header"
    },
    {
      text: "Choosing between compensatory and non-compensatory approaches depends on the critical nature of the requirements:",
      type: "text"
    },
    {
      items: [
        {
          text: "If a project has strict security or regulatory constraints, non-compensatory techniques (such as satisficing) should be applied first to filter out non-compliant options."
        },
        {
          text: "Once a compliant subset of alternatives is identified, compensatory techniques (such as additive weighting or AHP) can be used to score and rank the remaining options based on subjective trade-offs."
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
          text: "Have all nonmonetary decision criteria (such as security, usability, maintainability, and scalability) been identified and documented alongside financial metrics?"
        },
        {
          text: "Was the decision-making framework classified as either compensatory (allowing tradeoffs) or non-compensatory (forbidding tradeoffs) based on the project requirements?"
        },
        {
          text: "If a compensatory technique was selected, were the raw scores normalized using nondimensional scaling to ensure they can be compared directly?"
        },
        {
          text: "Were weights assigned to the attributes in the additive weighting model, and does the sum of all attribute weights equal 1.0 (or 100%)?"
        },
        {
          text: "If using the Analytic Hierarchy Process (AHP), were pairwise comparisons performed systematically, and was the consistency ratio checked to ensure logical integrity?"
        },
        {
          text: "Has Gilb's Impact Estimation been utilized to estimate the quantitative impact of design proposals against defined system performance and cost goals?"
        },
        {
          text: "When evaluating software architectures, was the SEI's Architectural Tradeoff Analysis Method (ATAM) applied to identify quality attribute trade-offs and sensitivity points?"
        },
        {
          text: "If non-compensatory techniques were chosen, was the dominance technique applied to eliminate alternatives that are strictly inferior in all attributes?"
        },
        {
          text: "Was the satisficing technique applied by defining minimum acceptable threshold cutoffs for each attribute (e.g., minimum security standards or availability SLAs)?"
        },
        {
          text: "Were all alternatives that failed to meet any single satisficing threshold documented and excluded from further consideration?"
        },
        {
          text: "If utilizing the lexicography method, were all decision attributes ranked in a strict, linear order of relative importance?"
        },
        {
          text: "In the lexicography model, did the evaluation proceed sequentially from the highest-priority attribute to lower-priority attributes to break ties?"
        },
        {
          text: "Was a hybrid approach used where non-compensatory satisficing was applied first to filter candidates, followed by compensatory weighting to rank the survivors?"
        },
        {
          text: "Were the stakeholders (e.g., developers, product managers, security officers) consulted to define the attributes, weights, and satisficing thresholds?"
        },
        {
          text: "Has a sensitivity analysis been conducted to verify how changes in attribute weights or normalization scales would affect the final decision?"
        },
        {
          text: "Are all data sources, attribute definitions, weighting methodologies, and evaluation matrices archived to provide a clear decision rationale?"
        },
        {
          text: "Was the final multiple-attribute decision matrix and recommendation formally signed off by the engineering and product leadership?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering economics, multiple attribute decision making, compensatory techniques, non compensatory techniques, analytic hierarchy process, architectural tradeoff analysis method, Gilbs impact estimation, satisficing, dominance, lexicography",
  filename: "economics-multiple-attribute",
  trigger: "model_decision"
});
