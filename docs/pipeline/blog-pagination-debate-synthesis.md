# Blog Pagination — Design Consensus Synthesis

**Stage:** 2 (Debate Complete)
**Date:** 2026-04-02
**Briefing:** `docs/pipeline/blog-pagination-briefing.md`

---

## Summary

A multi-expert debate was conducted covering GROQ query correctness, route edge cases, component architecture, SEO, floating navigation, and test strategy. The following synthesis captures agreed decisions, changes from the original briefing, and resolved ambiguities.

---

## Agreed Changes from Briefing

### 1. GROQ Multi-Query (Performance Optimization)

**Briefing:** Two separate queries per request.
**Consensus:** Use GROQ's multi-query syntax to combine both into a single HTTP request:

```groq
[
  { "posts": *[_type == "blog"] | order(_createdAt desc)[$start...$end] { ...fields } },
  { "total": count(*[_type == "blog"]) }
]
```

This reduces latency from two round-trips to Sanity to one, which matters for Cloudflare Workers.

### 2. Input Validation Before Querying

**Briefing:** Does not specify validation order.
**Consensus:** Validate the page parameter **before** hitting Sanity. Reject non-numeric, NaN, non-integer, and < 1 values with an immediate redirect to `/blog`. This avoids unnecessary Sanity queries for invalid inputs like `/blog/page/abc` or `/blog/page/2.5`.

### 3. Page as Component Prop

**Briefing:** Says "accept page param" without specifying mechanism.
**Consensus:** Pass `page` as a prop: `<Blog page={n} />`. Do not add `currentPage` to `globalStore`. The component signature becomes:

```tsx
export const Blog = async ({ page = 1 }: { page?: number }) => { ... }
```

The component also needs `maxPages` and the paginated blog posts list, which should be fetched in the route handler and passed as props, or fetched inside the component with the page prop.

### 4. Handle Non-Numeric Page Params

**Briefing:** Silent on this case.
**Consensus:** `/blog/page/abc`, `/blog/page/2.5`, `/blog/page/` → redirect to `/blog` (302 or 301). Treat as invalid input, not a 404.

### 5. Canonical URLs + Prev/Next Links

**Briefing:** Self-referencing canonical only.
**Consensus:** Self-referencing canonical for all paginated pages (unchanged). **Additionally**, add `rel="prev"` and `rel="next"` `<link>` tags in `<head>` where applicable:
- Page 2: `<link rel="prev" href="/blog" />`
- Page 3: `<link rel="prev" href="/blog/page/2" />` and `<link rel="next" href="/blog/page/4" />`
- Last page: `<link rel="prev" href="/blog/page/N-1" />` (no next)

### 6. Sitemap — Paginated URLs Excluded

**Briefing:** Include paginated URLs in sitemap.
**Consensus:** **Do NOT** include paginated index URLs (`/blog/page/2`, etc.) in the sitemap. Individual blog post URLs are already included and are higher-value. Paginated index pages are discoverable through internal linking from `/blog`. This follows Google's guidance that paginated navigation pages don't need sitemap inclusion when their items are already listed.

### 7. Floating Navigation Implementation

**Briefing:** "Visible at all times", "no specific style preference."
**Consensus:**
- Use `position: fixed` for prev/next buttons (Tailwind: `fixed bottom-4 left-4` / `fixed bottom-4 right-4`).
- Use `<a>` tags for navigation (server-rendered, full-page navigation).
- **Conditionally render** — do not render a placeholder when there is no prev or next page.
- Numbered page links with **smart truncation**: show current page ± 2, use ellipsis for gaps (e.g., `1 2 3 ... 10 ... 49 50`).
- Always show first and last page numbers.

### 8. Accessibility

**Briefing:** No accessibility requirements mentioned.
**Consensus:**
- Since prev/next buttons are conditionally rendered (not rendered when unavailable), `aria-disabled` is not needed for them.
- Numbered page links: the current page number should be visually distinct and have `aria-current="page"`.
- Descriptive labels: use `aria-label="Previous page"` and `aria-label="Next page"` on prev/next links.
- Ensure sufficient color contrast for all interactive elements.

---

## Unchanged from Briefing

| Decision | Status |
|----------|--------|
| Page size of 10 posts | Confirmed |
| URL structure `/blog/page/2`, `/blog/page/3` | Confirmed |
| `/blog/page/1` → 301 redirect to `/blog` | Confirmed |
| Page > max → redirect to last page | Confirmed |
| RSS feed unchanged (all posts) | Confirmed |
| Two logical queries (posts + count) | Confirmed (combined into one HTTP request) |

