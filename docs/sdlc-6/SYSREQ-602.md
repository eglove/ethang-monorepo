---
id: "SYSREQ-602"
type: "system_requirement"
name: "Targeted Verification of CI Failures"
specification: "The system SHALL restrict code verification to only the files and packages flagged in the PR build and CI reports, bypassing global monorepo verification."
derives_from:
  - "SCEN-006"
---

# SYSREQ-602: Targeted Verification of CI Failures

## 1. Description
The agent must only validate the specific files and packages that are flagged in the PR build and CI reports, rather than performing global monorepo verification. This keeps execution latency minimal and prevents unrelated build failures from blocking the PR troubleshooting flow.

## 2. Technical Details
- **Verification Boundaries**:
  - The system SHALL extract the list of affected file paths from the parsed CI reports.
  - The system SHALL map each affected file path to its containing package directory in the monorepo workspace.
- **Selective Command Routing**:
  - Instead of running a workspace-wide build or test (`pnpm build`, `pnpm test`), the system SHALL execute targeted package commands using the `--filter` flag, e.g. `pnpm --filter <package-name> lint` or `pnpm --filter <package-name> test`.
  - For standalone files (such as files under `packages/`), local compiler checks (`npx tsc --noEmit <file-path>`) may be executed to isolate verification.
