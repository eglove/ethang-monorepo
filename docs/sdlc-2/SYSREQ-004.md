---
id: "SYSREQ-004"
type: "system_requirement"
name: "SARA Output and Traceability"
specification: "The system SHALL output SARA-compliant Markdown files in 'docs/<feature-name>/' with YAML frontmatter containing 'satisfies' references that link back to the ingested system requirements."
derives_from:
  - "SCEN-001"
---

# SYSREQ-004: SARA Output and Traceability

## 1. Description
All architecture and system design decisions must be documented in a structured, traceable format.

## 2. Technical Details
- The generated design files must be saved under `docs/<feature-name>/` at the root of the repository.
- Each design file must have valid YAML frontmatter specifying:
  - `id`: A unique string with prefix `SYSARCH` or `SWDD` (e.g. `SYSARCH-001`).
  - `type`: `system_architecture` or `software_detailed_design`.
  - `name`: Descriptive name of the architecture design.
  - `satisfies`: A list containing the parent system requirement IDs (e.g., `SYSREQ-001`).
- The prose must detail the system components, data structures, and APIs.
