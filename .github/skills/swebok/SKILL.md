---
description: Access SWEBOK v4 reference chapters for software engineering guidelines.
name: swebok
---

# SWEBOK v4 Reference

Reference guide to the IEEE Software Engineering Body of Knowledge (SWEBOK v4). Locate and inspect software engineering guidelines, domain theories, conceptual foundations, and compliance checklists for each chapter.

## Quick Decision Trees

### "I am in the design and planning phase"

```
Which design/planning task?
├─ Discovering/defining requirements → requirements-fundamentals.md
│  ├─ Eliciting stakeholder needs → requirements-elicitation.md
│  ├─ Modeling and negotiating → requirements-analysis.md
│  ├─ Documenting formal specs → requirements-specification.md
│  ├─ Validating requirements → requirements-validation.md
│  └─ Managing scope and tracing → requirements-management-activities.md
├─ Designing system architecture → architecture-fundamentals.md
│  ├─ Describing architecture views → architecture-description.md
│  ├─ Designing process/workflow → architecture-process.md
│  └─ Evaluating architectural choices → architecture-evaluation.md
└─ Designing detailed components → design-fundamentals.md
   ├─ Reusing patterns and strategies → design-strategies-methods.md
   ├─ Analyzing and evaluating designs → design-quality-analysis-evaluation.md
   └─ Documenting design choices (SDDs) → design-recording.md
```

### "I am in the implementation and build phase"

```
Which implementation task?
├─ Coding and construction processes → construction-fundamentals.md
│  ├─ Managing construction builds → construction-management.md
│  ├─ Selecting languages & tools → construction-tools.md
│  └─ Reusing platform tech → construction-technologies.md
├─ Reusing engineering methods → models-methods-modeling.md
│  ├─ Applying modeling formalisms → models-methods-types.md
│  └─ Executing structured methods → models-methods-methods.md
└─ Analyzing and improving process → engineering-process-fundamentals.md
   ├─ Defining life cycle models → engineering-process-lifecycles.md
   └─ Assessing process quality → engineering-process-assessment-improvement.md
```

### "I am verifying and testing the codebase"

```
Which verification task?
├─ Writing unit/integration tests → testing-fundamentals.md
│  ├─ Selecting test levels → testing-levels.md
│  ├─ Applying test techniques → testing-techniques.md
│  ├─ Setting completion metrics → testing-measures.md
│  └─ Managing the test process → testing-process.md
└─ Quality Assurance (SQA) → quality-fundamentals.md
   ├─ Managing quality process → quality-management-process.md
   └─ Conducting audits/reviews → quality-assurance-process.md
```

### "I am managing releases, config, and operations"

```
Which operations task?
├─ Managing repository baselines → configuration-management-process.md
│  ├─ Identifying configuration items → configuration-identification.md
│  ├─ Managing change requests → configuration-change-control.md
│  ├─ Tracking accounting logs → configuration-status-accounting.md
│  ├─ Conducting release audits → configuration-auditing.md
│  └─ Packaging release binaries → configuration-release-management.md
├─ Operating live systems → engineering-operations-fundamentals.md
│  ├─ Planning service operations → engineering-operations-planning.md
│  ├─ Delivering and monitoring services → engineering-operations-delivery.md
│  └─ Utilizing operational tools → engineering-operations-tools.md
└─ Project management and scope → engineering-management-initiation-scope.md
   ├─ Planning cost/schedule → engineering-management-planning.md
   ├─ Executing project plans → engineering-management-execution.md
   ├─ Evaluating project status → engineering-management-review-evaluation.md
   ├─ Measuring project metrics → engineering-management-measurement.md
   └─ Project closure procedures → engineering-management-closure.md
```

### "I need foundational engineering theories"

```
Which foundation?
├─ Engineering & problem solving → engineering-foundations-fundamentals.md
│  ├─ system design concepts → engineering-foundations-design.md
│  ├─ Abstraction/encapsulation → engineering-foundations-abstraction-encapsulation.md
│  ├─ Empirical & stats analysis → engineering-foundations-empirical-methods.md
│  └─ Standards and root cause → engineering-foundations-standards.md
├─ Computing & DB foundations → computing-foundations-basic-concepts.md
│  ├─ OS & network architecture → computing-foundations-operating-systems.md
│  ├─ Data structures & algorithms → computing-foundations-data-structures-algorithms.md
│  └─ AI & Machine Learning → computing-foundations-ai-ml.md
└─ Mathematical foundations → mathematical-foundations-fundamentals.md
   ├─ Logic and proof techniques → mathematical-foundations-proof-techniques.md
   ├─ Graph and tree structures → mathematical-foundations-graphs-trees.md
   ├─ Finite-state machine modeling → mathematical-foundations-finite-state-machines.md
   └─ Discrete probability/counting → mathematical-foundations-discrete-probability.md
```

## SWEBOK Knowledge Area Index

