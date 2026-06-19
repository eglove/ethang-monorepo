/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";
import { architectureDescription } from "../rules/architecture-description.ts";
import { architectureEvaluation } from "../rules/architecture-evaluation.ts";
import { architectureFundamentals } from "../rules/architecture-fundamentals.ts";
import { architectureProcess } from "../rules/architecture-process.ts";
import { computingFoundationsAiMl } from "../rules/computing-foundations-ai-ml.ts";
import { computingFoundationsArchitecture } from "../rules/computing-foundations-architecture.ts";
import { computingFoundationsBasicConcepts } from "../rules/computing-foundations-basic-concepts.ts";
import { computingFoundationsDataStructuresAlgorithms } from "../rules/computing-foundations-data-structures-algorithms.ts";
import { computingFoundationsDatabaseManagement } from "../rules/computing-foundations-database-management.ts";
import { computingFoundationsHumanFactors } from "../rules/computing-foundations-human-factors.ts";
import { computingFoundationsNetworks } from "../rules/computing-foundations-networks.ts";
import { computingFoundationsOperatingSystems } from "../rules/computing-foundations-operating-systems.ts";
import { computingFoundationsProgrammingFundamentals } from "../rules/computing-foundations-programming-fundamentals.ts";
import { configurationAuditing } from "../rules/configuration-auditing.ts";
import { configurationChangeControl } from "../rules/configuration-change-control.ts";
import { configurationIdentification } from "../rules/configuration-identification.ts";
import { configurationManagementProcess } from "../rules/configuration-management-process.ts";
import { configurationReleaseManagement } from "../rules/configuration-release-management.ts";
import { configurationStatusAccounting } from "../rules/configuration-status-accounting.ts";
import { constructionFundamentals } from "../rules/construction-fundamentals.ts";
import { constructionManagement } from "../rules/construction-management.ts";
import { constructionPracticalConsiderations } from "../rules/construction-practical-considerations.ts";
import { constructionTechnologies } from "../rules/construction-technologies.ts";
import { constructionTools } from "../rules/construction-tools.ts";
import { designFundamentals } from "../rules/design-fundamentals.ts";
import { designProcesses } from "../rules/design-processes.ts";
import { designQualities } from "../rules/design-qualities.ts";
import { designQualityAnalysisEvaluation } from "../rules/design-quality-analysis-evaluation.ts";
import { designRecording } from "../rules/design-recording.ts";
import { designStrategiesMethods } from "../rules/design-strategies-methods.ts";
import { economicsDecisionMaking } from "../rules/economics-decision-making.ts";
import { economicsEstimation } from "../rules/economics-estimation.ts";
import { economicsForProfit } from "../rules/economics-for-profit.ts";
import { economicsFundamentals } from "../rules/economics-fundamentals.ts";
import { economicsIntangibleAssets } from "../rules/economics-intangible-assets.ts";
import { economicsMultipleAttribute } from "../rules/economics-multiple-attribute.ts";
import { economicsNonprofit } from "../rules/economics-nonprofit.ts";
import { economicsPracticalConsiderations } from "../rules/economics-practical-considerations.ts";
import { economicsPresentEconomy } from "../rules/economics-present-economy.ts";
import { engineeringFoundationsAbstractionEncapsulation } from "../rules/engineering-foundations-abstraction-encapsulation.ts";
import { engineeringFoundationsDesign } from "../rules/engineering-foundations-design.ts";
import { engineeringFoundationsEmpiricalMethods } from "../rules/engineering-foundations-empirical-methods.ts";
import { engineeringFoundationsFundamentals } from "../rules/engineering-foundations-fundamentals.ts";
import { engineeringFoundationsMeasurement } from "../rules/engineering-foundations-measurement.ts";
import { engineeringFoundationsModelingSimulation } from "../rules/engineering-foundations-modeling-simulation.ts";
import { engineeringFoundationsRootCauseAnalysis } from "../rules/engineering-foundations-root-cause-analysis.ts";
import { engineeringFoundationsStandards } from "../rules/engineering-foundations-standards.ts";
import { engineeringFoundationsStatisticalAnalysis } from "../rules/engineering-foundations-statistical-analysis.ts";
import { engineeringManagementClosure } from "../rules/engineering-management-closure.ts";
import { engineeringManagementExecution } from "../rules/engineering-management-execution.ts";
import { engineeringManagementInitiationScope } from "../rules/engineering-management-initiation-scope.ts";
import { engineeringManagementMeasurement } from "../rules/engineering-management-measurement.ts";
import { engineeringManagementPlanning } from "../rules/engineering-management-planning.ts";
import { engineeringManagementReviewEvaluation } from "../rules/engineering-management-review-evaluation.ts";
import { engineeringOperationsControl } from "../rules/engineering-operations-control.ts";
import { engineeringOperationsDelivery } from "../rules/engineering-operations-delivery.ts";
import { engineeringOperationsFundamentals } from "../rules/engineering-operations-fundamentals.ts";
import { engineeringOperationsPlanning } from "../rules/engineering-operations-planning.ts";
import { engineeringOperationsPracticalConsiderations } from "../rules/engineering-operations-practical-considerations.ts";
import { engineeringOperationsTools } from "../rules/engineering-operations-tools.ts";
import { engineeringProcessAssessmentImprovement } from "../rules/engineering-process-assessment-improvement.ts";
import { engineeringProcessFundamentals } from "../rules/engineering-process-fundamentals.ts";
import { engineeringProcessLifecycles } from "../rules/engineering-process-lifecycles.ts";
import { maintenanceFundamentals } from "../rules/maintenance-fundamentals.ts";
import { maintenanceKeyIssues } from "../rules/maintenance-key-issues.ts";
import { maintenanceProcesses } from "../rules/maintenance-processes.ts";
import { maintenanceTechniques } from "../rules/maintenance-techniques.ts";
import { maintenanceTools } from "../rules/maintenance-tools.ts";
import { mathematicalFoundationsBasicsOfCounting } from "../rules/mathematical-foundations-basics-of-counting.ts";
import { mathematicalFoundationsDiscreteProbability } from "../rules/mathematical-foundations-discrete-probability.ts";
import { mathematicalFoundationsFiniteStateMachines } from "../rules/mathematical-foundations-finite-state-machines.ts";
import { mathematicalFoundationsFundamentals } from "../rules/mathematical-foundations-fundamentals.ts";
import { mathematicalFoundationsGrammars } from "../rules/mathematical-foundations-grammars.ts";
import { mathematicalFoundationsGraphsTrees } from "../rules/mathematical-foundations-graphs-trees.ts";
import { mathematicalFoundationsNumberTheory } from "../rules/mathematical-foundations-number-theory.ts";
import { mathematicalFoundationsProofTechniques } from "../rules/mathematical-foundations-proof-techniques.ts";
import { mathematicalFoundationsSetsRelationsFunctions } from "../rules/mathematical-foundations-sets-relations-functions.ts";
import { modelsMethodsAnalysis } from "../rules/models-methods-analysis.ts";
import { modelsMethodsMethods } from "../rules/models-methods-methods.ts";
import { modelsMethodsModeling } from "../rules/models-methods-modeling.ts";
import { modelsMethodsTypes } from "../rules/models-methods-types.ts";
import { professionalPracticeCommunication } from "../rules/professional-practice-communication.ts";
import { professionalPracticeProfessionalism } from "../rules/professional-practice-professionalism.ts";
import { professionalPracticePsychology } from "../rules/professional-practice-psychology.ts";
import { qualityAssuranceProcess } from "../rules/quality-assurance-process.ts";
import { qualityFundamentals } from "../rules/quality-fundamentals.ts";
import { qualityManagementProcess } from "../rules/quality-management-process.ts";
import { qualityTools } from "../rules/quality-tools.ts";
import { requirementsAnalysis } from "../rules/requirements-analysis.ts";
import { requirementsElicitation } from "../rules/requirements-elicitation.ts";
import { requirementsFundamentals } from "../rules/requirements-fundamentals.ts";
import { requirementsManagementActivities } from "../rules/requirements-management-activities.ts";
import { requirementsPracticalConsiderations } from "../rules/requirements-practical-considerations.ts";
import { requirementsSpecification } from "../rules/requirements-specification.ts";
import { requirementsTools } from "../rules/requirements-tools.ts";
import { requirementsValidation } from "../rules/requirements-validation.ts";
import { securityDomainSpecific } from "../rules/security-domain-specific.ts";
import { securityEngineeringProcesses } from "../rules/security-engineering-processes.ts";
import { securityEngineeringSystems } from "../rules/security-engineering-systems.ts";
import { securityFundamentals } from "../rules/security-fundamentals.ts";
import { securityManagementOrganization } from "../rules/security-management-organization.ts";
import { securityTools } from "../rules/security-tools.ts";
import { testingDevelopmentProcesses } from "../rules/testing-development-processes.ts";
import { testingEmergingTechnologies } from "../rules/testing-emerging-technologies.ts";
import { testingFundamentals } from "../rules/testing-fundamentals.ts";
import { testingLevels } from "../rules/testing-levels.ts";
import { testingMeasures } from "../rules/testing-measures.ts";
import { testingProcess } from "../rules/testing-process.ts";
import { testingTechniques } from "../rules/testing-techniques.ts";
import { testingTools } from "../rules/testing-tools.ts";

