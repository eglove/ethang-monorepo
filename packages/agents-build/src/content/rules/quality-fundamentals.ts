import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const qualityFundamentals = defineRule({
  content: [
    {
      level: 1,
      text: "Software Quality Fundamentals: Culture, Ethics, Costs, and Dependability",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software quality is a core engineering discipline, defined by SWEBOK v4 as the conformance to established requirements and the capability of a software product to satisfy stated and implied needs under specified conditions. Rather than treating quality as a reactive construct, software engineering demands a systematic application of quality principles, process rigor, and quantitative measurement across the lifecycle. Quality is defined by the degree to which a product meets requirements; however, the value of quality is determined by the degree to which requirements accurately represent stakeholder needs and expectations. A primary challenge is managing the gap between implicit user needs and explicit specifications, requiring clear definitions, continuous verification, and robust communication.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Taxonomy of Anomalies: Errors, Defects, and Failures",
      type: "header"
    },
    {
      text: "To prevent confusion and maintain professional rigor, software engineers must differentiate between specific terms used to describe software anomalies, as defined by international standards like ISO/IEC/IEEE 24765:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Error**: An error is a human action that produces an incorrect result. Also known as human error, it occurs during cognitive activities such as requirements elicitation, design drafting, or code implementation. It represents a developer's or analyst's slip or misunderstanding."
        },
        {
          text: "**Defect**: A defect (synonymous with a fault) is an imperfection or deficiency in a work product where that work product does not meet requirements or specifications. A defect is inserted into a work product when a person makes an error. It remains hidden until discovered by appraisal or executed at runtime."
        },
        {
          text: "**Failure**: A failure is the termination of a system's ability to perform a required function, or its inability to perform within specified limits. A failure is an externally visible deviation from the system's specification that is produced when the software executes a defect.\nUnderstanding this causal chain—human errors inject defects into work products, and executing defects produces failures—is critical for designing quality assurance and debugging strategies."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Software Engineering Culture and Ethics",
      type: "header"
    },
    {
      text: "An organization's culture affects how quality is influenced. Engineering practices vary depending on the business model (such as custom software, mass-market applications, or firmware) and the specific industry. A healthy culture requires a shared commitment to quality, acknowledging that trade-offs among cost, schedule, and quality are fundamental engineering constraints.\nA strong software engineering ethic assumes that engineers report quality outcomes accurately and transparently. The IEEE Computer Society and ACM maintain a Code of Ethics and Professional Conduct that obligates engineers to prioritize public safety, maintain integrity, and provide objective quality reports. This professional attitude extends to peer reviews and walkthroughs, which must be framed in a constructive, nonpersonal manner to foster continuous improvement.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Value and Costs of Quality (CoSQ)",
      type: "header"
    },
    {
      text: "The Cost of Software Quality (CoSQ) is a financial model used to quantify the economic value of quality activities and justify quality investments. CoSQ is categorized into conformance costs and nonconformance costs.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Conformance Costs**: The total investment in preventing and detecting errors and defects.\n- *Prevention Costs*: Investments to prevent defects. These include process improvement (SPI) efforts, quality tool procurement, template design, training, and standardizing development environments.\n- *Appraisal Costs*: Investments designed to find defects and verify compliance. These include testing, inspections, peer reviews, technical reviews, and audits of work products."
        },
        {
          text: "**Nonconformance Costs**: The total expenditure incurred due to errors, defects, and failures.\n- *Internal Failure Costs*: Costs to repair and retest defects discovered during appraisal before delivery (rework, regression testing, and refactoring).\n- *External Failure Costs*: Costs incurred when a failure occurs after delivery. These include hotfixes, patches, customer support, lost productivity, data recovery, legal liabilities, and damage to reputation.\nSoftware engineers seek the optimal CoSQ, which represents the minimal total cost for a specified quality target, demonstrating that early prevention and appraisal are significantly less expensive than repairing post-delivery failures."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Standards, Models, and Certifications",
      type: "header"
    },
    {
      text: "Systematic standards and models establish a baseline for software quality and process capabilities. The cornerstone standard is ISO/IEC/IEEE 12207, which defines software life cycle processes. Additionally, specialized standards apply to safety-critical domains, such as DO-178C for airborne systems, EN 50128 for railway signaling, IEEE 1228 for software safety planning, and IEEE 1633 for software reliability.\nIndustry-defined frameworks and models propose best practices:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Governance and Management Models**: COBIT for IT governance, PMBOK for project management, BABOK for business analysis, and TOGAF for enterprise architecture."
        },
        {
          text: "**Maturity Models**: CMMI provides process capability and maturity assessments."
        },
        {
          text: "**Certifications**: ISO 9001 (quality management), ISO/IEC 27001 (security), ISO/IEC 20000 (operations), and SAFe certifications for agile processes.\nAdherence to these standards and models builds stakeholder confidence and provides structured frameworks for process improvement."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Dependability, Integrity, and Safety-Critical Systems",
      type: "header"
    },
    {
      text: "Safety-critical systems are those in which a failure could result in loss of life, injury, severe property damage, or environmental disaster. Direct software is embedded in safety-critical hardware, while indirect software is used to build or test safety-critical systems.\nTo manage risks, three risk reduction techniques are applied:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Avoidance**: Preventing fault introduction through rigorous languages, design patterns, and process constraints."
        },
        {
          text: "**Detection and Removal**: Identifying and eliminating defects using inspections, static analysis, dynamic testing, and formal verification."
        },
        {
          text: "**Damage Limitation**: Implementing fault tolerance and fail-safe modes to contain failures when they occur.\nFor critical systems, engineers compile assurance cases. An assurance case is a reasoned, auditable document providing evidence that claims (e.g., safety, reliability) are satisfied. It comprises explicit claims, arguments linking evidence to claims, and a body of supporting evidence and assumptions.\nIntegrity levels represent project-unique characteristics (complexity, criticality, and safety) defining system importance. Schemes like Software Integrity Levels define the minimum SQA activities, independent V&V tasks, and review rigor required based on the assigned level.\nSystem dependability represents the core quality requirement for high-consequence systems. It regroups availability (operational probability), reliability (failure-free execution under specified conditions), maintainability (ease of modification), safety (freedom from harm), and security (protection of system assets)."
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
          text: "Is software quality formally defined and agreed upon by all key stakeholders at the start of the project?"
        },
        {
          text: "Do the established requirements accurately represent the stakeholders' stated and implied needs, wants, and expectations?"
        },
        {
          text: "Are the distinct definitions of error, defect/fault, and failure understood and applied consistently across all quality reports?"
        },
        {
          text: "Does the engineering team maintain a transparent culture where trade-offs among cost, schedule, and quality are openly reported?"
        },
        {
          text: "Are all quality findings, test outcomes, and project risks documented and communicated in accordance with the IEEE/ACM Code of Ethics?"
        },
        {
          text: "Has the Cost of Software Quality (CoSQ) been analyzed, distinguishing between conformance costs and nonconformance costs?"
        },
        {
          text: "Are prevention costs, such as training, process improvements, and templating, budgeted as part of the quality strategy?"
        },
        {
          text: "Are appraisal costs, including inspections, reviews, and test activities, explicitly planned for each lifecycle milestone?"
        },
        {
          text: "Is the cost of internal rework and pre-delivery defect repair tracked to optimize early appraisal activities?"
        },
        {
          text: "Are the risks of post-delivery failures, including reputational, legal, and operational impacts, quantified and reported to management?"
        },
        {
          text: "Has the project identified and adopted the software engineering standards (such as ISO/IEC/IEEE 12207) relevant to its domain?"
        },
        {
          text: "Are safety-critical systems designed in compliance with industry-specific standards, such as DO-178C or EN 50128?"
        },
        {
          text: "Does the project utilize process assessment models, such as CMMI or ISO/IEC 33061, to measure and improve process maturity?"
        },
        {
          text: "Has the software's dependability been evaluated across the dimensions of availability, reliability, maintainability, safety, and security?"
        },
        {
          text: "Is there an assurance case compiled for safety-critical components, containing explicit claims, logical arguments, and supporting evidence?"
        },
        {
          text: "Has a software integrity level scheme been established to classify system components based on risk, safety, and complexity?"
        },
        {
          text: "Are high-integrity components subjected to independent verification and validation (IV&V) to ensure objectivity?"
        },
        {
          text: "Are risk reduction techniques—including fault avoidance, defect detection, and damage limitation—integrated into the system design?"
        },
        {
          text: "Is the level of independent quality assurance and verification rigor scaled dynamically based on the assigned software integrity levels?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software quality fundamentals, software engineering culture and ethics, codes of ethics and professional conduct, value and costs of quality, cost of software quality, conformance cost, appraisal costs, prevention costs, nonconformance cost, pre-delivery costs, post-delivery costs, standards, models, and certifications, software dependability, safety-critical systems, software availability, reliability, and maintainability, software integrity levels, walk-through review",
  filename: "quality-fundamentals",
  trigger: "model_decision"
});