### Chapter 1: Software Requirements

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 1.1 Software Requirements Fundamentals | [requirements-fundamentals.md](resources/requirements-fundamentals.md) | requirements validation, planning, design discussions, plan mode, grill-me, or figuring out what needs to be done before implementing |
| 1.2 Requirements Elicitation | [requirements-elicitation.md](resources/requirements-elicitation.md) | active discovery, ubiquitous language, stakeholder clarification, user story mapping, mockups, Given-When-Then scenarios, planning, plan mode, grill-me, or defining terminology and business rules before implementing |
| 1.3 Requirements Analysis | [requirements-analysis.md](resources/requirements-analysis.md) | requirements analysis, quality of service economics, conflict resolution, formal analysis, planning, plan mode, grill-me, or defining terminology and business rules before implementing |
| 1.4 Requirements Specification | [requirements-specification.md](resources/requirements-specification.md) | requirements specification, natural language, actor-action, BDD scenarios, UML modeling, planning, plan mode, grill-me, or defining terminology and business rules before implementing |
| 1.5 Requirements Validation | [requirements-validation.md](resources/requirements-validation.md) | requirements validation, reviews, simulations, prototyping, planning, plan mode, grill-me, or defining terminology and business rules before implementing |
| 1.6 Requirements Management Activities | [requirements-management-activities.md](resources/requirements-management-activities.md) | requirements management, change control, prioritization, traceability, process management, planning, plan mode, grill-me, or defining terminology and business rules before implementing |
| 1.7 Practical Considerations | [requirements-practical-considerations.md](resources/requirements-practical-considerations.md) | requirements practical considerations, prioritization, tracing, stability, measurement, process improvement, planning, plan mode, grill-me, or defining terminology and business rules before implementing |
| 1.8 Software Requirements Tools | [requirements-tools.md](resources/requirements-tools.md) | requirements management tools, modeling tools, test case generation, planning, plan mode, grill-me, or defining terminology and business rules before implementing |

### Chapter 2: Software Architecture

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 2.1 Software Architecture Fundamentals | [architecture-fundamentals.md](resources/architecture-fundamentals.md) | software architecture fundamentals, system design, architectural patterns, stakeholders and concerns, uses of architecture, get_architecture, codebase graph, SARA CLI, sara, planning, plan mode, grill-me, or defining architectural boundaries and significant decisions before construction |
| 2.2 Software Architecture Description | [architecture-description.md](resources/architecture-description.md) | software architecture description, views and viewpoints, 4+1 model, architecture patterns, styles, reference architectures, ADL, architecture frameworks, TOGAF, UML, C4 model, ADRs, significant decisions, planning, plan mode, grill-me, or documenting system structure and design choices before construction |
| 2.3 Software Architecture Process | [architecture-process.md](resources/architecture-process.md) | software architecture process, architectural synthesis, architectural evaluation, architectural tactics, ATAM, quality attributes, design trade-offs, architecture design, ASRs, planning, plan mode, grill-me, or defining architectural structures and evaluating design options before implementation |
| 2.4 Software Architecture Evaluation | [architecture-evaluation.md](resources/architecture-evaluation.md) | software architecture evaluation, goodness in architecture, reasoning about architectures, architecture reviews, architecture metrics, active reviews, ATAM, SAAM, QAW, SARA report, Vitruvian triad, Pareto optimality, component dependency, cyclicity, coupling and cohesion, DevOps metrics, lead time, deployment frequency, MTTR, change failure rate, planning, plan mode, grill-me, or evaluating and auditing design documents, structural health, and quality attributes using the antigravity cli |

### Chapter 3: Software Design

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 3.1 Software Design Fundamentals | [design-fundamentals.md](resources/design-fundamentals.md) | software design fundamentals, design thinking, design principles, abstraction, separation of concerns, modularization, encapsulation, interface and implementation, uniformity, ethically aligned design, planning, plan mode, grill-me, or designing software components, structuring codebases, and establishing modular interfaces before construction using the antigravity cli |
| 3.2 Software Design Processes | [design-processes.md](resources/design-processes.md) | software design processes, high-level design, detailed design, architectural design, outward-facing design, inward-facing design, external events, end-to-end transactions, algorithms, data structures, planning, plan mode, grill-me, or decomposing software systems, defining component interfaces, mapping transaction threads, and transitioning from high-level to detailed implementation using the antigravity cli |
| 3.3 Software Design Qualities | [design-qualities.md](resources/design-qualities.md) | software design qualities, concurrency, control flow, event handling, data persistence, component distribution, error handling, exception propagation, fault tolerance, integration, interoperability, security, safety, variability, feature flags, planning, plan mode, grill-me, or defining and auditing design characteristics using the antigravity cli |
| 3.4 Recording Software Designs | [design-recording.md](resources/design-recording.md) | recording software designs, design descriptions, design specifications, model-based design, structural design, behavioral design, class diagrams, component diagrams, CRC cards, deployment diagrams, entity-relationship diagrams, interface description languages, IDL, sequence diagrams, activity diagrams, statecharts, flowcharts, data flow diagrams, design patterns, creational structural behavioral patterns, domain-specific languages, DSL, design rationale, design decisions, architectural blueprints, planning, plan mode, grill-me, or documenting software designs and specifications using the antigravity cli |
| 3.5 Software Design Strategies and Methods | [design-strategies-methods.md](resources/design-strategies-methods.md) | software design strategies and methods, design strategies, structured design, function-oriented design, data-centered design, object-oriented design, OOD, SOLID principles, SOFA principles, user-centered design, component-based design, CBD, event-driven design, pub-sub, message brokers, aspect-oriented design, constraint-based design, domain-driven design, DDD, ubiquitous language, service-oriented architecture, SOA, web services, planning, plan mode, grill-me, or selecting and applying design methods using the antigravity cli |
| 3.6 Software Design Quality Analysis and Evaluation | [design-quality-analysis-evaluation.md](resources/design-quality-analysis-evaluation.md) | software design quality analysis and evaluation, design quality, design reviews, audits, checklists, quality attributes, static analysis, formal design analysis, simulation, prototyping, design metrics, function-based measures, object-oriented measures, verification, validation, certification, SDD sufficiency, planning, plan mode, grill-me, or evaluating and auditing design specifications using the antigravity cli |

