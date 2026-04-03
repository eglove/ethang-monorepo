# Blog Pagination — Implementation Plan

**Stage:** 5 (Implementation Writer)
**Date:** 2026-04-03
**Spec:** `docs/tla-specs/blog-pagination/BlogPagination.tla`
**Design:** `docs/pipeline/blog-pagination-debate-synthesis.md`
**Review:** `docs/pipeline/blog-pagination-spec-review-revised.md`

---

## TLA+ State-to-Implementation Mapping

| TLA+ State | TLA+ Transitions | Implementation Mapping |
|------------|-----------------|----------------------|
| **Idle** | `ReceiveRequest` | Route handler in `index.tsx` awaiting incoming HTTP request |
| **Parsing** | `ParseRoot`, `ParseEmptySegment`, `ParsePageOne`, `ParseValidPage`, `ParseOverMax`, `ParsePageZero`, `ParseNegative`, `ParseInvalid` | Input validation logic in `index.tsx` route handler — parse `:page` param, validate numeric/integer/bounds |
| **Validating** | `ValidateAndRender` | Bounds check: `pageNumber <= maxPages` before passing to component |
| **Rendering** | `Reset` | `Blog` component renders paginated posts + pagination controls |
| **Redirecting** | `ResetFromRedirect` | `c.redirect()` calls in route handler with appropriate status code (301 vs 302) |

### Safety Property Coverage

| TLA+ Property | Implementation Enforcement |
|---------------|--------------------------|
| `NoNegativePageRendered` | Validation rejects `< 1` before component receives page prop |
| `PageOneIsRoot` | `/blog/page/1` route issues 301 to `/blog`; component default `page=1` only via `/blog` |
| `RedirectIsValid` | All redirect targets are either `/blog` or `/blog/page/N` where `N <= maxPages` |
| `RenderedPageWithinBounds` | `maxPages` computed from count; page clamped or redirected if out of range |
| `RedirectTypeInvariant` | 301 only for `/blog/page/1` → `/blog`; 302 for all others |
| `InvalidNeverRenders` | Invalid inputs (non-numeric, NaN, float, zero, negative) redirect before component render |

### All States Mapped — No Unmapped States

All five TLA+ states (`Idle`, `Parsing`, `Validating`, `Rendering`, `Redirecting`) and all nine input types (`none`, `root`, `empty_segment`, `one`, `valid`, `over_max`, `zero`, `negative`, `invalid`) have direct implementation counterparts.

---

## Execution Tiers

Tasks are organized into 5 tiers. Each tier depends on the completion of all preceding tiers.

### Tier 1 — Foundation (Types + Model)

No dependencies. These tasks add the data layer that all other tiers depend on.

### Tier 2 — Routing (Input Validation + Redirects)

Depends on Tier 1 (needs `getPaginatedBlogs` method signature). Implements the TLA+ `Parsing` and `Redirecting` states.

### Tier 3 — Component (Rendering + Pagination Controls)

Depends on Tier 1 (types) and Tier 2 (route passes validated page prop). Implements the TLA+ `Rendering` state.

### Tier 4 — SEO (Meta Tags + Canonical + Prev/Next)

Depends on Tier 3 (component renders with page context). Implements `rel="prev"`, `rel="next"`, canonical URLs, and page-specific titles.

### Tier 5 — Tests (Unit + E2E)

Depends on Tiers 1-4 (all functionality must exist to test). Covers all TLA+ safety properties and the test matrix from the design consensus.

---

## Task Assignment Table

