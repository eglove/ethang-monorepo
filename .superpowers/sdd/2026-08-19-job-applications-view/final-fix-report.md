# Applications review fixes — final evidence

Date: 2026-08-19

## Scope checked

Inspected the current worktree changes for the Astro applications page and its focused tests. The corrected implementation addresses the requested review findings without changing generated types:

- Removed the remaining trailing whitespace from `apps/ethang-astro/src/tests/applications-page.test.ts`.
- Removed the resume filename/link from the applications view because the page has no resume endpoint.
- Added `isSafeApplicationUrl` and render application links only for absolute `http:` and `https:` URLs; unsafe, protocol-relative, malformed, null, and backslash-containing values are omitted.
- Updated login redirect validation to reject any backslash, including backslash-based protocol-relative forms.
- Updated `updateApplicationStatus` to use Astro `ActionError` for unauthorized, invalid-status, and backend failures, and to return `{ success: true }` on success.
- Updated the page to consume Astro's action result data/error envelopes: successful results redirect using the current cursor, while action error messages are rendered without exposing backend details.
- Preserved the cursor through the action URL/form and page reload behavior.

## Verification

Focused command:

```text
pnpm --filter ethang-astro exec vitest run src/lib/applications.test.ts src/lib/login.test.ts src/actions/actions.test.ts src/tests/applications-page.test.ts
```

Result:

```text
Test Files  4 passed (4)
Tests       90 passed (90)
```

Whitespace/diff validation:

```text
git diff --check
```

Result: passed with no output and exit code 0.

The commit contains the corrected existing implementation and this report, with commit message:

```text
fix: close applications review findings
```
