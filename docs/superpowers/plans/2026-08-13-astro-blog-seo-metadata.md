# Blog SEO Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backfill blog featured images from Sanity into local assets, add them (plus description) to the blog collection, and emit OG/Twitter/canonical/description/article-time metadata from `BaseLayout` for all pages, with blog posts as rich `article` pages.

**Architecture:** A tiny idempotent one-off script fetches each post's `featuredImage` from the live Sanity API, downloads it to `src/content/blog/<slug>/images/featured.<ext>`, and updates only each `.mdx` frontmatter block. The content schema gains `featuredImage` (`image()`), `featuredImageAlt`, `description`. `BaseLayout` takes optional SEO props and emits canonical/og/twitter/description meta (post pages pass `article:` dates). A pure, exhaustively-tested `src/lib/seo.ts` provides the excerpt and URL helpers.

**Tech Stack:** Astro 7 content collections (`image()` in schema), `astro:assets` `getImage`, effect/lodash conventions already in the app, vitest (100% discipline), Node fetch for the one-off script.

**Spec:** `docs/superpowers/specs/2026-08-13-astro-blog-seo-metadata-design.md`

## Global Constraints

- Directory root: `apps/ethang-astro` (run from there or `pnpm --filter ethang-astro`).
- TDD — a failing test precedes every behavioral change; red → green → refactor (AGENTS.md).
- 100% line/branch/function/statement coverage for files in `vitest.config.ts` `coverage.include`; add new logic files to `include`.
- Conventions: lodash per-method imports (`map from "lodash/map.js"`), `effect` patterns, Tailwind v4 tokens, ESLint autofix runs on save (post-autofix diff is expected; never re-introduce what it stripped).
- Live Sanity project `3rkvshhk` / `production`, public read API, no SDK (fetch only); the user confirmed network access.
- The migration ONE-OFF that regenerates bodies stays DELETED; bodies must not be regenerated — this feature only adds frontmatter keys + downloads featured assets.
- Final gates on the branch: `vitest run --coverage` 100%, `eslint .` (from the app) zero errors, `npx tsc --noEmit` clean, `astro sync` + `astro build` green.
- Posts WITHOUT a featured image keep the schema happy (all new fields optional) and their pages simply omit image tags.

---

## File Structure

- Create `src/lib/seo.ts` (+ `src/lib/seo.test.ts`) — pure helpers: `excerptFromMarkdown`, `canonicalUrl`, `imageUrl`; add to `vitest.config.ts` `coverage.include`.
- Create `scripts/fetch-featured-images.ts` — one-off idempotent backfill (download + frontmatter patch). Lint-clean REQUIRED.
- Modify `src/content.config.ts` — schema += featuredImage (`image()`), featuredImageAlt, description.
- Modify `src/layouts/BaseLayout.astro` — SEO props + meta emission.
- Modify `src/pages/blog/[slug].astro` — pass SEO props incl. derived excerpt.
- Modified as needed: `vitest.config.ts`.

---

### Task 1: Pure SEO helpers (TDD)

**Files:** Create `src/lib/seo.ts`, `src/lib/seo.test.ts`; modify `vitest.config.ts` (coverage.include)

**Interfaces:**

- `excerptFromMarkdown(markdown: string, maxLength?: number): string` — strips frontmatter, `import` lines, fenced code, images, links (keeps link text), headings/list/blockquote markers, inline code/emphasis/strike chars, raw HTML; collapses whitespace; truncates at a word boundary with a trailing `…` (hard-cut a single long word); empty input → `""`. Default max 155.
- `canonicalUrl(pathname: string, site: string | URL): string` — `new URL(pathname, site).href`.
- `imageUrl(src: string, site: string | URL): string` — `new URL(src, site).href` (src like `/ _astro/x.jpg`).
- These are PURE (no astro imports) so vitest node env works.

