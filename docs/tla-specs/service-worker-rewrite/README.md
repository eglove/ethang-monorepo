# TLA+ Specification: Service Worker Rewrite (v2)

## Source
Briefing: `docs/questioner-sessions/2026-04-02_cleanup-ts-engine-sw-rewrite.md`
Consensus: `docs/debate-moderator-sessions/2026-04-02_cleanup-ts-engine-sw-rewrite.md`
Review: `docs/debate-moderator-sessions/2026-04-02_tla-review-service-worker.md`

## Specification
- **Module:** `ServiceWorker.tla`
- **Config:** `ServiceWorker.cfg`

## Revision Summary (v2)

This revision addresses 4 gaps identified during the Stage 4 TLA+ review debate:

### Gap 1 (HIGH) -- Dual cache modeled
Split single `cache` variable into `htmlCache` (SWR with revalidation and CONTENT_UPDATED notifications) and `assetsCache` (cache-first, immutable by hashed URL, no revalidation). HTML and asset requests have entirely separate action sets reflecting their distinct caching strategies.

### Gap 2 (HIGH) -- Tautological S1 replaced
Removed the tautological `ClientAlwaysGetsResponse` safety property. Replaced with `EventualQueueDrain` liveness property: every request enqueued in fetchQueue eventually appears in clientResponses. Network-dependent serve actions use strong fairness (SF) to handle adversarial network toggling.

### Gap 3 (MEDIUM) -- Trivial S3 removed
Removed `OldCachesEventuallyEmpty` which was subsumed by TypeOK. The useful property is already captured by the `EventualCachePurge` liveness property. Added `OldCachesExcludeCurrent` as a meaningful replacement safety property.

### Gap 4 (MEDIUM) -- Version update flow added
Added `VersionUpdate(newVersion)` action modeling skipWaiting + clients.claim: transitions swState to "updating", moves currentVersion to oldCaches, sets new version, clears both caches, resets precache counters, and abandons pending revalidations. `ActivateAfterUpdate` completes the cycle. `PurgeOldCaches` then cleans up the old version's caches.

## States

The specification models these state dimensions:

- **SW lifecycle:** installing, activated, updating (new in v2)
- **HTML cache per request:** NULL (empty), fresh, stale (SWR strategy)
- **Assets cache per request:** NULL (empty), cached (cache-first, immutable)
- **Network:** available, unavailable (adversarial)
- **Quota:** normal, exceeded (adversarial)
- **Precache progress:** remaining count, in-flight count, complete flag
- **Per-request tracking:** pending revalidation (HTML only), client responded, offline fallback served, content-updated notified (HTML only)
- **Version management:** currentVersion, oldCaches set, version update cycle

## Properties Verified

### Safety (Invariants)
- **TypeOK** -- All variables stay within their declared domains
- **PrecacheBounded** -- Concurrent precache fetches never exceed ConcurrencyLimit
- **OfflineFallbackCorrect** -- Offline fallback is only served for requests that received a client response
- **NotificationsValid** -- CONTENT_UPDATED notifications are only sent for requests the client already received a response for
- **NotificationsHtmlOnly** -- CONTENT_UPDATED notifications are never sent for asset requests
- **RevalidationHtmlOnly** -- Background revalidation only applies to HTML requests, never assets
- **OldCachesExcludeCurrent** -- The current active version is never in the old caches set

### Liveness
- **EventualRevalidation** -- Any pending background revalidation eventually resolves
- **EventualPrecacheProgress** -- In-flight precache fetches eventually complete or precache finishes
- **EventualCachePurge** -- Old version caches are eventually purged after SW activation
- **EventualQueueDrain** -- Every enqueued request eventually receives a client response

## Fairness Model

- **WF (weak fairness):** Activate, ActivateAfterUpdate, PurgeOldCaches, HtmlServeCachedAndRevalidate, AssetServeCached -- these actions are continuously enabled once their guards are met
- **SF (strong fairness):** All network-dependent serve actions (HtmlServeFreshFromNetwork, HtmlServeOfflineFallback, HtmlServeFreshQuotaExceeded, AssetFetchAndCache, AssetFetchQuotaExceeded, AssetServeOfflineFallback), all revalidation actions, PrecacheFetchComplete, PrecacheFetchFail -- adversarial network toggling means these are enabled infinitely often but not continuously
- **No fairness:** NetworkFailure, NetworkRecovery, QuotaExceed, QuotaFree -- adversarial environment

## TLC Results
- **States generated:** 11,701
- **Distinct states:** 2,636
- **Graph depth:** 17
- **Result:** PASS (no errors)
- **Workers:** 4
- **Date:** 2026-04-02

## Model Parameters
- HtmlRequestIds = {1}
- AssetRequestIds = {2}
- MaxPrecacheLinks = 2
- ConcurrencyLimit = 2
- CacheVersions = {v1, v2}

## Key Design Insights

1. **Strong fairness required for network-dependent serve actions** -- The v1 spec used WF for serve actions, but the v2 EventualQueueDrain liveness property exposed that adversarial network toggling can prevent queue drain under WF. SF is necessary for any action whose enablement depends on networkAvailable.
2. **Dual cache eliminates cross-strategy contamination** -- Separate htmlCache and assetsCache variables make it structurally impossible for asset requests to trigger revalidation or notifications, and for HTML requests to use cache-first without revalidation.
3. **Version update clears both caches** -- When a new SW version activates, both caches are cleared. HTML pages need fresh content discovery; asset URLs change with new hashes, making old cached entries unreachable.
4. **OldCachesExcludeCurrent replaces trivial S3** -- Rather than asserting oldCaches is a subset of CacheVersions (trivially true by TypeOK), the spec now asserts the current version is never in oldCaches, which is a meaningful structural invariant.

## Prior Versions
- v1: Initial spec (2026-04-02) -- single cache, tautological S1, trivial S3, no version updates
