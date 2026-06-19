import { defineSkill } from "../../define.ts";

export const sdlc = defineSkill({
  content: `# Software Development Lifecycle (SDLC) Workflow Guide

This skill acts as a workflow director to guide you through the software development process in this monorepo. It organizes all 80+ global rules into 6 distinct SDLC phases. You must execute all phases in the main window context to maintain continuity of state, memory, and conversation.

## Main Window Execution Strategy
1. **Direct Execution**: Perform the checklists, rules, and step-by-step plans for each phase directly within the main window conversation.
2. **Optional Subagent Delegation**: While you are responsible for running the main flow in the main window, you may optionally spawn subagents (using the \`self\` or \`research\` subagent types) if you need to:
   - Perform extensive or parallel research on the codebase to minimize token usage and latency.
   - Run parallel validation, testing, or linting tasks.
   - Isolate complex, independent subtasks.
3. **Sequence**: Proceed sequentially through the phases (Phase 1 through Phase 6), ensuring entry and exit criteria are validated.

Example of optionally spawning a research subagent to audit dependencies during Phase 2:
\`\`\`json
{
  "Subagents": [
    {
      "TypeName": "research",
      "Role": "Dependency Auditor",
      "Prompt": "Analyze the dependencies of package X and report back any conflicts or security risks."
    }
  ]
}
\`\`\`

---

## Phase 1: Requirements & Analysis
Focus on discovering, defining, and scoping stakeholder requirements. Establish boundaries before writing any code.

### Optional Subagent Profile (For Delegation)
- **Role**: \`Requirements Elicitor\`
- **Prompt**:
  \`\`\`
  Execute Phase 1 (Requirements & Analysis) for the following task: <task description>.
  Conduct the structured elicitation interview, define persona user stories with Given-When-Then acceptance criteria, map out the ubiquitous language glossary, and compile/validate SARA-compliant requirements documentation under \`docs/<feature-name>/\`.
  \`\`\`

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

### Step-by-Step Execution Plan (Main Window or Subagent)
1. **Elicitation & Requirements Gathering Interview**: Conduct an interactive interview. Ask the user clear questions to cover: core objectives, persona and user story definitions, behavioral acceptance criteria (happy path, boundary/validation path, exception/error path), MoSCoW prioritization, and constraints/risks.
2. **Ubiquitous Language Glossary**: Create a dictionary of domain terms and map them explicitly to codebase elements (database columns, endpoints, component names). Resolve any semantic conflicts or naming mismatches.
3. **Write SARA-Compliant Documents**: Write the gathered requirements as SARA-compatible Markdown files under \`docs/<feature-name>/\` with well-formed YAML frontmatter.
4. **Validate and Verify the Graph**: Run \`rtk sara check\` or \`rtk sara validate\` to verify the integrity of the requirements graph.
5. **Baseline Freeze**: Present a final summary of the requirements graph structure and freeze the baseline in the implementation plan.

---

## Phase 2: Architecture & Design
Translate requirements into software architectures. Focus on coupling, database design, domain modeling, and technical patterns.

### Optional Subagent Profile (For Delegation)
- **Role**: \`Architect\`
- **Prompt**:
  \`\`\`
  Execute Phase 2 (Architecture & Design) for the following task: <task description>.
  Ingest the Phase 1 requirements, inspect the monorepo context, conduct the architecture design interview (DDD strategic/tactical boundary crossings, 3NF schema, and Mermaid C4/ER diagrams), and write SARA-compliant design documents under \`docs/<feature-name>/\`.
  \`\`\`

### Phase 2 Checklists & Rules
- [ddd-strategic](file:///.agents/rules/ddd-strategic.md) - Bounded contexts, context boundaries, and ubiquitous language.
- [ddd-tactical](file:///.agents/rules/ddd-tactical.md) - CQRS patterns, Specifications, Value Objects, and Domain Events.
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

### Step-by-Step Execution Plan (Main Window or Subagent)
1. **Ingest Phase 1 Requirements**: Locate SARA requirements under \`docs/<feature-name>/\`. Run \`rtk sara check\`. If missing or invalid, halt and notify.
2. **System Context Inspection**: Query Wrangler/Drizzle config, check DB schemas, GraphQL supergraph, and active services.
3. **Interactive Architecture Interview**: Conduct an interactive interview to cover strategic/tactical DDD (bounded contexts, value objects, domain events), 3NF database schema, Mermaid diagram specs, and architectural tactics (performance, security, caching).
4. **Write SARA-Compliant Design**: Save files with type \`system_architecture\` or \`software_detailed_design\` under \`docs/<feature-name>/\`. Ensure they use \`satisfies\` to trace back to requirements.
5. **Validate Design Graph**: Run \`rtk sara check\` to verify the integrated requirements and design graph.

---

## Phase 3: Implementation & Development
Build production code using pair programming practices. Optimize tool usage and adhere to coding rules.

### Optional Subagent Profile (For Delegation)
- **Role**: \`Developer\`
- **Prompt**:
  \`\`\`
  Execute Phase 3 (Implementation & Development) for the following task: <task description>.
  Validate the design graph using SARA, implement the feature following a strict Red-Green-Refactor TDD loop, enforce monorepo coding standards (arrow functions, accessibility modifiers, Yoda comparisons, no native Date, bracket index signature access), and use WebStorm MCP VFS-safe writes.
  \`\`\`

### Phase 3 Checklists & Rules
- [philosophy](file:///.agents/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints.
- [workspace-tools](file:///.agents/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use \`rtk\` command prefixes.
- [eslint-self-learning](file:///.agents/rules/eslint-self-learning.md) - Resolving lint issues, TypeScript check violations, and syntax errors.
- [maintainability-clean-code](file:///.agents/rules/maintainability-clean-code.md) - Descriptive naming, single responsibility.
- [table-driven-construction](file:///.agents/rules/table-driven-construction.md) - Lookup tables and state transition maps.
- [concurrency-control](file:///.agents/rules/concurrency-control.md) - Concurrency primitives, locks, and thread safety.
- [boolean-logic](file:///.agents/rules/boolean-logic.md) - Logic simplification and De Morgan's laws.
- [exception-handling-policy](file:///.agents/rules/exception-handling-policy.md) - Exception handling and central logging policies.
- [intellectual-property](file:///.agents/rules/intellectual-property.md) - Compliance with open source licenses and IP attribution.
- [privacy-data-protection](file:///.agents/rules/privacy-data-protection.md) - PII protection and data minimization.
- [cloudflare](file:///.agents/skills/cloudflare/SKILL.md) (Cloudflare platform implementation)
- [wrangler](file:///.agents/skills/wrangler/SKILL.md) (Wrangler configuration and CLI)
- [sandbox-sdk](file:///.agents/skills/sandbox-sdk/SKILL.md) (sandbox creation and execution)
- [turnstile-spin](file:///.agents/skills/turnstile-spin/SKILL.md) (Turnstile integration)

### Step-by-Step Execution Plan (Main Window or Subagent)
1. **Pre-Implementation Graph Validation**: Run \`rtk sara check\`. Halt if validation fails or design files are missing.
2. **Strict TDD Verification Loop**: For every module:
   - **Red**: Write a failing test in \`*.test.ts\` in the target directory and run \`rtk pnpm --filter <package> test\` to watch it fail.
   - **Green**: Implement minimal code to pass the test.
   - **Refactor**: Clean up the code. Enforce arrow functions, explicit accessibility modifiers, Yoda comparisons, no native Date, bracket notation, type inference.
3. **Coding Standards Enforcement**: Ensure strict project compliance.
4. **ESLint Auto-Fix Loop Guard**: Run linting checks. Autofix up to 3 rounds. Halt if issues persist.
5. **Final Graph Verification**: Run \`rtk sara check\` to verify requirements, design, and code trace links.

---

## Phase 4: Verification & Testing
Verify system functionality against specification. Follow TDD strictly.

### Optional Subagent Profile (For Delegation)
- **Role**: \`QA Engineer\`
- **Prompt**:
  \`\`\`
  Execute Phase 4 (Verification & Testing) for the following task: <task description>.
  Run package tests with coverage enabled, parse coverage summaries, analyze state space partitions for any gaps, execute the FSM-based TDDFixLoop, run the linter and build, and run the final SARA graph check.
  \`\`\`

### Phase 4 Checklists & Rules
- [tdd-discipline](file:///.agents/rules/tdd-discipline.md) - Red-Green-Refactor method.
- [tdd-principles](file:///.agents/rules/tdd-principles.md) - Parameterized tests, RED/GREEN validation, and trust-the-problem discipline.
- [tdd-state-coverage](file:///.agents/rules/tdd-state-coverage.md) - State tables, FSM enumerations, and async/form/auth scenarios.
- [tdd-test-as-documentation](file:///.agents/rules/tdd-test-as-documentation.md) - Descriptive naming, mock setups, and contract validation.
- [boundary-value-analysis](file:///.agents/rules/boundary-value-analysis.md) - Test design for boundary and off-by-one errors.
- [equivalence-partitioning](file:///.agents/rules/equivalence-partitioning.md) - Input domain partitions to optimize testing coverage.
- [mutation-testing-adequacy](file:///.agents/rules/mutation-testing-adequacy.md) - Verifying assertion adequacy via mutation analysis.
- [regression-testing-strategy](file:///.agents/rules/regression-testing-strategy.md) - Running regression suites on modification.
- [verification-vs-validation](file:///.agents/rules/verification-vs-validation.md) - Conformance to specs vs. user correctness.
- [linter-quality-gates](file:///.agents/rules/linter-quality-gates.md) - Static analysis checks.

### Relevant Skills
- [web-perf](file:///.agents/skills/web-perf/SKILL.md) (performance audits and profiling)

### Step-by-Step Execution Plan (Main Window or Subagent)
1. **Verification FSM Flow**:
   - **GraphCheck**: Run \`rtk sara check\`.
   - **CoverageRun**: Run tests with coverage: \`rtk pnpm --filter <package> test --coverage\`.
   - **ParseCoverage**: Analyze \`coverage/coverage-summary.json\` for uncovered lines.
   - **StateSpaceAnalysis**: Perform static analysis on uncovered blocks (empty/zero, null/missing, extreme bounds, exceptional path, async state).
   - **DecideRemediation**: Enter TDDFixLoop if gaps exist, otherwise RunLinter.
   - **TDDFixLoop**: Red-Green-Refactor loop targeting uncovered states. Wrap void method calls in \`expect(() => ...).not.toThrow()\`. Loop back to CoverageRun.
   - **RunLinter**: Lint checks with up to 3 autofix iterations.
   - **RunBuild**: Build the package: \`rtk pnpm --filter <package> build\`.
   - **FinalGraphCheck**: Run \`rtk sara check\`.
2. **Safety Gates**: Use targeted restores (\`rtk git restore <file>\`) rather than global resets. Validate package names to reject path traversals (\`..\`).

---

## Phase 5: Release & Deployment
Prepare changes for repository integration, staging, and deployment.

### Optional Subagent Profile (For Delegation)
- **Role**: \`Release Specialist\`
- **Prompt**:
  \`\`\`
  Execute Phase 5 (Release & Deployment) for the following task: <task description>.
  Perform branch safety checks (checkout new branch if on master/main), stage all modified files, analyze git diff to generate a Conventional Commit header and atomic Actor-Action body messages, commit, push remote tracking origin, and submit a PR using the GitHub CLI.
  \`\`\`

### Phase 5 Checklists & Rules
- [actor-action-format](file:///.agents/rules/actor-action-format.md) - Descriptive actor-action structure for commit/PR messages.
- [automated-release-engineering](file:///.agents/rules/automated-release-engineering.md) - Repeatable deployments and build scripts.
- [configuration-baselines](file:///.agents/rules/configuration-baselines.md) - Library versions and configuration baselines.
- [configuration-change-process](file:///.agents/rules/configuration-change-process.md) - SCM hygiene and change request controls.
- [rollback-revert-planning](file:///.agents/rules/rollback-revert-planning.md) - Recovery planning, targeted git restore.

### Step-by-Step Execution Plan (Main Window or Subagent)
1. **Pre-Execution Graph Validation**: Run \`rtk sara check\`. Halt if it fails.
2. **Branch Safety Gate**: Query current branch. If on \`master\` or \`main\`, checkout a sanitized new feature branch.
3. **Staging Changes**: Run \`rtk git add .\`. Verify changes are staged using git status.
4. **Diff Analysis & Message Generation**: Inspect staged diffs. Compile Conventional Commit message:
   - Header format: \`<type>(<scope>): <lowercase description>\`
   - Body format: \`<Actor>: <Action>\` (Actor-Action format, blank line after header).
5. **Commit Changes**: Commit the staged files using the compiled message.
6. **Push Branch**: Push commits to origin tracking branch: \`rtk git push -u origin <branch>\`.
7. **Open Pull Request**: Use GitHub CLI: \`rtk gh pr create --title "<header>" --body "<body>"\`.
8. **Final Graph Verification**: Run \`rtk sara check\` to verify.

---

## Phase 6: Maintenance & Operations
Monitor production health, handle bugs/incidents, and manage refactoring cycles.

### Optional Subagent Profile (For Delegation)
- **Role**: \`Operations Specialist\`
- **Prompt**:
  \`\`\`
  Execute Phase 6 (Maintenance & Operations) for the following task: <task description>.
  Run pre-execution graph check, check current Git diff, ingest remote CI failure logs or SonarCloud reports, categorize issues, conduct dependency impact scans across monorepo packages, apply safe programmatic repairs (duplicate strings, type loosening, constructible mocks), and run targeted verification.
  \`\`\`

### Phase 6 Checklists & Rules
- [maintenance-classification](file:///.agents/rules/maintenance-classification.md) - Corrective and perfective modifications.
- [maintenance-impact-analysis](file:///.agents/rules/maintenance-impact-analysis.md) - Workspace package dependency impact scans.
- [performance-tuning](file:///.agents/rules/performance-tuning.md) - Execution profiling and query plan optimizations.
- [operations-monitoring](file:///.agents/rules/operations-monitoring.md) - SLA metrics, capacity planning, and structured logs.
- [incident-vs-problem-management](file:///.agents/rules/incident-vs-problem-management.md) - 5-Whys root cause analysis, resolving incident flows.
- [technical-debt-valuation](file:///.agents/rules/technical-debt-valuation.md) - Technical debt valuation and refactoring cycles.
- [reverse-engineering](file:///.agents/rules/reverse-engineering.md) - Reading call stacks, tracing execution logs.

### Step-by-Step Execution Plan (Main Window or Subagent)
1. **Pre-Execution Graph Check**: Run \`rtk sara check\`. Halt on failure.
2. **Check Git Diff**: Run \`rtk git diff --name-only\` to identify modified package scopes.
3. **Ingest Failure Reports**: Retrieve remote checks status with \`rtk gh pr checks\` and workflow logs with \`rtk gh run view <run-id> --log\`. View SonarCloud issues. Halt on missing/empty reports.
4. **Categorize & Map**: Tag issues as Corrective or Perfective. Map downstream dependencies via tsconfig/package.json.
5. **Safe Programmatic Repairs**: Use WebStorm VFS-safe edits for:
   - **duplicate-string-resolver**: Centralize duplicates in test file or package \`test-constants.ts\`.
   - **type-loosening-resolver**: Add comment overrides and casts in test files to bypass TSC issues.
   - **constructible-mock-formatter**: Extract inline mock classes to their own mock files under \`__mocks__\` or \`test-utils/\` with explicit accessibility modifiers and arrow functions.
6. **Targeted Verification Loop**: Run lint and tests on affected packages. Up to 3 iterations.
7. **Final Graph Validation**: Run \`rtk sara check\`.
`,
  description:
    "Comprehensive software development lifecycle (SDLC) director linking all 80+ workspace rules grouped by phase. Load this skill to navigate the development process.",
  name: "sdlc"
});