### Chapter 4: Software Construction

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 4.1 Software Construction Fundamentals | [construction-fundamentals.md](resources/construction-fundamentals.md) | software construction, coding, implementation, writing code, refactoring, source code, debugging, compiling, unit testing, complexity minimization, cyclomatic complexity, code standards, code reuse, dependency management, or implementing software components using the antigravity cli |
| 4.2 Managing Construction | [construction-management.md](resources/construction-management.md) | managing construction, construction planning, construction measurement, dependency management, package managers, dependency supply chain, license compliance, integration strategies, code churn, code metrics, project lifecycle, agile development, continuous delivery, planning, plan mode, grill-me, or managing dependencies and planning integration using the antigravity cli |
| 4.3 Practical Considerations | [construction-practical-considerations.md](resources/construction-practical-considerations.md) | software construction practical considerations, construction design, construction languages, coding, construction testing, reuse in construction, construction quality, integration, cross-platform development, and migration |
| 4.4 Construction Technologies | [construction-technologies.md](resources/construction-technologies.md) | software construction technologies, API design, polymorphism, reflection, generics, assertions, error and exception handling, fault tolerance, executable models, state-based, table-driven, late binding, internationalization, grammar parsing, concurrency primitives, middleware, distributed systems, cloud microservices, heterogeneous systems, performance tuning, platform standards, test-first programming, and feedback loops |
| 4.5 Software Construction Tools | [construction-tools.md](resources/construction-tools.md) | software construction tools, development environments, integrated development environments, IDEs, compiler integration, refactoring engines, program debuggers, cloud-based IDEs, AI-assisted programming, visual programming, GUI builders, event-handling assistants, low-code, zero-code, model-driven, unit testing tools, mock, stub, assertion libraries, test runners, profiling, performance analysis, program slicing, static slicing, dynamic slicing |

### Chapter 5: Software Testing

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 5.1 Software Testing Fundamentals | [testing-fundamentals.md](resources/testing-fundamentals.md) | software testing fundamentals, faults vs failures, test case creation, test selection, adequacy criteria, prioritization, minimization, oracle problem, Dijkstra aphorism, infeasible paths, testability, execution automation, scalability, controllability, replication, generalization, offline vs online testing |
| 5.2 Test Levels | [testing-levels.md](resources/testing-levels.md) | software testing levels, test targets, unit testing, integration testing, system testing, acceptance testing, conformance testing, compliance testing, installation testing, alpha and beta testing, regression testing, test prioritization, non-functional testing, performance testing, load testing, stress testing, volume testing, failover testing, reliability testing, compatibility testing, scalability testing, elasticity testing, infrastructure testing, back-to-back testing, recovery testing, security testing, privacy testing, interface testing, configuration testing, usability testing |
| 5.3 Test Techniques | [testing-techniques.md](resources/testing-techniques.md) | software testing techniques, black-box testing, white-box testing, glass-box testing, equivalence partitioning, boundary value analysis, robustness testing, syntax testing, combinatorial testing, decision tables, cause-effect graphing, state transition testing, scenario-based testing, random testing, fuzz testing, evidence-based software engineering, forcing exceptions, control flow testing, statement coverage, branch coverage, MC/DC, path testing, data flow testing, DU paths, error guessing, exploratory testing, ad hoc testing, monkey testing, smoke testing, mutation testing, metamorphic testing, usability inspection |
| 5.4 Test-Related Measures | [testing-measures.md](resources/testing-measures.md) | software testing measures, SUT evaluation, key performance indicators, fault classification, fault density, fault depth, fault multiplicity, reliability growth models, Goel-Okumoto, failure-count, time-between-failures, coverage measures, statement coverage, branch coverage, path coverage, MC/DC, fault injection, compile-time and runtime fault injection, mutation testing, mutation score, equivalent mutants, relative effectiveness |
| 5.5 Test Process | [testing-process.md](resources/testing-process.md) | software testing process, test planning, dynamic test process, test documentation, test team, test completion, test reusability, test environment, test incident reporting, staffing, training |
| 5.6 Software Testing in the Development Processes and the Application Domains | [testing-development-processes.md](resources/testing-development-processes.md) | software testing inside development processes and application domains, traditional development testing, SPI, TMMi, Unified Process, shift-left testing, Agile testing, Test-Driven Development, DevOps continuous regression, automotive testing, IoT testing, mobile testing, avionics testing, healthcare testing, embedded testing, GUI testing, gaming testing, real-time testing, SOA testing, finance testing |
| 5.7 Testing of and Testing Through Emerging Technologies | [testing-emerging-technologies.md](resources/testing-emerging-technologies.md) | software testing of and through emerging technologies, AI testing, machine learning testing, blockchain testing, cloud testing, concurrent testing, distributed systems testing, testing through ML, testing through blockchain, testing through cloud, simulation testing, HIL simulation, crowdtesting |
| 5.8 Software Testing Tools | [testing-tools.md](resources/testing-tools.md) | software testing tools, test harnesses, stubs and drivers, test generators, capture and replay tools, assertion checking, coverage analyzers, tracers, regression testing tools, reliability evaluation tools, injection-based tools, security testing tools, web application testing, mobile testing, CSS validators, API testing |

