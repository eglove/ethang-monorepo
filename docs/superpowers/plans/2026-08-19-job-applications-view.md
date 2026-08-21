# Job Applications View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private, server-rendered `/applications` page in `apps/ethang-astro/` that lists the authenticated user's job applications and allows direct status selection with cursor pagination.

**Architecture:** Extend the Astro Cloudflare service bindings with `job_applications`, keep authentication and all RPC calls on the server, and implement the route with an Astro server action for status updates. Extract route decisions and display formatting into focused helpers so authentication, pagination, validation, and mutation behavior can be tested without coupling every assertion to Astro markup.

**Tech Stack:** Astro 7, Cloudflare Workers RPC, Astro actions, Effect Schema, Astro/Zod action input validation, Vitest, Astro Container, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-19-job-applications-view-design.md`

## Global Constraints

- Use route `/applications`; do not add it to `BaseLayout.astro` navigation.
- Redirect missing or malformed sessions to `/login?redirect=/applications`.
- Keep session tokens server-side and never render them into HTML or client JavaScript.
- Use server-rendered HTML forms and full-page redirects; add no client-side JavaScript.
- Request at most 25 applications per page and preserve `after` through next-page and status-update redirects.
- Use all statuses: `applied`, `screening`, `interview`, `offer`, `rejected`, `withdrawn`.
- Use the existing authenticated `listApplications` and `updateApplication` RPC methods unless binding inspection proves they are unavailable.
- Write each behavior test first, run it failing for the intended reason, then implement the minimum code and rerun the targeted test.
- Preserve the existing 80% coverage gate and run lint/build verification before completion.

## File map

Create:

- `apps/ethang-astro/src/lib/applications.ts` — pure route helpers, RPC-facing types, status options, cursor handling, and display formatting.
- `apps/ethang-astro/src/lib/applications.test.ts` — table-driven unit tests for the pure application helpers.
- `apps/ethang-astro/src/pages/applications.astro` — authenticated GET page, table markup, pagination, and status forms.
- `apps/ethang-astro/src/tests/applications-page.test.ts` — Astro Container route rendering and authentication/RPC integration tests.

Modify:

- `apps/ethang-astro/wrangler.jsonc` — add the remote `job_applications` service binding for the `job-applications` Worker.
- `apps/ethang-astro/src/actions/index.ts` — add the authenticated status-update action and make sign-in carry an approved redirect target.
- `apps/ethang-astro/src/actions/actions.test.ts` — test exact status-update RPC payload, unauthenticated behavior, and sign-in redirect data.
- `apps/ethang-astro/src/pages/login.astro` — include the validated redirect target in the sign-in form and redirect to it after success.
- `apps/ethang-astro/src/lib/login.ts` — resolve a safe redirect path instead of always returning `/`.
- `apps/ethang-astro/src/lib/login.test.ts` — table-test default, valid, malformed, external, and encoded redirect values.

## Interfaces

Use these contracts across tasks:

```ts
export const APPLICATION_PAGE_SIZE = 25;
export const APPLICATION_STATUSES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn"
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const parseApplicationCursor = (value: null | string | undefined): null | string;
export const applicationsLoginRedirect = (): string;
export const applicationsPagePath = (after: null | string): string;
export const formatApplicationValue = (value: null | string | undefined): string;
export const formatApplicationDate = (value: null | string | undefined): string;
export const isApplicationStatus = (value: unknown): value is ApplicationStatus;
export const resolveLoginRedirect = (value: null | string | undefined): string;
```

The Astro page consumes the Cloudflare RPC service as:

```ts
await env.job_applications.listApplications({
  after: cursor,
  first: APPLICATION_PAGE_SIZE,
  status: null,
  token: session.sessionToken
});
```

The status action calls:

```ts
await env.job_applications.updateApplication({
  id: input.id,
  status: input.status,
  token: session.sessionToken
});
```

### Task 1: Add pure application route and display helpers

**Files:**

- Create: `apps/ethang-astro/src/lib/applications.test.ts`
- Create: `apps/ethang-astro/src/lib/applications.ts`

- [ ] **Step 1: Write the failing table-driven tests**

Cover the complete helper state space with `it.each`:

```ts
it.each([
  [undefined, null],
  [null, null],
  ["", null],
  ["cursor-1", "cursor-1"]
])("parses cursor %j as %j", (input, expected) => {
  expect(parseApplicationCursor(input)).toBe(expected);
});

