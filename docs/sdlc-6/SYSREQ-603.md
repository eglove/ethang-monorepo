---
id: "SYSREQ-603"
type: "system_requirement"
name: "Phase 6 Maintenance Rules Adherence"
specification: "The system SHALL classify modifications as corrective or perfective, check target file dependencies, and verify boundary conditions for all applied changes."
derives_from:
  - "SCEN-006"
---

# SYSREQ-603: Phase 6 Maintenance Rules Adherence

## 1. Description
All code modifications applied by the troubleshooting agent must strictly adhere to Phase 6 checklists:
1. **Maintenance Classification**: Tag modifications as corrective (fixes) or perfective (refactoring/duplication resolution) according to [maintenance-classification](file:///.agents/rules/maintenance-classification.md).
2. **Impact Analysis**: Ensure dependencies are inspected before making edits in shared code according to [maintenance-impact-analysis](file:///.agents/rules/maintenance-impact-analysis.md).
3. **Edge Case Reviews**: Check boundary conditions and inputs on modified files according to [review-edge-cases](file:///.agents/rules/review-edge-cases.md).

## 2. Technical Details
- **Classification Metadata**:
  - The troubleshooting log SHALL record a maintenance classification entry for every repair iteration.
  - Corrective entries must link to the specific error ID or failing test name.
  - Perfective entries must document the refactoring rationale and reference the SonarQube rule ID (e.g. `sonar/no-duplicate-string`).
- **Dependency Impact Scans**:
  - Prior to modifying any file, the system SHALL traverse the workspace package graph (reading `package.json` dependencies and `tsconfig` project references) to identify all dependent packages.
  - If a file to be modified has downstream consumers, the impact scanner SHALL flag the change for safety reviews and extend the verification scope to include all affected consumer test suites.
- **Edge Case Validation**:
  - For any modified logic, the system SHALL compile input boundaries (e.g. `null`, `undefined`, empty strings, extreme numbers) and verify that the tests cover these partitions.
