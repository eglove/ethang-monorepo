# Debate Session — tla-review-service-worker

## Metadata

- **Date:** 2026-04-02
- **Topic:** TLA+ Review of ServiceWorker.tla against Stage 2 design consensus
- **Experts:** expert-tdd, expert-edge-cases, expert-performance, expert-continuous-delivery
- **Rounds:** 2
- **Result:** CONSENSUS REACHED

---

## Synthesis

### Agreed Recommendation

The TLA+ specification (ServiceWorker.tla) is a solid foundation that correctly models several critical aspects of the service worker design: stale-while-revalidate flow, adversarial network/quota toggling, concurrency-bounded precaching, offline fallback serving, CONTENT_UPDATED notification constraints, cache versioning with old-cache purge, and strong fairness annotations for liveness under adversarial conditions.

However, the spec has **four gaps** that must be addressed before proceeding to Stage 5 (Implementation Planning):

1. **Single cache vs dual cache (HIGH priority):** The spec models a single `cache` variable, contradicting consensus item 2 (preserve dual-cache: HTML_CACHE vs ASSETS_CACHE). The design requires different strategies per request type: HTML uses SWR with revalidation and notification; assets use cache-first with immutability (hashed filenames, no revalidation). The current spec applies SWR to all requests, misrepresenting the system. **Fix:** Split into two cache variables (htmlCache, assetsCache) with distinct action sets.

2. **Safety property S1 is a tautology (HIGH priority):** `ClientAlwaysGetsResponse` asserts `r \notin clientResponses \/ r \in (clientResponses \cup offlineFallbacks)`. This is logically equivalent to TRUE and cannot fail. TLC passes it trivially, providing false confidence. **Fix:** Replace with a meaningful liveness property: every request that enters fetchQueue eventually appears in clientResponses. Alternatively, model it as an invariant that no request remains in fetchQueue indefinitely without being served.

3. **Safety property S3 is trivially true (MEDIUM priority):** `OldCachesEventuallyEmpty` asserts `swState = "activated" => oldCaches \subseteq CacheVersions`, which is already guaranteed by the type invariant. The useful property is the liveness property `EventualCachePurge`, which does verify eventual cleanup. **Fix:** Remove S3 or replace it with a meaningful safety invariant (e.g., no action serves from oldCaches).

4. **Version update flow not modeled (MEDIUM priority):** The spec models a single SW lifecycle (installing -> activated) but not the deployment transition where a new SW version replaces an old one (skipWaiting + clients.claim). This is the most dangerous deployment scenario. **Fix:** Add a `VersionUpdate` action that models a new version activating while the old one's caches still exist, and verify that old caches are purged correctly.

**Additional gaps noted (LOW priority, addressable but not blocking):**

5. **Last-Modified comparison not modeled:** RevalidateChanged/RevalidateUnchanged are non-deterministic rather than conditional on header state. Acceptable as an abstraction but reduces spec-to-test traceability.

6. **Install-time precaching of offline fallback not modeled:** Consensus item 4 requires the offline fallback page to be precached during installation. The spec's Activate action does not model this.

7. **FIFO fetchQueue does not model real fetch event concurrency:** Real SW fetch events are handled independently, not serialized. The FIFO model may miss interleavings.

8. **Max-entries eviction not modeled:** Consensus item 6 mentions considering eviction for ASSETS_CACHE. A formal spec is the right place to verify eviction safety.

9. **RequestId uniqueness limits repeated-request modeling:** Each RequestId is used at most once, so the spec cannot model the same URL being requested multiple times.

---

### Expert Final Positions

**expert-tdd**
Position: The spec has meaningful gaps that would cause a test suite built from it to inherit false positives (S1 tautology) and miss critical behavioral distinctions (single cache). Spec revision should precede Stage 5.
Key reasoning: The dual-cache gap means tests would apply SWR to assets (wrong). The S1 tautology means "every request gets a response" is unverified. The Last-Modified comparison is not formally captured. A test strategy built on this spec would be unsound.
Endorsed: expert-edge-cases (S1 tautology analysis), expert-continuous-delivery (version update flow), expert-performance (immutable-asset observation)

**expert-edge-cases**
Position: The spec handles many failure modes correctly but has a tautological safety property and structural gaps. S1 is the highest-priority fix.
Key reasoning: S1 cannot fail and gives false confidence. The single-cache model cannot distinguish HTML vs asset edge cases. Install-time precaching failure is not modeled. The FIFO queue combined with single-use RequestIds limits the model's ability to find repeated-request edge cases.
Endorsed: expert-tdd (test-from-spec risk), expert-performance (immutable-asset rationale), expert-continuous-delivery (version transition edge case)

**expert-performance**
Position: The spec captures the performance-relevant patterns (SWR, concurrency bounding, quota handling) but loses the immutable-asset optimization that is the performance rationale for dual-cache.
Key reasoning: Assets with hashed filenames are immutable by URL and never need revalidation. The spec models revalidation for all requests, misrepresenting the real system's performance characteristics. Max-entries eviction is unmodeled.
Endorsed: expert-edge-cases (S1 tautology), expert-tdd (test-from-spec risk), expert-continuous-delivery (version transition affects cache performance)