---

## Resolved Ambiguities

| Question | Decision |
|----------|----------|
| GROQ query approach | Multi-query syntax, single HTTP request |
| Non-numeric page param | Redirect to `/blog` |
| Component receives page how | As a prop, not via globalStore |
| Sitemap includes paginated URLs? | No |
| rel="prev"/"next" tags? | Yes |
| Numbered page link strategy | Smart truncation: current ± 2, ellipsis, always show first/last |
| Disabled prev/next rendering | Conditionally don't render (no placeholder) |
| Floating button CSS | `position: fixed`, Tailwind classes |
| Current page indicator | `aria-current="page"` on the number |
| Who fetches data: route or component? | Component receives `page` prop and fetches internally (consistent with current pattern where Blog fetches its own data) |

---

## Revised File Change Plan

| File | Change |
|------|--------|
| `apps/ethang-hono/src/models/blog-model.ts` | Add `getPaginatedBlogs(page: number, pageSize: number)` method using GROQ multi-query. Returns `{ posts: Blog[], total: number }`. |
| `apps/ethang-hono/src/models/get-blogs.ts` | Add `PaginatedBlogResult` type: `{ posts: Blog[]; total: number; maxPages: number }`. |
| `apps/ethang-hono/src/components/routes/blog.tsx` | Accept `{ page?: number }` prop. Fetch paginated data internally. Render pagination controls with smart truncation. Update title to "Blog - Page N". |
| `apps/ethang-hono/src/components/layouts/blog-layout.tsx` | Accept optional `canonicalUrl`, `prevUrl`, `nextUrl` props for SEO link tags. |
| `apps/ethang-hono/src/index.tsx` | Add route `/blog/page/:page` with input validation and redirect logic. Pass page param to `<Blog page={n} />`. Add 301 redirect for `/blog/page/1`. |
| `apps/ethang-hono/src/sitemap.ts` | **No change** — paginated URLs excluded. |
| `apps/ethang-hono/src/models/blog-model.test.ts` | Unit tests: correct slicing, edge cases (0 posts, < pageSize, exact multiple). |
| `apps/ethang-hono/e2e/` | E2E tests: route behavior, redirects, floating nav visibility, accessibility. |

---

## Test Coverage Matrix

### Unit Tests (`blog-model.test.ts`)

| Test Case | Expected |
|-----------|----------|
| Page 1, 25 total posts | Returns posts 0-9, total=25, maxPages=3 |
| Page 2, 25 total posts | Returns posts 10-19, total=25, maxPages=3 |
| Page 3, 25 total posts | Returns posts 20-24, total=25, maxPages=3 |
| Page 4, 25 total posts (out of range) | Returns empty posts, total=25, maxPages=3 |
| 0 total posts | Returns empty posts, total=0, maxPages=1 |
| 5 total posts, pageSize=10 | Returns 5 posts, total=5, maxPages=1 |

### E2E Tests

| Test Case | Expected |
|-----------|----------|
| GET `/blog` | 200, renders first 10 posts, no prev button, next button if >10 posts |
| GET `/blog/page/2` | 200, renders posts 11-20, prev and next buttons as applicable |
| GET `/blog/page/1` | 301 redirect to `/blog` |
| GET `/blog/page/0` | 301/302 redirect to `/blog` |
| GET `/blog/page/-1` | 301/302 redirect to `/blog` |
| GET `/blog/page/abc` | 301/302 redirect to `/blog` |
| GET `/blog/page/2.5` | 301/302 redirect to `/blog` |
| GET `/blog/page/9999` (exceeds max) | 301/302 redirect to last valid page |
| Sitemap XML | Contains individual blog post URLs, does NOT contain `/blog/page/N` |
| RSS XML | Contains all posts, unchanged |

---

## Open Questions (Deferred to Implementation)

1. **Exact Tailwind classes for floating buttons:** To be decided during implementation based on visual design.
2. **Ellipsis rendering component:** Whether to use a separate `Pagination` component or inline logic in `Blog`.
3. **Redirect status code for invalid pages:** 302 (temporary) vs 301 (permanent). Recommendation: 302 for invalid input (user might correct), 301 for `/blog/page/1` → `/blog` (canonical normalization).
