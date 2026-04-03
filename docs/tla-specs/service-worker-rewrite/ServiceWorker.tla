--------------------------- MODULE ServiceWorker ---------------------------
\* Service Worker Specification (v2 — revised per Stage 4 review)
\* Models the lifecycle, dual-cache strategy, notification behavior,
\* version updates, and offline fallback for a service worker with:
\*   - HTML_CACHE: stale-while-revalidate + background revalidation + CONTENT_UPDATED
\*   - ASSETS_CACHE: cache-first, immutable by hashed URL, no revalidation
\*   - Precaching with bounded concurrency
\*   - SW version update cycle (skipWaiting + clients.claim)
\*
\* Source: design-pipeline Stage 2 consensus for Task 3 (SW rewrite)

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    HtmlRequestIds,     \* Set of HTML request IDs (e.g. 1..2)
    AssetRequestIds,    \* Set of asset request IDs (e.g. 3..4)
    MaxPrecacheLinks,   \* Total precache URLs to process
    ConcurrencyLimit,   \* Max concurrent precache fetches (e.g. 10)
    CacheVersions,      \* Set of version strings e.g. {"v1", "v2", "v3"}
    NULL                \* Sentinel for "no value"

VARIABLES
    swState,            \* SW lifecycle: "installing" | "activated" | "updating"
    currentVersion,     \* Active cache version (element of CacheVersions)
    oldCaches,          \* Set of version strings not yet purged
    htmlCache,          \* Function: HtmlRequestId -> CacheEntryState | NULL
    assetsCache,        \* Function: AssetRequestId -> "cached" | NULL
    pendingFetches,     \* Set of HtmlRequestIds with background revalidation in flight
    networkAvailable,   \* Boolean: whether network is reachable
    quotaExceeded,      \* Boolean: whether cache storage is full
    clientNotified,     \* Set of HtmlRequestIds for which CONTENT_UPDATED sent
    clientResponses,    \* Set of RequestIds (HTML + Asset) that received a response
    offlineFallbacks,   \* Set of RequestIds served offline fallback
    precacheRemaining,  \* Count of precache URLs not yet fetched
    precacheInFlight,   \* Count of precache fetches currently active
    precacheComplete,   \* Boolean: all precache work done
    fetchQueue          \* Sequence of RequestIds (HTML or Asset) awaiting processing

vars == <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
          pendingFetches, networkAvailable, quotaExceeded, clientNotified,
          clientResponses, offlineFallbacks, precacheRemaining,
          precacheInFlight, precacheComplete, fetchQueue>>

AllRequestIds == HtmlRequestIds \cup AssetRequestIds

\* HTML cache entries track freshness for SWR
HtmlCacheEntryState == {"fresh", "stale"}

-----------------------------------------------------------------------------
\* Type Invariant
-----------------------------------------------------------------------------

TypeOK ==
    /\ swState \in {"installing", "activated", "updating"}
    /\ currentVersion \in CacheVersions
    /\ oldCaches \subseteq CacheVersions
    /\ htmlCache \in [HtmlRequestIds -> HtmlCacheEntryState \cup {NULL}]
    /\ assetsCache \in [AssetRequestIds -> {"cached", NULL}]
    /\ pendingFetches \subseteq HtmlRequestIds
    /\ networkAvailable \in BOOLEAN
    /\ quotaExceeded \in BOOLEAN
    /\ clientNotified \subseteq HtmlRequestIds
    /\ clientResponses \subseteq AllRequestIds
    /\ offlineFallbacks \subseteq AllRequestIds
    /\ precacheRemaining \in 0..MaxPrecacheLinks
    /\ precacheInFlight \in 0..ConcurrencyLimit
    /\ precacheComplete \in BOOLEAN
    /\ fetchQueue \in Seq(AllRequestIds)

-----------------------------------------------------------------------------
\* Initial State
-----------------------------------------------------------------------------

Init ==
    /\ swState = "installing"
    /\ currentVersion = CHOOSE v \in CacheVersions : TRUE
    /\ oldCaches = {}
    /\ htmlCache = [r \in HtmlRequestIds |-> NULL]
    /\ assetsCache = [r \in AssetRequestIds |-> NULL]
    /\ pendingFetches = {}
    /\ networkAvailable = TRUE
    /\ quotaExceeded = FALSE
    /\ clientNotified = {}
    /\ clientResponses = {}
    /\ offlineFallbacks = {}
    /\ precacheRemaining = MaxPrecacheLinks
    /\ precacheInFlight = 0
    /\ precacheComplete = FALSE
    /\ fetchQueue = <<>>

