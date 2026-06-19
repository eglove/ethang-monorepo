import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const designQualityAnalysisEvaluation = defineRule({
  content: [
    {
      level: 1,
      text: "Software Design Quality Analysis and Evaluation",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software design quality analysis and evaluation is the systematic engineering process of checking, auditing, measuring, and validating a software design to ensure it meets requirements and satisfies quality standards before coding begins. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 3, Section 6, design quality activities are critical static verification and validation gates. Since defects introduced during the design phase propagate into construction and testing—where they become exponentially more expensive to detect and resolve—conducting objective design evaluations is a primary risk-reduction practice that directly controls software quality, costs, and release predictability. ",
      type: "text"
    },
    {
      text: "By analyzing the design description rather than waiting for executable code, designers can identify conceptual flaws, architectural mismatches, and requirements coverage gaps early in the development lifecycle. This proactive focus on design quality minimizes the overall Cost of Software Quality (CoSQ) and prevents structural erosion (where subsequent code changes cause decay in modularity and cohesion). Furthermore, maintaining conceptual integrity—Fred Brooks' assertion that system design must look as though it was created by a single mind—is a core objective of evaluation, ensuring style, structure, and interface uniformities are enforced across all sub-components.",
      type: "text"
    },
    {
      level: 3,
      text: "6.1 Design Reviews and Audits",
      type: "header"
    },
    {
      text: "Design reviews and audits are structured, objective examinations of design artifacts conducted at key project milestones, often involving independent reviewers.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Design Reviews**: Comprehensive evaluations of a design's status, degree of completion, coverage of requirements, open technical issues, and potential engineering risks. Reviews can occur at various stages (e.g., preliminary design reviews vs. critical design reviews) to assess technical feasibility."
        },
        {
          text: "**Design Audits**: Narrowly focused assessments that verify whether a design complies with specific characteristics, regulations, or standards (e.g., security compliance, database guidelines, or interface conventions)."
        },
        {
          text: "**Inspection Discipline (Fagan Inspections)**: A highly structured peer review process consisting of six distinct phases:\n1. *Planning*: Scoping the target artifacts, setting schedules, and allocating team roles.\n2. *Overview*: The author provides context and explains the high-level design objectives to the team.\n3. *Preparation*: Inspectors independently study the design documentation using checklists to identify potential issues.\n4. *Inspection Meeting*: The Reader walks through the design line-by-line, while Inspectors raise issues and the Scribe logs them. If disagreements arise, the Moderator tables the debate to be resolved during rework, preventing meeting stagnation.\n5. *Rework*: The Author corrects the design artifacts based on the logged issues in the registry.\n6. *Follow-Up*: The Moderator verifies that all logged rework tasks have been successfully completed and resolved.\nThe process depends on participants fulfilling defined roles: the **Moderator** leads; the **Reader** paraphrases; the **Scribe** records defects; and **Inspectors** search for issues. Review speed (throughput of pages reviewed per hour) and defect density (defects per page) are monitored to verify review effectiveness."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "6.2 Quality Attributes",
      type: "header"
    },
    {
      text: 'Quality attributes represent the system properties and operational characteristics of the software design. SWEBOK v4 categorizes these attributes (often called the "ilities" and "nesses") into three distinct groups based on how and when they can be observed:',
      type: "text"
    },
    {
      items: [
        {
          text: "**Runtime Observable Qualities**: Characteristics that can be evaluated during system execution (e.g., performance latency under load, security access boundaries, availability and uptime metrics, functional suitability, usability)."
        },
        {
          text: "**Non-Runtime Observable Qualities**: Static properties that cannot be measured during execution but govern how easily the system can be evolved and maintained (e.g., modifiability, portability to new runtimes, reusability, testability)."
        },
        {
          text: "**Design-Observable Qualities**: Structural characteristics that can be directly evaluated by inspecting the design specifications (e.g., conceptual integrity—ensuring the codebase feels like it was designed by a single mind—correctness, completeness, coupling levels)."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "6.3 Quality Analysis and Evaluation Techniques",
      type: "header"
    },
    {
      text: "Software engineers deploy a variety of static and dynamic techniques to evaluate design quality:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Rigorous Reviews and Tracing**: Using scenario-based walkthroughs (such as ATAM scenarios) to verify how the design executes specific operational cases, and tracing requirements to design elements to ensure completeness."
        },
        {
          text: "**Static Analysis**: Semi-formal and formal methods that evaluate the design without executing it. This includes fault-tree analysis (modeling event paths leading to failure), automated design cross-checking (verifying component interfaces), and design vulnerability analysis (detecting security exposures)."
        },
        {
          text: "**Formal Design Analysis**: Using mathematical specifications and models (such as Z notation or TLA+ model checking) to verify and prove that the design behaves correctly under all input conditions, detecting specification errors and ambiguities."
        },
        {
          text: "**Simulation and Prototyping**: Dynamic evaluation techniques, such as performance simulations to model system latency, or feasibility prototypes to validate UI layouts and user workflows."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "6.4 Measures and Metrics",
      type: "header"
    },
    {
      text: "Design metrics provide quantitative indicators of the size, structural complexity, and modular quality of the software design. These metrics are classified based on the design approach used:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Function-Based (Structured) Measures**: Metrics obtained by analyzing the functional decomposition of a system. These are calculated from structure charts or hierarchical diagrams, measuring parameters such as call depth, module span, fan-in (number of modules calling a component), and fan-out (number of components called by a module)."
        },
        {
          text: "**Object-Oriented Design Measures**: Calculated by inspecting class diagrams and the internal contents of individual classes. This includes measuring coupling between objects (CBO), cohesion of class methods (such as Lack of Cohesion in Methods - LCOM, which measures whether methods share class fields), depth of inheritance trees (DIT), number of children per class (NOC), weighted methods per class (WMC), and the density of message exchanges."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "6.5 Verification, Validation, and Certification",
      type: "header"
    },
    {
      text: "Systematic design evaluation plays a distinct, formal role in three quality assurance areas:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Verification**: The process of confirming that the design satisfies the stated software requirements and architectural constraints (verifying that the design conforms to specifications)."
        },
        {
          text: "**Validation**: The process of establishing that the design meets the expectations, operational goals, and business needs of its stakeholders (including customers, users, operators, and maintainers)."
        },
        {
          text: "**Certification**: A formal, third-party attestation of conformity confirming that the design adheres to industry standards, regulations, or safety-critical specifications.\nTraceability links (connecting requirements to design elements and test cases) serve as the foundation for design verification and validation, providing the necessary evidence for audits and certification."
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
          text: "Has a design evaluation plan been established, specifying the milestones, review methods, and reviewers?"
        },
        {
          text: "Were design reviews conducted to assess design completeness, requirements coverage, and unresolved technical issues?"
        },
        {
          text: "Did the evaluation perform design audits to check compliance with organizational coding standards and database guidelines?"
        },
        {
          text: "Have the target quality attributes been categorized into runtime observable, non-runtime observable, and design-observable properties?"
        },
        {
          text: "Was the design evaluated for non-runtime attributes (modifiability, portability, reusability, testability)?"
        },
        {
          text: "Has the design's conceptual integrity been verified to ensure structural consistency across all system modules?"
        },
        {
          text: "Were scenario-based techniques or requirements tracing applied to verify that each design element maps back to a requirement?"
        },
        {
          text: "Has static design analysis (e.g., fault-tree analysis, interface cross-checking) been executed to detect logic errors?"
        },
        {
          text: "Did the security evaluation perform a design vulnerability analysis to identify potential trust boundary exposures?"
        },
        {
          text: "Were dynamic simulation or prototyping techniques deployed to validate performance expectations and user workflows?"
        },
        {
          text: "Have quantitative design measures (size, structure, complexity) been calculated based on the selected design paradigm?"
        },
        {
          text: "For structured designs, were structure chart metrics (call depth, fan-in, fan-out) measured and analyzed?"
        },
        {
          text: "For object-oriented designs, were class metrics (coupling, cohesion, inheritance depth) evaluated to identify modularity violations?"
        },
        {
          text: "Did design verification confirm that all elements satisfy the stated functional and nonfunctional requirements?"
        },
        {
          text: "Was design validation conducted to establish that the proposed solution meets stakeholder and user expectations?"
        },
        {
          text: "If required, has the design undergone formal certification by an independent third party?"
        },
        {
          text: "Were all design review findings, issues, and action items recorded and tracked to closure before construction began?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software design quality analysis and evaluation, design quality, design reviews, audits, checklists, quality attributes, static analysis, formal design analysis, simulation, prototyping, design metrics, function-based measures, object-oriented measures, verification, validation, certification, SDD sufficiency, planning, plan mode, grill-me, or evaluating and auditing design specifications using the antigravity cli",
  filename: "design-quality-analysis-evaluation",
  trigger: "model_decision"
});
