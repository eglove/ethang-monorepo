---
id: "SWREQ-302"
type: "software_requirement"
name: "Software TDD Verification Loop"
specification: "The software agent SHALL execute and verify test red/green/refactor state transitions using the package-specific Vitest command."
derives_from:
  - "SYSARCH-301"
---

# SWREQ-302: Software TDD Verification Loop

## 1. Description
The agent must verify that every code modification is governed by a failing test that subsequently transitions to passing.

## 2. Technical Details
- Commands are scoped using `pnpm --filter <package>`.
- Test files must reside adjacent to source files.
