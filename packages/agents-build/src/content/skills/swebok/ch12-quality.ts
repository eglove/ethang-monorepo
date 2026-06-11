export const ch12Quality = {
  content: `# Software Quality (SWEBOK v4, Chapter 12)

> Scope: practices, tools, and techniques for understanding software quality and for planning and appraising it across development, maintenance, and operation — from both a product and a process perspective. Owns the error/defect/failure taxonomy, CoSQ categories, ISO 25010 attribute checklist, V&V technique families, SQA process-vs-product split, review/audit selection, and integrity levels. The theory the rca-five-whys defect taxonomy and the review-design-checklist quality-gate build on.

## When to Apply

- Classifying an anomaly (error vs defect/fault vs failure) or building a defect taxonomy for RCA.
- Setting or auditing a PR/CI quality gate (which static/dynamic checks gate a merge).
- Choosing a review or audit type for a work product.
- Deciding which V&V techniques a change requires given its criticality (integrity level).
- Writing measurable acceptance criteria for a quality attribute ("-ility").
- Justifying SQA investment to management via cost-of-quality argument.

## Key Definitions

| Term | Meaning (ISO/IEC/IEEE 24765, IEEE 730) |
|---|---|
| **Software quality** | Degree to which a product meets established requirements — itself dependent on how well those requirements represent stakeholder needs |
| **Error** | Human action producing an incorrect result (human error) |
| **Defect (= Fault)** | Imperfection in a work product that fails its requirements/specs and must be repaired or replaced. Inserted when a person makes an error; hides until discovered |
| **Failure** | Termination of a system's ability to perform a required function; an externally visible deviation from spec. Produced when execution reaches a defect |
| **SQA** | Activities that assess process adequacy and provide evidence that processes produce products of suitable quality; NOT just testing |
| **SQC** | Quality Control — activities that measure, evaluate, and report on artifact quality across the life cycle |
| **SQM** | Coordinated activities to direct/control an org with regard to software quality (umbrella over SQA, V&V, reviews/audits, SCM) |
| **V&V** | Verification = building the product right (phase output meets phase-entry conditions); Validation = building the right product (fits intended use) |
| **IV&V** | V&V by an org technically, managerially, AND financially independent of the developer |
| **Integrity level** | Value encoding project-unique criticality (complexity, risk, safety/security level, reliability) that sets the MINIMUM required V&V techniques |

A fault may never manifest as a failure; testing reveals failures, not faults directly. SQA has two aspects: **process assurance** (processes conform to spec) and **product assurance** (products meet quality requirements).

## Defect Characterization and RCA (theory for rca-five-whys)

- Track both the **number AND the type** of errors/defects/failures. Counts alone cannot identify underlying causes — establish a meaningful **defect classification taxonomy** before counting.
- Two responses to a found defect: (1) remove it early from the work product; (2) eliminate its CAUSE via **Root Cause Analysis** — analyze/summarize findings, then improve the process/technique/tool so the class cannot recur.
- Record defect data at the point of detection (reviews/inspections have people present to log it; automated tools emit trend reports) — unrecorded data is lost.
- Build **defect profiles** per application domain from history; use them on the next project to focus effort where defects are most likely, and as delivery-readiness benchmarks.

## Cost of Software Quality (CoSQ)

| Category | Sub-category | Examples |
|---|---|---|
| **Conformance** | Prevention | SPI, quality infrastructure, tools, templates, training (often org-wide, not per-project) |
| | Appraisal | Reviews, audits, testing — finding errors/defects (extends to subcontractors) |
| **Nonconformance** | Internal failure (pre-delivery) | Rework on defects caught during appraisal, before the customer sees them |
| | External failure (post-delivery) | Repair + re-test of failures found in the field; PLUS customer lost productivity, lost data, reputation, public/environmental impact |

- Seek the **optimal CoSQ** = minimal total cost for the target quality level. Prevention + appraisal are investments that shrink far-larger failure costs.
- Argument for management: skipping SQA is not free — it shifts cost into the most expensive (external failure) bucket. Cost-to-fix rises sharply the later a defect is found.

## ISO/IEC 25010 Product Quality Attribute Checklist

Every quality requirement ("-ility") must be planned, implemented, and **measurable at acceptance** — "should be fast/secure" is not a criterion.

| Characteristic | Sub-characteristics to give acceptance criteria |
|---|---|
| **Functional suitability** | Completeness, correctness, appropriateness |
| **Performance efficiency** | Time behavior, resource utilization, capacity |
| **Compatibility** | Co-existence, interoperability |
| **Usability** | Learnability, operability, user error protection, accessibility |
| **Reliability** | Maturity, availability, fault tolerance, recoverability |
| **Security** | Confidentiality, integrity, non-repudiation, accountability, authenticity |
| **Maintainability** | Modularity, reusability, analyzability, modifiability, testability |
| **Portability** | Adaptability, installability, replaceability |

Attributes **conflict**: e.g. encrypting data raises Security but can lower Performance efficiency. Document and manage trade-offs; don't optimize one silently at another's expense.

## Selecting a V&V Technique

V&V begins **early** (requirements phase), not at test time — late defects cost exponentially more. Pick technique family by what is available to examine:

| Family | Executes code? | Techniques | Choose when |
|---|---|---|---|
| **Static** | No | Code reading, peer review, control-flow / data-flow analysis, document/model inspection | Examining requirements, design, or source pre-execution; only way to find non-executable/dead code |
| **Dynamic** | Yes | Testing (black/white box), simulation, model analysis, model checking | Behavior on real inputs; see Ch 5 for test design |
| **Formal** | Math model | Model checking, theorem proving, formal specification languages | Crucial safety/security parts of critical systems |

- Reviews and audits ARE static analysis (no code executed).
- Use **IV&V** for very critical software. Keep **traceability** among work products to strengthen V&V.

## Selecting a Review or Audit Type

Peer review (e.g. a code review via pull request) = peers review a work product to find defects for removal before merge. Catching a defect before a component is coded is far cheaper than after.

| Review type (ISO/IEC 20246) | Structure | Choose when |
|---|---|---|
| **Ad hoc** | None — find as many defects of any type as possible | Quick informal pass, low setup |
| **Checklist-based** | Systematic against a checklist | Recurring defect classes; enforce consistency |
| **Scenario-based** | Structured guidance on how to read the product | Reviewers need direction through complex artifacts |
| **Perspective-based** | Reviewer adopts ONE technical perspective | Want depth from a specific viewpoint (security, performance) |
| **Role-based** | Reviewer evaluates as various stakeholder roles | Cross-cutting acceptance concerns |

**Audit** = more formal than a review; often performed by a third party for independence. Used to verify compliance against standards/requirements.

| Lifecycle review | Gate it protects |
|---|---|
| System requirements review | Understanding adequate to enter design with acceptable risk |
| Functional / preliminary design review | Can proceed into preliminary/detailed design; reqs consistent with budget/schedule/risk |
| Preliminary design review | Design mature enough to enter detailed design |
| Test readiness review | Test objectives/methods/scope/safety/resources ready |
| Production readiness review | Design + production planning ready for production |

## Integrity Levels and Dependability

- An integrity level is assigned at the **system** level (software integrity is part of it), can change as software evolves, and sets the **minimum** V&V techniques. Higher integrity ⇒ more rigorous V&V + possible IV&V + independence of the SQA function.
- **Dependability** (the dominant requirement for safety-critical systems beyond function) regroups availability, reliability, maintainability/supportability, safety, security.
- Three complementary failure-risk reductions: **avoidance** (don't inject faults), **detection and removal** (find/remove before operation), **damage limitation** (bound the consequence).
- An **assurance case** = auditable artifact: claims + arguments linking evidence/assumptions to the claims; used to argue a critical property is satisfied.

## Quality Measurement

| Measure | Definition |
|---|---|
| **Error density** | Errors per unit size of document/software |
| **Defect density** | Defects found / software size |
| **Failure rate** | Mean time to failure (MTTF) |
| **Reliability models** | Built from failure data; estimate probability of future failures and when to stop testing |

Analysis: descriptive statistics (Pareto, run charts, scatter plots), statistical tests (binomial, chi-squared), trend analysis (control charts — flag slipping schedule or rising defect class), prediction (reliability models).

## Decision Checklist

**Must Do**
- Classify every defect by TYPE (taxonomy), not just count it — required for RCA.
- Gate every PR on static analysis (lint, type check, complexity) before human review — static analysis is a gate, not optional.
- Begin V&V at the requirements phase; review requirements and design, not only code.
- Give each quality attribute ("-ility") a measurable acceptance criterion.
- Pick the V&V family by what's available (static for artifacts, dynamic for behavior, formal for critical parts) and the review type by the goal.
- Let integrity level set the MINIMUM V&V rigor; escalate to inspections/formal/IV&V as criticality rises.
- Record defect data at the point of detection; feed RCA back into process improvement.
- Keep the SQA function organizationally independent for safety-critical/high-integrity work.

**Must Not Do**
- Treat SQA as a synonym for testing — it is process + product assurance, far broader.
- Track defects by count only, with no type/cause — no learning from history.
- Run static analysis only on CI failure instead of as a merge gate.
- Defer non-functional (performance/security/privacy) checks until the field fails.
- Rely on dynamic testing alone for safety-critical software (static + formal also required).
- Subordinate the QA function to the team it audits in critical systems.

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| "SQA = testing" | Plan process + product assurance across the life cycle |
| Defect counts with no taxonomy | Classify by type; drive RCA from the classes |
| Static analysis as CI afterthought | Enforce as a blocking PR gate |
| "Should be fast/secure" requirement | Attach a measurable acceptance criterion |
| V&V deferred to test phase | Review requirements/design; shift V&V left |
| 100% line coverage, 0% branch/state | Add branch + state-table cases (see Ch 5) |
| Dynamic testing only on critical code | Add static + formal analysis per integrity level |
| QA reports to the team it audits | Make the SQA function organizationally independent |

## Standards Referenced

| Standard | Subject |
|---|---|
| **IEEE 730:2014** | Software Quality Assurance Processes |
| **IEEE 1012:2016** | System, Software, and Hardware V&V (by integrity level) |
| **ISO/IEC 25010:2011** | Software/System Quality Models (SQuaRE) |
| **ISO/IEC 20246:2017** | Work Product Reviews |
| **ISO/IEC/IEEE 24765:2017** | Vocabulary (error/defect/failure/traceability) |
| **ISO 9001:2015 / ISO/IEC/IEEE 90003:2018** | Quality Management Systems / its application to software |
`,
  path: "resources/ch12-quality.md",
  title: "Software Quality",
  triggers: [
    "quality",
    "defect",
    "V&V",
    "SQA",
    "ISO-25010",
    "CoSQ",
    "RCA",
    "peer-review",
    "integrity-level",
    "audit"
  ] as const
};
