export const ch13Security = {
  content: `# Software Security (SWEBOK v4, Chapter 13)

> Scope: building and maintaining secure software across the whole life cycle — fundamentals (CIA), secure SDLC, threat modeling, secure construction (CERT Top 10), security testing, vulnerability management (CVE/CWE/CAPEC/CVSS), and the OWASP Top 10 attack-surface taxonomy applied at review time. Security is designed in, never patched in.

## When to Apply

- A change touches authentication, authorization, sessions, or tokens.
- A change accepts external input (request params, form data, file uploads, deserialization).
- A change renders or stores user-controlled data, or handles PII / payment data.
- A new third-party dependency is added (CVE/CVSS gating).
- Designing a new flow or endpoint — run the threat-modeling procedure below.
- Reviewing a PR for the Security perspective (use the OWASP table + CERT Top 10 as the gate).

## Key Definitions

| Term | Definition |
|---|---|
| **Software Security** | Degree to which a product protects data so access matches authorization level (ISO/IEC 25010) |
| **Information Security** | Preserves Confidentiality, Integrity, Availability (CIA); may also cover authenticity, accountability, non-repudiation, reliability (ISO/IEC 27000) |
| **Confidentiality** | Information not disclosed to unauthorized individuals, entities, or processes |
| **Integrity** | Property of accuracy and completeness |
| **Availability** | Accessible and usable on demand by an authorized entity |
| **Cybersecurity** | Safeguarding people/orgs/nations from cyber risks at a tolerable level (ISO/IEC 27032) |
| **Vulnerability** | An error attackers can exploit (introduced in dev OR via third-party libs/COTS/OS) |
| **Security Pattern** | Recurring security problem in a context + well-proven generic solution |
| **Threat Modeling** | Design activity illustrating how a system is attacked, to specify mitigations |

## Secure SDLC — Security at Every Stage

> Software is only as secure as its development process. The SDLC spiral model views security holistically; designing security in reduces maintenance cost and increases reliability against security faults.

| Stage | Security activity |
|---|---|
| Requirements | Elicit/specify/prioritize via misuse & abuse cases, threat actors, risk assessment; maintain traceability throughout |
| Design | Prevent unauthorized disclosure/creation/change/deletion/denial; access control + cryptographic key management; **threat modeling** to specify mitigations |
| Patterns | Apply proven context-specific solutions (auth gateway, secure session mgmt) |
| Construction | Code security in via secure-coding rules (CERT Top 10); isolate privileged code |
| Testing | Static analysis + dynamic testing verify requirements met and no known vulnerabilities |
| Vulnerability Mgmt | Track CVE/CWE/CAPEC; mitigate third-party vulns; run disclosure process |

**Org context (informative):** SSE-CMM (ISO/IEC 21827) measures process capability; ISMS (ISO/IEC 27001:2022) is the documented security-management plan that continually raises requirements; DevSecOps integrates Dev+Security+Ops so security is an enabler, not a blocker.

## Threat Modeling Procedure (design-time)

Run during Security Design for every new flow/endpoint. Derived from misuse/abuse cases + threat actors + mitigation design.

1. **Identify assets** — data and resources to protect (PII, tokens, money, account data); state their CIA needs.
2. **Diagram the flow** — map entry points, trust boundaries, and data stores the change touches.
3. **Enumerate threats** — for each entry point write misuse/abuse cases; name the threat actor and what they want.
4. **Rate risk** — likelihood × impact; cross-reference CWE for the weakness class and CVSS band for severity.
5. **Specify mitigations** — choose a control/security pattern per threat (validation, authz, crypto, default-deny); document residual risk.
6. **Trace** — link each mitigation back to a security requirement so it survives into testing.

## CVSS Severity Bands — Dependency / Finding Gating

CVSS (Common Vulnerability Scoring System) expresses severity numerically; use the band to gate acceptance of third-party components and triage findings.

| CVSS v3.x score | Severity | Gate |
|---|---|---|
| 9.0 – 10.0 | Critical | Block merge / block adoption; fix or replace before release |
| 7.0 – 8.9 | High | Block merge; remediate before release (documented exception only) |
| 4.0 – 6.9 | Medium | Track and remediate within the release; no new introductions |
| 0.1 – 3.9 | Low | Backlog; fix opportunistically |
| 0.0 | None | No action |

Check every new dependency against CVE/CWE before adopting; binary analysis covers vulns hidden in compiled third-party components.

## OWASP Top 10 — Review Attack Surface

Apply at design and review. Stack-specific checks live in the review-security-checklist overlay.

| # | OWASP Category | Generic check |
|---|---|---|
| A01 | Broken Access Control | Every endpoint/route has explicit auth + authz; default deny |
| A02 | Cryptographic Failures | No deprecated algorithms (MD5, SHA-1, DES, RC4); secrets not in source |
| A03 | Injection | All external input sanitized before use in queries, templates, commands |
| A04 | Insecure Design | Security designed in, not bolted on; threat model for new flows |
| A05 | Security Misconfiguration | No default credentials; no unneeded features; error handling configured |
| A06 | Vulnerable & Outdated Components | New deps checked against CVE; CVSS score assessed and gated |
| A07 | Identification & Auth Failures | Session management correct; no credential exposure; brute-force protection |
| A08 | Software & Data Integrity Failures | CI/CD pipeline integrity; no unsigned/unverified updates |
| A09 | Logging & Monitoring Failures | Security events logged (login, access denied, validation failure) |
| A10 | SSRF | Server-side requests validate/restrict target URLs; no user-controlled redirects |

## CERT Top 10 Secure Coding Practices

Apply across every SDLC phase (CERT/CC):

1. **Validate input** — never trust external data; check type, range, length, encoding, format.
2. **Heed compiler/linter warnings** — treat as errors; zero-warning policy.
3. **Architect & design for security policies** — first-class concern, not an add-on.
4. **Keep it simple** — complexity hides vulnerabilities; reduce attack surface.
5. **Default deny** — deny by default; explicitly grant only what is needed.
6. **Least privilege** — each module runs with minimum rights/data.
7. **Sanitize data sent to other software** — escape output for DBs, shells, UIs, APIs.
8. **Defense in depth** — multiple independent layers; no single point of failure.
9. **Effective QA** — security testing is part of QA, with cases for every input boundary.
10. **Adopt a construction security standard** — e.g., CERT C / CERT secure coding standards.

**Construction rules (coding level):** isolate privileged code into smallest possible modules; validate every assumption or document the unvalidated ones; do not share memory objects between programs; check every function's error status and restore to safe state before terminating on error.

## Security Testing — Static vs Dynamic

| Approach | Technique | Finds | Limitation |
|---|---|---|---|
| Static | Source analyzers (SAST) | Injection, buffer overflow, insecure library use, code-pattern flaws | Misses hard-to-produce-state vulns; needs expert tuning |
| Static | Binary analysis | Vulns hidden by compiler optimizations or in compiled third-party libs | Cannot find all vulns |
| Dynamic | Vulnerability assessment | Weaknesses in the running system | Requires domain-skilled experts |
| Dynamic | Penetration testing / fuzzing | Exploitable weaknesses via malformed/random input at entry points | Must be authorized + within legal boundaries (else = illegal hacking) |

**Domain-specific surfaces:** Cloud/container — forgotten provisioned assets are a "ticking time bomb"; physical controls shift to provider, focus on IAM/secrets/segmentation. IoT — massive endpoint surface; harden endpoints and device-to-device comms. ML — model poisoning (corrupt training data) and evasion (adversarial inputs); needs adversarial testing.

## Decision Checklist

### Must Do
- Address CIA requirements at architecture level; run the threat-modeling procedure for every new flow/endpoint.
- Validate all external input (type, range, length, encoding) before use.
- Check new dependencies against CVE/CWE; gate by CVSS band (block Critical/High).
- Use the OWASP Top 10 + CERT Top 10 as the review gate on security-sensitive paths.
- Run static analysis as a CI gate, not an afterthought.
- Isolate privileged code into the smallest modules with documented privilege needs.
- Sanitize all output to databases, shells, external services, and UIs (default deny, least privilege).
- Apply defense in depth; log security events; maintain a vulnerability-disclosure process.

### Must Not Do
- Do not trust input from any external source without validation.
- Do not use default-allow access control — default deny only.
- Do not use deprecated/weak crypto (MD5, SHA-1, DES, RC4).
- Do not expose internal error details (stack traces, paths, SQL) to external callers.
- Do not store secrets in source code or commit history.
- Do not defer security review for schedule — retrofitting security costs more.

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Security as a final-phase gate | Too late for architectural fixes; only surface patches possible |
| Trusting external data without sanitization | Injection (SQL, command, XSS) |
| Skipping threat modeling on new flows | Missing mitigations ship; weakness class undetected until exploited |
| Single security layer | One bypass defeats all protection |
| Default allow instead of default deny | Overly permissive surface |
| Hardcoded credentials | Secrets leak via repos and logs |
| Ignoring compiler/static-analysis warnings | Known vulnerability patterns left unresolved |
| Adopting deps without CVSS gating | High/Critical CVEs enter the build unreviewed |
| No vulnerability disclosure process | Security issues silently persist in production |

## Standards Referenced

| Standard | Scope |
|---|---|
| ISO/IEC 25010:2023 | Product quality model (defines Software Security) |
| ISO/IEC 27000:2018 | Information security vocabulary |
| ISO/IEC 27001:2022 | ISMS requirements |
| ISO/IEC 15408:2022 (Common Criteria) | IT product security evaluation criteria |
| ISO/IEC 21827 (SSE-CMM) | Security engineering process capability |
`,
  path: "resources/ch13-security.md",
  title: "Software Security",
  triggers: [
    "security",
    "auth",
    "token",
    "XSS",
    "injection",
    "CVE",
    "OWASP",
    "PII"
  ] as const
};
