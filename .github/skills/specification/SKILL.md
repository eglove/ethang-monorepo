---
description: Interview-style requirements discovery following SWEBOK v4 / ISO/IEC 29148 standards, producing BDD documents in /docs/<feature-name>/ directories.
name: specification
---

# Specification Interview & BDD Document Generation

Run a `/specification` session to interview the user about a feature, produce requirements following SWEBOK v4 / ISO/IEC 29148 standards, and generate Behavior-Driven Development (BDD) documents in a `/docs/<feature-name>/` directory at the repository root.

## When to Invoke

Invoke this skill when the user wants to define a new feature or capability. The skill MUST be used when the user mentions 'specification', 'spec', 'requirements interview', 'BDD documents', 'feature spec', or 'planning a new feature'.

## Interview Workflow

The agent MUST conduct a relentless, interview-style discovery session. Do NOT assume requirements — actively interrogate every assumption. The interview follows these phases:

1. **Phase 1 — Feature Identity**: Ask the user for a concise feature name and high-level purpose. This name will be used as the directory name `/docs/<feature-name>/`.
1. **Phase 2 — Stakeholder Analysis**: Ask who the stakeholders are (users, clients, operators, etc.). Identify distinct user classes and their goals.
1. **Phase 3 — Functional Discovery**: Ask 'why' relentlessly. For each capability the user describes, ask 'what happens when this fails?', 'who triggers this?', 'what changes after this succeeds?'. Do not accept vague answers — push for concrete actor-action statements.
1. **Phase 4 — Constraints & QoS**: Ask about non-functional requirements — performance, security, reliability, scalability targets. Push for quantitative values (e.g., 'fast' is unacceptable — 'under 200ms p95' is required). Apply Gilb's Planguage where appropriate.
1. **Phase 5 — Edge Cases & Exceptions**: Ask 'what should NOT happen?', 'what are the boundaries?', 'what happens under load or failure?'. Surface tacit knowledge by asking about existing manual processes.
1. **Phase 6 — Confirmation**: Summarize all discovered requirements back to the user. Ask for confirmation or corrections before proceeding to document generation.

## Document Generation

After the interview is confirmed, generate the following documents in `/docs/<feature-name>/` at the repository root. Each feature MUST have its own directory.

### Directory Structure

```
docs/<feature-name>/
├── requirements.md        # Structured requirements (SWEBOK v4 / ISO/IEC 29148)
├── bdd/
│   ├── normal-course.feature    # Given-When-Then for happy paths
│   ├── exceptions.feature       # Given-When-Then for error/edge cases
│   └── boundaries.feature       # Given-When-Then for boundary conditions
└── README.md              # Feature overview and traceability index
```

### requirements.md — Standards-Compliant Specification

The requirements document MUST follow SWEBOK v4 Chapter 1 and ISO/IEC 29148 standards. It MUST contain:

* **Document Metadata**:
	* A header with feature name, version, date, and status (Draft/Approved).
	* A stakeholder section listing all identified stakeholder classes.
* **Requirement Identification**:
	* Each requirement MUST have a unique identifier (e.g., REQ-F001, REQ-NF001).
	* Each requirement MUST be classified as Functional (F) or Non-Functional (NF).
* **Specification Format**:
	* Functional requirements MUST use structured natural language (Actor-Action format or Use Case).
	* Non-functional requirements MUST be quantitative using Gilb's Planguage attributes (Scale, Meter, Minimum, Target).
* **Traceability**:
	* Each requirement MUST include: description, rationale, source (stakeholder), priority, and acceptance criteria.
	* BDD Given-When-Then scenarios MUST be referenced from the `bdd/` subdirectory.

### BDD Feature Files — Gherkin Syntax

Generate `.feature` files using Gherkin syntax (Given-When-Then). Follow these rules:

* **normal-course.feature**: Happy-path scenarios. Each scenario MUST have a clear Given (context), When (action), and Then (expected outcome). Use Scenario Outline with Examples tables for parameterized cases.
* **exceptions.feature**: Error paths, failure modes, and exception handling. Cover what happens when preconditions fail, when systems are unavailable, and when users perform invalid actions.
* **boundaries.feature**: Boundary value analysis and edge cases. Test at, just below, and just above boundary values for every quantitative constraint identified in the interview.

### README.md — Traceability Index

The README MUST contain:

* Feature overview (2-3 sentences summarizing purpose).
* Links to requirements.md and each BDD feature file.
* Traceability matrix mapping requirement IDs to BDD scenarios.
* Open questions or assumptions that need stakeholder validation.

## Compliance Checklist

* Was the interview conducted in a relentless questioning, no assumptions accepted style?
* Were all stakeholder classes identified and documented?
* Is each requirement uniquely identified and classified as Functional or Non-Functional?
* Are functional requirements written in structured natural language (Actor-Action or Use Case)?
* Are non-functional requirements quantitative with Gilb's Planguage attributes?
* Does every requirement have a rationale, source, priority, and acceptance criteria?
* Are BDD scenarios written in Gherkin Given-When-Then syntax?
* Do BDD files cover normal courses, exceptions, and boundaries?
* Is the document structure independent of the project's software development lifecycle?
* Does the README contain a traceability matrix linking requirements to BDD scenarios?
* Was the user given the opportunity to review and confirm requirements before document generation?

## SWEBOK v4 Reference Resources

This skill directly references the following SWEBOK v4 Chapter 1 resources from the `swebok` skill. These are not copied — they are linked via relative path. When the agent needs detailed domain theory, conceptual foundations, or compliance checklists, it MUST read the corresponding file from the swebok skill directory.

* [requirements-fundamentals.md](../swebok/resources/requirements-fundamentals.md) — Classification of requirements, Perfect Technology Filter, recursive design, derived requirements.
* [requirements-elicitation.md](../swebok/resources/requirements-elicitation.md) — Stakeholder analysis, elicitation techniques, tacit knowledge discovery.
* [requirements-analysis.md](../swebok/resources/requirements-analysis.md) — Conflict resolution, feasibility, quality of service economics.
* [requirements-specification.md](../swebok/resources/requirements-specification.md) — Structured natural language, BDD Given-When-Then, Gilb's Planguage, model-based specs.
* [requirements-validation.md](../swebok/resources/requirements-validation.md) — Five validation questions, reviews, simulation, prototyping, testability.
* [requirements-management-activities.md](../swebok/resources/requirements-management-activities.md) — Change control, traceability, scope matching.

Do not produce any conversational output or solicit user input during document generation. The interview phase is the only interactive phase.
