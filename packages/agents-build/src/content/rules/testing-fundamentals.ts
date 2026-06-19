import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const testingFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Testing Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software testing represents the dynamic validation that a system under test (SUT) provides expected behaviors on a finite set of test cases, suitably selected from an infinite execution domain. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5, Section 1, software testing fundamentals establish the conceptual taxonomy, theoretical boundaries, and engineering trade-offs governing validation activities. Testing acts as a critical quality assurance and quality improvement mechanism, measuring adherence to baseline requirements and exposing functional and non-functional deviations. To apply testing effectively, engineers must understand the distinction between faults and failures, the oracle problem, test adequacy metrics, and the mathematical and practical limitations of execution-based validation.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Faults vs. Failures",
      type: "header"
    },
    {
      text: "In software engineering literature, distinct terminology is used to describe software malfunctions. It is critical to differentiate between the cause of a malfunction and its observed effect:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Faults and Defects**: A fault (or defect) represents the static anomaly or flaw within the software code, configuration, or documentation. A fault is the physical cause of a potential malfunction. Faults can remain dormant within code paths for extended periods without ever triggering an observable error if those specific code paths or data boundaries are not exercised."
        },
        {
          text: "**Failures**: A failure is the undesired, observable deviation in the delivered service or runtime behavior of the system from its expected specification. Failures represent the effects of faults when they are triggered by specific runtime inputs."
        },
        {
          text: "**Errors**: An error is an incorrect intermediate state or internal discrepancy within the system's execution flow caused by an active fault, which may subsequently propagate to the boundary of the system and cause a failure."
        },
        {
          text: "**Failure-Causing Inputs**: Because it is mathematically difficult to map a runtime failure back to a single unique fault in the codebase (as multiple different modifications could resolve the failure), testing is fundamentally concerned with identifying failure-causing inputs. These are the specific input sequences, environment conditions, and parameter values that trigger errors and propagate them to visible failures. Testing reveals failures, whereas debugging is the separate activity of locating and removing the underlying faults."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Key Testing Issues",
      type: "header"
    },
    {
      text: "Testing activities are guided by several core engineering challenges, ranging from test creation to execution environment selection:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Test Case Creation and Generation**: Creating a test case involves specifying input values, runtime environments, preconditions, execution procedures, and expected outcomes. Input parameters alone are insufficient since stateful systems react differently to identical inputs depending on their history. Automated test generation tools use model-based, search-based, or grammar-based techniques to systematically create test inputs and reduce manual scripting effort. Furthermore, test generation techniques must navigate the state space of the SUT strategically, utilizing boundary value evaluations and equivalence class partitionings to cover edge cases without producing a redundant test suite that stalls the CI/CD pipeline."
        },
        {
          text: "**Test Selection and Adequacy Criteria**: A test selection criterion defines how test cases are chosen from the input domain or determines when a test suite is sufficient for a given purpose. Adequacy criteria serve as stopping rules, defining the target coverage (such as statement, branch, or path coverage) that must be achieved before testing can be considered complete. Effective selection criteria aim to minimize test suite size (reducing execution costs) while maintaining high fault detection capabilities."
        },
        {
          text: "**Prioritization and Minimization**: Test case prioritization orders the execution of test cases to maximize early feedback (e.g., executing high-risk paths or high-coverage tests first). Prioritization ensures that if a build fails, the failure is detected as early as possible. Test suite minimization removes redundant test cases that cover already verified paths, optimizing execution efficiency."
        },
        {
          text: "**The Oracle Problem**: A test is only meaningful if its outcome can be evaluated. An oracle is a human or mechanical agent that determines whether the SUT behaved correctly, yielding a verdict of pass, fail, or inconclusive. Oracles can be written specifications, behavioral models, assertions, or comparative reference systems. Building automated oracles is a major engineering challenge, particularly when requirements are ambiguous. In many software systems, particularly those relying on asynchronous operations, non-deterministic scheduling, or machine learning models, determining correct outputs programmatically remains a major barrier. In such cases, testing teams resort to metamorphic testing or differential testing where outcomes are evaluated relative to related executions rather than absolute specs."
        },
        {
          text: '**Theoretical and Practical Limitations**: Testing theory establishes that complete testing of realistic software is mathematically impossible due to the infinite combination of inputs and paths. This boundary is summarized by Dijkstra\'s aphorism: "program testing can be used to show the presence of bugs, but never to show their absence." Therefore, successful tests increase confidence but do not prove absolute correctness.'
        },
        {
          text: "**The Problem of Infeasible Paths**: Infeasible paths are control flow paths that cannot be exercised by any possible input data (often due to mutually exclusive branch conditions). Detecting and managing infeasible paths is a significant challenge in path-based testing. Automatically identifying infeasible paths helps prevent wasting test generation resources and can expose design defects or security vulnerabilities."
        },
        {
          text: "**Testability**: Software testability describes the ease with which a test coverage criterion can be satisfied and the statistical likelihood that a test suite will expose a failure if the software is faulty. High testability is achieved by designing modules with high observability (visibility into internal states) and high controllability (ease of forcing specific inputs and states)."
        },
        {
          text: "**Controllability, Replication, and Generalization**: Controllability refers to the difficulty of transitioning tests from controlled laboratory settings to real-world deployment environments. Replication verifies that different teams can repeat tests and achieve identical results under controlled conditions. Generalization, or external validity, determines whether the test results are applicable to broader operational profiles and populations."
        },
        {
          text: "**Offline vs. Online Testing**: Offline testing executes the SUT in an isolated environment without direct interaction with live, external systems. Online testing validates the SUT in the active, real production environment where it interacts with live users, database engines, and network conditions, requiring protective sandboxing or rollback strategies."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Relationship of Testing to Other Activities",
      type: "header"
    },
    {
      text: "Software testing must be distinguished from, yet coordinated with, other software engineering activities:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Testing vs. Debugging**: Testing dynamically validates the system against specifications to find failures. Debugging is the subsequent diagnostic phase that analyzes execution states, localizes the underlying fault, and modifies the codebase to correct it."
        },
        {
          text: "**Testing vs. Static Quality Management**: Static techniques (like code inspections, linters, and type checking) analyze source documents without executing the program. Testing relies on execution, detecting runtime anomalies (such as memory leaks and concurrency races) that static tools cannot easily model."
        },
        {
          text: "**Testing vs. Formal Verification**: Formal verification uses mathematical proofs to prove correctness against specifications. Testing runs concrete executions on sample inputs, providing empirical validation where formal modeling is too complex or costly."
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
          text: "Did the team distinguish between faults (code anomalies) and failures (observed service deviations) during diagnostic analysis and logging?"
        },
        {
          text: "Were test suites designed with specific, documented purposes (such as adequacy, performance validation, or conformance certification)?"
        },
        {
          text: "Did the team implement test selection and adequacy criteria to reduce test suite size while maintaining coverage and fault detection capabilities?"
        },
        {
          text: "Was a test prioritization strategy implemented to execute high-risk or high-coverage test cases early in the execution sequence?"
        },
        {
          text: "Was the oracle problem addressed by establishing clear, automated oracles (assertions, schemas, or behavioral models) to verify test outcomes?"
        },
        {
          text: "Did the engineers account for Dijkstra's aphorism by avoiding claims of absolute fault-free software based solely on successful test executions?"
        },
        {
          text: "Were infeasible control flow paths identified and documented to prevent wasted test execution effort and reduce security vulnerabilities?"
        },
        {
          text: "Was the software designed for testability by maximizing modular observability and controllability?"
        },
        {
          text: "Have testing activities been evaluated for controllability, replication, and generalization across real-world operational environments?"
        },
        {
          text: "Were offline testing (isolated sandboxes) and online testing (real application environment interaction) strategies balanced and executed?"
        },
        {
          text: "Has the test process been clearly separated from the debugging process (fault localization and correction) to maintain objectivity?"
        },
        {
          text: "Were dynamic testing runs integrated with static analysis checks and formal verification where high-reliability execution is required?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software testing fundamentals, faults vs failures, test case creation, test selection, adequacy criteria, prioritization, minimization, oracle problem, Dijkstra aphorism, infeasible paths, testability, execution automation, scalability, controllability, replication, generalization, offline vs online testing",
  filename: "testing-fundamentals",
  trigger: "model_decision"
});
