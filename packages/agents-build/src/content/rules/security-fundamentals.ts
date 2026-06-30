import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const securityFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Security Fundamentals: Product Quality, CIA Triad, and Cybersecurity",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software security is a fundamental engineering discipline, defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as the practice of designing, constructing, and testing software to ensure it remains secure under adversarial conditions. A generally accepted belief about software security is that it is much better to design security into software than to patch it in after the software is developed. To achieve this, security must be considered at every stage of the development life cycle, including requirements, design, construction, testing, and long-term maintenance. Security faults and loopholes introduced during maintenance are common sources of system compromise, making continuous security planning essential.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Software Security as a Product Quality Characteristic",
      type: "header"
    },
    {
      text: "Under international standards such as ISO/IEC 25010, security is classified as a core product quality characteristic. It represents the degree to which a product or system protects information and data so that persons or other products or systems have data access appropriate to their types and levels of authorization. Resolving security challenges requires balancing quality characteristics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Security vs. Performance Efficiency**: Implementing cryptographic operations (like heavy encryption or hashing) can introduce CPU latency and increase resource utilization. This trade-off must be managed by selecting efficient algorithms and optimizing key derivation processes."
        },
        {
          text: "**Security vs. Usability**: Complex authentication controls or aggressive session timeouts can degrade the user experience. Engineers must balance secure access with user convenience (e.g., implementing single sign-on or multi-factor authentication with low-friction options)."
        },
        {
          text: "**Security vs. Maintainability**: Adding complex security layers or custom access control engines can make the codebase harder to maintain. Standardizing on proven libraries and frameworks prevents technical debt."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Information Security Properties: The CIA Triad and Beyond",
      type: "header"
    },
    {
      text: "Information security preserves the confidentiality, integrity, and availability (the CIA triad) of information assets. Software engineers must define these security properties for their software and maintain them throughout the software development life cycle:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Confidentiality**: The property of ensuring that information is not disclosed to unauthorized individuals, entities, or processes. Defenses include data encryption (in transit using TLS, and at rest using AES), robust authorization controls, and secure session management."
        },
        {
          text: "**Integrity**: The property of accuracy and completeness. This ensures that data is not altered, tampered with, or deleted in transit or at rest. Defenses include hash functions (e.g., SHA-256), Hash-based message Authentication Codes (HMACs), digital signatures, and database transaction constraints."
        },
        {
          text: "**Availability**: The property of being accessible and usable on demand by an authorized entity. Defenses include load balancing, server redundancy, automated backups, rate-limiting to prevent resource exhaustion, and denial of service (DoS) mitigations."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "In addition to the CIA triad, information security encompasses several extending properties:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Authenticity**: The property that ensures the identity of a subject or resource is verified and genuine. This relies on authentication mechanisms such as passwords, digital certificates, tokens, or multi-factor authentication (MFA)."
        },
        {
          text: "**Accountability**: The ability to associate actions uniquely with the specific actor, user, or process responsible for them. This requires auditing, where all security-sensitive events are logged with timestamps and user identifiers."
        },
        {
          text: "**Non-repudiation**: The capability to prove that an action or event occurred, preventing a party from denying their participation. This is achieved through digital signatures and cryptographic proof chains."
        },
        {
          text: "**Reliability**: The property of consistent, intended behavior and performance under specified conditions, preventing the system from failing into insecure states."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Cybersecurity and Threat Mitigation",
      type: "header"
    },
    {
      text: "Cybersecurity is the safeguarding of people, society, organizations, and nations from cyber risks by keeping risk at a tolerable level. It addresses security issues in cyberspace, requiring software engineers to design and construct software that mitigates common threats:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Hacking**: Unauthorized intrusion into computer systems, networks, or applications. Mitigation involves input sanitization, patch management, disabling unused ports, and implementing secure APIs."
        },
        {
          text: "**Social Engineering**: Manipulative techniques that exploit human psychology to gain unauthorized access to credentials, systems, or physical spaces (e.g., phishing, spear-phishing, vishing). Mitigation includes security training, access verification, and multi-factor authentication."
        },
        {
          text: "**Malware**: Malicious software designed to disrupt, damage, or gain unauthorized access to computer systems (e.g., viruses, worms, trojans, ransomware). Mitigation involves anti-virus scanning, application sandboxing, and secure build pipelines."
        },
        {
          text: "**Spyware**: Software that enables an attacker to obtain covert information about another's computer activities by transmitting data secretly from their hard drive or memory. Mitigation includes auditing dependencies and preventing execution of untrusted scripts."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Systems Security Engineering Capability Maturity Model (SSE-CMM)",
      type: "header"
    },
    {
      text: "To evaluate and improve process capabilities, organizations utilize process maturity models. The Systems Security Engineering Capability Maturity Model (SSE-CMM) measures the capability of an organization to perform security engineering activities, particularly risk assessments. SSE-CMM evaluates how systematically security engineering practices are integrated into organizational workflows, providing a structured pathway to mature from ad-hoc security practices to predictable, optimized processes. SSE-CMM defines five capability maturity levels:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Level 1: Performed Informally**: Security engineering activities are performed ad hoc, success depends heavily on individual efforts, and processes are undocumented, unstructured, and unpredictable."
        },
        {
          text: "**Level 2: Planned and Tracked**: Security practices are planned, documented, and tracked at the project level. Success is repeatable within specific project boundaries, and work products conform to defined standards."
        },
        {
          text: "**Level 3: Well-Defined**: Security practices are standardized and integrated into a defined process across the entire organization. Projects use tailored versions of organizational process assets, forming a coherent baseline."
        },
        {
          text: "**Level 4: Quantitatively Controlled**: Detailed metrics are systematically collected, measured, and analyzed. Processes are managed quantitatively, allowing performance to be statistically predicted and controlled."
        },
        {
          text: "**Level 5: Continuously Improving**: Process capabilities are optimized continuously using quantitative feedback and pilot ideas. The organization focuses on identifying weaknesses, improving efficiency, and adapting to new threats."
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
          text: "Is security planned and designed into the software from the initial requirements phase rather than treated as a post-development patch?"
        },
        {
          text: "Have the target security properties (confidentiality, integrity, availability) been formally defined for all system components?"
        },
        {
          text: "Are confidentiality mechanisms established to prevent unauthorized data disclosure to external entities or internal processes?"
        },
        {
          text: "Has data integrity been verified through cryptographic controls, checksums, or secure transmission protocols?"
        },
        {
          text: "Do system designs guarantee availability by implementing redundancy, rate-limiting, and resource exhaustion protections?"
        },
        {
          text: "Has authenticity been established for all communicating parties through digital signatures, certificates, or multi-factor authentication?"
        },
        {
          text: "Are accountability controls implemented to log and trace all administrative actions back to a unique, authenticated user?"
        },
        {
          text: "Does the software design support non-repudiation, providing cryptographic proof of transactions and state changes?"
        },
        {
          text: "Have cybersecurity risks been identified and evaluated to keep system risk exposures at a tolerable level?"
        },
        {
          text: "Does the system design incorporate defenses against social engineering attacks, such as credential verification controls?"
        },
        {
          text: "Are input interfaces hardened to prevent hacking attempts and unauthorized system intrusions?"
        },
        {
          text: "Has a malware prevention and scanning strategy been integrated into the hosting environment and development pipelines?"
        },
        {
          text: "Are third-party dependencies audited to prevent the introduction of spyware or unwanted background components?"
        },
        {
          text: "Has the organization evaluated its security engineering process maturity using the SSE-CMM or a similar capability model?"
        },
        {
          text: "Are security engineering risk assessments conducted systematically and updated when the software evolves?"
        },
        {
          text: "Do security requirements derive explicitly from laws, regulatory compliance mandates, and organizational security policies?"
        },
        {
          text: "Are security requirements revisited during software maintenance to prevent the introduction of loopholes during updates?"
        },
        {
          text: "Has a security engineering specialist been integrated into the team to oversee high-integrity and critical security functions?"
        },
        {
          text: "Have trade-offs between security and performance (such as encryption latency) been analyzed and documented?"
        },
        {
          text: "Have trade-offs between security and usability (such as session duration or complexity) been evaluated against user requirements?"
        },
        {
          text: "Is there an incident response plan to handle breaches, data loss, or system availability failures?"
        },
        {
          text: "Are logs stored in a secure location and protected from modification or unauthorized deletion?"
        },
        {
          text: "Are developers trained on the core security principles (CIA triad, authenticity, accountability) and secure coding fundamentals?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software security fundamentals, software security, information security, confidentiality, integrity, availability, authenticity, accountability, non-repudiation, reliability, cybersecurity, cyber risk, social engineering, malware, spyware, SSE-CMM, systems security engineering capability maturity model",
  filename: "security-fundamentals",
  trigger: "model_decision"
});