### Chapter 6: Software Engineering Operations

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 6.1 Software Engineering Operations Fundamentals | [engineering-operations-fundamentals.md](resources/engineering-operations-fundamentals.md) | software engineering operations, operations processes, prepare, perform, manage results, support customer, software installation, scripting, directory/registry config, verification, scripting/automation, repetitive tasks, testing, troubleshooting, diagnostics, canary testing, dark launches, performance, reliability, load balancing |
| 6.2 Software Engineering Operations Planning | [engineering-operations-planning.md](resources/engineering-operations-planning.md) | engineering operations planning, conops, software availability, disaster recovery, capacity management, supplier management, environments synchronization, slas, slis, slos, devsecops |
| 6.3 Software Engineering Operations Delivery | [engineering-operations-delivery.md](resources/engineering-operations-delivery.md) | SWEBOK v4 Section 6.3: Software Engineering Operations Delivery, covering operational testing, deployment, release engineering, rollback, data migration, change management, and problem management. |
| 6.4 Software Engineering Operations Control | [engineering-operations-control.md](resources/engineering-operations-control.md) | Conceptual guide and compliance checklist for software engineering operations control, including incident management, monitoring, service reporting, and SLAs according to SWEBOK v4 Section 6.4. |
| 6.5 Practical Considerations | [engineering-operations-practical-considerations.md](resources/engineering-operations-practical-considerations.md) | Practical considerations for software engineering operations: incident prevention, risk management, automation, and ISO/IEC 29110. |
| 6.6 Software Engineering Operations Tools | [engineering-operations-tools.md](resources/engineering-operations-tools.md) | container orchestrators, virtualization, deployment standardization, scalability, continuous integration, continuous delivery, CI/CD, descriptor files, automated testing, monitoring, telemetry, application logs, OS execution traces, CPU memory resource utilization, visualization dashboards |

### Chapter 7: Software Maintenance

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 7.1 Software Maintenance Fundamentals | [maintenance-fundamentals.md](resources/maintenance-fundamentals.md) | software maintenance fundamentals, definitions, terminology, nature of maintenance, need for maintenance, majority of maintenance costs, evolution of software, lehman laws, categories of maintenance, corrective, adaptive, perfective, preventive |
| 7.2 Key Issues in Software Maintenance | [maintenance-key-issues.md](resources/maintenance-key-issues.md) | key issues in software maintenance, technical issues, limited understanding, testing modified code, impact analysis, management issues, organizational alignment, staffing, motivation, process maturity, supplier management, costs, technical debt, cocomo ii, cost estimation |
| 7.3 Software Maintenance Processes | [maintenance-processes.md](resources/maintenance-processes.md) | software maintenance processes, standards, iso iec ieee 14764, transition, modification request, problem report, validation, acceptance, rejection, help desk, planning activities, configuration management, software quality, sqa, audits, reviews |
| 7.4 Software Maintenance Techniques | [maintenance-techniques.md](resources/maintenance-techniques.md) | software maintenance techniques, program comprehension, cognitive models, top-down, bottom-up, reengineering, refactoring, reverse engineering, static slicing, dynamic slicing, continuous integration, delivery, deployment, testing, visualization |
| 7.5 Software Maintenance Tools | [maintenance-tools.md](resources/maintenance-tools.md) | software maintenance tools, program comprehension tools, reengineering, refactoring engines, reverse engineering, decompilers, change control, configuration management, testing, regression test runners, coverage analyzers |

### Chapter 8: Software Configuration Management

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 8.1 Management of the SCM Process | [configuration-management-process.md](resources/configuration-management-process.md) | SCM process management including planning, tool selection, interface control, and monitoring |
| 8.2 Software Configuration Identification | [configuration-identification.md](resources/configuration-identification.md) | software configuration identification, controlled items, and baselines |
| 8.3 Software Configuration Change Control | [configuration-change-control.md](resources/configuration-change-control.md) | configuration change control, change board authority, and deviations or waivers |
| 8.4 Software Configuration Status Accounting | [configuration-status-accounting.md](resources/configuration-status-accounting.md) | configuration status accounting, SCSA, reporting, metrics, integrity indicators, baseline status |
| 8.5 Software Configuration Auditing | [configuration-auditing.md](resources/configuration-auditing.md) | software configuration auditing, audit concept, auditor roles, FCA, PCA, in-process audits, continuous reviews, governance, regulatory compliance, quality plans |
| 8.6 Software Release Management and Delivery | [configuration-release-management.md](resources/configuration-release-management.md) | configuration and release management, software building, SBOM, continuous integration and delivery, and SCM tools |

