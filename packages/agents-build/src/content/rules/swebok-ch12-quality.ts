import { defineRule } from "../../define.ts";

export const swebokCh12Quality = defineRule({
  content: `# Software Quality (SWEBOK v4, Chapter 12)

> Scope: practices and techniques for software quality planning and appraisal across development, maintenance, and operation. Owns the error/defect/failure taxonomy, CoSQ, quality attribute checklist, V&V technique selection, and peer reviews.

## When to Apply

- Classifying anomalies (error vs defect/fault vs failure) for RCA.
- Setting or auditing PR/CI quality gates.
- Choosing review or audit types for work products.
- Planning V&V techniques based on integrity level.
- Writing measurable acceptance criteria for quality attributes.
- Justifying SQA investment via cost-of-quality (CoSQ) arguments.

## Key Definitions

| Term | Meaning (ISO/IEC/IEEE 24765, IEEE 730) |
|---|---|
| **Software quality** | Degree to which a product meets established requirements and stakeholder needs |
| **Error** | Human action producing an incorrect result |
| **Defect (= Fault)** | Imperfection in a work product (caused by an error) that must be repaired/replaced |
| **Failure** | Externally visible deviation from spec; produced when execution hits a defect |
| **SQA** | Activities assessing process adequacy and providing evidence of product quality |
| **V&V** | Verification = building product right (meets spec); Validation = building right product (fits use) |
| **Integrity level** | Criticality value setting the minimum required V&V rigor |

## Defect Characterization and RCA

- Track both defect **count and type**. Defect classification taxonomies must precede counting to make analysis useful.
- Defect data should be recorded at the point of detection (linter, compiler, PR review).
- Build historical defect profiles to focus V&V efforts on risk areas in future projects.

## Cost of Software Quality (CoSQ)

| Category | Sub-category | Description / Examples |
|---|---|---|
| **Conformance** | Prevention | Quality infrastructure, training, tools, templates, process improvement |
| | Appraisal | Peer reviews, inspections, audits, testing |
| **Nonconformance** | Internal failure | Rework on defects caught pre-delivery (before customer sees them) |
| | External failure | Repair of defects post-delivery, customer downtime, lost reputation |

Prevention and appraisal are investments that dramatically shrink expensive external failure costs.

## ISO/IEC 25010 Quality Attributes

Quality requirements must be planned, implemented, and **measurable**:
- **Functional suitability**: Completeness, correctness, appropriateness.
- **Performance efficiency**: Time behavior, resource utilization, capacity.
- **Compatibility**: Co-existence, interoperability.
- **Usability**: Learnability, operability, user protection, accessibility.
- **Reliability**: Maturity, availability, fault tolerance, recoverability.
- **Security**: Confidentiality, integrity, accountability, authenticity.
- **Maintainability**: Modularity, reusability, modifiability, testability.
- **Portability**: Adaptability, installability, replaceability.

Manage attribute conflicts (e.g. security vs. performance) via documented trade-offs.

## V&V Technique Selection

V&V begins early (requirements), not at testing. Choose technique based on the artifact:

| Family | Executes code? | Techniques | Choose when |
|---|---|---|---|
| **Static** | No | Code reading, peer reviews, linter, data-flow analysis | Examining requirements, design, or source code |
| **Dynamic** | Yes | Unit/integration/system testing, simulation | Verifying behavior on real inputs |
| **Formal** | Math model | Theorem proving, model checking | Critical safety/security parts of system |

## Peer Reviews and Audits

- **Peer review** (e.g., PR review): Find and remove defects early.
- **Audit**: Formal compliance verification (standards/requirements) by independent party.

Review types (ISO/IEC 20246):
- **Ad hoc**: Informal check without structure.
- **Checklist-based**: Checked against defined rules (e.g. style guide, security).
- **Scenario-based**: Guided walkthrough using specific usage scenarios.
- **Perspective-based**: Reviewer adopts one technical viewpoint (e.g. security).

## Quality Measurement

- **Error density**: Errors per unit size (KLOC or page count).
- **Defect density**: Defects found / size.
- **Failure rate**: Mean time to failure (MTTF).
- **Control charts**: Used to track defect trends and flag process slips.

## Decision Checklist

### Must Do
- Classify defects by type (taxonomy) to drive root cause analysis (RCA).
- Gate every PR on static analysis (lint, type check) before human review.
- Begin V&V at the requirements phase, not at testing.
- Define measurable acceptance criteria for all quality attributes.
- Use integrity levels to set the minimum required V&V rigor.
- Record defect data at the point of detection.

### Must Not Do
- Do not treat SQA as synonymous with testing; it covers process and product.
- Do not track defect counts without also tracking defect types/causes.
- Do not defer non-functional (performance, security) checks to production.

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| SQA is just testing | Integrate V&V and process reviews across life cycle |
| Counting defects without classifying | Classify by type; use 5-Whys to find root causes |
| Static analysis as post-hoc check | Enforce as a blocking PR gate |
| Untestable "user-friendly" requirements | Attach a measurable acceptance criterion |
| V&V deferred to final testing | Review requirements/design; shift V&V left |
| Dynamic testing only on critical code | Add static + formal checks per integrity level |

## Standards Referenced
- **IEEE 730**: SQA Processes
- **IEEE 1012**: System, Software, and Hardware V&V
- **ISO/IEC 25010**: Quality Models (SQuaRE)
- **ISO/IEC 20246**: Work Product Reviews
`,
  description: "Software Quality: quality assurance, metrics, and RCA",
  filename: "swebok-ch12-quality",
  trigger: "model_decision"
});
