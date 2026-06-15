---
id: "SYSREQ-001"
type: "system_requirement"
name: "Requirements Verification and Ingestion"
specification: "The system SHALL locate and read all requirements documents under docs/<feature-name>/ and verify the requirement graph integrity using 'sara check' prior to starting Phase 2."
derives_from:
  - "SCEN-001"
---

# SYSREQ-001: Requirements Ingestion & Verification

## 1. Description
The `/sdlc-2` skill must build upon a valid requirements baseline. The first action of the skill must be checking that Phase 1 requirements exist and pass structural validations.

## 2. Technical Details
- The skill searches for files recursively in `docs/<feature-name>/` at the root of the repository.
- It executes `sara check` to verify there are no loops, broken parent references, or duplicate IDs.
- If no files are found or `sara check` fails, the execution must immediately transition to the exception flow (halting and notifying the user).
