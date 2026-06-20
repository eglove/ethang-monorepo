import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const engineeringFoundationsStatisticalAnalysis = defineRule({
  content: [
    {
      level: 1,
      text: "Engineering Foundations - Statistical Analysis",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Statistical analysis provides software engineers with the mathematical and analytical tools required to measure, model, and interpret the variability inherent in software processes and products. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 18, Section 5, software development is characterized by high levels of process and product variation. Statistical analysis allows engineers to transition from subjective observations to quantifiable conclusions, ensuring that decisions—such as predicting release readiness, evaluating defect densities, or comparing development methods—are grounded in rigorous mathematical theory rather than intuition.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Sampling Foundations and Units of Analysis",
      type: "header"
    },
    {
      text: "To perform valid statistical investigations, engineers must establish a rigorous framework for data collection, starting with key concepts:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Unit of Analysis (Sampling Unit)**: The basic entity being observed or measured in an empirical study. In software engineering, the unit of analysis must be precisely defined and aligned with the study's goals. For example, if studying developer productivity, the unit of analysis might be the individual developer. If studying code quality, the unit might be a software module, a pull request, or a single source code file."
        },
        {
          text: "**Population**: The complete set of all possible units of analysis that conform to a set of specifications. For instance, the population could be all software developers working in a specific industry, or all lines of code in a legacy system."
        },
        {
          text: "**Target vs. Study Population**: The study population is the subset from which the sample is actually drawn, whereas the target population is the broader group to which the engineer wishes to generalize the findings. A common threat to validity occurs when the study population (e.g., historical defect logs from a single team) diverges from the target population (e.g., future defects across the entire organization), rendering generalizations mathematically invalid."
        },
        {
          text: "**Sample**: A subset of the population chosen for study. The primary concern is representativeness. Probability sampling requires that every unit in the population has a known, non-zero probability of being selected, and draws are independent. This representativeness is essential for applying inductive statistics to generalize from the sample back to the population."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Random Variables, Events, and Distributions",
      type: "header"
    },
    {
      text: "An experiment in statistical terms is the process of making observations on sampling units. The attributes being measured are modeled as random variables:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Random Variables**: A random variable assigns numerical values to the outcomes of a statistical experiment. It is classified as a discrete random variable if its set of possible values is finite or countably infinite (e.g., the number of defects found in a code review). It is a continuous random variable if it can take any value on a continuous scale (e.g., the time required to resolve an incident)."
        },
        {
          text: "**Events**: A subset of the possible values of a random variable (e.g., the event that the number of defects is greater than five)."
        },
        {
          text: "**Probability Distributions**: The mathematical description of the range and pattern of variation of a random variable. Commonly occurring distributions used in engineering include:\n- **Binomial Distribution**: Models the number of successes in a fixed number of independent trials, where each trial results in success or failure, and the probability of success remains constant (e.g., modeling the probability of build failures across independent runs).\n- **Poisson Distribution**: Models the count of occurrences of an event over a specified interval of time or space, assuming events occur independently at a constant average rate (e.g., modeling defect arrivals or server request rates).\n- **Normal Distribution**: Models continuous variables influenced by many independent, additive factors. It is characterized by its symmetric bell curve, defined by its mean and standard deviation."
        },
        {
          text: "**PMF and PDF**: Discrete random variables use a Probability Mass Function (PMF) to specify the probability at discrete points. Continuous variables use a Probability Density Function (PDF), which must be integrated over an interval to find the probability that the variable falls within that range."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Statistical Estimation",
      type: "header"
    },
    {
      text: "Since population parameters (e.g., the true average defect rate of an entire organization) are typically unknown, they must be estimated from sample statistics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Estimators**: A statistic used to estimate a population parameter. An estimator is a mathematical function applied to the sample observations (e.g., the sample mean is an estimator of the population mean)."
        },
        {
          text: "**Properties of Estimators**:\n- **Lack of Bias**: An estimator is unbiased if its expected value equals the true population parameter.\n- **Consistency**: An estimator is consistent if it converges to the true population parameter as the sample size increases.\n- **Efficiency**: An estimator is efficient if it has the minimum variance among all candidate estimators, reducing the standard error of the estimate."
        },
        {
          text: "**Point vs. Interval Estimates**: A point estimate provides a single numerical value as the estimate of the parameter. Point estimates do not communicate the margin of error or the uncertainty of the estimate. Therefore, they should be supplemented with interval estimates (confidence intervals). An interval estimate defines a range computed from sample data that is expected to contain the true population parameter with a specified probability (confidence level)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Hypothesis Testing",
      type: "header"
    },
    {
      text: "Hypothesis testing is a formal procedure for determining whether sample evidence supports a specific claim about a population parameter:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Null (H0) and Alternative (H1) Hypotheses**: The null hypothesis represents the baseline assumption of no change, no difference, or no effect. The alternative hypothesis represents the engineering claim of interest."
        },
        {
          text: "**One-sided vs. Two-sided Tests**: A one-sided test evaluates a change in a specific direction (e.g., the new compiler is faster). A two-sided test evaluates any difference, regardless of direction (e.g., the execution times are different)."
        },
        {
          text: "**Critical Region**: The set of values of the test statistic for which the null hypothesis is rejected. If the computed test statistic falls within this critical region, the null hypothesis is rejected."
        },
        {
          text: "**Decision Errors**:\n- **Type I Error (Alpha)**: Rejecting the null hypothesis when it is actually true (false positive). The probability of a Type I error is denoted by alpha, typically controlled at 5%.\n- **Type II Error (Beta)**: Failing to reject the null hypothesis when it is false (false negative). The probability of a Type II error is denoted by beta.\n- **Statistical Power**: The probability of correctly rejecting a false null hypothesis (1 - beta). Engineers aim to maximize power while maintaining strict limits on alpha."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Correlation and Regression",
      type: "header"
    },
    {
      text: "Engineers frequently study the relationships between multiple variables to build predictive models:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Correlation**: Measures the degree of linear association between two variables using the correlation coefficient (ranging from -1 to +1). A correlation coefficient near +1 or -1 indicates a strong linear relationship. Engineers must remain aware that correlation does not imply causation; a statistical association between two variables does not prove that changes in one cause changes in the other."
        },
        {
          text: "**Regression Analysis**: Derives a mathematical equation to model the relationship between one or more independent variables and a dependent variable. The strength of this relationship is measured by the coefficient of determination (R-squared, ranging from 0 to 1), representing the proportion of variance in the dependent variable explained by the regression model."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Statistical Analysis Compliance Checklist",
      type: "header"
    },
    {
      text: "This checklist outlines SWEBOK-derived criteria for verifying the mathematical validity and statistical rigor of software engineering analyses:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Unit of Analysis Definition**: Is the unit of analysis (sampling unit) clearly defined, and does it align with the research goals?"
        },
        {
          text: "**Population Delineation**: Are the target population and study population explicitly defined and checked for alignment?"
        },
        {
          text: "**Probability Sampling Enforcement**: Are samples drawn using probability sampling to ensure independent and representative selections?"
        },
        {
          text: "**Sample Size Justification**: Is the sample size mathematically justified to ensure the analysis has sufficient statistical power?"
        },
        {
          text: "**Random Variable Classification**: Are random variables correctly classified as discrete or continuous to guide the choice of statistical tests?"
        },
        {
          text: "**Distribution Selection**: Is the choice of probability distribution (binomial, Poisson, normal) justified by the data properties?"
        },
        {
          text: "**PMF and PDF Application**: Are PMFs applied for discrete variables and PDFs integrated over ranges for continuous variables?"
        },
        {
          text: "**Estimator Quality Check**: Are chosen estimators evaluated for bias, consistency, and efficiency relative to the population parameters?"
        },
        {
          text: "**Confidence Interval Reporting**: Are point estimates accompanied by confidence intervals or standard errors to communicate uncertainty?"
        },
        {
          text: "**Hypothesis Pre-registration**: Are the null (H0) and alternative (H1) hypotheses formulated and recorded prior to data analysis?"
        },
        {
          text: "**Tail Direction Justification**: Is the choice of a one-sided or two-sided hypothesis test justified by the theoretical claim?"
        },
        {
          text: "**Alpha Level Control**: Is the significance level (alpha) established beforehand (typically at 5%) and controlled during testing?"
        },
        {
          text: "**Power Analysis Evaluation**: Is the statistical power (1 - beta) evaluated to minimize the risk of Type II errors?"
        },
        {
          text: "**Critical Region Verification**: Is the critical region for rejecting the null hypothesis established based on the test statistic's distribution?"
        },
        {
          text: "**Causality Assertion Check**: Does the analysis refrain from asserting causal relationships based solely on correlation coefficients?"
        },
        {
          text: "**Regression Fit Measurement**: In regression modeling, is the coefficient of determination (R-squared) calculated and reported?"
        },
        {
          text: "**Assumption Testing**: Are the mathematical assumptions of statistical tests (e.g., normality, homoscedasticity, independence) verified using diagnostics?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "statistical analysis, unit of analysis, probability sampling, random variable, binomial distribution, Poisson distribution, normal distribution, estimators, hypothesis testing, correlation, regression analysis",
  filename: "engineering-foundations-statistical-analysis",
  trigger: "model_decision"
});