| Task ID | Tier | File | TLA+ Coverage | Description |
|---------|------|------|---------------|-------------|
| T1 | 1 | `src/models/get-blogs.ts` | N/A (supporting) | Add `PaginatedBlogResult` type |
| T2 | 1 | `src/models/blog-model.ts` | `MaxPage` derivation | Add `getPaginatedBlogs(page, pageSize)` method with GROQ multi-query |
| T3 | 2 | `src/index.tsx` | `Parsing`, `Redirecting`, all `Parse*` transitions | Add `/blog/page/:page` route with input validation and redirect logic |
| T4 | 2 | `src/index.tsx` | `ParsePageOne` (301), `RedirectTypeInvariant` | Modify existing `/blog` route to pass page=1 explicitly (no functional change) |
| T5 | 3 | `src/components/routes/blog.tsx` | `Rendering`, `ValidateAndRender` | Update `Blog` component to accept `page` prop, fetch paginated data, render pagination controls |
| T6 | 3 | `src/components/routes/blog.tsx` | `RenderedPageWithinBounds` | Add smart-truncated numbered page links component |
| T7 | 3 | `src/components/routes/blog.tsx` | `InvalidNeverRenders` (component side) | Add fixed-position prev/next floating buttons |
| T8 | 4 | `src/components/layouts/blog-layout.tsx` | `PageOneIsRoot` (canonical) | Add `prevUrl` and `nextUrl` props for `rel="prev"`/`rel="next"` link tags |
| T9 | 4 | `src/components/routes/blog.tsx` | `PageOneIsRoot`, `RedirectIsValid` | Pass canonical URL, prev/next URLs to `BlogLayout` |
| T10 | 5 | `src/models/blog-model.test.ts` | `MaxPage`, `RenderedPageWithinBounds` | Unit tests for `getPaginatedBlogs` |
| T11 | 5 | `e2e/mouse/blog.spec.ts` | All safety properties | E2E tests for route behavior, redirects, pagination controls, accessibility |
| T12 | 5 | `src/sitemap.ts` | `RedirectIsValid` (negative case) | Verify sitemap does NOT include paginated URLs (no change, but document decision) |

---

## Step-by-Step Instructions

### Tier 1 — Foundation

#### T1: Add `PaginatedBlogResult` type

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\models\get-blogs.ts`

Add a new type alongside the existing `GetBlogs`:

```typescript
export type PaginatedBlogResult = {
  posts: Blog[];
  total: number;
  maxPages: number;
};
```

This type maps to the TLA+ concept of `MaxPage` — it carries the total count and computed maximum page number so the component can render pagination controls without a second query.

---

#### T2: Add `getPaginatedBlogs` method to `BlogModel`

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\models\blog-model.ts`

Add a new public method that uses GROQ multi-query syntax to fetch both paginated posts and total count in a single HTTP request:

```typescript
import type { PaginatedBlogResult } from "./get-blogs.ts";

// Inside BlogModel class:
public async getPaginatedBlogs(page: number, pageSize: number): Promise<PaginatedBlogResult> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const result = await sanityClient.fetch<[{ posts: Blog[] }, { total: number }]>(
    `[
      { "posts": *[_type == "blog"] | order(_createdAt desc)[$start...$end] {
        _id, title, author, _updatedAt, slug, description,
        featuredImage->{...}, blogCategory->{...}, _createdAt
      } },
      { "total": count(*[_type == "blog"]) }
    ]`,
    { start, end }
  );

  const posts = result[0].posts;
  const total = result[1].total;
  const maxPages = Math.ceil(total / pageSize) || 1; // Guard against 0 total

  return { posts, total, maxPages };
}
```

Key points:
- Uses GROQ multi-query (array of two queries) for a single HTTP round-trip.
- `$start` and `$end` are parameterized slice bounds.
- `maxPages` uses ceiling division matching the TLA+ formula: `(TotalPosts + PageSize - 1) \div PageSize`, implemented as `Math.ceil(total / pageSize)`.
- Guards against zero total posts by defaulting `maxPages` to 1.

---

### Tier 2 — Routing

#### T3: Add `/blog/page/:page` route with input validation

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\index.tsx`

Add a new route **before** the existing `/blog/:slug` route (order matters in Hono — more specific routes first):

```typescript
app.get("/blog/page/:page", async (c) => {
  const rawPage = c.req.param("page");

  // TLA+ Parsing state: validate input before any Sanity query
  const parsed = Number(rawPage);

  // Reject: non-numeric, NaN, non-integer, < 1
  if (!rawPage || isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    // ParseInvalid, ParsePageZero, ParseNegative, ParseEmptySegment
    return c.redirect("/blog", 302);
  }

  if (parsed === 1) {
    // ParsePageOne: canonical normalization with 301
    return c.redirect("/blog", 301);
  }

  // Fetch to determine maxPages (needed for over_max check)
  const blogModel = new BlogModel();
  const { maxPages } = await blogModel.getPaginatedBlogs(parsed, 10);

  if (parsed > maxPages) {
    // ParseOverMax: redirect to last valid page
    return c.redirect(`/blog/page/${maxPages}`, 302);
  }

  // ParseValidPage -> Validating -> Rendering
  return c.html(<Blog page={parsed} />);
});
```

This single route handler implements the entire TLA+ `Parsing` state machine:
- `ParseInvalid` → 302 to `/blog` (non-numeric, NaN)
- `ParsePageZero` → 302 to `/blog` (parsed < 1)
- `ParseNegative` → 302 to `/blog` (parsed < 1)
- `ParseEmptySegment` → 302 to `/blog` (empty string caught by `!rawPage`)
- `ParsePageOne` → 301 to `/blog` (canonical)
- `ParseOverMax` → 302 to `/blog/page/maxPages`
- `ParseValidPage` → passes validation, renders `<Blog page={parsed} />`

**Important:** Place this route **before** `app.get("/blog/:slug", ...)` to avoid the `page` segment being captured by the `:slug` parameter.

---

#### T4: Ensure existing `/blog` route still works

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\index.tsx`

