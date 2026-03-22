const STATIC_CACHE = "static-resources-v1";
const IMAGE_CACHE = "image-cache-v1";
const SANITY_CACHE = "sanity-image-cache-v1";
const HTML_CACHE = "html-cache-v1";

const ALL_CACHES = new Set([
  HTML_CACHE,
  IMAGE_CACHE,
  SANITY_CACHE,
  STATIC_CACHE,
]);

const IMAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day
const IMAGE_MAX_ENTRIES = 50;
const SANITY_MAX_ENTRIES = 100;

const NAV_ROUTES = ["/", "/news", "/calendar", "/files", "/trustees"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(HTML_CACHE).then((cache) => cache.addAll(NAV_ROUTES)),
  );
  globalThis.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle http(s) requests
  if (!url.protocol.startsWith("http")) return;

  // Sanity CDN images — CacheFirst, 30 days, 100 entries
  if ("cdn.sanity.io" === url.hostname) {
    event.respondWith(cacheFirst(request, SANITY_CACHE, SANITY_MAX_ENTRIES));
    return;
  }

  // Local static assets
  const { pathname } = url;

  // JS / CSS — StaleWhileRevalidate
  if (/\.(js|css)$/.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Images — CacheFirst, 30 days, 50 entries
  if (/\.(png|jpe?g|svg|gif|ico|webp)$/.test(pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_MAX_ENTRIES));
    return;
  }

  // HTML / navigation — NetworkFirst
  if ("navigate" === request.mode || pathname.endsWith(".html")) {
    event.respondWith(networkFirst(request, HTML_CACHE));
  }
});

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedDate = cached.headers.get("date");
    const age = cachedDate ? Date.now() - new Date(cachedDate).getTime() : Infinity;
    if (age < IMAGE_MAX_AGE_MS) return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await trimCache(cache, maxEntries);
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("Network error and no cached response available");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached ?? networkPromise;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)),
    );
  }
}
