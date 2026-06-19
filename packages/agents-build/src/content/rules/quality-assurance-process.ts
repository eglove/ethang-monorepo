import { defineRule } from "../../define.ts";

export const qualityAssuranceProcess = defineRule({
  content: `# Software Quality Assurance Process: SQA, V&V, Reviews, and Audits

## 1. Domain Theory and Conceptual Foundations
Software Quality Assurance (SQA) is defined by the IEEE Software Engineering Body of Knowledge (SWEBOK v4) as a set of planned and systematic activities that define and assess the adequacy of software processes to provide evidence that establishes confidence that those processes are appropriate for and produce software products of suitable quality for their intended purposes. A fundamental tenet of SQA is its distinction from testing; testing is a product-focused defect detection activity, whereas SQA is a process-focused defect prevention and compliance evaluation discipline. To ensure objectivity, the SQA function must be organizationally independent of the project development team, operating free from technical, managerial, and financial pressures that might compromise its findings.

### 1.1 SQA Planning and the SQAP
The Software Quality Assurance Plan (SQAP) is the governing document that outlines the quality assurance activities, tasks, resources, and schedules for a software development or maintenance project. The SQAP is integrated with other project planning artifacts—such as the software engineering management plan, software development plan, and software maintenance plan—and should not conflict with them. Instead, the SQAP is complementary, establishing the standards, practices, and conventions that govern the project and outlining how they will be monitored.
The SQAP specifies:
- **Quality Targets**: Clearly defined, measurable quality goals for the project.
- **Monitoring Procedures**: Methods to check and audit compliance with project standards and conventions.
- **Resource Requirements**: Budget, tooling, and personnel assigned to SQA tasks.
- **Problem Reporting and Corrective Actions**: Procedures for documenting nonconformities and tracking their resolution.
- **Procurement and Supplier Controls**: SQA activities applied to commercial off-the-shelf (COTS) software, subcontracted software, or supplier integration.

### 1.2 Process Assurance and Product Assurance
SQA addresses quality from two complementary perspectives: process assurance and product assurance.
- **Process Assurance**: Evaluates whether the processes used to develop the software conform to established plans, standards, and QMS policies. Grounded in the quality principles of Crosby and Humphrey, process assurance assumes that process quality directly impacts final product quality. SQA activities include process audits, monitoring configuration management versioning, and verifying that development environments and toolkits comply with quality guidelines.
- **Product Assurance**: Evaluates the quality of intermediate work products (such as requirements specifications, design descriptions, source code, and test plans) and the final delivered system.
  - *Quality of Service Constraints*: Product assurance ensures that nonfunctional requirements—such as usability, reliability, maintainability, and security—are elicitable, defined, and measurable.
  - *Quality Model Compliance*: Evaluates software characteristics in accordance with standards like ISO/IEC 25010 (SQuaRE), which defines the following characteristics:
    - *Functional Suitability*: Functional completeness, correctness, and appropriateness.
    - *Performance Efficiency*: Time behavior (response times), resource utilization (CPU/memory), and capacity limits.
    - *Compatibility*: Coexistence with other software and interoperability across systems.
    - *Usability*: Appropriateness recognizability, learnability, operability, user error protection, user interface aesthetics, and accessibility.
    - *Reliability*: Maturity, availability, fault tolerance, and recoverability.
    - *Security*: Confidentiality, integrity, non-repudiation, accountability, and authenticity.
    - *Maintainability*: Modularity, reusability, analyzability, modifiability, and testability.
    - *Portability*: Adaptability, installability, and replaceability.
  - *Trade-off Management*: SQA monitors the balance between conflicting quality characteristics, such as how encrypting data to augment security affects performance efficiency.

### 1.3 Verification and Validation (V&V)
Verification and Validation (V&V) are complementary processes used to determine whether software products conform to specifications and satisfy user needs.
- **Verification**: Evaluates work products to determine whether they satisfy the conditions imposed at the start of a given development phase ("Are we building the product correctly?").
- **Validation**: Evaluates the completed system to determine whether it satisfies specified requirements and fulfills its intended purpose ("Are we building the right product?").
IEEE 1012 defines a structured framework for lifecycle V&V. SQA matches V&V task intensity and independence (including Independent V&V, or IV&V, performed by a third party) to the software's integrity level.

### 1.4 Analysis Techniques: Static, Dynamic, and Formal
V&V tasks are categorized into three primary analysis techniques:
1. **Static Analysis**: Evaluates work products (requirements, design, source code, test documentation) without executing the code. Static techniques include manual peer reviews, code reading, checking syntax, and automated control/data flow analysis (e.g., detecting dead or unreachable code).
2. **Dynamic Analysis**: Involves executing or simulating the software code to look for errors and defects. Dynamic techniques include functional testing, performance testing, simulation, model checking, and black box testing.
3. **Formal Analysis**: Employs mathematical logic and formal specification languages to verify the correctness of crucial components, such as safety-critical algorithms or security protocols.

### 1.5 Technical Reviews and Audits
Reviews and audits are quality control checkpoints designed to evaluate work products, identify defects early, and share engineering knowledge.
- **Reviews**: Peer reviews evaluate work products (e.g., code, designs) to identify defects for removal. Under ISO/IEC 20246, reviews are categorized as:
  - *Ad hoc*: Unstructured reviews where reviewers find as many defects as possible.
  - *Checklist-based*: Systematic reviews guided by predefined checklists.
  - *Scenario-based*: Reviews where reviewers follow guidelines on how to read the work product.
  - *Perspective-based*: Reviewers evaluate the work product from distinct stakeholder viewpoints (e.g., user, designer, administrator).
  - *Role-based*: Reviewers evaluate the work product from the perspective of specific operational roles.
- **Audits**: Formal, objective evaluations conducted to check compliance with requirements, standards, or contractual agreements, often mandated to be performed by independent third parties.
- **Milestone Reviews**: Structured reviews conducted at key engineering gates:
  - *System Requirements Review (SRR)*: Verifies that system requirements are understood and adequate to proceed to initial design.
  - *System Functional / Preliminary Design Review (PDR)*: Ensures the design is mature enough to proceed to detailed design with acceptable risk.
  - *Test Readiness Review (TRR)*: Assesses test plans, procedures, resources, and safety protocols prior to formal testing.
  - *Production Readiness Review (PRR)*: Ascertains that the system design and production planning are ready for manufacturing or deployment.

## 2. Compliance Checklist
- [ ] Has a Software Quality Assurance Plan (SQAP) been documented, approved, and integrated with other project planning files?
- [ ] Is the SQA function organizationally independent of development, operating free from technical and financial pressures?
- [ ] Are process quality targets, standards, and conventions clearly specified in the SQAP?
- [ ] Does the SQAP identify the measures, statistical techniques, and procedures used to track and report quality problems?
- [ ] Are quality assurance activities planned for commercial off-the-shelf (COTS) software and subcontracted components?
- [ ] Are SQA process audits and configuration management audits scheduled at major project milestones?
- [ ] Does the project plan for both process assurance (compliance with QMS workflow) and product assurance (work product evaluations)?
- [ ] Are the Quality of Service Constraints (nonfunctional requirements) defined and measurable for final acceptance?
- [ ] Has the project evaluated trade-offs between conflicting quality characteristics, such as security and performance?
- [ ] Are V&V processes initiated early in the project lifecycle to prevent defect propagation and minimize rework costs?
- [ ] Has a traceability matrix been established to trace requirements forward to design, code, and tests, and backward to source files?
- [ ] Are V&V tasks selected and performed in accordance with the assigned software integrity levels defined in IEEE 1012?
- [ ] Is Independent Verification and Validation (IV&V) utilized for safety-critical or high-consequence software components?
- [ ] Do static analysis techniques, such as code reviews or syntax checkers, analyze all non-executable work products?
- [ ] Are dynamic analysis techniques, including functional and performance testing, scheduled and tracked?
- [ ] Are formal mathematical verification methods applied to critical safety or security algorithms?
- [ ] Are peer reviews, including checklist-based or perspective-based reviews, integrated into the software engineering culture?
- [ ] Are technical milestone reviews (such as SRR, PDR, TRR, and PRR) planned, conducted, and documented at phase transitions?
- [ ] Are formal compliance audits performed by independent third parties to verify process and standard conformity?`,
  description:
    "software quality assurance process, SQA, process assurance, product assurance, software quality assurance plan, SQAP, V&V, verification and validation, static analysis, dynamic analysis, formal analysis, quality control, technical reviews, peer reviews, inspections, walkthroughs, audits, system requirements reviews, test readiness reviews, production readiness reviews",
  filename: "quality-assurance-process",
  trigger: "model_decision"
});
