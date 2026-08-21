# Job Applications View Design

## Status

Approved design for an authenticated, server-rendered applications view in `apps/ethang-astro/` backed by the existing `apps/job-applications/` RPC service.

## Context and goals

The repository contains an Astro/Cloudflare frontend and an authenticated job-application Worker service. The frontend currently has session-cookie decoding, Astro actions, Cloudflare RPC bindings, and a navigation list that intentionally contains only public site sections. The job-application service already exposes authenticated `listApplications` and `updateApplication` operations, and its domain defines six statuses.

This feature adds a private `/applications` page where an authenticated user can review applications in a table and change an application's status. The page must not be linked from site navigation. The initial scope is deliberately limited to viewing applications and changing status.

## Decisions

- Route: `/applications`.
- Authentication: use the existing `session` cookie and `decodeSessionCookie` helper.
- Unauthenticated behavior: redirect to `/login?redirect=/applications`.
- Successful login: honor the `redirect` query parameter and return to `/applications`.
- Rendering: server-rendered Astro page and standard HTML form submissions with full-page refreshes.
- Token handling: keep the session token server-side; never render it into HTML or expose it to browser JavaScript.
- Status changes: use a selector containing every valid status, submitted explicitly through a form.
- Valid statuses: `applied`, `screening`, `interview`, `offer`, `rejected`, and `withdrawn`.
- Pagination: forward cursor pagination using the existing `first`/`after` API, with 25 records per page.
- Mutation pagination behavior: preserve the current `after` cursor after a status update.
- Navigation: do not add the route to `BaseLayout.astro` navigation.

## Architecture and route behavior

Add `apps/ethang-astro/src/pages/applications.astro` with `prerender = false`.

For a GET request:

1. Decode the `session` cookie.
2. If it is missing or malformed, redirect to `/login?redirect=/applications`.
3. Read the optional `after` query parameter. Invalid values are treated as absent.
4. Call the existing job-application RPC with the session token, `first: 25`, the parsed cursor, and no status filter.
5. Render the returned records and a next-page link only when `nextCursor` is present.

The page will use existing layout and UI primitives where appropriate and will not add a navigation entry.

## Server-side mutation flow

Use an Astro server action as the mutation boundary. Each row contains a standard POST form with the application ID, selected status, and current cursor. The action:

1. Decodes the session cookie server-side.
2. Redirects unauthenticated requests to the login route.
3. Validates the application ID, status, and cursor.
4. Calls the existing authenticated `updateApplication` RPC with `{ id, status, token }`.
5. Redirects to `/applications`, preserving the current `after` cursor, on success.
6. Returns a safe page error on failure without exposing backend details or credentials.

The backend remains authoritative for authorization and validation. The frontend status list and validation prevent malformed submissions and make the UI contract explicit.

## Table and display contract

The table displays:

- Company
- Title
- Applied date
- Location
- Salary
- Next interview
- Status selector
- Actions

Actions include the application URL when present and a resume link when the existing resume endpoint and RPC binding provide one. Missing optional values use a consistent placeholder or omit the link; broken links are never rendered. Date and salary formatting should be implemented as small testable helpers where needed.

The status selector displays all six valid statuses and selects the record's current status. A nearby submit button makes the mutation work without client-side JavaScript.

## Error handling

- Missing or malformed sessions redirect to login.
- Invalid cursors are ignored for loading and do not reach the RPC.
- List failures render a page-level safe error.
- Invalid mutation input preserves the current cursor and renders a validation error.
- Update failures preserve the current cursor and render an actionable safe error; the UI must not claim success.
- Optional application URL and resume data are handled without broken links.

## Testing strategy

Tests must be written first and observed failing before production implementation.

Cover:

1. Authentication: valid session, missing session, malformed session, and login redirect preservation.
2. Loading: request size 25, cursor propagation, next-link generation, and invalid cursor handling.
3. Rendering: all approved columns, consistent null display, conditional links, all six selector options, and current selection.
4. Mutation: input validation, exact RPC payload, successful same-cursor redirect, failed update error behavior, and unauthenticated mutation redirect.
5. Verification: existing Astro tests, targeted lint/type checks, and production build.

Extract and export focused helpers for redirect construction, cursor parsing, status validation, formatting, and mutation redirect construction when that enables direct unit coverage without coupling tests to markup implementation details.

## Scope boundaries

This phase does not add navigation, create/delete functionality, editing of other fields, search, filtering, backward pagination, client-side JavaScript, a new authentication system, or a new job-application RPC endpoint unless inspection proves the existing binding lacks a required operation.

## Acceptance criteria

- `/applications` is not prerendered and is protected by the existing session cookie.
- Unauthenticated access redirects to `/login?redirect=/applications`.
- Successful login returns the user to `/applications` when requested through the redirect parameter.
- Authenticated users see a server-rendered table with the approved columns.
- The table requests at most 25 records and supports forward cursor pagination.
- Every valid status is selectable and status changes use the existing authenticated update RPC.
- Status updates preserve the current cursor.
- Session tokens are never included in rendered HTML or client-side code.
- The route is absent from navigation.
- Tests, lint/type checks, and the production build pass.
