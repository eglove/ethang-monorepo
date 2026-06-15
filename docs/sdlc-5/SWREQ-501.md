---
id: "SWREQ-501"
type: "software_requirement"
name: "Software Branch State Guard"
specification: "The software agent SHALL query the active branch name and checkout a new user-specified branch if the active branch is master or main."
derives_from:
  - "SYSARCH-501"
---

# SWREQ-501: Software Branch State Guard

## 1. Description
The software agent must verify the safety of VCS commands by validating that the active branch is a non-protected feature branch before committing or pushing changes.

## 2. Technical Details
- Query the current branch using `git branch --show-current`.
- Prompt the user and perform `git checkout -b <new-branch>` if the current branch is `master` or `main`.