**expert-continuous-delivery**
Position: The spec captures lifecycle transitions and cache versioning well but cannot verify the most dangerous deployment scenario (version transition).
Key reasoning: The spec models a single lifecycle (installing -> activated) but not skipWaiting + clients.claim replacing an active SW. The old-cache purge is modeled but only within a single lifecycle. S3 adds nothing beyond the type invariant. The spec's strengths (adversarial modeling, fairness annotations) should be preserved in revision.
Endorsed: expert-edge-cases (S1 is highest priority), expert-tdd (spec revision before Stage 5), expert-performance (dual-cache for deployment correctness)

---

## Round Transcripts

### Round 1

**expert-tdd**
Position: The spec captures major behavioral flows but has gaps that undermine test-to-spec traceability and contradict the design consensus.

Reasoning: The consensus explicitly calls for a dual-cache strategy (item 2: separate HTML_CACHE vs ASSETS_CACHE), and the spec models only a single cache variable. This means the spec cannot distinguish navigation requests from asset requests. The SWR behavior should only apply to HTML navigations; assets use a different strategy. The spec also lacks any model of the Last-Modified comparison (consensus item 3). The race condition on rapid navigations (consensus item 9) is excluded by the model guard rather than formally explored.

Objections:
- Single cache contradicts consensus item 2 (dual-cache: HTML_CACHE vs ASSETS_CACHE)
- Last-Modified comparison logic is not modeled
- Race condition on rapid navigations is excluded rather than explored

Endorsements: None

---

**expert-edge-cases**
Position: The spec handles several failure modes well but misses important edge cases and has a concerning safety property that is tautologically true.

Reasoning: S1 (ClientAlwaysGetsResponse) is logically equivalent to TRUE -- both disjuncts are always satisfied. This property verifies nothing. Installation failure is not modeled; the spec assumes Activate always succeeds. The FIFO fetchQueue does not model real SW fetch event concurrency. Max-entries eviction (consensus item 6) is not modeled. The combination of FIFO + single-use RequestIds means the spec models at most MaxRequests total requests over the system lifetime.

Objections:
- S1 (ClientAlwaysGetsResponse) is a tautology and verifies nothing
- Install-time precaching of offline fallback page is not modeled (consensus item 4)
- FIFO fetchQueue misrepresents real fetch event concurrency

Endorsements: None

---

**expert-performance**
Position: The spec captures performance-relevant patterns but the single-cache abstraction loses the performance rationale for dual-cache.

Reasoning: SWR is correctly modeled and is the core performance win. Concurrency limit on precaching maps to consensus item 5. Quota handling covers storage-constrained devices. However, the dual-cache design exists because assets are immutable by URL (hashed filenames) and never need revalidation. The spec applies SWR to all requests, misrepresenting performance characteristics. Max-entries eviction is not modeled. The FIFO queue understates real concurrency.

Objections:
- Single cache loses the immutable-asset optimization (consensus item 2)
- Max-entries eviction not modeled (speculative but significant for a formal spec)

Endorsements: None

---

**expert-continuous-delivery**
Position: The spec captures deployment-relevant lifecycle transitions but does not model the version update flow.

Reasoning: Activate and PurgeOldCaches correctly model the SW lifecycle. CacheVersions with currentVersion and oldCaches captures version-keyed cache names. EventualCachePurge ensures old caches are cleaned up. However, the spec does not model what happens when a new SW version is registered while the old one is active (skipWaiting + clients.claim). S3 (OldCachesEventuallyEmpty) only asserts oldCaches is a subset of CacheVersions, which is trivially true by the type invariant.

Objections:
- SW version update flow (skipWaiting + clients.claim) is not modeled
- S3 is trivially true and adds nothing beyond TypeOK

Endorsements: None

---

### Round 2

**expert-tdd**
Position: Unchanged. The spec has meaningful gaps corroborated by all experts.

No new objections.

Endorsements:
- expert-edge-cases: S1 tautology analysis is precise and critical
- expert-continuous-delivery: Version update flow gap is important for deployment safety
- expert-performance: Immutable-asset observation strengthens the dual-cache argument

---

**expert-edge-cases**
Position: Unchanged. Findings confirmed by all experts.

No new objections. Clarification: FIFO + single-use RequestIds means at most MaxRequests total requests over system lifetime, missing repeated-request edge cases.

Endorsements:
- expert-tdd: Test strategy impact analysis is the right framing
- expert-performance: Immutable-asset observation is strongest argument for dual-cache
- expert-continuous-delivery: Version transition gap is genuine deployment edge case

---

**expert-performance**
Position: Unchanged. Consensus forming around dual-cache, S1, and version update flow.

No new objections.

Endorsements:
- expert-edge-cases: S1 tautology is most actionable finding
- expert-tdd: Test-from-spec risk analysis connects spec quality to implementation quality
- expert-continuous-delivery: Version transition affects both deployment safety and cache performance

---

**expert-continuous-delivery**
Position: Unchanged. Spec is solid foundation with specific addressable gaps.

No new objections.

Endorsements:
- expert-edge-cases: S1 tautology is highest-priority finding
- expert-tdd: Spec revision should precede Stage 5
- expert-performance: Dual-cache performance rationale makes gap concrete and actionable

---

**Consensus reached after Round 2. No new objections in Round 2.**
