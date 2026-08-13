# Blog SEO Metadata (Featured Images + og/twitter + canonical) — Design

**Date:** 2026-08-13
**App:** `apps/ethang-astro`
**Status:** Approved in chat (design shown, user added: title, description, publishedAt, updatedAt, canonical URLs)

## Objective

Turn each blog post's Sanity `featuredImage` into a local asset used for rich SEO
metadata, and give the site proper OG/Twitter/canonical/description meta on all
pages — with blog-specific `article:` dates. Supersedes the earlier "omit
featuredImage" ruling (C): the user explicitly wants the featured image back.

## Data model

- `src/content.config.ts` blog schema +=
  - `featuredImage: image().optional()` (Astro resolves the relative path to
    `ImageMetadata` at sync/build).
  - `featuredImageAlt: z.string().optional()`
  - `description: z.string().optional()` (Sanity `description`/excerpt when it has one)
  - existing: slug, title, pubDate (coerced Date), updatedDate (coerced Date,
    optional), blogCategory (optional)
- Generated frontmatter example:

  ```yaml
  description: "…"        # only when Sanity provides one
  featuredImage: ./images/featured.jpg
  featuredImageAlt: "Alt text from Sanity"
  ```

## Assets

- New tiny idempotent one-off script `scripts/fetch-featured-images.ts`
  (lint-clean by requirement, no body regeneration):
  1. GROQ over live Sanity: `*[_type == "blog"]{"slug": slug.current, featuredImage{...,"asset": asset->{url, metadata}}, description}`
  2. For each post: if a featured image exists and isn't already local,
     download asset url to `src/content/blog/<slug>/images/featured.<ext>`
     (ext from the URL); reuse the existing file when present.
  3. Rewrite **only** the frontmatter block (insert/update
     `featuredImage` / `featuredImageAlt` / `description` when present;
     leave the body and other keys untouched). Idempotent.
- Posts without a featured image get no `featuredImage` key — still valid.

## SEO emission (BaseLayout)

Props (optional, non-blog pages unaffected):

- `description?: string` — then `meta name="description"` `og:description` `twitter:description`
- `image?: ImageMetadata` + `imageAlt?: string` — then og:image / og:image:alt and twitter:image; twitter:card = `summary_large_image` else `summary`; absolute URL = `new URL(getImage({src: image, width:1200}).src, Astro.site)`
- `publishedTime?: Date` `updatedTime?: Date` — then `article:published_time` / `article:modified_time` (ISO)
- `canonical = new URL(Astro.url.pathname, Astro.site)` — always emitted (also `og:url`), so page-specific and generic pages both canonicalize
- `og:title` (page title), `og:type` "article" on posts else "website", `twitter:title`

## Post page

- `src/pages/blog/[slug].astro` passes `data` (title, description, featuredImage, featuredImageAlt, pubDate, updatedDate) into BaseLayout and `og:type=article`.
- Description fallback: pure helper `excerptFromMarkdown(body)` in `src/lib/seo.ts` (strip imports/frontmatter/markdown ops, ~155 chars, word boundary) when `data.description` is absent.

## Testing & verification

- New pure `src/lib/seo.ts` (excerpt, canonical builder, og-image URL builder) with exhaustive vitest (100% lines/branches/functions; add to coverage.include): empty/short/long bodies, fenced code, links/images/headings stripped, word-boundary truncation; canonical URL join (path with/without query, site base), image URL join.
- Build-gate: `astro sync` + `astro build`; inspect dist/ HTML for a post WITH image (og:image/href twitter:image, absolute https, article times ISO, canonical, description) and a post WITHOUT (no og:image/twitter:image, twitter:card summary, still canonical+title).
- npm test (vitest --coverage 100%), eslint clean, tsc clean.

## Out of scope

- draft/preview states, JSON-LD schema.org markup, per-page custom excerpt authoring UX.