-----------------------------------------------------------------------------
\* SW Lifecycle Actions
-----------------------------------------------------------------------------

\* Complete installation (precache offline fallback page, then activate)
Activate ==
    /\ swState = "installing"
    /\ swState' = "activated"
    /\ UNCHANGED <<currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheRemaining, precacheInFlight, precacheComplete,
                   fetchQueue>>

\* Purge old caches during activate event
PurgeOldCaches ==
    /\ swState = "activated"
    /\ oldCaches /= {}
    /\ oldCaches' = {}
    /\ UNCHANGED <<swState, currentVersion, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheRemaining, precacheInFlight, precacheComplete,
                   fetchQueue>>

\* Gap 4 fix: Version update — a new SW version arrives, triggers
\* skipWaiting + clients.claim. Old version moves to oldCaches,
\* new version becomes current. SW goes through update cycle.
VersionUpdate(newVersion) ==
    /\ swState = "activated"
    /\ newVersion \in CacheVersions
    /\ newVersion /= currentVersion
    /\ newVersion \notin oldCaches
    /\ swState' = "updating"
    /\ oldCaches' = oldCaches \cup {currentVersion}
    /\ currentVersion' = newVersion
    \* Clear HTML cache (new version has fresh content to discover)
    /\ htmlCache' = [r \in HtmlRequestIds |-> NULL]
    \* Assets cache cleared (new hashed URLs are different resources)
    /\ assetsCache' = [r \in AssetRequestIds |-> NULL]
    \* Reset precache for the new version
    /\ precacheRemaining' = MaxPrecacheLinks
    /\ precacheInFlight' = 0
    /\ precacheComplete' = FALSE
    \* Pending revalidations from old version are abandoned
    /\ pendingFetches' = {}
    /\ UNCHANGED <<networkAvailable, quotaExceeded, clientNotified,
                   clientResponses, offlineFallbacks, fetchQueue>>

\* Updated SW completes activation after update cycle
ActivateAfterUpdate ==
    /\ swState = "updating"
    /\ swState' = "activated"
    /\ UNCHANGED <<currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheRemaining, precacheInFlight, precacheComplete,
                   fetchQueue>>

-----------------------------------------------------------------------------
\* Environment Actions (model non-determinism)
-----------------------------------------------------------------------------

\* Network can go down at any time
NetworkFailure ==
    /\ networkAvailable = TRUE
    /\ networkAvailable' = FALSE
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, quotaExceeded, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

\* Network can recover at any time
NetworkRecovery ==
    /\ networkAvailable = FALSE
    /\ networkAvailable' = TRUE
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, quotaExceeded, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

\* Quota can become exceeded at any time
QuotaExceed ==
    /\ quotaExceeded = FALSE
    /\ quotaExceeded' = TRUE
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

\* Quota can free up (e.g. after purge)
QuotaFree ==
    /\ quotaExceeded = TRUE
    /\ quotaExceeded' = FALSE
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

-----------------------------------------------------------------------------
\* HTML Fetch Handling: Stale-While-Revalidate
\* HTML requests use SWR: serve from cache, then background revalidate.
\* On content change, send CONTENT_UPDATED notification to client.
-----------------------------------------------------------------------------

\* A new fetch request arrives (HTML or asset)
NewFetchRequest(r) ==
    /\ swState = "activated"
    /\ r \notin clientResponses
    /\ r \notin offlineFallbacks
    \* Prevent duplicate enqueue
    /\ \A i \in 1..Len(fetchQueue) : fetchQueue[i] /= r
    /\ fetchQueue' = Append(fetchQueue, r)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheRemaining, precacheInFlight, precacheComplete>>

\* HTML: Serve from cache (cache hit) and start background revalidation
HtmlServeCachedAndRevalidate(r) ==
    /\ swState = "activated"
    /\ r \in HtmlRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ htmlCache[r] \in HtmlCacheEntryState     \* cache hit
    /\ r \notin pendingFetches                   \* not already revalidating
    /\ clientResponses' = clientResponses \cup {r}
    /\ pendingFetches' = pendingFetches \cup {r}
    /\ htmlCache' = [htmlCache EXCEPT ![r] = "stale"]
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, assetsCache,
                   networkAvailable, quotaExceeded, clientNotified,
                   offlineFallbacks, precacheRemaining, precacheInFlight,
                   precacheComplete>>