it.each([
  [undefined, false],
  [null, false],
  ["applied", true],
  ["withdrawn", true],
  ["unknown", false],
  [1, false]
])("validates status %j", (input, expected) => {
  expect(isApplicationStatus(input)).toBe(expected);
});

it.each([
  [undefined, "—"],
  [null, "—"],
  ["", "—"],
  ["Acme", "Acme"]
])("formats optional value %j", (input, expected) => {
  expect(formatApplicationValue(input)).toBe(expected);
});

it("builds encoded page paths and a fixed login redirect", () => {
  expect(applicationsLoginRedirect()).toBe("/login?redirect=%2Fapplications");
  expect(applicationsPagePath(null)).toBe("/applications");
  expect(applicationsPagePath("a cursor")).toBe("/applications?after=a%20cursor");
});
```

Also table-test dates for empty, valid ISO, and invalid values; assert that invalid dates fall back to `formatApplicationValue` rather than throwing. The tests must initially fail because the module and exports do not exist.

- [ ] **Step 2: Run the focused test to verify RED**

Run from the repository root:

```bash
pnpm --dir apps/ethang-astro exec vitest run src/lib/applications.test.ts
```

Expected: FAIL with module/export-not-found errors, not a test configuration error.

- [ ] **Step 3: Implement the minimum helper module**

Create the constants and functions in the interface block. Use `encodeURIComponent` for cursor and redirect query values, trim cursor input, validate status with the six-value constant, and use `Intl.DateTimeFormat` only for valid dates. Keep functions side-effect free and do not import Cloudflare or Astro runtime APIs.

- [ ] **Step 4: Run the focused test to verify GREEN**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/lib/applications.test.ts
```

Expected: all helper tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/src/lib/applications.ts apps/ethang-astro/src/lib/applications.test.ts
git commit -m "feat: add application view helpers"
```

### Task 2: Preserve login redirect targets safely

**Files:**

- Modify: `apps/ethang-astro/src/lib/login.ts`
- Modify: `apps/ethang-astro/src/lib/login.test.ts`
- Modify: `apps/ethang-astro/src/actions/index.ts`
- Modify: `apps/ethang-astro/src/actions/actions.test.ts`
- Modify: `apps/ethang-astro/src/pages/login.astro`

**Interfaces:**

- Consumes: `resolveLoginRedirect` from Task 1; existing `server.signIn` action.
- Produces: a sign-in action that receives a hidden `redirect` field and returns `{ data: { redirect, username } }` on success; login page redirects only to a safe internal path.

- [ ] **Step 1: Write failing redirect tests**

Add table-driven tests to `login.test.ts`:

```ts
it.each([
  [undefined, "/"],
  [null, "/"],
  ["/applications", "/applications"],
  ["/applications?after=a%20cursor", "/applications?after=a%20cursor"],
  ["https://evil.example", "/"],
  ["//evil.example", "/"],
  ["applications", "/"]
])("resolves login redirect %j", (input, expected) => {
  expect(resolveLoginRedirect(input)).toBe(expected);
});
```

Extend the sign-in action tests to assert that a successful call with `{ redirect: "/applications" }` returns the redirect in `data`, and that the auth-service request does not receive the redirect as an authentication field. The existing action test harness should be extended only with the minimum cookie assertions needed.

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/lib/login.test.ts src/actions/actions.test.ts
```

