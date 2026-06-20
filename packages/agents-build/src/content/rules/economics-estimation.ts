import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const economicsEstimation = defineRule({
  content: [
    {
      level: 1,
      text: "Software Engineering Economics: Estimation",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 The Purpose and Role of Estimation in Engineering Decisions",
      type: "header"
    },
    {
      text: "An estimate is an analytical prediction of some unknown quantity that is critical for decision-making. In software engineering, software engineers estimate a wide range of values, including project size, cost, schedule, the average number of active client sessions a cloud service must support, the number of times a function will be executed under specific loads, and the density of delivered defects in a software product. SWEBOK v4 Chapter 15 stresses that software engineers do not estimate purely for the sake of estimating. Rather, estimation is a tool to resolve uncertainty before making commitment decisions. For example, a make-or-buy decision for a particular system component relies on estimating the internal cost of building that functionality. Since the actual cost remains unknown until the system is completed, the decision must be guided by a realistic estimate. Behind every estimate lies one or more engineering or business decisions.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Inherent Uncertainty and Good-Enough Estimating",
      type: "header"
    },
    {
      text: "Because estimates are predictions of the future, they are inherently uncertain. There is always a non-zero probability that the actual outcome will differ from the estimated value. The degree of uncertainty can vary based on the completeness of requirements, the novelty of the technology stack, and the experience of the development team. However, SWEBOK v4 notes that estimates do not need to be perfect to be useful. They must only be good enough to guide the decision-maker to the correct choice. For example, if a team is deciding whether to buy a third-party library for ten thousand dollars or build it themselves, and the build cost is estimated at between fifty thousand and eighty thousand dollars, the uncertainty in the build estimate does not affect the decision. The correct decision remains to buy the library.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Professional Ethics and Uncertainty Assessments",
      type: "header"
    },
    {
      text: 'Providing estimates is not only a technical activity but also an ethical responsibility. The Software Engineering Code of Ethics and Professional Practice (specifically Clause 3.09) explicitly states that software engineers must "Ensure realistic quantitative estimates of cost, scheduling, personnel, quality and outcomes on any project on which they work or propose to work and provide an uncertainty assessment of these estimates." Bypassing this requirement by presenting single-point estimates without uncertainty bounds, or artificially lowering estimates to win a contract, represents a direct violation of professional standards. An uncertainty assessment can be expressed as a range (e.g., three to five months), a standard deviation, or a confidence interval (e.g., 90% probability of completion within six months), ensuring stakeholders make informed decisions under risk.',
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Expert Judgment and Group Estimation Processes",
      type: "header"
    },
    {
      text: "Expert judgment is an estimation technique based entirely on the professional opinion and experience of the estimator. It is the simplest and most readily available technique, especially in the early stages of a project when detailed specifications are absent. However, expert judgment is highly subjective and produces the least accurate estimates when used in isolation. To improve accuracy, individual expert opinions can be combined through structured group estimation processes. Techniques such as Wideband Delphi and Planning Poker minimize individual cognitive biases (such as optimism bias or anchoring) by facilitating iterative, anonymous, or collaborative estimation and discussion until the group converges on a consensus value.",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Estimation by Analogy: Principles and Adjustments",
      type: "header"
    },
    {
      text: "Estimation by analogy assumes that if a new project or component is similar to a completed project or component with known historical actuals, the estimate for the new item can be derived from the actual results of the previous one. The steps for estimation by analogy are:",
      type: "text"
    },
    {
      items: [
        {
          text: "Understand the characteristics of the target system to be estimated."
        },
        {
          text: "Identify a suitable historical analogy for which accurate actual results are known."
        },
        {
          text: "List the structural, functional, or technical differences between the new target and the historical analogy."
        },
        {
          text: "Estimate the physical or complexity magnitude of each identified difference."
        },
        {
          text: "Calculate the final estimate by adjusting the historical actuals by the calculated differences.\nAnalogy-based estimation is faster and more accurate than expert judgment, but its viability is strictly dependent on the availability of a high-quality database of historical projects."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.6 Decomposition and Bottom-Up Estimation Mechanics",
      type: "header"
    },
    {
      text: "Decomposition, also referred to as bottom-up estimation, requires breaking the target system down into successively smaller and more manageable pieces until the lowest-level components can be estimated with high confidence. The steps are:",
      type: "text"
    },
    {
      items: [
        {
          text: "Decompose the system into a work breakdown structure or component hierarchy."
        },
        {
          text: "Estimate the effort, size, or cost for each of the lowest-level components."
        },
        {
          text: "Sum the individual estimates to construct the aggregate estimate for the entire system."
        },
        {
          text: "Apply explicit adjustment factors to account for cross-cutting tasks (such as requirements engineering, integration, system testing, and documentation) that are not captured at the individual component level.\nThe principal assumption of decomposition is that overestimates and underestimates of individual pieces will cancel each other out, leading to a highly accurate total. However, decomposition requires significant effort and is susceptible to systematic bias if the bottom-level estimators are consistently optimistic or pessimistic."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.7 Parametric and Statistical Estimation Models",
      type: "header"
    },
    {
      text: "Parametric estimation, or statistical estimation, leverages known mathematical relationships between the quantity being estimated and one or more observable independent variables (cost drivers). The model is represented as an equation where counted variables (such as source lines of code, function points, or database tables) are plugged in to calculate the dependent variable (such as effort, cost, or duration). Parametric models are highly accurate, repeatable, and easily defensible because they are grounded in objective historical data and statistical correlation analysis. The primary challenge is that developing and calibrating a parametric model requires a large, consistent historical baseline and advanced statistical expertise.",
      type: "text"
    },
    {
      level: 3,
      text: "1.8 The Power of Multiple Estimates: Convergence and Divergence Analysis",
      type: "header"
    },
    {
      text: "When the consequences of a wrong decision are minor, a single estimate using a single technique may suffice. However, when the business or technical consequences of a decision are significant, software engineers should develop multiple independent estimates using different techniques (e.g., comparing an analogy-based estimate with a parametric estimate) and possibly different estimators.\nOnce the estimates are generated, engineers perform convergence and divergence analysis:",
      type: "text"
    },
    {
      items: [
        {
          text: "Convergence: If the independent estimates are close to one another, it suggests that the underlying assumptions are stable, the estimators are aligned, and the resulting range is highly reliable."
        },
        {
          text: "Divergence: If the estimates differ significantly, it indicates that one or more critical factors, hidden assumptions, or project risks have been overlooked by one of the methods. Analyzing the root cause of the divergence and re-estimating to achieve convergence leads to a much more robust estimate and a safer decision."
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
          text: "Was the specific engineering or business decision that depends on the estimate explicitly identified before beginning the estimation process?"
        },
        {
          text: "Did the estimation team ensure that they are not estimating purely for the sake of estimating, but to resolve a defined decision uncertainty?"
        },
        {
          text: "Have estimates been generated for non-cost quantities when critical to quality (e.g., active sessions, function call frequencies, delivered defects)?"
        },
        {
          text: "Did the estimation output include a formal assessment of uncertainty in compliance with IEEE/ACM Code of Ethics Clause 3.09?"
        },
        {
          text: "Was the uncertainty of the estimate expressed quantitatively as a range, standard deviation, or confidence interval?"
        },
        {
          text: "If expert judgment was used, was it supported by a group process (such as Wideband Delphi or Planning Poker) to reduce cognitive bias?"
        },
        {
          text: "When using estimation by analogy, was a documented historical project with verified actual results selected as the baseline?"
        },
        {
          text: "Were the specific differences between the target project and the analogy formally listed and quantitatively adjusted?"
        },
        {
          text: "Has the system been decomposed into sufficiently small components to allow for bottom-up estimation?"
        },
        {
          text: "Were explicit allowances added to the bottom-up sum to account for cross-cutting lifecycle activities (integration, testing, documentation)?"
        },
        {
          text: "Did the team verify that the bottom-up estimates do not suffer from systemic high or low bias that would prevent the canceling effect?"
        },
        {
          text: "If a parametric model was used, were the input parameters (e.g., size metrics, complexity factors) counted using a standardized, validated method?"
        },
        {
          text: "Was the parametric estimation equation calibrated using historical data specific to the organization's development environment?"
        },
        {
          text: "Were multiple independent estimation techniques applied to the same target to check for convergence or divergence?"
        },
        {
          text: "Did the team perform a formal root-cause analysis on any diverging estimates to identify hidden assumptions or overlooked risks?"
        },
        {
          text: "Have the estimates and their corresponding uncertainty assessments been formally communicated to project decision-makers?"
        },
        {
          text: "Is there a process in place to record actual project outcomes to update the historical estimation baseline for future analogy and parametric models?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software engineering economics, estimation, uncertainty assessment, Code of Ethics, expert judgment, Wideband Delphi, Planning Poker, analogy estimation, decomposition, bottom-up, parametric estimation, multiple estimates, convergence, divergence",
  filename: "economics-estimation",
  trigger: "model_decision"
});
