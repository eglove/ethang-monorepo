# Task 3 Report: Register the job-application RPC binding

## Scope

Added the `job_applications` remote service binding to `apps/ethang-astro/wrangler.jsonc`, regenerated the Cloudflare environment declaration, and added the Task 3 contract test scaffold.

## Changes

- `apps/ethang-astro/wrangler.jsonc`
  - Added the remote service:
    - binding: `job_applications`
    - service: `job-applications`
    - remote: `true`
- `apps/ethang-astro/worker-configuration.d.ts`
  - Regenerated with the app's existing `cf-typegen` command.
  - Preserved the typed `ethang_courses` and `ethang_rss` service bindings.
  - Added `job_applications: Fetcher /* job-applications */`.
- `apps/ethang-astro/src/tests/applications-page.test.ts`
  - Added the requested hoisted `listApplications` and `updateApplication` spies.
  - Added the authenticated-load contract test targeting the route that Task 4 will add.

## TDD / contract-test verification

Command:

```text
pnpm --dir apps/ethang-astro exec vitest run src/tests/applications-page.test.ts
```

Result: expected RED. The test cannot import `src/pages/applications.astro` because the applications route is not present yet. This is the Task 4 implementation boundary; no placeholder route was added.

## Root-cause investigation

The reported `exactOptionalPropertyTypes` issue was reproduced before changing the binding. The existing generated RPC signature for RSS declares `allArticles`'s `after` parameter as `after?: string`, while `apps/ethang-astro/src/lib/rss.ts` declares the structural `RssWorker` contract as `after?: null | string`. With `exactOptionalPropertyTypes: true`, the function parameter types are incompatible. The same error is reported at the existing RSS action call sites.

This mismatch is independent of the missing job-applications binding and is not fixed by adding a service entry. The generated declaration was therefore not manually edited to change RPC signatures, and `rss.ts` was not changed.

A first single-config `wrangler types` run would have degraded the existing typed course/RSS bindings to generic `Fetcher` types. That output was discarded by rerunning the repository's existing `cf-typegen` command:

```text
wrangler types --config wrangler.jsonc --config ../ethang-courses/wrangler.jsonc --config ../ethang-rss/wrangler.jsonc
```

The retained generated diff is limited to the hash and the new `job_applications` Fetcher binding.

## Verification

- `pnpm --dir apps/ethang-astro run cf-typegen` — passed; regenerated the declaration with the existing multi-config command and retained typed `ethang_courses`/`ethang_rss` bindings plus the new `job_applications` fetcher.
- `pnpm --dir apps/ethang-astro exec wrangler types --check` — passed; generated types are up to date.
- `pnpm --dir apps/ethang-astro exec vitest run src/tests/applications-page.test.ts` — expected RED because `src/pages/applications.astro` is intentionally absent for Task 4; module resolution fails before tests execute.
- `pnpm --dir apps/ethang-astro exec tsc --noEmit` — retains the approved existing generated-binding diagnostics: RSS `after?: null | string` versus generated `after?: string` exact-optional mismatch at three action call sites, plus cross-worker D1 typing errors in `ethang-courses`/`ethang-rss` and the existing missing `FETCH_FEEDS_WORKFLOW` typing. No RSS or service types were weakened.
- `pnpm --dir apps/ethang-astro exec eslint src/tests/applications-page.test.ts wrangler.jsonc worker-configuration.d.ts --fix` — zero errors; generated declaration is ignored as expected.
- `git diff --check` — passed.

## Commit

Commit: pending until the final Task 3 commit is created.
