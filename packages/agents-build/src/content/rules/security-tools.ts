import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const securityTools = defineRule({
  content: [
    {
      level: 1,
      text: "Software Security Tools: Static Analysis, Penetration Testing, and Vulnerability Databases",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software security tools are essential for identifying, measuring, and mitigating security defects throughout the development lifecycle. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4), these tools automate security verification activities, helping software engineers detect vulnerabilities in code patterns, binaries, and operational environments. However, tools are not a complete solution; they must be operated by security professionals who interpret their findings and verify the results.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Static Application Security Testing (SAST) Tools",
      type: "header"
    },
    {
      text: "Static analysis involves examining software artifacts (source code or compiled binaries) without executing the program. Static application security testing (SAST) tools analyze the codebase to detect structural, syntax, and logic flaws:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Abstract Syntax Trees and Data Flow Analysis**: SAST tools build an Abstract Syntax Tree (AST) of the source code and trace data flow from sources (untrusted user input, network sockets) to sinks (database queries, system commands). This analysis, known as taint analysis, identifies paths where input is processed without proper sanitization."
        },
        {
          text: "**Source Code Analysis**: Scrutinizes source code to identify programming language-specific or implementation-level vulnerabilities. Common detections include SQL injection, cross-site scripting (XSS), buffer overflows, race conditions, and insecure API usage."
        },
        {
          text: "**Binary Code Analysis**: Examines compiled binaries, executables, or bytecode. This is useful for detecting vulnerabilities introduced by compiler optimizations, verifying third-party library dependencies where source code is unavailable, and checking compiler hardening settings (e.g., Address Space Layout Randomization - ASLR, and Data Execution Prevention - DEP)."
        },
        {
          text: "**Limitations of Static Analysis**: SAST tools cannot identify all security vulnerabilities. They are prone to high false-positive rates, requiring manual triage. Additionally, they cannot easily detect configuration errors or logic issues that only manifest under specific, hard-to-produce runtime states or complex environments."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Penetration Testing, Fuzzing, and Dynamic Security Tools",
      type: "header"
    },
    {
      text: "Dynamic security verification involves evaluating a system's security while the program is running in an operational, staging, or testing environment:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Dynamic Application Security Testing (DAST) Tools**: Test the running application from the outside, acting as an external attacker without access to the source code. DAST tools are highly effective at finding deployment-specific issues, authentication flaws, and configuration errors, but they cannot point to the exact line of code causing the vulnerability."
        },
        {
          text: "**Penetration Testing (Ethical Hacking) Tools**: Used to perform controlled attacks against a running application to expose weaknesses. These tools simulate the techniques utilized by actual adversaries, providing empirical evidence of exploitable paths in the system's runtime environment."
        },
        {
          text: "**Fuzzing Tools**: Fuzz testing (or fuzzing) is a dynamic testing technique that submits malformed, unexpected, or random input data to the system's entry points (APIs, UI forms, file parsers) to monitor for crashes, memory leaks, or assertion failures. Fuzzing can be mutation-based (modifying existing valid inputs) or generation-based (creating inputs from a defined schema), and coverage-guided (using code coverage feedback to guide the fuzzer to explore new execution paths)."
        },
        {
          text: "**Interactive Application Security Testing (IAST)**: Instruments the application runtime to monitor code execution during functional testing, combining elements of SAST and DAST to reduce false positives and locate the vulnerable code path."
        },
        {
          text: "**Runtime Application Self-Protection (RASP)**: Active security technology built into an application's runtime environment that detects and blocks attacks (such as SQL injection or cross-site scripting) in real time by analyzing the application's internal state."
        },
        {
          text: "**Legal and Authorization Boundaries**: Because penetration testing and dynamic scanning tools use intrusive methods, they must always be executed within strict authorization boundaries. Proper authorization and explicit legal agreements differentiate ethical hacking from malicious cyberattacks."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Vulnerability Databases and Scoring Systems",
      type: "header"
    },
    {
      text: "To catalog and share security defects, the software engineering community maintains standard vulnerability databases and classification systems:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Common Vulnerabilities and Exposures (CVE)**: A dictionary of publicly disclosed cybersecurity vulnerabilities. Each entry represents a unique, documented vulnerability in a specific product or library, helping engineers track and verify patches."
        },
        {
          text: '**Common Weakness Enumeration (CWE)**: A community-developed list of common software and hardware security weaknesses. CWE categorizes types of design or implementation defects (e.g., "CWE-89: SQL Injection", "CWE-79: Cross-site Scripting") rather than specific product bugs, helping developers avoid recurring coding mistakes.'
        },
        {
          text: "**Common Attack Pattern Enumeration and Classification (CAPEC)**: A taxonomy of common methods used by adversaries to exploit software weaknesses. CAPEC helps security designers understand the threat perspective and implement appropriate mitigations."
        },
        {
          text: "**Common Vulnerability Scoring system (CVSS)**: An open framework for communicating the characteristics and severity of software vulnerabilities. CVSS assigns a numerical score (from 0 to 10) based on three metric groups:\n- *Base Metrics*: Represent the intrinsic characteristics of a vulnerability that are constant over time and across environments (e.g., Attack Vector, Attack Complexity, Privileges Required, User Interaction, Scope, Confidentiality/Integrity/Availability Impact).\n- *Temporal Metrics*: Represent characteristics of a vulnerability that change over time but not across environments (e.g., Exploit Code Maturity, Remediation Level, Report Confidence).\n- *Environmental Metrics*: Represent characteristics of a vulnerability that are unique to a user's environment (e.g., Security Requirements, Modified Base Metrics)."
        },
        {
          text: "**Vulnerability Management and Disclosure**: Modern projects must establish a clear vulnerability disclosure process that allows external security researchers to report vulnerabilities securely and confidentially. This is combined with automated dependency scanning to mitigate vulnerabilities in third-party components."
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
          text: "Are static application security testing (SAST) tools integrated into the continuous integration (CI) pipeline?"
        },
        {
          text: "Does static analysis cover both the internally developed source code and the compiled binary files?"
        },
        {
          text: "Are static analysis tool results reviewed and triaged by security professionals to eliminate false positives?"
        },
        {
          text: "Are third-party compiled components audited for vulnerabilities using binary analysis tools?"
        },
        {
          text: "Does the project team conduct dynamic security testing, such as automated vulnerability scanning, on the running application?"
        },
        {
          text: "Has a penetration testing strategy been defined to evaluate the software's security in its operational environment?"
        },
        {
          text: "Are penetration tests and vulnerability scans conducted within legal boundaries, with formal written authorization?"
        },
        {
          text: "Are fuzzing tools used to test the stability and input validation of APIs, file parsers, and public interfaces?"
        },
        {
          text: "Are third-party dependencies scanned automatically against the Common Vulnerabilities and Exposures (CVE) database?"
        },
        {
          text: "Do developers reference the Common Weakness Enumeration (CWE) list to avoid common coding defects during construction?"
        },
        {
          text: "Has threat modeling incorporated adversary perspectives from the Common Attack Pattern Enumeration and Classification (CAPEC)?"
        },
        {
          text: "Are identified system vulnerabilities scored and prioritized using the Common Vulnerability Scoring system (CVSS)?"
        },
        {
          text: "Has a formal vulnerability disclosure and reporting process been established for the project?"
        },
        {
          text: "Are software security patches and dependency updates applied systematically as part of maintenance?"
        },
        {
          text: "Do static analyzers monitor the codebase for insecure cryptographic configurations and hardcoded secrets?"
        },
        {
          text: "Is there a process to verify that compiler hardening flags (e.g., stack protection, ASLR) are enabled during release builds?"
        },
        {
          text: "Does the development team receive training on how to configure and interpret security testing tool results?"
        },
        {
          text: "Are vulnerabilities discovered by tools tracked in the project backlog until resolved?"
        },
        {
          text: "Is the vulnerability management system configured to alert the team when new CVEs are published for used dependencies?"
        },
        {
          text: "Does the CI pipeline use taint analysis features in SAST tools to track data flow from untrusted sources to execution sinks?"
        },
        {
          text: "Are IAST or RASP tools evaluated for real-time vulnerability detection and protection in staging or production environments?"
        },
        {
          text: "Are fuzzing runs executed continuously or as part of nightly builds to explore deep execution paths?"
        },
        {
          text: "Does the organization have a defined SLA for patching vulnerabilities based on their CVSS scores?"
        },
        {
          text: "Are security tool configurations and rule sets reviewed regularly to ensure they remain aligned with current threat models?"
        },
        {
          text: "Are secrets scanning tools configured to prevent developers from committing credentials to remote repositories?"
        },
        {
          text: "Does the team perform periodic manual code reviews to detect complex logic flaws that automated tools miss?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software security tools, static analysis, SAST, source code analysis, binary code analysis, dynamic testing, penetration testing, fuzzing, fuzz testing, vulnerability scanner, CVE, Common Vulnerabilities and Exposures, CWE, Common Weakness Enumeration, CAPEC, CVSS, Common Vulnerability Scoring system, vulnerability management, disclosure process",
  filename: "security-tools",
  trigger: "model_decision"
});
