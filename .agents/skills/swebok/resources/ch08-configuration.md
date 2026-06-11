# Software Configuration Management (SWEBOK v4, Chapter 8)

> **Scope:** Applying CM discipline throughout the software life cycle — identifying CIs, controlling changes, recording status, auditing, and managing releases. Standard: **IEEE 828-2012**. SCM supports project management, development/maintenance, SQA, and end users.

## When to Apply

Invoke this chapter when working on: baseline tagging, branch/merge strategy selection, change-request (CR/SCR) workflow, SBOM generation, release packaging, configuration auditing (FCA/PCA), SCMP authoring, or SCM tool selection.

---

## Key Definitions

| Term | Definition |
|---|---|
| **CI (Configuration Item)** | Item or aggregation of HW/SW designed to be managed as a single entity |
| **Baseline** | Formally approved, fixed CI version at a specific life cycle point; changes only via formal change control |
| **SCR (Software Change Request)** | Formal request to change scope, cost, schedule, code, or policies |
| **CCB** | Authority for accepting/rejecting proposed changes; SCM rep always present |
| **SCCB** | CCB scoped to software-only changes |
| **SCSA** | Activity recording and reporting configuration status throughout the life cycle |
| **SBOM** | Formal record of all CIs and their supply chain relationships used to build software |
| **FCA** | Functional Configuration Audit — ensures SW item is consistent with its governing specs |
| **PCA** | Physical Configuration Audit — ensures design/reference docs are consistent with the as-built product |
| **VDD** | Version Description Document — records physical contents of a release |
| **Deviation** | Written authorization granted **before** manufacture to depart from a requirement |
| **Waiver** | Written authorization granted **after** production/inspection to accept a non-conforming item |
| **Definitive Media Library** | Controlled store of release baselines deployable to test/stage/prod environments |

---

## Configuration Identification

### What Qualifies as a CI

Plans, specifications, design docs, test materials, compilers/build tools, source and executable code, libraries, data dictionaries, and installation/operation documentation.

Selection balances visibility for project control against the cost of managing controlled items.

### CI Attributes (minimum scheme)

Name · Unique identifier · Description · Date(s) · Type · Owner

### CI Relationship Types

| Relationship | Meaning | Tracked in |
|---|---|---|
| **Dependency** | CI-1 and CI-2 depend mutually on each other | SBOM / CMDB |
| **Derivation** | CI-2 cannot start until CI-1 is complete (sequential constraint) | CMDB |
| **Succession** | Each change to a CI creates a new version (tracked over time) | Version control |
| **Variant** | Alternative versions engineered from the same base; expensive to maintain | Version control |

Track only relationships whose change-impact value justifies the overhead.

### Software Libraries

| Library type | Contents | Key property |
|---|---|---|
| **Source / VCS** | Source code, config files, test cases, requirements | Full history; traceability to baselines |
| **Binary / artifact repo** | Object code, compiled artifacts | Cryptographic hashes (SHA-256) for PCA |
| **Definitive media library** | Release baselines | Access-controlled; backup required |

---

## Branching Strategy Selection

Plan branching and merging before development starts — the choice affects build frequency, CI pipeline design, and merge risk.

| Decision question | Guidance |
|---|---|
| Strategy type | Trunk-based for CI/CD teams; Gitflow for release-train projects; feature branches for parallel work |
| Build frequency | Trunk-based → build on every commit; Gitflow → build on branch merge |
| Automated test scope | Unit on every commit; integration/E2E on PR merge; nightly for full suite |
| Tool compatibility | Verify branching model is supported before tool acquisition |
| Merge risk | Long-lived branches → higher conflict rate; prefer short-lived feature branches |
| Variant support | If product variants required, confirm VCS tool handles them without copy-paste repos |

---

## Change Control Process

