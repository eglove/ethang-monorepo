import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const qualityTools = defineRule({
  content: [
    {
      level: 1,
      text: "Software Quality Tools: Static, Dynamic, Safety Hazard, and Measurement Tools",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software quality tools are defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as the mechanisms, utilities, and automated systems used to improve software quality, process efficiency, and product reliability. Rather than relying on manual, error-prone verification processes, software engineering utilizes a diverse spectrum of tools to enforce compliance, automate appraisal activities, and analyze quality data. Software quality tools span the entire lifecycle, ranging from simple manual forms and checklists to highly sophisticated automated systems embedded in DevOps pipelines.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Classification of Quality Tools: Simple vs. Automated",
      type: "header"
    },
    {
      text: "Software quality tools are broadly classified based on their level of automation and integration:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Simple Tools**: Manual, non-automated artifacts that guide human cognitive activities and enforce quality checks. Examples include requirements traceability matrices, code review checklists, and document inspection templates. These tools ensure that review activities are structured, repeatable, and complete."
        },
        {
          text: "**Automated Tools**: Software applications that perform quality-focused operations automatically. Examples include source code version control and branching systems (such as Git), pull request platforms that facilitate and record code reviews, and environment provisioning utilities."
        },
        {
          text: "**DevOps Quality Tools**: Automated systems integrated into continuous integration and continuous delivery (CI/CD) pipelines. These include on-demand testing environments, automated build and regression testing runners, and code quality assessment scanners. These tools provide rapid feedback to developers and enforce quality gates before code is integrated or deployed."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Static and Dynamic Analysis Tools",
      type: "header"
    },
    {
      text: "Quality tools are further categorized by whether they require code execution:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Static Analysis Tools**: Analyze software work products—including source code, architectural designs, database schemas, and models—without executing the software. They perform lexical, syntactical, and semantic analysis to identify syntax errors, style violations, security vulnerabilities, and code anomalies. Static analysis tools range from basic code formatters and linters to advanced semantic model checkers and symbolic execution tools.\n- *Lexical Analysis*: Tokenizing source text to verify naming conventions and formatting styles.\n- *Syntax Analysis*: Parsing source code into an Abstract Syntax Tree (AST) to verify grammatical correctness and detect code structure anomalies.\n- *Semantic Analysis*: Conducting type checking, resource tracking, and control/data flow analysis to detect dead code, null-pointer references, and type mismatches.\n- *Metrics Scanners*: Computing complexity metrics, such as McCabe cyclomatic complexity and cognitive complexity, to identify hard-to-maintain files. It also includes architectural metrics such as afferent coupling, efferent coupling, Instability index, and Lack of Cohesion in Methods (LCOM)."
        },
        {
          text: "**Dynamic Analysis Tools**: Evaluate the system during execution.\n- *Test Runners and Harnesses*: Automated frameworks that execute test suites, manage test execution order, resolve test dependencies, execute tests in parallel to minimize latency, clean up test state, and record outcomes.\n- *Coverage Scanners*: Measure the completeness of testing by recording statement coverage, branch coverage, and path coverage.\n- *Profiling Tools*: Analyze CPU and memory consumption in real time to detect performance bottlenecks.\n- *Memory Debuggers*: Identify memory leaks, dangling pointers, race conditions, and synchronization failures. Advanced memory debuggers instrument binary code or run within a virtual machine to track heap and stack allocations, detecting uninitialized reads, buffer overflows, and double frees.\n- *Robustness Evaluation Tools*: Inject faults (fault injection tools) or run automated fuzz testing (fuzzers) using randomized input sequences to identify security vulnerabilities and crash triggers under stress conditions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Categories of Static Quality Tools",
      type: "header"
    },
    {
      text: "SWEBOK v4 defines four primary categories of static software quality tools that support quality management and assurance processes:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Review and Inspection Automation Tools**: Partially automate and control the peer review and inspection process. They route work products to assigned reviewers, allow inline commenting, and record defects and issues discovered during reviews for subsequent removal. These tools maintain an audit trail of review activities and verify that quality gates are satisfied before code integration. They are often coupled with on-demand environment provisioners that compile and deploy preview environments for reviewers."
        },
        {
          text: "**Software Safety Hazard Analysis Tools**: Help engineers perform hazard and risk analysis for safety-critical and high-integrity systems. They provide automated support for:"
        }
      ],
      type: "numberedList"
    },
    {
      items: [
        {
          text: "*Failure Mode and Effects Analysis (FMEA)*: Scans and analyzes potential component failure modes, calculates Risk Priority Numbers (RPN) based on severity, occurrence likelihood, and detection capability, and tracks mitigation plans."
        },
        {
          text: "*Failure Mode, Effects, and Criticality Analysis (FMECA)*: Extends FMEA by classifying failure modes according to their criticality."
        },
        {
          text: "*Hazard and Operability Study (HAZOP) Tools*: Guide multidisciplinary teams through systematic analysis of system designs using standardized guide words."
        },
        {
          text: "*Fault Tree Analysis (FTA)*: Employs top-down deductive logic and boolean logic gates (AND/OR gates) to trace system-level hazards back to basic event causes."
        }
      ],
      type: "unorderedList"
    },
    {
      items: [
        {
          text: "**Problem Tracking and Bug Tracking Tools**: Support the entry, analysis, disposition, and resolution of software anomalies discovered during testing and operations. These tools coordinate the debugging workflow, track the status of bug fixes, and maintain historical records of defect trends. They enforce the defect lifecycle, managing transitions between states: New, Assigned, Open, Resolved, Retested, Verified, and Closed. They categorize defects by severity (Blocker, Critical, Major, Minor, Trivial) and priority (High, Medium, Low) to determine SLA compliance."
        },
        {
          text: "**Quality Data Analysis and Visualization Tools**: Capture and analyze data from software engineering and test environments, producing visual displays in the form of graphs, charts, and tables. These tools perform statistical analysis on quality datasets to discern trends, forecast reliability, and calculate quality metrics.\nKey metrics generated and visualized by these tools include:"
        }
      ],
      type: "numberedList"
    },
    {
      items: [
        {
          text: "*Defect Injection and Removal Rates*: The frequency with which defects are introduced and subsequently detected across different lifecycle phases."
        },
        {
          text: "*Defect Density*: The number of defects normalized by system size (e.g., defects per line of code)."
        },
        {
          text: "*Phase Yields*: The percentage of defects removed during a specific development phase relative to the total number of defects present."
        },
        {
          text: "*Defect Distribution*: The categorization of defects by type, severity, and module."
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
          text: "Are simple tools, such as requirements traceability matrices and code review checklists, utilized systematically across all development phases?"
        },
        {
          text: "Does the project utilize automated version control and branching systems to manage and track source code changes?"
        },
        {
          text: "Are code review workflows supported and audited using automated pull request or code collaboration platforms?"
        },
        {
          text: "Is an automated continuous integration and continuous delivery (CI/CD) pipeline established to compile, build, and verify the codebase?"
        },
        {
          text: "Are automated testing suites (unit, integration, regression) executed automatically within the CI/CD pipeline on every code change?"
        },
        {
          text: "Are static analysis tools utilized to scan source code for syntactical, semantic, and style violations without executing the code?"
        },
        {
          text: "Has the project configured static analysis rules to check for security vulnerabilities, concurrency issues, and code smells?"
        },
        {
          text: "Are dynamic analysis tools (such as coverage analyzers, performance profilers, or memory leak detectors) used during test execution?"
        },
        {
          text: "Does the project utilize review automation tools to route work products, record inline comments, and track defect removal?"
        },
        {
          text: "Are safety-critical systems analyzed using automated software safety hazard analysis tools for FMEA and FTA?"
        },
        {
          text: "Is an automated problem tracking system established to record, triage, and monitor the resolution of software anomalies?"
        },
        {
          text: "Does the problem tracking tool support structured workflows to manage the lifecycle of bug fixes from discovery to validation?"
        },
        {
          text: "Are quality data analysis tools used to capture defect metrics from engineering and testing environments?"
        },
        {
          text: "Does the project utilize data visualization tools to display defect densities, yields, and distributions in charts and graphs?"
        },
        {
          text: "Are statistical analysis tools used to perform trend analysis and forecast future software reliability?"
        },
        {
          text: "Has the project evaluated defect injection and removal rates to identify which lifecycle phases require process improvement?"
        },
        {
          text: "Are phase yields computed and analyzed to evaluate the effectiveness of phase-specific quality gates?"
        },
        {
          text: "Are automated tool reports and dashboards reviewed regularly by management and SQA personnel to assess quality status?"
        },
        {
          text: "Has the project team verified that all quality assurance and testing tools are calibrated and configured to match industry benchmarks?"
        },
        {
          text: "Are automated testing and static analysis tools audited periodically to ensure they remain compatible with compiler updates?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software quality tools, quality tools, checklist, static analysis tools, dynamic analysis tools, FMEA, FMEA tools, failure mode and effects analysis, FTA, fault tree analysis, bug trackers, problem tracking tools, defect injection, static syntax analysis",
  filename: "quality-tools",
  trigger: "model_decision"
});