Expected: the new helper import/export and redirect assertion fail before implementation.

- [ ] **Step 3: Implement safe redirect propagation**

Implement `resolveLoginRedirect` as an allowlist for paths beginning with `/` but not `//`; default all absent, malformed, external, and non-path values to `/`. Add `redirect` to the sign-in action schema as an optional string, resolve it before returning, and include the resolved path in `data` while keeping the auth request body limited to email and password. In `login.astro`, read `Astro.url.searchParams.get("redirect")`, render it as a hidden form input, pass it to `resolveLoginOutcome`, and make `resolveLoginOutcome` use the success payload's redirect. Preserve the existing error behavior.

- [ ] **Step 4: Run tests and verify GREEN**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/lib/login.test.ts src/actions/actions.test.ts
```

Expected: all login and action tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/src/lib/login.ts apps/ethang-astro/src/lib/login.test.ts apps/ethang-astro/src/actions/index.ts apps/ethang-astro/src/actions/actions.test.ts apps/ethang-astro/src/pages/login.astro
git commit -m "feat: preserve login redirect targets"
```

### Task 3: Register the job-application RPC binding

**Files:**

- Modify: `apps/ethang-astro/wrangler.jsonc`

- [ ] **Step 1: Write the failing binding/page contract test**

In `apps/ethang-astro/src/tests/applications-page.test.ts`, add a hoisted mock whose `job_applications.listApplications` and `updateApplication` methods are spies. Add a test that imports the route module and asserts the page's authenticated load calls the list method; this test should fail at module/runtime resolution while the binding mock and route are absent.

- [ ] **Step 2: Run the focused test to verify RED**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/tests/applications-page.test.ts
```

Expected: FAIL because the new route test and RPC binding surface do not yet exist.

- [ ] **Step 3: Add the remote service binding**

Add this object to the `services` array in `wrangler.jsonc`:

```json
{
  "binding": "job_applications",
  "remote": true,
  "service": "job-applications"
}
```

Run `pnpm --dir apps/ethang-astro exec wrangler types` if the generated Cloudflare environment declaration must be refreshed; retain generated changes only when required by the type checker.

- [ ] **Step 4: Verify configuration syntax and types**

```bash
pnpm --dir apps/ethang-astro exec wrangler types
pnpm --dir apps/ethang-astro exec tsc --noEmit
```

Expected: valid Wrangler configuration and no new TypeScript errors. If the route test still fails, keep the failure for Task 4 rather than adding placeholder production code.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/wrangler.jsonc apps/ethang-astro/worker-configuration.d.ts
 git commit -m "feat: bind job applications service"
```

### Task 4: Add the authenticated paginated applications route

**Files:**

- Create: `apps/ethang-astro/src/pages/applications.astro`
- Modify: `apps/ethang-astro/src/tests/applications-page.test.ts`

**Interfaces:**

- Consumes: `decodeSessionCookie`, Task 1 helpers, `env.job_applications.listApplications`, `BaseLayout`, `Page`, `Heading`.
- Produces: server-rendered `/applications` GET route with a table and status forms; no navigation change.

- [ ] **Step 1: Complete failing route tests before route implementation**

Use the existing Astro Container pattern and mock `cloudflare:workers` with `env.job_applications.listApplications`. Test the following independently:

```ts
it("redirects missing sessions to login", async () => {
  const response = await render(new Request("https://ethang.dev/applications"));
  expect(response).toEqual({ status: 302, location: "/login?redirect=%2Fapplications" });
});

it("loads 25 applications with a valid session and cursor", async () => {
  // Set the session cookie to JSON containing email, sessionToken, username.
  // Return one application and nextCursor: "next-1".
  // Render https://ethang.dev/applications?after=current-1.
  expect(listApplications).toHaveBeenCalledWith({
    after: "current-1",
    first: 25,
    status: null,
    token: "token"
  });
  expect(html).toContain("Acme");
  expect(html).toContain('href="/applications?after=next-1"');
});

it("ignores an empty cursor", async () => {
  await render("https://ethang.dev/applications?after=");
  expect(listApplications.mock.calls.at(-1)?.[0].after).toBeNull();
});
```

