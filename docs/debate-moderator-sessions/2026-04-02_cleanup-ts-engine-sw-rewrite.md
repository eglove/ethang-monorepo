# Debate Session — cleanup-ts-engine-sw-rewrite

## Metadata

- **Date:** 2026-04-02
- **Topic:** Three cleanup tasks: TS Pipeline removal, Bun CLI refs (no-op), Service Worker rewrite
- **Experts:** expert-tdd, expert-edge-cases, expert-performance, expert-continuous-delivery
- **Rounds:** 2
- **Result:** CONSENSUS REACHED

---

## Synthesis

### Agreed Recommendation

**Task 1 (TS Pipeline Removal):** The deletion scope is correct and safe. No external package imports from `@ethang/design-pipeline`. The skill-tests directory has zero imports from engine/, state-machine/, or contracts/. The deletion should be executed as a single atomic commit that removes engine/, state-machine/, contracts/, bin.ts, and index.ts, cleans up package.json (remove bin field, dead scripts, unused deps), and verifies vitest coverage thresholds recalculate correctly with autoUpdate:true. The package.json exports wildcard should be reviewed since the remaining code is only test files.

**Task 2 (Bun CLI References):** Confirmed no-op. No action required.

**Task 3 (Service Worker Rewrite):** The rewrite should follow these agreed principles:

1. **Architecture:** Extract core logic (stale-while-revalidate, Last-Modified comparison, client notification) into pure testable functions. Event listeners become thin wiring that delegates to these functions. This enables TDD without heavyweight SW global mocking.

2. **Preserve dual-cache strategy:** Keep separate HTML_CACHE and ASSETS_CACHE. This allows different handling for navigation vs. asset requests and is a sound performance pattern.

3. **Preserve behavioral requirements:** Stale-while-revalidate, Last-Modified comparison, CONTENT_UPDATED message, PRECACHE_LINKS (ethang-hono), NAV_ROUTES precache (sterett-hono), stamp-sw.ts SHA versioning.

4. **Error handling improvements:**
   - Add an offline fallback page for the case where both cache and network are unavailable (precached at install time)
   - Maintain current pattern: swallow network failures when cached response was already served, propagate when no cache exists
   - Isolate cache.put in try/catch to handle storage quota exceeded

5. **Cache management:**
   - Add a concurrency limit to precacheLinks (e.g., 10 concurrent fetches) to avoid bandwidth contention on slow connections
   - Consider a max-entries eviction strategy for ASSETS_CACHE to prevent unbounded growth on storage-constrained devices
   - Document the redirect behavior in precacheLinks as a known characteristic

6. **Cache versioning:** Preserve SW_VERSION + stamp-sw.ts mechanism exactly. Version-keyed cache names with old cache purge in activate event.

7. **Precaching approaches remain app-specific:** ethang-hono uses client-driven PRECACHE_LINKS (appropriate for a content site with dynamic links). sterett-hono uses predefined NAV_ROUTES at install time (appropriate for a site with fixed navigation). No unification needed.

8. **Known limitation:** Document the race condition on rapid concurrent navigations to the same URL (two cache.put calls can interleave). Practical impact is low (worst case: briefly stale content).

9. **Deployment checklist:**
   - Verify Hono servers set `Cache-Control: no-cache` for `/sw.js` requests
   - Task 1 and Task 3 should be separate commits/PRs for independent rollback
   - The stamp-sw.ts integration must be preserved in the rewrite

10. **Test strategy:** Write tests before the rewrite. Minimum test surface: stale-while-revalidate logic, Last-Modified comparison, client notification triggering, offline fallback, precacheLinks with various fetch outcomes (ok, error, redirect, empty array).

---

### Expert Final Positions

**expert-tdd**
Position: Both tasks are sound. Task 1 is safe to execute with vitest config verification. Task 3 must be rewritten with a testability-first architecture (pure functions + thin event listener wiring).
Key reasoning: The current SW code is untestable in isolation. Extracting logic into pure functions enables red-green-refactor. The rewrite must have a test plan before implementation begins. Each task should be a separate commit with its own passing test suite.
Endorsed: expert-edge-cases (race condition is testable, offline fallback is testable behavior), expert-continuous-delivery (separate commits)

**expert-edge-cases**
Position: Task 1 deletion scope is safe. Task 3 has several edge cases that the rewrite must address: race conditions on rapid navigations, unbounded cache size, redirect behavior in precacheLinks, missing offline fallback.
Key reasoning: The most serious unhandled cases are cache overflow on mobile and the lack of an offline fallback page. The race condition on concurrent cache.put is low-impact but should be documented. The redirect handling in precacheLinks should be explicitly documented.
Endorsed: expert-tdd (pure function extraction), expert-performance (dual-cache strategy), expert-continuous-delivery (separate commits)

