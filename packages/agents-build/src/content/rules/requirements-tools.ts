import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const requirementsTools = defineRule({
  content: [
    {
      level: 1,
      text: "Software Requirements Tools",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 The Necessity of Automated Requirements Tooling",
      type: "header"
    },
    {
      text: "According to the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 8, the complexity of requirements engineering in modern software engineering projects necessitates the use of automated tools. As software systems grow in scale, interconnectivity, and volatility, managing requirements through manual, ad hoc methods (such as word processing documents or basic spreadsheets) quickly becomes impractical and prone to significant error. ",
      type: "text"
    },
    {
      text: "Manual approaches fail to maintain the rigorous consistency, traceability, and change control required for high-assurance systems. They lead to undocumented requirements drift, untracked changes, obsolete specifications, and undetected verification gaps. Specialized software requirements tools address these challenges by providing a central repository that acts as a single source of truth. These tools capture not only the text of the requirements but also their associated metadata, logical relationships, history, and verification status. SWEBOK v4 classifies requirements tools into three major categories: requirements management tools, requirements modeling tools, and functional test case generation tools.",
      type: "text"
    },
    {
      level: 3,
      text: "1.2 Requirements Management Tools",
      type: "header"
    },
    {
      text: "Requirements management tools are designed to support the administration, tracking, and control of requirements throughout the software product lifecycle. SWEBOK v4 notes that key requirements engineering activities, such as requirements tracing and formal change control, are often only practical when supported by a dedicated management tool.",
      type: "text"
    },
    {
      text: "These tools support a variety of essential requirements management functions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Storing Requirements Attributes and Metadata**: Requirements are not merely text strings; they are complex data objects. Management tools store metadata for each requirement, including its unique identifier, priority, cost to deliver, technical risk, stability, current status (e.g., proposed, approved, implemented, verified), and owner. This allows engineering teams to filter, sort, query, and report on the state of the requirements baseline."
        },
        {
          text: "**Traceability Maintenance**: Management tools automate the construction and maintenance of a bidirectional requirements traceability matrix. They allow engineers to define links between system requirements, software requirements, architectural designs, implementation source files, and test cases. When a change is proposed, the tool traces these links to identify affected artifacts, making technical impact analysis feasible."
        },
        {
          text: "**Change Control and Versioning**: Requirements management tools integrate change control workflows. They track the historical evolution of each requirement, recording who modified it, when, and why. When changes are requested, the tool routes the change request through validation and approval workflows (such as a Change Control Board), preserving the audit trail."
        },
        {
          text: "**Document Generation**: These tools automatically generate formatted requirements specification documents (such as Software Requirements Specifications) from the underlying database, ensuring that published documents are always synchronized with the active baseline."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Spreadsheets, while commonly used due to their low barrier to entry and familiarity, represent a high-risk approach to requirements management. They do not support multiuser concurrency control with granular permissions, meaning concurrent changes can easily overwrite each other. They lack a tamper-proof audit trail, making it impossible to reconstruct the history of changes for regulatory or safety compliance. Furthermore, spreadsheets cannot enforce referential integrity between requirements, meaning that when a parent requirement is modified or deleted, child requirements and dependent elements are left orphaned without warning. Professional requirements management tools prevent these issues by storing requirements as relational database nodes with enforced constraints, version histories, and automatic change notifications.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Requirements Modeling Tools",
      type: "header"
    },
    {
      text: "Requirements modeling tools support the visual or formal creation, modification, and publication of model-based requirements specifications. Rather than representing requirements solely in natural language, these tools model the structure, behavior, and data flows of the proposed system.",
      type: "text"
    },
    {
      text: "SWEBOK v4 identifies the key capabilities of requirements modeling tools:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Visual Modeling Support**: These tools support graphical notations that capture different views of the system. Examples include Unified Modeling Language (UML) diagrams (such as Use Case, Sequence, and Class diagrams), Data Flow Diagrams (DFDs), and Statecharts or Finite State Machines (FSMs) that define event-driven state transitions."
        },
        {
          text: "**Static Analysis and Validation**: Modeling tools often feature automated static analyzers that evaluate the logical integrity of the models. These checks check for syntax correctness (adherence to the rules of the modeling notation), completeness (ensuring no disconnected nodes, dead ends, or floating transitions exist), and logical consistency (ensuring no contradictory paths or deadlock states are modeled)."
        },
        {
          text: "**Formal Analysis Support**: Formal analysis requires specialized tool support to be practicable on non-trivial systems. Modeling tools in this sub-domain fall into two categories: theorem provers and model checkers. Theorem provers use mathematical logic to verify properties of a system model. They typically require the requirements engineer to manually direct the proof steps, acting as an interactive assistant to prove that the system meets specified invariants. In contrast, model checkers perform an exhaustive search of the system's state space to verify that temporal logic properties (such as liveness and safety) are satisfied. If a violation is found, the model checker automatically generates a counterexample path, which acts as a diagnostic trace showing how the deadlock or race condition occurs. While model checkers are fully automated, they suffer from the 'state space explosion' problem, where the number of possible states grows exponentially with system size, limiting their applicability to critical sub-systems. SWEBOK v4 notes that in neither case can these proofs be fully automated; the high level of competence in formal reasoning required to operate these tools limits their widespread adoption in industry."
        },
        {
          text: "**Simulation and Execution**: Some modeling tools allow engineers to dynamically execute or simulate the requirements models. By walking through state transitions and executing logical paths with stakeholders, engineers can validate that the model accurately represents the intended operational behavior of the system."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Functional Test Case Generation Tools",
      type: "header"
    },
    {
      text: "A critical challenge in requirements engineering is bridging the gap between specification and verification. Functional test case generation tools assist in deriving functional test cases directly from requirements specifications or models. SWEBOK v4 explains that the level of test automation is directly tied to the formality of the requirements specification language: the more formally defined a requirements language is, the more likely it is that functional test cases can be derived mechanically.",
      type: "text"
    },
    {
      text: "Functional test case generation tools support several automated derivation techniques:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Behavior-Driven Development (BDD) Scenarios**: Converting structured natural language scenarios (such as Gherkin specifications) into executable test cases or test runners is straightforward. Tools parse the Given-When-Then blocks to generate automated test stubs."
        },
        {
          text: "**State Model Derivation**: When requirements are modeled as state charts or state machines, test generation tools apply path-coverage algorithms to automatically derive test suites. Positive test cases are generated for every defined state transition to verify correct behavior. Negative test cases are derived from the state-and-event combinations that do not appear in the model, verifying that the system correctly rejects invalid stimuli and handles exceptions."
        },
        {
          text: "**The Oracle Problem and Sizing Constraints**: SWEBOK v4 highlights a fundamental limitation of automated test case generation tools: in the most general case, these tools can only generate test case inputs. Determining the expected result (the test oracle) is not always possible through automated means alone. Often, additional business domain expertise or reference models are necessary to define the expected outputs for the generated inputs. Therefore, automated test case generation must be combined with expert validation to ensure complete verification correctness."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Agent Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Requirements Attribute Storage**: Are all requirements logged in an automated tool or database that tracks metadata such as priority, stability, status, cost, and technical risk?"
        },
        {
          text: "**Bidirectional Tracing Tooling**: Has a requirements tracing tool or matrix been established to link requirements backward to sources and forward to design, code, and test cases?"
        },
        {
          text: "**Change Control Tooling**: Does the requirements tool record version history and track proposed changes through a structured approval workflow?"
        },
        {
          text: "**Model Visual Creation**: Were visual modeling tools used to construct structured representations (e.g., UML, Data Flow Diagrams, Statecharts) of the requirements?"
        },
        {
          text: "**Model Static Analysis**: Have automated static analysis checks (for syntax correctness, completeness, and consistency) been run on the requirements models?"
        },
        {
          text: "**Formal Analysis Application**: If theorem provers or model checkers were utilized, was the formal reasoning validated by a competent engineer to verify model invariants?"
        },
        {
          text: "**Model Simulation Walkthrough**: Has the model-based specification been simulated or executed to walk stakeholders through dynamic system behavior?"
        },
        {
          text: "**Mechanical Test Derivation**: Were functional test cases or test stubs derived mechanically from structured scenarios (BDD) or state models?"
        },
        {
          text: "**Positive/Negative Transition Testing**: Did the test generation cover both positive test cases (defined transitions) and negative test cases (event-state combinations that do not appear)?"
        },
        {
          text: "**Oracle Problem Resolution**: For all generated test cases, was business domain expertise applied to define the expected test results rather than relying solely on generated inputs?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "requirements management tools, modeling tools, test case generation, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-tools",
  trigger: "model_decision"
});
