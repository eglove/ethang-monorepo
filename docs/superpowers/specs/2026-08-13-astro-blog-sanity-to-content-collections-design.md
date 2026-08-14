# Migrate Blog: Sanity → Astro Content Collections + MDX

**Date:** 2026-08-13
**App:** `apps/ethang-astro`
**Status:** Approved design (Approach A — Idiomatic MDX)

## Objective

Replace the Sanity-backed blog with an Astro Content Collections blog backed by
local markdown (MDX), performing a full migration of every existing post from
Sanity. Preserve existing routes, slugs, pagination, and (closely) the current
rendering. Remove all Sanity dependencies afterward.

See <https://docs.astro.build/en/guides/content-collections/>.

## Current state

- Data layer: `src/lib/blog.ts` queries Sanity GROQ via `@sanity/client`
  (`projectId: "3rkvshhk"`, dataset `production`). `BLOG_PAGE_SIZE = 10`.
- Client: `src/lib/sanity.ts` (client + image URL builder).
- Body format: Sanity Portable Text (`_type: "blog"`), rendered by
  `src/components/SanityText.astro` → `portabletext/{Spans,image,code,video,quote}.astro`
  plus `ui/{CodeBlock,Blockquote,InlineLink,Heading}.astro`.
- Routes: `src/pages/blog/index.astro`, `src/pages/blog/page/[page].astro`,
  `src/pages/blog/[slug].astro`; `prerender = true` throughout.
- Config: `cdn.sanity.io` in `astro.config.mjs` `image.remotePatterns`.
- Deps: `@sanity/client`, `@sanity/image-url`, `astro-portabletext`,
  `@portabletext/react`.

## Target state

Content Collections (Astro 7 content layer) feeding the same routes.

1. **Collection config** — `src/content.config.ts`:

   ```ts
   import { glob } from "astro/loaders";
   import { defineCollection, z } from "astro:content";

   const blog = defineCollection({
     loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
     schema: z.object({
       title: z.string(),
       slug: z.string(),
       pubDate: z.coerce.date(),
       updatedDate: z.coerce.date().optional(),
       blogCategory: z.string().optional(),
       featuredImage: image().optional()
     })
   });
   export const collections = { blog };
   ```

   (`image()` from `astro:assets`.) `astro sync` generates `.astro/types.d.ts`.
   Each post: `src/content/blog/<slug>/index.mdx` + `images/*`.

2. **Migration script (TDD)** — `scripts/migrate-sanity-blog.ts`:
   - Fetches every `_type == "blog"` via GROQ (full body, all `image` assets +
     `featuredImage`, video, quote blocks).
   - Downloads each image from `cdn.sanity.io` into `src/content/blog/<slug>/images/`.
   - Writes `index.mdx` (YAML frontmatter + MDX body).
   - Pure converter `portableTextBlocksToMdx()` lives in `scripts/lib/convert.ts`
     with exhaustive vitest coverage (see Testing). Block mappings:
     - normal → paragraph; h1–h4 → `#…####`; blockquote style → `>`
     - list + listItem (number/bullet) → grouped `1.`/`-` lists
     - inline spans → markdown `**`, `*`, `` ` ``, `~~`, links `[t](h)`;
       `underline` decorator → `<u>…</u>`
     - code → fenced ```lang```; image → `![alt](./images/name.ext)`
       (custom `<PostImage>` when caption present)
     - video / videoEmbed → `<Video url=… title=…/>`
     - quote / blockquote → `<Quote author source sourceUrl>…</Quote>`

3. **Rendering** — `[slug].astro`: `getCollection('blog', …)` by `slug` +
   `render(entry)`. List/pagination: sort `getCollection('blog')` by
   `pubDate` desc, slice per page (keep `BLOG_PAGE_SIZE=10`, `toMaxPages`,
   `toPageHref`). Reuse `ui/CodeBlock.astro` + `ui/Blockquote.astro`; add
   `ui/VideoEmbed.astro` (port existing video logic) and `ui/PostImage.astro`
   (Astro local `Image`, figure + optional caption). **Delete**:
   `SanityText.astro`, `components/portabletext/*`, `lib/sanity.ts`; gut
   `lib/blog.ts` to collection queries (drop `BLOG_*_QUERY`).
   `lib/image.ts` `resolveImageDimensions` is superseded by Astro local image
   metadata — remove usage; keep only if still referenced.

4. **Config & deps** — add `@astrojs/mdx` integration; remove
   `cdn.sanity.io` remotePatterns; remove `@sanity/client`,
   `@sanity/image-url`, `astro-portabletext`, `@portabletext/react`.

5. **Styling** — scoped article CSS in `BaseLayout` (wrapper class around
   `<Content/>`) replicating current InlineLink primary, `<code>` chip
   (night-owl palette), blockquote, heading spacing. No per-span components.

## Testing

- Converter (`portableTextBlocksToMdx`): vitest table-driven over every block
  type + state — paragraph/heading/blockquote, list grouping (zero/single/N
  items, number vs bullet), empty blocks (skip), inline decorator combos,
  links (external vs internal), code (with/without lang), image (with/without
  caption, missing alt), video (videoId / watch URL / youtu.be / /embed/, none),
  quote (with/without author/source/sourceUrl). 100% coverage target.
- Blog lib: pagination helpers (already tested? add for collection) and slug
  filtering.
- Migration converter: no-network (fixtures + witness-written output).

## Out of scope

RSS in this app, editing UX, Sanity preview/Draft mode (none existed), schema
formatting changes beyond the blog.

## Risks

- Sanity API version in current client is `"1"`; the migration script will use
  `useCdn: false` + explicit apiVersion and dataset; verify connectivity when
  run.
- Image volume unknown; download with size limits and graceful failure logging.
- `astro sync` must run before build/typecheck so `.astro/types.d.ts` exists.
