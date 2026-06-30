import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsHumanFactors = defineRule({
  content: [
    {
      level: 1,
      text: "User and Developer Human Factors",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software engineering is fundamentally a human-centric discipline. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, Section 8, the design, development, and maintenance of software systems must account for the cognitive capabilities, limitations, and behaviors of two primary groups: software users and software developers. While users require intuitive, efficient, and reliable interfaces to achieve their operational goals, developers require readable, maintainable, and well-structured codebases to manage long-term system evolution. Neglecting human factors on either side leads to software that is either rejected by the market due to poor user experience, or becomes unmaintainable over time due to technical debt and code erosion.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Human-Computer Interaction (HCI) and User Experience (UX)",
      type: "header"
    },
    {
      text: "Human-Computer Interaction (HCI) is the subdiscipline of computer science focused on the design and implementation of technology that facilitates interaction between humans and computers. User Experience (UX) serves as the primary metric for user satisfaction, encompassing all aspects of the end-user's interaction with the company, its services, and its products.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Natural Interaction**: The ultimate goal of HCI design is to create interfaces that feel as natural and intuitive as human-to-human communication, minimizing the cognitive barrier between user intent and system execution."
        },
        {
          text: "**system Transparency**: Interfaces must present a consistent mental model of the system's internal state, allowing users to predict how the system will react to their inputs."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 User Human Factors: Cognitive Load and Ergonomics",
      type: "header"
    },
    {
      text: "To design interfaces that accommodate user cognitive limits, software engineers must minimize cognitive load—the total amount of mental effort being used in the working memory:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Intelligent Workflows**: Interfaces should guide the user through logical, minimal, and easy-to-follow steps to complete a task, avoiding unnecessary fields or screen transitions."
        },
        {
          text: "**Self-Explanatory Design**: The user interface should be self-documenting, enabling self-learning so that users can discover functionality without reading external manuals."
        },
        {
          text: "**Consistent Responses**: system response latency must be consistent. Large fluctuations in response times increase user anxiety and lead to operational errors."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 State Recovery and User Control",
      type: "header"
    },
    {
      text: "User interfaces must respect the user's autonomy and provide safety nets against accidental actions:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Transactional Interruption**: Users must be able to interrupt long-running operations safely without destabilizing the system."
        },
        {
          text: "**Undo and Redo**: Systems should provide robust undo and redo mechanisms for all major state-changing transactions."
        },
        {
          text: "**Error Recovery**: When errors occur, the system must present clear, constructive, and jargon-free messages. More importantly, the system must offer a clear path to regain its original, healthy state without forcing the user to restart the application or lose their work."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 User Profiles and Device Interfaces",
      type: "header"
    },
    {
      text: "system design must begin with an analysis of user profiles:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Demographics and Accessibility**: Understanding the users' technical expertise, physical limitations, and operational environment (e.g., high-glare environments, low-bandwidth connections)."
        },
        {
          text: "**Multi-Modal Interfaces**: Designing for various input and output modalities, including keyboards, touch pads, mouse pointers, voice control, audio feedback, and high-resolution displays. The software must adapt gracefully to the inputs and devices available to the user."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Prototyping and Iterative UI Design",
      type: "header"
    },
    {
      text: "User interfaces cannot be designed perfectly in a single pass. They require iterative cycles:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Low-Fidelity to High-Fidelity**: UI development must progress from basic wireframes and paper prototypes to interactive mockups and fully functional prototypes."
        },
        {
          text: "**Usability Testing**: Regular feedback loops with real users must be conducted at each stage of prototyping to identify bottlenecks, confusing layouts, or alignment issues before production code is written."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Developer Human Factors: Software Longevity and Readability",
      type: "header"
    },
    {
      text: "Software lives much longer than the time taken to construct it. In the software industry, the engineers who maintain, debug, and enhance a codebase are almost always different from the authors who wrote the initial code.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Writing for Others**: Developers must write code under the assumption that someone else will read, debug, and modify it under tight schedules."
        },
        {
          text: "**Documentation**: Comprehensive and up-to-date documentation (in-code comments, READMEs, architectural descriptions) is crucial at every stage of the software engineering lifecycle to preserve design rationale and prevent knowledge loss."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Coding Standards as Team Alignments",
      type: "header"
    },
    {
      text: "A system's readability is severely degraded when developers apply conflicting coding styles. Quality-conscious organizations establish and enforce clear coding standards:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Naming Conventions**: Defining uniform naming rules for variables, classes, functions, and files (e.g., camelCase vs. PascalCase, prefixing interfaces)."
        },
        {
          text: "**Structure and Commenting**: Enforcing consistent indentation, file sizes, and comment templates."
        },
        {
          text: "**Vulnerability Prevention**: Standardized coding styles prevent common developer errors. In fact, studies estimate that up to 82% of software security vulnerabilities are caused by inconsistencies or clashes in programming styles within a development team."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Programming Style and Cognitive Compression",
      type: "header"
    },
    {
      text: 'Code readability is not just about aesthetics; it is about reducing the cognitive load on the maintaining engineer. As Steve McConnell noted, "Code is read many more times than it is written. Consider whether write-time convenience is a false economy." Robert "Uncle Bob" Martin summarized, "Clean code always looks like it was written by someone who cares."',
      type: "text"
    },
    {
      items: [
        {
          text: "**Code as Literature**: High-quality code should be legible and easily comprehended, reading like a clear narrative rather than a cryptic puzzle."
        },
        {
          text: '**Meaningful Comments**: Comments should not restate what the code does, but rather explain the "why" behind non-obvious design decisions, constraints, or edge cases.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.9 Behavioral and Cognitive Traits of Engineers",
      type: "header"
    },
    {
      text: "A successful software engineer possesses traits that balance technical ability with interpersonal collaboration:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Team Collaboration**: Software engineering is a team sport. Engineers must participate constructively in peer reviews, pair programming, and collaborative design sessions."
        },
        {
          text: "**Puzzle-Solving and Agility**: Engineers must enjoy solving complex logical puzzles while remaining adaptable to changing requirements and environments."
        },
        {
          text: "**Structured and Modular Thinking**: The ability to decompose large, ambiguous problems into small, highly cohesive, and loosely coupled modules is a fundamental engineering skill."
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
          text: "**HCI Principles Applied**: Have the principles of Human-Computer Interaction been applied to create a natural, intuitive flow between user actions and system state?"
        },
        {
          text: "**UX Metrics Defined**: Are there concrete metrics established to measure User Experience and user satisfaction (e.g., task completion rates, error rates, system usability scores)?"
        },
        {
          text: "**Cognitive Load Minimization**: Has the user workflow been simplified to minimize the number of steps, fields, and screen changes required to complete tasks?"
        },
        {
          text: "**Self-Explanatory Interface**: Does the GUI utilize clear labels, tooltips, and contextual help to allow self-learning without requiring external manuals?"
        },
        {
          text: "**Response Latency Constraints**: Has the system response latency been tested to ensure it remains consistent under varying traffic conditions?"
        },
        {
          text: "**Transactional Interruption**: Can users safely interrupt or cancel long-running processes without putting the database or application into an inconsistent state?"
        },
        {
          text: "**Undo/Redo Infrastructure**: Are critical user actions protected by transactional undo and redo mechanisms?"
        },
        {
          text: "**Contextual Error Messages**: Do error dialogs provide clear, non-technical descriptions of the issue along with a visible recovery path?"
        },
        {
          text: "**User Profile Alignment**: Has the interface design been audited against the target user profiles (technical expertise, accessibility needs, environmental constraints)?"
        },
        {
          text: "**Multi-Modal Adaptation**: Does the application adapt gracefully to different input/output hardware configurations (touch screens, screen readers, voice)?"
        },
        {
          text: "**Iterative Prototyping History**: Is there a documented history of low-fidelity and high-fidelity prototyping and usability testing preceding the final UI build?"
        },
        {
          text: "**Readability for Maintainers**: Has the code been reviewed by an engineer who did not write it, verifying that it is readable and self-explanatory?"
        },
        {
          text: "**Up-to-Date Documentation**: Are the architecture descriptions, API specifications, and README files updated to match the descriptive implementation?"
        },
        {
          text: "**Coding Standard Enforcement**: Are automated linters and formatters configured to strictly enforce the team's naming, indentation, and structure rules?"
        },
        {
          text: "**Vulnerability Style Review**: Has the code been scanned for ad-hoc style deviations that could introduce logic errors or security vulnerabilities?"
        },
        {
          text: '**Steve McConnell Economical Rule**: Did the developer avoid "write-time convenience" shortcuts that increase long-term code comprehension costs?'
        },
        {
          text: "**Uncle Bob Martin Cleanliness Check**: Does the implementation follow clean code practices, appearing highly organized and structured?"
        },
        {
          text: '**Comment Rationale Focus**: Do in-code comments focus on explaining the "why" of design decisions rather than repeating what the code does?'
        },
        {
          text: "**Team Player Dynamics**: Has the code undergone a peer review where the author demonstrated intellectual honesty and openness to feedback?"
        },
        {
          text: "**Modular Problem Decomposition**: Is the system decomposed into small, cohesive functions or classes rather than large, monolithic code blocks?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "user human factors, developer human factors, human-computer interaction, user experience, clean code, coding standards, usability testing, prototyping",
  filename: "computing-foundations-human-factors",
  trigger: "model_decision"
});