- [ ] **Step 1: Write the failing test** (`src/lib/seo.test.ts`) — table-driven:
  - `excerptFromMarkdown`: empty string → `""`; short plain text unchanged; long text truncated at word boundary ending `…`; single long word → hard cut `…`; headings/lists/blockquote markers stripped; `![alt](url)` and `[text](url)` → keep `text`, drop image; fenced ```code``` removed; inline `` `code` ``/`**bold**`/`_em_`/`~strike~` flattened; `<div>`/`<b>` tags removed; `import X from "…";` lines dropped; frontmatter (`---...---`) dropped; whitespace collapsed to single spaces; words not cut mid-word when possible.
  - `canonicalUrl`: `('/blog/x', 'https://ethang.dev')` → `https://ethang.dev/blog/x`; with query (`?page=2`) preserved; site as `URL` object works; trailing-slash site input handled.
  - `imageUrl`: `('/_astro/a.jpg', 'https://ethang.dev')` → `https://ethang.dev/_astro/a.jpg`; site as `URL`.

- [ ] **Step 2: Run to confirm fail** — `node_modules/.bin/vitest run src/lib/seo.test.ts`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement** `src/lib/seo.ts`:

```ts
export const DEFAULT_EXCERPT_LENGTH = 155;

export const excerptFromMarkdown = (markdown: string, maxLength = DEFAULT_EXCERPT_LENGTH) => {
  const text = stripMarkdown(markdown);
  if (text.length <= maxLength) {
    return text;
  }
  const head = text.slice(0, maxLength);
  const lastSpace = head.lastIndexOf(" ");
  return `${lastSpace > 0 ? head.slice(0, lastSpace) : head.trimEnd()}…`;
};

const stripMarkdown = (markdown: string) => {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---/, "");
  const withoutImports = withoutFrontmatter
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("import "))
    .join("\n");
  return (
    withoutImports
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}[-*+]\s+/gm, "")
      .replace(/^\s{0,3}\d+\.\s+/gm, "")
      .replace(/\s+/g, " ")
      .replace(/[`*_~]/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
};

export const canonicalUrl = (pathname: string, site: string | URL) => new URL(pathname, site).href;

export const imageUrl = (src: string, site: string | URL) => new URL(src, site).href;
```

- [ ] **Step 4: Run to confirm pass** — `node_modules/.bin/vitest run src/lib/seo.test.ts` → PASS. Then `node_modules/.bin/vitest run src/lib/seo.test.ts --coverage` → 100% on `src/lib/seo.ts`; add cases until 100%.

- [ ] **Step 5: Update `vitest.config.ts`** — add `"src/lib/seo.ts"` to `coverage.include`.

- [ ] **Step 6: Commit**

```bash
git add apps/ethang-astro/src/lib/seo.ts apps/ethang-astro/src/lib/seo.test.ts apps/ethang-astro/vitest.config.ts
git commit -m "feat(ethang-astro): pure seo excerpt and url helpers"
```

---

### Task 2: Schema + featured image fields

**Files:** Modify `apps/ethang-astro/src/content.config.ts`

- [ ] **Step 1: Write the failing “test”** — the smallest proof is `astro sync` + a schema violation probe. Before editing, confirm the CURRENT sync succeeds; then:
  1. Temporarily add `featuredImage: image().optional()` to the schema and run `node_modules/.bin/astro sync`. With no post providing the key, sync must still succeed (proves `.optional()`).
  2. Add a snapshot probe test file `src/content.config.test.ts`? NO — `astro:content` is not importable under the plain-node vitest config (documented constraint). The executable proof is `astro sync` + the Task 5 build with real content.
- [ ] **Step 2: Implement the schema addition**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { image } from "astro:assets";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.mdx" }),
  schema: z.object({
    blogCategory: z.string().optional(),
    description: z.string().optional(),
    featuredImage: image().optional(),
    featuredImageAlt: z.string().optional(),
    pubDate: z.coerce.date(),
    slug: z.string(),
    title: z.string(),
    updatedDate: z.coerce.date().optional()
  })
});

export const collections = { blog };
```

  > Keep `z` from `astro/zod` (the deprecation was already resolved in the migration).

- [ ] **Step 3: Verify** — `node_modules/.bin/astro sync` succeeds (all existing 23 posts still validate; new fields optional).
- [ ] **Step 4: Commit**

