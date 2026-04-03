// Bump SW_VERSION to force all clients to discard old caches and
// install this new worker on their next page load.
const SW_VERSION = "b6580504";

const ASSETS_CACHE = `assets-${SW_VERSION}`;
const HTML_CACHE = `html-${SW_VERSION}`;

// The set of valid cache names for this version. Any cache key that
// isn't in this set is from an older SW version and will be deleted
// during activation.
const ALL_CACHES = new Set([ASSETS_CACHE, HTML_CACHE]);

// Pages pre-fetched and stored in HTML_CACHE at install time so they
// are available immediately on the first visit, before any navigation
// has had a chance to populate the cache organically.
const NAV_ROUTES = ["/", "/news", "/calendar", "/files", "/trustees"];

// Dedicated offline fallback page, also precached at install time.
const OFFLINE_FALLBACK = "/offline";

// Maximum number of concurrent fetch requests during install-time
// precaching. Prevents overwhelming the network on constrained devices.
const PRECACHE_CONCURRENCY = 10;

// Pre-cache NAV_ROUTES and the offline fallback page at install time
// using a concurrency-limited approach, then skip the waiting phase.
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      precacheUrls([...NAV_ROUTES, OFFLINE_FALLBACK]),
      globalThis.skipWaiting(),
    ]),
  );
});

// Fetch each URL and store the response in the HTML cache, with at most
// PRECACHE_CONCURRENCY requests in flight at once. URLs that fail are
// silently skipped — they will be cached on the next organic navigation.
async function precacheUrls(urls) {
  const cache = await caches.open(HTML_CACHE);
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        if (await cache.match(url)) continue;
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Network or cache-write failure — skip this URL.
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(PRECACHE_CONCURRENCY, urls.length) },
    () => worker(),
  );
  await Promise.allSettled(workers);
}

// Delete every cache that belongs to a previous SW version, then
// claim all open clients so this worker takes effect without requiring
// a full page reload.
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

// Route every HTTP request through the appropriate cache strategy.
// Non-HTTP requests (e.g. chrome-extension://) are ignored entirely.
// Navigation requests (full page loads) use the HTML strategy which
// includes last-modified comparison and client reload notification.
// Everything else (images, fonts, scripts, stylesheets) uses the
// cache-first asset strategy.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!new URL(request.url).protocol.startsWith("http")) return;

  if ("navigate" === request.mode) {
    event.respondWith(staleWhileRevalidateHtml(request));
  } else {
    event.respondWith(cacheFirstAsset(request));
  }
});

// Tell every controlled window client that a specific URL has fresher
// content in the cache. Each client compares the URL's pathname to its
// own location and reloads only if it is on the affected page.
async function notifyClientsToReload(url) {
  const allClients = await globalThis.clients.matchAll({ type: "window" });
  for (const client of allClients) {
    client.postMessage({ type: "CONTENT_UPDATED", url });
  }
}

// Return the cached offline fallback page. Used when both the cache and
// the network have failed for a request.
async function offlineFallback() {
  const cache = await caches.open(HTML_CACHE);
  return cache.match(OFFLINE_FALLBACK);
}

// Stale-while-revalidate for HTML navigation requests with automatic
// cache invalidation based on the Last-Modified response header.
//
// 1. Serve the cached version immediately if one exists (zero latency).
// 2. Fetch a fresh copy from the network in the background.
// 3. Compare the Last-Modified header of the network response against
//    the cached response. If they differ the content has changed:
//    update the cache and notify all clients on that page to reload.
//    If they match (or no Last-Modified header is present) update the
//    cache silently — the user already has current content.
// 4. Network failures are swallowed when a cached response was already
//    returned. If there is no cached fallback the offline page is served.
async function staleWhileRevalidateHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  const cached = await cache.match(request);

  const networkPromise = (async () => {
    let response;
    try {
      response = await fetch(request);
    } catch {
      if (cached) return;
      return offlineFallback();
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
      // Cache write failed. Still return the response below.
    }

    return response;
  })();

  return cached ?? networkPromise;
}

// Cache-first strategy for non-navigation assets (images, fonts,
// scripts, stylesheets). Non-GET requests bypass the cache entirely
// since the Cache API only supports GET.
//
// Cache hit  → return immediately, no network request.
// Cache miss → fetch from network, cache the response, return it.
// Cache miss + network failure → serve the offline fallback page.
async function cacheFirstAsset(request) {
  if ("GET" !== request.method) return fetch(request);

  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(request);
  } catch {
    return offlineFallback();
  }

  if (response.ok) {
    try {
      await cache.put(request, response.clone());
    } catch {
      // Cache write failed. Still return the response below.
    }
  }

  return response;
}
