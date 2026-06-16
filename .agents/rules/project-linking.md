---
trigger: always_on
---

# Project Linking and Monorepo Architecture

## 1. Domain Theory and Conceptual Foundations
A monorepo is a software development strategy where code for multiple projects, libraries, and applications is co-located in a single repository. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design) and Chapter 8 (Software Engineering Process), managing dependencies, coupling, and modular boundaries within a shared codebase is a critical software engineering discipline. In a multi-package monorepo, the selection of linking mechanisms directly affects build performance, release safety, and structural sanity. Improper dependency boundaries lead to circular references, dependency bloat, and regression cascades across decoupled systems.

### 1.1 Structural Coupling and Monorepo Linking Models
To maintain clean design boundaries, this monorepo distinguishes between two primary internal linking strategies based on coupling metrics, specifically afferent coupling ($C_a$, incoming dependencies) and efferent coupling ($C_e$, outgoing dependencies). The instability of a package is defined as $I = C_e / (C_a + C_e)$, where $I = 0$ indicates a highly stable, read-only package and $I = 1$ indicates a highly unstable, frequently changing package.
1. **Workspace-Linked Packages (`workspace:*`)**: These packages are symlinked directly by the package manager (pnpm) within the monorepo. When a workspace-linked package is updated, changes propagate instantly to all consumer packages. This is appropriate for high-instability ($I \approx 1$), frequently modified, or tightly coupled configurations that must stay in lockstep, such as `@ethang/schemas`, `@ethang/graphql-types`, and `@ethang/logger-sdk`.
2. **Registry-Published Packages (version-locked)**: These packages are published to an external npm registry and installed via semantic version ranges (e.g., `^3.1.0`). They are isolated from the active workspace build loop to ensure stability for high-stability, low-instability packages ($I \approx 0$) that are shared widely. Modifying these packages requires an explicit build, version bump, registry publication, and consumer-side update. This prevents breaking changes from propagating automatically. Examples include `@ethang/store`, `@ethang/toolbelt`, and `@ethang/eslint-config`.

### 1.2 Monorepo Package Directory and Design Responsibilities
To maintain high cohesion and prevent architectural drift, every package and application in the repository has a strictly defined domain responsibility. Agents must delegate operations to the appropriate package rather than duplicating logic:
- **auth**: Central REST API for authentication (`auth.ethang.dev`). All apps delegate credential validation and token signing here.
- **ethang-admin** / **ethang-react**: Blog management admin (`ethang.sanity.studio`) and public web frontend (`ethang.dev`).
- **ethang-graphql**: Central supergraph gateway (`graphql.ethang.dev`) routing queries to subgraphs `ethang-rss` and `ethang-courses`.
- **graphql-types**: Generated TypeScript types for the supergraph via `@graphql-codegen/typescript-operations`.
- **sterett-admin** / **sterett-hono** / **sanity-calendar-sync**: Sanity CMS admin, Hono frontend, and calendar sync helper for Sterett Creek Village Trustee.
- **logger-service** / **logger-sdk**: Central logging aggregator service and its synchronous logging SDK for all packages.
- **agents-build** / **markdown-generator**: Compiler package that generates rules and skills into `.agents/` and its helper markdown parser.
- **eslint-config** / **tsconfig**: Repository-wide ESLint and TS compiler configurations.
- **hono-middleware**: Shared middleware libraries (rate-limiting, CORS) for Hono backends.
- **leetcode**: STANDALONE practice package. Must not contain app logic or utilities.
- **schemas**: Central repository for Zod validation schemas. Shared between frontend and backend.
- **scripts**: Automated machine/Powershell scripts (must not be imported by app runtimes).
- **service-worker**: Shared browser caching service worker.
- **store**: Preferred unified global state management library.
- **toolbelt**: Primary utility package for reusable helper functions.

### 1.3 GraphQL Type Safety and Codegen Architecture
The supergraph (`ethang-graphql`) routes queries to subgraphs (`ethang-rss`, `ethang-courses`). To maintain type safety, `@ethang/graphql-types` queries the supergraph schema and generates TypeScript definitions. Whenever queries change in consumers like `ethang-react`, the codegen tool must be executed to refresh types. This prevents compile-time or runtime schema mismatches.

### 1.4 State Management and Utility Consolidation
To minimize cognitive load, state management and utilities are restricted to single sources of truth. The `@ethang/store` package houses global state slices, preventing synchronization issues across client components. Similarly, the `@ethang/toolbelt` package centralizes helper functions. Writing duplicate helper functions or ad-hoc state managers in local components increases technical debt and violates the Don't Repeat Yourself (DRY) principle.

## 2. Standard Operating Procedures (SOP)
The agent must strictly follow these procedures when resolving dependencies, adding packages, or editing configurations:

### Step 2.1: Audit Target Dependency and Identify Linking Policy
Before making any dependency changes or writing new imports, inspect the target package's `package.json`:
- Determine if the package is a workspace-linked configuration or a registry-published package.
- Inspect the version strings: workspace-linked packages must have the version `workspace:*`, whereas registry-published packages must have a specific semantic version string (e.g., `^4.5.0`).