### Chapter 9: Software Engineering Management

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 9.1 Initiation and Scope Definition | [engineering-management-initiation-scope.md](resources/engineering-management-initiation-scope.md) | software project initiation, scope definition, requirements negotiation, feasibility analysis, technological constraints, resource constraints, financial constraints, work breakdown structure (WBS), context diagrams, requirements review and revision, backlog prioritization, forward and backward traceability analysis |
| 9.2 Software Project Planning | [engineering-management-planning.md](resources/engineering-management-planning.md) | software project planning, SDLC model selection, cost/schedule estimation, risk assessment, and plan management |
| 9.3 Software Project Execution | [engineering-management-execution.md](resources/engineering-management-execution.md) | software project execution, plan implementation, process monitoring, and acquisition management |
| 9.4 Software Review and Evaluation | [engineering-management-review-evaluation.md](resources/engineering-management-review-evaluation.md) | software review and evaluation, requirements satisfaction, stakeholder satisfaction, milestone evaluations, iterative cycle retrospectives, reviewing performance, personnel reviews, team dynamics, tools and methods evaluation, process assessment |
| 9.5 Closure | [engineering-management-closure.md](resources/engineering-management-closure.md) | software project closure, engineering management, success criteria, stakeholder acceptance, archival methods, sensitive data destruction, retrospective analysis, lessons learned, organizational learning |
| 9.6 Software Engineering Measurement | [engineering-management-measurement.md](resources/engineering-management-measurement.md) | software engineering measurement, ISO/IEC/IEEE 15939, PSM framework, establishing commitment, planning measurement process, performing measurement, evaluating measurement, SEM tools, project planning, tracking, risk management, Monte Carlo simulation, communication tools, measurement tools |

### Chapter 10: Software Engineering Process

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 10.1 Software Engineering Process Fundamentals | [engineering-process-fundamentals.md](resources/engineering-process-fundamentals.md) | software engineering process fundamentals, introduction, definitions, activities, tasks, controls, enabling mechanisms |
| 10.2 Life Cycles | [engineering-process-lifecycles.md](resources/engineering-process-lifecycles.md) | software engineering process life cycles, life cycle definition, process categories, process models, paradigms, engineering dimension, management stages, adaptation, infrastructure, tools, monitoring |
| 10.3 Software Process Assessment and Improvement | [engineering-process-assessment-improvement.md](resources/engineering-process-assessment-improvement.md) | software process assessment and improvement, Deming PDCA, Goal-Question-Metric GQM, framework-based methods, CMMI, SPICE ISO 33000, Agile retrospectives, postmortem reviews |

### Chapter 11: Software Engineering Models and Methods

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 11.1 Modeling | [models-methods-modeling.md](resources/models-methods-modeling.md) | software design models, structural, behavioral, temporal, modeling principles, abstraction, syntax, semantics, pragmatics, metamodels, preconditions, postconditions, invariants |
| 11.2 Types of Models | [models-methods-types.md](resources/models-methods-types.md) | software design, structural modeling, class, component, object, deployment, packaging, information modeling, conceptual, logical, physical data models, behavioral modeling, state machines, control-flow, data-flow, SysML requirements, parametric models |
| 11.3 Analysis of Models | [models-methods-analysis.md](resources/models-methods-analysis.md) | software design quality analysis, completeness, consistency, correctness, syntactic, semantic, traceability, change impact analysis, interaction, dynamic behavior, simulation |
| 11.4 Software Engineering Methods | [models-methods-methods.md](resources/models-methods-methods.md) | software design methods, structured, data modeling, object-oriented, aspect-oriented, model-driven development, MDD, model-based design, MBD, formal methods, specification languages, program refinement, formal verification, model checking, logical inference, lightweight formal, Alloy, prototyping, throwing away, evolutionary, agile, XP, Scrum, FDD, Lean, Kanban, DevOps, release engineering |

### Chapter 12: Software Quality

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 12.1 Software Quality Fundamentals | [quality-fundamentals.md](resources/quality-fundamentals.md) | software quality fundamentals, software engineering culture and ethics, codes of ethics and professional conduct, value and costs of quality, cost of software quality, conformance cost, appraisal costs, prevention costs, nonconformance cost, pre-delivery costs, post-delivery costs, standards, models, and certifications, software dependability, safety-critical systems, software availability, reliability, and maintainability, software integrity levels, walk-through review |
| 12.2 Software Quality Management Process | [quality-management-process.md](resources/quality-management-process.md) | software quality management process, quality management system, QMS, software quality improvement, SQI, software process improvement, SPI, plan quality management, QMS policies, evaluate quality management, process capability levels, software quality measurement, error density, defect density, failure rate, corrective and preventive actions, defect characterization, root cause analysis, SQC |
| 12.3 Software Quality Assurance Process | [quality-assurance-process.md](resources/quality-assurance-process.md) | software quality assurance process, SQA, process assurance, product assurance, software quality assurance plan, SQAP, V&V, verification and validation, static analysis, dynamic analysis, formal analysis, quality control, technical reviews, peer reviews, inspections, walkthroughs, audits, system requirements reviews, test readiness reviews, production readiness reviews |
| 12.4 Software Quality Tools | [quality-tools.md](resources/quality-tools.md) | software quality tools, quality tools, checklist, static analysis tools, dynamic analysis tools, FMEA, FMEA tools, failure mode and effects analysis, FTA, fault tree analysis, bug trackers, problem tracking tools, defect injection, static syntax analysis |

