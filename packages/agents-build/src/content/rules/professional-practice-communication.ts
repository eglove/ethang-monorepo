import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const professionalPracticeCommunication = defineRule({
  content: [
    {
      level: 1,
      text: "Communication Skills: Reading, Writing, Team Collaboration, and Presentation",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Communication is a core capability for software engineering practice. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4), a software engineer's professional success and career growth are heavily dependent on their ability to communicate effectively. Engineers must establish clear channels of communication with customers, supervisors, coworkers, and suppliers, both orally and in writing. They must be skilled in reading, understanding, and summarizing technical materials, writing documentation, collaborating within teams, and delivering presentations.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Reading, Understanding, and Summarizing",
      type: "header"
    },
    {
      text: "Software engineers must continuously consume, process, and evaluate technical information from various sources to solve problems, make decisions, and maintain professional competence:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Technical Reading & Reference Evaluation**: Accessing and evaluating technical materials (reference books, manuals, standards, peer-reviewed journals) for validity, authority, and recency. Engineers must synthesize information from conflicting technical documents to form a unified, objective assessment of a technology or technique, sifting through data while avoiding information overload."
        },
        {
          text: "**Technical Summarization**: Translating complex technical findings into clear, high-level summaries for customers, clients, and business stakeholders. This requires simplifying complex trade-offs, architectures, and performance metrics into business-value terms (such as cost, risk, and benefit) to support stakeholder decision-making."
        },
        {
          text: "**Code Comprehension**: Reading and understanding existing source code is a core skill during maintenance and refactoring. Because code is read more often than written, engineers must analyze implementation to understand the explicit execution flow and infer implicit design patterns, architectural structures, and developer intent."
        },
        {
          text: "**Comprehension Models**: Engineers apply top-down comprehension (from high-level goals and architectural models down to code) and bottom-up comprehension (grouping statements into semantic chunks, building up to architecture) to prevent regression during refactoring."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Technical Writing and Documentation",
      type: "header"
    },
    {
      text: "Software engineers are responsible for producing clear, thorough, and accurate written documents. Good technical writing must adapt to the target audience (practitioners, managers, or users), follow a logical flow, and conform to industry standards:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Project and Product Documentation**: Software engineers must document software requirements specifications (SRS), software design documents (SDD), test specifications, test results, tool configurations, and adopted methodologies."
        },
        {
          text: "**Key Disclosures**: Capturing relevant facts, significant risks, licensing, component attribution, and trade-offs. Engineers must clearly document warnings of undesirable or dangerous consequences from software use or misuse."
        },
        {
          text: "**Usability & Readability**: Designing documentation to minimize cognitive load, using standard hierarchies, headings, indexes, and a single-source glossary. Readability can be measured using metrics like Flesch-Kincaid to match the target audience's technical level."
        },
        {
          text: "**Ethical Writing**: Engineers must avoid certifying unacceptable products, disclosing confidential information, or falsifying facts, data, and performance results."
        },
        {
          text: "**User and External Stakeholder Guides**: Documentation must provide information to help stakeholders determine whether the software meets their needs. It must include instructions for safe and unsafe operation, guidance on protecting sensitive data created or stored by the system, and clear identification of warnings and critical procedures."
        },
        {
          text: "**Configuration Management**: Treating documents as configuration items stored in version control, tagged to software releases, and managed under a formal change control process to prevent documentation rot."
        },
        {
          text: "**Document Retention**: Documents must be retained for at least as long as the software product's lifecycle or the duration required by organizational, contractual, or regulatory standards."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Team and Group Communication",
      type: "header"
    },
    {
      text: "High-performing software engineering teams rely on consistent, structured, and constructive communication to coordinate work and align their activities:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Structured Group Forums**: Participating in daily standup meetings, sprint planning sessions, review meetings, and retrospective evaluations. Standup meetings allow developers to sync daily progress, while retrospectives help the team identify process improvements."
        },
        {
          text: "**Communication Paradigms**: Balancing synchronous (meetings, standups) and asynchronous (PR comments, design documents, issue logs) communication. Asynchronous methods suit deep, analytical reviews and prevent cognitive fragmentation, while synchronous forums resolve immediate blocks."
        },
        {
          text: "**Active Listening**: Engaging in active listening to fully understand requirements, constraints, and peer viewpoints before proposing solutions. Active listening involves asking clarifying questions, showing respect for different viewpoints, and resolving conflicts constructively."
        },
        {
          text: "**Conflict Escalation**: Following defined paths for technical disagreements: presenting empirical data, drafting options with trade-offs, consulting senior technical leaders, and respecting the final consensus or architectural decisions."
        },
        {
          text: "**Decision and Action Item Logging**: Documenting design decisions, task assignments, and action items decided during team discussions to prevent alignment drift, resolve ambiguities, and ensure accountability."
        },
        {
          text: "**Constructive Review Feedback**: Communicating technical feedback (e.g., in pull request comments or design reviews) in a constructive, professional, and non-personal manner to maintain team cohesion and psychological safety."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Presentation Skills",
      type: "header"
    },
    {
      text: "Software engineers must periodically present technical information to diverse audiences:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Technical Presentation Walkthroughs**: Delivering design reviews, API walkthroughs, and code explanations to architects and developers. These presentations use precise technical terminology and focus on architectural soundness, algorithms, and data structures."
        },
        {
          text: "**Stakeholder Demos**: Conducting product demonstrations, project status reviews, and training sessions for business clients or end users."
        },
        {
          text: "**Adaptive Communication**: Adjusting the presentation's level of abstraction depending on the audience—focusing on code architecture for developers and focusing on risks, costs, and business benefits for management. Presentations must be structured, clear, respect time constraints, and use effective visual aids."
        },
        {
          text: "**Visual Aids & Demos**: Designing charts, sequence diagrams, and flowcharts to minimize cognitive load by omitting unnecessary details. Product demonstrations should follow structured user scenarios rather than random feature testing."
        },
        {
          text: "**Q&A Management**: Handling questions professionally during reviews. This involves active listening, paraphrasing to confirm understanding, answering concisely based on data, and documenting follow-up tasks for unresolved queries."
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
          text: "Are team members allocated time to read and study technical resources, reference manuals, and industry standards?"
        },
        {
          text: "Are references and external sources evaluated for validity, authority, and recency before adoption?"
        },
        {
          text: "Do engineers perform systematic code reviews to improve their code reading and comprehension capabilities?"
        },
        {
          text: "Do engineers utilize program comprehension models (top-down or bottom-up) when analyzing legacy codebases?"
        },
        {
          text: "Are technical summaries compiled for stakeholders to simplify the decision-making process?"
        },
        {
          text: "Is all written documentation (SRS, SDD, user guides) structured logically and formatted for readability?"
        },
        {
          text: "Are document readability metrics (e.g., Flesch-Kincaid) used to match the target audience's level?"
        },
        {
          text: "Does documentation clearly highlight security guidelines and methods for protecting sensitive user data?"
        },
        {
          text: "Are safety instructions and warnings of potential software misuse prominently displayed in user manuals?"
        },
        {
          text: "Are all documentation files treated as configuration items, version-controlled, and synchronized with code releases?"
        },
        {
          text: "Are documentation retention schedules defined and aligned with regulatory and project lifecycles?"
        },
        {
          text: "Is technical writing adapted to the target audience, separating developer documentation from user manuals?"
        },
        {
          text: "Do team members participate actively in structured communication forums (daily standups, planning, retrospectives)?"
        },
        {
          text: "Does the team establish a clear balance between synchronous meetings and asynchronous coordination?"
        },
        {
          text: "Are key architectural decisions and action items decided during meetings formally documented?"
        },
        {
          text: "Do code review comments use constructive, non-personal language to foster collaborative growth?"
        },
        {
          text: "Does the team follow a defined conflict escalation path to resolve technical disagreements objectively?"
        },
        {
          text: "Are presentations and visual aids designed to minimize cognitive load by focusing on essential architecture?"
        },
        {
          text: "Are product demonstrations and user training sessions conducted using structured user scenarios?"
        },
        {
          text: "Do engineers paraphrase and document follow-up questions during review sessions to ensure clarity?"
        },
        {
          text: "Is there an escalation plan in place to handle project delays and report them to supervisors?"
        },
        {
          text: "Has the team established a vocabulary baseline (glossary) to ensure consistent terminology across documentation?"
        },
        {
          text: "Do engineers practice active listening and verify technical requirements with stakeholders prior to implementation?"
        },
        {
          text: "Are presentation materials reviewed for clarity, timing, and audience appropriateness before delivery?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "communication skills, technical reading, code comprehension, summarization, technical writing, documentation, SRS, SDD, team communication, active listening, presentation skills, technical presentation, user training",
  filename: "professional-practice-communication",
  trigger: "model_decision"
});
