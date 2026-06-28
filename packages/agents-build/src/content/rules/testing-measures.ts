import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const testingMeasures = defineRule({
  content: [
    {
      level: 1,
      text: "Software Test-Related Measures",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software test-related measures provide the quantitative foundation required to plan, monitor, evaluate, and optimize validation activities. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5, Section 4, measurement is essential to determine whether testing objectives have been met and to evaluate both the system under test (SUT) and the effectiveness of the testing process itself. In engineering practice, test-related measures are split into two primary categories: measures that evaluate the quality, reliability, and defect density of the SUT based on observed test outputs, and measures that evaluate the thoroughness, coverage, and fault-detection capability of the test suites themselves. Without objective measurement, stopping criteria remain subjective, increasing the risk of releasing defect-prone software.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Evaluation of the SUT (system Under Test)",
      type: "header"
    },
    {
      text: "Evaluating the SUT during testing involves monitoring execution results to assess runtime behavior, predict future operational reliability, and manage release readiness:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Key Performance Indicators (KPIs) and DevOps Metrics**: Standardized indicators are used to evaluate SUT performance against expectations. These KPIs integrate measures, evaluation methods, data analysis, and reporting structures to guide project stakeholders. In DevOps and modern Continuous Delivery pipelines, key measures like deployment frequency, lead time for changes, mean time to recovery (MTTR), and change failure rate are monitored to evaluate the stability and velocity of testing and integration processes. MTTR measures how quickly hotfixes are deployed after failures bypass regression gates, while the change failure rate directly reflects the quality and preventive capacity of the test suite."
        },
        {
          text: "**Fault Types, Classification, and Statistics**: Effective SUT evaluation requires classifying discovered faults using structured taxonomies, such as Orthogonal Defect Classification (ODC), or quality-attribute-specific defect classifications (e.g., usability defect taxonomies, security vulnerability databases, and privacy risks). ODC maps semantic attributes of defects (including the activity during which the defect was injected, the trigger that exposed it, and the correction impact) to support statistical root cause analysis (RCA). Keeping historical statistics on fault types and their occurrence frequencies allows software organizations to predict quality trends, focus test generation on high-risk modules, and guide process improvement efforts."
        },
        {
          text: "**Fault Density and Architectural Defect Measures**: Historically, the most common SUT evaluation measure is fault density, calculated as the ratio of discovered faults to the size of the SUT (typically measured in lines of code, function points, or component count). However, because coding style and code duplication can artificially inflate codebase size and skew density metrics, organizations must standardize sizing definitions. To gain deeper insights into software quality, engineers also measure fault depth (the minimal number of sequential fault removals required to make the SUT completely correct) and fault multiplicity (the number of atomic, independent code changes required to repair a single observed fault)."
        },
        {
          text: "**Reliability Evaluation and Life Testing**: Reliability is the probability that a system will perform its required functions without failure under specified conditions for a specified period. Life testing and reliability evaluation use statistical sampling of test cases based on operational profiles to observe failure behaviors and estimate reliability. This statistical estimate serves as an objective stopping criterion, determining if the SUT is mature enough for release. In cloud and fog environments, reliability evaluation plays a critical role in ensuring high availability and scalability of services."
        },
        {
          text: "**Reliability Growth Models**: These mathematical models predict the future reliability of the SUT based on historically observed failure data over time. They assume that as failures are observed and their underlying faults are successfully repaired, the system's overall reliability increases. Reliability growth models are divided into failure-count models and time-between-failures models. Goel-Okumoto or Jelinski-Moranda help teams estimate the remaining testing duration. Crucially, these models can utilize execution time (actual CPU execution hours) or calendar time. Execution time modeling is far more accurate because calendar time does not account for periods of idle system state."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Evaluation of the Tests Performed",
      type: "header"
    },
    {
      text: "Evaluating the quality of the testing process requires measuring the thoroughness, coverage, and relative effectiveness of the executed test suites. This evaluation ensures that test resources are spent efficiently and that the test suites are capable of exposing defects:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Coverage Measures**: Testing techniques are classified by the coverage levels they achieve, ranging from 0% to 100% (excluding infeasible test cases that cannot be executed due to unreachable code or conflicting preconditions). For specification-based techniques, coverage is measured as the percentage of functional requirements exercised by the test suite. For structure-based techniques, coverage is measured using structural metrics, such as the percentage of statements, branches, decisions, or paths executed in the program's control flow graph. Dynamic instrumentation of the SUT is used to log code execution paths during test runs. High-reliability standards (like DO-178C) mandate strict coverage levels, such as Modified Condition/Decision Coverage (MC/DC), where each condition in a decision must be shown to independently affect the decision's outcome. Path coverage, while comprehensive, is constrained by loops, and is often planned in relation to the cyclomatic complexity of the code. Code instrumentation introduces runtime overhead, which must be measured to prevent skewing performance testing metrics."
        },
        {
          text: "**Fault Injection**: In this approach, artificial faults are systematically introduced into the SUT's source code or runtime environment before executing the test suite. Fault injection can be performed at compile-time (altering source code structures) or at runtime (such as system call hooking, injecting memory leaks, dropping network packets, or corrupting state registers). By observing the percentage of injected faults that the test suite successfully detects, engineers can evaluate the suite's fault-detection effectiveness and statistically estimate the number of remaining, undiscovered genuine faults in the codebase. However, this technique must be used with caution to ensure that no artificial faults are left in the production release."
        },
        {
          text: "**Mutation Score**: Mutation analysis evaluates test suite thoroughness by generating mutants—versions of the SUT that contain single syntactic changes (such as changing an operator or variable). The test suite is executed against each mutant. If a test case fails, the mutant is killed; if all tests pass, the mutant survives. The mutation score is calculated as the ratio of killed mutants to the total number of non-equivalent generated mutants. A major challenge in mutation testing is identifying equivalent mutants, which are syntactic modifications that behave identically to the original code and cannot be killed. These must be filtered out to prevent skewing the mutation score. Because executing thousands of mutants is computationally expensive, teams use optimizations such as mutant schema generation, parallel mutant execution, or selective mutation focusing on high-risk operators."
        },
        {
          text: "**Relative Effectiveness**: This involves comparing different test case generation techniques against specific properties, such as the number of tests required to expose the first failure, the ratio of faults discovered during testing to the total faults found after deployment, and the overall improvement in estimated reliability. Empirical and analytical studies are used to compare functional, structural, and random testing techniques under various project constraints."
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
          text: "Did the team establish clear Key Performance Indicators (KPIs) and SUT evaluation measures to monitor runtime behavior?"
        },
        {
          text: "Were DevOps metrics (deployment frequency, lead time for changes, mean time to recovery, and change failure rate) tracked to evaluate integration quality?"
        },
        {
          text: "Did the diagnostic process classify discovered faults using structured taxonomies (such as Orthogonal Defect Classification) to guide root cause analysis?"
        },
        {
          text: "Was fault density calculated as the ratio of discovered faults to SUT size to establish a baseline quality metric?"
        },
        {
          text: "Did the team measure fault depth and fault multiplicity to evaluate the internal complexity of code corrections?"
        },
        {
          text: "Was SUT reliability estimated using statistical sampling of test cases derived from documented operational profiles?"
        },
        {
          text: "Were reliability growth models (failure-count or time-between-failures) applied to predict SUT maturity and determine stopping criteria?"
        },
        {
          text: "Did the team measure the percentage of functional requirements covered by specification-based test suites?"
        },
        {
          text: "Were structure-based coverage metrics (statement, branch, decision, MC/DC) dynamically monitored using code instrumentation?"
        },
        {
          text: "Did the test process account for infeasible paths when calculating final coverage percentages?"
        },
        {
          text: "Was fault injection (compile-time or runtime) utilized to evaluate the test suite's fault-detection effectiveness?"
        },
        {
          text: "Was the mutation score calculated as the ratio of killed mutants, accounting for and filtering out equivalent mutants?"
        },
        {
          text: "Did the team evaluate the relative effectiveness of different test techniques against specific properties (such as tests to first failure)?"
        },
        {
          text: "Were SUT evaluation measures and test suite evaluation measures balanced to ensure both product quality and verification thoroughness?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software testing measures, SUT evaluation, key performance indicators, fault classification, fault density, fault depth, fault multiplicity, reliability growth models, Goel-Okumoto, failure-count, time-between-failures, coverage measures, statement coverage, branch coverage, path coverage, MC/DC, fault injection, compile-time and runtime fault injection, mutation testing, mutation score, equivalent mutants, relative effectiveness",
  filename: "testing-measures",
  trigger: "model_decision"
});
