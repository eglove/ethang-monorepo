---
id: "SYSREQ-401"
type: "system_requirement"
name: "Pre-Verification Graph Validation"
specification: "The system SHALL verify the SARA graph integrity for the feature using 'sara check' before conducting verification."
derives_from:
  - "SCEN-004"
---

# SYSREQ-401: Pre-Verification Graph Validation

## 1. Description
The system must ensure that the design and requirements documents for the feature are in a valid state before conducting verification.

## 2. Technical Details
- If `sara check` fails or no documents are found, verification halts immediately.
