---
id: "SYSREQ-402"
type: "system_requirement"
name: "Linter and Build Verification Gate"
specification: "The system SHALL execute linter and build commands and enforce a 3-attempt guardrail for linter autofixes."
derives_from:
  - "SCEN-004"
---

# SYSREQ-402: Linter and Build Verification Gate

## 1. Description
The feature code must compile cleanly and pass static analysis checks.

## 2. Technical Details
- Executing `pnpm --filter <package> lint --fix` up to a maximum of 3 times.
- Executing `pnpm --filter <package> build`.
- If issues persist after 3 attempts, halt and request human intervention.
