# Blog Pagination — Requirements Briefing

**Stage:** 1 (Complete)
**Seed:** Add pagination to the ethang-hono blog.
**Date:** 2026-04-02

---

## Current State

- Hono app running on Cloudflare Workers with Sanity CMS as the data source
- `BlogModel.getAllBlogs()` fetches ALL posts with no limit
- Blog listing renders every post in a single page load
- Server-rendered async JSX components styled with Tailwind CSS

---

## Functional Requirements

### 1. Pagination Mechanism

- Numbered page links with next/prev page buttons floating on the sides of the blog index page
- Page size: **10 posts per page**

### 2. URL Structure

- Path segments: `/blog/page/2`, `/blog/page/3`, etc.
- First page: `/blog` serves as page 1
- `/blog/page/1` redirects (301) to `/blog`
- Out-of-range pages:
  - Page number > max pages → redirect to last valid page
  - Page number < 1 (e.g., `/blog/page/0`) → redirect to `/blog` (page 1)

### 3. RSS Feed

- Include ALL posts — current behavior unchanged, no pagination applied to RSS

### 4. Sitemap

- Include paginated URLs: `/blog/page/2`, `/blog/page/3`, etc.

### 5. SEO Meta Tags

- Each paginated page has a unique title and meta tags (e.g., "Blog - Page 2")
- Self-referencing canonical URLs for paginated pages

### 6. Floating Next/Prev Buttons

- Visible at all times (sticky/fixed positioning)
- Disabled when there is no next or previous page
- No specific style preference

### 7. Sanity Queries

- Two queries per request:
  1. Paginated posts using GROQ `slice`
  2. Total post count for computing max pages

---

## Key Files to Modify

| File | Change |
|------|--------|
| `apps/ethang-hono/src/models/blog-model.ts` | Add paginated query method + count query |
| `apps/ethang-hono/src/models/get-blogs.ts` | Add types for paginated response |
| `apps/ethang-hono/src/components/routes/blog.tsx` | Accept page param, render paginated results with floating nav |
| `apps/ethang-hono/src/index.tsx` | Add route for `/blog/page/:page` with redirect logic |
| `apps/ethang-hono/src/sitemap.ts` | Include paginated URLs |
| `apps/ethang-hono/src/models/blog-model.test.ts` | Unit tests for paginated method |
| `apps/ethang-hono/e2e/` | E2E tests for pagination behavior |

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Path-segment URLs (`/blog/page/2`) | Clean, SEO-friendly, easy routing in Hono |
| `/blog` as page 1 | Standard convention, avoids unnecessary `/page/1` |
| Redirect on out-of-range | Prevents 404s, keeps users on valid content |
| Two Sanity queries (slice + count) | GROQ doesn't return total count with slice; separate count query is necessary |
| RSS unchanged | RSS consumers expect full feed; pagination would break compatibility |
| Self-referencing canonical | Each paginated page is a distinct view; canonical should point to itself |
