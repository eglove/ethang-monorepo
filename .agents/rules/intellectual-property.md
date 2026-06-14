---
description: intellectual property, software licensing compliance, open source licenses, and IP attribution
trigger: model_decision
---

# Intellectual Property

## 1. Domain Theory and Conceptual Foundations
Intellectual Property (IP) in software engineering refers to the legal protections granted to creations of the mind, including code, documentation, designs, and branding. As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16 (Software Engineering Professional Practice), engineers must understand and strictly respect IP laws. Improper use of third-party IP can lead to severe legal liabilities, project terminations, and financial damage.

### 1.1 Types of Intellectual Property
There are four primary legal frameworks that protect software intellectual property:
1. **Copyright**: Protects the original expression of ideas in code, documentation, and user interfaces, but does not protect the underlying algorithms or functional ideas themselves. In most jurisdictions, copyright protection is granted automatically upon the creation of the work. It restricts unauthorized copying, modification, or distribution.
2. **Patents**: Protect novel, non-obvious, and useful inventions, processes, or machine architectures. In software, patents can cover specific algorithms, data processing methods, or system integrations. Unlike copyright, patents must be formally applied for and granted, and they protect the functionality of the software regardless of how the code is written.
3. **Trademarks**: Protect names, logos, slogans, and branding elements that identify the source of a product or service (e.g., brand names or project logos). Trademarks prevent market confusion by restricting other entities from using similar identifiers.
4. **Trade Secrets**: Protect proprietary, confidential information that provides a competitive business advantage (e.g. specialized trading algorithms, internal configuration configurations, or unreleased source code). Unlike patents or copyrights, trade secrets do not have a fixed expiration date but rely on strict security measures to maintain confidentiality.

### 1.2 Open Source Software (OSS) Licensing Models
Open-source software is code made publicly available under licenses that grant users the right to study, change, and distribute the software. These licenses fall into three main categories:
- **Permissive Licenses**: Grant broad usage rights with minimal restrictions, typically requiring only copyright attribution. Examples include:
  - *MIT License*: Highly permissive; permits commercial use, modification, and distribution, with attribution as the sole condition.
  - *Apache License 2.0*: Similar to MIT, but includes an explicit grant of patent rights from contributors and requires documenting changes.
  - *BSD Licenses*: Focus on attribution and restrict the use of contributors' names for product endorsement.
- **Copyleft (Reciprocal) Licenses**: Require that any derivative works or modifications be distributed under the same license terms, ensuring the code remains open-source.
  - *GNU General Public License (GPL)*: Strong copyleft; if GPL code is integrated into a project and distributed, the entire project's source code must be made public under the GPL.
  - *Affero GPL (AGPL)*: Extends GPL copyleft to software run over a network (SaaS), requiring the provider to make the source code available to network users. This is critical for cloud-hosted applications.
  - *GPL Compatibility*: Not all open-source licenses are compatible. For example, combining GPLv2-only code with Apache 2.0 code in a single linked binary can create licensing conflicts due to differing patent clauses and restriction limits.
- **Weak Copyleft Licenses**: Apply copyleft rules only to the specific open-source files themselves, allowing them to be linked with proprietary code.
  - *GNU Lesser GPL (LGPL)*: Permits linking with proprietary modules without triggering copyleft on the proprietary code.
  - *Mozilla Public License (MPL)*: Requires changes to MPL-licensed files to be shared, but allows integration with proprietary files.

### 1.3 Clean-Room Design and Reverse Engineering Limits
To reproduce the functionality of existing software without violating copyright laws, engineers use a clean-room design methodology. This splits development into two isolated groups:
1. **Specification (Dirt) Group**: Analyzes the competitor's software or code to extract functional specifications, interface controls, and data structures. This group may disassemble or reverse-engineer the original software to map its APIs and structural behaviors, but they produce only detailed specifications and never write any production code.
2. **Implementation (Clean) Group**: Receives only the written specifications from the first group. Because this group has never seen or accessed the original source code, they can implement the functionality from scratch. This setup mathematically and legally ensures that no copyright contamination or literal copying of code structures occurs, defending against infringement claims.

