---
description: Comprehensive software development lifecycle (SDLC) director linking all 80+ workspace rules grouped by phase. Load this skill to navigate the development process.
name: sdlc
---

# Software Development Lifecycle (SDLC) Workflow Guide

This skill acts as a workflow director to guide you through the software development process in this monorepo. It organizes all 80+ global rules into 6 distinct SDLC phases. For each phase, reference the specific rules and load the relevant skills.

---

## Phase 1: Requirements & Analysis
Focus on discovering, defining, and scoping stakeholder requirements. Establish boundaries before writing any code.

### Phase 1 Checklists & Rules
- [requirements-elicitation](file:///.agents/rules/requirements-elicitation.md) - Active stakeholder discovery and clarification loops.
- [requirements-attributes](file:///.agents/rules/requirements-attributes.md) - Requirements validation attributes (testability, unambiguity).
- [requirements-completeness](file:///.agents/rules/requirements-completeness.md) - Complete and consistent requirements validation criteria.
- [requirements-change-control](file:///.agents/rules/requirements-change-control.md) - Managing scope change requests and agreements.
- [requirements-prioritization](file:///.agents/rules/requirements-prioritization.md) - MoSCoW prioritization and value-cost tradeoffs.
- [requirements-traceability](file:///.agents/rules/requirements-traceability.md) - Mappings between requirements, implementation, and tests.
- [user-story-specification](file:///.agents/rules/user-story-specification.md) - BDD behavior specs via Given-When-Then criteria.
- [scope-matching](file:///.agents/rules/scope-matching.md) - Prioritizing work within budget and schedule constraints.
- [effort-estimation](file:///.agents/rules/effort-estimation.md) - COCOMO, function points, and calibration.
- [risk-management](file:///.agents/rules/risk-management.md) - Constructing risk registers and mitigation strategies.
- [software-lifecycles](file:///.agents/rules/software-lifecycles.md) - Choosing the appropriate lifecycle models and entry/exit criteria.
- [process-measurement](file:///.agents/rules/process-measurement.md) - Defect density and cycle time measurements.
- [professional-ethics](file:///.agents/rules/professional-ethics.md) - Public interest, professional competency, and code of conduct.
- [cost-benefit-analysis](file:///.agents/rules/cost-benefit-analysis.md) - Buy vs build, ROI, and technical debt valuations.

### Relevant Skills
- [clinical-trials-database](file:///.agents/skills/clinical-trials-database/SKILL.md) (if dealing with trial data requirements)
- [openfda-database](file:///.agents/skills/openfda-database/SKILL.md) (if analyzing regulatory requirements)

---

## Phase 2: Architecture & Design
Translate requirements into software architectures. Focus on coupling, database design, domain modeling, and technical patterns.

### Phase 2 Checklists & Rules
- [ddd-strategic](file:///.agents/rules/ddd-strategic.md) - Bounded contexts, context boundaries, and ubiquitous language.
- [ddd-tactical](file:///.agents/rules/ddd-tactical.md) - CQRS patterns, Specifications, Value Objects, and Domain Events.
- [atomic-design](file:///.agents/rules/atomic-design.md) - Modularity rules for React components and Hono/Cloudflare Worker routes.
- [architectural-documentation](file:///.agents/rules/architectural-documentation.md) - Descriptions, viewpoints, and notations (e.g. C4 model).
- [architectural-synthesis](file:///.agents/rules/architectural-synthesis.md) - ASRs, architectural patterns, and ADD.
- [architectural-evaluation](file:///.agents/rules/architectural-evaluation.md) - Evaluating architectures via ATAM, design trade-offs, and quality attributes.
- [architectural-tactics](file:///.agents/rules/architectural-tactics.md) - Tactics for availability, performance, and security.
- [conways-law](file:///.agents/rules/conways-law.md) - Organization structures and boundaries.
- [coupling-and-cohesion](file:///.agents/rules/coupling-and-cohesion.md) - Separation of concerns and dependency direction.
- [information-hiding](file:///.agents/rules/information-hiding.md) - Encapsulation, API design, and public interfaces.
- [interface-control](file:///.agents/rules/interface-control.md) - API stability and inter-module isolation.
- [database-normalization](file:///.agents/rules/database-normalization.md) - Relational schema design (3NF, constraints, and indexes).
- [security-by-design](file:///.agents/rules/security-by-design.md) - OWASP Top 10, CIA Triad, STRIDE threat modeling.
- [internationalization-strings](file:///.agents/rules/internationalization-strings.md) - String isolation and locale management.
- [design-quality-reviews](file:///.agents/rules/design-quality-reviews.md) - SDD sufficiency, quality reviews, and design audits.
- [design-completeness](file:///.agents/rules/design-completeness.md) - Requirements mapping and state space coverage.
- [quality-assurance-reviews](file:///.agents/rules/quality-assurance-reviews.md) - Peer design reviews, inspections, and checklists.

### Relevant Skills
- [durable-objects](file:///.agents/skills/durable-objects/SKILL.md) (stateful coordination design)
- [agents-sdk](file:///.agents/skills/agents-sdk/SKILL.md) (agent-based architecture design)

---

## Phase 3: Implementation & Development
Build production code using pair programming practices. Optimize tool usage and adhere to coding rules.

### Phase 3 Checklists & Rules
- [philosophy](file:///.agents/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints.
- [workspace-tools](file:///.agents/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use `rtk` command prefixes.
- [eslint-self-learning](file:///.agents/rules/eslint-self-learning.md) - Resolving lint issues, TypeScript check violations, and syntax errors.
- [maintainability-clean-code](file:///.agents/rules/maintainability-clean-code.md) - Descriptive naming, single responsibility.
- [table-driven-construction](file:///.agents/rules/table-driven-construction.md) - Lookup tables and state transition maps.
- [concurrency-control](file:///.agents/rules/concurrency-control.md) - Concurrency primitives, locks, and thread safety.
- [boolean-logic](file:///.agents/rules/boolean-logic.md) - Logic simplification and De Morgan's laws.
- [exception-handling-policy](file:///.agents/rules/exception-handling-policy.md) - Exception handling and central logging policies.
- [intellectual-property](file:///.agents/rules/intellectual-property.md) - Compliance with open source licenses and IP attribution.
- [privacy-data-protection](file:///.agents/rules/privacy-data-protection.md) - PII protection and data minimization.

### Relevant Skills
- [cloudflare](file:///.agents/skills/cloudflare/SKILL.md) (Cloudflare platform implementation)
- [wrangler](file:///.agents/skills/wrangler/SKILL.md) (Wrangler configuration and CLI)
- [sandbox-sdk](file:///.agents/skills/sandbox-sdk/SKILL.md) (sandbox creation and execution)
- [turnstile-spin](file:///.agents/skills/turnstile-spin/SKILL.md) (Turnstile integration)

---

## Phase 4: Verification & Testing
Verify system functionality against specification. Follow TDD strictly.

### Phase 4 Checklists & Rules
- [tdd-discipline](file:///.agents/rules/tdd-discipline.md) - Red-Green-Refactor method.
- [tdd-principles](file:///.agents/rules/tdd-principles.md) - Parameterized tests, RED/GREEN validation, and trust-the-problem discipline.
- [tdd-state-coverage](file:///.agents/rules/tdd-state-coverage.md) - State tables, FSM enumerations, and async/form/auth scenarios.
- [tdd-test-as-documentation](file:///.agents/rules/tdd-test-as-documentation.md) - Descriptive naming, mock setups, and contract validation.
- [test-first-programming](file:///.agents/rules/test-first-programming.md) - Test-first coding loops and immediate design feedback.
- [test-levels](file:///.agents/rules/test-levels.md) - Defining boundaries for unit, integration, and acceptance tests.
- [test-completion-criteria](file:///.agents/rules/test-completion-criteria.md) - Objective code coverage and verification targets.
- [test-process-documentation](file:///.agents/rules/test-process-documentation.md) - Configuration management and documentation for test suites.
- [boundary-value-analysis](file:///.agents/rules/boundary-value-analysis.md) - Test design for boundary and off-by-one errors.
- [equivalence-partitioning](file:///.agents/rules/equivalence-partitioning.md) - Input domain partitions to optimize testing coverage.
- [mutation-testing-adequacy](file:///.agents/rules/mutation-testing-adequacy.md) - Verifying assertion adequacy via mutation analysis.
- [regression-testing-strategy](file:///.agents/rules/regression-testing-strategy.md) - Running regression suites on modification.
- [experience-based-testing](file:///.agents/rules/experience-based-testing.md) - Error guessing, checklists, and exploratory testing.
- [formal-methods](file:///.agents/rules/formal-methods.md) - Specifications, pre/post-conditions, and mathematical verification.
- [state-based-modeling](file:///.agents/rules/state-based-modeling.md) - FSM modeling and state transition verification.
- [verification](file:///.agents/rules/verification.md) - Executing builds, tests, and lint checks.
- [verification-vs-validation](file:///.agents/rules/verification-vs-validation.md) - Conformance to specs vs. user correctness.
- [linter-quality-gates](file:///.agents/rules/linter-quality-gates.md) - Static analysis checks.
- [security-vulnerability-scanning](file:///.agents/rules/security-vulnerability-scanning.md) - `pnpm audit` and vulnerability fixes.
- [empirical-experiments](file:///.agents/rules/empirical-experiments.md) - Statistical analysis and benchmarking.

### Relevant Skills
- [web-perf](file:///.agents/skills/web-perf/SKILL.md) (performance audits and profiling)

---

## Phase 5: Release & Deployment
Prepare changes for repository integration, staging, and deployment.

### Phase 5 Checklists & Rules
- [conventional-commits](file:///.agents/rules/conventional-commits.md) - Staging, commit scopes, and PR creation.
- [actor-action-format](file:///.agents/rules/actor-action-format.md) - Descriptive actor-action structure for commit/PR messages.
- [automated-release-engineering](file:///.agents/rules/automated-release-engineering.md) - Repeatable deployments and build scripts.
- [configuration-baselines](file:///.agents/rules/configuration-baselines.md) - Library versions and configuration baselines.
- [configuration-change-process](file:///.agents/rules/configuration-change-process.md) - SCM hygiene and change request controls.
- [rollback-revert-planning](file:///.agents/rules/rollback-revert-planning.md) - Recovery planning, targeted git restore.

---

## Phase 6: Maintenance & Operations
Monitor production health, handle bugs/incidents, and manage refactoring cycles.

### Phase 6 Checklists & Rules
- [maintenance-classification](file:///.agents/rules/maintenance-classification.md) - Corrective, adaptive, perfective, and preventive changes.
- [maintenance-impact-analysis](file:///.agents/rules/maintenance-impact-analysis.md) - Dependency inspections and regression scope checks.
- [performance-tuning](file:///.agents/rules/performance-tuning.md) - Execution profiling and query plan optimizations.
- [operations-monitoring](file:///.agents/rules/operations-monitoring.md) - SLA metrics, capacity planning, and structured logs.
- [incident-vs-problem-management](file:///.agents/rules/incident-vs-problem-management.md) - 5-Whys root cause analysis, resolving incident flows.
- [technical-debt-valuation](file:///.agents/rules/technical-debt-valuation.md) - Technical debt valuation and refactoring cycles.
- [review-edge-cases](file:///.agents/rules/review-edge-cases.md) - Code reviews, diff inspections, and edge case coverage.
- [reverse-engineering](file:///.agents/rules/reverse-engineering.md) - Reading call stacks, tracing execution logs.
