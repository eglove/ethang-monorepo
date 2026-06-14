import { defineRule } from "../../define.ts";

export const automatedReleaseEngineering = defineRule({
  content: `# Automated Release Engineering

## 1. Domain Theory and Conceptual Foundations
Release engineering is a critical discipline within software engineering that focuses on the processes, tools, and practices required to compile, package, deploy, and audit software releases. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 6 (Software Configuration Management) and Chapter 7 (Software Engineering Management), release engineering is the bridge between development and operations. It ensures that software transitions from source code to operational environments in a repeatable, predictable, and fully traceable manner.

### 1.1 The Principle of Reproducible Builds
A build is considered reproducible if, given the exact same source code version, compiler version, and build configuration, it generates a byte-for-byte identical release artifact. SWEBOK emphasizes that reproducible builds are essential for:
- **Security**: Preventing malicious injections or backdoors from being introduced during compilation in compromised local developer environments.
- **Auditing**: Confirming that the code running in production matches the source code reviewed and approved in version control.
- **Debugging**: Ensuring that production crashes can be diagnosed using identical source-map alignments locally.

To achieve this, compilation must occur in clean, isolated environments (such as Docker containers or ephemeral CI runners) where global paths, time-zones, and local environment variables are strictly normalized.

### 1.2 Configuration Management and Dependency Pinning
Automated release engineering is closely tied to Software Configuration Management (SCM). Release candidates must be built from defined configuration baselines:
- **Dependency Isolation**: Software must not rely on unpinned external dependencies. If a project pulls packages using wildcard version ranges (e.g. \`^1.2.0\`), third-party updates can silently break builds or introduce security vulnerabilities.
- **Lockfile Integrity**: Monorepos must use strict lockfiles (e.g., \`pnpm-lock.yaml\`) to lock the exact dependency graph. These lockfiles are treated as primary code assets and committed to version control.
- **Hermetic Builds**: High-reliability build systems execute hermetic builds that do not access the internet during compilation, pulling dependencies solely from a secure local or private enterprise registry.

### 1.3 Continuous Integration (CI) and Quality Gates
Continuous Integration is the practice of automating the integration of code changes from multiple contributors into a shared repository. CI pipelines enforce quality gates that must be satisfied before any code promotion occurs:
- **Static Analysis Gates**: Running syntax, style, and lint checks (such as ESLint) to ensure compliance with coding standards.
- **Compilation Gates**: Running type-checkers (such as TypeScript's \`tsc\`) to verify type safety.
- **Testing Gates**: Running unit and integration tests to ensure that existing features remain unbroken.
- **Security Gates**: Scanning dependencies for known vulnerabilities using auditing tools.

### 1.4 Packaging and Release Artifact Repositories
Once quality gates pass, code is packaged into standard release formats (such as npm packages, Docker images, or zip files).
- **Immutable Artifacts**: Once a package is built, it must be immutable. If a defect is found, engineers must increment the version and compile a new candidate, rather than modifying the existing package.
- **Semantic Versioning (SemVer)**: Releases follow the Major.Minor.Patch format:
$$\\text{Version} = \\text{MAJOR}.\\text{MINOR}.\\text{PATCH}$$
Where Major increments indicate breaking changes, Minor indicates backward-compatible features, and Patch indicates bug fixes.

### 1.5 Software Bill of Materials (SBOM) and Traceability
A Software Bill of Materials (SBOM) is a nested, machine-readable inventory of all software components, libraries, transitive dependencies, and metadata included in a release. SWEBOK v4 highlights the SBOM as a critical asset for supply-chain security. SBOMs are typically exported in standardized formats like SPDX (Software Package Data Exchange) or CycloneDX. These inventories allow organizations to trace every deployed file to its origin and immediately identify components affected by newly discovered vulnerabilities (CVEs) in transitive dependency chains.

### 1.6 Continuous Delivery (CD) vs. Continuous Deployment
SWEBOK Chapter 7 distinguishes between two automated deployment approaches:
- **Continuous Delivery**: Automated pipelines build, test, and package the software, staging it for deployment. The actual promotion to the production environment requires a manual trigger or business sign-off.
- **Continuous Deployment**: Every change that successfully compiles and passes the automated quality gates is immediately and automatically deployed to production without human intervention. This requires mature observability and rapid automated rollback capabilities to handle failures.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to execute automated release engineering tasks:

### Step 2.1: Clean the Workspace Environment
Before initiating a build, ensure that the local directory or CI environment is free from cache pollution and untracked files:
\`\`\`bash
rtk git clean -fdx
\`\`\`
- This removes the \`node_modules\` folder, compilation caches, and local build outputs, forcing a clean slate.

### Step 2.2: Install Dependencies via Strict Lockfiles
Install package dependencies using the monorepo package manager, enforcing lockfile compliance:
\`\`\`bash
rtk pnpm install --frozen-lockfile
\`\`\`
- The \`--frozen-lockfile\` flag ensures that pnpm will throw an error and fail the build if the lockfile is out of sync with \`package.json\`, preventing silent dependency shifts.

### Step 2.3: Run Quality Gates
Execute the full suite of static analysis and test suites:
\`\`\`bash
rtk pnpm lint
rtk pnpm test
\`\`\`
- Check that typechecks and linter validations pass with zero errors. Do not proceed with packaging if gates fail.

### Step 2.4: Compile and Build Release Candidates
Run the automated build script across the monorepo or target package:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
\`\`\`
- Inspect compilation logs to confirm that all output files are generated, assets are minimized, and source maps are correctly emitted.

### Step 2.5: Tag and Publish Release Artifacts
When a release candidate satisfies all quality gates, create a Git tag indicating the version:
\`\`\`bash
rtk git tag -a v1.0.0 -m "Release version 1.0.0"
\`\`\`
- Push tags to the central repository and execute the deployment pipeline to publish the compiled artifact to the secure registry.

### Step 2.6: Generate the Software Bill of Materials (SBOM)
After compilation, generate the SBOM to audit dependencies:
\`\`\`bash
rtk pnpm licenses list --json > sbom.json
\`\`\`
- Save this list adjacent to the release artifact to maintain a clear audit trail.

### Step 2.7: Caching and Build Pipeline Optimization
To maintain fast release cycles in CI/CD, configure build caching for node modules and compilers:
- Ensure that the CI environment restores the pnpm store cache (e.g. at \`~/.local/share/pnpm/store\`) at the start of the job.
- Configure compiler caching (e.g. Vitest cache, TypeScript incremental compilation files under \`tsconfig.tsbuildinfo\`) to skip unchanged modules.
- Monitor build times, ensuring that the total build-to-publish duration remains within the established pipeline SLA budget.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding automated release engineering:

- [ ] **Isolated Build Environment**: Was the build run in an isolated environment free from local file pollution (\`git clean -fdx\`)?
- [ ] **Lockfile Enforcement**: Were dependencies installed using the lockfile compliance flag (\`--frozen-lockfile\`)?
- [ ] **TypeScript Typecheck Clean**: Did the typecheck phase complete without compile-time errors?
- [ ] **Linter Quality Gate Passed**: Did the linter phase complete with zero errors?
- [ ] **Unit Tests Verified**: Did all unit tests execute and pass before packaging?
- [ ] **Immutable Packages**: Are release packages treated as immutable, requiring a version bump for any defect fixes?
- [ ] **SemVer Specification Adhered**: Does the release version follow the semantic versioning schema?
- [ ] **Git Version Tagging**: Is every release tagged with a specific version tag corresponding to the Git commit?
- [ ] **SBOM Inventory Emitted**: Was an SBOM generated listing all package licenses and dependencies?
- [ ] **No Secrets in Packages**: Has the agent verified that no sensitive files or environment variables are packaged?
- [ ] **Zero DevDependencies in Production**: Does the release package exclude development-only packages from its runtime requirements?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Walkthrough Record Completed**: Does \`walkthrough.md\` document the exact build and verification commands?
- [ ] **Task List Sync**: Are all release engineering tasks recorded and checked off in \`task.md\`?
- [ ] **Index Signature Safety**: Do release scripts use bracket notation to access properties on index-signature config objects?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on release helpers declared with explicit accessibility modifiers?`,
  description:
    "automated release engineering, repeatable deployments, and build scripts",
  filename: "automated-release-engineering",
  trigger: "model_decision"
});
