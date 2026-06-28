import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const qualityAssuranceProcess = defineRule({
  content: [
    {
      level: 1,
      text: "Software Quality Assurance Process: SQA, V&V, Reviews, and Audits",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software Quality Assurance (SQA) is defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as a set of planned and systematic activities that define and assess the adequacy of software processes to provide evidence that establishes confidence that those processes are appropriate for and produce software products of suitable quality for their intended purposes. A fundamental tenet of SQA is its distinction from testing; testing is a product-focused defect detection activity, whereas SQA is a process-focused defect prevention and compliance evaluation discipline. To ensure objectivity, the SQA function must be organizationally independent of the project development team, operating free from technical, managerial, and financial pressures that might compromise its findings.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 SQA Planning and the SQAP",
      type: "header"
    },
    {
      text: "The Software Quality Assurance Plan (SQAP) is the governing document that outlines the quality assurance activities, tasks, resources, and schedules for a software development or maintenance project. The SQAP is integrated with other project planning artifacts—such as the software engineering management plan, software development plan, and software maintenance plan—and should not conflict with them. Instead, the SQAP is complementary, establishing the standards, practices, and conventions that govern the project and outlining how they will be monitored.\nThe SQAP specifies:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Quality Targets**: Clearly defined, measurable quality goals for the project."
        },
        {
          text: "**Monitoring Procedures**: Methods to check and audit compliance with project standards and conventions."
        },
        {
          text: "**Resource Requirements**: Budget, tooling, and personnel assigned to SQA tasks."
        },
        {
          text: "**Problem Reporting and Corrective Actions**: Procedures for documenting nonconformities and tracking their resolution."
        },
        {
          text: "**Procurement and Supplier Controls**: SQA activities applied to commercial off-the-shelf (COTS) software, subcontracted software, or supplier integration."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Process Assurance and Product Assurance",
      type: "header"
    },
    {
      text: "SQA addresses quality from two complementary perspectives: process assurance and product assurance.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Process Assurance**: Evaluates whether the processes used to develop the software conform to established plans, standards, and QMS policies. Grounded in the quality principles of Crosby and Humphrey, process assurance assumes that process quality directly impacts final product quality. SQA activities include process audits, monitoring configuration management versioning, and verifying that development environments and toolkits comply with quality guidelines."
        },
        {
          text: "**Product Assurance**: Evaluates the quality of intermediate work products (such as requirements specifications, design descriptions, source code, and test plans) and the final delivered system.\n- *Quality of Service Constraints*: Product assurance ensures that nonfunctional requirements—such as usability, reliability, maintainability, and security—are elicitable, defined, and measurable.\n- *Quality Model Compliance*: Evaluates software characteristics in accordance with standards like ISO/IEC 25010 (SQuaRE), which defines the following characteristics:\n  - *Functional Suitability*: Functional completeness, correctness, and appropriateness.\n  - *Performance Efficiency*: Time behavior (response times), resource utilization (CPU/memory), and capacity limits.\n  - *Compatibility*: Coexistence with other software and interoperability across systems.\n  - *Usability*: Appropriateness recognizability, learnability, operability, user error protection, user interface aesthetics, and accessibility.\n  - *Reliability*: Maturity, availability, fault tolerance, and recoverability.\n  - *Security*: Confidentiality, integrity, non-repudiation, accountability, and authenticity.\n  - *Maintainability*: Modularity, reusability, analyzability, modifiability, and testability.\n  - *Portability*: Adaptability, installability, and replaceability.\n- *Trade-off Management*: SQA monitors the balance between conflicting quality characteristics, such as how encrypting data to augment security affects performance efficiency."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Verification and Validation (V&V)",
      type: "header"
    },
    {
      text: "Verification and Validation (V&V) are complementary processes used to determine whether software products conform to specifications and satisfy user needs.",
      type: "text"
    },
    {
      items: [
        {
          text: '**Verification**: Evaluates work products to determine whether they satisfy the conditions imposed at the start of a given development phase ("Are we building the product correctly?").'
        },
        {
          text: '**Validation**: Evaluates the completed system to determine whether it satisfies specified requirements and fulfills its intended purpose ("Are we building the right product?").\nIEEE 1012 defines a structured framework for lifecycle V&V. SQA matches V&V task intensity and independence (including Independent V&V, or IV&V, performed by a third party) to the software\'s integrity level.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Analysis Techniques: Static, Dynamic, and Formal",
      type: "header"
    },
    {
      text: "V&V tasks are categorized into three primary analysis techniques:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Static Analysis**: Evaluates work products (requirements, design, source code, test documentation) without executing the code. Static techniques include manual peer reviews, code reading, checking syntax, and automated control/data flow analysis (e.g., detecting dead or unreachable code)."
        },
        {
          text: "**Dynamic Analysis**: Involves executing or simulating the software code to look for errors and defects. Dynamic techniques include functional testing, performance testing, simulation, model checking, and black box testing."
        },
        {
          text: "**Formal Analysis**: Employs mathematical logic and formal specification languages to verify the correctness of crucial components, such as safety-critical algorithms or security protocols."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.5 Technical Reviews and Audits",
      type: "header"
    },
    {
      text: "Reviews and audits are quality control checkpoints designed to evaluate work products, identify defects early, and share engineering knowledge.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Reviews**: Peer reviews evaluate work products (e.g., code, designs) to identify defects for removal. Under ISO/IEC 20246, reviews are categorized as:\n- *Ad hoc*: Unstructured reviews where reviewers find as many defects as possible.\n- *Checklist-based*: Systematic reviews guided by predefined checklists.\n- *Scenario-based*: Reviews where reviewers follow guidelines on how to read the work product.\n- *Perspective-based*: Reviewers evaluate the work product from distinct stakeholder viewpoints (e.g., user, designer, administrator).\n- *Role-based*: Reviewers evaluate the work product from the perspective of specific operational roles."
        },
        {
          text: "**Audits**: Formal, objective evaluations conducted to check compliance with requirements, standards, or contractual agreements, often mandated to be performed by independent third parties."
        },
        {
          text: "**Milestone Reviews**: Structured reviews conducted at key engineering gates:\n- *system Requirements Review (SRR)*: Verifies that system requirements are understood and adequate to proceed to initial design.\n- *system Functional / Preliminary Design Review (PDR)*: Ensures the design is mature enough to proceed to detailed design with acceptable risk.\n- *Test Readiness Review (TRR)*: Assesses test plans, procedures, resources, and safety protocols prior to formal testing.\n- *Production Readiness Review (PRR)*: Ascertains that the system design and production planning are ready for manufacturing or deployment."
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
          text: "Has a Software Quality Assurance Plan (SQAP) been documented, approved, and integrated with other project planning files?"
        },
        {
          text: "Is the SQA function organizationally independent of development, operating free from technical and financial pressures?"
        },
        {
          text: "Are process quality targets, standards, and conventions clearly specified in the SQAP?"
        },
        {
          text: "Does the SQAP identify the measures, statistical techniques, and procedures used to track and report quality problems?"
        },
        {
          text: "Are quality assurance activities planned for commercial off-the-shelf (COTS) software and subcontracted components?"
        },
        {
          text: "Are SQA process audits and configuration management audits scheduled at major project milestones?"
        },
        {
          text: "Does the project plan for both process assurance (compliance with QMS workflow) and product assurance (work product evaluations)?"
        },
        {
          text: "Are the Quality of Service Constraints (nonfunctional requirements) defined and measurable for final acceptance?"
        },
        {
          text: "Has the project evaluated trade-offs between conflicting quality characteristics, such as security and performance?"
        },
        {
          text: "Are V&V processes initiated early in the project lifecycle to prevent defect propagation and minimize rework costs?"
        },
        {
          text: "Has a traceability matrix been established to trace requirements forward to design, code, and tests, and backward to source files?"
        },
        {
          text: "Are V&V tasks selected and performed in accordance with the assigned software integrity levels defined in IEEE 1012?"
        },
        {
          text: "Is Independent Verification and Validation (IV&V) utilized for safety-critical or high-consequence software components?"
        },
        {
          text: "Do static analysis techniques, such as code reviews or syntax checkers, analyze all non-executable work products?"
        },
        {
          text: "Are dynamic analysis techniques, including functional and performance testing, scheduled and tracked?"
        },
        {
          text: "Are formal mathematical verification methods applied to critical safety or security algorithms?"
        },
        {
          text: "Are peer reviews, including checklist-based or perspective-based reviews, integrated into the software engineering culture?"
        },
        {
          text: "Are technical milestone reviews (such as SRR, PDR, TRR, and PRR) planned, conducted, and documented at phase transitions?"
        },
        {
          text: "Are formal compliance audits performed by independent third parties to verify process and standard conformity?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software quality assurance process, SQA, process assurance, product assurance, software quality assurance plan, SQAP, V&V, verification and validation, static analysis, dynamic analysis, formal analysis, quality control, technical reviews, peer reviews, inspections, walkthroughs, audits, system requirements reviews, test readiness reviews, production readiness reviews",
  filename: "quality-assurance-process",
  trigger: "model_decision"
});
