# Service Worker for ethang-hono

**Date:** 2026-03-27
**Status:** Approved

## Overview

Add a service worker to ethang-hono that mirrors the stale-while-revalidate pattern used in sterett-hono. All pages are served from cache immediately; a background fetch compares `Last-Modified` headers and tells the client to reload if content has changed. No pre-caching — the cache builds organically on first visit.

## Architecture

### Service Worker (`public/sw.js`)

Plain JS file (not bundled). Two versioned caches:
- `assets-{SW_VERSION}` — images, scripts, stylesheets, fonts
- `html-{SW_VERSION}` — HTML navigation responses

**install** — calls `skipWaiting()` only. No pre-caching.

**activate** — deletes all caches not belonging to the current `SW_VERSION`, then calls `clients.claim()`.

**fetch** — routes requests:
- Non-HTTP (e.g. `chrome-extension://`) → ignored
- `request.mode === "navigate"` → `staleWhileRevalidateHtml(request)`
- Everything else (GET) → `staleWhileRevalidate(request, ASSETS_CACHE)`
- Non-GET → pass through to network directly

**`staleWhileRevalidateHtml`**
1. Serve cached response immediately if available.
2. Background-fetch from network.
3. Compare `Last-Modified` header of network response vs cached response.
4. If they differ: update cache, call `notifyClientsToReload(url)`.
5. If equal or absent: update cache silently.
6. Network errors swallowed when a cache hit exists; re-thrown otherwise.

**`staleWhileRevalidate`**
Standard stale-while-revalidate for assets. Serves cache immediately, updates cache from network on success.

**`notifyClientsToReload`**
Calls `clients.matchAll({ type: "window" })` and posts `{ type: "CONTENT_UPDATED", url }` to each. Client reloads only if `url.pathname === location.pathname`.

### Build Stamp (`scripts/stamp-sw.ts`)

Runs at deploy time. Two responsibilities:
1. Hashes `public/sw.js` content (excluding the version line) → writes `SW_VERSION` back into `public/sw.js`.
2. Overwrites `src/utilities/deploy-info.ts` with the current ISO timestamp:
   ```ts
   export const DEPLOY_TIME = "2026-03-27T00:00:00.000Z";
   ```
   This file is committed to git with a placeholder value and overwritten in-place at deploy time, matching how `public/sw.js` handles `SW_VERSION`.

### Last-Modified Middleware (`src/middleware/last-modified.ts`)

Identical to sterett-hono. For HTML responses only:
- Reads `<meta name="last-modified" content="...">` from the rendered body.
- Parses the value as a `Date`.
- Sets `Last-Modified: <UTC string>` on the response header.

Registered in `src/index.tsx` as a global middleware via `app.use("*", lastModifiedMiddleware)`.

### Layout Changes (`src/components/layouts/main-layout.tsx`)

Two additions to the `<body>` closing area:

1. `<meta name="last-modified" content={updatedAt}>` in `<head>` — rendered only when `updatedAt` is provided.
2. Inline `<script>` — SW registration + `CONTENT_UPDATED` reload listener:
   ```js
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', function () {
       navigator.serviceWorker.register('/sw.js');
     });
     navigator.serviceWorker.addEventListener('message', function (event) {
       if (event.data && event.data.type === 'CONTENT_UPDATED') {
         var updatedUrl = new URL(event.data.url);
         if (updatedUrl.pathname === location.pathname) {
           location.reload();
         }
       }
     });
   }
   ```

## Route Wiring

Each route passes an `updatedAt` value to `MainLayout` (or `BlogLayout`):

| Route | Source of `updatedAt` |
|-------|-----------------------|
| `/` | `DEPLOY_TIME` |
| `/sign-in` | `DEPLOY_TIME` |
| `/tips` | `DEPLOY_TIME` |
| `/tips/scrollbar-gutter` | `DEPLOY_TIME` |
| `/tips/scroll-containers` | `DEPLOY_TIME` |
| `/blog` | Max `updatedAt` across all fetched blog posts |
| `/blog/:slug` | That post's `updatedAt` |
| `/courses` | Most recent `updatedAt` across fetched course items |

## Deploy Script Change (`package.json`)

```
"deploy": "bun ./build.ts && bun scripts/stamp-sw.ts && wrangler deploy --minify"
```

`stamp-sw.ts` runs after `build.ts` so all client scripts are already written before the SW version is hashed.

## Files Created / Modified

| File | Action |
|------|--------|
| `public/sw.js` | Create |
| `scripts/stamp-sw.ts` | Create |
| `src/middleware/last-modified.ts` | Create |
| `src/utilities/deploy-info.ts` | Create with placeholder; overwritten at deploy time |
| `src/components/layouts/main-layout.tsx` | Modify — add meta tag + SW script |
| `src/index.tsx` | Modify — register middleware |
| `package.json` | Modify — update deploy script |

## Out of Scope

- Pre-caching of nav routes (can be added later)
- Push notifications
- Background sync
