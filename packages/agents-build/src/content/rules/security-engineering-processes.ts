import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const securityEngineeringProcesses = defineRule({
  content: [
    {
      level: 1,
      text: "Software Security Engineering and Processes: SDLC, DevSecOps, and Common Criteria",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software is only as secure as the process used to construct, deploy, and maintain it. Software Security Engineering, as defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4), is the systematic integration of security engineering practices and principles throughout the software development life cycle. Rather than treating security as a post-development afterthought or an operational patch, a secure software engineering process ensures that security is designed and built into the system from the start. This proactive approach reduces long-term software maintenance costs, prevents regression defects, and minimizes the likelihood of security-related system faults.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Secure Development Life Cycle (SDLC) Frameworks",
      type: "header"
    },
    {
      text: "A Secure Development Life Cycle (SDLC) is a framework that systematically incorporates security activities and verification gates into each phase of the traditional software development process. Secure SDLC models view security holistically rather than in isolation:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Microsoft SDL (Security Development Lifecycle)**: One of the earliest industry secure lifecycles, emphasizing threat modeling, static analysis, dynamic testing, and incident response planning. Microsoft SDL defines seventeen discrete practices that cover training, requirements, design, implementation, verification, release, and response, providing structured tooling and clear policy boundaries."
        },
        {
          text: "**OWASP SAMM (Software Assurance Maturity Model)**: A flexible, open framework that allows organizations to self-assess and incrementally improve their software assurance practices. It covers Governance, Design, Implementation, Verification, and Operations. SAMM is designed to be highly tailorable, supporting small startups as well as large enterprises, evaluating organizational maturity on a scale from level 0 (informal) to level 3 (fully optimized)."
        },
        {
          text: "**BSIMM (Building Security In Maturity Model)**: A descriptive study of real-world software security practices, helping organizations compare their initiatives against industry peers. Unlike SAMM, which is prescriptive, BSIMM is a descriptive model based on data collected from hundreds of participating organizations, outlining actual practices observed in the wild."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Key activities across secure lifecycle phases include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Requirements Elicitation**: Identifying security constraints, threat actors, and compliance rules. Security requirements are captured alongside functional requirements, translating security concerns into specific development constraints."
        },
        {
          text: "**Design Review**: Architectural reviews to identify design flaws, threat vectors, trust boundaries, and access control models. Techniques such as STRIDE threat modeling are used to identify design weaknesses before implementation."
        },
        {
          text: "**Construction Security**: Enforcing secure coding standards, utilizing pre-approved security libraries, and avoiding language-specific security pitfalls (such as memory unsafety or injection vulnerabilities)."
        },
        {
          text: "**Verification and Validation**: Conducting security-specific testing (e.g., static application security testing, dynamic scanning, and manual code reviews) to verify that the software meets its security specifications."
        },
        {
          text: "**Maintenance and Operations**: Ensuring that security patches are applied promptly and that new features or refactored code do not introduce security loopholes."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 DevSecOps: Development, Security, and Operations",
      type: "header"
    },
    {
      text: "DevSecOps is the evolution of modern software engineering processes, integrating security teams, tools, and processes directly into Development and Operations workflows. Beyond traditional SDLC methodologies, DevSecOps represents a shift in culture, automation, and platform design:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Culture**: Fostering shared responsibility for security, where developers, operations staff, and security specialists collaborate continuously. Security teams act as enablers by providing automated tools, security templates, and education rather than acting as a traditional gatekeeper."
        },
        {
          text: "**Automation (The Secure CI/CD Pipeline)**: Security checks are fully automated and integrated into continuous integration (CI) and continuous delivery (CD) pipelines. This includes:\n- *Static Application Security Testing (SAST)*: Scanning source code for vulnerabilities (e.g., SQL injection, XSS) on every commit.\n- *Software Composition Analysis (SCA)*: Checking third-party libraries for known vulnerabilities (CVEs) and license compliance.\n- *Secret Scanning*: Analyzing files and commits for hardcoded secrets, API keys, or certificates before they are committed to version control.\n- *Dynamic Application Security Testing (DAST)*: Automated scanning of the running staging application to detect configuration and runtime vulnerabilities."
        },
        {
          text: "**Platform Design**: Security is enforced at the infrastructure level using container hardening, network micro-segmentation, and Infrastructure as Code (IaC) verification tools to ensure environments are configured securely."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Common Criteria for Information Technology Security Evaluation",
      type: "header"
    },
    {
      text: "Security evaluation establishes confidence in the security functionality of IT products and the assurance measures applied during their development. ISO/IEC 15408, commonly known as the Common Criteria (CC), is the international standard used to guide the development, evaluation, and procurement of IT products with security functionality.\nThe CC focuses on protecting assets from:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Unauthorized Disclosure**: Violations of the security property of confidentiality."
        },
        {
          text: "**Unauthorized Modification**: Violations of the security property of integrity."
        },
        {
          text: "**Loss of Use**: Violations of the security property of availability."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Key concepts in the Common Criteria framework include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Target of Evaluation (TOE)**: The IT product or system subject to security evaluation."
        },
        {
          text: "**Protection Profile (PP)**: An independent statement of security needs for a specific category of IT products (e.g., firewalls, operating systems, database management systems) that defines generic security requirements."
        },
        {
          text: "**Security Target (ST)**: A statement of security claims made by the developer for a specific TOE. The ST describes the security functions of the TOE and the assurance measures taken to meet the requirements of a Protection Profile."
        },
        {
          text: "**Evaluation Assurance Levels (EAL)**: A numerical rating scale (from EAL1 to EAL7) indicating the depth and rigor of the security evaluation. EAL levels represent:\n- *EAL1*: Functionally tested.\n- *EAL2*: Structurally tested.\n- *EAL3*: Methodically tested and checked.\n- *EAL4*: Methodically designed, tested, and reviewed (industry standard for commercial products).\n- *EAL5*: Semiformally designed and tested.\n- *EAL6*: Semiformally verified design and tested.\n- *EAL7*: Formally verified design and tested (reserved for high-integrity, safety-critical systems)."
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
          text: "Are security engineering activities systematically integrated into every phase of the software development lifecycle?"
        },
        {
          text: "Has the project adopted a holistically secure lifecycle framework, such as Microsoft SDL or OWASP SAMM?"
        },
        {
          text: "Does the project culture promote shared responsibility for security across development, operations, and security teams (DevSecOps)?"
        },
        {
          text: "Are security checks, scans, and validation gates automated within the continuous integration (CI) pipeline?"
        },
        {
          text: "Are third-party dependencies scanned automatically for vulnerabilities during the build process using Software Composition Analysis (SCA)?"
        },
        {
          text: "Has the target of evaluation (TOE) been defined for security evaluation purposes?"
        },
        {
          text: "Do security requirements align with relevant Common Criteria Protection Profiles (PP) for the system's product category?"
        },
        {
          text: "Has a Security Target (ST) document been compiled, specifying the security claims and assurance measures for the product?"
        },
        {
          text: "Has the required Evaluation Assurance Level (EAL) been determined based on risk assessments and stakeholder needs?"
        },
        {
          text: "Does the development process verify that security controls prevent unauthorized disclosure, modification, and loss of use of assets?"
        },
        {
          text: "Are security evaluation findings reviewed and used to improve the software security development process?"
        },
        {
          text: "Is there an automated process to audit and verify that build and deployment configurations conform to secure infrastructure profiles?"
        },
        {
          text: "Does the team perform continuous threat and risk analysis, updating secure SDLC activities as threats and vulnerabilities evolve?"
        },
        {
          text: "Are security specialists engaged to evaluate the assurance measures applied during software design and construction?"
        },
        {
          text: "Has a feedback loop been established to feed operational security findings back into the secure development process?"
        },
        {
          text: "Are security metrics (such as build-time vulnerability counts, mean time to remediate, and patch status) tracked to evaluate DevSecOps process capability?"
        },
        {
          text: "Does the project conduct post-release security reviews to identify and mitigate loopholes introduced during maintenance?"
        },
        {
          text: "Are secrets (such as API keys, database credentials, and cryptographic keys) scanned and blocked from being committed to the codebase?"
        },
        {
          text: "Does the CI pipeline block deployments if critical security vulnerabilities or compliance failures are detected?"
        },
        {
          text: "Have the security engineering processes been audited by an independent third party to verify alignment with security standards?"
        },
        {
          text: "Are security patches and dependency updates tested automatically in a staging environment before being deployed to production?"
        },
        {
          text: "Do developers participate in security reviews and threat modeling sessions during sprint planning?"
        },
        {
          text: "Has a post-incident retrospective process been defined to identify root causes and improve security processes after an incident?"
        },
        {
          text: "Are container configurations verified against security benchmarks (such as CIS benchmarks) during pipeline execution?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software security engineering, secure development life cycle, secure SDLC, Microsoft SDL, OWASP SAMM, BSIMM, DevSecOps, CI/CD automation, Common Criteria, ISO/IEC 15408, target of evaluation, TOE, protection profile, PP, security target, ST, evaluation assurance level, EAL, confidentiality, integrity, availability",
  filename: "security-engineering-processes",
  trigger: "model_decision"
});
