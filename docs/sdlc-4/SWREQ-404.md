---
id: "SWREQ-404"
type: "software_requirement"
name: "Logical State Space Mapping"
specification: "The agent SHALL perform static analysis on the source code surrounding uncovered lines to map boundaries and exception states."
derives_from:
  - "SYSARCH-401"
---

# SWREQ-404: Logical State Space Mapping

## 1. Description
The agent must inventory the state spaces (empty, null, extremes, exception paths) of the uncovered code blocks.
