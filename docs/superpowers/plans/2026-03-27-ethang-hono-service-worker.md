# ethang-hono Service Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a service worker to ethang-hono that serves all pages from cache immediately and reloads clients when `Last-Modified` headers change.

**Architecture:** A plain JS service worker in `public/sw.js` uses stale-while-revalidate for both HTML and assets. For HTML routes it compares `Last-Modified` response headers; when they differ it updates the cache and posts `CONTENT_UPDATED` to all window clients so they reload. A deploy-time stamp script writes the SW version hash and a `DEPLOY_TIME` constant used by static routes.

**Tech Stack:** Hono middleware, Service Worker API, Node crypto (stamp script), Bun (script runner), lodash, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/ethang-hono/public/sw.js` | Create | Service worker — caching, fetch routing, client notification |
| `apps/ethang-hono/scripts/stamp-sw.ts` | Create | Stamp SW version hash + write DEPLOY_TIME to deploy-info.ts |
| `apps/ethang-hono/src/utilities/deploy-info.ts` | Create (placeholder) | Exports DEPLOY_TIME; overwritten at deploy time |
| `apps/ethang-hono/src/middleware/last-modified.ts` | Create | Promote meta last-modified tag to HTTP Last-Modified header |
| `apps/ethang-hono/src/index.tsx` | Modify | Register lastModifiedMiddleware globally |
| `apps/ethang-hono/src/components/layouts/main-layout.tsx` | Modify | Emit `<meta name="last-modified">` + inline SW registration script |
| `apps/ethang-hono/src/components/routes/blog.tsx` | Modify | Pass max `_updatedAt` from fetched blogs as `updatedAt` |
| `apps/ethang-hono/src/components/routes/courses.tsx` | Modify | Pass `coursePathData.latestUpdate?._updatedAt` as `updatedAt` |
| `apps/ethang-hono/src/components/routes/home.tsx` | Modify | Pass `DEPLOY_TIME` as `updatedAt` |
| `apps/ethang-hono/src/components/routes/sign-in.tsx` | Modify | Pass `DEPLOY_TIME` as `updatedAt` |
| `apps/ethang-hono/src/components/routes/tips.tsx` | Modify | Pass `DEPLOY_TIME` as `updatedAt` |
| `apps/ethang-hono/src/components/routes/tips/scrollbar-gutter.tsx` | Modify | Pass `DEPLOY_TIME` as `updatedAt` |
| `apps/ethang-hono/src/components/routes/tips/scroll-containers.tsx` | Modify | Pass `DEPLOY_TIME` as `updatedAt` |
| `apps/ethang-hono/package.json` | Modify | Add stamp-sw step to deploy script |

> Note: `apps/ethang-hono/src/components/routes/blog/blog-post.tsx` already passes `blog._updatedAt` as `updatedAt` to BlogLayout — no change needed there once the layout emits the meta tag.

---

## Task 1: Create the service worker

**Files:**
- Create: `apps/ethang-hono/public/sw.js`

- [ ] **Step 1: Create `public/sw.js`**

```js
// Bump SW_VERSION to force all clients to discard old caches and
// install this new worker on their next page load.
const SW_VERSION = "00000000";

const ASSETS_CACHE = `assets-${SW_VERSION}`;
const HTML_CACHE = `html-${SW_VERSION}`;

// The set of valid cache names for this version. Any cache key that
// isn't in this set is from an older SW version and will be deleted
// during activation.
const ALL_CACHES = new Set([ASSETS_CACHE, HTML_CACHE]);