\* HTML: Cache miss + network available: fetch from network
HtmlServeFreshFromNetwork(r) ==
    /\ swState = "activated"
    /\ r \in HtmlRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ htmlCache[r] = NULL                  \* cache miss
    /\ networkAvailable = TRUE
    /\ ~quotaExceeded
    /\ clientResponses' = clientResponses \cup {r}
    /\ htmlCache' = [htmlCache EXCEPT ![r] = "fresh"]
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete>>

\* HTML: Cache miss + network + quota exceeded: serve but cannot cache
HtmlServeFreshQuotaExceeded(r) ==
    /\ swState = "activated"
    /\ r \in HtmlRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ htmlCache[r] = NULL
    /\ networkAvailable = TRUE
    /\ quotaExceeded = TRUE
    /\ clientResponses' = clientResponses \cup {r}
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete>>

\* HTML: Cache miss + network down: serve offline fallback
HtmlServeOfflineFallback(r) ==
    /\ swState = "activated"
    /\ r \in HtmlRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ htmlCache[r] = NULL                  \* cache miss
    /\ networkAvailable = FALSE
    /\ clientResponses' = clientResponses \cup {r}
    /\ offlineFallbacks' = offlineFallbacks \cup {r}
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, precacheRemaining, precacheInFlight,
                   precacheComplete>>

-----------------------------------------------------------------------------
\* Asset Fetch Handling: Cache-First, Immutable
\* Assets have hashed filenames — once cached, they never need
\* revalidation. No background fetch, no notifications.
-----------------------------------------------------------------------------

\* Asset: Cache hit — serve immediately, no revalidation
AssetServeCached(r) ==
    /\ swState = "activated"
    /\ r \in AssetRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ assetsCache[r] = "cached"            \* cache hit
    /\ clientResponses' = clientResponses \cup {r}
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete>>

\* Asset: Cache miss + network available: fetch and cache
AssetFetchAndCache(r) ==
    /\ swState = "activated"
    /\ r \in AssetRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ assetsCache[r] = NULL                \* cache miss
    /\ networkAvailable = TRUE
    /\ ~quotaExceeded
    /\ clientResponses' = clientResponses \cup {r}
    /\ assetsCache' = [assetsCache EXCEPT ![r] = "cached"]
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete>>

\* Asset: Cache miss + network + quota exceeded: serve without caching
AssetFetchQuotaExceeded(r) ==
    /\ swState = "activated"
    /\ r \in AssetRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ assetsCache[r] = NULL
    /\ networkAvailable = TRUE
    /\ quotaExceeded = TRUE
    /\ clientResponses' = clientResponses \cup {r}
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete>>

\* Asset: Cache miss + network down: serve offline fallback
AssetServeOfflineFallback(r) ==
    /\ swState = "activated"
    /\ r \in AssetRequestIds
    /\ Len(fetchQueue) > 0
    /\ Head(fetchQueue) = r
    /\ assetsCache[r] = NULL
    /\ networkAvailable = FALSE
    /\ clientResponses' = clientResponses \cup {r}
    /\ offlineFallbacks' = offlineFallbacks \cup {r}
    /\ fetchQueue' = Tail(fetchQueue)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, precacheRemaining, precacheInFlight,
                   precacheComplete>>

-----------------------------------------------------------------------------
\* Background Revalidation (HTML only)
-----------------------------------------------------------------------------

\* Background fetch succeeds, content unchanged
RevalidateUnchanged(r) ==
    /\ r \in pendingFetches
    /\ networkAvailable = TRUE
    /\ pendingFetches' = pendingFetches \ {r}
    /\ htmlCache' = [htmlCache EXCEPT ![r] = "fresh"]
    /\ UNCHANGED <<swState, currentVersion, oldCaches, assetsCache,
                   networkAvailable, quotaExceeded, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

\* Background fetch succeeds, content changed — send CONTENT_UPDATED
RevalidateChanged(r) ==
    /\ r \in pendingFetches
    /\ networkAvailable = TRUE
    /\ ~quotaExceeded
    /\ pendingFetches' = pendingFetches \ {r}
    /\ htmlCache' = [htmlCache EXCEPT ![r] = "fresh"]
    /\ clientNotified' = clientNotified \cup {r}
    /\ UNCHANGED <<swState, currentVersion, oldCaches, assetsCache,
                   networkAvailable, quotaExceeded, clientResponses,
                   offlineFallbacks, precacheRemaining, precacheInFlight,
                   precacheComplete, fetchQueue>>

