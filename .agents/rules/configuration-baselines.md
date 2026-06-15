---
description: configuration baselines, SCM identification, and library management
trigger: model_decision
---

# Configuration Baselines

## 1. Domain Theory and Conceptual Foundations
Software Configuration Management (SCM) is the discipline of identifying, controlling, auditing, and reporting the configurations of a software system. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 8 (Software Configuration Management), SCM is critical for maintaining the integrity, traceability, and reproducibility of software releases over time. SCM is not merely version control; it encompasses the systemic management of all development lifecycle artifacts.

### 1.1 SCM Key Functions
According to SWEBOK v4, SCM is divided into several key functional areas:
1. **Configuration Identification**: Selecting and defining configuration items (CIs), documenting their physical and functional characteristics, and labeling them with unique identifiers.
2. **Configuration Control**: Managing changes to CIs through established procedures, ensuring only authorized updates are integrated.
3. **Configuration Status Accounting (CSA)**: Recording and reporting the status of CIs, change requests, and the implementation of approved changes.
4. **Configuration Auditing**: Formally validating that the software system conforms to its physical specifications and functional requirements.

### 1.2 SCM Audits and Reviews
A software audit is an independent assessment of software products or processes to determine compliance with standards, guidelines, specifications, and procedures. In SCM, two primary audits are performed to establish a reliable baseline:
- **Functional Configuration Audit (FCA)**: Verifies that the SUT has achieved the performance and functional characteristics specified in its requirements.
- **Physical Configuration Audit (PCA)**: Verifies that the physical representation of the software (e.g., source code files, configuration files, libraries, documents) matches the design documentation and contains all necessary components in the correct versions.

Establishing these audits as automated checks in the build pipeline ensures that no baseline is committed without formal verification.

### 1.3 Configuration Items (CIs)
A Configuration Item (CI) is an aggregation of hardware, software, or documentation that is designated for configuration management and treated as a single entity in the SCM process. In a monorepo development workspace, CIs include:
- **Source Code**: Implementation files, test suites, and package declarations.
- **Project Configurations**: Compiler settings (`tsconfig.json`), runtime configurations (`wrangler.jsonc`), linter rules (`eslint.config.ts`), and workspace layouts.
- **Build Artifacts**: Compiled bundles, manifests, and rule schemas.
- **Documentation**: Design specifications, execution plans, and rule documents.

### 1.4 The Concept of a Baseline
A baseline is a formally approved version of a configuration item, established at a specific point in time, which serves as the basis for further development. Baselines can only be changed through formal change control procedures. Establishing a baseline provides a known, stable starting point (e.g., a specific Git commit hash) against which changes are compared. This prevents the "double-maintenance" problem and ensures that any release can be rebuilt from its exact source configuration.

### 1.5 Software Libraries and SCM Repositories
SCM requires maintaining configuration items in controlled software libraries to ensure version integrity. SWEBOK v4 outlines three levels of libraries:
1. **Developer Library (Working Space)**: Uncontrolled area where developers make changes.
2. **Controlled Library (Staging/Integration)**: Managed area where changes are integrated and tested.
3. **Formal Library (Production/Release)**: Highly restricted area housing approved baselines and releases.

In modern continuous integration environments, transitions between these libraries are fully automated. Commits to a developer branch move the code from the developer library to the controlled library (via pull requests and automated test suites). Once approved and compiled, the artifact is deployed to the formal library (production release).

## 2. Standard Operating Procedures (SOP)
The agent must establish and maintain configuration baselines for all controlled codebase assets.

### Step 2.1: Identifying Configuration Items
Before beginning work on any task, the agent must identify and document the state of all affected Configuration Items:
1. **Source Code**: Note the files to be modified in `packages/agents-build/src/`.
2. **Build Manifests**: Check `package.json` and lockfiles for dependency updates.
3. **Workspace Configuration**: Identify if compiler settings (`tsconfig.json`) or router configurations will be altered.

### Step 2.2: Establishing the Baseline Commit
Before making any changes, retrieve and record the baseline commit metadata using the Git CLI:
```bash
rtk git log -n 1 --oneline
```
Document this baseline commit hash in the task documentation or execution plan to ensure traceability.

### Step 2.3: Verification of Workspace Integrity
Verify the starting baseline configuration of the workspace by running a clean compilation:
```bash
rtk pnpm build
```
If the baseline fails to compile, report the baseline defect to the user before making any changes.

