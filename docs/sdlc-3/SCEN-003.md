---
id: "SCEN-003"
type: "scenario"
name: "Guided Implementation & Verification Scenario"
refines:
  - "UC-003"
---

# Scenario: Guided Implementation & Verification

This scenario describes a concrete developer walkthrough of executing `/sdlc-3` to implement a designed feature.

## 1. Initial State
- The user has completed Phase 1 & 2 and generated SARA requirements and architecture design documents under `docs/sdlc-3/`.
- All design and requirements artifacts are verified using `sara check`.

## 2. Interactive Execution Steps
- **Step 1**: The user types `/sdlc-3`.
- **Step 2**: The assistant checks the SARA graph for the feature and verifies it is valid.
- **Step 3**: The assistant begins implementation using the Red-Green-Refactor TDD cycle.
- **Step 4**: The assistant runs code compilation and ESLint.
- **Step 5**: If lint errors are found, the assistant runs up to 3 rounds of autofixes.
- **Step 6**: The assistant successfully completes the implementation or hands off remaining issues to the user.

## 3. End State
- The feature implementation matches all design and requirement specifications, compiles cleanly, passes tests, and satisfies SARA checks.