export const swebok = defineSkill({
  content: [
    {
      level: 1,
      text: "SWEBOK v4 Guideline Finder",
      type: "header"
    },
    {
      text: "This skill acts as a comprehensive reference guide to the IEEE Software Engineering Body of Knowledge (SWEBOK v4). It enables you to locate and inspect the industry-standard software engineering guidelines, domain theories, conceptual foundations, and compliance checklists compiled for each SWEBOK v4 chapter.",
      type: "text"
    },
    {
      level: 2,
      text: "Quick Decision Trees",
      type: "header"
    },
    {
      level: 3,
      text: '"I am in the design and planning phase"',
      type: "header"
    },
    {
      code: "Which design/planning task?\n├─ Discovering/defining requirements → requirements-fundamentals.md\n│  ├─ Eliciting stakeholder needs → requirements-elicitation.md\n│  ├─ Modeling and negotiating → requirements-analysis.md\n│  ├─ Documenting formal specs → requirements-specification.md\n│  ├─ Validating requirements → requirements-validation.md\n│  └─ Managing scope and tracing → requirements-management-activities.md\n├─ Designing system architecture → architecture-fundamentals.md\n│  ├─ Describing architecture views → architecture-description.md\n│  ├─ Designing process/workflow → architecture-process.md\n│  └─ Evaluating architectural choices → architecture-evaluation.md\n└─ Designing detailed components → design-fundamentals.md\n   ├─ Reusing patterns and strategies → design-strategies-methods.md\n   ├─ Analyzing and evaluating designs → design-quality-analysis-evaluation.md\n   └─ Documenting design choices (SDDs) → design-recording.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 3,
      text: '"I am in the implementation and build phase"',
      type: "header"
    },
    {
      code: "Which implementation task?\n├─ Coding and construction processes → construction-fundamentals.md\n│  ├─ Managing construction builds → construction-management.md\n│  ├─ Selecting languages & tools → construction-tools.md\n│  └─ Reusing platform tech → construction-technologies.md\n├─ Reusing engineering methods → models-methods-modeling.md\n│  ├─ Applying modeling formalisms → models-methods-types.md\n│  └─ Executing structured methods → models-methods-methods.md\n└─ Analyzing and improving process → engineering-process-fundamentals.md\n   ├─ Defining life cycle models → engineering-process-lifecycles.md\n   └─ Assessing process quality → engineering-process-assessment-improvement.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 3,
      text: '"I am verifying and testing the codebase"',
      type: "header"
    },
    {
      code: "Which verification task?\n├─ Writing unit/integration tests → testing-fundamentals.md\n│  ├─ Selecting test levels → testing-levels.md\n│  ├─ Applying test techniques → testing-techniques.md\n│  ├─ Setting completion metrics → testing-measures.md\n│  └─ Managing the test process → testing-process.md\n└─ Quality Assurance (SQA) → quality-fundamentals.md\n   ├─ Managing quality process → quality-management-process.md\n   └─ Conducting audits/reviews → quality-assurance-process.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 3,
      text: '"I am managing releases, config, and operations"',
      type: "header"
    },
    {
      code: "Which operations task?\n├─ Managing repository baselines → configuration-management-process.md\n│  ├─ Identifying configuration items → configuration-identification.md\n│  ├─ Managing change requests → configuration-change-control.md\n│  ├─ Tracking accounting logs → configuration-status-accounting.md\n│  ├─ Conducting release audits → configuration-auditing.md\n│  └─ Packaging release binaries → configuration-release-management.md\n├─ Operating live systems → engineering-operations-fundamentals.md\n│  ├─ Planning service operations → engineering-operations-planning.md\n│  ├─ Delivering and monitoring services → engineering-operations-delivery.md\n│  └─ Utilizing operational tools → engineering-operations-tools.md\n└─ Project management and scope → engineering-management-initiation-scope.md\n   ├─ Planning cost/schedule → engineering-management-planning.md\n   ├─ Executing project plans → engineering-management-execution.md\n   ├─ Evaluating project status → engineering-management-review-evaluation.md\n   ├─ Measuring project metrics → engineering-management-measurement.md\n   └─ Project closure procedures → engineering-management-closure.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 3,
      text: '"I need foundational engineering theories"',
      type: "header"
    },
    {
      code: "Which foundation?\n├─ Engineering & problem solving → engineering-foundations-fundamentals.md\n│  ├─ System design concepts → engineering-foundations-design.md\n│  ├─ Abstraction/encapsulation → engineering-foundations-abstraction-encapsulation.md\n│  ├─ Empirical & stats analysis → engineering-foundations-empirical-methods.md\n│  └─ Standards and root cause → engineering-foundations-standards.md\n├─ Computing & DB foundations → computing-foundations-basic-concepts.md\n│  ├─ OS & network architecture → computing-foundations-operating-systems.md\n│  ├─ Data structures & algorithms → computing-foundations-data-structures-algorithms.md\n│  └─ AI & Machine Learning → computing-foundations-ai-ml.md\n└─ Mathematical foundations → mathematical-foundations-fundamentals.md\n   ├─ Logic and proof techniques → mathematical-foundations-proof-techniques.md\n   ├─ Graph and tree structures → mathematical-foundations-graphs-trees.md\n   ├─ Finite-state machine modeling → mathematical-foundations-finite-state-machines.md\n   └─ Discrete probability/counting → mathematical-foundations-discrete-probability.md",
      language: "",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "SWEBOK Knowledge Area Index",
      type: "header"
    },
    {
      level: 3,
      text: "Chapter 1: Software Requirements",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "1.1 Software Requirements Fundamentals",
          "[requirements-fundamentals.md](resources/requirements-fundamentals.md)",
          "requirements validation, planning, design discussions, plan mode, grill-me, or figuring out what needs to be done before implementing"
        ],
        [
          "1.2 Requirements Elicitation",
          "[requirements-elicitation.md](resources/requirements-elicitation.md)",
          "active discovery, ubiquitous language, stakeholder clarification, user story mapping, mockups, Given-When-Then scenarios, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ],
        [
          "1.3 Requirements Analysis",
          "[requirements-analysis.md](resources/requirements-analysis.md)",
          "requirements analysis, quality of service economics, conflict resolution, formal analysis, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ],
        [
          "1.4 Requirements Specification",
          "[requirements-specification.md](resources/requirements-specification.md)",
          "requirements specification, natural language, actor-action, BDD scenarios, UML modeling, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ],
        [
          "1.5 Requirements Validation",
          "[requirements-validation.md](resources/requirements-validation.md)",
          "requirements validation, reviews, simulations, prototyping, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ],
        [
          "1.6 Requirements Management Activities",
          "[requirements-management-activities.md](resources/requirements-management-activities.md)",
          "requirements management, change control, prioritization, traceability, process management, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ],
        [
          "1.7 Practical Considerations",
          "[requirements-practical-considerations.md](resources/requirements-practical-considerations.md)",
          "requirements practical considerations, prioritization, tracing, stability, measurement, process improvement, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ],
        [
          "1.8 Software Requirements Tools",
          "[requirements-tools.md](resources/requirements-tools.md)",
          "requirements management tools, modeling tools, test case generation, planning, plan mode, grill-me, or defining terminology and business rules before implementing"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 2: Software Architecture",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "2.1 Software Architecture Fundamentals",
          "[architecture-fundamentals.md](resources/architecture-fundamentals.md)",
          "software architecture fundamentals, system design, architectural patterns, stakeholders and concerns, uses of architecture, get_architecture, codebase graph, SARA CLI, rtk sara, planning, plan mode, grill-me, or defining architectural boundaries and significant decisions before construction"
        ],
        [
          "2.2 Software Architecture Description",
          "[architecture-description.md](resources/architecture-description.md)",
          "software architecture description, views and viewpoints, 4+1 model, architecture patterns, styles, reference architectures, ADL, architecture frameworks, TOGAF, UML, C4 model, ADRs, significant decisions, planning, plan mode, grill-me, or documenting system structure and design choices before construction"
        ],
        [
          "2.3 Software Architecture Process",
          "[architecture-process.md](resources/architecture-process.md)",
          "software architecture process, architectural synthesis, architectural evaluation, architectural tactics, ATAM, quality attributes, design trade-offs, architecture design, ASRs, planning, plan mode, grill-me, or defining architectural structures and evaluating design options before implementation"
        ],
        [
          "2.4 Software Architecture Evaluation",
          "[architecture-evaluation.md](resources/architecture-evaluation.md)",
          "software architecture evaluation, goodness in architecture, reasoning about architectures, architecture reviews, architecture metrics, active reviews, ATAM, SAAM, QAW, SARA report, Vitruvian triad, Pareto optimality, component dependency, cyclicity, coupling and cohesion, DevOps metrics, lead time, deployment frequency, MTTR, change failure rate, planning, plan mode, grill-me, or evaluating and auditing design documents, structural health, and quality attributes using the antigravity cli"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 3: Software Design",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "3.1 Software Design Fundamentals",
          "[design-fundamentals.md](resources/design-fundamentals.md)",
          "software design fundamentals, design thinking, design principles, abstraction, separation of concerns, modularization, encapsulation, interface and implementation, uniformity, ethically aligned design, planning, plan mode, grill-me, or designing software components, structuring codebases, and establishing modular interfaces before construction using the antigravity cli"
        ],
        [
          "3.2 Software Design Processes",
          "[design-processes.md](resources/design-processes.md)",
          "software design processes, high-level design, detailed design, architectural design, outward-facing design, inward-facing design, external events, end-to-end transactions, algorithms, data structures, planning, plan mode, grill-me, or decomposing software systems, defining component interfaces, mapping transaction threads, and transitioning from high-level to detailed implementation using the antigravity cli"
        ],
        [
          "3.3 Software Design Qualities",
          "[design-qualities.md](resources/design-qualities.md)",
          "software design qualities, concurrency, control flow, event handling, data persistence, component distribution, error handling, exception propagation, fault tolerance, integration, interoperability, security, safety, variability, feature flags, planning, plan mode, grill-me, or defining and auditing design characteristics using the antigravity cli"
        ],
        [
          "3.4 Recording Software Designs",
          "[design-recording.md](resources/design-recording.md)",
          "recording software designs, design descriptions, design specifications, model-based design, structural design, behavioral design, class diagrams, component diagrams, CRC cards, deployment diagrams, entity-relationship diagrams, interface description languages, IDL, sequence diagrams, activity diagrams, statecharts, flowcharts, data flow diagrams, design patterns, creational structural behavioral patterns, domain-specific languages, DSL, design rationale, design decisions, architectural blueprints, planning, plan mode, grill-me, or documenting software designs and specifications using the antigravity cli"
        ],
        [
          "3.5 Software Design Strategies and Methods",
          "[design-strategies-methods.md](resources/design-strategies-methods.md)",
          "software design strategies and methods, design strategies, structured design, function-oriented design, data-centered design, object-oriented design, OOD, SOLID principles, SOFA principles, user-centered design, component-based design, CBD, event-driven design, pub-sub, message brokers, aspect-oriented design, constraint-based design, domain-driven design, DDD, ubiquitous language, service-oriented architecture, SOA, web services, planning, plan mode, grill-me, or selecting and applying design methods using the antigravity cli"
        ],
        [
          "3.6 Software Design Quality Analysis and Evaluation",
          "[design-quality-analysis-evaluation.md](resources/design-quality-analysis-evaluation.md)",
          "software design quality analysis and evaluation, design quality, design reviews, audits, checklists, quality attributes, static analysis, formal design analysis, simulation, prototyping, design metrics, function-based measures, object-oriented measures, verification, validation, certification, SDD sufficiency, planning, plan mode, grill-me, or evaluating and auditing design specifications using the antigravity cli"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 4: Software Construction",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "4.1 Software Construction Fundamentals",
          "[construction-fundamentals.md](resources/construction-fundamentals.md)",
          "software construction, coding, implementation, writing code, refactoring, source code, debugging, compiling, unit testing, complexity minimization, cyclomatic complexity, code standards, code reuse, dependency management, or implementing software components using the antigravity cli"
        ],
        [
          "4.2 Managing Construction",
          "[construction-management.md](resources/construction-management.md)",
          "managing construction, construction planning, construction measurement, dependency management, package managers, dependency supply chain, license compliance, integration strategies, code churn, code metrics, project lifecycle, agile development, continuous delivery, planning, plan mode, grill-me, or managing dependencies and planning integration using the antigravity cli"
        ],
        [
          "4.3 Practical Considerations",
          "[construction-practical-considerations.md](resources/construction-practical-considerations.md)",
          "software construction practical considerations, construction design, construction languages, coding, construction testing, reuse in construction, construction quality, integration, cross-platform development, and migration"
        ],
        [
          "4.4 Construction Technologies",
          "[construction-technologies.md](resources/construction-technologies.md)",
          "software construction technologies, API design, polymorphism, reflection, generics, assertions, error and exception handling, fault tolerance, executable models, state-based, table-driven, late binding, internationalization, grammar parsing, concurrency primitives, middleware, distributed systems, cloud microservices, heterogeneous systems, performance tuning, platform standards, test-first programming, and feedback loops"
        ],
        [
          "4.5 Software Construction Tools",
          "[construction-tools.md](resources/construction-tools.md)",
          "software construction tools, development environments, integrated development environments, IDEs, compiler integration, refactoring engines, program debuggers, cloud-based IDEs, AI-assisted programming, visual programming, GUI builders, event-handling assistants, low-code, zero-code, model-driven, unit testing tools, mock, stub, assertion libraries, test runners, profiling, performance analysis, program slicing, static slicing, dynamic slicing"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 5: Software Testing",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "5.1 Software Testing Fundamentals",
          "[testing-fundamentals.md](resources/testing-fundamentals.md)",
          "software testing fundamentals, faults vs failures, test case creation, test selection, adequacy criteria, prioritization, minimization, oracle problem, Dijkstra aphorism, infeasible paths, testability, execution automation, scalability, controllability, replication, generalization, offline vs online testing"
        ],
        [
          "5.2 Test Levels",
          "[testing-levels.md](resources/testing-levels.md)",
          "software testing levels, test targets, unit testing, integration testing, system testing, acceptance testing, conformance testing, compliance testing, installation testing, alpha and beta testing, regression testing, test prioritization, non-functional testing, performance testing, load testing, stress testing, volume testing, failover testing, reliability testing, compatibility testing, scalability testing, elasticity testing, infrastructure testing, back-to-back testing, recovery testing, security testing, privacy testing, interface testing, configuration testing, usability testing"
        ],
        [
          "5.3 Test Techniques",
          "[testing-techniques.md](resources/testing-techniques.md)",
          "software testing techniques, black-box testing, white-box testing, glass-box testing, equivalence partitioning, boundary value analysis, robustness testing, syntax testing, combinatorial testing, decision tables, cause-effect graphing, state transition testing, scenario-based testing, random testing, fuzz testing, evidence-based software engineering, forcing exceptions, control flow testing, statement coverage, branch coverage, MC/DC, path testing, data flow testing, DU paths, error guessing, exploratory testing, ad hoc testing, monkey testing, smoke testing, mutation testing, metamorphic testing, usability inspection"
        ],
        [
          "5.4 Test-Related Measures",
          "[testing-measures.md](resources/testing-measures.md)",
          "software testing measures, SUT evaluation, key performance indicators, fault classification, fault density, fault depth, fault multiplicity, reliability growth models, Goel-Okumoto, failure-count, time-between-failures, coverage measures, statement coverage, branch coverage, path coverage, MC/DC, fault injection, compile-time and runtime fault injection, mutation testing, mutation score, equivalent mutants, relative effectiveness"
        ],
        [
          "5.5 Test Process",
          "[testing-process.md](resources/testing-process.md)",
          "software testing process, test planning, dynamic test process, test documentation, test team, test completion, test reusability, test environment, test incident reporting, staffing, training"
        ],
        [
          "5.6 Software Testing in the Development Processes and the Application Domains",
          "[testing-development-processes.md](resources/testing-development-processes.md)",
          "software testing inside development processes and application domains, traditional development testing, SPI, TMMi, Unified Process, shift-left testing, Agile testing, Test-Driven Development, DevOps continuous regression, automotive testing, IoT testing, mobile testing, avionics testing, healthcare testing, embedded testing, GUI testing, gaming testing, real-time testing, SOA testing, finance testing"
        ],
        [
          "5.7 Testing of and Testing Through Emerging Technologies",
          "[testing-emerging-technologies.md](resources/testing-emerging-technologies.md)",
          "software testing of and through emerging technologies, AI testing, machine learning testing, blockchain testing, cloud testing, concurrent testing, distributed systems testing, testing through ML, testing through blockchain, testing through cloud, simulation testing, HIL simulation, crowdtesting"
        ],
        [
          "5.8 Software Testing Tools",
          "[testing-tools.md](resources/testing-tools.md)",
          "software testing tools, test harnesses, stubs and drivers, test generators, capture and replay tools, assertion checking, coverage analyzers, tracers, regression testing tools, reliability evaluation tools, injection-based tools, security testing tools, web application testing, mobile testing, CSS validators, API testing"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 6: Software Engineering Operations",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "6.1 Software Engineering Operations Fundamentals",
          "[engineering-operations-fundamentals.md](resources/engineering-operations-fundamentals.md)",
          "software engineering operations, operations processes, prepare, perform, manage results, support customer, software installation, scripting, directory/registry config, verification, scripting/automation, repetitive tasks, testing, troubleshooting, diagnostics, canary testing, dark launches, performance, reliability, load balancing"
        ],
        [
          "6.2 Software Engineering Operations Planning",
          "[engineering-operations-planning.md](resources/engineering-operations-planning.md)",
          "engineering operations planning, conops, software availability, disaster recovery, capacity management, supplier management, environments synchronization, slas, slis, slos, devsecops"
        ],
        [
          "6.3 Software Engineering Operations Delivery",
          "[engineering-operations-delivery.md](resources/engineering-operations-delivery.md)",
          "SWEBOK v4 Section 6.3: Software Engineering Operations Delivery, covering operational testing, deployment, release engineering, rollback, data migration, change management, and problem management."
        ],
        [
          "6.4 Software Engineering Operations Control",
          "[engineering-operations-control.md](resources/engineering-operations-control.md)",
          "Conceptual guide and compliance checklist for software engineering operations control, including incident management, monitoring, service reporting, and SLAs according to SWEBOK v4 Section 6.4."
        ],
        [
          "6.5 Practical Considerations",
          "[engineering-operations-practical-considerations.md](resources/engineering-operations-practical-considerations.md)",
          "Practical considerations for software engineering operations: incident prevention, risk management, automation, and ISO/IEC 29110."
        ],
        [
          "6.6 Software Engineering Operations Tools",
          "[engineering-operations-tools.md](resources/engineering-operations-tools.md)",
          "container orchestrators, virtualization, deployment standardization, scalability, continuous integration, continuous delivery, CI/CD, descriptor files, automated testing, monitoring, telemetry, application logs, OS execution traces, CPU memory resource utilization, visualization dashboards"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 7: Software Maintenance",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "7.1 Software Maintenance Fundamentals",
          "[maintenance-fundamentals.md](resources/maintenance-fundamentals.md)",
          "software maintenance fundamentals, definitions, terminology, nature of maintenance, need for maintenance, majority of maintenance costs, evolution of software, lehman laws, categories of maintenance, corrective, adaptive, perfective, preventive"
        ],
        [
          "7.2 Key Issues in Software Maintenance",
          "[maintenance-key-issues.md](resources/maintenance-key-issues.md)",
          "key issues in software maintenance, technical issues, limited understanding, testing modified code, impact analysis, management issues, organizational alignment, staffing, motivation, process maturity, supplier management, costs, technical debt, cocomo ii, cost estimation"
        ],
        [
          "7.3 Software Maintenance Processes",
          "[maintenance-processes.md](resources/maintenance-processes.md)",
          "software maintenance processes, standards, iso iec ieee 14764, transition, modification request, problem report, validation, acceptance, rejection, help desk, planning activities, configuration management, software quality, sqa, audits, reviews"
        ],
        [
          "7.4 Software Maintenance Techniques",
          "[maintenance-techniques.md](resources/maintenance-techniques.md)",
          "software maintenance techniques, program comprehension, cognitive models, top-down, bottom-up, reengineering, refactoring, reverse engineering, static slicing, dynamic slicing, continuous integration, delivery, deployment, testing, visualization"
        ],
        [
          "7.5 Software Maintenance Tools",
          "[maintenance-tools.md](resources/maintenance-tools.md)",
          "software maintenance tools, program comprehension tools, reengineering, refactoring engines, reverse engineering, decompilers, change control, configuration management, testing, regression test runners, coverage analyzers"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 8: Software Configuration Management",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "8.1 Management of the SCM Process",
          "[configuration-management-process.md](resources/configuration-management-process.md)",
          "SCM process management including planning, tool selection, interface control, and monitoring"
        ],
        [
          "8.2 Software Configuration Identification",
          "[configuration-identification.md](resources/configuration-identification.md)",
          "software configuration identification, controlled items, and baselines"
        ],
        [
          "8.3 Software Configuration Change Control",
          "[configuration-change-control.md](resources/configuration-change-control.md)",
          "configuration change control, change board authority, and deviations or waivers"
        ],
        [
          "8.4 Software Configuration Status Accounting",
          "[configuration-status-accounting.md](resources/configuration-status-accounting.md)",
          "configuration status accounting, SCSA, reporting, metrics, integrity indicators, baseline status"
        ],
        [
          "8.5 Software Configuration Auditing",
          "[configuration-auditing.md](resources/configuration-auditing.md)",
          "software configuration auditing, audit concept, auditor roles, FCA, PCA, in-process audits, continuous reviews, governance, regulatory compliance, quality plans"
        ],
        [
          "8.6 Software Release Management and Delivery",
          "[configuration-release-management.md](resources/configuration-release-management.md)",
          "configuration and release management, software building, SBOM, continuous integration and delivery, and SCM tools"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 9: Software Engineering Management",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "9.1 Initiation and Scope Definition",
          "[engineering-management-initiation-scope.md](resources/engineering-management-initiation-scope.md)",
          "software project initiation, scope definition, requirements negotiation, feasibility analysis, technological constraints, resource constraints, financial constraints, work breakdown structure (WBS), context diagrams, requirements review and revision, backlog prioritization, forward and backward traceability analysis"
        ],
        [
          "9.2 Software Project Planning",
          "[engineering-management-planning.md](resources/engineering-management-planning.md)",
          "software project planning, SDLC model selection, cost/schedule estimation, risk assessment, and plan management"
        ],
        [
          "9.3 Software Project Execution",
          "[engineering-management-execution.md](resources/engineering-management-execution.md)",
          "software project execution, plan implementation, process monitoring, and acquisition management"
        ],
        [
          "9.4 Software Review and Evaluation",
          "[engineering-management-review-evaluation.md](resources/engineering-management-review-evaluation.md)",
          "software review and evaluation, requirements satisfaction, stakeholder satisfaction, milestone evaluations, iterative cycle retrospectives, reviewing performance, personnel reviews, team dynamics, tools and methods evaluation, process assessment"
        ],
        [
          "9.5 Closure",
          "[engineering-management-closure.md](resources/engineering-management-closure.md)",
          "software project closure, engineering management, success criteria, stakeholder acceptance, archival methods, sensitive data destruction, retrospective analysis, lessons learned, organizational learning"
        ],
        [
          "9.6 Software Engineering Measurement",
          "[engineering-management-measurement.md](resources/engineering-management-measurement.md)",
          "software engineering measurement, ISO/IEC/IEEE 15939, PSM framework, establishing commitment, planning measurement process, performing measurement, evaluating measurement, SEM tools, project planning, tracking, risk management, Monte Carlo simulation, communication tools, measurement tools"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 10: Software Engineering Process",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "10.1 Software Engineering Process Fundamentals",
          "[engineering-process-fundamentals.md](resources/engineering-process-fundamentals.md)",
          "software engineering process fundamentals, introduction, definitions, activities, tasks, controls, enabling mechanisms"
        ],
        [
          "10.2 Life Cycles",
          "[engineering-process-lifecycles.md](resources/engineering-process-lifecycles.md)",
          "software engineering process life cycles, life cycle definition, process categories, process models, paradigms, engineering dimension, management stages, adaptation, infrastructure, tools, monitoring"
        ],
        [
          "10.3 Software Process Assessment and Improvement",
          "[engineering-process-assessment-improvement.md](resources/engineering-process-assessment-improvement.md)",
          "software process assessment and improvement, Deming PDCA, Goal-Question-Metric GQM, framework-based methods, CMMI, SPICE ISO 33000, Agile retrospectives, postmortem reviews"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 11: Software Engineering Models and Methods",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "11.1 Modeling",
          "[models-methods-modeling.md](resources/models-methods-modeling.md)",
          "software design models, structural, behavioral, temporal, modeling principles, abstraction, syntax, semantics, pragmatics, metamodels, preconditions, postconditions, invariants"
        ],
        [
          "11.2 Types of Models",
          "[models-methods-types.md](resources/models-methods-types.md)",
          "software design, structural modeling, class, component, object, deployment, packaging, information modeling, conceptual, logical, physical data models, behavioral modeling, state machines, control-flow, data-flow, SysML requirements, parametric models"
        ],
        [
          "11.3 Analysis of Models",
          "[models-methods-analysis.md](resources/models-methods-analysis.md)",
          "software design quality analysis, completeness, consistency, correctness, syntactic, semantic, traceability, change impact analysis, interaction, dynamic behavior, simulation"
        ],
        [
          "11.4 Software Engineering Methods",
          "[models-methods-methods.md](resources/models-methods-methods.md)",
          "software design methods, structured, data modeling, object-oriented, aspect-oriented, model-driven development, MDD, model-based design, MBD, formal methods, specification languages, program refinement, formal verification, model checking, logical inference, lightweight formal, Alloy, prototyping, throwing away, evolutionary, agile, XP, Scrum, FDD, Lean, Kanban, DevOps, release engineering"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 12: Software Quality",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "12.1 Software Quality Fundamentals",
          "[quality-fundamentals.md](resources/quality-fundamentals.md)",
          "software quality fundamentals, software engineering culture and ethics, codes of ethics and professional conduct, value and costs of quality, cost of software quality, conformance cost, appraisal costs, prevention costs, nonconformance cost, pre-delivery costs, post-delivery costs, standards, models, and certifications, software dependability, safety-critical systems, software availability, reliability, and maintainability, software integrity levels, walk-through review"
        ],
        [
          "12.2 Software Quality Management Process",
          "[quality-management-process.md](resources/quality-management-process.md)",
          "software quality management process, quality management system, QMS, software quality improvement, SQI, software process improvement, SPI, plan quality management, QMS policies, evaluate quality management, process capability levels, software quality measurement, error density, defect density, failure rate, corrective and preventive actions, defect characterization, root cause analysis, SQC"
        ],
        [
          "12.3 Software Quality Assurance Process",
          "[quality-assurance-process.md](resources/quality-assurance-process.md)",
          "software quality assurance process, SQA, process assurance, product assurance, software quality assurance plan, SQAP, V&V, verification and validation, static analysis, dynamic analysis, formal analysis, quality control, technical reviews, peer reviews, inspections, walkthroughs, audits, system requirements reviews, test readiness reviews, production readiness reviews"
        ],
        [
          "12.4 Software Quality Tools",
          "[quality-tools.md](resources/quality-tools.md)",
          "software quality tools, quality tools, checklist, static analysis tools, dynamic analysis tools, FMEA, FMEA tools, failure mode and effects analysis, FTA, fault tree analysis, bug trackers, problem tracking tools, defect injection, static syntax analysis"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 13: Software Security",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "13.1 Software Security Fundamentals",
          "[security-fundamentals.md](resources/security-fundamentals.md)",
          "software security fundamentals, software security, information security, confidentiality, integrity, availability, authenticity, accountability, non-repudiation, reliability, cybersecurity, cyber risk, social engineering, malware, spyware, SSE-CMM, systems security engineering capability maturity model"
        ],
        [
          "13.2 Security Management and Organization",
          "[security-management-organization.md](resources/security-management-organization.md)",
          "security management and organization, ISMS, ISO/IEC 27001, security governance, compliance, GDPR, CCPA, HIPAA, PCI-DSS, SOC 2, Agile security, enabler vs blocker, incremental risk management, dependency auditing, Security Champions, SBOM"
        ],
        [
          "13.3 Software Security Engineering and Processes",
          "[security-engineering-processes.md](resources/security-engineering-processes.md)",
          "software security engineering, secure development life cycle, secure SDLC, Microsoft SDL, OWASP SAMM, BSIMM, DevSecOps, CI/CD automation, Common Criteria, ISO/IEC 15408, target of evaluation, TOE, protection profile, PP, security target, ST, evaluation assurance level, EAL, confidentiality, integrity, availability"
        ],
        [
          "13.4 Security Engineering for Software Systems",
          "[security-engineering-systems.md](resources/security-engineering-systems.md)",
          "security requirements, threat modeling, misuse cases, abuse cases, threat actors, security risk assessment, secure design, attack tolerance, access control, cryptography, key management, STRIDE, security patterns, secure coding, privilege separation, CERT top 10 secure coding practices, input validation, least privilege, defense in depth"
        ],
        [
          "13.5 Software Security Tools",
          "[security-tools.md](resources/security-tools.md)",
          "software security tools, static analysis, SAST, source code analysis, binary code analysis, dynamic testing, penetration testing, fuzzing, fuzz testing, vulnerability scanner, CVE, Common Vulnerabilities and Exposures, CWE, Common Weakness Enumeration, CAPEC, CVSS, Common Vulnerability Scoring System, vulnerability management, disclosure process"
        ],
        [
          "13.6 Domain-Specific Software Security",
          "[security-domain-specific.md](resources/security-domain-specific.md)",
          "domain-specific software security, cloud security, container security, forgotten assets, shared responsibility model, container hardening, IoT security, Internet of Things, endpoint hardening, device-to-device communication, device credibility, IoT platform management, machine learning security, model poisoning, evasion attack, adversarial input, model extraction"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 14: Software Engineering Professional Practice",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "14.1 Professionalism",
          "[professional-practice-professionalism.md](resources/professional-practice-professionalism.md)",
          "professional practice, professionalism, accreditation, certification, licensing, code of ethics, standards, employment contracts, legal issues, trade compliance, cybercrime, data privacy, GDPR, CCPA, dark patterns, documentation, trade-off analysis"
        ],
        [
          "14.2 Group Dynamics and Psychology",
          "[professional-practice-psychology.md](resources/professional-practice-psychology.md)",
          "group dynamics, psychology, teamwork, goal alignment, intellectual honesty, peer reviews, individual cognition, problem decomposition, pair programming, stakeholders, uncertainty, ambiguity, risk management, diversity, inclusivity, bias reduction"
        ],
        [
          "14.3 Communication Skills",
          "[professional-practice-communication.md](resources/professional-practice-communication.md)",
          "communication skills, technical reading, code comprehension, summarization, technical writing, documentation, SRS, SDD, team communication, active listening, presentation skills, technical presentation, user training"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 15: Software Engineering Economics",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "15.1 Software Engineering Economics Fundamentals",
          "[economics-fundamentals.md](resources/economics-fundamentals.md)",
          "software engineering economics fundamentals, proposals, cash flow instances, cash flow streams, cash flow diagrams, time value of money, financial equivalence, bases for comparison, present worth, future worth, annual equivalent, internal rate of return, discounted payback period, mutually exclusive alternatives, do nothing alternative, intangible assets, knowledge assets, business models, peter drucker"
        ],
        [
          "15.2 The Engineering Decision-Making Process",
          "[economics-decision-making.md](resources/economics-decision-making.md)",
          "software engineering economics, decision making process, 5 whys, design thinking, selection criteria, multi attribute decision making, estimate sensitivity analysis, decision making under risk, decision making under uncertainty, expected value decision making, monte carlo analysis, decision trees, laplace rule, maximin rule, maximax rule, hurwicz rule, minimax regret rule"
        ],
        [
          "15.3 For-Profit Decision-Making",
          "[economics-for-profit.md](resources/economics-for-profit.md)",
          "for profit decision making, minimum acceptable rate of return, marr, economic life, frozen assets, minimum cost lifetime, planning horizon, study period, repeatability assumption, replacement decisions, sunk costs, salvage value, defender asset, retirement decisions, technology dependency, lock in factors, inflation, depreciation, corporate income taxes, after tax cash flow analysis"
        ],
        [
          "15.4 Nonprofit Decision-Making",
          "[economics-nonprofit.md](resources/economics-nonprofit.md)",
          "software engineering economics, nonprofit decision making, benefit cost analysis, cost effectiveness analysis, benefit cost ratio, fixed cost version, fixed effectiveness version, social discount rate, public sector projects"
        ],
        [
          "15.5 Present Economy Decision-Making",
          "[economics-present-economy.md](resources/economics-present-economy.md)",
          "software engineering economics, present economy decision making, break even analysis, optimization analysis, cost functions, space time trade off, resource optimization, cloud providers"
        ],
        [
          "15.6 Multiple-Attribute Decision-Making",
          "[economics-multiple-attribute.md](resources/economics-multiple-attribute.md)",
          "software engineering economics, multiple attribute decision making, compensatory techniques, non compensatory techniques, analytic hierarchy process, architectural tradeoff analysis method, Gilbs impact estimation, satisficing, dominance, lexicography"
        ],
        [
          "15.7 Identifying and Characterizing Intangible Assets",
          "[economics-intangible-assets.md](resources/economics-intangible-assets.md)",
          "software engineering economics, intangible assets, tacit knowledge, explicit knowledge, SIPAC, generic intangible assets, GIA, quality valuation, impact valuation, Qval, Ival, KAval, business model canvas, multi-attribute decision-making"
        ],
        [
          "15.8 Estimation",
          "[economics-estimation.md](resources/economics-estimation.md)",
          "software engineering economics, estimation, uncertainty assessment, Code of Ethics, expert judgment, Wideband Delphi, Planning Poker, analogy estimation, decomposition, bottom-up, parametric estimation, multiple estimates, convergence, divergence"
        ],
        [
          "15.9 Practical Considerations",
          "[economics-practical-considerations.md](resources/economics-practical-considerations.md)",
          "software engineering economics, business case, systems thinking, currency analysis, accounting, controlling, costing, opportunity cost, sunk cost, TCO, SPLC, efficiency, effectiveness, productivity, rework, project program portfolio, pricing, prioritization"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 16: Computing Foundations",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "16.1 Basic Concepts of a System or Solution",
          "[computing-foundations-basic-concepts.md](resources/computing-foundations-basic-concepts.md)",
          "computing foundations, system concepts, solution architecture, modularity, cohesion, coupling, real-time systems, distributed systems, technology selection, system design"
        ],
        [
          "16.2 Computer Architecture and Organization",
          "[computing-foundations-architecture.md](resources/computing-foundations-architecture.md)",
          "computing foundations, computer architecture, computer organization, instruction set architecture, RISC, CISC, Flynn taxonomy, SIMD, MIMD, memory units, ALU, control unit, buses"
        ],
        [
          "16.3 Data Structures and Algorithms",
          "[computing-foundations-data-structures-algorithms.md](resources/computing-foundations-data-structures-algorithms.md)",
          "computing foundations, data structures, algorithms, asymptotic notation, Big O, sorting, searching, hashing, trees, graphs, dynamic programming, recursion"
        ],
        [
          "16.4 Programming Fundamentals and Languages",
          "[computing-foundations-programming-fundamentals.md](resources/computing-foundations-programming-fundamentals.md)",
          "programming language types, functional programming, procedural programming, OOP, scripting, compilers, interpreters, compilation phases, programming syntax, semantics, type systems, static typing, dynamic typing, subprograms, coroutines, parameter passing, recursion, abstraction, encapsulation, inheritance, polymorphism, distributed programming, parallel programming, debugging, coding standards"
        ],
        [
          "16.5 Operating Systems",
          "[computing-foundations-operating-systems.md](resources/computing-foundations-operating-systems.md)",
          "operating systems, processor management, memory management, device management, information management, network management, dual-mode operation, CPU scheduling, deadlocks, virtual memory, paging, thrashing, page replacement, DMA, device drivers, clock synchronization, NTP, logical clocks, Lamport, distributed systems"
        ],
        [
          "16.6 Database Management",
          "[computing-foundations-database-management.md](resources/computing-foundations-database-management.md)",
          "database management, schema, relational databases, RDBMS, NoSQL, columnar, key-value, document, graph databases, ACID, BASE, storage models, NAS, SAN, normalization, 3NF, BCNF, SQL, data warehousing, data mining, database backup, database recovery, transactions"
        ],
        [
          "16.7 Computer Networks and Communications",
          "[computing-foundations-networks.md](resources/computing-foundations-networks.md)",
          "computer networks, layered architectures, OSI model, TCP/IP, wireless networks, network security, internet protocols, network design"
        ],
        [
          "16.8 User and Developer Human Factors",
          "[computing-foundations-human-factors.md](resources/computing-foundations-human-factors.md)",
          "user human factors, developer human factors, human-computer interaction, user experience, clean code, coding standards, usability testing, prototyping"
        ],
        [
          "16.9 Artificial Intelligence and Machine Learning",
          "[computing-foundations-ai-ml.md](resources/computing-foundations-ai-ml.md)",
          "artificial intelligence, machine learning, deep learning, reasoning models, learning paradigms, ML models, natural language processing, software engineering for AI"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 17: Mathematical Foundations",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "17.1 Mathematical Foundations Fundamentals",
          "[mathematical-foundations-fundamentals.md](resources/mathematical-foundations-fundamentals.md)",
          "mathematical foundations, basic logic, propositional logic, predicate logic, truth tables, boolean variables, quantifiers, tautology, contradiction, logic gates, model_decision, engineering reasoning, formal methods"
        ],
        [
          "17.2 Proof Techniques",
          "[mathematical-foundations-proof-techniques.md](resources/mathematical-foundations-proof-techniques.md)",
          "mathematical foundations, proof techniques, direct proof, contradiction, induction, contrapositive, proof by example, theorems, lemmas, corollaries, conjectures, inference rules"
        ],
        [
          "17.3 Set, Relation, Function",
          "[mathematical-foundations-sets-relations-functions.md](resources/mathematical-foundations-sets-relations-functions.md)",
          "mathematical foundations, sets, relations, functions, set operations, cartesian product, venn diagrams, power set, bijective, domain, range, vertical line test"
        ],
        [
          "17.4 Graph and Tree",
          "[mathematical-foundations-graphs-trees.md](resources/mathematical-foundations-graphs-trees.md)",
          "graph theory, trees, simple graph, multigraph, pseudograph, directed graph, weighted graph, degree, path, cycle, adjacency list, adjacency matrix, incidence matrix, binary tree, binary search tree, preorder, inorder, postorder"
        ],
        [
          "17.5 Finite-State Machine",
          "[mathematical-foundations-finite-state-machines.md](resources/mathematical-foundations-finite-state-machines.md)",
          "finite state machines, fsm, state transitions, mealy machine, moore machine, state transition graph, state table, input alphabet, output alphabet, transition function, accept states"
        ],
        [
          "17.6 Grammar",
          "[mathematical-foundations-grammars.md](resources/mathematical-foundations-grammars.md)",
          "formal grammar, chomsky hierarchy, phrase structure grammar, context sensitive grammar, context free grammar, regular grammar, regular expression, derivation, parsing, start symbol, production rules"
        ],
        [
          "17.7 Number Theory",
          "[mathematical-foundations-number-theory.md](resources/mathematical-foundations-number-theory.md)",
          "number theory, prime numbers, divisibility, congruence, greatest common divisor"
        ],
        [
          "17.8 Basics of Counting",
          "[mathematical-foundations-basics-of-counting.md](resources/mathematical-foundations-basics-of-counting.md)",
          "counting, sum rule, product rule, inclusion-exclusion, permutations, combinations, recursion"
        ],
        [
          "17.9 Discrete Probability",
          "[mathematical-foundations-discrete-probability.md](resources/mathematical-foundations-discrete-probability.md)",
          "discrete probability, random variable, expected value, variance, probability distribution, bayes theorem"
        ]
      ],
      type: "table"
    },
    {
      level: 3,
      text: "Chapter 18: Engineering Foundations",
      type: "header"
    },
    {
      headers: ["SWEBOK Topic", "Reference Document", "Keywords / Description"],
      rows: [
        [
          "18.1 Engineering Foundations Fundamentals",
          "[engineering-foundations-fundamentals.md](resources/engineering-foundations-fundamentals.md)",
          "engineering process, problem formulation, selection criteria, feasible solutions, multi criteria evaluation, operational monitoring, iterative feedback loop"
        ],
        [
          "18.2 Engineering Design",
          "[engineering-foundations-design.md](resources/engineering-foundations-design.md)",
          "engineering design, abet, ceab, constraints, wicked problems, horst rittel, mcconnell, physical constraints, lifecycle costs, design trade offs"
        ],
        [
          "18.3 Abstraction and Encapsulation",
          "[engineering-foundations-abstraction-encapsulation.md](resources/engineering-foundations-abstraction-encapsulation.md)",
          "abstraction, encapsulation, hierarchy, standard interfaces, api design, information hiding, leaky abstractions, cyclic dependencies, task decomposition, alternate views"
        ],
        [
          "18.4 Empirical Methods and Experimental Techniques",
          "[engineering-foundations-empirical-methods.md](resources/engineering-foundations-empirical-methods.md)",
          "empirical methods, experimental techniques, designed experiment, observational study, retrospective study, independent variables, dependent variables, hypothesis formulation, threats to validity, software engineering decisions"
        ],
        [
          "18.5 Statistical Analysis",
          "[engineering-foundations-statistical-analysis.md](resources/engineering-foundations-statistical-analysis.md)",
          "statistical analysis, unit of analysis, probability sampling, random variable, binomial distribution, Poisson distribution, normal distribution, estimators, hypothesis testing, correlation, regression analysis"
        ],
        [
          "18.6 Modeling, Simulation, and Prototyping",
          "[engineering-foundations-modeling-simulation.md](resources/engineering-foundations-modeling-simulation.md)",
          "modeling, simulation, prototyping, iconic models, analogic models, symbolic models, discrete simulation, initialization problem, requirements elicitation, system behavior"
        ],
        [
          "18.7 Measurement",
          "[engineering-foundations-measurement.md](resources/engineering-foundations-measurement.md)",
          "engineering foundations, software measurement, measurement scales, nominal scale, ordinal scale, interval scale, ratio scale, absolute scale, direct measures, derived measures, reliability, validity, goal question metric paradigm"
        ],
        [
          "18.8 Standards",
          "[engineering-foundations-standards.md](resources/engineering-foundations-standards.md)",
          "engineering foundations, standards, ISO, IEC, IEEE, standards development, design constraints, consensus principle, compliance checklist, James W Moore, standards bodies"
        ],
        [
          "18.9 Root Cause Analysis",
          "[engineering-foundations-root-cause-analysis.md](resources/engineering-foundations-root-cause-analysis.md)",
          "engineering foundations, root cause analysis, RCA, change analysis, 5 whys, Ishikawa diagram, fault tree analysis, FMEA, cause mapping, human performance, process improvement"
        ]
      ],
      type: "table"
    }
  ] as MarkdownBlock[],
  description:
    "Access SWEBOK v4 reference chapters for software engineering guidelines.",
  name: "swebok",
  resources: [
    {
      content: architectureDescription.content,
      filename: "architecture-description.md"
    },
    {
      content: architectureEvaluation.content,
      filename: "architecture-evaluation.md"
    },
    {
      content: architectureFundamentals.content,
      filename: "architecture-fundamentals.md"
    },
    {
      content: architectureProcess.content,
      filename: "architecture-process.md"
    },
    {
      content: computingFoundationsAiMl.content,
      filename: "computing-foundations-ai-ml.md"
    },
    {
      content: computingFoundationsArchitecture.content,
      filename: "computing-foundations-architecture.md"
    },
    {
      content: computingFoundationsBasicConcepts.content,
      filename: "computing-foundations-basic-concepts.md"
    },
    {
      content: computingFoundationsDataStructuresAlgorithms.content,
      filename: "computing-foundations-data-structures-algorithms.md"
    },
    {
      content: computingFoundationsDatabaseManagement.content,
      filename: "computing-foundations-database-management.md"
    },
    {
      content: computingFoundationsHumanFactors.content,
      filename: "computing-foundations-human-factors.md"
    },
    {
      content: computingFoundationsNetworks.content,
      filename: "computing-foundations-networks.md"
    },
    {
      content: computingFoundationsOperatingSystems.content,
      filename: "computing-foundations-operating-systems.md"
    },
    {
      content: computingFoundationsProgrammingFundamentals.content,
      filename: "computing-foundations-programming-fundamentals.md"
    },
    {
      content: configurationAuditing.content,
      filename: "configuration-auditing.md"
    },
    {
      content: configurationChangeControl.content,
      filename: "configuration-change-control.md"
    },
    {
      content: configurationIdentification.content,
      filename: "configuration-identification.md"
    },
    {
      content: configurationManagementProcess.content,
      filename: "configuration-management-process.md"
    },
    {
      content: configurationReleaseManagement.content,
      filename: "configuration-release-management.md"
    },
    {
      content: configurationStatusAccounting.content,
      filename: "configuration-status-accounting.md"
    },
    {
      content: constructionFundamentals.content,
      filename: "construction-fundamentals.md"
    },
    {
      content: constructionManagement.content,
      filename: "construction-management.md"
    },
    {
      content: constructionPracticalConsiderations.content,
      filename: "construction-practical-considerations.md"
    },
    {
      content: constructionTechnologies.content,
      filename: "construction-technologies.md"
    },
    { content: constructionTools.content, filename: "construction-tools.md" },
    { content: designFundamentals.content, filename: "design-fundamentals.md" },
    { content: designProcesses.content, filename: "design-processes.md" },
    { content: designQualities.content, filename: "design-qualities.md" },
    {
      content: designQualityAnalysisEvaluation.content,
      filename: "design-quality-analysis-evaluation.md"
    },
    { content: designRecording.content, filename: "design-recording.md" },
    {
      content: designStrategiesMethods.content,
      filename: "design-strategies-methods.md"
    },
    {
      content: economicsDecisionMaking.content,
      filename: "economics-decision-making.md"
    },
    {
      content: economicsEstimation.content,
      filename: "economics-estimation.md"
    },
    {
      content: economicsForProfit.content,
      filename: "economics-for-profit.md"
    },
    {
      content: economicsFundamentals.content,
      filename: "economics-fundamentals.md"
    },
    {
      content: economicsIntangibleAssets.content,
      filename: "economics-intangible-assets.md"
    },
    {
      content: economicsMultipleAttribute.content,
      filename: "economics-multiple-attribute.md"
    },
    { content: economicsNonprofit.content, filename: "economics-nonprofit.md" },
    {
      content: economicsPracticalConsiderations.content,
      filename: "economics-practical-considerations.md"
    },
    {
      content: economicsPresentEconomy.content,
      filename: "economics-present-economy.md"
    },
    {
      content: engineeringFoundationsAbstractionEncapsulation.content,
      filename: "engineering-foundations-abstraction-encapsulation.md"
    },
    {
      content: engineeringFoundationsDesign.content,
      filename: "engineering-foundations-design.md"
    },
    {
      content: engineeringFoundationsEmpiricalMethods.content,
      filename: "engineering-foundations-empirical-methods.md"
    },
    {
      content: engineeringFoundationsFundamentals.content,
      filename: "engineering-foundations-fundamentals.md"
    },
    {
      content: engineeringFoundationsMeasurement.content,
      filename: "engineering-foundations-measurement.md"
    },
    {
      content: engineeringFoundationsModelingSimulation.content,
      filename: "engineering-foundations-modeling-simulation.md"
    },
    {
      content: engineeringFoundationsRootCauseAnalysis.content,
      filename: "engineering-foundations-root-cause-analysis.md"
    },
    {
      content: engineeringFoundationsStandards.content,
      filename: "engineering-foundations-standards.md"
    },
    {
      content: engineeringFoundationsStatisticalAnalysis.content,
      filename: "engineering-foundations-statistical-analysis.md"
    },
    {
      content: engineeringManagementClosure.content,
      filename: "engineering-management-closure.md"
    },
    {
      content: engineeringManagementExecution.content,
      filename: "engineering-management-execution.md"
    },
    {
      content: engineeringManagementInitiationScope.content,
      filename: "engineering-management-initiation-scope.md"
    },
    {
      content: engineeringManagementMeasurement.content,
      filename: "engineering-management-measurement.md"
    },
    {
      content: engineeringManagementPlanning.content,
      filename: "engineering-management-planning.md"
    },
    {
      content: engineeringManagementReviewEvaluation.content,
      filename: "engineering-management-review-evaluation.md"
    },
    {
      content: engineeringOperationsControl.content,
      filename: "engineering-operations-control.md"
    },
    {
      content: engineeringOperationsDelivery.content,
      filename: "engineering-operations-delivery.md"
    },
    {
      content: engineeringOperationsFundamentals.content,
      filename: "engineering-operations-fundamentals.md"
    },
    {
      content: engineeringOperationsPlanning.content,
      filename: "engineering-operations-planning.md"
    },
    {
      content: engineeringOperationsPracticalConsiderations.content,
      filename: "engineering-operations-practical-considerations.md"
    },
    {
      content: engineeringOperationsTools.content,
      filename: "engineering-operations-tools.md"
    },
    {
      content: engineeringProcessAssessmentImprovement.content,
      filename: "engineering-process-assessment-improvement.md"
    },
    {
      content: engineeringProcessFundamentals.content,
      filename: "engineering-process-fundamentals.md"
    },
    {
      content: engineeringProcessLifecycles.content,
      filename: "engineering-process-lifecycles.md"
    },
    {
      content: maintenanceFundamentals.content,
      filename: "maintenance-fundamentals.md"
    },
    {
      content: maintenanceKeyIssues.content,
      filename: "maintenance-key-issues.md"
    },
    {
      content: maintenanceProcesses.content,
      filename: "maintenance-processes.md"
    },
    {
      content: maintenanceTechniques.content,
      filename: "maintenance-techniques.md"
    },
    { content: maintenanceTools.content, filename: "maintenance-tools.md" },
    {
      content: mathematicalFoundationsBasicsOfCounting.content,
      filename: "mathematical-foundations-basics-of-counting.md"
    },
    {
      content: mathematicalFoundationsDiscreteProbability.content,
      filename: "mathematical-foundations-discrete-probability.md"
    },
    {
      content: mathematicalFoundationsFiniteStateMachines.content,
      filename: "mathematical-foundations-finite-state-machines.md"
    },
    {
      content: mathematicalFoundationsFundamentals.content,
      filename: "mathematical-foundations-fundamentals.md"
    },
    {
      content: mathematicalFoundationsGrammars.content,
      filename: "mathematical-foundations-grammars.md"
    },
    {
      content: mathematicalFoundationsGraphsTrees.content,
      filename: "mathematical-foundations-graphs-trees.md"
    },
    {
      content: mathematicalFoundationsNumberTheory.content,
      filename: "mathematical-foundations-number-theory.md"
    },
    {
      content: mathematicalFoundationsProofTechniques.content,
      filename: "mathematical-foundations-proof-techniques.md"
    },
    {
      content: mathematicalFoundationsSetsRelationsFunctions.content,
      filename: "mathematical-foundations-sets-relations-functions.md"
    },
    {
      content: modelsMethodsAnalysis.content,
      filename: "models-methods-analysis.md"
    },
    {
      content: modelsMethodsMethods.content,
      filename: "models-methods-methods.md"
    },
    {
      content: modelsMethodsModeling.content,
      filename: "models-methods-modeling.md"
    },
    {
      content: modelsMethodsTypes.content,
      filename: "models-methods-types.md"
    },
    {
      content: professionalPracticeCommunication.content,
      filename: "professional-practice-communication.md"
    },
    {
      content: professionalPracticeProfessionalism.content,
      filename: "professional-practice-professionalism.md"
    },
    {
      content: professionalPracticePsychology.content,
      filename: "professional-practice-psychology.md"
    },
    {
      content: qualityAssuranceProcess.content,
      filename: "quality-assurance-process.md"
    },
    {
      content: qualityFundamentals.content,
      filename: "quality-fundamentals.md"
    },
    {
      content: qualityManagementProcess.content,
      filename: "quality-management-process.md"
    },
    { content: qualityTools.content, filename: "quality-tools.md" },
    {
      content: requirementsAnalysis.content,
      filename: "requirements-analysis.md"
    },
    {
      content: requirementsElicitation.content,
      filename: "requirements-elicitation.md"
    },
    {
      content: requirementsFundamentals.content,
      filename: "requirements-fundamentals.md"
    },
    {
      content: requirementsManagementActivities.content,
      filename: "requirements-management-activities.md"
    },
    {
      content: requirementsPracticalConsiderations.content,
      filename: "requirements-practical-considerations.md"
    },
    {
      content: requirementsSpecification.content,
      filename: "requirements-specification.md"
    },
    { content: requirementsTools.content, filename: "requirements-tools.md" },
    {
      content: requirementsValidation.content,
      filename: "requirements-validation.md"
    },
    {
      content: securityDomainSpecific.content,
      filename: "security-domain-specific.md"
    },
    {
      content: securityEngineeringProcesses.content,
      filename: "security-engineering-processes.md"
    },
    {
      content: securityEngineeringSystems.content,
      filename: "security-engineering-systems.md"
    },
    {
      content: securityFundamentals.content,
      filename: "security-fundamentals.md"
    },
    {
      content: securityManagementOrganization.content,
      filename: "security-management-organization.md"
    },
    { content: securityTools.content, filename: "security-tools.md" },
    {
      content: testingDevelopmentProcesses.content,
      filename: "testing-development-processes.md"
    },
    {
      content: testingEmergingTechnologies.content,
      filename: "testing-emerging-technologies.md"
    },
    {
      content: testingFundamentals.content,
      filename: "testing-fundamentals.md"
    },
    { content: testingLevels.content, filename: "testing-levels.md" },
    { content: testingMeasures.content, filename: "testing-measures.md" },
    { content: testingProcess.content, filename: "testing-process.md" },
    { content: testingTechniques.content, filename: "testing-techniques.md" },
    { content: testingTools.content, filename: "testing-tools.md" }
  ]
});