### Step 2.2: Enforce Monorepo Package Linking Assignments
When adding dependencies, assign linking mechanisms according to these strict rules:
- **Workspace-Linked**: The packages `@ethang/schemas`, `@ethang/graphql-types`, and `@ethang/logger-sdk` MUST be declared using `workspace:*` in consumer dependency lists.
- **Registry-Published**: The packages `@ethang/toolbelt`, `@ethang/store`, and `@ethang/eslint-config` MUST be declared using published version ranges in consumer dependency lists. Do NOT use `workspace:*` for these packages.

### Step 2.3: Modify and Publish Registry Packages
If a registry-published package (such as `@ethang/toolbelt` or `@ethang/store`) requires modifications:
1. Implement the code changes within the package's subdirectory using TDD practices.
2. Compile and verify the package locally using its build and test scripts.
3. Suspend execution and prompt the user for confirmation to bump the version and publish the package.
4. Once user approval is granted, update the published version in the npm registry, then update the consumer's `package.json` with the new version range.
5. Run `pnpm update` at the workspace root to regenerate the lockfile.

### Step 2.4: Regenerate GraphQL Types After Query Changes
If any GraphQL query, mutation, or subscription is written or modified in a consumer application:
1. Navigate to the `packages/graphql-types` directory.
2. Execute the codegen compiler: `pnpm --filter @ethang/graphql-types build`.
3. Verify that the types in the `__generated__` output folder update without errors.
4. Execute type-checking on the consuming application to verify compatibility with the new types: `pnpm tsc --noEmit`.

### Step 2.5: Enforce Architectural Delegation Boundaries
Ensure that all code changes respect package responsibilities:
- **Authentication**: Direct all login, signup, and validation requests to the `auth` endpoints (`auth.ethang.dev`). Do not write local cryptography or token generators.
- **Logging**: Use `@ethang/logger-sdk` for all event logging. Do not use un-wrapped console operations or direct HTTP post requests to the log service.
- **State**: Implement shared state using slices inside `@ethang/store`. Do not write custom context providers or local global stores.
- **Utilities**: Add helper functions to `@ethang/toolbelt` and import them. Do not write local copies of common utility methods.
- **Schemas**: Add shared Zod schemas to `@ethang/schemas`. Do not duplicate validation rules across frontend and backend.

### Step 2.6: Execute Workspace Quality Verification Gates
After modifying any project files, configurations, or dependencies, run the verification suite:
1. Run the build command: `rtk pnpm build`.
2. Run the test command: `rtk pnpm test`.
3. Run the lint command: `rtk pnpm lint`.
Ensure that all runs return 100% success and no compilation warnings are ignored.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following project linking and monorepo rules before finishing a task:

- [ ] **Workspace Links Checked**: Are schemas, graphql-types, and logger-sdk configured as `workspace:*` in consumer dependency lists?
- [ ] **Published Versions Locked**: Are toolbelt, store, and eslint-config configured with registry version ranges (not `workspace:*`)?
- [ ] **Version Bump Gate Checked**: Did the agent request user approval before publishing a package version bump?
- [ ] **Lockfile Regeneration**: Was `pnpm update` executed after changing published package version strings?
- [ ] **Auth Delegation Enforced**: Does authentication delegate entirely to the `auth` service (`auth.ethang.dev`)?
- [ ] **Logging Delegation Enforced**: Do all logging operations use `@ethang/logger-sdk`?
- [ ] **State Centralization Enforced**: Is `@ethang/store` preferred over React local state for shared state?
- [ ] **Utility Centralization Enforced**: Are shared helper functions placed in `@ethang/toolbelt`?
- [ ] **Validation Centralization Enforced**: Are shared validations declared as Zod schemas in `@ethang/schemas`?
- [ ] **GraphQL Codegen Executed**: Was `pnpm --filter @ethang/graphql-types build` run after query updates?
- [ ] **Client Type Safety Verified**: Did `pnpm tsc --noEmit` pass on client applications after codegen updates?
- [ ] **No Local Authentication**: Has the agent verified that no custom session managers or token generators were added?
- [ ] **No Duplicate Utilities**: Has the agent verified that no duplicate utility functions exist in application code?
- [ ] **Leetcode Separation**: Is the `leetcode` package kept free of application code and utilities?
- [ ] **Scripts Separation**: Are scripts kept strictly as standalone tools and not imported into application runtimes?
- [ ] **No Forbidden Terminology**: Has the rule content been scanned to ensure no banned words are present?
- [ ] **Rule Character Bounds**: Is the compiled markdown file size strictly between 10,000 and 12,000 characters?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content template properly escaped?
- [ ] **Monorepo Build Verification**: Did `rtk pnpm build` run successfully after dependency changes?
- [ ] **Monorepo Test Verification**: Did `rtk pnpm test` pass with 100% success on affected packages?
- [ ] **Monorepo Lint Verification**: Did `rtk pnpm lint` pass without any warning or error?
- [ ] **Bracket Notation Applied**: Are properties of index-signature objects accessed via bracket notation?
- [ ] **Arrow Functions Enforced**: Are all functions in source and test blocks structured as arrow functions?
- [ ] **No Explicit Return Types**: Did the agent omit explicit return types on helper and test functions?
- [ ] **SWEBOK Alignment**: Are modular architecture and linking principles grounded in SWEBOK v4 guidelines?
- [ ] **Independent Deployment Checked**: Has the agent verified that services can deploy independently?
- [ ] **No Git Push executed**: Has the agent verified that no remote push or commit actions were triggered?
- [ ] **Targeted Restores only**: Did the agent use targeted restores if any changes were reverted?