```bash
git add apps/ethang-astro/src/content.config.ts
git commit -m "feat(ethang-astro): add featured image and description to blog schema"
```

---

### Task 3: Featured-image backfill script (live, idempotent, lint-clean)

**Files:** Create `scripts/fetch-featured-images.ts`

**Interfaces:**

- Queries live Sanity for every blog post's `slug`, `description`, and `featuredImage{alt, asset->{url}}`; downloads each featured asset to `src/content/blog/<slug>/images/featured.<ext>` (ext from the URL pathname); patches ONLY the frontmatter block (inserts `featuredImage: ./images/featured.<ext>`, `featuredImageAlt: "…"`, `description: "…"` when present, in alphabetical key order matching the repo autofix); never touches the body; idempotent (re-running is a no-op); logs a one-line summary.
- **IMPORTANT:** the script must pass `eslint .` (the app lint gate). Write it small and idiomatic: lodash per-method imports where the repo rules call for them, explicit type guards over fetched JSON (no unchecked `any`), no `await` inside loops (use `Promise.all` over rows), no `process.exit`, no try/catch (use `Effect.try`/`catchAll` or a top-level guarded main). If a specific rule keeps tripping (e.g. `unicorn/filename-case`), follow the repo's own file naming. Run `eslint` on the file and iterate until clean BEFORE committing.

- [ ] **Step 1: Write the script** (~60-90 lines). Skeleton (adapt to lint):

```ts
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

type FeaturedRow = {
  description?: null | string;
  featuredImage?: { alt?: null | string; asset?: { url?: null | string } | null } | null;
  slug: string;
};

const root = resolve(fileURLToPath(new URL("../src/content/blog", import.meta.url)));

const GROQ = `*[_type == "blog"]{"slug": slug.current, description, "featuredImage": featuredImage { alt, "asset": asset->{url}}}`;
const api = `https://3rkvshhk.api.sanity.io/v2023-01-01/data/query/production?query=${encodeURIComponent(GROQ)}`;

const download = async (url: string, dest: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
};

const patchFrontmatter = (frontmatter: string, row: FeaturedRow, featuredPath: null | string) => {
  const lines = frontmatter.split("\n").map((line) => line.trimEnd());
  const drop = (key: string) => ... // remove existing key line
  if (!isNil(row.description)) insert `description: ${JSON.stringify(row.description)}`
  if (!isNil(featuredPath)) insert `featuredImage: ${featuredPath}`
  if (!isNil(row.featuredImage?.alt)) insert `featuredImageAlt: ${JSON.stringify(row.featuredImage.alt)}`
  return [...lines].sort().join("\n");
};

const main = Effect.gen(function* () { ... fetch, rows, for each: read index.mdx, split frontmatter at the FIRST `---` pair, patch, write when changed; mkdir images/ + download when missing; count changed; console.info summary }).pipe(Effect.tryPromise);

