---
id: "SYSREQ-304"
type: "system_requirement"
name: "ESLint Auto-Fix Loop Guard"
specification: "The system SHALL cap ESLint autofix attempts at a maximum of 3 rounds. If errors persist, the system must immediately stop and delegate to the user."
derives_from:
  - "SCEN-003"
---

# SYSREQ-304: ESLint Auto-Fix Loop Guard

## 1. Description
The system must avoid infinite loops when trying to fix compiler/linter issues that require human intervention.

## 2. Technical Details
- If linting issues remain after 3 rounds, the agent must stop and delegate the resolution to the user.
