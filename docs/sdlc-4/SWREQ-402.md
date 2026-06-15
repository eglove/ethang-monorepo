---
id: "SWREQ-402"
type: "software_requirement"
name: "Linter and Build Gate Execution"
specification: "The agent SHALL execute ESLint up to 3 times for autofixes and run the package build command."
derives_from:
  - "SYSARCH-401"
---

# SWREQ-402: Linter and Build Gate Execution

## 1. Description
Static code analysis and build validation must succeed cleanly before completing verification.