run();
```

  > Split frontmatter: `const m = /^---\n([\s\S]*?)\n---\n?/.exec(text)`; keep `rest` untouched; rebuild as `---\n${patched}\n---\n${rest ?? ""}`.

- [ ] **Step 2: Lint-clean before commit** — run `node ../../node_modules/eslint/bin/eslint.js scripts/fetch-featured-images.ts` from `apps/ethang-astro` and fix ALL reported errors following the repo's conventions (AGENTS.md: examine context; do not blindly apply every suggestion, but do meet the gate). Script file must end at 0 errors.
- [ ] **Step 3: Run it** — `node scripts/fetch-featured-images.ts` (from `apps/ethang-astro`; Node 24 type-strips TS). Expected: downloads featured images for posts that have them in Sanity, patches frontmatter; summary line logged. Verify: 2-3 posts now have `featuredImage: ./images/featured.*` and the files exist on disk; a post WITHOUT a featured image has no `featuredImage` key.
- [ ] **Step 4: Re-run (idempotence)** — run again; second run must only log 0 changes / no diffs.
- [ ] **Step 5: Build gate** — `node_modules/.bin/astro sync` then `node_modules/.bin/astro build` must succeed with the new schema fields populated (this also proves `image()` resolves relative `./images/featured.*`).
- [ ] **Step 6: Commit**

```bash
git add apps/ethang-astro/scripts/fetch-featured-images.ts apps/ethang-astro/src/content
git commit -m "feat(ethang-astro): backfill featured images from sanity into posts"
```

---

### Task 4: SEO metadata in BaseLayout

**Files:** Modify `apps/ethang-astro/src/layouts/BaseLayout.astro`

**Interfaces:** Props += optional `description?: string`, `image?: ImageMetadata`, `imageAlt?: string`, `publishedTime?: Date`, `updatedTime?: Date`, `isArticle?: boolean`, `canonicalPath?: string`. All old props (title) unchanged; other pages pass nothing new and still get canonical/og:title.

- [ ] **Step 1: Failing proof first** — extend the layout, then use the Task 5 build to verify emitted HTML (the layout itself is `.astro`; its executable proof is the built HTML, checked in Task 6). Verify the code shape below compiles: `node_modules/.bin/astro sync` then a scratch `astro build` after both Tasks 4+5 are in place.
- [ ] **Step 2: Implement** — in `BaseLayout.astro` frontmatter add:

```astro
import { getImage } from "astro:assets";
import { canonicalUrl, imageUrl } from "../lib/seo.ts";
import isNil from "lodash/isNil.js";

interface Props {
  title?: string;
  description?: string;
  image?: ImageMetadata;
  imageAlt?: string;
  publishedTime?: Date;
  updatedTime?: Date;
  isArticle?: boolean;
  canonicalPath?: string;
}

const {
  title = "Ethan Glover",
  description,
  image,
  imageAlt,
  publishedTime,
  updatedTime,
  isArticle = false,
  canonicalPath
} = Astro.props;

const site = Astro.site;
const canonical =
  site === undefined
    ? undefined
    : canonicalUrl(canonicalPath ?? Astro.url.pathname, site);
const ogImage =
  isNil(image) || site === undefined
    ? null
    : await getImage({ src: image, width: 1200, format: "jpeg", quality: 80 });
const ogImageHref = isNil(ogImage) ? null : imageUrl(ogImage.src, site);
const hasDescription = typeof description === "string" && description.length > 0;
```

  Then in `<head>` (after `<title>`) emit, always when safe, else conditionally:

```astro
<link rel="canonical" href={canonical} />
<meta property="og:title" content={title} />
<meta property="og:type" content={isArticle ? "article" : "website"} />
{canonical ? <meta property="og:url" content={canonical} /> : null}
{hasDescription ? <meta name="description" content={description} /> : null}
{hasDescription ? <meta property="og:description" content={description} /> : null}
{hasDescription ? <meta name="twitter:description" content={description} /> : null}
{!isNil(publishedTime) ? <meta property="article:published_time" content={publishedTime.toISOString()} /> : null}
{!isNil(updatedTime) ? <meta property="article:modified_time" content={updatedTime.toISOString()} /> : null}
{nil ogImageHref ? null : (
  <>
    <meta property="og:image" content={ogImageHref} />
    {imageAlt ? <meta property="og:image:alt" content={imageAlt} /> : null}
    <meta property="og:image:width" content={String(ogImage.width)} />
    <meta property="og:image:height" content={String(ogImage.height)} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImageHref} />
  </>
)}
{isNil(ogImageHref) ? <meta name="twitter:card" content="summary" /> : null}
{canonical ? <meta name="twitter:url" content={canonical} /> : null}
```

  > Guard `ogImage.width/height` only when Astro provides them; if `getImage` output lacks width/height (unexpected), omit those two tags — keep build green.

- [ ] **Step 3: Verify no regression for non-blog pages** — built HTML for `/` and `/tips/scroll-containers` still has title, canonical, og:title, og:type website, twitter:card summary, and NO description/og:image/article tags (they pass no new props).
- [ ] **Step 4: Commit**

```bash
git add apps/ethang-astro/src/layouts/BaseLayout.astro
git commit -m "feat(ethang-astro): seo meta tags in base layout"
```

---

### Task 5: Blog post pages pass SEO metadata

**Files:** Modify `apps/ethang-astro/src/pages/blog/[slug].astro`

- [ ] **Step 1: Implement** — pass the post's SEO data into BaseLayout, deriving the description from the raw body when no frontmatter description:

```astro
---
import { render } from "astro:content";
import isNil from "lodash/isNil.js";