// Skip waiting immediately — no pre-caching. The cache builds
// organically as pages are visited.
self.addEventListener("install", (event) => {
  event.waitUntil(globalThis.skipWaiting());
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
//    returned. If there is no cached fallback the error is re-thrown.
async function staleWhileRevalidateHtml(request) {
  const cache = await caches.open(HTML_CACHE);
  const cached = await cache.match(request);

  const networkPromise = (async () => {
    let response;
    try {
      response = await fetch(request);
    } catch (error) {
      if (cached) return;
      throw error;
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

// Stale-while-revalidate for all other GET assets (images, fonts,
// scripts, stylesheets). Non-GET requests bypass the cache entirely
// since the Cache API only supports GET.
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
```

- [ ] **Step 2: Commit**

```bash
cd apps/ethang-hono
git add public/sw.js
git commit -m "feat(ethang-hono): add service worker with stale-while-revalidate caching"
```

---

## Task 2: Create deploy-info placeholder and stamp script

**Files:**
- Create: `apps/ethang-hono/src/utilities/deploy-info.ts`
- Create: `apps/ethang-hono/scripts/stamp-sw.ts`

- [ ] **Step 1: Create `src/utilities/deploy-info.ts`**

This file is committed with a placeholder. The stamp script overwrites it at deploy time.

```ts
export const DEPLOY_TIME = "1970-01-01T00:00:00.000Z";
```

- [ ] **Step 2: Create `scripts/stamp-sw.ts`**

```ts
import replace from "lodash/replace.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const swPath = fileURLToPath(new URL("../public/sw.js", import.meta.url));
const content = readFileSync(swPath, "utf8");

const withoutVersion = replace(content, /^const SW_VERSION = ".*";$/mu, "");
const hash = createHash("sha256")
  .update(withoutVersion)
  .digest("hex")
  .slice(0, 8);

const stamped = replace(
  content,
  /^const SW_VERSION = ".*";$/mu,
  `const SW_VERSION = "${hash}";`,
);

writeFileSync(swPath, stamped);
globalThis.console.log(`SW stamped: ${hash}`);

const deployInfoPath = fileURLToPath(
  new URL("../src/utilities/deploy-info.ts", import.meta.url),
);
const deployTime = new Date().toISOString();
writeFileSync(
  deployInfoPath,
  `export const DEPLOY_TIME = "${deployTime}";\n`,
);
globalThis.console.log(`Deploy time stamped: ${deployTime}`);
```

- [ ] **Step 3: Commit**

```bash
git add src/utilities/deploy-info.ts scripts/stamp-sw.ts
git commit -m "feat(ethang-hono): add deploy-info placeholder and stamp-sw script"
```

---

## Task 3: Add last-modified middleware

**Files:**
- Create: `apps/ethang-hono/src/middleware/last-modified.ts`

- [ ] **Step 1: Create `src/middleware/last-modified.ts`**

```ts
import type { MiddlewareHandler } from "hono";

import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";

export const lastModifiedMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  if (
    !c.res.body ||
    !includes(c.res.headers.get("content-type") ?? "", "text/html")
  ) {
    return;
  }

  const text = await c.res.clone().text();
  const tagMatch = /<meta[^>]+name="last-modified"[^>]*>/iu.exec(text);
  if (!tagMatch) {
    return;
  }
  const contentMatch = /content="(?<v>[^"]+)"/iu.exec(tagMatch[0]);
  if (isNil(contentMatch?.groups?.["v"])) {
    return;
  }
  const date = new Date(contentMatch.groups["v"]);
  if (Number.isNaN(date.getTime())) {
    return;
  }
  const headers = new Headers(c.res.headers);
  headers.set("Last-Modified", date.toUTCString());
  c.res = new Response(c.res.body, {
    headers,
    status: c.res.status,
    statusText: c.res.statusText,
  });
};
```

- [ ] **Step 2: Register the middleware in `src/index.tsx`**

Add the import between the `feeds/blog-rss` and `models/course-tracking` imports (alphabetical by path):

```ts
import { lastModifiedMiddleware } from "./middleware/last-modified.ts";
```

Add the middleware registration directly after the `www` redirect middleware (around line 29, after the `app.use("*", async ...)` block):

```ts
app.use("*", lastModifiedMiddleware);
```

The top of `src/index.tsx` should now look like:

```ts
app.use("*", async (context, next) => {
  const url = new URL(context.req.url);

  if ("www.ethang.dev" === url.hostname) {
    return Response.redirect(`https://ethang.dev${url.pathname}${url.search}`);
  }

  await globalStore.setup(context);
  return next();
});

app.use("*", lastModifiedMiddleware);
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware/last-modified.ts src/index.tsx
git commit -m "feat(ethang-hono): add last-modified middleware"
```

---

## Task 4: Update layout to emit meta tag and register service worker

**Files:**
- Modify: `apps/ethang-hono/src/components/layouts/main-layout.tsx`

- [ ] **Step 1: Add `<meta name="last-modified">` to `<head>`**

In `main-layout.tsx`, add an import for `isNil` (it's already used via the existing import) and add the meta tag inside `<head>`, after the `<link rel="canonical">` block. The existing import line is already:

```ts
import isNil from "lodash/isNil.js";
```

Inside `<head>`, after the `textAlternate` link block, add:

```tsx
{!isNil(properties.updatedAt) && (
  <meta name="last-modified" content={properties.updatedAt} />
)}
```

- [ ] **Step 2: Add SW registration script before `</body>`**

In `main-layout.tsx`, add an inline script after the existing `<script type="module" src="/scripts/libraries.js">` tag:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
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
    `,
  }}
/>
```

The full updated `<body>` section of `main-layout.tsx` should end with:

```tsx
      <body id="body">
        <Navigation />
        <main class={twMerge("m-4 mt-20", properties.classNames?.main)}>
          {properties.children}
        </main>
        <script type="module" src="/scripts/libraries.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `,
          }}
        />
      </body>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/main-layout.tsx
