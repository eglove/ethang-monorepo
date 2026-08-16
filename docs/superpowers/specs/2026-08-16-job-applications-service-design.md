# Job Applications Service — Design

**Date:** 2026-08-16
**App:** `apps/job-applications` (new)
**Status:** Approved in chat (design sections 1–4 approved; user preference: improve on existing patterns, cleaner DDD)

## Objective

A Cloudflare Workers RPC service for tracking job applications. Each application is owned by a user email (derived from the auth service's JWT), unique on `(email, applicationUrl)`, with the application record in D1 and the resume PDF in R2. Exposes CRUD, status cycling, and resume upload/download over Workers RPC.

A new app. Follows the repo's RPC + D1 pattern but improves on it: clean DDD with Effect (Context.Tag ports, Effect.gen use cases, Layer DI) per user preference and AGENTS.md rule 5.

## Goals

- Track job applications with the approved field model (id, email, company, title, applicationUrl, status, appliedDate, nextInterviewDate?, location?, salary?, notes?, resume metadata, createdAt, updatedAt)
- Uniqueness on `(email, applicationUrl)`
- JWT-authenticated methods (HS256, `token-auth` secret); email always from the token, never a parameter
- Resume PDFs stored in R2 (key `${email}/${id}`), ≤5 MB, `%PDF` magic checked
- Status FSM: `applied → screening → interview → offer` (`cycleStatus`); terminal: `offer`/`rejected`/`withdrawn`
- Errors cross the RPC boundary as data (`RpcResult` envelope)
- 100% coverage target (CI gate 80%), TDD red → green → refactor

## Non-goals

- No frontend/consumer app in this change
- No auth service changes (only shares the `token-auth` secret)
- No event sourcing / CQRS / outbox
- No search/analytics endpoints

## Architecture

Clean DDD, four layers, Effect as the vehicle (AGENTS.md rule 5 + user preference):

```
apps/job-applications/src/
  domain/job-application/
    aggregate.ts    # JobApplication: create, withChanges, advanceStatus — invariants at construction
    status.ts       # closed union + next() FSM — pure, exhaustive
    errors.ts       # InvalidStatusTransition, DuplicateApplication, ApplicationNotFound
  application/
    create-application.ts   get-application.ts     list-applications.ts
    update-application.ts   cycle-status.ts        delete-application.ts
    upload-resume.ts        get-resume.ts
    ports.ts                # JobApplicationRepository, ResumeStore, TokenVerifier (Context.Tags)
  infrastructure/
    drizzle/{schema,repository}.ts   # row ⇄ aggregate mapping + D1 Layer
    r2/resume-store.ts               # R2 adapter + Layer
    token/verifier.ts                # jose HS256 + Layer
  index.ts                    # WorkerEntrypoint: Schema-decode → authorize → provide → run
```

- Domain: zero framework/drizzle imports, pure functions.
- Application: one file per use case, each an `Effect.gen` over ports; command Schemas validated at the entry.

## Data model

`jobApplications` table (D1, Drizzle):

| column | type | notes |
| --- | --- | --- |
| `id` | text PK | uuid v7 (`$defaultFn(v7)`) |
| `email` | text notNull | owner; always from JWT |
| `applicationUrl` | text notNull | unique per email |
| `company` | text notNull | |
| `title` | text notNull | the role |
| `status` | text notNull default `applied` | `applied`/`screening`/`interview`/`offer`/`rejected`/`withdrawn` |
| `appliedDate` | text notNull | ISO date |
| `nextInterviewDate` | text nullable | ISO datetime |
| `resumeKey` | text nullable | R2 object key `${email}/${id}` |
| `resumeFilename` | text nullable | refinement: list resume metadata without an R2 `head` per row |
| `resumeSize` | integer nullable | refinement |
| `location` | text nullable | |
| `salary` | text nullable | freeform range |
| `notes` | text nullable | |
| `createdAt` | text notNull | ISO |
| `updatedAt` | text notNull | ISO, bumped on write |

Unique constraint: `unique([email, applicationUrl])`.

Resume metadata (filename/size) is stored in D1 alongside the key so `listApplications` shows resume info without an R2 round-trip per row.

## API surface

All methods take one parameter object that includes `token`. `email` is never a parameter — it always comes from the verified token.

| Method | Params (beyond `token`) | Returns | Error codes |
| --- | --- | --- | --- |
| `createApplication` | `company, title, applicationUrl, appliedDate`, optional: `nextInterviewDate, location, salary, notes, status` | record | `VALIDATION`, `UNAUTHENTICATED`, `DUPLICATE` |
| `getApplication` | `id` | record | `UNAUTHENTICATED`, `NOT_FOUND` |
| `listApplications` | optional: `status`, `after?`, `first?` (default 50, cap 100) | `{ items, nextCursor }` | `UNAUTHENTICATED`, `VALIDATION` |
| `updateApplication` | `id` + ≥1 of: `company, title, status, appliedDate, nextInterviewDate, location, salary, notes` | record | `VALIDATION`, `UNAUTHENTICATED`, `NOT_FOUND` |
| `cycleStatus` | `id` | record | `UNAUTHENTICATED`, `NOT_FOUND`, `INVALID_TRANSITION` |
| `deleteApplication` | `id` | `true` (R2 object removed too) | `UNAUTHENTICATED`, `NOT_FOUND` |
| `uploadResume` | `id, filename, data` (`ArrayBuffer`, ≤5 MB, `%PDF` magic checked) | record | `UNAUTHENTICATED`, `NOT_FOUND`, `RESUME` |
| `getResume` | `id` | `{ filename, contentType, size, data } \| null` (null = app exists, no resume) | `UNAUTHENTICATED`, `NOT_FOUND` |

Record shape:

```ts
{ id, email, company, title, applicationUrl, status, appliedDate,
  nextInterviewDate, location, salary, notes,
  resume: { filename, size } | null, createdAt, updatedAt }
```

### Semantics

- **Cycle FSM:** `applied → screening → interview → offer`; `offer`/`rejected`/`withdrawn` are terminal — `cycleStatus` on a terminal status fails with `INVALID_TRANSITION`. `updateApplication.status` may set any valid status (explicit intent bypasses the pipeline).
- **Immutables:** `id`, `email`, `applicationUrl`, `createdAt` — changing the URL means delete + recreate (it is the identity key).
- **Ownership:** every read/write is filtered by the token's email; a foreign id is indistinguishable from a non-existent one (`NOT_FOUND`, no existence leak).
- **Pagination:** cursor = last item's uuid v7 (time-ordered, stable), ordered newest-first.
- **Resume:** key `${email}/${id}` — re-upload overwrites in place (no orphan objects); 5 MB cap + `%PDF` magic check; `deleteApplication` also removes the R2 object.

## Error handling

Typed errors live in Effect's error channel (satisfies `no-try-catch`); a single entry-layer `toResult` wraps each use case and maps the whole channel to the `RpcResult` envelope — the only catch point in the system.

| Effect error (origin) | Code |
| --- | --- |
| Schema decode failure (entry) | `VALIDATION` |
| `TokenError` (verifier port) | `UNAUTHENTICATED` |
| `ApplicationNotFound` (use case: repo → null) | `NOT_FOUND` |
| `DuplicateApplication` (domain invariant; D1 unique constraint in repo) | `DUPLICATE` |
| `InvalidStatusTransition` (domain: `advanceStatus` on terminal) | `INVALID_TRANSITION` |
| `ResumeError` (R2 / size / non-PDF) | `RESUME` |
| anything unexpected | `INTERNAL` |

```ts
type RpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ErrorCode; message: string } }
```

## Authentication

- Token: JWT signed by `apps/auth` (HS256, payload includes `email`, 1-year expiry), verified here with the shared `token-auth` env secret via `jose`.
- Port: `TokenVerifier` (`Context.Tag`); infra adapter in `infrastructure/token/verifier.ts`.
- Each method: verify token → email → use case. No email parameter anywhere.
- Workers RPC is account-internal (only other account services can call), so a verified JWT passed as a parameter is sufficient; no OAuth/handshake flow.

## Testing & verification

Layered, each layer tested at its own altitude:

1. **Domain (pure, zero deps):** `create`/`withChanges`/`advanceStatus`; the status `next()` FSM via `it.each` over all six statuses (every valid advance and every terminal rejection); invariants proven unrepresentable (empty `company`/`title`/`applicationUrl`, invalid `status` each rejected).
2. **Application (fake Layers, no mocks):** in-memory `JobApplicationRepository` + `ResumeStore` that implement the ports (type-safe, not `vi.fn` drizzle chains); real `TokenVerifier` with a test secret and genuinely signed HS256 tokens. Then every use case: success + each error path.
3. **Infrastructure (real adapters):** row ⇄ aggregate round-trip; `@cloudflare/vitest-pool-miniflare` for real D1 (so the `(email, applicationUrl)` unique constraint actually fires → `DUPLICATE` genuinely exercised) and real R2 (put/get/delete, overwrite-in-place); token verifier against real `jose` sign/verify (valid, expired, wrong secret, missing email, garbage).
4. **Entry (integration):** every method → `RpcResult`; the full mapping table via `it.each`; ownership/no-existence-leak (foreign email → `NOT_FOUND`).

Discipline: TDD red → green → refactor on every unit; 100% line/branch/function/statement target (CI gate is 80%).

## Improvements over existing patterns

1. Clean DDD layers (`domain`/`application`/`infrastructure`/entry) instead of "DDD-ish" `domain`/`infrastructure`/`data` + `getDb()` threading.
2. Effect as the vehicle: `Context.Tag` ports, `Effect.gen` use cases, `Layer` DI (rule 5) instead of per-call repo factories + `Effect.runPromise` everywhere.
3. "New vs existing" is unrepresentable (`JobApplication.create` vs `advanceStatus`) instead of the `initialState` empty-string sentinel + `if ("" === state.userId)` hack.
4. Errors as data across the RPC boundary (`RpcResult` envelope) instead of fragile typed-class identity over RPC.
5. Typed domain errors (`InvalidStatusTransition`, `DuplicateApplication`) instead of a generic `Error` from `parseStatus`.
6. Real D1/R2 in tests (miniflare) instead of `vi.fn` drizzle chains faking constraint behavior.
7. `data/` → `application/` (named use cases).

## Deployment / operations

- Scaffold like `ethang-courses`: dependencies `drizzle-orm`, `effect`, `jose`, `lodash`, `uuid`; devDependencies `@cloudflare/workers-types`, `@ethang/eslint-config`, `@total-typescript/ts-reset`, `@types/lodash`, `@types/node`, `@vitest/coverage-v8`, `browserslist-config-baseline`, `dotenv`, `drizzle-kit`, `eslint`, `typescript`, `vitest`, `wrangler`, `@cloudflare/vitest-pool-miniflare`.
- `wrangler.jsonc`: name `job-applications`, main `src/index.ts`, D1 binding `jobApplications` (remote), R2 bucket `jobResumes`, `compatibility_date`, `nodejs_compat`, observability, smart placement.
- Secrets: `token-auth` secret shared with the auth service (`wrangler secret put`).
- Scripts: `cf-typegen`, `deploy`, `dev`, `drizzle:generate`, `lint` (`eslint --fix && tsc --noEmit`), `test` (`vitest run --coverage`).
- CI: existing `ci.yml` pattern (`CLOUDFLARE_API_TOKEN` already in secrets).

## Out of scope / future

- Frontend/consumer app (future)
- Additional filters (company, date range) — cursor + status only for now
- Structured interview notes (freeform `notes` covers it)
- Multiple resumes per application (single current resume)