import BaseLayout from "../../layouts/BaseLayout.astro";
import Heading from "../../components/ui/Heading.astro";
import Page from "../../components/ui/Page.astro";
import { fetchBlogPost, fetchBlogSlugs } from "../../lib/blog.ts";
import { excerptFromMarkdown } from "../../lib/seo.ts";

export const prerender = true;

export const getStaticPaths = async () => {
  const slugs = await fetchBlogSlugs();
  return slugs.map((slug) => ({ params: { slug } }));
};

const { slug } = Astro.params;
const post = isNil(slug) ? null : await fetchBlogPost(slug);
const rendered = isNil(post) ? null : await render(post);
const { Content } = rendered ?? { Content: () => null };
const description =
  post === null
    ? undefined
    : post.data.description ?? excerptFromMarkdown(post.body ?? "");
---

<BaseLayout
  title={post?.data.title ?? "Blog Post"}
  description={description}
  image={post?.data.featuredImage}
  imageAlt={post?.data.featuredImageAlt}
  publishedTime={post?.data.pubDate}
  updatedTime={post?.data.updatedDate}
  isArticle={!isNil(post)}
>
...
```

  > Keep the existing page body markup identical; only the `<BaseLayout>` open tag changes. `post.body` is the raw markdown string the glob loader stores (retainBody default true) — confirm `entry.body` is populated when `render(post)` works; if `body` is ever undefined, excerpt falls back to the empty string safely.

- [ ] **Step 2: Build + spot HTML** — `node_modules/.bin/astro sync && node_modules/.bin/astro build` green; inspect `dist/blog/<some-slug-with-image>/index.html` contains `og:image` (absolute https), `twitter:image`, `article:published_time`, canonical, description; a post WITHOUT featured image has no `og:image` and `twitter:card` = `summary`.
- [ ] **Step 3: Commit**

```bash
git add apps/ethang-astro/src/pages/blog/[slug].astro
git commit -m "feat(ethang-astro): pass blog seo metadata from post pages"
```

---

### Task 6: Final gates

**Files:** none new

- [ ] **Step 1: Full suite** — from `apps/ethang-astro`: `node_modules/.bin/vitest run --coverage` → all pass, 100% on include (now includes `src/lib/seo.ts`).
- [ ] **Step 2: Lint** — `node ../../node_modules/eslint/bin/eslint.js .` from `apps/ethang-astro` → 0 errors.
- [ ] **Step 3: Types** — `npx --no-install tsc --noEmit` (app tsconfig) → no app errors (3 pre-existing unrelated `src/actions` errors already documented are out of scope).
- [ ] **Step 4: Build + SEO evidence** — `astro sync` + `astro build` green; grep dist/blog HTML: one post with featured image has og:image/twitter:image/canonical/article:published_time/description; one post without has summary card + no og:image; `/` and `/tips` pages have canonical + og:title only.
- [ ] **Step 5: Commit any strays**, then **final whole-branch review** (merge-base..HEAD) with the spec, and the finish menu.

---

## Self-Review

- [x] Spec coverage: assets (T3), schema (T2), layout emission incl. title/description/publishedAt/updatedAt/canonical (T4), post page wiring (T5), testing/coverage (T1, T6).
- [x] Placeholder scan: the only prose-“skeleton” (T3) is a starting shape the implementer MUST lint-fix; behavior constraints are concrete.
- [x] Type consistency: `BaseLayout` props names match `[slug].astro` usage (description/image/imageAlt/publishedTime/updatedTime/isArticle/canonicalPath); `seo.ts` exports match Task 4 imports (excerptFromMarkdown/canonicalUrl/imageUrl).
