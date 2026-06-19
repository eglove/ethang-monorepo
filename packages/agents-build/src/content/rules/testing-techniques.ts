import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const testingTechniques = defineRule({
  content: [
    {
      level: 1,
      text: "Software Testing Techniques",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software testing techniques represent systematic procedures and methodologies used to design, generate, select, and evaluate test suites. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5, Section 3, testing techniques aim to maximize the probability of exposing faults in a system under test (SUT) while optimizing validation effort. These techniques translate test objectives into concrete test cases by leveraging diverse sources of information, such as software requirements, code structure, execution behavior, historical defects, and user interaction profiles. Rather than relying on unstructured validation, engineering rigor requires classifying and combining techniques based on their underlying models, target defect classes, and the degree of structural knowledge available.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Specification-Based (Black-Box) Techniques",
      type: "header"
    },
    {
      text: "Specification-based techniques, traditionally termed black-box or domain testing techniques, generate test cases solely from the external behavioral specifications and functional requirements of the SUT, without reference to its internal code structure or design implementation:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Equivalence Partitioning**: This technique divides the infinite input and output domains of the SUT into a finite set of equivalence classes (or subsets) based on specific processing behaviors. These partitions distinguish between valid inputs (processed normally) and invalid inputs (out-of-range or unexpected values triggering error handling). The core assumption is that any representative input within a single equivalence class will expose the same behavior or failures. Developers select representative test cases (typically one per class) to cover every partition, drastically reducing test redundancy."
        },
        {
          text: "**Boundary Value Analysis**: Experience demonstrates that programming errors frequently occur at boundaries. Boundary Value Analysis (BVA) focuses test selection on extreme values, executing tests directly on boundaries, immediately inside boundaries, and immediately outside boundaries (robustness testing). Robustness testing specifically challenges the SUT's error-handling mechanisms by supplying values that violate input constraints, ensuring the system fails gracefully rather than crashing."
        },
        {
          text: "**Syntax Testing**: Also known as formal specification-based testing, this technique uses a formal language or grammar (such as BNF notation or protocol schemas) that defines valid inputs. Syntax testing automatically derives test cases to verify compliance with this grammar and generates invalid syntactic structures to check parser robustness. The formal grammar serves as both a generator and an oracle for validating SUT responses."
        },
        {
          text: "**Combinatorial Test Techniques**: When inputs involve multiple parameters, testing every combination is often infeasible due to combinatorial explosion. Combinatorial techniques systematically select a subset of combinations to achieve specific coverage. Pair-wise (2-way) testing verifies every possible pair of parameter values across all inputs, which empirical studies show detects the majority of interaction defects. t-wise testing extends pair-wise to cover combinations of t parameters, while base choice varies one parameter at a time from a typical baseline."
        },
        {
          text: "**Decision Tables and Trees**: Decision tables represent complex logical relationships by mapping combinations of conditions (inputs) to corresponding actions (outputs). They are highly effective for validating business rules and requirements consistency. Testing teams systematically generate a test case for each column (rule) of the decision table."
        },
        {
          text: "**Cause-Effect Graphing**: This technique translates requirements into a logical network graph, connecting causes (input conditions) to effects (actions/outputs) using boolean operators and constraints. The resulting cause-effect graph is analyzed to identify logical inconsistencies in specifications and is then converted into a decision table to derive test cases."
        },
        {
          text: "**State Transition Testing**: Used when the SUT behaves as a state machine where responses depend on both current inputs and execution history. State transition testing represents the system using a Finite-State Machine (FSM), designing test cases to achieve specific coverage targets, such as covering all states, covering all valid transitions, or verifying invalid state-transition sequences."
        },
        {
          text: "**Scenario-Based Testing**: Validates end-to-end user workflows and software requirements. Scenario testing represents the sequence of activities performed by users or systems (such as business processes) as distinct scenarios. It ensures that both typical (happy path) and alternate (exceptional, error path) workflows are executed."
        },
        {
          text: "**Random and Fuzz Testing**: Random testing selects inputs randomly from the input domain. Fuzz testing (or fuzzing) is a specialized security-focused form of random testing that injects malformed, unexpected, or random payloads into APIs, input fields, or network streams to expose memory corruption, crashes, and security vulnerabilities."
        },
        {
          text: "**Evidence-Based and Exception Forcing**: Evidence-based testing applies systematic mapping studies to evaluate empirical evidence regarding validation approaches. Forcing exceptions designs negative test scenarios specifically to trigger runtime exceptions (such as overflow, underflow, or operation exceptions) to verify that the SUT's exception handlers isolate failures and maintain system integrity."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Structure-Based (White-Box) Techniques",
      type: "header"
    },
    {
      text: "Structure-based techniques, also called code-based or glass-box techniques, derive test cases from the internal design, control structure, or source code of the SUT. Adequacy is measured using structural coverage metrics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Control Flow Testing**: Analyzes the control flow graph of the program, mapping statements and decisions to nodes and edges. Test cases are designed to achieve specific coverage targets: statement coverage (executes every statement), branch coverage (verifies decision outcomes), MC/DC (proves each condition in a decision independently affects the outcome in linear time), or path testing (executes entry-to-exit control paths)."
        },
        {
          text: "**Data Flow Testing**: Annotates the control flow graph with variable lifetimes (definitions, uses, and destructions). It tracks variables from where they are assigned (defined) to where they are read (used) in computations (C-uses) or predicate conditions (P-uses). Coverage criteria include All-Definitions, All-Uses, and All-DU-Paths (executing all paths from every definition to all corresponding uses)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Experience-Based and Fault-Based Techniques",
      type: "header"
    },
    {
      text: "Experience-based techniques rely on the tester's domain knowledge, intuition, technical expertise, and understanding of typical developer mistakes rather than formal specifications or code structures:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Error Guessing and Exploratory Testing**: Error guessing designs test cases to target likely faults based on historical defects and programming pitfalls. Exploratory testing is a dynamic approach where learning, test design, and test execution occur simultaneously, adjusting the testing strategy based on runtime feedback and risk profiles."
        },
        {
          text: "**Ad Hoc Methodologies**: Informal testing driven by intuition, including monkey testing (random inputs), pair testing (one engineer executes, one analyzes), smoke testing (executing core functional tests to verify build stability before deep testing), and gamification (converting testing tasks into gameplay or bug bounties)."
        },
        {
          text: "**Mutation and Metamorphic Testing**: Mutation testing evaluates test suite quality by injecting syntactic changes (mutations) into source code. If a test fails, the mutant is killed. Metamorphic testing resolves the oracle problem in complex systems (like AI/ML) by defining metamorphic relations that verify how changes in inputs should predictably transform outputs."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Usage-Based and Usability Techniques",
      type: "header"
    },
    {
      items: [
        {
          text: "**Operational Profiles**: Usage-based testing samples test cases based on an operational profile—a probability distribution of how users execute the system in production. This approach allows estimating the software's operational reliability."
        },
        {
          text: "**User Observation Heuristics**: Usability inspection methods observe users under controlled conditions. Usability heuristics include cognitive walkthroughs, thinking aloud, and interviews to evaluate user-system interaction and interface learnability."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Selecting and Combining Techniques",
      type: "header"
    },
    {
      text: "No single technique can expose all defects. Engineering guidelines require combining functional (specification-based) and structural (code-based) testing to target different fault classes, balancing deterministic verification with random fuzzing, adapting techniques to specific architectures (e.g., thread testing for concurrency), and leveraging digital twins or simulation frameworks.",
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
          text: "Were specification-based (black-box) techniques utilized to verify input/output behavior against functional requirements?"
        },
        {
          text: "Did the team apply equivalence partitioning to classify valid and invalid inputs and reduce test case redundancy?"
        },
        {
          text: "Was boundary value analysis conducted on extreme domain values, including robustness testing outside input boundaries?"
        },
        {
          text: "Were formal specification-based (syntax) testing techniques used to verify language-based parser compliance?"
        },
        {
          text: "Did the team execute combinatorial techniques (pair-wise, t-wise, base choice) to optimize parameter interactions?"
        },
        {
          text: "Were decision tables or trees used to document and test complex logical relationships and business rules?"
        },
        {
          text: "Was cause-effect graphing applied to resolve specification logic and derive corresponding decision table tests?"
        },
        {
          text: "Did the team implement state transition testing using finite-state machine models to cover states and transitions?"
        },
        {
          text: "Were scenario-based testing approaches used to validate both typical and alternate end-to-end user workflows?"
        },
        {
          text: "Were random and fuzz testing techniques executed to identify security loopholes and memory vulnerabilities?"
        },
        {
          text: "Did the team evaluate testing approaches using evidence-based software engineering (EBSE) mapping studies and reviews?"
        },
        {
          text: "Was forcing exceptions used to evaluate SUT behavior during negative error-handling scenarios?"
        },
        {
          text: "Were structure-based (white-box) control flow coverage criteria (statement, branch, MC/DC) systematically tracked?"
        },
        {
          text: "Did the data flow testing plan map variable lifetimes to cover definitions and uses (All-DU-Paths)?"
        },
        {
          text: "Were experience-based techniques (error guessing, exploratory testing) used to supplement formal test suites?"
        },
        {
          text: "Did the team apply ad hoc methodologies (smoke testing, monkey testing, pair testing) to verify build stability?"
        },
        {
          text: "Was mutation testing or metamorphic testing conducted to measure test suite quality and handle complex oracles?"
        },
        {
          text: "Did usage-based testing leverage operational profiles to estimate runtime reliability?"
        },
        {
          text: "Were usability inspection methods (cognitive walkthroughs, user observations) applied to interface elements?"
        },
        {
          text: "Was an adaptive combination of functional and structural testing techniques selected to maximize quality attributes?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software testing techniques, black-box testing, white-box testing, glass-box testing, equivalence partitioning, boundary value analysis, robustness testing, syntax testing, combinatorial testing, decision tables, cause-effect graphing, state transition testing, scenario-based testing, random testing, fuzz testing, evidence-based software engineering, forcing exceptions, control flow testing, statement coverage, branch coverage, MC/DC, path testing, data flow testing, DU paths, error guessing, exploratory testing, ad hoc testing, monkey testing, smoke testing, mutation testing, metamorphic testing, usability inspection",
  filename: "testing-techniques",
  trigger: "model_decision"
});
