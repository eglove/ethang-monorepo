const SW_VERSION = "375ed1c6";

const STATIC_CACHE = `static-${SW_VERSION}`;
const IMAGE_CACHE = `images-${SW_VERSION}`;
const SANITY_CACHE = `sanity-${SW_VERSION}`;
const HTML_CACHE = `html-${SW_VERSION}`;

const ALL_CACHES = new Set([
  HTML_CACHE,
  IMAGE_CACHE,
  SANITY_CACHE,
  STATIC_CACHE,
]);

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

  // Sanity CDN images
  if ("cdn.sanity.io" === url.hostname) {
    event.respondWith(staleWhileRevalidate(request, SANITY_CACHE));
    return;
  }

  const { pathname } = url;

  // JS / CSS
  if (/\.(js|css)$/.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Images
  if (/\.(png|jpe?g|svg|gif|ico|webp)$/.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // HTML / navigation
  if ("navigate" === request.mode || pathname.endsWith(".html")) {
    event.respondWith(staleWhileRevalidate(request, HTML_CACHE));
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached ?? networkPromise;
}