```
Need for Change
  └── SCR Generated (anyone, any life cycle phase)
        └── Technical Evaluation (impact analysis — assess affected CIs)
              └── CCB Review
                    ├── Rejected → Inform requester; record decision
                    └── Approved → Assign to engineer
                          └── Schedule / Design / Test / Complete change
                                └── Configuration audit + V&V
                                      └── Release into baseline
"Emergency Path": implement first, complete formal process afterward
```

### CCB Authority Levels

| Criterion | Level |
|---|---|
| Low criticality, no budget/schedule impact | Single engineer or team lead |
| Moderate criticality or budget impact | SCCB (software-only board) |
| High criticality, contractual, or safety-critical | Full CCB (all stakeholders) |

### Impact Analysis (required for every approved SCR)

1. Identify all CIs with a dependency or derivation relationship to the changed CI.
2. Assess schedule/budget impact of the change.
3. Record findings in the SCR before CCB review.

---

## Software Configuration Status Accounting (SCSA)

SCSA captures and reports the state of all CIs throughout the life cycle.

**Minimum tracked data:**
- Approved configuration identification and current implementation status
- Impacted CIs and related systems; deviations and waivers
- V&V activities and outcomes
- Integrity indicators: MAC, SHA-1, MD5 hashes
- Security/governance risk and compliance status
- Baseline status; CRs per SCI; average time to implement a CR

Reports feed development, QA, security, project management, and regulatory compliance.

---

## Configuration Auditing

| Audit | Trigger | Pass criterion |
|---|---|---|
| **FCA** | Before establishing product baseline | SW item behavior matches governing specifications |
| **PCA** | Before establishing product baseline | Design/reference docs match the as-built product; SBOM hashes verified |
| **In-process audit** | At each CI baseline approval | CI satisfies requirements per quality plan |

Both FCA and PCA must pass before establishing a product baseline on safety-critical or contractually required software.

---

## Release Management and Delivery

### Release Build Checklist

- [ ] Correct CI versions selected for target environment
- [ ] Build is reproducible: compilers and build scripts under SCM control
- [ ] SBOM generated and included in release artifacts
- [ ] Build outputs subject to quality verification
- [ ] Previous release can be reproduced from archived CIs + tools

### Release Package Contents

| Artifact | Required |
|---|---|
| Executable code / libraries | Yes |
| VDD (version description document) | Yes |
| Release notes (new capabilities, known problems, platform requirements) | Yes |
| Installation / upgrade instructions | Yes |
| Digital signature for integrity verification | Recommended |

### CI/CD Pipeline (continuous delivery)

```
Commit → CI trigger → Compile/link → Static analysis →
Unit tests + coverage → Build artifact → Artifact repo → Deploy to staging → Verify → Release
```

---

## Actionable Rules

- **Tag a baseline in VCS for every release.** Every release must have a reproducible baseline.
- **Generate and store an SBOM** for every release with cryptographic hashes; enables PCA and supply chain vulnerability tracking.
- **Every change goes through formal change control.** No exceptions for "small" or "urgent" — use the documented emergency path if needed, then formalize afterward.
- **Document the branching strategy before development starts** and communicate it to all team members.
- **CI pipeline on every commit:** build → unit test → static analysis → artifact publication.
- **Supporting tools (compilers, build scripts) under SCM control** so any past build can be reproduced exactly.
- **Both FCA and PCA must pass** before establishing a product baseline on safety-critical or contractual software.

## Anti-Patterns

| Anti-pattern | Risk |
|---|---|
| Informal changes without an SCR ("cowboy commits") | No audit trail; CCB bypassed |
| No baseline tag on release | Cannot reproduce past release for maintenance or defect fix |
| Third-party dependencies outside SCM control | Build not reproducible; SBOM incomplete |
| Branching strategy undocumented | Merge conflicts; inconsistent build triggers |
| SBOM not generated or outdated | Blind to supply chain vulnerabilities; PCA fails |
| Emergency changes never formalized | Workarounds become permanent; compliance gap |
| Impact analysis skipped | Downstream CIs broken by undetected dependency |
| SCM treated as "just version control" | Auditing, status accounting, and release management absent |
