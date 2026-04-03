// Bump SW_VERSION to force all clients to discard old caches and
// install this new worker on their next page load.
const SW_VERSION = "5fe6e3b4";

const ASSETS_CACHE = `assets-${SW_VERSION}`;
const HTML_CACHE = `html-${SW_VERSION}`;

// The set of valid cache names for this version. Any cache key that
// isn't in this set is from an older SW version and will be deleted
// during activation.
const ALL_CACHES = new Set([ASSETS_CACHE, HTML_CACHE]);

// Path served as a fallback when both cache and network are unavailable.
const OFFLINE_PATH = "/offline";

// Maximum number of concurrent fetches during link precaching.
const PRECACHE_CONCURRENCY = 10;

// ---------------------------------------------------------------------------
// Install: precache the offline fallback page and activate immediately.
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(HTML_CACHE)
      .then((cache) => cache.add(OFFLINE_PATH))
      .then(() => globalThis.skipWaiting()),
  );
});

// ---------------------------------------------------------------------------
// Message: receive a list of same-origin URLs from a controlled page and
// cache any that are not already in the HTML cache. Already-cached URLs
// are skipped so repeat navigations don't cause redundant fetches.
// Concurrent fetches are capped at PRECACHE_CONCURRENCY.
// ---------------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data?.type === "PRECACHE_LINKS") {
    event.waitUntil(precacheLinks(event.data.urls));
  }
});

// ---------------------------------------------------------------------------
// Activate: delete every cache that belongs to a previous SW version,
// then claim all open clients so this worker takes effect without
// requiring a full page reload.
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then(async (keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.has(key))
            .map(async (key) => caches.delete(key)),
        ),
      )
      .then(() => globalThis.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch: route every HTTP request through the appropriate cache strategy.
// Non-HTTP requests (e.g. chrome-extension://) are ignored entirely.
// Navigation requests use HTML SWR with last-modified comparison.
// Everything else uses cache-first for immutable hashed assets.
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!new URL(request.url).protocol.startsWith("http")) return;

  if ("navigate" === request.mode) {
    event.respondWith(staleWhileRevalidateHtml(request));
  } else {
    event.respondWith(cacheFirstAsset(request));
  }
});

// ---------------------------------------------------------------------------
// Helper: notify all controlled window clients that a specific URL has
// fresher content in the cache. Each client compares the URL's pathname
// to its own location and reloads only if it is on the affected page.
// ---------------------------------------------------------------------------
async function notifyClientsToReload(url) {
  const allClients = await globalThis.clients.matchAll({ type: "window" });
  for (const client of allClients) {
    client.postMessage({ type: "CONTENT_UPDATED", url });
  }
}

// ---------------------------------------------------------------------------
// Strategy: stale-while-revalidate for HTML navigation requests with
// automatic cache invalidation based on the Last-Modified header.
//
// 1. Serve the cached version immediately if one exists (zero latency).
// 2. Fetch a fresh copy from the network in the background.
// 3. Compare Last-Modified headers — if they differ the content changed:
//    update the cache and notify all clients on that page to reload.
//    If they match (or no header present) update the cache silently.
// 4. Network failures are swallowed when a cached response was already
//    returned. If there is no cached fallback the offline page is served.
// ---------------------------------------------------------------------------
async function staleWhileRevalidateHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  const cached = await cache.match(request);

  const networkPromise = (async () => {
    let response;
    try {
      response = await fetch(request);
    } catch {
      // Network is down. If we already returned a cached response the
      // caller doesn't need this promise's value. Otherwise serve the
      // offline fallback page.
      if (cached) return;
      return cache.match(OFFLINE_PATH);
    }

    if (!response.ok) return response;

    const networkLastModified = response.headers.get("last-modified");

    try {
      await cache.put(request, response.clone());
      if (networkLastModified && cached) {
        const cachedLastModified = cached.headers.get("last-modified");
        if (cachedLastModified !== networkLastModified) {
          await notifyClientsToReload(request.url);
        }
      }
    } catch {
      // Cache write failed (e.g. quota exceeded). Still return the
      // network response — never prevent response delivery.
    }

    return response;
  })();

  return cached ?? networkPromise;
}

// ---------------------------------------------------------------------------
// Strategy: cache-first for immutable hashed assets (images, fonts,
// scripts, stylesheets). Once cached, assets are served directly without
// any background revalidation — hashed filenames guarantee immutability.
//
// Cache hit  → return immediately, no network request.
// Cache miss → fetch from network, cache it, return it.
// Cache miss + offline → serve the offline fallback page.
// Non-GET requests bypass the cache entirely since the Cache API only
// supports GET.
// ---------------------------------------------------------------------------
async function cacheFirstAsset(request) {
  if ("GET" !== request.method) return fetch(request);

  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  // Cache miss — fetch from the network.
  let response;
  try {
    response = await fetch(request);
  } catch {
    // Network is down and nothing is cached. Serve the offline fallback.
    const offlineResponse = await caches.match(OFFLINE_PATH);
    if (offlineResponse) return offlineResponse;
    // If even the offline page is missing, let the error propagate.
    throw new Error("Network unavailable and no offline fallback cached");
  }

  if (response.ok) {
    try {
      await cache.put(request, response.clone());
    } catch {
      // Cache write failed (e.g. quota exceeded). Still return the
      // network response below.
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Precache: fetch and cache a list of URLs with bounded concurrency.
// Maintains a pool of at most PRECACHE_CONCURRENCY active fetches.
// Already-cached URLs are skipped. Failed fetches do not block others.
// ---------------------------------------------------------------------------
async function precacheLinks(urls) {
  const cache = await caches.open(HTML_CACHE);
  let activeCount = 0;
  let index = 0;

  return new Promise((resolve) => {
    function startNext() {
      // All URLs dispatched and all in-flight requests completed.
      if (index >= urls.length && activeCount === 0) {
        resolve();
        return;
      }

      // Dispatch as many fetches as the pool allows.
      while (index < urls.length && activeCount < PRECACHE_CONCURRENCY) {
        const url = urls[index];
        index += 1;
        activeCount += 1;

        (async () => {
          try {
            if (await cache.match(url)) return;
            const response = await fetch(url);
            if (response.ok) {
              try {
                await cache.put(url, response);
              } catch {
                // Cache write failed — swallow and continue.
              }
            }
          } catch {
            // Fetch failed — swallow and continue (same as allSettled).
          } finally {
            activeCount -= 1;
            startNext();
          }
        })();
      }
    }

    startNext();
  });
}
