export const ch14Professional = {
  content: `# Software Engineering Professional Practice (SWEBOK v4, Chapter 14)

> Scope: professional obligations, ethics codes, legal liability, IP, GDPR/CCPA data privacy, dark patterns, trade-off analysis, and team dynamics. Applied as a compliance and ethics lens during code review.

## When to Apply

| Trigger | Action |
|---|---|
| PR touches personal data collection, storage, or transfer | Run GDPR/CCPA decision checklist |
| PR contains UI/UX changes (forms, defaults, opt-ins/outs) | Run dark pattern identification checklist |
| PR introduces new third-party dependency or open-source component | Check IP type (patent/copyright/trade secret) and license compatibility |
| PR decision involves cost vs. safety/security trade-off | Require documented trade-off rationale with disclosed conflicts of interest |
| PR suppresses or hides error states, warnings, or risk disclosures | Flag as ethics violation (omission) |
| Code handles NDA-covered data, proprietary algorithms, or exported software | Check employment contract and trade compliance triggers |

## Key Definitions

| Term | Definition |
|---|---|
| **Professionalism** | Conducting services to defined standards in both process and end product; basis for liability. |
| **Certification** | Individual competency confirmation at a stated level; voluntary in software engineering. |
| **Licensing** | Government-issued authorization to perform specific engineering activities; mandatory in some jurisdictions. |
| **Negligence** | Failure to follow accepted standards or practice; primary liability theory for software engineers. |
| **Dark Pattern** | Deceptive UI/UX design that misleads users into actions they would not knowingly choose. Explicitly unethical (SWEBOK v4 §1.7.9). |
| **Trade Secret** | Non-public asset providing competitive advantage; legally protected if stolen, but lost if independently derived. |
| **GDPR** | EU/EEA data protection regulation (enforceable May 2018); primary global model for privacy law. |
| **CCPA** | California Consumer Privacy Act (2018); parallel rights and obligations to GDPR for California residents. |

## Code of Ethics Decision Points

Apply IEEE CS/ACM/IFIP codes. Violations are acts of **commission** or **omission**:

| Category | Violation example | PR review flag |
|---|---|---|
| Commission | Falsifying test results or performance data | Block merge |
| Commission | Certifying work known to be defective | Block merge |
| Commission | Disclosing confidential client/employer information | Block merge |
| Omission | Suppressing known safety or security risks | Block merge |
| Omission | Hiding warnings or dangerous-use conditions from users | Block merge |
| Omission | Omitting proper attribution of third-party code | Require fix |

## Dark Pattern Identification Checklist

Dark patterns = deceptive UI/UX designed for exploitability over usability. Identify these in PR diffs:

| Pattern | Signal in code | Status |
|---|---|---|
| Hidden opt-out | Consent default = true; unchecking requires multiple steps | Reject |
| Confirm-shaming | Decline button labeled "No, I don't want savings" or similar | Reject |
| Misdirection | Prominent button leads to unintended action; desired action buried | Reject |
| Misleading defaults | Pre-checked boxes for marketing consent, data sharing | Reject |
| Roach motel | Easy to subscribe, hard to cancel; asymmetric UX | Reject |
| Disguised ads | UI elements styled to look like content or system messages | Reject |
| Drip pricing | Total cost not shown until final checkout step | Reject |

## GDPR / CCPA Decision Checklist

Run when PR touches any personal data (name, email, IP address, usage events, payment data, device ID):

| Requirement | Check | Failure action |
|---|---|---|
| **Purpose limitation** | Data is collected only for a stated, specific purpose | Remove excess collection |
| **Data minimization** | Only the minimum fields necessary are collected | Remove excess fields |
| **Legal basis** | Consent, contract, or legitimate interest is documented | Block until documented |
| **Data subject rights** | Access, deletion, correction, portability endpoints exist or are planned | File follow-up ticket |
| **Opt-out / withdrawal** | User can revoke consent as easily as they gave it | Require symmetric UX |
| **Cross-border transfer** | Data transferred outside EU/EEA only with Standard Contractual Clauses or adequacy decision | Block until confirmed |
| **Retention limit** | Data is deleted or anonymized after the stated retention period | Require scheduled cleanup |

## Liability Trigger Matrix

| Liability theory | Trigger condition | Defense |
|---|---|---|
| **Negligence** | Failed to follow accepted practice or applicable standard | Document standards followed; cite IEEE/ISO refs |
| **Strict liability** | Product caused harm regardless of care taken | Demonstrate fitness-for-purpose testing; warnings present |
| **Breach of warranty** | Product does not meet implied or express fitness/safety promise | Scope warranties explicitly in contract; document limitations |
| **Professional malpractice** | Incompetence or inadequate work concealed from client | Adhere to standards; never conceal defects |

Under US tort law: any harmed party may sue even without a guarantee (privity is not a defense).
Defense: documented adherence to standards and accepted practices.

## Intellectual Property Quick Reference

| IP type | Protects | Relevant in code review |
|---|---|---|
| **Copyright** | Original expression (code, docs) for a limited term | Check license compatibility before including third-party code |
| **Patent** | Inventions/algorithms for a limited term | Flag novel algorithms that may infringe or create IP |
| **Trademark** | Brand names, logos, identifiers | Do not use third-party marks in UI without license |
| **Trade Secret** | Non-public competitive assets; no time limit | Do not commit proprietary algorithms or data to public repos |
| **NDA / IP assignment** | Employer owns work-for-hire and contracted inventions | Code using non-employer equipment may have split ownership |

## Employment Contract and Trade Compliance Triggers

| Situation | Action required |
|---|---|
| Code written using personal equipment for employer project | Clarify IP ownership per contract before committing |
| Algorithm derived from work at a prior employer | Flag for legal review — may be employer-owned trade secret |
| Dependency includes hardware/software component with export classification | Consult trade compliance before shipping to foreign customers |
| Software re-exported or re-used in a sanctioned country or by a sanctioned entity | Stop; consult trade experts; do not ship without government license |

## Trade-Off Analysis Protocol

Use when requirements conflict or a cost/safety/schedule decision must be made:

1. State design goals explicitly — list criteria and assign relative weights
2. Identify competing requirements — note which are hard constraints vs. preferences
3. Evaluate each alternative against each criterion — use measurable data where possible
4. Disclose any conflict of interest before presenting recommendations
5. Document chosen alternative and rationale — required for high-consequence decisions

**Ethical obligation**: Objective and impartial weighting; no suppression of unfavorable alternatives.

## Decision Checklist

### Must Do
| # | Rule |
|---|---|
| 1 | Follow IEEE/ACM/IFIP Code of Ethics — public health, safety, and welfare first |
| 2 | Disclose known risks and limitations to stakeholders; never suppress for schedule pressure |
| 3 | Apply GDPR/CCPA data minimization and purpose limitation to all personal data handling |
| 4 | Check IP type and license before including any third-party code or algorithm |
| 5 | Document trade-off rationale for cost vs. safety/security decisions |
| 6 | Frame all peer review feedback on the work product, never the author |
| 7 | Keep documentation for at least the product life cycle or required regulatory period |
| 8 | Adhere to accepted standards — this is the primary defense against negligence liability |

### Must Not Do
| # | Rule |
|---|---|
| 1 | Do not implement dark patterns — explicit code-of-ethics violation |
| 2 | Do not certify, approve, or merge work known to be defective or incomplete |
| 3 | Do not disclose confidential client or employer information |
| 4 | Do not falsify test results, performance data, or risk assessments |
| 5 | Do not collect, store, or transfer personal data beyond stated purpose (GDPR/CCPA) |
| 6 | Do not suppress safety or security risks to meet deadlines |
| 7 | Do not commit trade secrets, proprietary algorithms, or NDA-covered data to repositories |

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| Suppressing safety/security risks to meet deadline | Professional negligence; tort liability |
| Falsifying test results or metrics | Code-of-ethics violation; product liability exposure |
| Dark patterns in UI/UX | Ethics violation; GDPR/CCPA regulatory risk |
| No conflict-of-interest disclosure in trade-off analysis | Biased decisions; trust erosion; potential liability |
| Collecting more personal data than the stated purpose requires | GDPR/CCPA violation; data breach amplification |
| Including third-party code without checking license compatibility | Copyright infringement; IP liability |
| Committing NDA-covered or employer-owned IP to a public repo | Trade secret loss; employment contract breach |
| Personal critiques in code review | Toxic team culture; chilling effect on intellectual honesty |

## Standards Referenced

- IEEE Code of Ethics (2020) — ACM Code of Ethics and Professional Conduct (2018) — IFIP Code of Ethics (2021)
- EU GDPR (2016/2018) — California CCPA (2018)
- ISO/IEC 24773-1/24773-4 — Software and Systems Engineering Certification
- WIPO — trademark, patent, and trade secret international framework
- WTO — international trade and export compliance framework
`,
  path: "resources/ch14-professional.md",
  title: "Software Engineering Professional Practice",
  triggers: [
    "ethics",
    "GDPR",
    "CCPA",
    "dark-pattern",
    "privacy",
    "liability",
    "IP",
    "code-of-ethics"
  ] as const
};