The existing route `app.get(routes.blog, ...)` should continue to work. The `Blog` component will now accept an optional `page` prop defaulting to 1, so no change is needed to the route handler itself. This maps to `ParseRoot` in the TLA+ spec — the root input renders page 1.

No code change required, but verify the route still passes `pathname` correctly.

---

### Tier 3 — Component

#### T5: Update `Blog` component to accept `page` prop and fetch paginated data

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\components\routes\blog.tsx`

Change the component signature and data fetching:

```typescript
export const Blog = async ({ page = 1 }: { page?: number }) => {
  const { pathname } = globalStore;
  const blogModel = new BlogModel();
  const pageSize = 10;
  const { posts: blogs, maxPages } = await blogModel.getPaginatedBlogs(page, pageSize);
  const latestBlog = maxBy(blogs, "_updatedAt");

  const title = page === 1 ? "Blog" : `Blog - Page ${page}`;
  const canonicalUrl = page === 1
    ? "https://ethang.dev/blog"
    : `https://ethang.dev/blog/page/${page}`;

  // Determine prev/next URLs for SEO link tags
  const prevUrl = page > 1
    ? (page === 2 ? "https://ethang.dev/blog" : `https://ethang.dev/blog/page/${page - 1}`)
    : undefined;
  const nextUrl = page < maxPages
    ? `https://ethang.dev/blog/page/${page + 1}`
    : undefined;

  return (
    <BlogLayout
      title={title}
      pathname={pathname}
      description="Ethan Glover's blog."
      updatedAt={latestBlog?._updatedAt}
      publishedAt={latestBlog?._createdAt}
      canonicalUrl={canonicalUrl}
      prevUrl={prevUrl}
      nextUrl={nextUrl}
    >
      {/* ... existing blog list content, now using paginated `blogs` ... */}
      {/* ... pagination controls (see T6, T7) ... */}
    </BlogLayout>
  );
};
```

Key changes:
- Accepts `page` prop (default 1 for the `/blog` route).
- Fetches paginated data via `getPaginatedBlogs` instead of `getAllBlogs`.
- Computes `title`, `canonicalUrl`, `prevUrl`, `nextUrl` for SEO.
- Passes SEO props to `BlogLayout`.

---

#### T6: Add smart-truncated numbered page links

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\components\routes\blog.tsx`

Add a helper function and rendering logic for numbered page links with smart truncation. The algorithm: always show page 1, always show last page, show current page ± 2, use ellipsis for gaps.

```typescript
const generatePageNumbers = (current: number, max: number): (number | "...")[] => {
  if (max <= 1) return [];

  const pages: (number | "...")[] = [];
  const range = 2;

  for (let i = 1; i <= max; i++) {
    if (
      i === 1 ||
      i === max ||
      (i >= current - range && i <= current + range)
    ) {
      if (pages.length > 0 && pages[pages.length - 1] !== "..." && i - (pages[pages.length - 1] as number) > 1) {
        pages.push("...");
      }
      pages.push(i);
    }
  }

  return pages;
};
```

Render the page numbers within the component:

```tsx
{maxPages > 1 && (
  <nav aria-label="Pagination" class="flex items-center justify-center gap-1 mt-6">
    {map(generatePageNumbers(page, maxPages), (p) => {
      if (p === "...") {
        return <span class="px-2 text-slate-400">…</span>;
      }
      const isActive = p === page;
      const href = p === 1 ? "/blog" : `/blog/page/${p}`;
      return (
        <Link
          href={href}
          class={twMerge(
            "px-3 py-1 rounded text-sm",
            isActive
              ? "bg-sky-600 text-white font-semibold"
              : "text-slate-300 hover:bg-slate-700"
          )}
          {...(isActive ? { "aria-current": "page" as const } : {})}
        >
          {p}
        </Link>
      );
    })}
  </nav>
)}
```

Key points:
- `aria-current="page"` on the active page number (accessibility requirement from design consensus).
- Ellipsis rendered as a non-interactive `<span>`.
- Only renders when `maxPages > 1`.

---

#### T7: Add fixed-position prev/next floating buttons

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\components\routes\blog.tsx`

Add conditionally rendered prev/next buttons using `position: fixed`:

```tsx
{/* Prev button — only render when there is a previous page */}
{page > 1 && (
  <Link
    href={page === 2 ? "/blog" : `/blog/page/${page - 1}`}
    class="fixed bottom-4 left-4 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
    aria-label="Previous page"
  >
    ← Prev
  </Link>
)}

{/* Next button — only render when there is a next page */}
{page < maxPages && (
  <Link
    href={`/blog/page/${page + 1}`}
    class="fixed bottom-4 right-4 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
    aria-label="Next page"
  >
    Next →
  </Link>
)}
```

Key points:
- **Conditionally rendered** — no placeholder when unavailable (design consensus decision).
- `aria-label` for accessibility.
- `position: fixed` via Tailwind `fixed bottom-4 left-4` / `fixed bottom-4 right-4`.
- `<a>` tags for server-rendered full-page navigation.

---

### Tier 4 — SEO

#### T8: Add `prevUrl` and `nextUrl` props to `BlogLayout`

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\components\layouts\blog-layout.tsx`

Update `BlogLayout` to accept and pass through `prevUrl` and `nextUrl` for `rel="prev"` and `rel="next"` link tags. These need to flow through to `MainLayout`:

```typescript
import { MainLayout, type MainLayoutProperties } from "./main-layout.tsx";

type BlogLayoutProperties = MainLayoutProperties & {
  prevUrl?: string;
  nextUrl?: string;
};

export const BlogLayout = async (
  properties: Omit<BlogLayoutProperties, "isBlog">,
) => {
  const { prevUrl, nextUrl, ...rest } = properties;

  return (
    <MainLayout
      {...rest}
      isBlog={true}
      classNames={{ main: "max-w-[65ch] md:mx-auto" }}
      prevUrl={prevUrl}
      nextUrl={nextUrl}
    />
  );
};
```

---

#### T8b: Update `MainLayout` to render prev/next link tags

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\components\layouts\main-layout.tsx`

Add `prevUrl` and `nextUrl` to `MainLayoutProperties` and render the link tags in `<head>`:

```typescript
// Add to MainLayoutProperties type:
prevUrl?: string;
nextUrl?: string;
```

In the `<head>` section, after the canonical link:

```tsx
{!isNil(properties.prevUrl) && (
  <link rel="prev" href={properties.prevUrl} />
)}
{!isNil(properties.nextUrl) && (
  <link rel="next" href={properties.nextUrl} />
)}
```

---

#### T9: Pass SEO props from `Blog` to `BlogLayout`

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\components\routes\blog.tsx`

This is covered in T5 — the `canonicalUrl`, `prevUrl`, and `nextUrl` are already computed and passed to `BlogLayout` there. Ensure the values are correct:

- Page 1: `canonicalUrl = "https://ethang.dev/blog"`, no prev, next = `/blog/page/2`
- Page N (middle): `canonicalUrl = "https://ethang.dev/blog/page/N"`, prev = `/blog/page/N-1`, next = `/blog/page/N+1`
- Last page: `canonicalUrl = "https://ethang.dev/blog/page/N"`, prev = `/blog/page/N-1`, no next

This maps to the TLA+ `PageOneIsRoot` property — page 1's canonical is always `/blog`, never `/blog/page/1`.

---

### Tier 5 — Tests