## 2. Standard Operating Procedures (SOP)
The agent must manage intellectual property and license compliance according to the following procedures:

### Step 2.1: Enforce Dependency License Audits
Before installing any new third-party package or library:
- Identify the package's license using the package registry or source repository.
- Verify that the license is approved for use in the workspace (e.g., rejecting copyleft licenses like GPL/AGPL unless explicitly approved for open-source distribution).
- Run package dependency audits to verify license compliance:
```bash
rtk pnpm audit
```
- Record the license type of any added dependency in the dependency manifest.

### Step 2.2: Add Proper Copyright and License Attributions
When incorporating permissible third-party code (e.g., utility functions or code snippets under MIT/BSD):
- Keep the original copyright notice and license text intact in the file header.
- If code is modified, add a notice describing the modifications:
```typescript
/**
 * Original work Copyright (c) Year Author. Licensed under the MIT License.
 * Modified by Antigravity (Google DeepMind) in 2026.
 */
```

### Step 2.3: Implement Clean-Room Separation
If tasked with replicating functional behaviors from another software system without licensing authorization:
- Document the functional requirements and API signatures in a formal specification sheet.
- Assign the implementation to a clean environment where the original source code is not accessible.
- Verify the implementation solely against the specification sheet and automated integration tests.

### Step 2.4: Safeguard Proprietary Trade Secrets and Credentials
- Never hardcode API keys, database credentials, private keys, or internal proprietary URLs in code repositories.
- Utilize environment variables or secret vaults for all configuration parameters.
- Verify that all sensitive configuration patterns are included in `.gitignore` to prevent accidental commits.

### Step 2.5: Verify Rules Against Forbidden Vocabulary
- Before saving any rule changes or documentation, scan the files to ensure no forbidden words (e.g., specific enterprise databases, legacy build servers, or proprietary platforms) are included in the rule text.
- Run the build and verification commands to ensure the output compiles cleanly:
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following intellectual property rules:

- [ ] **License Check Completed**: Did the agent verify that all package dependencies use permissive licenses (e.g. MIT, Apache 2.0)?
- [ ] **No AGPL/GPL Code Imported**: Has copyleft code been excluded from proprietary or SaaS components?
- [ ] **Original Copyrights Preserved**: Are third-party file headers and license texts kept intact within copied files?
- [ ] **Modifications Noted**: Are edits to third-party code marked with a modification date and explanation?
- [ ] **Attribution Provided**: Did the agent include a license attribution file (e.g. `LICENSE-THIRD-PARTY`) for all integrated libraries?
- [ ] **No Banned Words Refenced**: Has the rule been scanned to confirm no forbidden enterprise vocabularies are present?
- [ ] **Clean-Room Rules Followed**: Were clean-room protocols followed when replicating competitor features?
- [ ] **Secrets Excluded from Git**: Are there no API tokens, private keys, or passwords committed to the repository?
- [ ] **Gitignore Verified**: Is the `.gitignore` configured to exclude env files and local credentials?
- [ ] **No Native Dates**: Are date structures in licensing or header notices formatted using Luxon (`DateTime`)?
- [ ] **Size Bounds Confirmed**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent run verification (build, test, lint) using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are licensing checks, dependency updates, and compliance logs documented in `walkthrough.md`?
- [ ] **Index Signature Bracket Access**: Are dynamic properties on index-signature objects accessed via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit test cases verifying lack of exceptions wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Arrow Functions Enforced**: Are all function declarations defined as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent compiler resolution mismatches?
- [ ] **IP Review Logged**: Is any custom or non-standard library import documented with a clear architectural justification?
- [ ] **No Unattributed Copypasta**: Did the agent avoid copying stackoverflow or chat answers that lack open attribution licenses?
- [ ] **Trademark Compliance Checked**: Did the agent ensure that no proprietary trademark logos are used without permission?
