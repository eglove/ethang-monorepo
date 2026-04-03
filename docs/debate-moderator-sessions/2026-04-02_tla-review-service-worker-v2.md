# Debate Session — tla-review-service-worker-v2

## Metadata

- **Date:** 2026-04-02
- **Topic:** TLA+ Re-Review of ServiceWorker.tla v2 — verifying 4 gap fixes from first review
- **Experts:** expert-tdd, expert-edge-cases, expert-performance, expert-continuous-delivery
- **Rounds:** 1
- **Result:** CONSENSUS REACHED

---

## Synthesis

### Agreed Recommendation

The revised TLA+ specification (ServiceWorker.tla v2) correctly addresses all four gaps identified in the first review. The spec passes re-review and is ready for Stage 5 (Implementation Planning).

**Gap 1 — Dual cache: FIXED.** The spec now models `htmlCache` and `assetsCache` as separate variables with distinct type domains and completely separated action sets. HTML uses SWR (serve cached + background revalidate + CONTENT_UPDATED notifications). Assets use cache-first with no revalidation. The `NotificationsHtmlOnly` and `RevalidationHtmlOnly` safety invariants formally prevent cross-strategy contamination. TLC verified both invariants across 11,701 states.

**Gap 2 — S1 tautology: FIXED.** The tautological `ClientAlwaysGetsResponse` is removed. It is replaced by `EventualQueueDrain` (L4), a genuine liveness property: every request that enters `fetchQueue` eventually appears in `clientResponses`. This is meaningful because (a) it can genuinely fail if fairness annotations are wrong, and (b) it maps directly to a testable assertion ("no request is silently dropped"). The SF fairness on network-dependent serve actions ensures the property holds even under adversarial network toggling.

**Gap 3 — S3 trivially true: FIXED.** The trivial `OldCachesEventuallyEmpty` is removed. It is replaced by `OldCachesExcludeCurrent` (S8), a real safety invariant: `currentVersion \notin oldCaches`. This is not subsumed by `TypeOK`, can genuinely fail if `VersionUpdate` has a bug, and maps to a concrete test: "after any version transition, the active version is never in the old-caches set."

**Gap 4 — Version update flow: FIXED.** The spec now models a three-state lifecycle: `"installing"` -> `"activated"` -> `"updating"` -> `"activated"`. `VersionUpdate(newVersion)` atomically moves the old version to `oldCaches`, installs the new version, clears both caches, resets precache state, and abandons pending revalidations. `ActivateAfterUpdate` completes the cycle. The `"updating"` intermediate state serializes version transitions and prevents concurrent operations during the update. Edge cases verified: rapid successive updates are serialized, queued requests survive the transition and are served after reactivation, rollback is implicitly handled as another forward version update.

**Low-priority items from first review (5-9) remain unchanged.** These were explicitly noted as non-blocking in the first review and are acceptable abstractions for the current spec scope.

**TLC results:** PASS — 11,701 states, 2,636 distinct, depth 17, 7 safety invariants + 4 liveness properties verified.

---

### Expert Final Positions

**expert-tdd**
Position: The v2 spec is sound. All 4 gaps are properly addressed. A test suite built from this spec can now correctly distinguish HTML SWR from asset cache-first behavior, verify meaningful liveness (no dropped requests), verify deployment safety (old caches exclude current version), and cover the version update lifecycle.
Key reasoning: The dual-cache separation enables correct test strategy (different test paths for HTML vs assets). EventualQueueDrain is a genuine liveness property that maps to a testable assertion. OldCachesExcludeCurrent can genuinely fail and is therefore a meaningful safety check. The version update model covers the full install-activate-update-activate cycle. Minor observation: `clientNotified` is preserved across version transitions (not cleared), which is correct since notifications for the old version are historical records.
Endorsed: expert-edge-cases (edge case analysis of VersionUpdate during active requests confirms queue preservation is safe), expert-continuous-delivery (rollback analysis confirms no special rollback action is needed)

**expert-edge-cases**
Position: The v2 spec addresses the structural gaps and withstands systematic edge case analysis. No new failure modes introduced by the revision.
Key reasoning: Cross-contamination is prevented by construction and verified by invariants. EventualQueueDrain holds because every enqueued request has at least one enabled serve action (offline fallback) in every environment state, and SF ensures it fires. Rapid successive version updates are serialized by the "updating" state guard. oldCaches can accumulate across multiple version transitions but PurgeOldCaches clears the entire set atomically. The `newVersion \notin oldCaches` guard in VersionUpdate prevents cycling back to retired versions.
Endorsed: expert-tdd (test-from-spec traceability observation), expert-performance (conservative cache-clearing is valid abstraction), expert-continuous-delivery (deployment safety analysis of the updating state)

**expert-performance**
Position: The v2 spec correctly models the performance-critical characteristics of the dual-cache system. No performance-relevant concerns.
Key reasoning: Asset cache hits (AssetServeCached) have no revalidation overhead, matching real-world immutable-asset performance. HTML cache hits trigger background revalidation (SWR pattern), correctly modeling the fast-first-then-fresh strategy. Cache clearing on version update is conservative (full miss for all requests) but valid for safety analysis. Precache reset on version update correctly models version-specific precache lists. The fairness annotations (WF for cache-hit paths, SF for network-dependent paths) correctly distinguish reliably-available from adversarially-toggled performance paths.
Endorsed: expert-edge-cases (every enqueued request has an enabled path in every environment state), expert-tdd (EventualQueueDrain maps to testable assertion), expert-continuous-delivery (updating state prevents fetch serving during transition, matching real browser behavior)