\* Background fetch fails (network down) — stale cache remains
RevalidateNetworkFail(r) ==
    /\ r \in pendingFetches
    /\ networkAvailable = FALSE
    /\ pendingFetches' = pendingFetches \ {r}
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   networkAvailable, quotaExceeded, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

\* Background fetch succeeds but quota exceeded — swallow error
RevalidateQuotaFail(r) ==
    /\ r \in pendingFetches
    /\ networkAvailable = TRUE
    /\ quotaExceeded = TRUE
    /\ pendingFetches' = pendingFetches \ {r}
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   networkAvailable, quotaExceeded, clientNotified,
                   clientResponses, offlineFallbacks, precacheRemaining,
                   precacheInFlight, precacheComplete, fetchQueue>>

-----------------------------------------------------------------------------
\* Precaching (PRECACHE_LINKS / NAV_ROUTES)
-----------------------------------------------------------------------------

\* Start a batch of precache fetches, bounded by ConcurrencyLimit
StartPrecacheBatch ==
    /\ swState = "activated"
    /\ precacheRemaining > 0
    /\ precacheInFlight < ConcurrencyLimit
    /\ networkAvailable = TRUE
    /\ LET batch == IF precacheRemaining < (ConcurrencyLimit - precacheInFlight)
                    THEN precacheRemaining
                    ELSE ConcurrencyLimit - precacheInFlight
       IN /\ precacheInFlight' = precacheInFlight + batch
          /\ precacheRemaining' = precacheRemaining - batch
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheComplete, fetchQueue>>

\* A single precache fetch completes successfully
PrecacheFetchComplete ==
    /\ precacheInFlight > 0
    /\ networkAvailable = TRUE
    /\ precacheInFlight' = precacheInFlight - 1
    /\ precacheComplete' = (precacheRemaining = 0 /\ precacheInFlight' = 0)
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheRemaining, fetchQueue>>

\* A precache fetch fails (network down) — return URL to remaining pool
PrecacheFetchFail ==
    /\ precacheInFlight > 0
    /\ networkAvailable = FALSE
    /\ precacheInFlight' = precacheInFlight - 1
    /\ precacheRemaining' = precacheRemaining + 1
    /\ UNCHANGED <<swState, currentVersion, oldCaches, htmlCache, assetsCache,
                   pendingFetches, networkAvailable, quotaExceeded,
                   clientNotified, clientResponses, offlineFallbacks,
                   precacheComplete, fetchQueue>>

-----------------------------------------------------------------------------
\* Next State Relation
-----------------------------------------------------------------------------

Next ==
    \* Lifecycle
    \/ Activate
    \/ PurgeOldCaches
    \/ \E v \in CacheVersions : VersionUpdate(v)
    \/ ActivateAfterUpdate
    \* Environment
    \/ NetworkFailure
    \/ NetworkRecovery
    \/ QuotaExceed
    \/ QuotaFree
    \* HTML fetch handling (SWR)
    \/ \E r \in AllRequestIds : NewFetchRequest(r)
    \/ \E r \in HtmlRequestIds : HtmlServeCachedAndRevalidate(r)
    \/ \E r \in HtmlRequestIds : HtmlServeFreshFromNetwork(r)
    \/ \E r \in HtmlRequestIds : HtmlServeFreshQuotaExceeded(r)
    \/ \E r \in HtmlRequestIds : HtmlServeOfflineFallback(r)
    \* Asset fetch handling (cache-first, immutable)
    \/ \E r \in AssetRequestIds : AssetServeCached(r)
    \/ \E r \in AssetRequestIds : AssetFetchAndCache(r)
    \/ \E r \in AssetRequestIds : AssetFetchQuotaExceeded(r)
    \/ \E r \in AssetRequestIds : AssetServeOfflineFallback(r)
    \* HTML revalidation
    \/ \E r \in HtmlRequestIds : RevalidateUnchanged(r)
    \/ \E r \in HtmlRequestIds : RevalidateChanged(r)
    \/ \E r \in HtmlRequestIds : RevalidateNetworkFail(r)
    \/ \E r \in HtmlRequestIds : RevalidateQuotaFail(r)
    \* Precaching
    \/ StartPrecacheBatch
    \/ PrecacheFetchComplete
    \/ PrecacheFetchFail