Add rendering assertions for every approved header, all six status options, the current selected option, null placeholders, conditional application URL/resume links, and absence of `/applications` from the navigation links. Add a malformed-cookie case that expects the same redirect as a missing cookie.

- [ ] **Step 2: Run route tests to verify RED**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/tests/applications-page.test.ts
```

Expected: route import/render failures because `applications.astro` is not implemented.

- [ ] **Step 3: Implement authenticated GET route**

In the Astro frontmatter:

1. Set `export const prerender = false`.
2. Read `Astro.cookies.get("session")?.value` and decode it with `decodeSessionCookie`.
3. Redirect to `applicationsLoginRedirect()` when decoding returns null.
4. Parse `Astro.url.searchParams.get("after")` with `parseApplicationCursor`.
5. Call `env.job_applications.listApplications` with `first: 25`, `status: null`, the cursor, and the server-side session token.
6. Render a safe page-level error if the RPC rejects or returns an unsuccessful result; do not render error details or the session token.
7. Render the table with the approved fields and the status form skeleton. Use `formatApplicationValue` and `formatApplicationDate`, and generate the next link through `applicationsPagePath(nextCursor)`.

Use `BaseLayout`, `Page`, `Heading`, and existing form/UI primitives. Keep the route out of `BaseLayout`'s `links` array. Ensure generated HTML contains no session token.

- [ ] **Step 4: Run route tests to verify GREEN**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/tests/applications-page.test.ts
```

Expected: authentication, loading, pagination, and rendering tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/src/pages/applications.astro apps/ethang-astro/src/tests/applications-page.test.ts
git commit -m "feat: add authenticated applications page"
```

### Task 5: Add server-rendered status mutation

**Files:**

- Modify: `apps/ethang-astro/src/actions/index.ts`
- Modify: `apps/ethang-astro/src/actions/actions.test.ts`
- Modify: `apps/ethang-astro/src/pages/applications.astro`
- Modify: `apps/ethang-astro/src/tests/applications-page.test.ts`

**Interfaces:**

- Consumes: Task 1 `isApplicationStatus`/`applicationsPagePath`, `decodeSessionCookie`, `env.job_applications.updateApplication`.
- Produces: `server.updateApplicationStatus`, an `accept: "form"` action with input `{ id: string; status: ApplicationStatus; after?: string }` and result `{ success: true; redirect: string }` or `{ error: string }`.

- [ ] **Step 1: Write failing action and form tests**

Add table-driven action tests for:

```ts
it("rejects an unauthenticated status update", async () => {
  expect(await call(server.updateApplicationStatus, {
    id: "a1", status: "screening", after: "page-2"
  }, { cookies: cookies(null) })).toEqual({ error: "Unauthorized" });
  expect(updateApplication).not.toHaveBeenCalled();
});

it.each(["", "unknown", null])("rejects invalid status %j", async status => {
  const result = await call(server.updateApplicationStatus, {
    id: "a1", status, after: "page-2"
  }, { cookies: cookies(sessionUser) });
  expect(result).toEqual({ error: expect.any(String) });
});

it("updates status and preserves the cursor", async () => {
  updateApplication.mockResolvedValue({ ok: true, value: { id: "a1" } });
  const result = await call(server.updateApplicationStatus, {
    id: "a1", status: "screening", after: "page-2"
  }, { cookies: cookies(sessionUser) });
  expect(updateApplication).toHaveBeenCalledWith(WORKER, {
    id: "a1", status: "screening", token: "token"
  });
  expect(result).toEqual({ success: true, redirect: "/applications?after=page-2" });
});
```

Add update-failure and malformed-session tests. Add a route/form assertion that each row posts to `actions.updateApplicationStatus` and includes the current cursor, while rendered HTML contains no token.

- [ ] **Step 2: Run action and route tests to verify RED**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/actions/actions.test.ts src/tests/applications-page.test.ts
```

