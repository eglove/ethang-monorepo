---
id: "SYSREQ-302"
type: "system_requirement"
name: "Strict TDD Loop & State Space Coverage"
specification: "The system SHALL enforce a strict Red-Green-Refactor development loop. The test suite MUST cover the entire state space of the unit under test."
derives_from:
  - "SCEN-003"
---

# SYSREQ-302: Strict TDD Loop & State Space Coverage

## 1. Description
The system must enforce a test-driven development flow. No production code changes should be introduced without a corresponding failing test being verified first.

## 2. Technical Details
- Write a failing unit test in the same directory as the target source file (`*.test.ts`).
- Execute `rtk pnpm --filter <package> test` to verify the test is red.
- Implement the minimal production code to make the test green.
- Refactor and verify tests remain green.
