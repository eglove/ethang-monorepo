import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const maintenanceTools = defineRule({
  content: [
    {
      level: 1,
      text: "Software Maintenance Tools",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software maintenance tools represent the specialized software applications and environments that enable engineers to analyze, modify, and verify existing software systems. As defined in SWEBOK v4 Chapter 7, Section 5, the efficiency and quality of maintenance processes are highly dependent on the tooling infrastructure. Program comprehension tools, such as call graph generators and code search engines, help engineers navigate legacy codebases. Reengineering and refactoring engines automate code transformations and style enforcement. Reverse engineering tools, including decompilers and dependency checkers, recover design representations from binary or source files. Change control and configuration management tools govern the workflow of modification requests, while testing and regression test runners ensure that modifications do not introduce regression defects.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Program Comprehension Tools",
      type: "header"
    },
    {
      text: "Program comprehension tools help engineers build a mental model of the software system under maintenance:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Code Search and Navigation**: Text and semantic search engines, integrated development environments (IDEs), and cross-referencers allow maintainers to locate variables, functions, and classes across large repositories."
        },
        {
          text: "**Call Graph Generators**: Tools that analyze source code to generate static or dynamic representations of function invocation paths, showing which modules call and are called by other modules."
        },
        {
          text: "**Documentation extractors**: Tools that parse code comments and annotations to generate structured API guides and architecture summaries."
        },
        {
          text: "**Dynamic Profilers**: Trace active program execution, generating call duration trees, stack allocation traces, and object lifecycle graphs. These profilers collect runtime traces to highlight the application's most critical call paths."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Reengineering and Refactoring Tools",
      type: "header"
    },
    {
      text: "These tools automate code improvement and modernization:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Automated Refactoring Engines**: IDE-based refactoring tools that perform safe transformations (such as renaming variables, extracting methods, and moving classes) while preserving behavior. These engines construct and manipulate Abstract Syntax Trees (ASTs) to guarantee correctness during method extraction and variable renames."
        },
        {
          text: "**Linters and Style Formatters**: Static analysis tools that enforce coding standards, detect code smells, and format code to maintain consistency across the codebase."
        },
        {
          text: "**Dependency Visualizers**: Tools that analyze imports and library dependencies to map system architecture and identify structural coupling."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Reverse Engineering Tools",
      type: "header"
    },
    {
      text: "Reverse engineering tools reconstruct design representations from code or compile-time artifacts:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Decompilers**: Tools that translate binary executables back into high-level source code to analyze system behavior when source code is missing. These decompilers parse machine instructions and build control flow graphs (CFGs) to reconstruct structured statements."
        },
        {
          text: "**Design Recovery Environments**: Platforms that parse source code to generate UML diagrams, database schemas, and data flow models."
        },
        {
          text: "**Dependency Checkers**: Tools that verify system compliance with defined architectural boundaries, raising alerts if code imports violate coupling rules."
        },
        {
          text: "**Disassemblers**: Translate low-level binary code into assembly language statements, building control flow graphs (CFGs) to assist in understanding behavior."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Change Control and Configuration Management Tools",
      type: "header"
    },
    {
      text: "Workflow tools govern the lifecycle of modifications:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Modification Request (MR) and Problem Report (PR) Trackers**: Systems that capture, categorize, prioritize, and track user bug reports and feature requests."
        },
        {
          text: "**Version Control Integration**: Tools that link commits to specific MRs or PRs, establishing a clear audit trail."
        },
        {
          text: "**Change Impact Estimators**: Tools that query repository metadata to predict which files are most likely to be affected by proposed commits."
        },
        {
          text: "**Continuous Integration Hook Configurators**: Trigger build loops, lint checks, and testing pipelines automatically upon git commits, enforcing formatting policies via pre-commit or pre-push gates."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Testing and Regression Testing Tools",
      type: "header"
    },
    {
      text: "Testing tools ensure modification safety:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Regression Test Runners**: Tools that execute test suites and manage test execution, allowing maintainers to verify code changes quickly."
        },
        {
          text: "**Coverage Analyzers**: Tools that measure statement, branch, and path coverage to identify untested execution paths."
        },
        {
          text: "**Continuous Integration (CI) Runners**: Automated build servers that trigger compilation, static analysis, and test suites on every code commit."
        },
        {
          text: "**Mutation Testing Frameworks**: Introduce artificial logic faults (mutants) into the source code to test regression suite strength."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Code Profilers and Performance Monitors",
      type: "header"
    },
    {
      text: "Optimizing operational software requires specialized tools to analyze runtime efficiency:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Performance Profilers**: Tools that monitor CPU cycles, memory allocations, and database query latency to pinpoint performance bottlenecks."
        },
        {
          text: "**Memory Leak Detectors**: Automated utilities that scan program state to locate memory leaks and unreleased system resources."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Static Code Analysis Platforms",
      type: "header"
    },
    {
      text: "Large-scale maintenance requires unified platforms to monitor codebase health:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Static Analysis Platforms**: Systems that integrate with the version control system to run security, duplication, and formatting gates on every commit."
        },
        {
          text: "**Metrics Dashboards**: Dashboards that compile code metrics (such as maintainability indices and duplication density) to guide long-term refactoring. These dashboards compute SonarQube-style ratings based on the debt-to-effort ratio."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.8 Codebase Indexing and AST Parsing",
      type: "header"
    },
    {
      text: "Advanced program comprehension tools utilize Abstract Syntax Tree (AST) parsing:",
      type: "text"
    },
    {
      items: [
        {
          text: "**AST Extractors**: Parse source code into tree structures, mapping symbol relationships and generating lexical scopes."
        },
        {
          text: "**Semantic Indexers**: Maintain local databases of codebase identifiers, allowing instant name resolution and symbol trace-through."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.9 Change Impact Analysis Tooling",
      type: "header"
    },
    {
      text: "Estimating change risk programmatically reduces deployment failures:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Static Change Estimators**: Query dependency graphs to identify all modules transitively linked to modified source files."
        },
        {
          text: "**Dynamic Change Estimators**: Analyze past commit patterns and defect records to predict which files are highly correlated with regressions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.10 Automated Test Selection and Test Prioritization Tools",
      type: "header"
    },
    {
      text: "To optimize validation cycles in maintenance, teams use specialized testing utilities:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Test Impact Analyzers**: Tools that analyze code changes and select only the subset of unit and integration tests affected by those changes. This limits build times and reduces CPU utilization during continuous integration cycles. Furthermore, automated test selection minimizes execution times, allowing faster feedback loops for developers and lowering infrastructure costs during active maintenance cycles."
        },
        {
          text: "**Flaky Test Detectors**: Automated systems that run tests repeatedly in isolation to flag non-deterministic assertions, preventing build failures unrelated to code changes."
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
          text: "Are code search engines, cross-referencers, and call graph generators used to navigate and comprehend the legacy codebase?"
        },
        {
          text: "Were automated refactoring engines utilized within the IDE to execute safe, behavior-preserving code modifications?"
        },
        {
          text: "Did the team run linters and code formatters during maintenance to enforce coding standards and eliminate code smells?"
        },
        {
          text: "Were dependency visualizers used to analyze imports and identify tightly coupled or cyclical components?"
        },
        {
          text: "Did the maintainers use reverse engineering tools (such as decompilers or design recovery tools) when analyzing undocumented elements?"
        },
        {
          text: "Are architectural dependency checkers integrated to verify compliance with modular boundaries and detect import violations?"
        },
        {
          text: "Is every change logged, prioritized, and tracked using a dedicated modification request (MR) and problem report (PR) system?"
        },
        {
          text: "Were commits linked directly to MR/PR tracking IDs to maintain audit trails and configuration baselines?"
        },
        {
          text: "Did the team use automated regression test runners to execute validation suites and verify the safety of code changes?"
        },
        {
          text: "Are coverage analyzers run alongside test suites to verify that modified code paths are thoroughly covered by tests?"
        },
        {
          text: "Is a continuous integration runner configured to trigger the build, lint, and test suites automatically on every change?"
        },
        {
          text: "Were impact analysis tools or static analysis checkers used to locate downstream dependencies affected by proposed changes?"
        },
        {
          text: "Are documentation extractors scheduled to run on the source repository, keeping developer references updated with code modifications?"
        },
        {
          text: "Were change impact estimators referenced to assess the potential fallout of commits targeting database configuration layers?"
        },
        {
          text: "Is the toolchain integrated so that a failing build on the CI server locks the release branch until corrective changes are verified?"
        },
        {
          text: "Did the team use performance profilers and memory leak detectors to evaluate the runtime efficiency of modifications?"
        },
        {
          text: "Were static analysis platforms and metrics dashboards integrated into the build loop to track code duplication and maintainability indices?"
        },
        {
          text: "Were semantic indexers and AST extractors used to generate accurate code call graphs during program understanding?"
        },
        {
          text: "Did the change management system utilize dynamic change estimators to identify risk levels before scheduling commits?"
        },
        {
          text: "Did the CI runner use test impact analyzers to select and run only the tests affected by the committed modifications?"
        },
        {
          text: "Are flaky test detectors scheduled to scan and isolate unstable unit tests from the regression suite?"
        },
        {
          text: "Were dynamic profilers and execution tracing tools run to diagnose memory usage and call trees under production-like workloads?"
        },
        {
          text: "Did the team run mutation testing tools to measure and score the strength of regression test suites?"
        },
        {
          text: "Were tools configured to automatically enforce coding standards, licensing compliance, and security policy checks on every pull request?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software maintenance tools, program comprehension tools, reengineering, refactoring engines, reverse engineering, decompilers, change control, configuration management, testing, regression test runners, coverage analyzers",
  filename: "maintenance-tools",
  trigger: "model_decision"
});