Expected: missing action/export or incorrect form behavior failures.

- [ ] **Step 3: Implement the action and connect the forms**

Add `updateApplicationStatus` to `server` with `accept: "form"`, a Zod schema requiring a non-empty `id`, a status enum built from the six valid statuses, and an optional cursor. Decode the session cookie and return `{ error: "Unauthorized" }` before any RPC call if absent. Call the existing Worker method with exactly `{ id, status, token }`. Treat an unsuccessful RPC result as a safe error, otherwise return a redirect built from the cursor. In the route, use `<form method="POST" action={actions.updateApplicationStatus}>`, hidden `id` and `after` fields, a select with six options, and a submit button. Render action errors from `Astro.getActionResult(actions.updateApplicationStatus)` while preserving the current page cursor.

- [ ] **Step 4: Run action and route tests to verify GREEN**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/actions/actions.test.ts src/tests/applications-page.test.ts
```

Expected: status validation, exact payload, same-cursor redirect, failure behavior, form wiring, and token-safety tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/src/actions/index.ts apps/ethang-astro/src/actions/actions.test.ts apps/ethang-astro/src/pages/applications.astro apps/ethang-astro/src/tests/applications-page.test.ts
git commit -m "feat: change application status from table"
```

### Task 6: Verify the complete feature and refactor only after green

**Files:**

- Modify only files identified by failing verification output.
- Tests: all existing and new `apps/ethang-astro` tests.

- [ ] **Step 1: Run the focused feature suite**

```bash
pnpm --dir apps/ethang-astro exec vitest run src/lib/applications.test.ts src/lib/login.test.ts src/actions/actions.test.ts src/tests/applications-page.test.ts
```

Expected: all focused tests pass with no unhandled errors.

- [ ] **Step 2: Run the full Astro test suite with coverage**

```bash
pnpm --dir apps/ethang-astro test
```

Expected: all tests pass and coverage remains above the configured 80% thresholds.

- [ ] **Step 3: Run type-check and lint**

```bash
pnpm --dir apps/ethang-astro exec tsc --noEmit
pnpm --dir apps/ethang-astro lint
```

Expected: no TypeScript or ESLint failures. Inspect any autofix diff before rerunning checks.

- [ ] **Step 4: Run the production build**

```bash
pnpm --dir apps/ethang-astro build
```

Expected: Astro/Cloudflare production build succeeds with the `job_applications` service binding.

- [ ] **Step 5: Verify acceptance criteria mechanically**

```bash
rg -n "applications|job_applications|updateApplicationStatus|first: 25|APPLICATION_PAGE_SIZE" apps/ethang-astro/src apps/ethang-astro/wrangler.jsonc
rg -n "applications" apps/ethang-astro/src/layouts/BaseLayout.astro apps/ethang-astro/constants/navigation.ts
rg -n "sessionToken|token" apps/ethang-astro/src/pages/applications.astro
```

Confirm manually from the output that the route is registered, the service binding exists, the page requests 25, the route is not in navigation, and token usage is limited to server-side frontmatter/action calls rather than rendered markup. Inspect the generated HTML test assertions for absence of the token.

- [ ] **Step 6: Refactor only with green tests**

If lint or review identifies duplicated formatting/redirect logic, extract it into the already-defined pure helper module, rerun the focused suite, then rerun the full suite. Do not add search, filtering, backward pagination, client-side JavaScript, or unrelated refactoring.

- [ ] **Step 7: Review the final diff and commit verification fixes**

```bash
git diff --check
git status --short
git diff --stat
git log --oneline -6
```

Commit any verification-only fixes with a focused message, for example:

```bash
git add apps/ethang-astro
git commit -m "test: verify applications view"
```