### Step 2.4: Managing Version Manifests
This package uses a manifest file (`.manifest.json`) to track generated rules files. The compiler reads this manifest to identify which files belong to the active baseline and to clean up orphaned files. The agent must:
1. Never edit `.manifest.json` by hand.
2. Run `pnpm build` to update the manifest file automatically.

### Step 2.5: Implementation of a SCM Baseline Auditor
Below is a clean TypeScript class illustrating how to audit workspace files against a baseline manifest to identify drift or unregistered configuration items.

```typescript
import { vi } from "vitest";

interface ManifestData {
  files: string[];
  version: string;
}

class BaselineAuditor {
  private workspaceDir: string;
  private manifest: ManifestData;

  public constructor(workspaceDir: string, manifest: ManifestData) {
    this.workspaceDir = workspaceDir;
    this.manifest = manifest;
  }

  public auditFile = (filePath: string): boolean => {
    const relativePath = filePath.replace(this.workspaceDir, "");
    const filesList = this.manifest["files"];
    return filesList.includes(relativePath);
  };

  public getManifestVersion = (): string => {
    return this.manifest["version"];
  };
}

describe("BaselineAuditor Tests", () => {
  it("should successfully identify registered and unregistered configuration items", () => {
    const mockManifest: ManifestData = {
      files: ["/src/main.ts", "/tsconfig.json"],
      version: "1.0.0"
    };
    const auditor = new BaselineAuditor("/app", mockManifest);

    expect(auditor.auditFile("/app/src/main.ts")).toBe(true);
    expect(auditor.auditFile("/app/src/unregistered.ts")).toBe(false);
  });

  it("should retrieve correct manifest version", () => {
    const mockManifest: ManifestData = {
      files: ["/src/main.ts"],
      version: "2.1.0"
    };
    const auditor = new BaselineAuditor("/app", mockManifest);
    expect(auditor.getManifestVersion()).toBe("2.1.0");
  });
});
```

## 3. Agent Compliance Checklist
The agent must verify compliance with SCM baseline principles before completing the task:

- [ ] **CIs Identified**: Did the agent compile a list of all configuration items affected by the change?
- [ ] **Baseline Commit Logged**: Was the starting Git commit hash recorded in the task notes?
- [ ] **Baseline Build Check**: Did the agent verify that the workspace builds successfully prior to making changes?
- [ ] **Controlled Library Use**: Are all modifications restricted to the local developer library space?
- [ ] **Manifest Drift Checked**: Was the generated manifest compared to the baseline manifest?
- [ ] **Automated Clean Pruning**: Did the compiler prune orphaned files from previous baselines?
- [ ] **Configuration Isolation**: Were changes to code kept separate from changes to configuration files?
- [ ] **Version Integrity Verified**: Did the agent verify that no lockfiles were modified without dependency changes?
- [ ] **Linter Configuration Checked**: Was the linter configuration verified to be active and unmodified?
- [ ] **Traceability Established**: Is every change in configuration traceable to a specific requirement?
- [ ] **Arrow Functions Enforced**: Are all build script callbacks and configuration helpers written as arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript configuration scripts rely on type inference?
- [ ] **Explicit Member Modifiers**: Are mock objects in the compiler tests annotated with public/private accessibility?
- [ ] **Bracket notation**: Are dynamic properties on the manifest JSON accessed using bracket notation?
- [ ] **Void assertion wrapping**: Are void compiler scripts verified using `expect(() => ...).not.toThrow()`?
- [ ] **No Forbidden Terminology**: Has the configuration code been scanned to verify zero forbidden words?
- [ ] **No Git Commit executed**: Did the agent refrain from making commits or pushes during baseline verification?
- [ ] **SWEBOK SCM Alignment**: Does the configuration control process align with SWEBOK v4 Chapter 8 standards?
- [ ] **Status Accounting Record**: Has the agent updated the status accounting files after modifying baseline definitions?
- [ ] **Integrity Auditing Complete**: Has the compiled directory been audited to ensure no extraneous files exist?
- [ ] **No Destructive Reverts**: Did the agent avoid executing global git checkouts or hard resets?
- [ ] **Configuration baselines update**: Has the file list in `.manifest.json` been properly regenerated?
- [ ] **Functional Configuration Audit**: Has the compiler run functional tests to ensure requirements are met?
- [ ] **Physical Configuration Audit**: Did the compiler audit files against the manifest file structure?
