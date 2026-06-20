import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const testingLevels = defineRule({
  content: [
    {
      level: 1,
      text: "Software Test Levels and Objectives",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Software testing is structured around distinct levels and objectives that correspond to the progressive integration of software components, the operational targets under validation, and the technical properties being evaluated. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 5, Section 2, test levels are distinguished by the SUT target (what is being tested) and the test objectives (why it is being tested). Defining precise, quantitative objectives is critical to control the validation process, measure progress, and evaluate release readiness. Testing levels span unit, integration, system, and acceptance stages, while objectives range from functional conformance and regulatory compliance to extensive non-functional evaluations, security assessments, and usability reviews.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 The Target of the Test",
      type: "header"
    },
    {
      text: "The target of testing shifts as software moves from individual methods and classes to the fully assembled system, defining four primary test stages:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Unit Testing**: Unit testing verifies the functioning of separately testable software elements (such as subprograms, classes, routines, or subsystems) in complete isolation from other components. It focuses on validating internal logic, data structures, and edge conditions. Unit testing typically utilizes test doubles to isolate the unit from database and network dependencies, providing immediate feedback during code construction. Unit testing serves as the first line of defense in the testing lifecycle, focusing on boundary evaluations, path coverages, and internal state invariants. Mocking frameworks are used to substitute collaborators, allowing developers to define expectations on dependencies. Unit tests are typified by their execution speed and fine granularity, facilitating quick feedback loops during the coding cycle."
        },
        {
          text: "**Integration Testing**: Integration testing verifies the interactions and data exchanges among assembled software elements. Integration strategies determine how components are combined: top-down (relying on stubs for unfinished subcomponents), bottom-up (using drivers to execute low-level modules), sandwich/mixed (combining top-down and bottom-up), or big bang (integrating all components simultaneously). Integration testing focuses on interface compatibility, communication protocols, interoperability, and correctness across module boundaries. Top-down integration relies heavily on stubs to simulate calls to lower-level procedures that are not yet built, whereas bottom-up integration requires drivers to invoke higher-level modules. Sandwich testing combines these strategies to reduce dependency bottlenecking. In modern distributed architectures, integration testing must also verify network transmission payloads, JSON schemas, CORS policies, and REST endpoints to ensure that independent services collaborate reliably."
        },
        {
          text: "**System Testing**: System testing concern the behavior of the complete SUT. Once unit and integration testing have eliminated localized defects, system testing validates end-to-end user transactions and verifies non-functional system requirements (such as overall response times, security, privacy, and system reliability) under realistic loads and environmental conditions. System testing is often performed by a separate testing team in an environment that matches the production topology as closely as possible. It is during system testing that end-to-end user transactions are validated, confirming that the collection of integrated packages functions as a single unified system. This includes verifying state transitions across distributed databases, API gateways, cache layers, and message buses."
        },
        {
          text: "**Acceptance Testing**: Acceptance testing targets the deployment readiness of the system. Its primary goal is to verify that the system satisfies business requirements and user expectations. Acceptance testing is run by or with end-users and includes usability validation and operational acceptance tests (such as backup and restore verification). Pre-defining acceptance tests before coding is the core practice of Acceptance Test-Driven Development (ATDD)."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Objectives of Testing",
      type: "header"
    },
    {
      text: "Testing is guided by specific objectives that verify various functional and non-functional characteristics of the software:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Conformance and Compliance Testing**: Conformance testing verifies that the software matches specifications, designs, standards, and practices. Compliance testing demonstrates adherence to laws, safety mandates, and industry regulations (such as medical or financial standards), which are often audited by external regulatory bodies."
        },
        {
          text: "**Installation, Alpha, and Beta Testing**: Installation testing verifies the system after it is deployed in the target operational environment, validating hardware configurations and installation procedures. Alpha testing involves trial use by a small group of potential users in a controlled environment. Beta testing releases the software to a wider, representative user base for uncontrolled use to report real-world defects."
        },
        {
          text: "**Regression Testing**: Regression testing is the selective retesting of a modified system to verify that changes have not caused unintended defects and that the system still complies with requirements. It is a fundamental activity in Agile, DevOps, and Continuous Integration, requiring a balance between testing assurance and pipeline execution costs. This balance is managed through test suite minimization (removing redundant tests), selection, and prioritization."
        },
        {
          text: "**Prioritization Testing**: Test case prioritization schedules tests to maximize early fault detection and code coverage. This is often managed using heuristics, such as similarity-based prioritization, which executes the most dissimilar test cases first based on a distance metric to discover defects quickly."
        },
        {
          text: "**Non-functional Testing**: Non-functional testing targets specific system characteristics:\n- *Performance, Load, and Stress Testing*: Performance testing verifies capacity and response times. Load testing evaluates behavior under expected peak usage to detect resource leaks, deadlocks, and memory leaks. Stress testing pushes the system beyond its limits to observe recovery behaviors.\n- *Volume and Failover Testing*: Volume testing verifies system behavior under large data quantities. Failover testing validates the system's ability to allocate redundant resources and continue operations during crash scenarios.\n- *Reliability and Elasticity Testing*: Reliability testing evaluates execution failure rates under statistical models of user behavior (operational profiles). Elasticity testing assesses cloud resources' ability to automatically expand and shrink under load. Reliability testing is evaluated using statistical profiles that replicate real-world user activity, allowing engineers to estimate Mean Time to Failure (MTTF). In cloud infrastructures, elasticity testing measures how quickly the system scales computational nodes up or down when traffic spikes, ensuring that resources are allocated efficiently without violating Service Level Agreements (SLAs).\n- *Infrastructure, Back-to-Back, and Recovery Testing*: Infrastructure testing validates system hosting configurations. Back-to-Back testing executes multiple variants of a program with identical inputs to compare outputs. Recovery testing verifies system restart capabilities after crashes or disasters. Back-to-back testing runs identical test inputs across two different versions of a system (for example, a legacy version and a refactored version) and compares outputs byte-for-byte to check for regressions. Recovery testing verifies the system's crash recovery protocols, assessing database recovery, file system consistency, log parsing, and automatic failover switch times during power or network outages."
        },
        {
          text: "**Security and Privacy Testing**: Security testing validates confidentiality, integrity, availability, and protection against external attacks, including negative testing to verify how the system handles misuse. Privacy testing evaluates personal data protection, sharing policies, and decentralized storage configurations. Security testing includes static scans, dynamic analysis, and penetration testing (negative testing) to identify injection flaws, authorization gaps, and resource exhaustions. Privacy testing audits how sensitive data is logged, stored, and shared, ensuring that encryption keys and personal identification info (PII) are managed in compliance with global data protection regulations."
        },
        {
          text: "**Interface, Configuration, and Usability Testing**: Interface testing verifies correct data exchange across APIs using parameter mutation. Configuration testing validates the system across specified configurations (such as browsers or operating systems). Usability testing evaluates how easily end-users learn and navigate the system."
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
          text: "Were the targets of testing clearly defined and separated into unit, integration, system, and acceptance stages?"
        },
        {
          text: "Did the integration testing plan specify a strategy (top-down, bottom-up, mixed, or big bang) to verify interface interactions?"
        },
        {
          text: "Was system testing configured to validate the complete SUT, including non-functional requirements like speed, accuracy, and reliability?"
        },
        {
          text: "Were acceptance tests defined prior to implementation to support Acceptance Test-Driven Development (ATDD) objectives?"
        },
        {
          text: "Did the team execute conformance and compliance testing to verify adherence to design specifications and legal regulations?"
        },
        {
          text: "Were installation testing, alpha testing, and beta testing conducted to evaluate the software in target user environments?"
        },
        {
          text: "Was regression testing integrated into the CI/CD pipeline to ensure modifications did not introduce side effects?"
        },
        {
          text: "Did the team apply test case minimization or prioritization (such as similarity-based heuristics) to optimize execution time?"
        },
        {
          text: "Were non-functional properties (performance, load, stress, volume, failover, and elasticity) validated under simulated peak load conditions?"
        },
        {
          text: "Did reliability testing evaluate the software using statistical models based on real-world operational profiles?"
        },
        {
          text: "Were security testing (negative abuse cases) and privacy testing (personal data protection) executed to safeguard system assets?"
        },
        {
          text: "Were interface, configuration, and usability testing conducted to verify API communication, platform compatibility, and user learnability?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "software testing levels, test targets, unit testing, integration testing, system testing, acceptance testing, conformance testing, compliance testing, installation testing, alpha and beta testing, regression testing, test prioritization, non-functional testing, performance testing, load testing, stress testing, volume testing, failover testing, reliability testing, compatibility testing, scalability testing, elasticity testing, infrastructure testing, back-to-back testing, recovery testing, security testing, privacy testing, interface testing, configuration testing, usability testing",
  filename: "testing-levels",
  trigger: "model_decision"
});