git commit -m "feat(ethang-hono): emit last-modified meta tag and register service worker in layout"
```

---

## Task 5: Wire `updatedAt` on data-driven routes

**Files:**
- Modify: `apps/ethang-hono/src/components/routes/blog.tsx`
- Modify: `apps/ethang-hono/src/components/routes/courses.tsx`

### blog.tsx

The `/blog` route currently passes `updatedAt={new Date().toISOString()}` which changes on every render. Replace it with the max `_updatedAt` from the fetched blogs.

- [ ] **Step 1: Update `blog.tsx`**

Add `maxBy` import at the top of the existing lodash imports:

```ts
import maxBy from "lodash/maxBy.js";
```

In the `Blog` component, derive `updatedAt` from the fetched data:

```tsx
export const Blog = async () => {
  const blogModel = new BlogModel();
  const blogs = await blogModel.getAllBlogs();
  const latestBlog = maxBy(blogs, "_updatedAt");

  return (
    <BlogLayout
      title="Blog"
      description="Ethan Glover's blog."
      updatedAt={latestBlog?._updatedAt}
      publishedAt={latestBlog?._createdAt}
    >
```

The `map` and the rest of the component body are unchanged.

### courses.tsx

`coursePathData.latestUpdate` already holds the most recently updated item across all courses and learning paths. Pass its `_updatedAt` as `updatedAt` to `MainLayout`.

- [ ] **Step 2: Update `courses.tsx`**

In the `Courses` component, add `updatedAt` to the `<MainLayout>` props:

```tsx
  return (
    <MainLayout
      title="Recommended Courses"
      textAlternate="/courses?format=text"
      imageUrl="/images/generated/Gemini_Generated_Image_2ac79s2ac79s2ac7.png"
      description="A curated list of recommended courses for development. Learn from industry experts and stay up-to-date with the latest technologies."
      updatedAt={coursePathData.latestUpdate?._updatedAt}
    >
```

All other content inside `<MainLayout>` is unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/routes/blog.tsx src/components/routes/courses.tsx
git commit -m "feat(ethang-hono): wire last-modified timestamps on blog and courses routes"
```

---

## Task 6: Wire `updatedAt` on static routes

All five static routes use `DEPLOY_TIME` as their `updatedAt`.

**Files:**
- Modify: `apps/ethang-hono/src/components/routes/home.tsx`
- Modify: `apps/ethang-hono/src/components/routes/sign-in.tsx`
- Modify: `apps/ethang-hono/src/components/routes/tips.tsx`
- Modify: `apps/ethang-hono/src/components/routes/tips/scrollbar-gutter.tsx`
- Modify: `apps/ethang-hono/src/components/routes/tips/scroll-containers.tsx`

- [ ] **Step 1: Update `home.tsx`**

```tsx
import { DEPLOY_TIME } from "../../utilities/deploy-info.ts";
import { ProfileCard } from "../cards/profile-card.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

export const Home = async () => {
  return (
    <MainLayout classNames={{ main: "mx-auto max-w-7xl" }} updatedAt={DEPLOY_TIME}>
      <ProfileCard />
    </MainLayout>
  );
};
```

- [ ] **Step 2: Update `sign-in.tsx`**

Add the import after the existing `MainLayout` import:

```ts
import { DEPLOY_TIME } from "../../utilities/deploy-info.ts";
```

Change the `<MainLayout>` opening tag from:

```tsx
    <MainLayout>
```

to:

```tsx
    <MainLayout updatedAt={DEPLOY_TIME}>
```

- [ ] **Step 3: Update `tips.tsx`**

Add the import after the existing `MainLayout` import:

```ts
import { DEPLOY_TIME } from "../../utilities/deploy-info.ts";
```

Change the `<MainLayout>` opening tag from:

```tsx
    <MainLayout title="Tips" classNames={{ main: "max-w-[65ch] md:mx-auto" }}>
```

to:

```tsx
    <MainLayout title="Tips" classNames={{ main: "max-w-[65ch] md:mx-auto" }} updatedAt={DEPLOY_TIME}>
```

- [ ] **Step 4: Update `tips/scrollbar-gutter.tsx`**

Add the import after the existing `BlogLayout` import:

```ts
import { DEPLOY_TIME } from "../../../utilities/deploy-info.ts";
```

Change the `<BlogLayout>` opening tag from:

```tsx
    <BlogLayout title="scrollbar-gutter">
```

to:

```tsx
    <BlogLayout title="scrollbar-gutter" updatedAt={DEPLOY_TIME}>
```

- [ ] **Step 5: Update `tips/scroll-containers.tsx`**

Add the import after the existing `BlogLayout` import:

```ts
import { DEPLOY_TIME } from "../../../utilities/deploy-info.ts";
```

Change the `<BlogLayout>` opening tag to add `updatedAt={DEPLOY_TIME}`. The existing opening tag is:

```tsx
    <BlogLayout title="Easy Sticky Header/Footer">
```

Change it to:

```tsx
    <BlogLayout title="Easy Sticky Header/Footer" updatedAt={DEPLOY_TIME}>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/routes/home.tsx \
        src/components/routes/sign-in.tsx \
        src/components/routes/tips.tsx \
        src/components/routes/tips/scrollbar-gutter.tsx \
        src/components/routes/tips/scroll-containers.tsx
git commit -m "feat(ethang-hono): wire DEPLOY_TIME as last-modified on static routes"
```

---

## Task 7: Update deploy script

**Files:**
- Modify: `apps/ethang-hono/package.json`

- [ ] **Step 1: Update the deploy script**

Change:

```json
"deploy": "bun ./build.ts && wrangler deploy --minify",
```

to:

```json
"deploy": "bun ./build.ts && bun scripts/stamp-sw.ts && wrangler deploy --minify",
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat(ethang-hono): add stamp-sw to deploy pipeline"
```

---

## Task 8: Smoke test

- [ ] **Step 1: Run dev server**

```bash
cd apps/ethang-hono
pnpm dev
```

Open `http://localhost:8787` in a browser. In DevTools → Application → Service Workers, confirm the SW is registered and active.

- [ ] **Step 2: Verify cache population**

Navigate to `/`, `/blog`, `/courses`, `/tips`. In DevTools → Application → Cache Storage, confirm entries appear under `html-<hash>` and `assets-<hash>`.

- [ ] **Step 3: Verify Last-Modified header**

In DevTools → Network, navigate to any page. Confirm the HTML response includes a `Last-Modified` header matching the `updatedAt` value passed by that route.

- [ ] **Step 4: Verify stamp script**

```bash
bun scripts/stamp-sw.ts
```

Expected output (hash will differ):
```
SW stamped: a1b2c3d4
Deploy time stamped: 2026-03-27T...Z
```

Confirm `public/sw.js` line 3 has been updated and `src/utilities/deploy-info.ts` shows the new timestamp.

- [ ] **Step 5: Reset stamped files**

```bash
git checkout public/sw.js src/utilities/deploy-info.ts
```

This restores the placeholder values so dev builds don't have a stale production timestamp.
