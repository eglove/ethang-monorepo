---
id: "SCEN-004"
type: "scenario"
name: "Phase 4 Verification and Gap Remediation Scenario"
refines:
  - "UC-004"
---

# Scenario: Phase 4 Verification and Gap Remediation

This scenario describes a concrete walkthrough of the agent verifying a completed feature, detecting missing test coverage for an exception path, writing the missing test case, and resolving a lint issue.

## 1. Initial State
- A feature named `auth-service` has been implemented under `packages/auth-service`.
- The user triggers `/sdlc-4 auth-service`.

## 2. Interactive Execution Steps
- **Step 1**: The assistant validates the requirements graph of `auth-service` using `rtk sara check`.
- **Step 2**: The assistant runs `rtk pnpm --filter @ethang/auth-service test --coverage` and ESLint checks.
- **Step 3**: The assistant detects that a specific boundary value (e.g. invalid token format) is not hit in the coverage summary.
- **Step 4**: The assistant writes a new unit test for this boundary case in `auth-service.test.ts`.
- **Step 5**: The assistant verifies the test fails (Red phase), runs the code to fix it if necessary (Green phase), and checks formatting (Refactor phase).
- **Step 6**: The assistant runs ESLint on modified files. It fixes a minor formatting error on the first pass.
- **Step 7**: The assistant compiles the package to verify build output.
- **Step 8**: The assistant runs a final `rtk sara check`.

## 3. End State
- The feature has complete coverage, no lint or compile errors, and the SARA graph remains valid.
