# Implementation Plan: Cleanup TS Engine + Service Worker Rewrite

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-02_cleanup-ts-engine-sw-rewrite.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-02_cleanup-ts-engine-sw-rewrite.md` |
| TLA+ Specification | `docs/tla-specs/service-worker-rewrite/ServiceWorker.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-02_tla-review-service-worker-v2.md` |

## TLA+ State Coverage Matrix

### States

- `swState = "installing"` — SW is in the install phase, precaching offline fallback
- `swState = "activated"` — SW is active and handling fetch events
- `swState = "updating"` — SW is transitioning between versions (skipWaiting + clients.claim)
- `htmlCache[r] = "fresh"` — HTML response is cached and recently revalidated
- `htmlCache[r] = "stale"` — HTML response is cached but background revalidation in flight
- `htmlCache[r] = NULL` — HTML response not in cache (cache miss)
- `assetsCache[r] = "cached"` — Asset is in the cache
- `assetsCache[r] = NULL` — Asset not in cache (cache miss)
- `networkAvailable = TRUE` — Network is reachable
- `networkAvailable = FALSE` — Network is offline
- `quotaExceeded = TRUE` — Cache storage quota is full
- `quotaExceeded = FALSE` — Cache storage has space
- `precacheComplete = TRUE` — All precache URLs have been fetched
- `precacheComplete = FALSE` — Precaching is still in progress or not started

### Transitions (Named Actions)

1. `Activate` — Complete installation, transition from installing to activated
2. `PurgeOldCaches` — Delete all old version caches during activate
3. `VersionUpdate(newVersion)` — New SW version arrives; old caches cleared, precache reset
4. `ActivateAfterUpdate` — Complete re-activation after version update
5. `NetworkFailure` — Network goes offline (environment action)
6. `NetworkRecovery` — Network comes back online (environment action)
7. `QuotaExceed` — Cache storage becomes full (environment action)
8. `QuotaFree` — Cache storage space recovered (environment action)
9. `NewFetchRequest(r)` — A new fetch request is enqueued
10. `HtmlServeCachedAndRevalidate(r)` — HTML cache hit: serve stale, start background revalidation
11. `HtmlServeFreshFromNetwork(r)` — HTML cache miss + network up + quota ok: fetch and cache
12. `HtmlServeFreshQuotaExceeded(r)` — HTML cache miss + network up + quota exceeded: serve without caching
13. `HtmlServeOfflineFallback(r)` — HTML cache miss + network down: serve offline fallback
14. `AssetServeCached(r)` — Asset cache hit: serve immediately
15. `AssetFetchAndCache(r)` — Asset cache miss + network up + quota ok: fetch and cache
16. `AssetFetchQuotaExceeded(r)` — Asset cache miss + network up + quota exceeded: serve without caching
17. `AssetServeOfflineFallback(r)` — Asset cache miss + network down: serve offline fallback
18. `RevalidateUnchanged(r)` — Background fetch succeeds, content unchanged: mark fresh
19. `RevalidateChanged(r)` — Background fetch succeeds, content changed: mark fresh + CONTENT_UPDATED notification
20. `RevalidateNetworkFail(r)` — Background revalidation fails (network down): stale cache remains
21. `RevalidateQuotaFail(r)` — Background fetch succeeds but quota exceeded: swallow error
22. `StartPrecacheBatch` — Start a batch of precache fetches bounded by ConcurrencyLimit
23. `PrecacheFetchComplete` — A single precache fetch completes successfully
24. `PrecacheFetchFail` — A precache fetch fails (network down): return URL to remaining pool

### Safety Invariants

- `TypeOK` — All variables are within their declared type domains
- `PrecacheBounded` — `precacheInFlight <= ConcurrencyLimit`
- `OfflineFallbackCorrect` — Every offline-fallback-served request is also in clientResponses
- `NotificationsValid` — `clientNotified` is a subset of `clientResponses`
- `NotificationsHtmlOnly` — `clientNotified` is a subset of `HtmlRequestIds`
- `RevalidationHtmlOnly` — `pendingFetches` is a subset of `HtmlRequestIds`
- `OldCachesExcludeCurrent` — `currentVersion` is never in `oldCaches`

### Liveness Properties

- `EventualRevalidation` — Every pending revalidation eventually resolves
- `EventualPrecacheProgress` — In-flight precache fetches eventually complete or all precaching finishes
- `EventualCachePurge` — Old caches are eventually purged after activation
- `EventualQueueDrain` — Every enqueued fetch request eventually receives a response

---

## Implementation Steps

### Step 1: Delete TS Pipeline Engine code

**Files:**
- `packages/design-pipeline/src/engine/` (delete directory)
- `packages/design-pipeline/src/state-machine/` (delete directory)
- `packages/design-pipeline/src/contracts/` (delete directory)
- `packages/design-pipeline/src/bin.ts` (delete)
- `packages/design-pipeline/src/index.ts` (delete)
- `packages/design-pipeline/src/bin.test.ts` (delete)
- `packages/design-pipeline/src/index.test.ts` (delete)
- `packages/design-pipeline/package.json` (modify — remove `bin` field, dead scripts, unused deps)

**Description:**
Remove the deprecated TS pipeline engine code. The pipeline is orchestrated by Claude Code agents and skill files, not a TS runtime. The `skill-tests/` directory (17 test files) has zero dependency on the deleted code and must be preserved. The `docs/` directory is kept as historical record.

**Dependencies:** None

**Test (write first):**
No new test needed. This is a pure deletion step. Verify by running the existing `skill-tests/` suite to confirm all 17 test files still pass after deletion. Verify `pnpm lint` and `pnpm tsc --noEmit` succeed in the design-pipeline package.

**TLA+ Coverage:**
- N/A — This step is Task 1 (TS Pipeline Removal), not part of the TLA+ specification. The TLA+ spec covers Task 3 (SW Rewrite) only.

---

### Step 2: Rewrite ethang-hono sw.js

**Files:**
- `apps/ethang-hono/public/sw.js` (rewrite — vanilla JS, no imports, no build step)

**Description:**
Rewrite the ethang-hono service worker in place as a single vanilla JS file. The three changes from the current code per the design consensus are:

1. **Offline fallback page** — Precache `/offline` at install time. Serve it when a navigation request has no cache hit and the network is down.
2. **Concurrency-limited precacheLinks** — Replace the current unbounded `Promise.allSettled` in `precacheLinks()` with a pool that caps concurrent fetches at 10.
3. **Asset strategy becomes cache-first** — Currently both HTML and assets use SWR. Assets with hashed filenames are immutable, so the asset handler should serve from cache immediately when there is a hit (no background revalidation). On cache miss, fetch from network, cache, return. On cache miss + offline, serve offline fallback.

Everything else stays the same: `SW_VERSION` constant at top (stamped by `scripts/stamp-sw.ts`), `ASSETS_CACHE` / `HTML_CACHE` keyed by version, `ALL_CACHES` set, activate purges old caches + `clients.claim()`, HTML uses SWR with Last-Modified comparison and `CONTENT_UPDATED` notification, `PRECACHE_LINKS` message handler.

**Dependencies:** None

**Tests:** None — SW logic is validated by the TLA+ specification. No viable import path for unit testing plain JS service worker files.

**TLA+ Coverage:**
- States: `swState` (all 3), `htmlCache` (all 3), `assetsCache` (both), `networkAvailable` (both), `quotaExceeded` (both), `precacheComplete` (both)
- Transitions: `Activate`, `PurgeOldCaches`, `VersionUpdate`, `ActivateAfterUpdate`, `NetworkFailure`, `NetworkRecovery`, `QuotaExceed`, `QuotaFree`, `NewFetchRequest`, `HtmlServeCachedAndRevalidate`, `HtmlServeFreshFromNetwork`, `HtmlServeFreshQuotaExceeded`, `HtmlServeOfflineFallback`, `AssetServeCached`, `AssetFetchAndCache`, `AssetFetchQuotaExceeded`, `AssetServeOfflineFallback`, `RevalidateUnchanged`, `RevalidateChanged`, `RevalidateNetworkFail`, `RevalidateQuotaFail`, `StartPrecacheBatch`, `PrecacheFetchComplete`, `PrecacheFetchFail`
- Invariants: `TypeOK`, `PrecacheBounded`, `OfflineFallbackCorrect`, `NotificationsValid`, `NotificationsHtmlOnly`, `RevalidationHtmlOnly`, `OldCachesExcludeCurrent`
- Liveness: `EventualRevalidation`, `EventualPrecacheProgress`, `EventualCachePurge`, `EventualQueueDrain`

---

### Step 3: Rewrite sterett-hono sw.js

**Files:**
- `apps/sterett-hono/public/sw.js` (rewrite — vanilla JS, no imports, no build step)

**Description:**
Rewrite the sterett-hono service worker. Same three changes as Step 2 (offline fallback, cache-first assets, concurrency-limited precaching) but with sterett-specific differences:

- **No PRECACHE_LINKS message handler.** Sterett precaches `NAV_ROUTES` at install time, not via a message from controlled pages.
- **Install precaches both NAV_ROUTES and /offline** using the concurrency-limited approach (pool of 10).
- All other logic is identical to ethang-hono: dual cache, HTML SWR with Last-Modified + CONTENT_UPDATED, asset cache-first, activate purge, fetch routing.

**Dependencies:** Step 2 (same logic, sterett-specific install behavior)

**Tests:** None — same rationale as Step 2.

**TLA+ Coverage:**
- Same as Step 2 — identical TLA+ model applies to both apps
- `StartPrecacheBatch` manifests as install-time NAV_ROUTES precaching instead of message-triggered precaching

---

### Step 4: Verify client-side wiring in layout files

**Files:**
- `apps/ethang-hono/src/global/layout.tsx` (verify — no change expected)
- `apps/sterett-hono/src/global/layout.tsx` (verify — no change expected)

**Description:**
Verify that the client-side SW registration code in both layout files handles `CONTENT_UPDATED` correctly: when the SW posts `CONTENT_UPDATED` with a URL, the client reloads if the URL matches the current location. Also verify ethang-hono sends `PRECACHE_LINKS` after registration. No code changes are expected — this is a verification step to confirm the existing client code is compatible with the rewritten SWs.

If the existing client code references the offline fallback page path, update it. If the SW registration does not handle the offline page (it currently does not need to), no change needed.

**Dependencies:** Step 2, Step 3

**Test (write first):**
No unit test — this is thin event listener wiring in client-side `<script>` tags. Verify via browser testing: clear SW cache, navigate, confirm SW activates and fetch events route correctly.

**TLA+ Coverage:**
- Transition: `RevalidateChanged` (client-side consumer of CONTENT_UPDATED)
- Liveness: `EventualRevalidation` (full cycle: revalidation -> notification -> reload)

---

## State Coverage Audit

### States

| State | Covered By |
|-------|-----------|
| `swState = "installing"` | Steps 2, 3 (install handler tests) |
| `swState = "activated"` | Steps 2, 3 (activate handler tests) |
| `swState = "updating"` | Steps 2, 3 (version update via cache name change) |
| `htmlCache[r] = "fresh"` | Steps 2, 3 (HTML SWR tests — revalidation outcomes) |
| `htmlCache[r] = "stale"` | Steps 2, 3 (HTML SWR tests — cache hit + background revalidation) |
| `htmlCache[r] = NULL` | Steps 2, 3 (HTML SWR tests — cache miss paths) |
| `assetsCache[r] = "cached"` | Steps 2, 3 (asset cache-first tests — cache hit) |
| `assetsCache[r] = NULL` | Steps 2, 3 (asset cache-first tests — cache miss) |
| `networkAvailable = TRUE/FALSE` | Steps 2, 3 (tested via mock fetch success/throw) |
| `quotaExceeded = TRUE/FALSE` | Steps 2, 3 (tested via mock cache.put throw) |
| `precacheComplete = TRUE/FALSE` | Steps 2, 3 (precache concurrency tests) |

### Transitions

| Transition | Covered By |
|-----------|-----------|
| `Activate` | Steps 2, 3 (install handler test) |
| `PurgeOldCaches` | Steps 2, 3 (activate handler test) |
| `VersionUpdate` | Steps 2, 3 (activate handler test — old cache names purged) |
| `ActivateAfterUpdate` | Steps 2, 3 (activate handler test — clients.claim) |
| `NetworkFailure` | Steps 2, 3 (mock fetch throwing TypeError) |
| `NetworkRecovery` | Steps 2, 3 (mock fetch succeeding after prior failure) |
| `QuotaExceed` | Steps 2, 3 (mock cache.put throwing DOMException) |
| `QuotaFree` | Steps 2, 3 (mock cache.put succeeding) |
| `NewFetchRequest` | Steps 2, 3 (fetch routing tests) |
| `HtmlServeCachedAndRevalidate` | Steps 2, 3 (HTML cache hit tests) |
| `HtmlServeFreshFromNetwork` | Steps 2, 3 (HTML cache miss + network test) |
| `HtmlServeFreshQuotaExceeded` | Steps 2, 3 (HTML cache miss + quota test) |
| `HtmlServeOfflineFallback` | Steps 2, 3 (HTML cache miss + offline test) |
| `AssetServeCached` | Steps 2, 3 (asset cache hit test) |
| `AssetFetchAndCache` | Steps 2, 3 (asset cache miss + network test) |
| `AssetFetchQuotaExceeded` | Steps 2, 3 (asset cache miss + quota test) |
| `AssetServeOfflineFallback` | Steps 2, 3 (asset cache miss + offline test) |
| `RevalidateUnchanged` | Steps 2, 3 (HTML revalidation unchanged test) |
| `RevalidateChanged` | Steps 2, 3 (HTML revalidation changed test) |
| `RevalidateNetworkFail` | Steps 2, 3 (HTML revalidation network fail test) |
| `RevalidateQuotaFail` | Steps 2, 3 (HTML revalidation quota fail test) |
| `StartPrecacheBatch` | Steps 2, 3 (precache concurrency limit test) |
| `PrecacheFetchComplete` | Steps 2, 3 (precache success test) |
| `PrecacheFetchFail` | Steps 2, 3 (precache failure test) |

### Safety Invariants

| Invariant | Verified By |
|-----------|------------|
| `TypeOK` | Steps 2, 3 (TypeScript test type safety + runtime assertions) |
| `PrecacheBounded` | Steps 2, 3 (concurrency limit test — peak never exceeds 10) |
| `OfflineFallbackCorrect` | Steps 2, 3 (offline tests — fallback returned as response) |
| `NotificationsValid` | Steps 2, 3 (notification test — only for served requests) |
| `NotificationsHtmlOnly` | Steps 2, 3 (asset tests assert no CONTENT_UPDATED) |
| `RevalidationHtmlOnly` | Steps 2, 3 (asset cache-first has no revalidation) |
| `OldCachesExcludeCurrent` | Steps 2, 3 (activate handler preserves current caches) |

### Liveness Properties

| Property | Verified By |
|----------|------------|
| `EventualRevalidation` | Steps 2, 3 (revalidation always resolves in tests) |
| `EventualPrecacheProgress` | Steps 2, 3 (all precache URLs eventually processed) |
| `EventualCachePurge` | Steps 2, 3 (activate handler deletes all old caches) |
| `EventualQueueDrain` | Steps 2, 3 (every fetch test returns a response) |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Independent foundations (no cross-dependencies)

Task 1 (TS Pipeline Removal) touches only `packages/design-pipeline/`. Task 2 (ethang-hono SW) touches only `apps/ethang-hono/`. These have zero file overlap and can run in parallel. Maximum parallelism: 2 worktrees.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Delete TS Pipeline Engine code |
| T2 | Step 2 | Rewrite ethang-hono sw.js |

### Tier 2: Sterett SW rewrite (depends on Tier 1 — reuses test patterns from T2)

Task 3 uses the same SW logic as T2 with sterett-specific install behavior. It touches only `apps/sterett-hono/` so there is no file overlap with T1 or T2. Depends on T2 to confirm the pattern works before applying to the second app.

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Rewrite sterett-hono sw.js |

### Tier 3: Client wiring verification (depends on Tier 2 — SWs must be rewritten)

Verify the layout files work with the rewritten SWs. This is a verification step, not a code change.

| Task ID | Step | Title |
|---------|------|-------|
| T4 | Step 4 | Verify client-side wiring in layout files |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Delete TS Pipeline Engine code | 1 | typescript-writer | vitest-writer | None | Deletion task with package.json cleanup; vitest-writer validates existing skill-tests still pass |
| T2 | Rewrite ethang-hono sw.js | 1 | hono-writer | — | None | Vanilla JS rewrite in Hono app's public directory |
| T3 | Rewrite sterett-hono sw.js | 2 | hono-writer | — | T2 | Same logic as T2 with sterett-specific install behavior |
| T4 | Verify client-side wiring in layout files | 3 | hono-writer | — | T2, T3 | Layout file verification — no code change expected |

### Blocker Analysis

| Task ID | Is Blocker | Blocks |
|---------|-----------|--------|
| T1 | No | (independent — different commit) |
| T2 | Yes | T3 (test pattern reuse) |
| T3 | Yes | T4 (SWs must be finalized) |
| T4 | No | (terminal task) |

### Commit Strategy

- **After T1:** Separate commit for TS Pipeline Removal (Task 1)
- **After T4:** Single commit for all SW Rewrite work (Task 3)
