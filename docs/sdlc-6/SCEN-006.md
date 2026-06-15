---
id: "SCEN-006"
type: "scenario"
name: "Troubleshooting CI Errors and SonarQube Code Smells"
refines:
  - "UC-006"
---

# Scenario: Troubleshooting CI Errors and SonarQube Code Smells

This scenario walkthrough details the concrete execution path of the AI Troubleshooter Agent analyzing a failing PR build, retrieving reports, identifying a typecast issue and a duplicate string code smell, and fixing them.

## 1. Initial State
- A pull request has been opened in the `ethang-monorepo` with modified TypeScript files in package `apps/auth`.
- The GitHub Actions CI run fails due to:
  - ESLint error in `apps/auth/src/services/auth-service.ts`: `@typescript-eslint/no-unsafe-argument` at line 45.
  - SonarQube quality gate failure: "3 duplicate string literals found in apps/auth/src/get-database.test.ts"
- The developer invokes `/sdlc-6` to automate troubleshooting.

## 2. Execution Steps
- **Step 1: Check git diff**
  - The assistant runs `rtk git diff --name-only` and identifies `apps/auth/src/services/auth-service.ts` and `apps/auth/src/get-database.test.ts` as the modified files.
- **Step 2: Retrieve failure reports**
  - The assistant reads the CI logs from `.junie/reports/build.log` and the SonarQube report from `.junie/reports/sonar.json`.
- **Step 3: Categorize failures**
  - ESLint typecasting/unsafe-argument error -> Corrective maintenance.
  - SonarQube duplicate string literal -> Perfective maintenance.
- **Step 4: Perform dependency impact analysis**
  - The assistant inspects `apps/auth/package.json` to verify that `auth-service.ts` is only consumed inside the `auth` app and not exported globally. It maps no external package consumers.
- **Step 5: Apply targeted repairs**
  - For the duplicate string code smell: Extracts `"test-d1-binding-db"` to `apps/auth/src/test-constants.ts` and imports it in `get-database.test.ts`.
  - For the ESLint type violation: Adds `// eslint-disable-next-line @typescript-eslint/no-unsafe-argument` above the violating line in `auth-service.ts`.
- **Step 6: Run targeted verification**
  - The assistant executes:
    ```bash
    rtk pnpm --filter @ethang/auth lint
    rtk pnpm --filter @ethang/auth test
    ```
  - Both commands complete successfully.
- **Step 7: Final CI validation check**
  - The assistant executes `rtk sara check` and verifies that the design/requirements graph remains intact.

## 3. End State
- The build, SonarQube, and MegaLinter reports are clear of errors, and the PR changes are ready for final review.
