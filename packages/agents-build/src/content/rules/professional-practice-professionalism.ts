import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const professionalPracticeProfessionalism = defineRule({
  content: [
    {
      level: 1,
      text: "Professionalism in Software Engineering: Standards, Ethics, Contracts, and Legal Issues",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Professionalism in software engineering is defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as the practice of software engineering in a professional, responsible, and ethical manner. Given the widespread impact of software products on individuals, businesses, and society, the quality and safety of software directly affect public welfare. Software engineers must adhere to established codes of conduct, comply with legal and regulatory frameworks, and follow standards to ensure their work meets high professional benchmarks.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Accreditation, Certification, and Licensing",
      type: "header"
    },
    {
      text: "The community regulates and establishes criteria for professional competence through three distinct mechanisms:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Accreditation**: The process of certifying that an educational institution or program maintains specific quality standards. Global accreditation is governed by bodies such as the International Engineering Alliance (IEA)—which administers the Washington Accord—and the European Network for Accreditation of Engineering Education (ENAEE), which administers the EUR-ACE label."
        },
        {
          text: "**Certification and Qualification**: The confirmation of a person's competency in a specific discipline. Under ISO/IEC 24773-1 and ISO/IEC 24773-4, certification validates that a professional can apply standard practices and professional judgment. Qualification is similar to certification but does not require periodic recertification."
        },
        {
          text: "**Licensing**: Legal authorization granted by a governmental authority to perform engineering activities and take responsibility for engineering products. Licensing aims to protect the public from unqualified individuals and enforces statutory standards."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Codes of Ethics and Professional Conduct",
      type: "header"
    },
    {
      text: "Codes of ethics define the values and behaviors that guide a software engineer's decisions. Standard codes include the joint IEEE CS/ACM Software Engineering Code of Ethics, the ACM Code of Ethics, the IEEE Code of Ethics, and the IFIP Code of Ethics.\nViolations of these codes can occur through:",
      type: "text"
    },
    {
      items: [
        {
          text: "*Commission*: Acts such as concealing inadequate work, falsifying data, disclosing confidential information, or misrepresenting abilities."
        },
        {
          text: "*Omission*: Failures such as neglecting to disclose risks, failing to acknowledge references, or failing to represent client interests.\nViolations may lead to professional disciplinary action, including loss of certification or statutory penalties."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Professional Societies and Software Engineering Standards",
      type: "header"
    },
    {
      text: "Professional societies (e.g., ACM, IEEE Computer Society, IFIP) define, advance, and regulate the software engineering profession. They publish bodies of knowledge, support standards development, and host educational forums.\nSoftware engineering standards (promulgated by ISO, IEC, and IEEE) provide guidelines for processes, methods, and products. Adherence to standards promotes discipline, mitigates design overconfidence, and provides a legal defense in malpractice cases.",
      type: "text"
    },
    {
      level: 3,
      text: "1.4 Economic and Societal Impact of Software",
      type: "header"
    },
    {
      text: "Software has profound economic effects:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Individual Level**: An engineer's employment depends on their ability to meet customer needs."
        },
        {
          text: "**Business Level**: Properly applied software eliminates labor costs and increases organizational efficiency."
        },
        {
          text: "**Societal Level**: Software successes or failures impact public safety, property, and life. Societal value is also enhanced through digitalization, providing faster and easier access to information."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Employment Contracts and Intellectual Property",
      type: "header"
    },
    {
      text: "Software engineers operate under various contract types (direct-hire, consultancy, or volunteer). Key issues addressed in these agreements include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Confidentiality and NDAs**: Nondisclosure agreements protect proprietary intellectual property (IP) from unauthorized disclosure."
        },
        {
          text: "**IP Ownership**: Standard contracts specify whether ownership of software assets (inventions, patents, code) resides with the employer, the customer, or the engineer, especially when using personal equipment."
        },
        {
          text: "**Liability and Compensation**: Contracts define liability limits, work locations, work hours, and communication escalation matrices."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Legal Frameworks and Intellectual Property Protection",
      type: "header"
    },
    {
      text: "Software engineers must navigate complex legal issues within their jurisdiction:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Trademarks**: Frame rules for protecting names, logos, and packaging. The World Intellectual Property Organization (WIPO) is the governing authority. Trademarks relate to any word, name, symbol, or device used in business transactions to indicate the source or origin of goods. If a trademarked asset or name becomes a generic term over time, its trademark protection is nullified."
        },
        {
          text: "**Patents**: Protect rights to manufacture and sell an invention for a limited period. In many jurisdictions, source code itself is not patentable, but software algorithms and process flows may be. Applying for a patent requires keeping detailed, chronological records of the design process, and patent attorneys are typically engaged to write disclosure claims to maximize protection."
        },
        {
          text: "**Copyrights**: Protect the presentation of an idea (such as written source code) rather than the idea itself. Copyrights are long-term and renewable, granting the creator exclusive rights of an original work for a limited time."
        },
        {
          text: "**Trade Secrets**: Protect proprietary formulas, algorithms, or processes that provide an economic advantage, provided they are kept secret. Unlike patents, trade secret protection has no time limit. However, if another party independently discovers or legally derives the same asset, the trade secret protection is nullified, and the other party gains full rights to use it."
        },
        {
          text: "**Professional Liability and Negligence**: Software engineers can be held liable for negligence (failing to follow recommended practices) or strict product liability (warranty suitability). Tort law allows third parties to sue for damages if negligence is proven."
        },
        {
          text: "**Trade Compliance**: Legal restrictions on the import, export, or re-export of software, services, and encryption technologies to sanctioned nations or entities."
        },
        {
          text: "**Cybercrime**: Software engineers must design systems to prevent cybercrimes (unauthorized access, fraud, data theft, and denial of service)."
        },
        {
          text: '**Data Privacy**: Compliance with privacy frameworks, such as the General Data Protection Regulation (GDPR) in the European Union, which mandates "Privacy by Design" and the "Right to be Forgotten," and the California Consumer Privacy Act (CCPA).'
        },
        {
          text: "**Deceptive Design (Dark Patterns)**: Deceptive UI/UX patterns designed to mislead users. This is an unethical practice; software engineers must maintain transparency."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Documentation and Trade-off Analysis",
      type: "header"
    },
    {
      text: "Engineers are responsible for providing clear, accurate documentation:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Internal Documentation**: SRS, design documents, tool configurations, test specifications, and results."
        },
        {
          text: "**External Documentation**: Warnings of dangerous misuse, explanations of how to protect sensitive data, and user manuals."
        },
        {
          text: "**Trade-off Analysis**: Objective and impartial evaluation of alternative solutions based on risks, costs, and benefits. Upfront disclosure of any conflicts of interest is ethically mandatory."
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
          text: "Has the software engineering program or institution been verified against recognized global accreditation standards (e.g., Washington Accord)?"
        },
        {
          text: "Are development team members encouraged to obtain and maintain professional software engineering certifications (e.g., ISO/IEC 24773)?"
        },
        {
          text: "Has the project verified the licensing and registration requirements of the jurisdiction where the software is deployed?"
        },
        {
          text: "Does the project team adhere strictly to the IEEE CS/ACM Software Engineering Code of Ethics?"
        },
        {
          text: "Are potential violations of the code of conduct (such as falsification of test data or concealment of risks) reported and addressed?"
        },
        {
          text: "Do the software development processes conform to recognized international standards (e.g., ISO/IEC/IEEE)?"
        },
        {
          text: "Have the economic and societal impacts of the software product's success or failure been analyzed and documented?"
        },
        {
          text: "Are nondisclosure agreements (NDAs) signed and active to protect proprietary intellectual property?"
        },
        {
          text: "Has ownership of all software code, algorithms, and inventions been clearly defined in the employment or consulting contracts?"
        },
        {
          text: "Are trademarks and logos used in the software registered and protected under WIPO guidelines?"
        },
        {
          text: "Have patent searches been conducted to ensure the software algorithms do not infringe on existing patents?"
        },
        {
          text: "Are copyright notices correctly applied to the source code files and user interfaces?"
        },
        {
          text: "Are trade secrets protected using technical controls (such as obfuscation, encryption, and restricted repository access)?"
        },
        {
          text: "Does the software design adhere to the standard of care to defend against professional liability and negligence claims?"
        },
        {
          text: "Has a trade compliance review been conducted to verify export regulations and sanctions on technology transfer?"
        },
        {
          text: "Are security controls implemented to protect the system and user data from cybercrime, hacking, and unauthorized access?"
        },
        {
          text: "Has the user interface design been audited to ensure no deceptive design (dark patterns) or manipulative interactions are present?"
        },
        {
          text: "Does the software comply with international data privacy laws, such as GDPR (mandating Privacy by Design and Right to be Forgotten) and CCPA?"
        },
        {
          text: "Is comprehensive technical documentation (SRS, SDD, test specs) compiled and retained for the duration of the software lifecycle?"
        },
        {
          text: "Has an objective and impartial trade-off analysis been conducted to evaluate alternative designs based on risk, cost, and benefit?"
        },
        {
          text: "Have all potential conflicts of interest been disclosed upfront before conducting trade-off evaluations?"
        },
        {
          text: "Are user warnings and safety procedures clearly highlighted in the user manuals and documentation?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "professional practice, professionalism, accreditation, certification, licensing, code of ethics, standards, employment contracts, legal issues, trade compliance, cybercrime, data privacy, GDPR, CCPA, dark patterns, documentation, trade-off analysis",
  filename: "professional-practice-professionalism",
  trigger: "model_decision"
});
