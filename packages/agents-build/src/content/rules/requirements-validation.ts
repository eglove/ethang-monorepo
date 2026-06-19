import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const requirementsValidation = defineRule({
  content: [
    {
      level: 1,
      text: "Requirements Validation",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      level: 3,
      text: "1.1 The Concept and Role of Requirements Validation",
      type: "header"
    },
    {
      text: "Software requirements validation is a formal engineering activity defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 1, Section 5, as the process of gaining confidence that the documented requirements represent the stakeholders' true needs as they are currently understood and possibly documented. Requirements validation is situated as the final quality assurance gate of the requirements engineering process. Its primary goal is to ensure that the requirements specification defines the correct system, preventing the propagation of defects into subsequent phases of the Software Development Lifecycle (SDLC).",
      type: "text"
    },
    {
      text: 'It is crucial to distinguish requirements validation from downstream software validation and verification. Software verification checks if the software artifacts conform to their immediate specifications (i.e., "did we build the system right?"). Downstream software validation checks if the completed product meets user needs in the target environment (i.e., "did we build the right system?"). Requirements validation, however, is a proactive engineering gate that occurs before significant design and implementation begin. It is the process of confirming that the specifications themselves are correct, complete, and aligned with user expectations.',
      type: "text"
    },
    {
      text: 'The economic rationale for requirements validation is rooted in the "cascade defect effect." In software engineering, a defect introduced during requirements elicitation or specification that goes undetected will propagate through architecture, detailed design, implementation, and testing. At each subsequent phase, the cost to detect, analyze, and repair the defect increases exponentially. Empirical software engineering research demonstrates that repairing a requirements defect after software release can cost 50 to 100 times more than validating and correcting it during the requirements phase. Therefore, rigorous validation activities are not an administrative overhead, but a primary mechanism for risk mitigation and cost containment.',
      type: "text"
    },
    {
      level: 3,
      text: "1.2 The Five Core Validation Questions",
      type: "header"
    },
    {
      text: "To systematically evaluate the quality and correctness of a requirements specification, SWEBOK v4 establishes five fundamental validation questions that requirements engineers and stakeholders must answer:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Do these represent all requirements relevant at this time?**\nThis question addresses the completeness of the requirements specification. It forces reviewers to evaluate whether the document captures the entire scope of the system as presently defined, or if there are unstated operational needs, undocumented constraints, or missing functional flows. Completeness ensures that the development team does not construct a system that is functionally deficient or misses critical business rules.\n"
        },
        {
          text: "**Are any stated requirements not representative of stakeholder needs?**\nThis question addresses the validity and relevance of the documented requirements. It is common for requirements to become obsolete, out-of-scope, or misaligned with stakeholder goals due to shifts in business logic, regulatory updates, or project constraints. Reviewing requirements against actual stakeholder needs ensures that the engineering team does not waste resources implementing unnecessary features (gold-plating).\n"
        },
        {
          text: "**Are these requirements appropriately stated?**\nThis question addresses the clarity, precision, and format of the requirements. Requirements must be written in a manner that is understandable to all stakeholders, free of jargon where appropriate, and formatted according to established standards. An inappropriately stated requirement is often ambiguous, leading to conflicting interpretations among developers, testers, and customers.\n"
        },
        {
          text: "**Are the requirements understandable, consistent, and complete?**\nThis question addresses the internal quality and logical integrity of the requirements set. Understandability ensures that developers and testers can comprehend the expected behavior. Consistency requires that no two requirements contradict each other (e.g., one requirement specifying a response time of under one second while another specifies a low-power constraint that limits processing speed). Completeness requires that all potential system states, inputs, and exceptions have defined outputs and behaviors.\n"
        },
        {
          text: "**Does the requirements documentation conform to relevant standards?**\nThis question addresses compliance with organizational or industry-specific standards. Standards (such as IEEE/ISO/IEC 29148) define templates, structures, and metadata that should accompany requirements specifications. Conformance to standards ensures uniformity, improves readability, and facilitates requirements tracing and tool integration."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.3 Methods for Requirements Validation",
      type: "header"
    },
    {
      text: "SWEBOK v4 identifies three primary validation methods used in industry: requirements reviews, simulation and execution, and prototyping.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3.1 Requirements Reviews",
      type: "header"
    },
    {
      text: "The most common and cost-effective method for requirements validation is the requirements review or inspection. This process involves a group of reviewers systematically reading and auditing the requirements document to locate errors, omissions, invalid assumptions, lack of clarity, or deviations from accepted standards.",
      type: "text"
    },
    {
      text: "SWEBOK v4 emphasizes that requirements reviews must incorporate multiple distinct perspectives to be effective:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Clients, Customers, and Users**: These stakeholders check that their operational needs, business processes, and usability expectations are completely and accurately represented. They focus on the semantic correctness of the requirements."
        },
        {
          text: "**Requirements Engineers**: These specialists audit the document for clarity, precision, lack of ambiguity, and adherence to documentation standards. They check the syntactic and structural quality of the specification."
        },
        {
          text: "**Downstream Developers, Architects, and Testers**: These professionals check that the requirements provide a sufficient foundation for their subsequent work. Architects and developers evaluate technical feasibility, performance constraints, and architectural impact. Testers check if each requirement is testable and if clear acceptance criteria can be derived."
        }
      ],
      type: "unorderedList"
    },
    {
      text: 'Reviews can range from informal walkthroughs, where the requirements author guides the team through the document, to formal technical reviews and highly structured inspections. SWEBOK v4 suggests that providing reviewers with checklist-guided reading, specific quality criteria, or a formalized "definition of done" helps focus their attention on critical quality attributes, significantly increasing defect detection rates.',
      type: "text"
    },
    {
      level: 3,
      text: "1.3.2 Simulation and Execution",
      type: "header"
    },
    {
      text: "For non-technical stakeholders, reading and validating dense, text-heavy requirements documents is often difficult and ineffective. If the requirements are specified using a formal or semi-formal notation (such as model-based specifications, statecharts, or formal algebraic specifications), they can be validated using simulation and execution.",
      type: "text"
    },
    {
      text: "In this approach, requirements engineers use specialized tools to hand-interpret or execute the formal model of the requirements. By applying a set of demonstration scenarios or test cases to the model, engineers can show stakeholders how the system will react to various inputs and state changes. This interactive walkthrough allows stakeholders to confirm that the modeled policies, workflows, and logical processes match their expectations, validating the dynamic correctness of the system's specification.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3.3 Prototyping",
      type: "header"
    },
    {
      text: "When specifications are not in a form that allows direct simulation or execution, building an interactive prototype is an alternative validation strategy. A prototype is a concrete, low-fidelity or high-fidelity implementation of a subset of the requirements, demonstrating how the software engineer interprets those requirements.",
      type: "text"
    },
    {
      text: "Prototypes are particularly valuable for validating user interfaces, user interaction flows, and complex dynamic behaviors. SWEBOK v4 outlines several key trade-offs and considerations for prototyping:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Exposing Assumptions**: Prototypes concretely demonstrate the developers' interpretation of the requirements, giving stakeholders a tangible artifact to evaluate. This helps expose silent assumptions and misunderstandings early in the process."
        },
        {
          text: "**Cosmetic Distraction Risk**: A major danger of prototyping is that reviewers may focus on cosmetic issues (such as color palettes, button styling, fonts, and layout) or minor usability bugs rather than validating the core underlying functional logic and business rules. Reviewers must be explicitly instructed to ignore visual styling and focus on the functional correctness of the system workflows."
        },
        {
          text: "**Cost-Benefit Justification**: Developing prototypes consumes project resources, time, and budget. However, in projects with high requirements uncertainty or complex user interactions, the cost of prototyping is easily justified by the prevention of downstream waste, refactoring, and code discard."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Testability and Acceptance Criteria",
      type: "header"
    },
    {
      text: "A key quality attribute validated during the requirements review is testability. SWEBOK v4 highlights that a requirement is only complete if it can be verified. Therefore, requirements validation requires the early definition of acceptance criteria and the drafting of requirements-based test cases. If a reviewer cannot design a concrete, pass/fail test case for a given requirement, the requirement is untestable. Untestable requirements must be returned to the elicitation and analysis phases for refinement.",
      type: "text"
    },
    {
      level: 2,
      text: "2. Agent Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Validation Questions**: Have all five requirements validation questions (completeness, representation of stakeholder needs, appropriate statement, consistency/understandability, and conformance to standards) been evaluated for the baseline?"
        },
        {
          text: "**Multi-Perspective Review**: Has the requirements document been reviewed from three distinct perspectives: client/user, requirements engineer, and downstream developer/architect/tester?"
        },
        {
          text: '**Checklists and Quality Criteria**: Did the review process utilize specific validation checklists, quality criteria, or a defined "definition of done"?'
        },
        {
          text: "**Simulation and Execution Check**: If a model-based requirements specification was used, was the model simulated or hand-executed using representative demonstration scenarios?"
        },
        {
          text: "**Prototyping Decision**: Has a prototype been built to validate complex user interaction flows or dynamic behaviors when direct simulation of text specs was insufficient?"
        },
        {
          text: "**Cosmetic Distraction Prevention**: If a prototype was reviewed, were stakeholders instructed to ignore visual/cosmetic elements and focus exclusively on core functional behavior?"
        },
        {
          text: "**Cost-Benefit of Prototyping**: Was the cost and effort of developing the prototype balanced against the risk and cost of incorrect requirements?"
        },
        {
          text: "**Testability and Acceptance Criteria**: Does every requirement have clearly defined, pass/fail acceptance criteria that allow the derivation of functional test cases?"
        },
        {
          text: "**Standards Conformance**: Does the requirements specification structure and metadata conform to the organization's requirements documentation standards?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "requirements validation, reviews, simulations, prototyping, planning, plan mode, grill-me, or defining terminology and business rules before implementing",
  filename: "requirements-validation",
  trigger: "model_decision"
});
