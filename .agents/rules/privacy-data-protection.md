---
description: PII protection, data protection, privacy controls, and data minimization
trigger: model_decision
---

# Privacy and Data Protection

## 1. Domain Theory and Conceptual Foundations
Privacy and data protection are critical engineering requirements concerned with safeguarding Personally Identifiable Information (PII) and maintaining compliance with global regulatory frameworks (such as GDPR, CCPA, and HIPAA). As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 13 (Software Security) and Chapter 10 (Software Quality), data privacy is not just a policy requirement; it is a fundamental system design constraint that must be integrated into the software architecture from day one.

### 1.1 Personally Identifiable Information (PII)
PII is defined as any information that can be used to distinguish or trace an individual's identity, either alone or when combined with other personal or identifying information. Examples of PII include:
- Direct Identifiers: Full names, social security numbers, passport numbers, email addresses, and phone numbers.
- Indirect Identifiers: IP addresses, geographic coordinates, biometric data, and behavioral profiles.

### 1.2 The Principle of Data Minimization
Data minimization is a core privacy design principle stating that a system should only collect, process, and store the absolute minimum amount of PII required to satisfy its business functions. The lifecycle of PII must be strictly controlled, ensuring that data is retained only for as long as necessary and is securely deleted once its retention window expires.

### 1.3 Pseudonymization vs. Anonymization
SWEBOK v4 distinguishes between two primary techniques for reducing privacy risks in stored datasets:
- **Anonymization**: The irreversible alteration of data such that the data subject can no longer be identified by any means, directly or indirectly. Once anonymized, the dataset is no longer subject to privacy regulations.
- **Pseudonymization**: The replacement of identifying fields with artificial identifiers (pseudonyms or tokens) such that the data can only be linked back to a specific individual using separate, securely isolated key information.

Mathematically, let $D$ be a dataset containing records with identifying attributes $PII$. Let $f_{\text{pseudo}}$ be the pseudonymization function:
$$f_{\text{pseudo}}(D) = D \setminus PII \cup \{Id_{\text{pseudo}}\}$$

The mapping table:
$$M: Id_{\text{pseudo}} \leftrightarrow PII$$

Must be stored in a separate, encrypted database with independent access controls. This ensures that if the primary application database is compromised, the attacker cannot identify the individuals without access to the mapping table $M$.

### 1.4 Cryptographic Controls: At Rest and In Transit
PII must be cryptographically protected at all stages of its lifecycle:
- **In Transit**: All network communication containing PII must be encrypted using Transport Layer Security (TLS 1.3) with strong cipher suites to prevent interception.
- **At Rest**: PII stored in databases, caches, or filesystems must be encrypted using advanced encryption standards (e.g., AES-256 in GCM mode). Encryption keys must be managed using dedicated Key Management Services (KMS) with automatic rotation policies.

### 1.5 Log Sanitization and Leakage Prevention
A common source of privacy breaches is the accidental leakage of PII into application logs. Web frameworks often log incoming request payloads, URL parameters, or exception stack traces that contain passwords, email addresses, or JWT tokens. SWEBOK-aligned architectures implement log filters that intercept and sanitize all log outputs before they are written to disk or sent to centralized log aggregators.

### 1.6 Consent Management and the Right to be Forgotten
SWEBOK-aligned architectures prioritize the user consent lifecycle. Opt-in and opt-out preferences must be recorded, versioned, and respected across all processing stages. Under the GDPR "Right to be Forgotten," systems must implement cascading deletion logic. When a user requests deletion, deletion events must reliably propagate to related tables, local caches, and secondary backup storage media within regulatory timeframes.

### 1.7 Differential Privacy
To enable statistical analysis on user datasets without exposing individual identities, architectures utilize differential privacy. An algorithm $\mathcal{M}$ is $\epsilon$-differentially private if for any two neighboring datasets $D_1$ and $D_2$ differing on at most one record, and for any output $S$:
$$\mathbb{P}[\mathcal{M}(D_1) \in S] \le e^{\epsilon} \cdot \mathbb{P}[\mathcal{M}(D_2) \in S]$$

Where $\epsilon$ represents the privacy budget. A smaller $\epsilon$ indicates tighter privacy limits by adding controlled noise (e.g., Laplacian noise) to query results.

## 2. Standard Operating Procedures (SOP)
The agent must execute privacy and data protection procedures according to the following step-by-step procedures:

### Step 2.1: Conduct a Privacy Impact Assessment (PIA)
Before implementing changes that handle user data:
- Identify if the changes collect, process, or store any PII.
- Document the business justification for collecting the PII, verifying that data minimization is respected.
- Define the data classification level (Public, Internal, Confidential, Restricted).

### Step 2.2: Implement Pseudonymization and Tokenization
Isolate identifying data in database designs:
- Store core user metrics and transactions using artificial UUIDs rather than email addresses or names.
- Create a dedicated, access-controlled service for translating UUIDs to PII when necessary, keeping the translation mapping table isolated.

### Step 2.3: Configure Cryptographic Protection
Secure PII at the code and database layers:
- Ensure all database columns storing PII are configured for column-level encryption using AES-256.
- Enforce secure transport configurations (e.g., setting the HTTPS-only flag on cookies and securing API gateways to reject TLS version < 1.2).

### Step 2.4: Integrate Log Sanitization Filters
Set up log filters to scrub PII from outputs:
- Implement middleware or logger hooks that scan outgoing logs for common PII patterns (emails, SSNs, credit cards) using regex patterns.
- Replace detected PII with placeholder strings (e.g., `[REDACTED_EMAIL]`).
- Verify log safety by running validation checks using the token-saving workspace command prefix:
```bash
rtk pnpm --filter @ethang/agents-build test
```

### Step 2.5: Configure Retention and Secure Deletion
Set up data lifecycle policies:
- Configure database clean-up tasks that permanently delete expired user records.
- Ensure that deletion tasks use secure overwrites rather than soft-deletes when satisfying user requests to be forgotten.

### Step 2.6: Run Static and Dynamic Compliance Scans
Verify compliance:
- Run typescript compilation and linter suites to ensure no debug statements (like `console.log(user)`) remain in production code paths:
```bash
rtk pnpm --filter @ethang/agents-build lint
```

### Step 2.7: Integrate Secret Scanning Gates
Add pre-commit and CI/CD secret scanning rules to scan files for hardcoded API keys, private keys, or passwords. Ensure all credentials are loaded securely from environment variables or secure key vaults.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following privacy and data protection rules:

- [ ] **Privacy Impact Audited**: Did the agent evaluate if the code modifications handle, process, or store PII?
- [ ] **Data Minimization Applied**: Was the collection of user identifiers minimized to the absolute necessary minimum?
- [ ] **Pseudonymization Implemented**: Are transactional database records linked using UUIDs instead of direct PII?
- [ ] **Column-Level Encryption Configured**: Are database columns containing direct PII encrypted at rest using AES-256?
- [ ] **Log Filters Configured**: Are logger hooks implemented to detect and redact emails, passwords, and tokens?
- [ ] **Secure Transport Enforced**: Are cookie flags and network channels configured to require HTTPS and TLS 1.3?
- [ ] **No Native Dates**: Are data retention windows and timestamps calculated strictly using Luxon (`DateTime`)?
- [ ] **Index Signature Safety**: Do data serialization utilities access properties on index-signature objects via bracket notation?
- [ ] **Void Assertions Wrapped**: Are test cases verifying security filters wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent resolution mismatches?
- [ ] **No Destructive Reverts**: Were code reverts restricted to targeted `git restore` on modified files, preserving user changes?
- [ ] **Forbidden Words Scanned**: Has the rule been checked to ensure no forbidden workspace vocabulary or platforms are referenced?
- [ ] **Size Bounds Confirmed**: Is the final compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent execute compile, test, and lint validations using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are data protection designs and verification logs recorded in `walkthrough.md`?
- [ ] **Secure Deletion Verified**: Are data lifecycle tasks verified to execute permanent database deletion routines?
- [ ] **No Explicit Return Types**: Do TS functions rely on type inference rather than declaring explicit return types unless strictly necessary?
- [ ] **Acyclic Dependency Checked**: Was the package dependency tree checked to ensure no circular references were introduced?
- [ ] **Tokens Redacted**: Did the agent confirm that no authorization headers or JWT tokens are written to debug files or standard outputs?
- [ ] **Differential Privacy Applied**: Was differential privacy evaluated for statistical query APIs?
- [ ] **Secrets Scanned**: Were files scanned for hardcoded credentials before commit submission?