#### T10: Unit tests for `getPaginatedBlogs`

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\models\blog-model.test.ts`

Add a new `describe` block for `getPaginatedBlogs` with the following test cases (from the design consensus test matrix):

```typescript
describe("getPaginatedBlogs", () => {
  const pageSize = 10;

  it("returns posts 0-9, total=25, maxPages=3 for page 1 with 25 total", async () => {
    // Mock multi-query response
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: Array.from({ length: 10 }, () => makeBlog()) },
      { total: 25 },
    ] as never);

    const model = new BlogModel();
    const result = await model.getPaginatedBlogs(1, pageSize);

    expect(result.posts).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.maxPages).toBe(3);
  });

  it("returns posts 10-19, total=25, maxPages=3 for page 2", async () => {
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: Array.from({ length: 10 }, () => makeBlog()) },
      { total: 25 },
    ] as never);

    const model = new BlogModel();
    const result = await model.getPaginatedBlogs(2, pageSize);

    expect(result.posts).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.maxPages).toBe(3);

    // Verify correct slice parameters
    const params = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][1]");
    expect(params).toMatchObject({ start: 10, end: 20 });
  });

  it("returns posts 20-24, total=25, maxPages=3 for page 3", async () => {
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: Array.from({ length: 5 }, () => makeBlog()) },
      { total: 25 },
    ] as never);

    const model = new BlogModel();
    const result = await model.getPaginatedBlogs(3, pageSize);

    expect(result.posts).toHaveLength(5);
    expect(result.total).toBe(25);
    expect(result.maxPages).toBe(3);

    const params = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][1]");
    expect(params).toMatchObject({ start: 20, end: 30 });
  });

  it("returns empty posts, total=25, maxPages=3 for out-of-range page 4", async () => {
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: [] },
      { total: 25 },
    ] as never);

    const model = new BlogModel();
    const result = await model.getPaginatedBlogs(4, pageSize);

    expect(result.posts).toHaveLength(0);
    expect(result.total).toBe(25);
    expect(result.maxPages).toBe(3);
  });

  it("returns empty posts, total=0, maxPages=1 for zero total posts", async () => {
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: [] },
      { total: 0 },
    ] as never);

    const model = new BlogModel();
    const result = await model.getPaginatedBlogs(1, pageSize);

    expect(result.posts).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.maxPages).toBe(1);
  });

  it("returns 5 posts, total=5, maxPages=1 for 5 total posts with pageSize=10", async () => {
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: Array.from({ length: 5 }, () => makeBlog()) },
      { total: 5 },
    ] as never);

    const model = new BlogModel();
    const result = await model.getPaginatedBlogs(1, pageSize);

    expect(result.posts).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.maxPages).toBe(1);
  });

  it("uses GROQ multi-query syntax", async () => {
    vi.mocked(sanityClient).fetch.mockResolvedValue([
      { posts: [] },
      { total: 0 },
    ] as never);

    const model = new BlogModel();
    await model.getPaginatedBlogs(1, pageSize);

    const query = get(vi.mocked(sanityClient).fetch.mock.calls, "[0][0]");

    expect(query).toContain('"posts"');
    expect(query).toContain('"total"');
    expect(query).toContain("count(");
    expect(query).toContain("$start");
    expect(query).toContain("$end");
  });
});
```

---

#### T11: E2E tests for pagination behavior

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\e2e\mouse\blog.spec.ts`

Add a new `test.describe` block for pagination:

```typescript
test.describe("blog pagination", () => {
  test("GET /blog returns 200 and renders blog listing", async ({ axePage }) => {
    const response = await axePage.goto(routes.blog);
    expect.soft(response?.status()).toBe(200);
    await expect.soft(axePage.getByRole("heading", { name: "Blog" })).toBeVisible();
  });

  test("GET /blog/page/1 redirects 301 to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/1");
    expect(response?.status()).toBe(200); // Playwright follows redirects
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/0 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/0");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/-1 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/-1");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/abc redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/abc");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/2.5 redirects to /blog", async ({ page }) => {
    const response = await page.goto("/blog/page/2.5");
    expect(response?.status()).toBe(200);
    expect(response?.url()).toBe("https://ethang.dev/blog");
  });

  test("GET /blog/page/9999 redirects to last valid page", async ({ page }) => {
    const response = await page.goto("/blog/page/9999");
    expect(response?.status()).toBe(200);
    // Should redirect to /blog/page/N where N is maxPages
    expect(response?.url()).toMatch(/\/blog(\/page\/\d+)?$/);
  });

  test("pagination controls are visible when multiple pages exist", async ({ page }) => {
    await page.goto(routes.blog);
    // Check for pagination nav
    await expect.soft(page.getByRole("navigation", { name: "Pagination" })).toBeVisible();
  });

  test("current page has aria-current attribute", async ({ page }) => {
    await page.goto(routes.blog);
    await expect.soft(page.getByRole("link", { name: "1" }).first()).toHaveAttribute("aria-current", "page");
  });

  test("prev button has correct aria-label", async ({ page }) => {
    // Navigate to page 2 where prev button should exist
    await page.goto("/blog/page/2");
    await expect.soft(page.getByRole("link", { name: "Previous page" })).toBeVisible();
  });

  test("next button has correct aria-label", async ({ page }) => {
    await page.goto(routes.blog);
    // Only check if there are multiple pages
    const paginationNav = page.getByRole("navigation", { name: "Pagination" });
    if (await paginationNav.isVisible()) {
      await expect.soft(page.getByRole("link", { name: "Next page" })).toBeVisible();
    }
  });

  test("sitemap does not contain paginated index URLs", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect.soft(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).not.toContain("/blog/page/");
    // Should contain individual blog post URLs
    expect(content).toContain("/blog/");
  });

  test("RSS feed contains all posts unchanged", async ({ page }) => {
    const response = await page.goto("/blogRss.xml");
    expect.soft(response?.status()).toBe(200);
    const content = await page.content();
    expect(content).toContain("<rss");
    expect(content).toContain("<channel>");
  });
});
```

Note: The redirect tests use Playwright's default behavior of following redirects. To verify the actual redirect status code, you would need to use `request.get()` with `maxRedirects: 0`, but the current fixture setup uses `page.goto()`. If exact status code verification is needed, add a separate API-style test using `@playwright/test`'s `request` fixture.

---

#### T12: Sitemap — document no-change decision

**File:** `C:\Users\glove\projects\ethang-monorepo\apps\ethang-hono\src\sitemap.ts`

No code changes needed. The design consensus explicitly excludes paginated URLs from the sitemap. The existing sitemap already includes individual blog post URLs via `getAllBlogs()`, which is the higher-value content. The E2E test in T11 verifies this behavior.

---

## Dependency Graph

```
Tier 1 (Foundation)
  T1: get-blogs.ts (types) ──────────────┐
  T2: blog-model.ts (method) ────────────┤
                                          │
Tier 2 (Routing)                          │
  T3: index.tsx (new route) ◄─────────────┘
  T4: index.tsx (existing route) ◄────────┘

Tier 3 (Component)
  T5: blog.tsx (page prop + fetch) ◄────── T1, T2, T3
  T6: blog.tsx (page numbers) ◄─────────── T5
  T7: blog.tsx (floating buttons) ◄─────── T5

Tier 4 (SEO)
  T8: blog-layout.tsx (prev/next props) ◄─ T5
  T8b: main-layout.tsx (link tags) ◄────── T8
  T9: blog.tsx (pass SEO props) ◄───────── T5, T8

Tier 5 (Tests)
  T10: blog-model.test.ts ◄─────────────── T2
  T11: blog.spec.ts ◄───────────────────── T3, T5, T6, T7, T9, T12
  T12: sitemap.ts (no change) ◄─────────── (documentation only)
```

---

## Risk Notes

1. **Route ordering:** The `/blog/page/:page` route must be registered **before** `/blog/:slug` in `index.tsx`. Hono matches routes in registration order, and `page` would otherwise be captured as a `:slug` parameter.

2. **Sanity query performance:** The GROQ multi-query reduces two HTTP requests to one, but the count query still scans all blog documents. For the current blog size this is negligible. If the blog grows to thousands of posts, consider caching the count.

3. **Redirect status codes:** The spec distinguishes 301 (canonical normalization of `/blog/page/1`) from 302 (all other redirects). Playwright's `page.goto()` follows redirects automatically, so E2E tests verify the final URL, not the intermediate status code. If status code verification is critical, use Playwright's `request` API with `maxRedirects: 0`.

4. **`maxPages` guard:** When `total = 0`, `Math.ceil(0 / 10)` returns `0`. The implementation guards with `|| 1` to ensure `maxPages` is at least 1, preventing division-by-zero issues in pagination rendering.
