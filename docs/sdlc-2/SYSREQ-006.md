---
id: "SYSREQ-006"
type: "system_requirement"
name: "Escalation and Safety Gates"
specification: "The system SHALL immediately halt and escalate to the developer if any SARA validation errors, missing parent requirements, or undocumented schema mutations are detected."
derives_from:
  - "SCEN-001"
---

# SYSREQ-006: Escalation and Safety Gates

## 1. Description
To enforce strict process quality gates, the skill must prevent proceeding with architecture synthesis if the requirements are invalid or if the final output results in broken trace links.

## 2. Technical Details
- If `sara check` output contains warnings or errors, the skill prints the exact error/warning trace.
- The assistant prompts the user with recommendations to resolve the issues and waits for user input.
- The skill does not generate design templates or architecture stubs until the requirements are valid.
