import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const economicsForProfit = defineRule({
  content: [
    {
      level: 1,
      text: "For-Profit Decision-Making",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "For-profit decision-making techniques apply to software engineering organizations whose primary goal is generating profit. In these settings, software engineering decisions must prioritize maximizing net economic value while minimizing capital expenditure and long-term operating costs. To identify the financially optimal choice from a set of mutually exclusive alternatives, engineers use incremental investment analysis and rate-of-return evaluations. These methods ensure that every unit of capital invested yields a return that exceeds the organization's opportunity cost.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 The For-Profit Decision-Making Process",
      type: "header"
    },
    {
      text: "When selecting the financially best alternative, for-profit decision-making follows a structured incremental comparison process based on marginal analysis:",
      type: "text"
    },
    {
      items: [
        {
          text: '**Arrange the Alternatives**: Sort all mutually exclusive alternatives in order of increasing initial investment. The "do-nothing" alternative is typically the baseline option with zero initial investment.'
        },
        {
          text: "**Establish the Baseline**: Assume the first alternative (the one with the smallest investment) is the current best."
        },
        {
          text: "**Compare Incrementally**: Compare the next candidate alternative against the current best. This step focuses on the difference in cost (incremental cost) and the difference in benefit (incremental benefit) between the two."
        },
        {
          text: "**Evaluate Strict Superiority**: Determine if the next candidate is strictly better than the current best. This comparison is made using the selected basis (e.g., Net Present Worth, Future Worth, or Annual Equivalent) calculated at the organization's discount rate. If the incremental yield of the extra investment exceeds the Minimum Acceptable Rate of Return (MARR), the next candidate becomes the new current best."
        },
        {
          text: "**Iterate**: Repeat this incremental comparison until all alternatives have been evaluated. The final current best is selected as the overall preferred alternative.\nThis incremental process ensures that additional capital is only invested if the marginal benefit of that extra expenditure justifies its marginal cost."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Minimum Acceptable Rate of Return",
      type: "header"
    },
    {
      text: "The Minimum Acceptable Rate of Return (MARR) is the lowest interest rate or rate of return an organization would consider a good investment. The MARR represents the organization's opportunity cost of capital: the return that could be achieved by investing the same funds in alternative, low-risk corporate activities or financial instruments. A software project or technical proposal is financially viable only if its expected Internal Rate of Return (IRR) is at least as high as the MARR. The MARR is not an arbitrary threshold; it is determined by the organization's cost of capital, debt-to-equity ratio, and the risk premium associated with the specific technical domain. Higher-risk projects, such as building a new system with unproven technologies, demand a higher MARR than low-risk system maintenance. To simplify evaluations, the MARR is typically used as the discount rate when calculating the Present Worth of a proposal's cash flow stream.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Economic Life and Frozen Assets",
      type: "header"
    },
    {
      text: "When an organization invests in software development or infrastructure, capital is tied up in the form of frozen assets. The economic impact of these frozen assets follows distinct phases:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Frozen Asset Costs**: These capital costs (e.g., initial development, hardware acquisition, setup) start high and decrease over time as the asset is utilized and depreciated."
        },
        {
          text: "**Operating and Maintenance Costs**: These operational costs (e.g., software support, hosting fees, performance tuning, and technical debt management) start low but tend to increase over time as the software degrades and requires more effort to maintain."
        },
        {
          text: "**Economic Life**: The lifespan over which the sum of the capital costs and operating costs is minimized. This is also called the minimum cost lifetime. It differs from physical life (how long the code runs) or service life (how long it is useful). Software engineers must identify the economic life of a system to determine the optimal timing for replacement or retirement, preventing organizations from keeping obsolete software past its financial efficiency limit."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Planning Horizon and Study Period",
      type: "header"
    },
    {
      text: "The planning horizon, or study period, is the shared time frame over which all alternatives in a decision are evaluated. Properly comparing alternatives with different lifespans (e.g., a system with a four-year life versus one with a six-year life) requires adjusting them to fit the same planning horizon. Common techniques for aligning lifespans include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Repeatability Assumption**: Assuming that shorter-lived assets can be replaced with identical assets at the end of their lifespan, repeating the cash flow cycle until a common multiple of years is reached (e.g., evaluating both over a twelve-year horizon)."
        },
        {
          text: "**Study Period Termination**: Setting a fixed planning horizon (e.g., five years) and assigning a terminal salvage value or shutting down operations at the end of that period, regardless of the asset's remaining life. The choice of horizon affects the accuracy of long-term software cost projections."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Replacement Decisions",
      type: "header"
    },
    {
      text: 'A replacement decision arises when an organization already owns a software system or hardware asset (the "defender") and is considering replacing it with a new alternative (the "challenger"). This is common when choosing between maintaining legacy software or redeveloping it from scratch. Replacement analysis involves:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Sunk Costs**: Money already spent on the existing system. Sunk costs cannot be recovered and must be completely ignored in the decision analysis; only future cash flows and opportunity costs matter."
        },
        {
          text: "**Salvage Value**: The net realizable value of the defender if it is retired or sold (e.g., selling server hardware, reusing code assets, or licensing the old software)."
        },
        {
          text: "**Incremental Replacement**: Evaluating whether the system should be replaced immediately, kept for another period, or replaced in smaller, incremental steps. The defender is replaced only when the challenger is shown to be financially superior."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Retirement Decisions",
      type: "header"
    },
    {
      text: "Retirement decisions involve getting out of an activity altogether without replacing the asset. Examples include deprecating a software product line, closing a digital service, or stopping support for a legacy platform. Retirement decisions can be preplanned (built into the system's lifecycle strategy) or spontaneous (triggered when performance targets are missed, customer acquisition costs spike, or operational costs rise above acceptable thresholds). Retirement decisions are heavily influenced by lock-in factors, such as customer technology dependency, contract commitments, and high exit costs.",
      type: "text"
    },
    {
      level: 3,
      text: "1.7 Inflation, Depreciation, and Income Taxes",
      type: "header"
    },
    {
      text: "To ensure high accuracy in high-consequence decisions, engineers must incorporate secondary financial factors:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Inflation or Deflation**: Changes in the purchasing power of money over time. Cash flows must be adjusted using constant-dollar or actual-dollar assumptions to ensure that future inflated expenses do not skew the analysis."
        },
        {
          text: "**Depreciation**: The systematic allocation of an asset's capital cost over its economic life. Depreciation is a non-cash expense that reduces the organization's taxable income, acting as a tax shield."
        },
        {
          text: "**Income Taxes**: The corporate taxes levied on taxable income. Because taxes represent a significant cash outflow, decisions must be based on after-tax cash flows, combining revenues, operating costs, depreciation, and tax rates. Neglecting the tax implications of software asset capitalization can lead to incorrect decisions."
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
          text: "**Financial Goal Alignment**: Has the primary goal of the proposal been verified as profit generation or net cost reduction?"
        },
        {
          text: "**Alternative Ordering**: Have all mutually exclusive alternatives been arranged in order of increasing initial investment?"
        },
        {
          text: "**Incremental Comparison Loop**: Has the incremental financial yield of each alternative been compared systematically against the baseline?"
        },
        {
          text: "**MARR Definition**: Has the organization's Minimum Acceptable Rate of Return (MARR) been identified and documented?"
        },
        {
          text: "**Discount Rate Setting**: Is the MARR used as the discount rate for all equivalence and present worth calculations?"
        },
        {
          text: "**Economic Life Calculation**: Has the economic life (minimum cost lifetime) of each alternative been calculated by balancing capital depreciation and operational costs?"
        },
        {
          text: "**Planning Horizon Selection**: Has a consistent planning horizon (study period) been established for comparing all alternatives?"
        },
        {
          text: "**Different Lifespan Adjustment**: Have alternatives with differing lifespans been normalized to the planning horizon using repeatability or study period termination?"
        },
        {
          text: "**Sunk Cost Exclusion**: Have all historical costs (sunk costs) of the existing system been excluded from the replacement analysis?"
        },
        {
          text: "**Salvage Value Inclusion**: Has the realistic salvage value or trade-in value of the defender asset been factored into the replacement decision?"
        },
        {
          text: "**Incremental Replacement Review**: Has the option of replacing the system in smaller, incremental steps been evaluated?"
        },
        {
          text: "**Retirement Trigger Identification**: Have the triggers for spontaneous retirement (e.g., SLA breaches, cost thresholds) been defined?"
        },
        {
          text: "**Lock-in Factor Evaluation**: Have technology dependencies and exit costs been factored into the retirement analysis?"
        },
        {
          text: "**Inflation Adjustment**: Have cash flows been adjusted to account for expected inflation or deflation over the planning horizon?"
        },
        {
          text: "**Depreciation Scheduling**: Has an appropriate depreciation method (e.g., straight-line or accelerated) been scheduled for capital expenditures?"
        },
        {
          text: "**After-Tax Cash Flow Analysis**: Have corporate income tax rates and tax shields from depreciation been factored in to perform an after-tax cash flow analysis?"
        },
        {
          text: "**Frozen Asset Monitoring**: Is there a plan to track and report the value of capital assets frozen in the software project?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "for profit decision making, minimum acceptable rate of return, marr, economic life, frozen assets, minimum cost lifetime, planning horizon, study period, repeatability assumption, replacement decisions, sunk costs, salvage value, defender asset, retirement decisions, technology dependency, lock in factors, inflation, depreciation, corporate income taxes, after tax cash flow analysis",
  filename: "economics-for-profit",
  trigger: "model_decision"
});
