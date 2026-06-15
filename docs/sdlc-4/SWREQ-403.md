---
id: "SWREQ-403"
type: "software_requirement"
name: "Test Coverage Parsing"
specification: "The agent SHALL run Vitest with coverage and parse the generated summary to identify untested lines and branches."
derives_from:
  - "SYSARCH-401"
---

# SWREQ-403: Test Coverage Parsing

## 1. Description
The agent must extract and inspect the lines and branches that are not covered by unit tests.