### Chapter 13: Software Security

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 13.1 Software Security Fundamentals | [security-fundamentals.md](resources/security-fundamentals.md) | software security fundamentals, software security, information security, confidentiality, integrity, availability, authenticity, accountability, non-repudiation, reliability, cybersecurity, cyber risk, social engineering, malware, spyware, SSE-CMM, systems security engineering capability maturity model |
| 13.2 Security Management and Organization | [security-management-organization.md](resources/security-management-organization.md) | security management and organization, ISMS, ISO/IEC 27001, security governance, compliance, GDPR, CCPA, HIPAA, PCI-DSS, SOC 2, Agile security, enabler vs blocker, incremental risk management, dependency auditing, Security Champions, SBOM |
| 13.3 Software Security Engineering and Processes | [security-engineering-processes.md](resources/security-engineering-processes.md) | software security engineering, secure development life cycle, secure SDLC, Microsoft SDL, OWASP SAMM, BSIMM, DevSecOps, CI/CD automation, Common Criteria, ISO/IEC 15408, target of evaluation, TOE, protection profile, PP, security target, ST, evaluation assurance level, EAL, confidentiality, integrity, availability |
| 13.4 Security Engineering for Software Systems | [security-engineering-systems.md](resources/security-engineering-systems.md) | security requirements, threat modeling, misuse cases, abuse cases, threat actors, security risk assessment, secure design, attack tolerance, access control, cryptography, key management, STRIDE, security patterns, secure coding, privilege separation, CERT top 10 secure coding practices, input validation, least privilege, defense in depth |
| 13.5 Software Security Tools | [security-tools.md](resources/security-tools.md) | software security tools, static analysis, SAST, source code analysis, binary code analysis, dynamic testing, penetration testing, fuzzing, fuzz testing, vulnerability scanner, CVE, Common Vulnerabilities and Exposures, CWE, Common Weakness Enumeration, CAPEC, CVSS, Common Vulnerability Scoring system, vulnerability management, disclosure process |
| 13.6 Domain-Specific Software Security | [security-domain-specific.md](resources/security-domain-specific.md) | domain-specific software security, cloud security, container security, forgotten assets, shared responsibility model, container hardening, IoT security, Internet of Things, endpoint hardening, device-to-device communication, device credibility, IoT platform management, machine learning security, model poisoning, evasion attack, adversarial input, model extraction |

### Chapter 14: Software Engineering Professional Practice

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 14.1 Professionalism | [professional-practice-professionalism.md](resources/professional-practice-professionalism.md) | professional practice, professionalism, accreditation, certification, licensing, code of ethics, standards, employment contracts, legal issues, trade compliance, cybercrime, data privacy, GDPR, CCPA, dark patterns, documentation, trade-off analysis |
| 14.2 Group Dynamics and Psychology | [professional-practice-psychology.md](resources/professional-practice-psychology.md) | group dynamics, psychology, teamwork, goal alignment, intellectual honesty, peer reviews, individual cognition, problem decomposition, pair programming, stakeholders, uncertainty, ambiguity, risk management, diversity, inclusivity, bias reduction |
| 14.3 Communication Skills | [professional-practice-communication.md](resources/professional-practice-communication.md) | communication skills, technical reading, code comprehension, summarization, technical writing, documentation, SRS, SDD, team communication, active listening, presentation skills, technical presentation, user training |

