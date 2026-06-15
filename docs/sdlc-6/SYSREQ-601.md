---
id: "SYSREQ-601"
type: "system_requirement"
name: "Parse PR, SonarQube, and MegaLinter Reports"
specification: "The system SHALL automatically parse static analysis and build reports from GitHub PR, SonarQube, and MegaLinter runs, failing immediately if they are unavailable."
derives_from:
  - "SCEN-006"
---

# SYSREQ-601: Parse PR, SonarQube, and MegaLinter Reports

## 1. Description
The system must automatically ingest and parse errors and warnings from three sources:
1. **GitHub PR Build Log**: Syntax errors, compiler/TypeScript errors, and runtime test failures.
2. **SonarQube Quality Gate Dashboard**: Code smells, duplication density, and code coverage requirements.
3. **MegaLinter PR Reports**: Style guide infractions, syntax checks, and file lint errors.

If any of these reports are missing or cannot be retrieved, the tool must fail immediately rather than continuing with incomplete data.

## 2. Technical Details
- **Log Location & Ingestion**: The system SHALL search for and ingest log/report files from designated workspace directories (such as `.junie/reports/` or `.github/workflows/logs/`).
- **Parsing Rules**:
  - **TSC/Linter Failures**: Match patterns like `(Error|Warning|TS\d+):` and extract filepath, line number, column, and description.
  - **SonarQube Metrics**: Parse JSON/XML metrics looking for key violations such as `sonar/no-duplicate-string` or coverage values below threshold.
  - **MegaLinter Infractions**: Parse report structures to identify format/style violations.
- **Fail-Fast Trigger**: If any of the configured report files are missing, empty, or unparseable, the tool SHALL throw a fatal `IngestionException` and terminate execution with exit code `1`.