\* Fairness: system actions use WF when continuously enabled, SF when
\* adversarial environment toggles enablement. Environment actions
\* (network/quota) have no fairness — they are adversarial.
Fairness ==
    /\ WF_vars(Activate)
    /\ WF_vars(ActivateAfterUpdate)
    /\ WF_vars(PurgeOldCaches)
    \* HTML fetch serving — cache-hit path is WF (no network dependency),
    \* network-dependent paths use SF (network toggling toggles enablement)
    /\ \A r \in HtmlRequestIds : WF_vars(HtmlServeCachedAndRevalidate(r))
    /\ \A r \in HtmlRequestIds : SF_vars(HtmlServeFreshFromNetwork(r))
    /\ \A r \in HtmlRequestIds : SF_vars(HtmlServeFreshQuotaExceeded(r))
    /\ \A r \in HtmlRequestIds : SF_vars(HtmlServeOfflineFallback(r))
    \* Asset fetch serving — cache-hit is WF, network-dependent paths SF
    /\ \A r \in AssetRequestIds : WF_vars(AssetServeCached(r))
    /\ \A r \in AssetRequestIds : SF_vars(AssetFetchAndCache(r))
    /\ \A r \in AssetRequestIds : SF_vars(AssetFetchQuotaExceeded(r))
    /\ \A r \in AssetRequestIds : SF_vars(AssetServeOfflineFallback(r))
    \* Revalidation (SF for adversarial network toggling)
    /\ \A r \in HtmlRequestIds : SF_vars(RevalidateUnchanged(r))
    /\ \A r \in HtmlRequestIds : SF_vars(RevalidateChanged(r))
    /\ \A r \in HtmlRequestIds : SF_vars(RevalidateNetworkFail(r))
    /\ \A r \in HtmlRequestIds : SF_vars(RevalidateQuotaFail(r))
    \* Precaching
    /\ WF_vars(StartPrecacheBatch)
    /\ SF_vars(PrecacheFetchComplete)
    /\ SF_vars(PrecacheFetchFail)

Spec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------
\* Safety Properties
-----------------------------------------------------------------------------

\* S1 (Gap 2 fix): Every enqueued request eventually receives a response.
\* Expressed as safety: no request can be in clientResponses without
\* having been validly served (not orphaned).
\* The meaningful safety property: if a request has been dequeued and
\* served, it must appear in clientResponses.
\* Notifications are only sent for requests that were actually responded to.
\* (The liveness version — every enqueued request eventually gets served —
\*  is captured by EventualQueueDrain below.)

\* S2: Concurrent precache fetches never exceed the bound
PrecacheBounded ==
    precacheInFlight <= ConcurrencyLimit

\* S3 removed per Gap 3 — was trivially true (subsumed by TypeOK).
\* The useful old-cache property is the liveness EventualCachePurge.

\* S4: Offline fallback only served when client got a response
OfflineFallbackCorrect ==
    \A r \in offlineFallbacks :
        r \in clientResponses

\* S5: CONTENT_UPDATED notifications only sent for HTML requests
\*     that the client already received a response for
NotificationsValid ==
    clientNotified \subseteq clientResponses

\* S6: Notifications are only for HTML requests (never assets)
NotificationsHtmlOnly ==
    clientNotified \subseteq HtmlRequestIds

\* S7: Revalidation is only for HTML requests (never assets)
RevalidationHtmlOnly ==
    pendingFetches \subseteq HtmlRequestIds

\* S8: Old caches never include the current version
OldCachesExcludeCurrent ==
    currentVersion \notin oldCaches

-----------------------------------------------------------------------------
\* Liveness Properties
-----------------------------------------------------------------------------

\* L1: Content updates eventually reach the client (if network recovers)
EventualRevalidation ==
    \A r \in HtmlRequestIds :
        r \in pendingFetches ~> r \notin pendingFetches

\* L2: Precaching eventually completes or resolves
EventualPrecacheProgress ==
    precacheInFlight > 0 ~> (precacheInFlight = 0 \/ precacheComplete = TRUE)

\* L3: Old cache cleanup eventually completes after activation
EventualCachePurge ==
    (swState = "activated" /\ oldCaches /= {}) ~> oldCaches = {}

\* L4 (Gap 2 fix): Every request in the fetch queue eventually gets served.
\* This is the meaningful replacement for the tautological S1.
EventualQueueDrain ==
    \A r \in AllRequestIds :
        (\E i \in 1..Len(fetchQueue) : fetchQueue[i] = r) ~> r \in clientResponses

=============================================================================
