import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsDiscreteProbability = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations - Discrete Probability",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Discrete probability is the mathematical description of random phenomena where the set of possible outcomes is finite or countably infinite. In software engineering, as highlighted in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 17, Section 9, discrete probability is essential for analyzing network congestion, modeling server request arrival patterns, designing randomized algorithms, estimating system reliability, and assessing risk in project management. Grounding software analysis in probability theory enables engineers to design robust, fault-tolerant architectures that operate predictably in uncertain environments.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Probability and Randomness",
      type: "header"
    },
    {
      text: "A phenomenon is classified as random if individual outcomes are uncertain, but the long-term pattern of many individual outcomes is predictable. The probability of any outcome for a random phenomenon represents the proportion of times that specific outcome would occur in a very long series of repetitions.",
      type: "text"
    },
    {
      text: "A probability model is a mathematical description of a random phenomenon consisting of two parts:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Sample Space**: Indicated by the symbol S, the sample space is the set of all possible outcomes."
        },
        {
          text: "**Probability Assignment**: A rule that assigns a real number between zero and one to each event in the sample space. An event is a subset of the sample space representing a possible outcome or a set of outcomes."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Any probability P(A) of an event A satisfies the fundamental axioms of probability:",
      type: "text"
    },
    {
      items: [
        {
          text: "The probability must be a number between zero and one: 0 is less than or equal to P(A), and P(A) is less than or equal to 1."
        },
        {
          text: "The probability of the entire sample space S must equal one: P(S) = 1. All possible outcomes together must sum to a probability of one."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Two events are disjoint or mutually exclusive if they have no outcomes in common, meaning they can never occur together. If A and B are two disjoint events, the probability that either A or B occurs is the sum of their individual probabilities:\nP(A or B) = P(A) + P(B)",
      type: "text"
    },
    {
      text: "This is the addition rule for disjoint events, which generalizes to any finite number of pairwise disjoint events.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Conditional Probability, Independence, and Bayes' Theorem",
      type: "header"
    },
    {
      text: "In many software applications, the probability of an event must be updated based on new information or preceding events.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Conditional Probability**: The conditional probability of an event A given that event B has occurred is denoted by P(A|B) and calculated as:\nP(A|B) = P(A intersection B) / P(B), assuming P(B) is greater than zero.\n"
        },
        {
          text: "**Independence**: Two events A and B are independent if the occurrence of one does not change the probability of the occurrence of the other. Mathematically, they are independent if:\nP(A|B) = P(A) and P(B|A) = P(B)"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "This leads to the multiplication rule for independent events, stating that the probability of both events occurring simultaneously is the product of their individual probabilities:\nP(A and B) = P(A) * P(B)",
      type: "text"
    },
    {
      items: [
        {
          text: "**Bayes' Theorem**: Bayes' Theorem relates conditional and marginal probabilities, allowing engineers to calculate the probability of a cause given an observed effect:\nP(A|B) = [P(B|A) * P(A)] / P(B)"
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Bayes' Theorem is the foundation of spam filtering, diagnostic tools, and machine learning classifiers that predict system health from incomplete telemetry data.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Random Variables",
      type: "header"
    },
    {
      text: "A random variable is a function or rule that assigns a real number to each outcome in a sample space. In notation, an uppercase letter (such as X) represents the name of the random variable, while its lowercase counterpart (such as x) represents a specific value the random variable can take. The probability that X equals x is written as P(X = x) or P(x).",
      type: "text"
    },
    {
      text: "Random variables are classified as discrete or continuous:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Discrete Random Variables**: A discrete random variable can hold a countable number of distinct values. Even if the set of values is infinite, they can be listed sequentially (e.g., the number of HTTP requests arriving at a server)."
        },
        {
          text: "**Continuous Random Variables**: A continuous random variable can take an infinite, uncountable number of values, typically representing measurements on a continuous interval (e.g., the execution time of a database query or the physical temperature of a processor)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Probability Distributions and Mass Functions",
      type: "header"
    },
    {
      text: "A Probability Distribution Function (PDF), or Probability Mass Function (PMF) in the discrete context, is a table, formula, or graph that describes the values of a random variable and the probabilities associated with these values.",
      type: "text"
    },
    {
      text: "The probabilities associated with any discrete random variable X must satisfy two properties:",
      type: "text"
    },
    {
      items: [
        {
          text: "The probability of each value x must be between zero and one: 0 is less than or equal to P(x), and P(x) is less than or equal to 1."
        },
        {
          text: "The sum of all probabilities over the entire support of the random variable must equal exactly one: sum of P(x) = 1."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Common discrete probability distributions used in software engineering include the Bernoulli distribution (success/failure events), the Binomial distribution (number of successes in fixed trials), the Geometric distribution (number of trials until the first success), and the Poisson distribution (number of events occurring in a fixed interval of time or space).",
      type: "text"
    },
    {
      level: 3,
      text: "1.5 Expected Value, Variance, and the Law of Large Numbers",
      type: "header"
    },
    {
      text: "To analyze and predict system behavior over time, engineers rely on the summary statistics of probability distributions.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Expected Value (Mean)**: The mean, denoted by the symbol mu, of a discrete probability distribution is the weighted average of all possible outcomes, where the weights are the probabilities of the outcomes. For possible outcomes x1, x2, ..., xn with corresponding probabilities p1, p2, ..., pn, the mean is:\nmu = x1 * p1 + x2 * p2 + ... + xn * pn\n"
        },
        {
          text: "**Variance**: The variance, denoted by sigma squared, measures the spread or dispersion of the random variable's values around the mean. It is calculated as the expected value of the squared deviations from the mean:\nsigma squared = (x1 - mu)^2 * p1 + (x2 - mu)^2 * p2 + ... + (xn - mu)^2 * pn\n"
        },
        {
          text: "**Standard Deviation**: The standard deviation, denoted by sigma, is the square root of the variance. It provides a measure of dispersion in the same units as the random variable itself."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "These metrics support the Law of Large Numbers, which states that the average value of a random variable obtained from a large number of independent, identical trials will converge to the expected value (mean) as the number of trials increases. In software performance testing, this principle guarantees that load testing metrics (such as average response time) become more accurate and representative as the test duration and request volume increase.",
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
          text: "**Sample Space Completeness**: Has the sample space for all discrete state models been fully defined to ensure no possible outcomes are omitted?"
        },
        {
          text: "**Probability Mass Constraint**: Do the assigned probabilities of all mutually exclusive events in the distribution sum to exactly 1.0, accounting for floating-point precision?"
        },
        {
          text: "**PRNG Suitability Evaluation**: Has the random number generator been selected based on the requirements of the domain (e.g., cryptographically secure vs. statistically uniform)?"
        },
        {
          text: "**Disjoint Event Addition**: When using the addition rule, has it been verified that the events are strictly disjoint to prevent double-counting probabilities?"
        },
        {
          text: "**Independent Event Verification**: Before multiplying probabilities for sequential events, has their statistical independence been mathematically verified?"
        },
        {
          text: "**Conditional Division Guardrails**: In conditional probability calculations, does the system guard against division-by-zero when the conditioning event has a probability of zero?"
        },
        {
          text: "**Bayesian Classification Priors**: When using Bayes' Theorem for diagnostics, are the prior probabilities updated regularly to reflect real-world operational distributions?"
        },
        {
          text: "**Discrete vs. Continuous Data Type Mapping**: Have variables representing execution times or memory sizes been mapped to continuous distributions rather than discrete models?"
        },
        {
          text: "**Poisson Distribution Application**: When modeling request arrivals or network packet traffic, has the Poisson distribution model been validated against real traffic logs?"
        },
        {
          text: "**Expected Value Bounds Checking**: Have Expected Value calculations been audited to ensure they do not exceed physical system resource capacities?"
        },
        {
          text: '**Variance and SLA Drift**: Has the variance of response times been calculated to ensure that high-standard-deviation "tail latency" does not violate Service Level Agreements?'
        },
        {
          text: "**Law of Large Numbers Convergence**: Has the sample size for performance benchmarks been calculated to guarantee convergence within a specified margin of error?"
        },
        {
          text: "**Randomized Algorithm Failure Bounds**: When using randomized algorithms, has the probability of worst-case execution time or failure been bounded below acceptable thresholds?"
        },
        {
          text: "**Geometric Distribution for Retry Limits**: Has the Geometric distribution been used to model the probability of success over successive API retries to determine optimal retry limits?"
        },
        {
          text: "**Binomial Success Modeling**: When testing redundant hardware nodes, has the Binomial distribution been applied to compute the probability of system survival given a node failure rate?"
        },
        {
          text: "**Standard Deviation Range Checking**: Are outlier telemetry points defined using standard deviation thresholds (e.g., three-sigma limits) to trigger alerts?"
        },
        {
          text: "**Telemetry Ingestion Sampling**: If using random sampling for high-throughput logging, does the sampling rate preserve the underlying probability distribution characteristics?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "discrete probability, random variable, expected value, variance, probability distribution, bayes theorem",
  filename: "mathematical-foundations-discrete-probability",
  trigger: "model_decision"
});