**expert-performance**
Position: Task 1 is a net performance positive. Task 3's caching architecture is sound. Two improvements: concurrency limit on precacheLinks and cache size bounds.
Key reasoning: The stale-while-revalidate pattern is optimal for perceived performance. The precacheLinks burst on pages with many links could compete with user navigation on slow connections. Pure function extraction has negligible performance overhead. Cache-control headers for sw.js are critical for update propagation.
Endorsed: expert-tdd (pure function architecture), expert-edge-cases (offline fallback, cache overflow), expert-continuous-delivery (separate commits, cache-control headers)

**expert-continuous-delivery**
Position: Both tasks are independently deployable and low-risk. Separate commits for Task 1 and Task 3. Verify server cache-control headers for sw.js. Preserve stamp-sw.ts mechanism.
Key reasoning: The skipWaiting + clients.claim pattern is aggressive but correct for content sites. The stamp-sw.ts SHA mechanism is the deployment versioning strategy and must be preserved. The offline fallback page, if added, must be precached during install.
Endorsed: expert-tdd (test strategy first), expert-edge-cases (offline fallback is a deployment concern), expert-performance (concurrency limit, cache-control)

---

## Round Transcripts

### Round 1

**expert-tdd**
Position: Both tasks are sound in scope, but Task 1 carries a hidden test-suite risk and Task 3 demands a testability-first rewrite architecture.

Reasoning: For Task 1, the deletion scope is correct. skill-tests has zero imports from deleted directories. However, index.ts re-exports everything and package.json has a wildcard exports field. After deletion, package.json must be cleaned. Vitest coverage thresholds may be affected. For Task 3, the current SW code is untestable. The rewrite should extract core logic into pure functions with event listeners as thin wiring.

Objections:
- Vitest config may break after deletion if coverage thresholds reference deleted source
- Rewrite needs a test strategy before implementation begins

Endorsements: None

---

**expert-edge-cases**
Position: Deletion scope for Task 1 appears safe with one unexplored dependency path. SW rewrite has several unhandled edge cases.

Reasoning: The wildcard exports field in package.json is a risk for tools that pre-resolve paths. Rapid navigation race conditions can cause interleaved cache.put calls. precacheLinks does not handle redirects explicitly. Neither SW sets cache size limits. No offline fallback page exists.

Objections:
- Unbounded caching on mobile is a real risk
- Redirect handling in precacheLinks needs explicit documentation
- Rewrite should add an offline fallback page

Endorsements: None

---

**expert-performance**
Position: Task 1 is a net performance positive. Task 3's caching architecture is sound with optimization opportunities.

Reasoning: Less source code means faster CI. The stale-while-revalidate pattern is optimal for perceived performance. precacheLinks can burst dozens of fetches in parallel. The dual-cache strategy (HTML vs ASSETS) is a good pattern.

Objections:
- precacheLinks has no concurrency limit
- Cache storage is unbounded

Endorsements: None

---

**expert-continuous-delivery**
Position: Both tasks are independently deployable and low-risk. SW rewrite needs careful cache versioning.

Reasoning: No downstream consumers of @ethang/design-pipeline. Deletion is a single atomic commit with trivial rollback. stamp-sw.ts SHA mechanism is critical for SW deployment. skipWaiting + clients.claim is correct for content sites. Server must serve sw.js with appropriate cache-control headers.

Objections:
- Server cache-control headers for sw.js must be verified
- Task 1 and Task 3 should be separate commits

Endorsements: None

### Round 2

**expert-tdd**
Position: Unchanged. Endorsed expert-edge-cases (race condition is testable, offline fallback is testable behavior), expert-continuous-delivery (separate commits).

No new objections.

---

**expert-edge-cases**
Position: Unchanged. Endorsed expert-tdd (pure function extraction), expert-performance (dual-cache strategy), expert-continuous-delivery (separate commits).

No new objections.

---

**expert-performance**
Position: Unchanged. Endorsed expert-tdd (pure function architecture has negligible overhead), expert-edge-cases (offline fallback, cache overflow), expert-continuous-delivery (cache-control headers).

No new objections.

---

**expert-continuous-delivery**
Position: Unchanged. Endorsed expert-tdd (test strategy first), expert-edge-cases (offline fallback is deployment concern), expert-performance (concurrency limit, cache-control).

No new objections.

---

**Consensus reached after Round 2. No new objections in Round 2.**
