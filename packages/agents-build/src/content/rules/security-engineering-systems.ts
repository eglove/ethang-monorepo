import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const securityEngineeringSystems = defineRule({
  content: [
    {
      level: 1,
      text: "Security Engineering for Software Systems: Requirements, Design, Patterns, and Secure Construction",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Security engineering for software systems requires a disciplined approach to incorporating security properties into all aspects of a system's lifecycle. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4), this involves defining security requirements, designing security structures, applying proven security patterns, and constructing software in a way that prevents vulnerability introduction. Software systems must be built to resist attacks and fail securely under adversarial conditions.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Security Requirements Engineering: Elicitation, Specification, and Prioritization",
      type: "header"
    },
    {
      text: "Security requirements engineering is the process of defining the security boundary and constraints of a software system. It includes elicitation, specification, and prioritization of requirements.\nKey aspects of security requirements engineering include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Threat Identification via Misuse and Abuse Cases**: Unlike functional use cases that describe how a system is supposed to work for a legitimate user, misuse and abuse cases describe how threat actors might exploit or abuse the system. Developers analyze these scenarios to anticipate attack vectors and define defensive constraints."
        },
        {
          text: "**Threat Actors and Security Risk Assessments**: Requirements must address different types of threat actors (e.g., external hackers, malicious insiders, automated scripts, state-sponsored groups) and their capabilities. Security risk assessments evaluate the likelihood and impact of threat exploitation to guide resource allocation."
        },
        {
          text: "**Specification and Prioritization Methods**: Security requirements are specified using formal security models, regulatory requirements, or natural language constraints. Because security controls can impact usability and performance, security requirements must be prioritized based on risk levels."
        },
        {
          text: "**Revisiting Requirements during Maintenance**: Security requirements are not static. Every product revision, feature addition, or third-party dependency update requires security requirements to be revisited and updated."
        },
        {
          text: "**Traceability**: Security requirements must be traceable throughout the development process—from requirements specifications to design decisions, test cases, and code implementation."
        },
        {
          text: "**Security Requirements Specialists**: High-integrity systems benefit from engaging specialized security requirements engineers who can translate organizational security policies and compliance frameworks into precise software constraints."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Security Design Principles: Attack Tolerance, Access Control, and Cryptography",
      type: "header"
    },
    {
      text: "Security design concerns how to prevent unauthorized disclosure, creation, modification, deletion, or denial of access to system resources. It also addresses how to tolerate security attacks or violations when they occur.\nKey security design principles include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Attack Tolerance and Resiliency**: Designing the system to limit damage, continue service in a degraded state, and speed repair and recovery. The software must fail securely (e.g., releasing resources without exposing sensitive data or authentication bypasses)."
        },
        {
          text: "**Access Control**: A fundamental concept of security design. Access control mechanisms determine which entities can access specific resources under what conditions (e.g., role-based access control, attribute-based access control, or discretionary access control)."
        },
        {
          text: "**Cryptographic Controls and Key Management**: Most security controls rely on cryptographic algorithms. Designing secure systems requires carefully selecting cryptographic algorithms (such as AES, RSA, or ECC) and establishing secure processes for generating, distributing, storing, rotating, and destroying cryptographic keys. Hardcoding keys or using weak entropy sources are critical design failures."
        },
        {
          text: "**Threat Modeling**: Illustrating how a system is being attacked to specify a security design for mitigation. Threat modeling (e.g., using frameworks like STRIDE—Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) clarifies security considerations and maps out specific steps for implementation."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Security Patterns as Reusable Architectural Solutions",
      type: "header"
    },
    {
      text: "A security pattern describes a recurring security problem that arises in a specific context and presents a well-proven generic solution. Security patterns help software designers apply security concepts consistently. Examples include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Single Sign-On (SSO)**: Centralizing authentication to reduce credentials exposure."
        },
        {
          text: "**Intercepting Validator**: Validating input and request parameters before processing."
        },
        {
          text: "**Secure Logger**: Protecting log entries from tampering, disclosure, and log injection attacks."
        },
        {
          text: "**Role-Based Access Control (RBAC) Pattern**: Standardizing access checks across complex software modules."
        },
        {
          text: "**Secure State Machine**: Ensuring that state transitions within the application follow secure pathways and cannot be bypassed by race conditions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Secure Software Construction: Implementation Practices and CERT Top 10 Guidelines",
      type: "header"
    },
    {
      text: "Software construction security concerns writing programming code to address security considerations. It has two main aspects: coding so the code itself is secure (avoiding code-level bugs like buffer overflows, race conditions, or format string vulnerabilities) and coding security features into the software.\nKey recommended construction practices include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Privilege Separation**: Structuring the process so that sections requiring extra privileges are isolated in separate, minimal modules. These modules should be as small as possible and perform only the tasks requiring those privileges."
        },
        {
          text: "**Assumption Validation**: Ensuring all program assumptions (e.g., array bounds, input types, buffer sizes) are explicitly validated in the code. If validation is impossible, these assumptions must be documented for installers and maintainers so they know the assumptions attackers will try to invalidate."
        },
        {
          text: "**Memory Isolation**: Ensuring the program does not share objects in memory with other programs unless explicitly secured."
        },
        {
          text: "**Error Status Checking**: Checking every function's error status. The program must not recover from an error unless neither the error's cause nor its effects affect security. If a secure recovery is impossible, the program must restore the software's state to what it was before the process began and terminate securely."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Organizations must adopt construction security standards. The Computer Emergency Response Team (CERT) publishes top 10 software security practices:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Validate Input**: Sanitize and validate all input from untrusted sources."
        },
        {
          text: "**Heed Compiler Warnings**: Compile code with high warning levels and resolve all warnings."
        },
        {
          text: "**Architect and Design for Security Policies**: Ensure the software architecture supports policy enforcement."
        },
        {
          text: "**Keep It Simple**: Keep designs simple to make verification and auditing easier."
        },
        {
          text: "**Default Deny**: Restrict access by default and grant permissions explicitly."
        },
        {
          text: "**Adhere to the Principle of Least Privilege**: Run code with the minimum set of privileges necessary."
        },
        {
          text: "**Sanitize Data Sent to Other Software**: Prevent command injection attacks on database and operating systems."
        },
        {
          text: "**Practice Defense in Depth**: Implement multiple layers of security controls."
        },
        {
          text: "**Use Effective Quality Assurance Techniques**: Conduct fuzz testing, static analysis, and manual code reviews."
        },
        {
          text: "**Adopt a Software Construction Security Standard**: Adhere to an established secure coding standard."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "Are misuse and abuse cases drafted during the requirements phase to model threat actor behaviors?"
        },
        {
          text: "Have the capabilities and motivations of potential threat actors been identified and documented?"
        },
        {
          text: "Do security requirements explicitly address risks identified in the system security risk assessment?"
        },
        {
          text: "Are security requirements prioritized based on the criticality of the assets and potential impact?"
        },
        {
          text: "Is there a traceability matrix mapping each security requirement to specific design components, code files, and test cases?"
        },
        {
          text: "Are security requirements reviewed and updated during software maintenance and product updates?"
        },
        {
          text: "Does the system design incorporate mechanisms to tolerate attacks, limit damage, and continue service?"
        },
        {
          text: "Are access control controls implemented to prevent unauthorized disclosure, creation, modification, or deletion of resources?"
        },
        {
          text: "Are secure cryptographic algorithms selected and configured according to industry standards?"
        },
        {
          text: "Has a secure cryptographic key management lifecycle (creation, distribution, rotation, destruction) been implemented?"
        },
        {
          text: "Has threat modeling (such as STRIDE analysis) been conducted to map out system attack vectors and mitigations?"
        },
        {
          text: "Are proven security patterns (such as Intercepting Validator or SSO) used to resolve recurring security design challenges?"
        },
        {
          text: "Is the application structured to separate privileges, placing high-privilege operations in small, isolated modules?"
        },
        {
          text: "Are all program assumptions validated at runtime or documented explicitly for maintainers?"
        },
        {
          text: "Does the program avoid sharing memory objects with other applications unless protected by access controls?"
        },
        {
          text: "Are error statuses checked for all function calls, ensuring the system fails and recovers securely?"
        },
        {
          text: "Is all untrusted input validated and sanitized before being processed by the system?"
        },
        {
          text: "Is compiler warning output set to high severity, and are all warnings resolved before code is integrated?"
        },
        {
          text: "Does the system default to denying access, requiring explicit authorization for all operations?"
        },
        {
          text: "Is data sent to external software and systems sanitized to prevent injection attacks?"
        },
        {
          text: "Are security-focused QA techniques, such as fuzz testing and static analysis, integrated into the build pipeline?"
        },
        {
          text: "Are specialists engaged to verify that security requirements are correctly translated into code constraints?"
        },
        {
          text: "Does the application check for potential race conditions during state transitions in secure workflows?"
        },
        {
          text: "Are credentials, secrets, and API keys stored in environment variables rather than hardcoded in the codebase?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "security requirements, threat modeling, misuse cases, abuse cases, threat actors, security risk assessment, secure design, attack tolerance, access control, cryptography, key management, STRIDE, security patterns, secure coding, privilege separation, CERT top 10 secure coding practices, input validation, least privilege, defense in depth",
  filename: "security-engineering-systems",
  trigger: "model_decision"
});
