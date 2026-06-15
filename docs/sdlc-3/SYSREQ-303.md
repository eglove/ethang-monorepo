---
id: "SYSREQ-303"
type: "system_requirement"
name: "Coding Standards Enforcement"
specification: "The system SHALL enforce Phase 3 coding standards including arrow functions, accessibility modifiers, index signature notation, and Yoda comparison formatting."
derives_from:
  - "SCEN-003"
---

# SYSREQ-303: Coding Standards Enforcement

## 1. Description
The system must ensure all implementation changes strictly adhere to Phase 3 coding guidelines.

## 2. Technical Details
- All functions must use arrow syntax.
- Omit explicit return types in TS unless strictly necessary.
- Annotate all class members and properties with explicit accessibility modifiers (`public`/`private`/`protected`).
- Use bracket notation `obj["prop"]` for index-signature types.
- Format comparisons with constants on the left (Yoda style).
- Prevent use of native `Date`; use Luxon (`DateTime`).
