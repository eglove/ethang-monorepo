/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const sdlc = defineSkill({
  content: [
    {
      level: 1,
      text: "Software Development Lifecycle (SDLC) Workflow Guide",
      type: "header"
    },
    {
      text: "This skill acts as a workflow director to guide you through the software development process in this monorepo. It organizes all 80+ global rules into 6 distinct SDLC phases. You must execute all phases in the main window context to maintain continuity of state, memory, and conversation.",
      type: "text"
    },
    {
      level: 2,
      text: "Main Window Execution Strategy",
      type: "header"
    },
    {
      items: [
        {
          text: "**Direct Execution**: Perform the checklists, rules, and step-by-step plans for each phase directly within the main window conversation."
        },
        {
          text: "**Optional Subagent Delegation**: While you are responsible for running the main flow in the main window, you may optionally spawn subagents (using the `self` or `research` subagent types) if you need to:\n- Perform extensive or parallel research on the codebase to minimize token usage and latency.\n- Run parallel validation, testing, or linting tasks.\n- Isolate complex, independent subtasks."
        },
        {
          text: "**Sequence**: Proceed sequentially through the phases (Phase 1 through Phase 6), ensuring entry and exit criteria are validated."
        }
      ],
      type: "numberedList"
    },
    {
      text: "Example of optionally spawning a research subagent to audit dependencies during Phase 2:",
      type: "text"
    },
    {
      code: '{\n  "Subagents": [\n    {\n      "TypeName": "research",\n      "Role": "Dependency Auditor",\n      "Prompt": "Analyze the dependencies of package X and report back any conflicts or security risks."\n    }\n  ]\n}',
      language: "json",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Phase 1: Requirements & Analysis",
      type: "header"
    },
    {
      text: "Focus on discovering, defining, and scoping stakeholder requirements. Establish boundaries before writing any code.",
      type: "text"
    },
    {
      level: 3,
      text: "Optional Subagent Profile (For Delegation)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Role**: `Requirements Elicitor`"
        },
        {
          text: "**Prompt**:\n```\nExecute Phase 1 (Requirements & Analysis) for the following task: <task description>.\nConduct the structured elicitation interview, define persona user stories with Given-When-Then acceptance criteria, map out the ubiquitous language glossary, and compile/validate SARA-compliant requirements documentation under `docs/<feature-name>/`.\n```"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Phase 1 Checklists & Rules",
      type: "header"
    },
    {
      items: [
        {
          text: "[requirements-elicitation](file:///.junie/rules/requirements-elicitation.md) - Active stakeholder discovery and clarification loops."
        },
        {
          text: "[requirements-attributes](file:///.junie/rules/requirements-attributes.md) - Requirements validation attributes (testability, unambiguity)."
        },
        {
          text: "[requirements-completeness](file:///.junie/rules/requirements-completeness.md) - Complete and consistent requirements validation criteria."
        },
        {
          text: "[requirements-change-control](file:///.junie/rules/requirements-change-control.md) - Managing scope change requests and agreements."
        },
        {
          text: "[requirements-prioritization](file:///.junie/rules/requirements-prioritization.md) - MoSCoW prioritization and value-cost tradeoffs."
        },
        {
          text: "[requirements-traceability](file:///.junie/rules/requirements-traceability.md) - Mappings between requirements, implementation, and tests."
        },
        {
          text: "[user-story-specification](file:///.junie/rules/user-story-specification.md) - BDD behavior specs via Given-When-Then criteria."
        },
        {
          text: "[scope-matching](file:///.junie/rules/scope-matching.md) - Prioritizing work within budget and schedule constraints."
        },
        {
          text: "[effort-estimation](file:///.junie/rules/effort-estimation.md) - COCOMO, function points, and calibration."
        },
        {
          text: "[risk-management](file:///.junie/rules/risk-management.md) - Constructing risk registers and mitigation strategies."
        },
        {
          text: "[software-lifecycles](file:///.junie/rules/software-lifecycles.md) - Choosing the appropriate lifecycle models and entry/exit criteria."
        },
        {
          text: "[process-measurement](file:///.junie/rules/process-measurement.md) - Defect density and cycle time measurements."
        },
        {
          text: "[professional-ethics](file:///.junie/rules/professional-ethics.md) - Public interest, professional competency, and code of conduct."
        },
        {
          text: "[cost-benefit-analysis](file:///.junie/rules/cost-benefit-analysis.md) - Buy vs build, ROI, and technical debt valuations."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Relevant Skills",
      type: "header"
    },
    {
      items: [
        {
          text: "[clinical-trials-database](file:///.junie/skills/clinical-trials-database/SKILL.md) (if dealing with trial data requirements)"
        },
        {
          text: "[openfda-database](file:///.junie/skills/openfda-database/SKILL.md) (if analyzing regulatory requirements)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Step-by-Step Execution Plan (Main Window or Subagent)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Elicitation & Requirements Gathering Interview**: Conduct an interactive interview. Ask the user clear questions to cover: core objectives, persona and user story definitions, behavioral acceptance criteria (happy path, boundary/validation path, exception/error path), MoSCoW prioritization, and constraints/risks."
        },
        {
          text: "**Ubiquitous Language Glossary**: Create a dictionary of domain terms and map them explicitly to codebase elements (database columns, endpoints, component names). Resolve any semantic conflicts or naming mismatches."
        },
        {
          text: "**Write SARA-Compliant Documents**: Write the gathered requirements as SARA-compatible Markdown files under `docs/<feature-name>/` with well-formed YAML frontmatter."
        },
        {
          text: "**Validate and Verify the Graph**: Run `sara check` or `sara validate` to verify the integrity of the requirements graph."
        },
        {
          text: "**Baseline Freeze**: Present a final summary of the requirements graph structure and freeze the baseline in the implementation plan."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Phase 2: Architecture & Design",
      type: "header"
    },
    {
      text: "Translate requirements into software architectures. Focus on coupling, database design, domain modeling, and technical patterns.",
      type: "text"
    },
    {
      level: 3,
      text: "Optional Subagent Profile (For Delegation)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Role**: `Architect`"
        },
        {
          text: "**Prompt**:\n```\nExecute Phase 2 (Architecture & Design) for the following task: <task description>.\nIngest the Phase 1 requirements, inspect the monorepo context, conduct the architecture design interview (DDD strategic/tactical boundary crossings, 3NF schema, and Mermaid C4/ER diagrams), and write SARA-compliant design documents under `docs/<feature-name>/`.\n```"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Phase 2 Checklists & Rules",
      type: "header"
    },
    {
      items: [
        {
          text: "[ddd-strategic](file:///.junie/rules/ddd-strategic.md) - Bounded contexts, context boundaries, and ubiquitous language."
        },
        {
          text: "[ddd-tactical](file:///.junie/rules/ddd-tactical.md) - CQRS patterns, Specifications, Value Objects, and Domain Events."
        },
        {
          text: "[architectural-documentation](file:///.junie/rules/architectural-documentation.md) - Descriptions, viewpoints, and notations (e.g. C4 model)."
        },
        {
          text: "[architectural-synthesis](file:///.junie/rules/architectural-synthesis.md) - ASRs, architectural patterns, and ADD."
        },
        {
          text: "[architectural-evaluation](file:///.junie/rules/architectural-evaluation.md) - Evaluating architectures via ATAM, design trade-offs, and quality attributes."
        },
        {
          text: "[architectural-tactics](file:///.junie/rules/architectural-tactics.md) - Tactics for availability, performance, and security."
        },
        {
          text: "[conways-law](file:///.junie/rules/conways-law.md) - Organization structures and boundaries."
        },
        {
          text: "[coupling-and-cohesion](file:///.junie/rules/coupling-and-cohesion.md) - Separation of concerns and dependency direction."
        },
        {
          text: "[information-hiding](file:///.junie/rules/information-hiding.md) - Encapsulation, API design, and public interfaces."
        },
        {
          text: "[interface-control](file:///.junie/rules/interface-control.md) - API stability and inter-module isolation."
        },
        {
          text: "[database-normalization](file:///.junie/rules/database-normalization.md) - Relational schema design (3NF, constraints, and indexes)."
        },
        {
          text: "[security-by-design](file:///.junie/rules/security-by-design.md) - OWASP Top 10, CIA Triad, STRIDE threat modeling."
        },
        {
          text: "[internationalization-strings](file:///.junie/rules/internationalization-strings.md) - String isolation and locale management."
        },
        {
          text: "[design-quality-reviews](file:///.junie/rules/design-quality-reviews.md) - SDD sufficiency, quality reviews, and design audits."
        },
        {
          text: "[design-completeness](file:///.junie/rules/design-completeness.md) - Requirements mapping and state space coverage."
        },
        {
          text: "[quality-assurance-reviews](file:///.junie/rules/quality-assurance-reviews.md) - Peer design reviews, inspections, and checklists."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Relevant Skills",
      type: "header"
    },
    {
      items: [
        {
          text: "[durable-objects](file:///.junie/skills/durable-objects/SKILL.md) (stateful coordination design)"
        },
        {
          text: "[agents-sdk](file:///.junie/skills/agents-sdk/SKILL.md) (agent-based architecture design)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Step-by-Step Execution Plan (Main Window or Subagent)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Ingest Phase 1 Requirements**: Locate SARA requirements under `docs/<feature-name>/`. Run `sara check`. If missing or invalid, halt and notify."
        },
        {
          text: "**System Context Inspection**: Query Wrangler/Drizzle config, check DB schemas, GraphQL supergraph, and active services."
        },
        {
          text: "**Interactive Architecture Interview**: Conduct an interactive interview to cover strategic/tactical DDD (bounded contexts, value objects, domain events), 3NF database schema, Mermaid diagram specs, and architectural tactics (performance, security, caching)."
        },
        {
          text: "**Write SARA-Compliant Design**: Save files with type `system_architecture` or `software_detailed_design` under `docs/<feature-name>/`. Ensure they use `satisfies` to trace back to requirements."
        },
        {
          text: "**Validate Design Graph**: Run `sara check` to verify the integrated requirements and design graph."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Phase 3: Implementation & Development",
      type: "header"
    },
    {
      text: "Build production code using pair programming practices. Optimize tool usage and adhere to coding rules.",
      type: "text"
    },
    {
      level: 3,
      text: "Optional Subagent Profile (For Delegation)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Role**: `Developer`"
        },
        {
          text: "**Prompt**:\n```\nExecute Phase 3 (Implementation & Development) for the following task: <task description>.\nValidate the design graph using SARA, implement the feature following a strict Red-Green-Refactor TDD loop, enforce monorepo coding standards (arrow functions, accessibility modifiers, Yoda comparisons, no native Date, bracket index signature access), and use WebStorm MCP VFS-safe writes.\n```"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Phase 3 Checklists & Rules",
      type: "header"
    },
    {
      items: [
        {
          text: "[philosophy](file:///.junie/rules/philosophy.md) - Strict lifecycle execution, complete feedback loops, and user checkpoints."
        },
        {
          text: "[workspace-tools](file:///.junie/rules/workspace-tools.md) - Prioritize WebStorm MCP, ripgrep, jq, and Everything Search. Use `` command prefixes."
        },
        {
          text: "[eslint-self-learning](file:///.junie/rules/eslint-self-learning.md) - Resolving lint issues, TypeScript check violations, and syntax errors."
        },
        {
          text: "[maintainability-clean-code](file:///.junie/rules/maintainability-clean-code.md) - Descriptive naming, single responsibility."
        },
        {
          text: "[table-driven-construction](file:///.junie/rules/table-driven-construction.md) - Lookup tables and state transition maps."
        },
        {
          text: "[concurrency-control](file:///.junie/rules/concurrency-control.md) - Concurrency primitives, locks, and thread safety."
        },
        {
          text: "[boolean-logic](file:///.junie/rules/boolean-logic.md) - Logic simplification and De Morgan's laws."
        },
        {
          text: "[exception-handling-policy](file:///.junie/rules/exception-handling-policy.md) - Exception handling and central logging policies."
        },
        {
          text: "[intellectual-property](file:///.junie/rules/intellectual-property.md) - Compliance with open source licenses and IP attribution."
        },
        {
          text: "[privacy-data-protection](file:///.junie/rules/privacy-data-protection.md) - PII protection and data minimization."
        },
        {
          text: "[cloudflare](file:///.junie/skills/cloudflare/SKILL.md) (Cloudflare platform implementation)"
        },
        {
          text: "[wrangler](file:///.junie/skills/wrangler/SKILL.md) (Wrangler configuration and CLI)"
        },
        {
          text: "[sandbox-sdk](file:///.junie/skills/sandbox-sdk/SKILL.md) (sandbox creation and execution)"
        },
        {
          text: "[turnstile-spin](file:///.junie/skills/turnstile-spin/SKILL.md) (Turnstile integration)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Step-by-Step Execution Plan (Main Window or Subagent)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Pre-Implementation Graph Validation**: Run `sara check`. Halt if validation fails or design files are missing."
        },
        {
          text: "**Strict TDD Verification Loop**: For every module:\n- **Red**: Write a failing test in `*.test.ts` in the target directory and run `pnpm --filter <package> test` to watch it fail.\n- **Green**: Implement minimal code to pass the test.\n- **Refactor**: Clean up the code. Enforce arrow functions, explicit accessibility modifiers, Yoda comparisons, no native Date, bracket notation, type inference."
        },
        {
          text: "**Coding Standards Enforcement**: Ensure strict project compliance."
        },
        {
          text: "**ESLint Auto-Fix Loop Guard**: Run linting checks. Autofix up to 3 rounds. Halt if issues persist."
        },
        {
          text: "**Final Graph Verification**: Run `sara check` to verify requirements, design, and code trace links."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Phase 4: Verification & Testing",
      type: "header"
    },
    {
      text: "Verify system functionality against specification. Follow TDD strictly.",
      type: "text"
    },
    {
      level: 3,
      text: "Optional Subagent Profile (For Delegation)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Role**: `QA Engineer`"
        },
        {
          text: "**Prompt**:\n```\nExecute Phase 4 (Verification & Testing) for the following task: <task description>.\nRun package tests with coverage enabled, parse coverage summaries, analyze state space partitions for any gaps, execute the FSM-based TDDFixLoop, run the linter and build, and run the final SARA graph check.\n```"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Phase 4 Checklists & Rules",
      type: "header"
    },
    {
      items: [
        {
          text: "[tdd-discipline](file:///.junie/rules/tdd-discipline.md) - Red-Green-Refactor method."
        },
        {
          text: "[tdd-principles](file:///.junie/rules/tdd-principles.md) - Parameterized tests, RED/GREEN validation, and trust-the-problem discipline."
        },
        {
          text: "[tdd-state-coverage](file:///.junie/rules/tdd-state-coverage.md) - State tables, FSM enumerations, and async/form/auth scenarios."
        },
        {
          text: "[tdd-test-as-documentation](file:///.junie/rules/tdd-test-as-documentation.md) - Descriptive naming, mock setups, and contract validation."
        },
        {
          text: "[boundary-value-analysis](file:///.junie/rules/boundary-value-analysis.md) - Test design for boundary and off-by-one errors."
        },
        {
          text: "[equivalence-partitioning](file:///.junie/rules/equivalence-partitioning.md) - Input domain partitions to optimize testing coverage."
        },
        {
          text: "[mutation-testing-adequacy](file:///.junie/rules/mutation-testing-adequacy.md) - Verifying assertion adequacy via mutation analysis."
        },
        {
          text: "[regression-testing-strategy](file:///.junie/rules/regression-testing-strategy.md) - Running regression suites on modification."
        },
        {
          text: "[verification-vs-validation](file:///.junie/rules/verification-vs-validation.md) - Conformance to specs vs. user correctness."
        },
        {
          text: "[linter-quality-gates](file:///.junie/rules/linter-quality-gates.md) - Static analysis checks."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Relevant Skills",
      type: "header"
    },
    {
      items: [
        {
          text: "[web-perf](file:///.junie/skills/web-perf/SKILL.md) (performance audits and profiling)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Step-by-Step Execution Plan (Main Window or Subagent)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Verification FSM Flow**:\n- **GraphCheck**: Run `sara check`.\n- **CoverageRun**: Run tests with coverage: `pnpm --filter <package> test --coverage`.\n- **ParseCoverage**: Analyze `coverage/coverage-summary.json` for uncovered lines.\n- **StateSpaceAnalysis**: Perform static analysis on uncovered blocks (empty/zero, null/missing, extreme bounds, exceptional path, async state).\n- **DecideRemediation**: Enter TDDFixLoop if gaps exist, otherwise RunLinter.\n- **TDDFixLoop**: Red-Green-Refactor loop targeting uncovered states. Wrap void method calls in `expect(() => ...).not.toThrow()`. Loop back to CoverageRun.\n- **RunLinter**: Lint checks with up to 3 autofix iterations.\n- **RunBuild**: Build the package: `pnpm --filter <package> build`.\n- **FinalGraphCheck**: Run `sara check`."
        },
        {
          text: "**Safety Gates**: Use targeted restores (`git restore <file>`) rather than global resets. Validate package names to reject path traversals (`..`)."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Phase 5: Release & Deployment",
      type: "header"
    },
    {
      text: "Prepare changes for repository integration, staging, and deployment.",
      type: "text"
    },
    {
      level: 3,
      text: "Optional Subagent Profile (For Delegation)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Role**: `Release Specialist`"
        },
        {
          text: "**Prompt**:\n```\nExecute Phase 5 (Release & Deployment) for the following task: <task description>.\nPerform branch safety checks (checkout new branch if on master/main), stage all modified files, analyze git diff to generate a Conventional Commit header and atomic Actor-Action body messages, commit, push remote tracking origin, and submit a PR using the GitHub CLI.\n```"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Phase 5 Checklists & Rules",
      type: "header"
    },
    {
      items: [
        {
          text: "[actor-action-format](file:///.junie/rules/actor-action-format.md) - Descriptive actor-action structure for commit/PR messages."
        },
        {
          text: "[automated-release-engineering](file:///.junie/rules/automated-release-engineering.md) - Repeatable deployments and build scripts."
        },
        {
          text: "[configuration-baselines](file:///.junie/rules/configuration-baselines.md) - Library versions and configuration baselines."
        },
        {
          text: "[configuration-change-process](file:///.junie/rules/configuration-change-process.md) - SCM hygiene and change request controls."
        },
        {
          text: "[rollback-revert-planning](file:///.junie/rules/rollback-revert-planning.md) - Recovery planning, targeted git restore."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Step-by-Step Execution Plan (Main Window or Subagent)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Pre-Execution Graph Validation**: Run `sara check`. Halt if it fails."
        },
        {
          text: "**Branch Safety Gate**: Query current branch. If on `master` or `main`, checkout a sanitized new feature branch."
        },
        {
          text: "**Staging Changes**: Run `git add .`. Verify changes are staged using git status."
        },
        {
          text: "**Diff Analysis & Message Generation**: Inspect staged diffs. Compile Conventional Commit message:\n- Header format: `<type>(<scope>): <lowercase description>`\n- Body format: `<Actor>: <Action>` (Actor-Action format, blank line after header)."
        },
        {
          text: "**Commit Changes**: Commit the staged files using the compiled message."
        },
        {
          text: "**Push Branch**: Push commits to origin tracking branch: `git push -u origin <branch>`."
        },
        {
          text: '**Open Pull Request**: Use GitHub CLI: `gh pr create --title "<header>" --body "<body>"`.'
        },
        {
          text: "**Final Graph Verification**: Run `sara check` to verify."
        }
      ],
      type: "numberedList"
    },
    {
      level: 2,
      text: "Phase 6: Maintenance & Operations",
      type: "header"
    },
    {
      text: "Monitor production health, handle bugs/incidents, and manage refactoring cycles.",
      type: "text"
    },
    {
      level: 3,
      text: "Optional Subagent Profile (For Delegation)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Role**: `Operations Specialist`"
        },
        {
          text: "**Prompt**:\n```\nExecute Phase 6 (Maintenance & Operations) for the following task: <task description>.\nRun pre-execution graph check, check current Git diff, ingest remote CI failure logs or SonarCloud reports, categorize issues, conduct dependency impact scans across monorepo packages, apply safe programmatic repairs (duplicate strings, type loosening, constructible mocks), and run targeted verification.\n```"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Phase 6 Checklists & Rules",
      type: "header"
    },
    {
      items: [
        {
          text: "[maintenance-classification](file:///.junie/rules/maintenance-classification.md) - Corrective and perfective modifications."
        },
        {
          text: "[maintenance-impact-analysis](file:///.junie/rules/maintenance-impact-analysis.md) - Workspace package dependency impact scans."
        },
        {
          text: "[performance-tuning](file:///.junie/rules/performance-tuning.md) - Execution profiling and query plan optimizations."
        },
        {
          text: "[operations-monitoring](file:///.junie/rules/operations-monitoring.md) - SLA metrics, capacity planning, and structured logs."
        },
        {
          text: "[incident-vs-problem-management](file:///.junie/rules/incident-vs-problem-management.md) - 5-Whys root cause analysis, resolving incident flows."
        },
        {
          text: "[technical-debt-valuation](file:///.junie/rules/technical-debt-valuation.md) - Technical debt valuation and refactoring cycles."
        },
        {
          text: "[reverse-engineering](file:///.junie/rules/reverse-engineering.md) - Reading call stacks, tracing execution logs."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "Step-by-Step Execution Plan (Main Window or Subagent)",
      type: "header"
    },
    {
      items: [
        {
          text: "**Pre-Execution Graph Check**: Run `sara check`. Halt on failure."
        },
        {
          text: "**Check Git Diff**: Run `git diff --name-only` to identify modified package scopes."
        },
        {
          text: "**Ingest Failure Reports**: Retrieve remote checks status with `gh pr checks` and workflow logs with `gh run view <run-id> --log`. View SonarCloud issues. Halt on missing/empty reports."
        },
        {
          text: "**Categorize & Map**: Tag issues as Corrective or Perfective. Map downstream dependencies via tsconfig/package.json."
        },
        {
          text: "**Safe Programmatic Repairs**: Use WebStorm VFS-safe edits for:\n- **duplicate-string-resolver**: Centralize duplicates in test file or package `test-constants.ts`.\n- **type-loosening-resolver**: Add comment overrides and casts in test files to bypass TSC issues.\n- **constructible-mock-formatter**: Extract inline mock classes to their own mock files under `__mocks__` or `test-utils/` with explicit accessibility modifiers and arrow functions."
        },
        {
          text: "**Targeted Verification Loop**: Run lint and tests on affected packages. Up to 3 iterations."
        },
        {
          text: "**Final Graph Validation**: Run `sara check`."
        }
      ],
      type: "numberedList"
    }
  ] as MarkdownBlock[],
  description:
    "Comprehensive software development lifecycle (SDLC) director linking all 80+ workspace rules grouped by phase. Load this skill to navigate the development process.",
  name: "sdlc"
});
