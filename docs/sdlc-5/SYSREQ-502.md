---
id: "SYSREQ-502"
type: "system_requirement"
name: "Automated diff analysis and staging"
specification: "The system SHALL stage unstaged files and analyze the cached git diff to construct a conventional, actor-action formatted commit message."
derives_from:
  - "SCEN-005"
---

# SYSREQ-502: Automated diff analysis and staging

## 1. Description
The system must prepare changed workspace files for repository submission by staging them and analyzing their modifications to dynamically generate the commit message.

## 2. Technical Details
- The system must execute \`git add .\` to stage unstaged changes.
- The system must execute \`git diff --cached\` or check file lists to understand the packages and files modified.
- The system must construct the commit message conforming to the conventional commits specification and actor-action format.
