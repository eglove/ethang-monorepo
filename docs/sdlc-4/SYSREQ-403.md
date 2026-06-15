---
id: "SYSREQ-403"
type: "system_requirement"
name: "Vitest Coverage Extraction"
specification: "The system SHALL execute tests with 'vitest --coverage' and parse coverage metrics to discover uncovered lines and branches."
derives_from:
  - "SCEN-004"
---

# SYSREQ-403: Vitest Coverage Extraction

## 1. Description
The system must dynamically evaluate which source code lines are hit during test execution.

## 2. Technical Details
- Run `pnpm --filter <package> test --coverage`.
- Parse the generated coverage report files (e.g. `coverage/coverage-summary.json`) to identify uncovered lines.