### Chapter 15: Software Engineering Economics

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 15.1 Software Engineering Economics Fundamentals | [economics-fundamentals.md](resources/economics-fundamentals.md) | software engineering economics fundamentals, proposals, cash flow instances, cash flow streams, cash flow diagrams, time value of money, financial equivalence, bases for comparison, present worth, future worth, annual equivalent, internal rate of return, discounted payback period, mutually exclusive alternatives, do nothing alternative, intangible assets, knowledge assets, business models, peter drucker |
| 15.2 The Engineering Decision-Making Process | [economics-decision-making.md](resources/economics-decision-making.md) | software engineering economics, decision making process, 5 whys, design thinking, selection criteria, multi attribute decision making, estimate sensitivity analysis, decision making under risk, decision making under uncertainty, expected value decision making, monte carlo analysis, decision trees, laplace rule, maximin rule, maximax rule, hurwicz rule, minimax regret rule |
| 15.3 For-Profit Decision-Making | [economics-for-profit.md](resources/economics-for-profit.md) | for profit decision making, minimum acceptable rate of return, marr, economic life, frozen assets, minimum cost lifetime, planning horizon, study period, repeatability assumption, replacement decisions, sunk costs, salvage value, defender asset, retirement decisions, technology dependency, lock in factors, inflation, depreciation, corporate income taxes, after tax cash flow analysis |
| 15.4 Nonprofit Decision-Making | [economics-nonprofit.md](resources/economics-nonprofit.md) | software engineering economics, nonprofit decision making, benefit cost analysis, cost effectiveness analysis, benefit cost ratio, fixed cost version, fixed effectiveness version, social discount rate, public sector projects |
| 15.5 Present Economy Decision-Making | [economics-present-economy.md](resources/economics-present-economy.md) | software engineering economics, present economy decision making, break even analysis, optimization analysis, cost functions, space time trade off, resource optimization, cloud providers |
| 15.6 Multiple-Attribute Decision-Making | [economics-multiple-attribute.md](resources/economics-multiple-attribute.md) | software engineering economics, multiple attribute decision making, compensatory techniques, non compensatory techniques, analytic hierarchy process, architectural tradeoff analysis method, Gilbs impact estimation, satisficing, dominance, lexicography |
| 15.7 Identifying and Characterizing Intangible Assets | [economics-intangible-assets.md](resources/economics-intangible-assets.md) | software engineering economics, intangible assets, tacit knowledge, explicit knowledge, SIPAC, generic intangible assets, GIA, quality valuation, impact valuation, Qval, Ival, KAval, business model canvas, multi-attribute decision-making |
| 15.8 Estimation | [economics-estimation.md](resources/economics-estimation.md) | software engineering economics, estimation, uncertainty assessment, Code of Ethics, expert judgment, Wideband Delphi, Planning Poker, analogy estimation, decomposition, bottom-up, parametric estimation, multiple estimates, convergence, divergence |
| 15.9 Practical Considerations | [economics-practical-considerations.md](resources/economics-practical-considerations.md) | software engineering economics, business case, systems thinking, currency analysis, accounting, controlling, costing, opportunity cost, sunk cost, TCO, SPLC, efficiency, effectiveness, productivity, rework, project program portfolio, pricing, prioritization |

### Chapter 16: Computing Foundations

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 16.1 Basic Concepts of a system or Solution | [computing-foundations-basic-concepts.md](resources/computing-foundations-basic-concepts.md) | computing foundations, system concepts, solution architecture, modularity, cohesion, coupling, real-time systems, distributed systems, technology selection, system design |
| 16.2 Computer Architecture and Organization | [computing-foundations-architecture.md](resources/computing-foundations-architecture.md) | computing foundations, computer architecture, computer organization, instruction set architecture, RISC, CISC, Flynn taxonomy, SIMD, MIMD, memory units, ALU, control unit, buses |
| 16.3 Data Structures and Algorithms | [computing-foundations-data-structures-algorithms.md](resources/computing-foundations-data-structures-algorithms.md) | computing foundations, data structures, algorithms, asymptotic notation, Big O, sorting, searching, hashing, trees, graphs, dynamic programming, recursion |
| 16.4 Programming Fundamentals and Languages | [computing-foundations-programming-fundamentals.md](resources/computing-foundations-programming-fundamentals.md) | programming language types, functional programming, procedural programming, OOP, scripting, compilers, interpreters, compilation phases, programming syntax, semantics, type systems, static typing, dynamic typing, subprograms, coroutines, parameter passing, recursion, abstraction, encapsulation, inheritance, polymorphism, distributed programming, parallel programming, debugging, coding standards |
| 16.5 Operating Systems | [computing-foundations-operating-systems.md](resources/computing-foundations-operating-systems.md) | operating systems, processor management, memory management, device management, information management, network management, dual-mode operation, CPU scheduling, deadlocks, virtual memory, paging, thrashing, page replacement, DMA, device drivers, clock synchronization, NTP, logical clocks, Lamport, distributed systems |
| 16.6 Database Management | [computing-foundations-database-management.md](resources/computing-foundations-database-management.md) | database management, schema, relational databases, RDBMS, NoSQL, columnar, key-value, document, graph databases, ACID, BASE, storage models, NAS, SAN, normalization, 3NF, BCNF, SQL, data warehousing, data mining, database backup, database recovery, transactions |
| 16.7 Computer Networks and Communications | [computing-foundations-networks.md](resources/computing-foundations-networks.md) | computer networks, layered architectures, OSI model, TCP/IP, wireless networks, network security, internet protocols, network design |
| 16.8 User and Developer Human Factors | [computing-foundations-human-factors.md](resources/computing-foundations-human-factors.md) | user human factors, developer human factors, human-computer interaction, user experience, clean code, coding standards, usability testing, prototyping |
| 16.9 Artificial Intelligence and Machine Learning | [computing-foundations-ai-ml.md](resources/computing-foundations-ai-ml.md) | artificial intelligence, machine learning, deep learning, reasoning models, learning paradigms, ML models, natural language processing, software engineering for AI |

