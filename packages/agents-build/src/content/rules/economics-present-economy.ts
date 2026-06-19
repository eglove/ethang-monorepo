import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const economicsPresentEconomy = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Economics: Present Economy Decision-Making",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 Foundations of Present Economy Decision-Making",
      type: "header"
    },
    {
      text: "Within software engineering economics, as structured in SWEBOK v4 Chapter 15, decision-making is broadly divided based on the relevance of the time-value of money. While long-term strategic decisions require future economy analysis (which incorporates compounding interest, inflation, and discount rates over a multi-year planning horizon), short-term or immediate operational choices are governed by present economy decision-making. Present economy analysis applies when the economic effects of all alternatives occur within a single, short time frame (typically under one year), or when the timing of cash flows is identical across all options, rendering the time-value of money negligible.",
      type: "text"
    },
    {
      text: "In present economy decisions, the software engineer does not need to compute present worth, future worth, or the internal rate of return. Instead, the focus is on identifying and comparing immediate cost and benefit structures. These analyses are essential for tactical software engineering decisions, such as selecting subscription tiers for developer tools, choosing cloud runtime environments, deciding between third-party software libraries, or selecting optimal algorithms. The primary analytical tools used in present economy decisions are break-even analysis and optimization analysis.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Break-Even Analysis",
      type: "header"
    },
    {
      text: "Break-even analysis is a mathematical technique used to compare two or more software proposals by identifying the point at which their cost functions are equal. Each proposal is described by a cost function that relates total cost to a specific independent variable representing the level of activity or usage (e.g., number of transactions, active users, gigabytes of storage, or compute hours).",
      type: "text"
    },
    {
      text: "A typical break-even model compares:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Alternative A**: Low fixed cost but high variable (incremental) cost per unit of activity."
        },
        {
          text: "**Alternative B**: High fixed cost but low variable (incremental) cost per unit of activity."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "The cost functions can be expressed linearly as:",
      type: "text"
    },
    {
      text: "TC_A = FC_A + (VC_A * x)\nTC_B = FC_B + (VC_B * x)",
      type: "text"
    },
    {
      text: "Where:",
      type: "text"
    },
    {
      items: [
        {
          text: "TC represents the total cost."
        },
        {
          text: "FC represents the fixed cost (independent of activity level)."
        },
        {
          text: "VC represents the variable cost per unit of activity."
        },
        {
          text: "x represents the activity level."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "The break-even point (x_be) is the activity level where TC_A = TC_B. Solving for x:",
      type: "text"
    },
    {
      text: "x_be = (FC_B - FC_A) / (VC_A - VC_B)",
      type: "text"
    },
    {
      text: "Below the break-even point (x < x_be), the alternative with the lower fixed cost (Alternative A) is the lower-cost choice. Above the break-even point (x > x_be), the alternative with the lower variable cost (Alternative B) is preferred. By comparing the organization's expected activity level to the calculated break-even point, the software engineer can make an economically sound selection.",
      type: "text"
    },
    {
      text: "To illustrate, consider a numerical comparison for cloud computing options. Alternative A (Serverless Functions) has a fixed cost of $0 per month and a variable cost of $0.00001 per execution. Alternative B (Dedicated Container Instance) has a fixed cost of $50 per month (regardless of use) and a variable cost of $0.000001 per execution (reflecting minimal incremental network bandwidth and storage costs). Solving for the break-even point:",
      type: "text"
    },
    {
      text: "x_be = (50 - 0) / (0.00001 - 0.000001) = 50 / 0.000009 = approximately 5,555,556 executions per month",
      type: "text"
    },
    {
      text: "If the software system is expected to receive more than 5.56 million executions per month, Alternative B is the more economical choice. If usage is lower, Alternative A is preferred. Beyond these financial values, other operational parameters (such as cold-start latency under Alternative A or operating system maintenance and patching overhead for Alternative B) must be factored in as additional constraints or attributes, linking this decision directly to multiple-attribute decision-making.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Break-Even Decisions in Software Engineering",
      type: "header"
    },
    {
      text: "Break-even analysis is highly relevant to modern software architecture and operations:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Cloud Service Provider Selection**: Choosing between serverless computing (which has zero fixed cost but a high incremental cost per execution) and dedicated virtual machines (which have a high fixed monthly cost but zero incremental cost per execution up to the VM's capacity limit). The break-even point is the number of executions where the costs align."
        },
        {
          text: "**In-House Development vs. Commercial Off-The-Shelf (COTS)**: Deciding whether to build a custom module in-house (high upfront fixed development cost, low variable support cost) or license a third-party commercial service (low upfront integration cost, high recurring license fee per user)."
        },
        {
          text: "**Data Center vs. Public Cloud Hosting**: Comparing the cost of hosting applications on on-premise hardware (high initial capital expenditure for servers, lower variable network costs) against hosting in the public cloud (low setup cost, variable usage-based operational expenditures)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Sensitivity Analysis and Margin of Safety in Present Economy",
      type: "header"
    },
    {
      text: "In present economy decisions, because the future usage levels and variable costs are estimates rather than known constants, it is critical to perform sensitivity analysis. Sensitivity analysis studies how variations in key inputs (such as expected transaction volume, API rate changes, or developer salaries) affect the final decision. By perturbing the input variables by set percentages (e.g., +/- 10%, 20%, or 50%), the engineer can identify the stability of the selection.",
      type: "text"
    },
    {
      text: "A key metric derived from this is the Margin of Safety (MS), which measures how much the expected activity level can deviate from the break-even point before the chosen alternative becomes suboptimal. It is formulated as:",
      type: "text"
    },
    {
      text: "MS = (Expected Volume - Break-Even Volume) / Expected Volume",
      type: "text"
    },
    {
      text: "A small Margin of Safety (e.g., MS < 5%) indicates a high-risk decision where minor shifts in user traffic could make the chosen hosting model financially inefficient. Conversely, a large Margin of Safety (e.g., MS > 30%) provides confidence that the selected option will remain the most economical choice even under unexpected usage spikes or declines.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Optimization Analysis",
      type: "header"
    },
    {
      text: "Optimization analysis involves studying one or more cost or utility functions over a range of values to identify the point where the overall cost is minimized or the net benefit is maximized. Unlike break-even analysis, which compares discrete alternatives, optimization analysis searches a continuous design space to find the mathematically optimal value of a key decision variable.",
      type: "text"
    },
    {
      text: "In software engineering, cost functions are often non-linear due to economies of scale, resource constraints, or performance bottlenecks. The optimization process requires:",
      type: "text"
    },
    {
      items: [
        {
          text: "Formulating the objective function (the cost or benefit function to be optimized)."
        },
        {
          text: "Identifying the constraints (e.g., memory limits, network bandwidth, SLA response times)."
        },
        {
          text: "Utilizing mathematical techniques, such as differential calculus or linear programming, to find the minimum of the cost function."
        }
      ],
      type: "numberedList"
    },
    {
      text: "For a continuous, differentiable cost function C(x), the minimum is found by setting the first derivative to zero (dC/dx = 0) and verifying that the second derivative is positive (d2C/dx2 > 0).",
      type: "text"
    },
    {
      text: "As a concrete example, when modeling memory caching, the cache hit rate and execution speed follow a logarithmic growth curve H(m) = c * ln(m) against memory size m, while hardware memory cost M(m) = d * m scales linearly. Optimization analysis finds the sweet spot where the marginal value of faster execution matches the marginal cost of additional memory.",
      type: "text"
    },
    {
      level: 3,
      text: "1.6 Resource Optimization and Space-Time Trade-offs",
      type: "header"
    },
    {
      text: "A classic application of optimization analysis in software engineering is the space-time trade-off. This trade-off arises when an algorithm can be made to run faster (reducing execution time or CPU cost) by utilizing more memory (increasing storage cost), or vice versa.",
      type: "text"
    },
    {
      text: "Examples include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Caching**: Storing precomputed query results in memory (high RAM footprint/cost) to avoid repeating expensive database queries or CPU-intensive computations (lower compute cost and lower latency)."
        },
        {
          text: "**Compression**: Compressing data before transmission over a network. This increases CPU usage at the sender and receiver ends (compute cost) but reduces the amount of data transmitted (network bandwidth cost)."
        },
        {
          text: "**Database Indexing**: Creating indexes on database columns accelerates read queries (reducing query run time) but increases database storage requirements and slows down write operations (higher storage and update costs)."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Optimization analysis allows software engineers to assign monetary values to CPU cycles, memory allocation, and bandwidth, balancing the value of faster execution against the cost of the additional hardware resources required to achieve it.",
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
          text: "Has it been verified that the decision does not involve the time-value of money (i.e., all cash flows occur in the short term, or have identical timing), justifying present economy analysis?"
        },
        {
          text: "Were the cost structures for each alternative decomposed into fixed costs (independent of usage) and variable costs (dependent on activity level)?"
        },
        {
          text: "Was the unit of activity or usage level (e.g., compute hours, user licenses, transactions) clearly defined and quantified for the analysis?"
        },
        {
          text: "Was a break-even analysis performed to find the usage level where the total costs of the alternatives are equal?"
        },
        {
          text: "Has the organization's expected usage level been estimated and compared against the calculated break-even point to identify the lower-cost alternative?"
        },
        {
          text: "If non-linear cost functions are present (e.g., tiered pricing, bulk discounts), were they modeled accurately in the break-even calculations?"
        },
        {
          text: "For build-versus-buy decisions, were both the upfront development/integration costs and the long-term support/maintenance costs included in the evaluation?"
        },
        {
          text: "Was an optimization analysis conducted to find the design parameter that minimizes the overall cost of the software configuration?"
        },
        {
          text: "Were the physical and operational constraints of the system (such as latency requirements, memory limits, and bandwidth budgets) defined as constraints in the optimization model?"
        },
        {
          text: "Has the classic software space-time trade-off (computation speed versus memory footprint) been analyzed and optimized for the target runtime environment?"
        },
        {
          text: "Were monetary values assigned to system resources (e.g., CPU, RAM, disk, network bandwidth) to enable a unified cost optimization analysis?"
        },
        {
          text: "Was the impact of data caching or precomputation evaluated against the cost of the additional memory resources required?"
        },
        {
          text: "Did the analysis compare the network bandwidth savings of data compression against the additional CPU compute costs incurred at runtime?"
        },
        {
          text: "Were database indexing strategies optimized by balancing query performance improvements against storage overhead and write performance penalties?"
        },
        {
          text: "Has the sensitivity of the decision been tested against variations in the expected usage level (sensitivity analysis)?"
        },
        {
          text: "Are all formulas, variables, and cost assumptions documented to ensure that the present economy analysis is reproducible by other team members?"
        },
        {
          text: "Was the present economy decision reviewed and approved by the appropriate technical lead or product owner?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering economics, present economy decision making, break even analysis, optimization analysis, cost functions, space time trade off, resource optimization, cloud providers",
  filename: "economics-present-economy",
  trigger: "model_decision"
});
