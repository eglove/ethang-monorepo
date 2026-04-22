import { BroadcastUpdatePlugin } from "workbox-broadcast-update";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

const SW_VERSION = process.env["SW_VERSION"] ?? "v1";
const ASSETS_CACHE = `assets-${SW_VERSION}`;
const HTML_CACHE = `html-${SW_VERSION}`;

self.skipWaiting();
clientsClaim();

// Cleanup old caches
self.addEventListener("activate", (event) => {
  const ALL_CACHES = new Set([ASSETS_CACHE, HTML_CACHE]);

  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !ALL_CACHES.has(cacheName))
          .map(async (cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});

// Route 1: HTML Navigations
registerRoute(
  ({ request }) => "navigate" === request.mode,
  new StaleWhileRevalidate({
    cacheName: HTML_CACHE,
    plugins: [
      new BroadcastUpdatePlugin({
        headersToCheck: ["etag", "last-modified"],
      }),
    ],
  }),
);

// Route 2: GET Assets
registerRoute(
  ({ request }) => "GET" === request.method && "navigate" !== request.mode,
  new StaleWhileRevalidate({
    cacheName: ASSETS_CACHE,
  }),
);

// Custom: Pre-cache Links
self.addEventListener("message", (event) => {
  if ("PRECACHE_LINKS" === event.data?.type) {
    const { urls } = event.data;
    event.waitUntil(
      caches.open(HTML_CACHE).then(async (cache) => {
        return cache.addAll(urls);
      }),
    );
  }
});
