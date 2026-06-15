---
id: "SWREQ-601"
type: "software_requirement"
name: "Report Parser and Local Verification Interface"
specification: "The software agent SHALL read local files and CI logs to extract errors, running local linter/tsc checks on only affected packages."
derives_from:
  - "SYSARCH-601"
---

# SWREQ-601: Report Parser and Local Verification Interface

## 1. Description
The software must provide an automated interface to retrieve and parse CI build logs, SonarQube quality gate statuses, and MegaLinter error lists. It must extract the specific files, line numbers, and rule IDs that failed, and run local targeted validation commands (such as ESLint, TSC checks, or Vitest) on only the affected files/packages.

## 2. Technical Details
- **Parser Implementation**:
  - The software SHALL parse plain text files and JSON reports using structured regular expressions to capture the following fields: `filePath`, `lineNumber`, `ruleId`, `severity`, and `message`.
  - GitHub build logs are parsed for node/tsc compiler errors (capturing `TS\d+` codes) and test failures (capturing assertion failures and stack traces).
  - SonarQube JSON outputs are queried for duplication markers and smell types.
  - MegaLinter outputs are parsed for lint warnings.
- **Verification Runner**:
  - The verification router SHALL invoke shell commands via a non-interactive background process.
  - Test executions SHALL target specific test suites containing modified components using `vitest run <test-file-pattern>` or `pnpm --filter <package> test`.
  - Linter executions SHALL target modified file paths directly: `pnpm eslint <file-paths> --fix`.
  - Local verification results must compile into a standard verification status summary.
