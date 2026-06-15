---
id: "SWREQ-502"
type: "software_requirement"
name: "Software Git Diff Analyzer"
specification: "The software agent SHALL execute git staging and analyze cached diff content to compile a conventional commit header and an actor-action formatted body."
derives_from:
  - "SYSARCH-501"
---

# SWREQ-502: Software Git Diff Analyzer

## 1. Description
The software agent must stage changed files and parse the cached diff to generate a conventional commit header (using a dynamically extracted package scope) and a body structured in the actor-action format.

## 2. Technical Details
- Stage modified files using `git add .`.
- Inspect differences using `git diff --cached --name-only`.
- Construct the conventional commit message header and body following strict actor-action rules.
