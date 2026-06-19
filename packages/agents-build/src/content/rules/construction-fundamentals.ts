import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const constructionFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Construction Fundamentals",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software construction is the detailed creation of working, meaningful software through a combination of coding, verification, unit testing, integration testing, and debugging. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4, Section 1, software construction fundamentals represent the core principles that govern how developers write source code, manage dependencies, and ensure systems are secure, maintainable, and verifiable. ",
      type: "text"
    },
    {
      text: "Because construction deals directly with the physical constraints of execution environments, operating systems, compiler outputs, and networks, it is a highly practical activity where engineering principles must be applied under changing real-world constraints. SWEBOK v4 notes that software engineering can often feel most craft-like during software construction compared to other lifecycle phases. The five primary pillars of software construction fundamentals are complexity minimization, change anticipation, verification-driven construction, systematic asset reuse, and strict standards compliance. Applying these principles during the implementation phase ensures that the constructed software remains structurally sound throughout its lifecycle, minimizing technical debt and preventing regression defects.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Minimizing Complexity",
      type: "header"
    },
    {
      text: "Minimizing complexity is the single most critical objective in software construction. Because software developers have a limited capacity to hold complex structures in working memory over long periods, the construction process must prioritize simplicity and readability over cleverness.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Cognitive Load and Simple Code**: Code should be written in a direct, readable style that conveys intent immediately. Obscure language features, deep nesting, and implicit side-effects increase cognitive load and introduce bugs. Developers reduce complexity by replacing nested if-else structures with early exit guard clauses, maintaining low parameter counts, and separating side-effects from pure computations."
        },
        {
          text: "**Cyclomatic Complexity (McCabe, 1976)**: A static analysis metric that measures the complexity of a program by calculating the number of linearly independent paths through its source code. Represented mathematically as $V(G) = E - V + 2P$ (where E is edges, V is vertices, and P is connected components), it dictates the minimum number of unit test cases required to achieve complete path coverage. High cyclomatic complexity scores correlate directly with high defect density, security vulnerabilities, and poor testability."
        },
        {
          text: "**Process Complexity Management**: Utilizing build tools (such as Make or package managers like pnpm) and Integrated Development Environments (IDEs) to automate construction steps, compile code, and run static checkers, reducing human error."
        },
        {
          text: "**Modularity and Cohesion**: Restricting modules to a single, well-defined responsibility to keep local complexity low and simplify test isolation."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Anticipating and Embracing Change",
      type: "header"
    },
    {
      text: "Most software systems operate in evolutionary environments where requirements, hardware platforms, and external dependencies change continuously. Software engineers must both anticipate and adapt to these changes during construction.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Extensible Construction**: Structuring code to allow new capabilities to be added with minimal disruption to the underlying architecture. This is supported by encapsulation, abstract interfaces, and clean dependency directions."
        },
        {
          text: "**Flexibility and Adaptability**: Designing code to be configured rather than hardcoded, utilizing configuration files, runtime parameters, and parameterization to adapt to different execution environments."
        },
        {
          text: "**Embracing Change**: Adopting agile methodologies, DevOps practices, and continuous delivery (CD) pipelines. This evolutionary approach ensures that incremental updates can be integrated, tested, and deployed to production frequently, fast, and reliably. Automated pipelines run tests, compile binaries, and check compliance flags, allowing development teams to react immediately to security disclosures or environmental updates."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Constructing for Verification",
      type: "header"
    },
    {
      text: "Constructing for verification means structuring the software during the coding phase so that bugs and execution faults can be easily detected by developers, automated test runners, and eventual end-users.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Test-Ready Code Structure**: Organizing routines and classes to support automated unit and integration testing. This includes wrapping external dependencies behind interfaces and utilizing dependency injection to allow stubbing and mocking."
        },
        {
          text: "**Restricting Language Subsets**: Avoiding complex, non-deterministic, or unsafe language structures (such as unchecked memory pointers, dynamic evaluations, or global state mutation) that make static analysis and test assertions difficult."
        },
        {
          text: "**Diagnostic Logging**: Recording software behaviors, execution states, and data transitions systematically in execution logs, enabling rapid post-mortem analysis when failures occur. Log statements should produce structured JSON outputs with trace IDs, correlation hashes, severities, and timestamps, allowing log aggregators to trace execution paths across distributed systems."
        },
        {
          text: "**Coding Standards and Reviews**: Following a consistent style to support peer reviews and static code analysis."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Reusing Assets",
      type: "header"
    },
    {
      text: "Reuse concerns using existing software assets to solve different problems, reducing redundant coding and improving productivity. Systematic reuse requires a well-defined process and is divided into two facets:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Construction for Reuse**: Designing software assets (such as modules, libraries, or components) with the explicit intention that they will be reused in future systems. This is supported by variability analysis, parameters, and design patterns that encapsulate common logic and prevent the creation of code clones."
        },
        {
          text: "**Construction with Reuse**: Constructing new systems by integrating existing assets. This includes language runtime libraries, open-source packages, commercial off-the-shelf (COTS) components, and cloud-based services (such as BaaS) that delegate common utilities like authentication, messaging, and storage to reliable external providers. Package managers (e.g., pnpm) are used to manage the dependency supply chain, minimizing structural bloat and preventing dependency vulnerability propagation."
        },
        {
          text: "**Decoupling BaaS Integrations**: When delegating core infrastructure concerns (like identity services, databases, or content delivery) to BaaS systems, developers must design adapters to decouple application business logic from proprietary cloud SDKs. This ensures code portability and avoids vendor lock-in."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Applying Standards in Construction",
      type: "header"
    },
    {
      text: "Applying internal and external standards during the coding phase is a key aid in achieving a project's efficiency, quality, cost, and security objectives.",
      type: "text"
    },
    {
      items: [
        {
          text: "**External Standards**: Conforming to specifications defined by hardware vendors, language committees, and international standards organizations (e.g., ISO, IEEE, OMG) for API interfaces and communication protocols. Examples include conforming to W3C layout models, IETF RFCs for data transmission, or language-specific compiler standards."
        },
        {
          text: "**Internal Standards**: Establishing corporate or project-specific guidelines, including naming conventions, layout/indentation standards, operating system interface call boundaries, and centralized exception handling policies (standardizing what information is logged when an exception is caught). Conforming to these guidelines ensures high readability and code conceptual integrity."
        },
        {
          text: "**Automation of Standards Checking**: Utilizing automated linting systems (e.g., ESLint) and formatter tools (e.g., Prettier) to verify and enforce compliance automatically during pre-commit hooks or continuous integration pipeline runs."
        },
        {
          text: "**Secure Language Subsets**: Limiting language usage to safe subsets to prevent security vulnerabilities, such as buffer overflows, memory leaks, and array index out-of-bounds errors."
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
          text: "Has the source code been reviewed to verify that cyclomatic complexity is kept low to ensure testability?"
        },
        {
          text: "Were complex or non-deterministic programming structures avoided to minimize cognitive load?"
        },
        {
          text: "Did the implementation anticipate change by using abstract interfaces, parameterization, or configuration tables?"
        },
        {
          text: "Is the code structured to support automated unit and integration testing (e.g., utilizing dependency injection)?"
        },
        {
          text: "Have external dependencies been isolated or wrapped behind interfaces to facilitate test mocking?"
        },
        {
          text: "Was diagnostic logging implemented systematically to record execution behaviors and error states?"
        },
        {
          text: 'Did the developer practice "construction with reuse" by leveraging verified standard libraries, frameworks, or open-source packages?'
        },
        {
          text: "Were reusable helpers and common utility functions extracted into shared modules to prevent code clones?"
        },
        {
          text: "Does the codebase comply with external API, interface, and protocol standards (e.g., ISO, IEEE)?"
        },
        {
          text: "Did the implementation follow internal coding standards for naming, indentation, and project layout?"
        },
        {
          text: "Is there a centralized exception handling policy that standardizes error propagation and logging formats?"
        },
        {
          text: "Were unsafe language features or dangerous library functions avoided to prevent security breaches (e.g., buffer overflows)?"
        },
        {
          text: "Has the code undergone peer review or static analysis checks to verify conformity with coding baselines?"
        },
        {
          text: "Were transaction and lock durations minimized when accessing shared concurrent resources to prevent deadlocks?"
        },
        {
          text: "Is the build and dependency management process automated using package managers (e.g., pnpm) to handle updates reliably?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software construction, coding, implementation, writing code, refactoring, source code, debugging, compiling, unit testing, complexity minimization, cyclomatic complexity, code standards, code reuse, dependency management, or implementing software components using the antigravity cli",
  filename: "construction-fundamentals",
  trigger: "model_decision"
});
