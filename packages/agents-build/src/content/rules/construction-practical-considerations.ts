import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const constructionPracticalConsiderations = defineRule({
  content: [
    {
      level: 1,
      text: "Software Construction Practical Considerations",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software construction is a highly practical engineering activity that occurs under the influence of changing, complex, and sometimes conflicting real-world constraints. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4, Section 3, software construction is characterized by practical considerations that drive the implementation process, requiring developers to balance abstract designs with the physical realities of compilers, runtimes, operating systems, and deployment platforms. It is during construction that software engineering is perhaps most craft-like, as developers must continuously make micro-design decisions, select appropriate construction languages, enforce coding disciplines, verify behaviors, and integrate components systematically.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Construction Design",
      type: "header"
    },
    {
      text: "While high-level architectural design is completed before implementation in many lifecycle models, some detailed design work always occurs during construction. This design activity at the construction level is dictated by constraints imposed by the real-world problem and the selected execution environment:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Design Adaptations**: Developers make micro-design modifications during coding (e.g., local interfaces, data representation mappings) to address gaps in high-level design templates."
        },
        {
          text: "**Micro-Scale Design**: Abstraction, modularization, and encapsulation are applied locally to algorithms, data structures, and helper components."
        },
        {
          text: "**Defensive Design**: Pre-conditions, post-conditions, and invariants are defined to handle exceptions and invalid inputs, securing execution control flow."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Construction Languages",
      type: "header"
    },
    {
      text: "Construction languages encompass all forms of communication by which a human specifies an executable solution to a problem. The choice and implementation of a construction language (e.g., compilers and interpreters) directly influence critical quality attributes such as performance, reliability, portability, and security:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Configuration Languages**: The simplest languages (e.g., config files, parameter lists) where developers choose options to configure software."
        },
        {
          text: "**Toolkit Languages**: Build applications from sets of pre-existing reusable parts defined by toolkit API interfaces."
        },
        {
          text: "**Scripting Languages**: Automate tasks, orchestrate components, or execute macros using common scripting platforms."
        },
        {
          text: "**Programming Languages**: Flexible, general-purpose languages utilizing textual strings (linguistic), mathematical definitions (formal Event-B), or graphic icons (visual layout builders)."
        },
        {
          text: "**Domain-Specific Languages (DSLs)**: High-abstraction languages designed specifically for a single problem class or application domain."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Coding",
      type: "header"
    },
    {
      text: "Coding is the central activity of software construction, requiring the application of systematic techniques to translate designs into understandable and secure source code:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Creating Understandable Code**: Developers must use clear coding disciplines, including naming conventions and source code layouts. This reduces cognitive load during maintenance."
        },
        {
          text: "**Construct and Resource Usage**: Structuring source code into statements, routines, classes, and packages, utilizing enums, named constants, variables, and other entities. Developers must manage resources carefully, using synchronization mechanisms and exclusion protocols to control access to shared, serially reusable resources such as memory buffers, execution threads, and database locks."
        },
        {
          text: "**Handling Error Conditions**: Designing code to handle both anticipated error conditions (e.g., invalid user inputs or network dropouts) and exceptional states without crashing the application."
        },
        {
          text: "**Prevention of Security Breaches**: Enforcing coding guidelines to prevent code-level security vulnerabilities, such as buffer overflows, array index bounds errors, and memory leaks. The choice of programming language and standard libraries directly affects the likelihood of introducing these vulnerabilities."
        },
        {
          text: "**Code Tuning**: Improving performance at the code level by modifying correct code to make it run more efficiently. Code tuning usually involves small changes affecting a single class, routine, or a few lines of code (such as logic expression flattening, loop optimization, or data transformation)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Construction Testing",
      type: "header"
    },
    {
      text: "Construction testing involves verifying the functioning of software modules in isolation and after integration. It is typically performed by the software engineer who wrote the code:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Unit and Integration Testing**: Unit testing verifies the behavior of individual, separately testable elements (such as classes or routines). Integration testing verifies the interactions and communication pathways between these elements."
        },
        {
          text: "**Minimizing the Feedback Gap**: The primary objective of construction testing is to reduce the time gap between when a fault is inserted into the code and when it is detected, significantly reducing the cost of fixing the defect."
        },
        {
          text: "**Standardized Frameworks**: Developers leverage unit testing frameworks to automate test runs, aligning their test documentations with industry standards (e.g., IEEE Standard 829 for Software Test Documentation and IEEE Standard 1008 for Software Unit Testing)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Reuse in Construction",
      type: "header"
    },
    {
      text: "Software reuse is a systematic discipline divided into two distinct engineering activities that improve productivity and quality:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Construction for Reuse**: Designing and implementing software assets (e.g., libraries, API components) with the explicit intention that they will be reused in future systems. This requires variability analysis, encapsulation of common functionality, parameterization, and detailed description/publication of the assets to prevent the creation of duplicate code clones."
        },
        {
          text: "**Construction with Reuse**: Building new software systems by integrating pre-existing software assets. This includes utilizing language-provided libraries, open-source packages, shared frameworks (like Spring), and cloud-delegated services (such as Backend-as-a-Service, or BaaS). Reused assets must meet the same security, performance, and reliability quality requirements as custom code."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Construction Quality",
      type: "header"
    },
    {
      text: "Ensuring construction quality requires the execution of multiple static and dynamic verification techniques targeted at code-adjacent artifacts:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Quality Verification Techniques**: Quality assurance is achieved by combining unit/integration testing, test-first development (TDD), assertions, defensive programming, and debugging with static analysis and peer reviews."
        },
        {
          text: "**inspections and Reviews**: Conducting structured inspections and security-oriented technical reviews of source code and detailed designs."
        },
        {
          text: "**Focus on Code-Adjacent Artifacts**: Unlike quality assurance activities that evaluate requirements or high-level plans, construction quality activities focus specifically on artifacts directly connected to code, such as source files, compiler options, and static analysis outputs."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Integration",
      type: "header"
    },
    {
      text: "During construction, individually developed routines, classes, components, and subsystems must be combined into a cohesive, single system:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Integration Strategies**:\n- *Phased Integration (Big Bang)*: Delaying the integration of components until all parts are completely constructed. This approach is highly discouraged as it results in high risk and difficult defect isolation.\n- *Incremental Integration*: Combining components one by one and testing the system at each step. This limits the diagnostic search space, simplifies error location, and provides early progress feedback. It requires the construction of test infrastructure, including stubs, drivers, and mock objects."
        },
        {
          text: "**Continuous Integration (CI)**: A modern development practice where team members integrate their work frequently (multiple times per day), automated by pipelines that compile, test, and verify each commit to detect errors rapidly."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Cross-Platform Development and Migration",
      type: "header"
    },
    {
      text: "Modern software systems often target multiple execution environments (e.g., desktop, mobile, cloud runtimes), requiring specific construction strategies:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Cross-Platform Strategies**: Developers build applications using a universal language and export them to different platforms. This is accomplished either by compiling the code into platform-specific native binaries using specialized tools, or by developing hybrid applications that combine web technologies (HTML5, CSS) with native containers or wrappers."
        },
        {
          text: "**Platform Migration**: Porting an existing application from one operating environment to another. Migration involves translating programming languages, adapting platform-specific APIs, and using automated translation tools to minimize rewrite costs."
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
          text: "Were detailed micro-design decisions (algorithms, data structures, interfaces) aligned with the real-world constraints of the problem?"
        },
        {
          text: "Was the choice of construction language (configuration, scripting, programming, or domain-specific language) evaluated for security and performance risks?"
        },
        {
          text: "Were coding standards (naming conventions, layout, and comment disciplines) followed to ensure code understandability?"
        },
        {
          text: "Did the implementation prevent concurrency issues by utilizing exclusion mechanisms and locking protocols for serially reusable resources?"
        },
        {
          text: "Were defensive programming techniques and assertions implemented to handle anticipated errors and invalid inputs?"
        },
        {
          text: "Has construction testing (unit testing and integration testing) been executed to detect and resolve defects early?"
        },
        {
          text: "Did the development follow unit testing and test documentation standards (e.g., IEEE Standard 1008 or IEEE Standard 829)?"
        },
        {
          text: "Was construction for reuse practiced by implementing variability mechanisms (parameterization, encapsulation) to prevent duplicate code clones?"
        },
        {
          text: "Were reused software assets (external libraries, frameworks, or cloud-provided BaaS services) verified to meet the project's quality and security requirements?"
        },
        {
          text: "Was code quality verified using a combination of testing, assertions, reviews, and automated static analysis checks?"
        },
        {
          text: "Was the integration sequence planned and executed using an incremental approach to simplify defect isolation?"
        },
        {
          text: "Did the team leverage a continuous integration pipeline to build and verify code updates frequently?"
        },
        {
          text: "Has the cross-platform development approach (native compilation, hybrid containers, or platform migration) been documented and verified?"
        },
        {
          text: "Were code tuning techniques applied only to verified hot spots to optimize execution speed and resource consumption?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software construction practical considerations, construction design, construction languages, coding, construction testing, reuse in construction, construction quality, integration, cross-platform development, and migration",
  filename: "construction-practical-considerations",
  trigger: "model_decision"
});
