import { defineRule } from "../../define.ts";

export const swebok = defineRule({
  content: `# SWEBOK v4 — Chapter Index

**How to use:** Identify the relevant chapters (maximum 3 per task), then Read the matching \`swebok-chNN-*.md\` file next to this rule. Read the file directly — do not attempt to invoke it as a skill. Loading more than 3 chapters per task wastes context; pick the chapters closest to your current work.

| Ch | Title | Rule filename | Trigger keywords | Related rules |
|---|---|---|---|---|
| Ch 01 | Software Requirements | \`swebok-ch01-requirements.md\` | requirement, elicitation, acceptance-criteria, ATDD, BDD, stakeholder, traceability, change-control | — |
| Ch 02 | Software Architecture | \`swebok-ch02-architecture.md\` | architecture, ASR, ATAM, coupling, Conway, viewpoint, architectural-debt, microservices | review-design-checklist |
| Ch 03 | Software Design | \`swebok-ch03-design.md\` | design, DDD, cohesion, information-hiding, UML, pattern, refactoring, interface | ddd-strategic, ddd-tactical, review-design-checklist |
| Ch 04 | Software Construction | \`swebok-ch04-construction.md\` | construction, coding, debugging, integration, TDD, unit-test, minimization, standards | tdd-principles, tdd-test-as-documentation |
| Ch 05 | Software Testing | \`swebok-ch05-testing.md\` | testing, test-case, boundary-value, mutation, coverage, stub, mock, regression | tdd-principles, tdd-state-coverage |
| Ch 06 | Software Operations | \`swebok-ch06-operations.md\` | operations, deployment, release, devops, infrastructure, monitoring, reliability, rollback | — |
| Ch 07 | Software Maintenance | \`swebok-ch07-maintenance.md\` | maintenance, post-delivery, evolution, refactoring, reverse-engineering, re-engineering, migration, retirement | — |
| Ch 08 | Software Configuration Management | \`swebok-ch08-configuration.md\` | configuration, version-control, branching, merging, build, baseline, repository, audit | — |
| Ch 09 | Software Engineering Management | \`swebok-ch09-management.md\` | management, project-plan, estimation, schedule, effort, risk, metrics, quality-plan | — |
| Ch 10 | Software Engineering Process | \`swebok-ch10-process.md\` | process, lifecycle, agile, devops, maturity, CMMI, measurement, improvement | — |
| Ch 11 | Software Engineering Models and Methods | \`swebok-ch11-models.md\` | model, notation, formal-methods, state-machine, data-flow, proof, specification, analysis | tdd-state-coverage |
| Ch 12 | Software Quality | \`swebok-ch12-quality.md\` | quality, QA, audit, inspection, RCA, metric, standards, CoSQ | review-design-checklist, rca-five-whys |
| Ch 13 | Software Security | \`swebok-ch13-security.md\` | security, auth, token, XSS, injection, CVE, OWASP, PII | review-security-checklist |
| Ch 14 | Software Engineering Professional Practice | \`swebok-ch14-professional.md\` | professional, ethics, conduct, standards, licensing, intellectual-property, contracts, safety | — |
| Ch 15 | Software Engineering Economics | \`swebok-ch15-economics.md\` | economics, cost-benefit, lifecycle-cost, value, estimation, ROI, depreciation, decisions | — |
| Ch 16 | Computing Foundations | \`swebok-ch16-computing.md\` | computing, algorithms, data-structures, OS, concurrency, network, database, security | review-design-checklist |
| Ch 17 | Mathematical Foundations | \`swebok-ch17-math.md\` | math, logic, sets, relations, graphs, probability, statistics, proofs | tdd-state-coverage |
| Ch 18 | Engineering Foundations | \`swebok-ch18-engineering.md\` | engineering, empirical, experiment, hypothesis, measurement, root-cause, scientific-method, metrics | rca-five-whys |

## Cross-Cutting Vocabulary

Terms used across multiple chapters:

| Term | Definition |
|---|---|
| **Error** | A human action that produces an incorrect result |
| **Defect / Fault** | An imperfection in a work product (a manifestation of an error) |
| **Failure** | An event where a system deviates from expected behavior (a defect manifesting at runtime) |
| **Technical debt** | Accumulated shortcuts that increase future maintenance cost; must be tracked and paid down |
| **ATDD** | Acceptance Test-Driven Development — test cases ARE requirements; no production code until at least one test fails |
| **V&V** | Verification ("built it right") + Validation ("built the right thing") |
| **CoSQ** | Cost of Software Quality: Prevention + Appraisal (conformance) + Internal/External failure (nonconformance) |
| **ASR** | Architecturally Significant Requirement — any requirement that influences architecture |
| **CIA triad** | Confidentiality, Integrity, Availability — the three pillars of information security |
| **GQM** | Goal-Question-Metric — every metric must support a decision |
| **CMMI** | Capability Maturity Model Integration — process improvement framework |
| **SQA** | Software Quality Assurance — process assurance + product assurance |
`,
  description:
    "software engineering vocabulary, cross-cutting terms, SWEBOK, or software engineering standards",
  filename: "swebok",
  trigger: "model_decision"
});
