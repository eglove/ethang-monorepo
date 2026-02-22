### TDD Guidelines
- Always follow the Red-Green-Refactor cycle.
- Write a failing test before implementing any new feature or fixing a bug.
- Ensure tests are passing before proceeding to refactor.

### Verification Guidelines
- After every change, run the project's test and lint scripts to ensure no regressions.
- For this project, use:
    - `pnpm test` (or `pnpm --filter <package> test`)
    - `pnpm lint` (or `pnpm --filter <package> lint`)
- Do not submit changes if tests or linting fail.