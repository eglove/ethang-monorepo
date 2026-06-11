---
name: swebok
description: SWEBOK v4 chapter index and router. Read the matching chapter resource before requirements, design, testing, or maintenance work. Maximum 3 chapters per task.
---

# SWEBOK v4 — Chapter Index

**How to use:** Identify the relevant chapters (maximum 3 per task), then Read the matching `resources/chNN-*.md` file next to this SKILL.md. Read the file directly — do not attempt to invoke it as a skill. Loading more than 3 chapters per task wastes context; pick the chapters closest to your current work.

| Ch | Title | Resource path | Trigger keywords | Related skill |
|---|---|---|---|---|
| Ch 01 | Software Requirements | `resources/ch01-requirements.md` | requirement, elicitation, acceptance-criteria, ATDD, BDD, stakeholder, traceability, change-control | — |
| Ch 02 | Software Architecture | `resources/ch02-architecture.md` | architecture, ASR, ATAM, coupling, Conway, viewpoint, architectural-debt, microservices | — |
| Ch 03 | Software Design | `resources/ch03-design.md` | SOLID, design-pattern, cohesion, DDD, encapsulation, SoC, ADR, refactor | ddd-strategic |
| Ch 04 | Software Construction | `resources/ch04-construction.md` | TDD, assertion, exception-handling, API, dependency, CI, cyclomatic-complexity, defensive-programming | — |
| Ch 05 | Software Testing | `resources/ch05-testing.md` | test, coverage, mock, regression, mutation, equivalence-partitioning, boundary-value, shift-left | — |
| Ch 06 | Software Engineering Operations | `resources/ch06-operations.md` | DevOps, deployment, canary, blue-green, IaC, incident, rollback, monitoring | — |
| Ch 07 | Software Maintenance | `resources/ch07-maintenance.md` | maintenance, technical-debt, refactoring, Lehman, impact-analysis, reengineering, corrective, perfective | — |
| Ch 08 | Software Configuration Management | `resources/ch08-configuration.md` | SCM, baseline, SBOM, branching, change-request, CCB, release, configuration-audit | — |
| Ch 09 | Software Engineering Management | `resources/ch09-management.md` | estimation, risk-register, RACI, DevSecOps, variance-analysis, planning, retrospective | — |
| Ch 10 | Software Engineering Process | `resources/ch10-process.md` | SDLC, Agile, PDCA, GQM, CMMI, Scrum, life-cycle, process-improvement | — |
| Ch 11 | Software Engineering Models and Methods | `resources/ch11-models.md` | model, precondition, postcondition, invariant, state-machine, UML, traceability, formal-method | — |
| Ch 12 | Software Quality | `resources/ch12-quality.md` | quality, defect, V&V, SQA, ISO-25010, CoSQ, RCA, peer-review, integrity-level, audit | — |
| Ch 13 | Software Security | `resources/ch13-security.md` | security, auth, token, XSS, injection, CVE, OWASP, PII | — |
| Ch 14 | Software Engineering Professional Practice | `resources/ch14-professional.md` | ethics, GDPR, CCPA, dark-pattern, privacy, liability, IP, code-of-ethics | — |
| Ch 15 | Software Engineering Economics | `resources/ch15-economics.md` | TCO, sunk-cost, ROI, build-vs-buy, estimation, MARR, trade-off, NPV | — |
| Ch 16 | Computing Foundations | `resources/ch16-computing.md` | Big-O, data-structure, normalization, ACID, OOP, algorithm, SQL, complexity | — |
| Ch 17 | Mathematical Foundations | `resources/ch17-math.md` | FSM, logic, floating-point, set-theory, graph, grammar, probability, overflow | — |
| Ch 18 | Engineering Foundations | `resources/ch18-engineering.md` | RCA, 5-whys, fishbone, measurement, GQM, statistics, wicked-problem, FTA | — |

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

