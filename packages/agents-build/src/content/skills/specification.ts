import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

const blocks: MarkdownBlock[] = [
  {
    level: 1,
    text: "Specification Interview & BDD Document Generation",
    type: "header"
  },
  {
    text: "Run a `/specification` session to interview the user about a feature, produce requirements following SWEBOK v4 / ISO/IEC 29148 standards, and generate Behavior-Driven Development (BDD) documents in a `/docs/<feature-name>/` directory at the repository root.",
    type: "text"
  },
  { level: 2, text: "When to Invoke", type: "header" },
  {
    text: "Invoke this skill when the user wants to define a new feature or capability. The skill MUST be used when the user mentions 'specification', 'spec', 'requirements interview', 'BDD documents', 'feature spec', or 'planning a new feature'.",
    type: "text"
  },
  { level: 2, text: "Interview Workflow (Grill-Me Style)", type: "header" },
  {
    text: "The agent MUST conduct a relentless, interview-style discovery session. Do NOT assume requirements — actively interrogate every assumption. The interview follows these phases:",
    type: "text"
  },
  {
    items: [
      {
        text: "**Phase 1 — Feature Identity**: Ask the user for a concise feature name and high-level purpose. This name will be used as the directory name `/docs/<feature-name>/`."
      },
      {
        text: "**Phase 2 — Stakeholder Analysis**: Ask who the stakeholders are (users, clients, operators, etc.). Identify distinct user classes and their goals."
      },
      {
        text: "**Phase 3 — Functional Discovery**: Use the grill-me technique — ask 'why' relentlessly. For each capability the user describes, ask 'what happens when this fails?', 'who triggers this?', 'what changes after this succeeds?'. Do not accept vague answers — push for concrete actor-action statements."
      },
      {
        text: "**Phase 4 — Constraints & QoS**: Ask about non-functional requirements — performance, security, reliability, scalability targets. Push for quantitative values (e.g., 'fast' is unacceptable — 'under 200ms p95' is required). Apply Gilb's Planguage where appropriate."
      },
      {
        text: "**Phase 5 — Edge Cases & Exceptions**: Ask 'what should NOT happen?', 'what are the boundaries?', 'what happens under load or failure?'. Surface tacit knowledge by asking about existing manual processes."
      },
      {
        text: "**Phase 6 — Confirmation**: Summarize all discovered requirements back to the user. Ask for confirmation or corrections before proceeding to document generation."
      }
    ],
    type: "numberedList"
  },
  { level: 2, text: "Document Generation", type: "header" },
  {
    text: "After the interview is confirmed, generate the following documents in `/docs/<feature-name>/` at the repository root. Each feature MUST have its own directory.",
    type: "text"
  },
  {
    level: 3,
    text: "Directory Structure",
    type: "header"
  },
  {
    code: "docs/<feature-name>/\n├── requirements.md        # Structured requirements (SWEBOK v4 / ISO/IEC 29148)\n├── bdd/\n│   ├── normal-course.feature    # Given-When-Then for happy paths\n│   ├── exceptions.feature       # Given-When-Then for error/edge cases\n│   └── boundaries.feature       # Given-When-Then for boundary conditions\n└── README.md              # Feature overview and traceability index",
    language: "",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "requirements.md — Standards-Compliant Specification",
    type: "header"
  },
  {
    text: "The requirements document MUST follow SWEBOK v4 Chapter 1 and ISO/IEC 29148 standards. It MUST contain:",
    type: "text"
  },
  {
    items: [
      {
        children: [
          {
            text: "A header with feature name, version, date, and status (Draft/Approved)."
          },
          {
            text: "A stakeholder section listing all identified stakeholder classes."
          }
        ],
        text: "**Document Metadata**:"
      },
      {
        children: [
          {
            text: "Each requirement MUST have a unique identifier (e.g., REQ-F001, REQ-NF001)."
          },
          {
            text: "Each requirement MUST be classified as Functional (F) or Non-Functional (NF)."
          }
        ],
        text: "**Requirement Identification**:"
      },
      {
        children: [
          {
            text: "Functional requirements MUST use structured natural language (Actor-Action format or Use Case)."
          },
          {
            text: "Non-functional requirements MUST be quantitative using Gilb's Planguage attributes (Scale, Meter, Minimum, Target)."
          }
        ],
        text: "**Specification Format**:"
      },
      {
        children: [
          {
            text: "Each requirement MUST include: description, rationale, source (stakeholder), priority, and acceptance criteria."
          },
          {
            text: "BDD Given-When-Then scenarios MUST be referenced from the `bdd/` subdirectory."
          }
        ],
        text: "**Traceability**:"
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "BDD Feature Files — Gherkin Syntax",
    type: "header"
  },
  {
    text: "Generate `.feature` files using Gherkin syntax (Given-When-Then). Follow these rules:",
    type: "text"
  },
  {
    items: [
      {
        text: "**normal-course.feature**: Happy-path scenarios. Each scenario MUST have a clear Given (context), When (action), and Then (expected outcome). Use Scenario Outline with Examples tables for parameterized cases."
      },
      {
        text: "**exceptions.feature**: Error paths, failure modes, and exception handling. Cover what happens when preconditions fail, when systems are unavailable, and when users perform invalid actions."
      },
      {
        text: "**boundaries.feature**: Boundary value analysis and edge cases. Test at, just below, and just above boundary values for every quantitative constraint identified in the interview."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "README.md — Traceability Index",
    type: "header"
  },
  {
    text: "The README MUST contain:",
    type: "text"
  },
  {
    items: [
      { text: "Feature overview (2-3 sentences summarizing purpose)." },
      { text: "Links to requirements.md and each BDD feature file." },
      { text: "Traceability matrix mapping requirement IDs to BDD scenarios." },
      {
        text: "Open questions or assumptions that need stakeholder validation."
      }
    ],
    type: "unorderedList"
  },
  { level: 2, text: "Compliance Checklist", type: "header" },
  {
    items: [
      {
        text: "Was the interview conducted in a grill-me style (relentless questioning, no assumptions accepted)?"
      },
      {
        text: "Were all stakeholder classes identified and documented?"
      },
      {
        text: "Is each requirement uniquely identified and classified as Functional or Non-Functional?"
      },
      {
        text: "Are functional requirements written in structured natural language (Actor-Action or Use Case)?"
      },
      {
        text: "Are non-functional requirements quantitative with Gilb's Planguage attributes?"
      },
      {
        text: "Does every requirement have a rationale, source, priority, and acceptance criteria?"
      },
      {
        text: "Are BDD scenarios written in Gherkin Given-When-Then syntax?"
      },
      {
        text: "Do BDD files cover normal courses, exceptions, and boundaries?"
      },
      {
        text: "Is the document structure independent of the project's software development lifecycle?"
      },
      {
        text: "Does the README contain a traceability matrix linking requirements to BDD scenarios?"
      },
      {
        text: "Was the user given the opportunity to review and confirm requirements before document generation?"
      }
    ],
    type: "unorderedList"
  },
  { level: 2, text: "SWEBOK v4 Reference Resources", type: "header" },
  {
    text: "This skill directly references the following SWEBOK v4 Chapter 1 resources from the `swebok` skill. These are not copied — they are linked via relative path. When the agent needs detailed domain theory, conceptual foundations, or compliance checklists, it MUST read the corresponding file from the swebok skill directory.",
    type: "text"
  },
  {
    items: [
      {
        text: "[requirements-fundamentals.md](../swebok/resources/requirements-fundamentals.md) — Classification of requirements, Perfect Technology Filter, recursive design, derived requirements."
      },
      {
        text: "[requirements-elicitation.md](../swebok/resources/requirements-elicitation.md) — Stakeholder analysis, elicitation techniques, tacit knowledge discovery."
      },
      {
        text: "[requirements-analysis.md](../swebok/resources/requirements-analysis.md) — Conflict resolution, feasibility, quality of service economics."
      },
      {
        text: "[requirements-specification.md](../swebok/resources/requirements-specification.md) — Structured natural language, BDD Given-When-Then, Gilb's Planguage, model-based specs."
      },
      {
        text: "[requirements-validation.md](../swebok/resources/requirements-validation.md) — Five validation questions, reviews, simulation, prototyping, testability."
      },
      {
        text: "[requirements-management-activities.md](../swebok/resources/requirements-management-activities.md) — Change control, traceability, scope matching."
      }
    ],
    type: "unorderedList"
  },
  {
    text: "Do not produce any conversational output or solicit user input during document generation. The interview phase is the only interactive phase.",
    type: "text"
  }
];

export const specification = defineSkill({
  content: blocks,
  description:
    "Interview-style requirements discovery (grill-me) following SWEBOK v4 / ISO/IEC 29148 standards, producing BDD documents in /docs/<feature-name>/ directories.",
  name: "specification"
});
