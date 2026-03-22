// Bump SW_VERSION to force all clients to discard old caches and
// install this new worker on their next page load.
const SW_VERSION = "80afdbdf";

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

// Pre-cache the nav routes and skip the waiting phase atomically.
// Both are inside Promise.all so if cache.addAll fails the install
// fails cleanly rather than leaving a partially-installed worker.
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(HTML_CACHE).then((cache) => cache.addAll(NAV_ROUTES)),
      globalThis.skipWaiting(),
    ]),
  );
});

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
// generic assets strategy.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!new URL(request.url).protocol.startsWith("http")) return;

  if ("navigate" === request.mode) {
    event.respondWith(staleWhileRevalidateHtml(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
  }
});

// Pull the ISO datetime string out of <meta name="last-modified">
// in the raw HTML. Returns null if the tag is absent, which causes
// the caller to skip the comparison and just update the cache silently.
function extractLastModified(html) {
  const match = html.match(/<meta[^>]+name="last-modified"[^>]*>/i);
  if (!match) return null;
  const contentMatch = match[0].match(/content="([^"]+)"/i);
  return contentMatch ? contentMatch[1] : null;
}

// Build a clean Headers object for responses reconstructed from decoded
// text. Content-Encoding and Content-Length must be removed because the
// fetch API decodes the body before exposing it to JS — re-attaching a
// compression header to already-decoded text would cause the browser to
// attempt decompression a second time, producing garbage output.
function decodedHeaders(headers) {
  const copy = new Headers(headers);
  copy.delete("Content-Encoding");
  copy.delete("Content-Length");
  return copy;
}

// Tell every controlled window client that a specific URL has fresher
// content in the cache. Each client compares the URL's pathname to its
// own location and reloads only if it is on the affected page.
async function notifyClientsToReload(url) {
  const allClients = await globalThis.clients.matchAll({ type: "window" });
  for (const client of allClients) {
    client.postMessage({ type: "CONTENT_UPDATED", url });
  }
}

// Stale-while-revalidate for HTML navigation requests with automatic
// cache invalidation based on the page's last-modified meta tag.
//
// 1. Serve the cached version immediately if one exists (zero latency).
// 2. Fetch a fresh copy from the network in the background.
// 3. Read the response body as text so we can inspect the last-modified
//    value without consuming the response that will be stored.
// 4. Compare the network last-modified against the cached last-modified.
//    If they differ the content has changed: update the cache and notify
//    all clients on that page to reload so they see the new content.
//    If they match (or no last-modified is present) update the cache
//    silently — the user already has current content.
// 5. Cache writes are isolated in a try/catch so a storage failure
//    (e.g. quota exceeded) does not prevent the response from being
//    delivered to the browser.
// 6. Network failures are swallowed when a cached response was already
//    returned, since the user is already being served. If there is no
//    cached fallback the error is re-thrown so the browser surfaces a
//    real network error rather than hanging.
async function staleWhileRevalidateHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  const cached = await cache.match(request);
  // Clone before returning: once cached is handed to the browser its
  // body stream is consumed, so we need an independent copy to read
  // later when comparing last-modified values.
  const cachedClone = cached?.clone();

  const networkPromise = (async () => {
    let response;
    try {
      response = await fetch(request);
    } catch (error) {
      if (cached) return;
      throw error;
    }

    if (!response.ok) return response;

    const text = await response.text();
    const networkLastModified = extractLastModified(text);
    const headers = decodedHeaders(response.headers);
    const responseToCache = new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

    try {
      if (networkLastModified && cachedClone) {
        const cachedLastModified = extractLastModified(await cachedClone.text());
        await cache.put(request, responseToCache.clone());
        if (cachedLastModified !== networkLastModified) {
          await notifyClientsToReload(request.url);
        }
      } else {
        await cache.put(request, responseToCache.clone());
      }
    } catch {
      // Cache write failed. Still return the response below.
    }

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  })();

  return cached ?? networkPromise;
}

// Stale-while-revalidate for all other GET assets (images, fonts,
// scripts, stylesheets). Non-GET requests bypass the cache entirely
// since the Cache API only supports GET.
//
// Serve from cache immediately if available, fetch from the network
// in the background, and update the cache on success. Cache writes are
// isolated so a storage failure does not prevent the response from
// being delivered.
async function staleWhileRevalidate(request, cacheName) {
  if ("GET" !== request.method) return fetch(request);

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = (async () => {
    let response;
    try {
      response = await fetch(request);
    } catch (error) {
      if (cached) return;
      throw error;
    }
    if (response.ok) {
      try {
        await cache.put(request, response.clone());
      } catch {
        // Cache write failed. Still return the response below.
      }
    }
    return response;
  })();
  return cached ?? networkPromise;
}