**expert-continuous-delivery**
Position: The v2 spec models the complete deployment lifecycle including the most dangerous scenario (version transition). The spec is ready for Stage 5.
Key reasoning: The three-state lifecycle correctly models SW update (skipWaiting + clients.claim). The "updating" state prevents concurrent operations during transition, matching real browser behavior where navigations queue during SW activation. Old cache purge is guaranteed by EventualCachePurge (L3). OldCachesExcludeCurrent (S8) prevents the deployment hazard of purging the active cache. Rollback is implicitly modeled as another forward VersionUpdate. The spec does not need a special rollback action because SW deployment is always forward (you deploy a new version that happens to contain old code).
Endorsed: expert-tdd (spec revision was correct to do before Stage 5), expert-edge-cases (serialization of version transitions via updating state), expert-performance (conservative cache clearing is safer for deployment analysis)

---

## Round Transcripts

### Round 1

**expert-tdd**
Position: The v2 spec is sound. All 4 gaps are properly addressed.

Reasoning: The dual-cache separation (htmlCache vs assetsCache) with distinct action sets enables correct test strategy -- different test paths for HTML SWR and asset cache-first. The tautological S1 is replaced by EventualQueueDrain (L4), a genuine liveness property that maps to "no request is silently dropped." OldCachesExcludeCurrent (S8) is a real safety invariant that can genuinely fail if VersionUpdate has a bug. The version update model covers installing -> activated -> updating -> activated with correct cache clearing, precache reset, and pending revalidation abandonment. Minor observation: clientNotified is preserved (not cleared) across version transitions, which is correct since notifications for the old version are historical. The TLC results (11,701 states, 7 safety + 4 liveness) confirm the model is sound at the checked configuration.

Objections: None

Endorsements:
- expert-edge-cases: Edge case analysis of VersionUpdate during active requests confirms queue preservation is safe
- expert-continuous-delivery: Rollback analysis confirms no special rollback action is needed

---

**expert-edge-cases**
Position: The v2 spec addresses the structural gaps and withstands systematic edge case analysis.

Reasoning: Cross-contamination between HTML and asset strategies is prevented by construction (separate action sets) and verified by NotificationsHtmlOnly and RevalidationHtmlOnly invariants. EventualQueueDrain holds because every enqueued request has at least one enabled serve action in every environment state: when network is down, offline fallback fires; when network is up, network or cache-hit actions fire. SF fairness ensures the enabled action eventually fires even under toggling. VersionUpdate during active requests: fetchQueue is preserved across the transition, and after ActivateAfterUpdate, queued requests resume with cleared caches (cache miss -> network or offline fallback). Rapid successive version updates are serialized by the "updating" state guard -- VersionUpdate requires "activated", so two updates cannot overlap. oldCaches can accumulate ({v1, v2} if v1 not yet purged when v3 arrives), but PurgeOldCaches clears the entire set atomically. The `newVersion \notin oldCaches` guard prevents cycling to a retired version.

Objections: None

Endorsements:
- expert-tdd: Test-from-spec traceability observation is correct
- expert-performance: Conservative cache-clearing is a valid abstraction for safety analysis
- expert-continuous-delivery: Deployment safety analysis of the updating state is sound

---

**expert-performance**
Position: The v2 spec correctly models the performance-critical dual-cache characteristics. No concerns.

Reasoning: AssetServeCached has no revalidation overhead -- cache hit is a direct serve. HtmlServeCachedAndRevalidate triggers background revalidation (SWR), correctly modeling fast-first-then-fresh. Both caches cleared on VersionUpdate means first request after update pays full network fetch. For assets, if the hashed URL is unchanged, the real implementation could reuse the old entry, but the spec conservatively models full cache miss. This is valid for safety analysis (models worst case). Precache reset on version update is correct since precache lists are version-specific. WF fairness on cache-hit paths (no network dependency) vs SF on network-dependent paths correctly distinguishes reliable from adversarial enablement.

Objections: None

Endorsements:
- expert-edge-cases: Every enqueued request has an enabled path in every environment state
- expert-tdd: EventualQueueDrain is meaningful and testable
- expert-continuous-delivery: Updating state prevents fetch serving during transition, matching browser queuing behavior

---

**expert-continuous-delivery**
Position: The v2 spec models the complete deployment lifecycle. Ready for Stage 5.

Reasoning: Three-state lifecycle (installing -> activated -> updating -> activated) models SW update (skipWaiting + clients.claim). The "updating" state blocks NewFetchRequest and all serve actions, matching browser behavior where navigations queue during SW activation. After ActivateAfterUpdate, normal operation resumes. Old cache purge: PurgeOldCaches requires "activated" and non-empty oldCaches; EventualCachePurge (L3) guarantees eventual cleanup. OldCachesExcludeCurrent (S8) prevents the deployment hazard of purging the active version's cache. Rollback: deploying a "rollback" means registering a new SW version with old code. The spec models this as another VersionUpdate with a different version string -- no special action needed. The spec's strengths from v1 (adversarial network/quota modeling, fairness annotations, concurrency-bounded precaching) are preserved.

Objections: None

Endorsements:
- expert-tdd: Spec revision before Stage 5 was the correct decision
- expert-edge-cases: Serialization of version transitions via updating state is well-designed
- expert-performance: Conservative cache clearing is safer for deployment correctness analysis

---

**Consensus reached after Round 1. No objections raised by any expert.**

**Session saved to:** docs/debate-moderator-sessions/2026-04-02_tla-review-service-worker-v2.md