### Chapter 17: Mathematical Foundations

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 17.1 Mathematical Foundations Fundamentals | [mathematical-foundations-fundamentals.md](resources/mathematical-foundations-fundamentals.md) | mathematical foundations, basic logic, propositional logic, predicate logic, truth tables, boolean variables, quantifiers, tautology, contradiction, logic gates, model_decision, engineering reasoning, formal methods |
| 17.2 Proof Techniques | [mathematical-foundations-proof-techniques.md](resources/mathematical-foundations-proof-techniques.md) | mathematical foundations, proof techniques, direct proof, contradiction, induction, contrapositive, proof by example, theorems, lemmas, corollaries, conjectures, inference rules |
| 17.3 Set, Relation, Function | [mathematical-foundations-sets-relations-functions.md](resources/mathematical-foundations-sets-relations-functions.md) | mathematical foundations, sets, relations, functions, set operations, cartesian product, venn diagrams, power set, bijective, domain, range, vertical line test |
| 17.4 Graph and Tree | [mathematical-foundations-graphs-trees.md](resources/mathematical-foundations-graphs-trees.md) | graph theory, trees, simple graph, multigraph, pseudograph, directed graph, weighted graph, degree, path, cycle, adjacency list, adjacency matrix, incidence matrix, binary tree, binary search tree, preorder, inorder, postorder |
| 17.5 Finite-State Machine | [mathematical-foundations-finite-state-machines.md](resources/mathematical-foundations-finite-state-machines.md) | finite state machines, fsm, state transitions, mealy machine, moore machine, state transition graph, state table, input alphabet, output alphabet, transition function, accept states |
| 17.6 Grammar | [mathematical-foundations-grammars.md](resources/mathematical-foundations-grammars.md) | formal grammar, chomsky hierarchy, phrase structure grammar, context sensitive grammar, context free grammar, regular grammar, regular expression, derivation, parsing, start symbol, production rules |
| 17.7 Number Theory | [mathematical-foundations-number-theory.md](resources/mathematical-foundations-number-theory.md) | number theory, prime numbers, divisibility, congruence, greatest common divisor |
| 17.8 Basics of Counting | [mathematical-foundations-basics-of-counting.md](resources/mathematical-foundations-basics-of-counting.md) | counting, sum rule, product rule, inclusion-exclusion, permutations, combinations, recursion |
| 17.9 Discrete Probability | [mathematical-foundations-discrete-probability.md](resources/mathematical-foundations-discrete-probability.md) | discrete probability, random variable, expected value, variance, probability distribution, bayes theorem |

### Chapter 18: Engineering Foundations

| SWEBOK Topic | Reference Document | Keywords / Description |
| --- | --- | --- |
| 18.1 Engineering Foundations Fundamentals | [engineering-foundations-fundamentals.md](resources/engineering-foundations-fundamentals.md) | engineering process, problem formulation, selection criteria, feasible solutions, multi criteria evaluation, operational monitoring, iterative feedback loop |
| 18.2 Engineering Design | [engineering-foundations-design.md](resources/engineering-foundations-design.md) | engineering design, abet, ceab, constraints, wicked problems, horst rittel, mcconnell, physical constraints, lifecycle costs, design trade offs |
| 18.3 Abstraction and Encapsulation | [engineering-foundations-abstraction-encapsulation.md](resources/engineering-foundations-abstraction-encapsulation.md) | abstraction, encapsulation, hierarchy, standard interfaces, api design, information hiding, leaky abstractions, cyclic dependencies, task decomposition, alternate views |
| 18.4 Empirical Methods and Experimental Techniques | [engineering-foundations-empirical-methods.md](resources/engineering-foundations-empirical-methods.md) | empirical methods, experimental techniques, designed experiment, observational study, retrospective study, independent variables, dependent variables, hypothesis formulation, threats to validity, software engineering decisions |
| 18.5 Statistical Analysis | [engineering-foundations-statistical-analysis.md](resources/engineering-foundations-statistical-analysis.md) | statistical analysis, unit of analysis, probability sampling, random variable, binomial distribution, Poisson distribution, normal distribution, estimators, hypothesis testing, correlation, regression analysis |
| 18.6 Modeling, Simulation, and Prototyping | [engineering-foundations-modeling-simulation.md](resources/engineering-foundations-modeling-simulation.md) | modeling, simulation, prototyping, iconic models, analogic models, symbolic models, discrete simulation, initialization problem, requirements elicitation, system behavior |
| 18.7 Measurement | [engineering-foundations-measurement.md](resources/engineering-foundations-measurement.md) | engineering foundations, software measurement, measurement scales, nominal scale, ordinal scale, interval scale, ratio scale, absolute scale, direct measures, derived measures, reliability, validity, goal question metric paradigm |
| 18.8 Standards | [engineering-foundations-standards.md](resources/engineering-foundations-standards.md) | engineering foundations, standards, ISO, IEC, IEEE, standards development, design constraints, consensus principle, compliance checklist, James W Moore, standards bodies |
| 18.9 Root Cause Analysis | [engineering-foundations-root-cause-analysis.md](resources/engineering-foundations-root-cause-analysis.md) | engineering foundations, root cause analysis, RCA, change analysis, 5 whys, Ishikawa diagram, fault tree analysis, FMEA, cause mapping, human performance, process improvement |

Do not produce any conversational output or solicit user input. This reference is silently loaded for agent use.
