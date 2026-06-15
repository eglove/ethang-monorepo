---
id: "SYSREQ-501"
type: "system_requirement"
name: "Branch safety validation"
specification: "The system SHALL verify that the release workflow runs on a non-protected branch, creating and checking out a new branch if on master or main."
derives_from:
  - "SCEN-005"
---

# SYSREQ-501: Branch safety validation

## 1. Description
The system must ensure that changes are never committed or pushed directly to protected branches such as \`master\` or \`main\`.

## 2. Technical Details
- The system must inspect the output of \`git branch --show-current\`.
- If the current branch is \`master\`, \`main\`, or any protected baseline branch, the system must prompt the user to input a name for a new feature branch.
- The system must execute \`git checkout -b <new-branch>\` to switch to the new branch before executing any commits.
