# SWEBOK v4 Rule Migration Tracker

This file tracks the systematic migration of [IEEE SWEBOK v4](file:///C:/Users/glove/projects/ethang-monorepo/swebok-v4.pdf) Chapters and Sections into compiled workspace rules within the compiler package at [packages/agents-build/src/content/rules/](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/).

## SWEBOK Section Migration Process Guide

When starting the migration of the next SWEBOK v4 section, use the prompt template below and review the implementation constraints:

### Generation Prompt Template

```
next is chapter {chapter_number} section {section_number} of @swebok-v4.md {rule_name} broad description think about how we can maximize triggering this
```

### Reference Implementation Instructions

Future agents working on this migration should follow these strict requirements:
1. **Rule Size Gate**: The final compiled markdown file under `.agents/rules/{rule_name}.md` must be **strictly between 10,000 and 12,000 characters** in length. If it falls short, expand the Domain Theory and Conceptual Foundations section with deep industry-standard details.
2. **Strict SWEBOK v4 Mapping**: The compliance checklist inside the rule must focus solely on SWEBOK v4 topic guidelines. Do not include project-specific rules (such as Yoda conditions, bracket notation, or Luxon dates) in the checklist.
3. **No Code Blocks or SOPs**: Avoid including code blocks (like TS/JS syntax) or step-by-step Standard Operating Procedures (SOPs) inside the rule markdown content. The markdown content is a domain-level conceptual guide and compliance checklist.
4. **Clean Registry Registration**:
   - Save the TypeScript definition file under `packages/agents-build/src/content/rules/{rule_name}.ts`.
   - Register the new rule in the `GLOBAL_RULES` array inside [global.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/global.ts).
5. **Workspace Validation**: Run the full compilation and test suite before concluding:
   - Compile rules: `rtk pnpm --filter @ethang/agents-build build`
   - Run tests: `rtk pnpm --filter @ethang/agents-build test`
   - Run linter/tsc: `rtk pnpm --filter @ethang/agents-build lint`

## Migration Progress Summary

- **Total Chapters**: 18
- **Fully Completed Chapters**: 18 (Chapters 1 through 18)
- **Incomplete Chapters**: 0

---

## Detailed Chapter & Section Status

### Chapter 1: Software Requirements (100% Complete)
- [x] **1.1 Software Requirements Fundamentals** — `requirements-fundamentals` ([requirements-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-fundamentals.ts))
- [x] **1.2 Requirements Elicitation** — `requirements-elicitation` ([requirements-elicitation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-elicitation.ts))
- [x] **1.3 Requirements Analysis** — `requirements-analysis` ([requirements-analysis.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-analysis.ts))
- [x] **1.4 Requirements Specification** — `requirements-specification` ([requirements-specification.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-specification.ts))
- [x] **1.5 Requirements Validation** — `requirements-validation` ([requirements-validation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-validation.ts))
- [x] **1.6 Requirements Management Activities** — `requirements-management-activities` ([requirements-management-activities.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-management-activities.ts))
- [x] **1.7 Practical Considerations** — `requirements-practical-considerations` ([requirements-practical-considerations.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-practical-considerations.ts))
- [x] **1.8 Software Requirements Tools** — `requirements-tools` ([requirements-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/requirements-tools.ts))

### Chapter 2: Software Architecture (100% Complete)
- [x] **2.1 Software Architecture Fundamentals** — `architecture-fundamentals` ([architecture-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/architecture-fundamentals.ts))
- [x] **2.2 Software Architecture Description** — `architecture-description` ([architecture-description.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/architecture-description.ts))
- [x] **2.3 Software Architecture Process** — `architecture-process` ([architecture-process.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/architecture-process.ts))
- [x] **2.4 Software Architecture Evaluation** — `architecture-evaluation` ([architecture-evaluation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/architecture-evaluation.ts))

### Chapter 3: Software Design (100% Complete)
- [x] **3.1 Software Design Fundamentals** — `design-fundamentals` ([design-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/design-fundamentals.ts))
- [x] **3.2 Software Design Processes** — `design-processes` ([design-processes.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/design-processes.ts))
- [x] **3.3 Software Design Qualities** — `design-qualities` ([design-qualities.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/design-qualities.ts))
- [x] **3.4 Recording Software Designs** — `design-recording` ([design-recording.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/design-recording.ts))
- [x] **3.5 Software Design Strategies and Methods** — `design-strategies-methods` ([design-strategies-methods.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/design-strategies-methods.ts))
- [x] **3.6 Software Design Quality Analysis and Evaluation** — `design-quality-analysis-evaluation` ([design-quality-analysis-evaluation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/design-quality-analysis-evaluation.ts))

### Chapter 4: Software Construction (100% Complete)
- [x] **4.1 Software Construction Fundamentals** — `construction-fundamentals` ([construction-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/construction-fundamentals.ts))
- [x] **4.2 Managing Construction** — `construction-management` ([construction-management.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/construction-management.ts))
- [x] **4.3 Practical Considerations** — `construction-practical-considerations` ([construction-practical-considerations.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/construction-practical-considerations.ts))
- [x] **4.4 Construction Technologies** — `construction-technologies` ([construction-technologies.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/construction-technologies.ts))
- [x] **4.5 Software Construction Tools** — `construction-tools` ([construction-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/construction-tools.ts))

### Chapter 5: Software Testing (100% Complete)
- [x] **5.1 Software Testing Fundamentals** — `testing-fundamentals` ([testing-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-fundamentals.ts))
- [x] **5.2 Test Levels** — `testing-levels` ([testing-levels.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-levels.ts))
- [x] **5.3 Test Techniques** — `testing-techniques` ([testing-techniques.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-techniques.ts))
- [x] **5.4 Test-Related Measures** — `testing-measures` ([testing-measures.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-measures.ts))
- [x] **5.5 Test Process** — `testing-process` ([testing-process.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-process.ts))
- [x] **5.6 Software Testing in the Development Processes and the Application Domains** — `testing-development-processes` ([testing-development-processes.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-development-processes.ts))
- [x] **5.7 Testing of and Testing Through Emerging Technologies** — `testing-emerging-technologies` ([testing-emerging-technologies.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-emerging-technologies.ts))
- [x] **5.8 Software Testing Tools** — `testing-tools` ([testing-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/testing-tools.ts))

### Chapter 6: Software Engineering Operations (100% Complete)
- [x] **6.1 Software Engineering Operations Fundamentals** — `engineering-operations-fundamentals` ([engineering-operations-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-operations-fundamentals.ts))
- [x] **6.2 Software Engineering Operations Planning** — `engineering-operations-planning` ([engineering-operations-planning.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-operations-planning.ts))
- [x] **6.3 Software Engineering Operations Delivery** — `engineering-operations-delivery` ([engineering-operations-delivery.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-operations-delivery.ts))
- [x] **6.4 Software Engineering Operations Control** — `engineering-operations-control` ([engineering-operations-control.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-operations-control.ts))
- [x] **6.5 Practical Considerations** — `engineering-operations-practical-considerations` ([engineering-operations-practical-considerations.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-operations-practical-considerations.ts))
- [x] **6.6 Software Engineering Operations Tools** — `engineering-operations-tools` ([engineering-operations-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-operations-tools.ts))

### Chapter 7: Software Maintenance (100% Complete)
- [x] **7.1 Software Maintenance Fundamentals** — `maintenance-fundamentals` ([maintenance-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/maintenance-fundamentals.ts))
- [x] **7.2 Key Issues in Software Maintenance** — `maintenance-key-issues` ([maintenance-key-issues.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/maintenance-key-issues.ts))
- [x] **7.3 Software Maintenance Processes** — `maintenance-processes` ([maintenance-processes.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/maintenance-processes.ts))
- [x] **7.4 Software Maintenance Techniques** — `maintenance-techniques` ([maintenance-techniques.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/maintenance-techniques.ts))
- [x] **7.5 Software Maintenance Tools** — `maintenance-tools` ([maintenance-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/maintenance-tools.ts))

### Chapter 8: Software Configuration Management (100% Complete)
- [x] **8.1 Management of the SCM Process** — `configuration-management-process` ([configuration-management-process.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/configuration-management-process.ts))
- [x] **8.2 Software Configuration Identification** — `configuration-identification` ([configuration-identification.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/configuration-identification.ts))
- [x] **8.3 Software Configuration Change Control** — `configuration-change-control` ([configuration-change-control.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/configuration-change-control.ts))
- [x] **8.4 Software Configuration Status Accounting** — `configuration-status-accounting` ([configuration-status-accounting.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/configuration-status-accounting.ts))
- [x] **8.5 Software Configuration Auditing** — `configuration-auditing` ([configuration-auditing.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/configuration-auditing.ts))
- [x] **8.6 Software Release Management and Delivery** — `configuration-release-management` ([configuration-release-management.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/configuration-release-management.ts))

### Chapter 9: Software Engineering Management (100% Complete)
- [x] **9.1 Initiation and Scope Definition** — `engineering-management-initiation-scope` ([engineering-management-initiation-scope.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-management-initiation-scope.ts))
- [x] **9.2 Software Project Planning** — `engineering-management-planning` ([engineering-management-planning.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-management-planning.ts))
- [x] **9.3 Software Project Execution** — `engineering-management-execution` ([engineering-management-execution.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-management-execution.ts))
- [x] **9.4 Software Review and Evaluation** — `engineering-management-review-evaluation` ([engineering-management-review-evaluation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-management-review-evaluation.ts))
- [x] **9.5 Closure** — `engineering-management-closure` ([engineering-management-closure.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-management-closure.ts))
- [x] **9.6 Software Engineering Measurement** — `engineering-management-measurement` ([engineering-management-measurement.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-management-measurement.ts))

### Chapter 10: Software Engineering Process (100% Complete)
- [x] **10.1 Software Engineering Process Fundamentals** — `engineering-process-fundamentals` ([engineering-process-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-process-fundamentals.ts))
- [x] **10.2 Life Cycles** — `engineering-process-lifecycles` ([engineering-process-lifecycles.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-process-lifecycles.ts))
- [x] **10.3 Software Process Assessment and Improvement** — `engineering-process-assessment-improvement` ([engineering-process-assessment-improvement.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-process-assessment-improvement.ts))

### Chapter 11: Software Engineering Models and Methods (100% Complete)
- [x] **11.1 Modeling** — `models-methods-modeling` ([models-methods-modeling.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/models-methods-modeling.ts))
- [x] **11.2 Types of Models** — `models-methods-types` ([models-methods-types.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/models-methods-types.ts))
- [x] **11.3 Analysis of Models** — `models-methods-analysis` ([models-methods-analysis.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/models-methods-analysis.ts))
- [x] **11.4 Software Engineering Methods** — `models-methods-methods` ([models-methods-methods.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/models-methods-methods.ts))

### Chapter 12: Software Quality (100% Complete)
- [x] **12.1 Software Quality Fundamentals** — `quality-fundamentals` ([quality-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/quality-fundamentals.ts))
- [x] **12.2 Software Quality Management Process** — `quality-management-process` ([quality-management-process.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/quality-management-process.ts))
- [x] **12.3 Software Quality Assurance Process** — `quality-assurance-process` ([quality-assurance-process.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/quality-assurance-process.ts))
- [x] **12.4 Software Quality Tools** — `quality-tools` ([quality-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/quality-tools.ts))

### Chapter 13: Software Security (100% Complete)
- [x] **13.1 Software Security Fundamentals** — `security-fundamentals` ([security-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/security-fundamentals.ts))
- [x] **13.2 Security Management and Organization** — `security-management-organization` ([security-management-organization.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/security-management-organization.ts))
- [x] **13.3 Software Security Engineering and Processes** — `security-engineering-processes` ([security-engineering-processes.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/security-engineering-processes.ts))
- [x] **13.4 Security Engineering for Software Systems** — `security-engineering-systems` ([security-engineering-systems.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/security-engineering-systems.ts))
- [x] **13.5 Software Security Tools** — `security-tools` ([security-tools.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/security-tools.ts))
- [x] **13.6 Domain-Specific Software Security** — `security-domain-specific` ([security-domain-specific.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/security-domain-specific.ts))

### Chapter 14: Software Engineering Professional Practice (100% Complete)
- [x] **14.1 Professionalism** — `professional-practice-professionalism` ([professional-practice-professionalism.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/professional-practice-professionalism.ts))
- [x] **14.2 Group Dynamics and Psychology** — `professional-practice-psychology` ([professional-practice-psychology.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/professional-practice-psychology.ts))
- [x] **14.3 Communication Skills** — `professional-practice-communication` ([professional-practice-communication.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/professional-practice-communication.ts))

### Chapter 15: Software Engineering Economics (100% Complete)
- [x] **15.1 Software Engineering Economics Fundamentals** — `economics-fundamentals` ([economics-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-fundamentals.ts))
- [x] **15.2 The Engineering Decision-Making Process** — `economics-decision-making` ([economics-decision-making.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-decision-making.ts))
- [x] **15.3 For-Profit Decision-Making** — `economics-for-profit` ([economics-for-profit.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-for-profit.ts))
- [x] **15.4 Nonprofit Decision-Making** — `economics-nonprofit` ([economics-nonprofit.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-nonprofit.ts))
- [x] **15.5 Present Economy Decision-Making** — `economics-present-economy` ([economics-present-economy.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-present-economy.ts))
- [x] **15.6 Multiple-Attribute Decision-Making** — `economics-multiple-attribute` ([economics-multiple-attribute.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-multiple-attribute.ts))
- [x] **15.7 Identifying and Characterizing Intangible Assets** — `economics-intangible-assets` ([economics-intangible-assets.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-intangible-assets.ts))
- [x] **15.8 Estimation** — `economics-estimation` ([economics-estimation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-estimation.ts))
- [x] **15.9 Practical Considerations** — `economics-practical-considerations` ([economics-practical-considerations.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/economics-practical-considerations.ts))

### Chapter 16: Computing Foundations (100% Complete)
- [x] **16.1 Basic Concepts of a System or Solution** — `computing-foundations-basic-concepts` ([computing-foundations-basic-concepts.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-basic-concepts.ts))
- [x] **16.2 Computer Architecture and Organization** — `computing-foundations-architecture` ([computing-foundations-architecture.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-architecture.ts))
- [x] **16.3 Data Structures and Algorithms** — `computing-foundations-data-structures-algorithms` ([computing-foundations-data-structures-algorithms.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-data-structures-algorithms.ts))
- [x] **16.4 Programming Fundamentals and Languages** — `computing-foundations-programming-fundamentals` ([computing-foundations-programming-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-programming-fundamentals.ts))
- [x] **16.5 Operating Systems** — `computing-foundations-operating-systems` ([computing-foundations-operating-systems.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-operating-systems.ts))
- [x] **16.6 Database Management** — `computing-foundations-database-management` ([computing-foundations-database-management.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-database-management.ts))
- [x] **16.7 Computer Networks and Communications** — `computing-foundations-networks` ([computing-foundations-networks.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-networks.ts))
- [x] **16.8 User and Developer Human Factors** — `computing-foundations-human-factors` ([computing-foundations-human-factors.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-human-factors.ts))
- [x] **16.9 Artificial Intelligence and Machine Learning** — `computing-foundations-ai-ml` ([computing-foundations-ai-ml.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/computing-foundations-ai-ml.ts))

### Chapter 17: Mathematical Foundations (100% Complete)
- [x] **17.1 Mathematical Foundations Fundamentals** — `mathematical-foundations-fundamentals` ([mathematical-foundations-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-fundamentals.ts))
- [x] **17.2 Proof Techniques** — `mathematical-foundations-proof-techniques` ([mathematical-foundations-proof-techniques.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-proof-techniques.ts))
- [x] **17.3 Set, Relation, Function** — `mathematical-foundations-sets-relations-functions` ([mathematical-foundations-sets-relations-functions.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-sets-relations-functions.ts))
- [x] **17.4 Graph and Tree** — `mathematical-foundations-graphs-trees` ([mathematical-foundations-graphs-trees.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-graphs-trees.ts))
- [x] **17.5 Finite-State Machine** — `mathematical-foundations-finite-state-machines` ([mathematical-foundations-finite-state-machines.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-finite-state-machines.ts))
- [x] **17.6 Grammar** — `mathematical-foundations-grammars` ([mathematical-foundations-grammars.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-grammars.ts))
- [x] **17.7 Number Theory** — `mathematical-foundations-number-theory` ([mathematical-foundations-number-theory.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-number-theory.ts))
- [x] **17.8 Basics of Counting** — `mathematical-foundations-basics-of-counting` ([mathematical-foundations-basics-of-counting.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-basics-of-counting.ts))
- [x] **17.9 Discrete Probability** — `mathematical-foundations-discrete-probability` ([mathematical-foundations-discrete-probability.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/mathematical-foundations-discrete-probability.ts))

### Chapter 18: Engineering Foundations (100% Complete)
- [x] **18.1 Engineering Foundations Fundamentals** — `engineering-foundations-fundamentals` ([engineering-foundations-fundamentals.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-fundamentals.ts))
- [x] **18.2 Engineering Design** — `engineering-foundations-design` ([engineering-foundations-design.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-design.ts))
- [x] **18.3 Abstraction and Encapsulation** — `engineering-foundations-abstraction-encapsulation` ([engineering-foundations-abstraction-encapsulation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-abstraction-encapsulation.ts))
- [x] **18.4 Empirical Methods and Experimental Techniques** — `engineering-foundations-empirical-methods` ([engineering-foundations-empirical-methods.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-empirical-methods.ts))
- [x] **18.5 Statistical Analysis** — `engineering-foundations-statistical-analysis` ([engineering-foundations-statistical-analysis.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-statistical-analysis.ts))
- [x] **18.6 Modeling, Simulation, and Prototyping** — `engineering-foundations-modeling-simulation` ([engineering-foundations-modeling-simulation.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-modeling-simulation.ts))
- [x] **18.7 Measurement** — `engineering-foundations-measurement` ([engineering-foundations-measurement.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-measurement.ts))
- [x] **18.8 Standards** — `engineering-foundations-standards` ([engineering-foundations-standards.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-standards.ts))
- [x] **18.9 Root Cause Analysis** — `engineering-foundations-root-cause-analysis` ([engineering-foundations-root-cause-analysis.ts](file:///C:/Users/glove/projects/ethang-monorepo/packages/agents-build/src/content/rules/engineering-foundations-root-cause-analysis.ts))
