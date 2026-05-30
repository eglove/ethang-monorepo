import filter from "lodash/filter.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import map from "lodash/map.js";
import { BroadcastUpdatePlugin } from "workbox-broadcast-update";
import { clientsClaim } from "workbox-core";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

const SW_VERSION = process.env["SW_VERSION"] ?? "v1";
const ASSETS_CACHE = `assets-${SW_VERSION}`;
const HTML_CACHE = `html-${SW_VERSION}`;

// eslint-disable-next-line @typescript-eslint/no-floating-promises
self.skipWaiting();
clientsClaim();

// Cleanup old caches
self.addEventListener("activate", (event) => {
  const ALL_CACHES = new Set([ASSETS_CACHE, HTML_CACHE]);

  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      return Promise.all(
        map(
          filter(cacheNames, (cacheName) => {
            return !ALL_CACHES.has(cacheName);
          }),
          async (cacheName) => {
            return caches.delete(cacheName);
          }
        )
      );
    })
  );
});

// Route 1: HTML Navigations
registerRoute(
  ({ request }) => {
    return "navigate" === request.mode;
  },
  new StaleWhileRevalidate({
    cacheName: HTML_CACHE,
    plugins: [
      new BroadcastUpdatePlugin({
        headersToCheck: ["etag", "last-modified"]
      })
    ]
  })
);

// Route 2: GET Assets
registerRoute(
  ({ request }) => {
    return "GET" === request.method && "navigate" !== request.mode;
  },
  new StaleWhileRevalidate({
    cacheName: ASSETS_CACHE
  })
);

// Custom: Pre-cache Links
self.addEventListener("message", (event) => {
  const data = event.data as unknown;
  const isDataObject = !isNil(data) && isObject(data);

  if (!isDataObject) {
    return;
  }

  const isPrecache = "type" in data && "PRECACHE_LINKS" === data.type;
  const hasUrls = "urls" in data && isArray(data.urls);

  if (isPrecache && hasUrls) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const urls = data.urls as string[];
    event.waitUntil(
      caches.open(HTML_CACHE).then(async (cache) => {
        return cache.addAll(urls);
      })
    );
  }
});
