---
id: "SWREQ-304"
type: "software_requirement"
name: "Software ESLint Loop Guard"
specification: "The software agent SHALL track the linter run iteration count and halt execution if errors remain after 3 autofix attempts."
derives_from:
  - "SYSARCH-301"
---

# SWREQ-304: Software ESLint Loop Guard

## 1. Description
Limits ESLint autofix runs to prevent infinite agent execution loops.
