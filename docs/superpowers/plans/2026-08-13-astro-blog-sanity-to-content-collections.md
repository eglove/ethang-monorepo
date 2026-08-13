# Migrate Blog: Sanity → Astro Content Collections + MDX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Sanity-backed blog in `apps/ethang-astro` with Astro Content Collections (local MDX), migrating every existing post from Sanity and removing all Sanity code/deps.

**Architecture:** A pure, exhaustively-tested Portable-Text→MDX converter feeds a one-off migration script that fetches posts from the Sanity HTTP API, downloads images locally, and writes `src/content/blog/<slug>/index.mdx`. The app pages then read the `blog` content collection (Astro 7 content layer, `glob` loader) instead of Sanity; Sanity-only components/libs/deps are deleted.

**Tech Stack:** Astro 7 content collections (`astro:content`), MDX (`@astrojs/mdx`), zod (`z` re-exported from `astro:content`), Vitest, lodash, Node ≥ 24 + built-in `fetch`.

**Spec:** `docs/superpowers/specs/2026-08-13-astro-blog-sanity-to-content-collections-design.md`

## Global Constraints

- Directory root: `apps/ethang-astro` (run from there or `pnpm --filter ethang-astro`).
- TDD — failing test first for every behavioral change (AGENTS.md).
- 100% line/branch/function/statement coverage for files in `vitest.config.ts` `coverage.include`; add new logic files to `include`.
- Conventions: lodash per-method imports (`map from "lodash/map.js"`), `effect` domains, Tailwind v4 tokens from `lib/ui.ts`.
- Preserve routes, slugs, and `BLOG_PAGE_SIZE = 10` exactly.
- Sort by `pubDate`/`_createdAt` descending (current `order(_createdAt desc)`).
- Sanity project `3rkvshhk`, dataset `production`, read via public HTTP API (no SDK/token).
- After migration delete: `@sanity/client`, `@sanity/image-url`, `astro-portabletext`, `@portabletext/react`, `src/lib/sanity.ts`, `src/lib/image.ts`, `src/components/SanityText.astro`, `src/components/portabletext/*`, and `cdn.sanity.io` `image.remotePatterns`.

---

## File Structure

- `scripts/lib/portableTextToMdx.ts` — pure PT→MDX converter.
- `scripts/lib/portableTextToMdx.test.ts` — exhaustive converter tests.
- `scripts/migrate-sanity-blog.ts` — fetch + download + write `.mdx`.
- `src/content.config.ts` — blog collection schema.
- `src/content/blog/<slug>/index.mdx` + `images/*` — migrated posts.
- `src/lib/blog.ts` — thin collection queries.
- `src/lib/blog-pagination.ts` — pure helpers (`toMaxPages`, `toPageHref`) + test.
- `src/components/ui/VideoEmbed.astro`, `src/components/ui/PostImage.astro` — MDX components.
- Modified: `astro.config.mjs`, `package.json`, `vitest.config.ts`, `src/styles/global.css`, `src/pages/blog/*`, `src/components/BlogList.astro`, `src/pages/index.astro`.
- Deleted: `src/lib/sanity.ts`, `src/lib/image.ts`(+test), `src/components/SanityText.astro`, `src/components/portabletext/`.

---

### Task 1: Portable-Text → MDX converter (pure, TDD)

**Files:** Create `scripts/lib/portableTextToMdx.ts`, `scripts/lib/portableTextToMdx.test.ts`

**Interfaces:** Produces `portableTextToMdx(blocks: unknown[], resolveImage: (imageUrl: string | undefined) => string | null): MdxResult` where `MdxResult = { body: string; images: { variable: string; src: string; alt: string; caption: string }[] }`. `body` has no frontmatter/imports; `images` lists captioned images needing an `import` (variables `img0…`, referenced as `src={img0}`). Task 4 prepends frontmatter + imports.

Mappings: `block` normal→paragraph, h1–h4→`#…####`, blockquote style→`>`, `listItem` number/bullet→grouped `1.`/`-` lists (consecutive same `listItem` join; mirrors old `SanityText.astro` grouping). `image`→`![alt](path)` or `<PostImage>` when caption present. `code`→fenced (fence length = max backtick run + 1). `video`/`videoEmbed`→`<VideoEmbed …/>`. `quote`/`blockquote`→`<Blockquote …>text</Blockquote>` (attrs omitted when empty). Inline spans: code innermost, then `~~strike~~`, `<u>underline</u>`, `*em*`, `**strong**`, link `[text](href)` outermost; raw text markdown-escaped before wrapping.

- [ ] **Step 1: Write the failing test** (`scripts/lib/portableTextToMdx.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { portableTextToMdx } from "./portableTextToMdx.ts";

const resolveImage = (url: string | undefined) => (url ? "./images/x.png" : null);

describe("portableTextToMdx", () => {
  it("converts a heading, paragraph, and inline decorators", () => {
    const { body } = portableTextToMdx(
      [
        { _type: "block", style: "h2", children: [{ text: "Hello" }] },
        { _type: "block", style: "normal",
          children: [{ text: "bold " }, { text: "x", marks: ["strong"] }, { text: " link", marks: [] }],
          markDefs: [{ _key: "k1", _type: "link", href: "/about" }] }
      ],
      resolveImage
    );
    expect(body).toBe("## Hello\n\n**x**\n\n");
  });
});
```

- [ ] **Step 2: Run to confirm it fails** — `node_modules/.bin/vitest run scripts/lib/portableTextToMdx.test.ts` (from `apps/ethang-astro`). Expected: FAIL, `cannot find module './portableTextToMdx.ts'`.

- [ ] **Step 3: Implement** `scripts/lib/portableTextToMdx.ts`:

```ts
const escapeMarkdown = (text: string) =>
  text.replace(/[\\`*\[\]<>&\(\)]/g, (c) => `\\${c}`);
const isString = (v: unknown): v is string => typeof v === "string";

const inline = (spans: unknown, markDefs: unknown): string => {
  const out: string[] = [];
  for (const raw of (spans as unknown[] | undefined) ?? []) {
    const span = (raw ?? {}) as { marks?: string[]; text?: string };
    if (!isString(span.text)) continue;
    const marks = span.marks ?? [];
    const annotKey = marks.find(
      (m) => !["strong", "em", "code", "underline", "strike-through"].includes(m)
    );
    const annot = ((markDefs ?? []) as Array<{ _key?: string; _type?: string; href?: string }>)
      .find((d) => d._key === annotKey);
    const href = annot?._type === "link" && isString(annot.href) ? annot.href : undefined;
    let inner = escapeMarkdown(span.text);
    if (marks.includes("code")) inner = "`" + inner + "`";
    if (marks.includes("strike-through")) inner = "~~" + inner + "~~";
    if (marks.includes("underline")) inner = "<u>" + inner + "</u>";
    if (marks.includes("em")) inner = "*" + inner + "*";
    if (marks.includes("strong")) inner = "**" + inner + "**";
    if (href) inner = "[" + inner + "](" + href.replace(/\)/g, "%29") + ")";
    out.push(inner);
  }
  return out.join("");
};

export const portableTextToMdx = (
  blocks: unknown[],
  resolveImage: (imageUrl: string | undefined) => string | null
) => {
  const body: string[] = [];
  const images: { variable: string; src: string; alt: string; caption: string }[] = [];
  const asObj = (b: unknown): Record<string, unknown> => (b ?? {}) as Record<string, unknown>;
  const groups: Array<{ listItem: string; items: string[] }> = [];

  const flushList = () => {
    for (const g of groups) {
      if (g.items.length === 0) continue;
      g.items.forEach((item, i) =>
        body.push(g.listItem === "number" ? `${i + 1}. ${item}` : `- ${item}`)
      );
      body.push("");
    }
    groups.length = 0;
  };

  for (const blockRaw of blocks ?? []) {
    const block = asObj(blockRaw);
    const type = block["_type"];

    if (type === "block") {
      const listItem = isString(block["listItem"]) ? (block["listItem"] as string) : null;
      const text = inline(block["children"], block["markDefs"]);
      const last = groups.at(-1);
      if (listItem) {
        if (last && last.listItem === listItem) last.items.push(text);
        else groups.push({ listItem, items: [text] });
        continue;
      }
      flushList();
      const style = block["style"];
      if (!text && style !== "normal") continue;
      if (style === "h1") body.push(`# ${text}`);
      else if (style === "h2") body.push(`## ${text}`);
      else if (style === "h3") body.push(`### ${text}`);
      else if (style === "h4") body.push(`#### ${text}`);
      else if (style === "blockquote") body.push(`> ${text}`);
      else if (text) body.push(text);
      else continue;
      body.push("");
    } else if (type === "image") {
      const asset = asObj(block["asset"]);
      const relative = resolveImage(isString(asset["url"]) ? (asset["url"] as string) : undefined);
      if (!relative) continue;
      const alt = isString(block["alt"]) ? (block["alt"] as string) : "";
      const caption = isString(asset["caption"]) ? (asset["caption"] as string) : "";
      if (caption) {
        const variable = `img${images.length}`;
        images.push({ variable, src: relative, alt, caption });
        body.push(`<PostImage src={${variable}} alt="${alt.replace(/"/g, "&quot;")}" caption="${caption.replace(/"/g, "&quot;")}" />`);
      } else {
        body.push(`![${alt.replace(/\]/g, "\\]")}](${relative})`);
      }
      body.push("");
    } else if (type === "code") {
      const code = isString(block["code"]) ? (block["code"] as string) : "";
      if (!code) continue;
      const lang = isString(block["language"]) ? (block["language"] as string) : null;
      const fences = Math.max(...(code.match(/`+/g)?.map((f) => f.length) ?? [0])) + 1;
      const fence = "`".repeat(fences);
      body.push(`${fence}${lang ?? ""}\n${code}\n${fence}`);
      body.push("");
    } else if (type === "video" || type === "videoEmbed") {
      const attrs: string[] = [];
      for (const key of ["videoId", "url", "title"]) {
        if (isString(block[key]) && block[key]) attrs.push(`${key}="${(block[key] as string).replace(/"/g, "&quot;")}"`);
      }
      if (attrs.length) body.push(`<VideoEmbed ${attrs.join(" ")} />`);
      body.push("");
    } else if (type === "quote" || type === "blockquote") {
      const quote = isString(block["quote"]) ? (block["quote"] as string) : "";
      if (!quote) continue;
      const attrs: string[] = [];
      for (const key of ["author", "source", "sourceUrl"]) {
        if (isString(block[key]) && block[key]) attrs.push(`${key}="${(block[key] as string).replace(/"/g, "&quot;")}"`);
      }
      body.push(`<Blockquote${attrs.length ? " " + attrs.join(" ") : ""}>${escapeMarkdown(quote)}</Blockquote>`);
      body.push("");
    }
  }
  flushList();
  return { body: body.join("\n"), images };
};
```

- [ ] **Step 4: Run to confirm it passes** — `node_modules/.bin/vitest run scripts/lib/portableTextToMdx.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/scripts/lib/portableTextToMdx.ts apps/ethang-astro/scripts/lib/portableTextToMdx.test.ts
git commit -m "feat(ethang-astro): portable-text to mdx converter"
```

---

### Task 2: Exhaustive converter tests

**Files:** Modify `scripts/lib/portableTextToMdx.test.ts`

- [ ] **Step 1: Add tests** covering every state:
  - `block` styles `normal`, `h1`, `h2`, `h3`, `h4`, `blockquote`.
  - Empty-text blocks skipped (`normal` empty `children`; `h2` empty).
  - Lists: bullet vs number; single item; N items; interleaved bullet→number→bullet flush.
  - Inline: each decorator, nesting combos (code+strong, em inside strong), links via `markDefs` (external/https + internal `/about`), mark referencing missing `markDef` (decorators, no link).
  - Escaping: literal `* _ \` [ ] < & ( )` in prose → no accidental emphasis.
  - `code`: with/without language; code containing triple backticks (fence grows).
  - `image`: with/without caption; missing alt; resolver→null skipped; `"` in caption/alt escaped.
  - `video`/`videoEmbed`: `videoId`, `url`, `title` present/absent; none → nothing.
  - `quote`/`blockquote`: with/without author/source/sourceUrl; empty quote skipped; `"` escaped.
  - Empty `blocks` → empty body, no images. Use `it.each` generously.

- [ ] **Step 2: Run with coverage** — `node_modules/.bin/vitest run scripts/lib/portableTextToMdx.test.ts --coverage`. Expected: PASS, 100% on `portableTextToMdx.ts`. Add cases until 100%.

- [ ] **Step 3: Commit**

```bash
git add apps/ethang-astro/scripts/lib/portableTextToMdx.test.ts
git commit -m "test(ethang-astro): exhaustive portable-text-to-md coverage"
```

---

### Task 3: Content collection config + MDX dependency

**Files:** Create `src/content.config.ts`; modify `package.json`, `astro.config.mjs`, `src/pages/index.astro`.

- [ ] **Step 1: Add dependency** — from `apps/ethang-astro`: `pnpm add @astrojs/mdx`. Confirm its `peerDependencies` allow `astro ^7`. If not, pin the matching major (`@astrojs/mdx@<major>`). Verify later via build (Task 5/6).

- [ ] **Step 2: Create `src/content.config.ts`**

```ts
import { glob } from "astro/loaders";
import { image } from "astro:assets";
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

- [ ] **Step 3: Add MDX to `astro.config.mjs`** — `import mdx from "@astrojs/mdx";` and `integrations: [mdx(), sitemap()]`.

- [ ] **Step 4: Config — highlight theme + drop Sanity remote pattern.** Set `markdown: { shikiConfig: { theme: "night-owl" } }` and remove the `cdn.sanity.io` entry from `image.remotePatterns` (empty it). If `night-owl` is not a bundled theme, use `one-dark-pro` and note the palette change; `.astro-code` CSS in Task 7 scopes the look.

- [ ] **Step 5: Generate types** — `node_modules/.bin/astro sync`. Expected: `.astro/types.d.ts` updated with `blog` entry (empty collection OK).

- [ ] **Step 6: Clean code-smell** — in `src/pages/index.astro`, remove `"Sanity (CMS)"` from the `stack` array.

- [ ] **Step 7: Commit** (include root `pnpm-lock.yaml` change)

```bash
git add apps/ethang-astro/src/content.config.ts apps/ethang-astro/astro.config.mjs apps/ethang-astro/src/pages/index.astro apps/ethang-astro/package.json pnpm-lock.yaml
git commit -m "feat(ethang-astro): blog content collection config + mdx integration"
```

---

### Task 4: Migration script

**Files:** Create `scripts/migrate-sanity-blog.ts`. Consumes `portableTextToMdx` (Task 1).

**Interfaces:** Produces `src/content/blog/<slug>/index.mdx` (YAML frontmatter + MDX imports + body) and `images/`. Idempotent (overwrites). Dependency-free for Sanity — uses `fetch` against the public query API. Log each post; on image download failure, log and continue.

- [ ] **Step 1: Write the script**

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portableTextToMdx } from "./lib/portableTextToMdx.ts";

const PROJECT = "3rkvshhk";
const DATASET = "production";
const OUT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../src/content/blog");

const GROQ = `*[_type == "blog"] | order(_createdAt desc){
  _id, _createdAt, _updatedAt, title, blogCategory->{title},
  "slug": slug.current,
  "featuredImage": featuredImage { alt, "asset": asset->{url, metadata{dimensions{aspectRatio,height,width}}} },
  "body": body[]{ ...,
    _type == "image" => { ..., "asset": asset->{url, metadata{dimensions{aspectRatio,height,width}}} },
    _type == "videoEmbed" => { ..., "url": url },
    _type == "blockquote" || _type == "quote" => { ... }
  }
}`;
const apiUrl = `https://${PROJECT}.api.sanity.io/v2023-01-01/data/query/${DATASET}?query=${encodeURIComponent(GROQ)}`;
const asString = (v: unknown) => (typeof v === "string" ? v : undefined);
const esc = (v: string) => v.replace(/"/g, '\\"');

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status} ${await res.text()}`);
  const { result } = (await res.json()) as { result: Array<Record<string, unknown>> };
  for (const doc of result) {
    const slug = asString(doc["slug"]);
    if (!slug) { console.warn("skip doc without slug", doc["_id"]); continue; }
    const dir = join(OUT, slug);
    const imgDir = join(dir, "images");
    await mkdir(imgDir, { recursive: true });

    const bodies = Array.isArray(doc["body"]) ? (doc["body"] as any[]) : [];
    const urls = new Set<string>();
    for (const b of bodies) { const u = asString((b as any)?.asset?.url); if (u) urls.add(u); }
    const feat = asString((doc["featuredImage"] as any)?.asset?.url);
    if (feat) urls.add(feat);

    const toFile = new Map<string, string>();
    for (const url of urls) {
      const ext = (basename(new URL(url).pathname).split(".").pop() ?? "jpg").toLowerCase();
      const file = `image-${toFile.size}.${ext}`;
      try { await download(url, join(imgDir, file)); toFile.set(url, `./images/${file}`); }
      catch (e) { console.warn(`failed ${url}:`, e); }
    }

    const resolveImage = (url: string | undefined) => (url ? (toFile.get(url) ?? null) : null);
    const { body, images } = portableTextToMdx(bodies, resolveImage);
    const imports = [
      `import Blockquote from "../../../../components/ui/Blockquote.astro";`,
      `import PostImage from "../../../../components/ui/PostImage.astro";`,
      `import VideoEmbed from "../../../../components/ui/VideoEmbed.astro";`,
      ...images.map((img) => `import ${img.variable} from ${JSON.stringify(img.src)};`)
    ].join("\n");
    const fm = [
      `title: "${esc(asString(doc["title"]) ?? "")}"`,
      `slug: "${esc(slug)}"`,
      `pubDate: "${asString(doc["_createdAt"]) ?? ""}"`,
      ...(asString(doc["_updatedAt"]) ? [`updatedDate: "${asString(doc["_updatedAt"])}"`] : []),
      ...(asString((doc["blogCategory"] as { title?: string } | null)?.title)
        ? [`blogCategory: "${esc((doc["blogCategory"] as { title: string }).title)}"`] : []),
      ...(feat ? [`featuredImage: "${toFile.get(feat) ?? ""}"`] : [])
    ].join("\n");
    await writeFile(join(dir, "index.mdx"), `---\n${fm}\n---\n\n${imports}\n\n${body.trim()}\n`);
    console.log(`wrote ${slug} (${body.length} chars, ${images.length} imgs)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
```

> Post dir is `src/content/blog/<slug>/`, mdx at `<slug>/index.mdx`; the fixed component import path `../../../../components/ui/…` resolves from `src/content/blog/<slug>/`. Run from `apps/ethang-astro`: `node scripts/migrate-sanity-blog.ts`. Requires the public Sanity dataset; if network-blocked, run against a saved GROQ JSON fixture instead.

- [ ] **Step 2: Run migration** — `node scripts/migrate-sanity-blog.ts`. Expected: `wrote <slug> …` per post; inspect 1–2 generated files (frontmatter, imports, body).

- [ ] **Step 3: Verify collection loads** — `node_modules/.bin/astro sync`. Expected: entries picked up.

- [ ] **Step 4: Commit**

```bash
git add apps/ethang-astro/scripts apps/ethang-astro/src/content
git commit -m "feat(ethang-astro): migrate sanity blog posts to content collections mdx"
```

---

### Task 5: Pure pagination helpers + thin blog queries

**Files:** Create `src/lib/blog-pagination.ts`, `src/lib/blog-pagination.test.ts`; rewrite `src/lib/blog.ts`; modify `vitest.config.ts`.

**Interfaces:**

- `toMaxPages(total: number): number` — `<= 0` → `1`, else `Math.ceil(total / BLOG_PAGE_SIZE)`.
- `toPageHref(page: number): string` — `page <= 1` → `"/blog"`, else `/blog/page/${page}`.
- `BLOG_PAGE_SIZE = 10` (re-exported from `blog.ts`).
- `lib/blog.ts`: `fetchBlogPage(page) → { posts, maxPages, total }`, `fetchBlogMaxPages() → number`, `fetchBlogSlugs() → string[]`, `fetchBlogPost(slug) → entry | null`. `BlogListPost = { data: { title: string; slug: string; blogCategory?: string; updatedDate?: Date } }`.

- [ ] **Step 1: Failing tests** `src/lib/blog-pagination.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toMaxPages, toPageHref } from "./blog-pagination.ts";

describe("toMaxPages", () => {
  it.each([[0, 1], [1, 1], [9, 1], [10, 1], [11, 2], [100, 10]])(
    "total %i → pages %i", (total, pages) => expect(toMaxPages(total)).toBe(pages)
  );
  it("negative clamps to 1", () => expect(toMaxPages(-5)).toBe(1));
});
describe("toPageHref", () => {
  it.each([[1, "/blog"], [0, "/blog"], [2, "/blog/page/2"]])(
    "page %i → %s", (page, href) => expect(toPageHref(page)).toBe(href)
  );
});
```

- [ ] **Step 2: Run to confirm fail** — `node_modules/.bin/vitest run src/lib/blog-pagination.test.ts`. Expected: FAIL (`cannot find module`).

- [ ] **Step 3: Implement** `src/lib/blog-pagination.ts` — copy `toMaxPages`/`toPageHref`/`BLOG_PAGE_SIZE` logic verbatim from current `lib/blog.ts`.

- [ ] **Step 4: Run to confirm pass** — `node_modules/.bin/vitest run src/lib/blog-pagination.test.ts`. Expected: PASS.

- [ ] **Step 5: Rewrite `src/lib/blog.ts`** (drop Sanity):

```ts
import { getCollection } from "astro:content";
import sortBy from "lodash/sortBy.js";
import { BLOG_PAGE_SIZE, toMaxPages, toPageHref } from "./blog-pagination.ts";

export { BLOG_PAGE_SIZE, toMaxPages, toPageHref };

export type BlogListPost = {
  data: { title: string; slug: string; blogCategory?: string; updatedDate?: Date };
};
export type BlogPostEntry = BlogListPost;

const postsDesc = async () =>
  sortBy(await getCollection("blog"), (p) => -p.data.pubDate.getTime());

export const fetchBlogSlugs = async () => (await postsDesc()).map((p) => p.data.slug);
export const fetchBlogMaxPages = async () => toMaxPages((await getCollection("blog")).length);
export const fetchBlogPage = async (page: number) => {
  const posts = await postsDesc();
  const start = (page - 1) * BLOG_PAGE_SIZE;
  return {
    maxPages: toMaxPages(posts.length),
    posts: posts.slice(start, start + BLOG_PAGE_SIZE),
    total: posts.length
  };
};
export const fetchBlogPost = async (slug: string) =>
  (await postsDesc()).find((p) => p.data.slug === slug) ?? null;
```

> `astro:content` is not importable in the plain-node vitest env, so all pure logic lives in `blog-pagination.ts`; `blog.ts` is thin I/O verified via `astro build` (Task 6).

- [ ] **Step 6: Update `vitest.config.ts`** `coverage.include` — add `"src/lib/blog-pagination.ts"` and `"scripts/lib/portableTextToMdx.ts"`. (Remove `"src/lib/image.ts"` only once that file is deleted in Task 8.)

- [ ] **Step 7: Run full unit suite** — `node_modules/.bin/vitest run --coverage`. Expected: pass, 100% on include list.

- [ ] **Step 8: Commit**

```bash
git add apps/ethang-astro/src/lib/blog-pagination.ts apps/ethang-astro/src/lib/blog-pagination.test.ts apps/ethang-astro/src/lib/blog.ts apps/ethang-astro/vitest.config.ts
git commit -m "feat(ethang-astro): blog collection queries + pure pagination helpers"
```

---

### Task 6: Rewire blog routes + BlogList

**Files:** Modify `src/pages/blog/index.astro`, `src/pages/blog/page/[page].astro`, `src/pages/blog/[slug].astro`, `src/components/BlogList.astro`.

- [ ] **Step 1: `index.astro`** — already calls `fetchBlogPage(1)`; verify it type-checks once `BlogListPost` is collection-backed (no change needed).

- [ ] **Step 2: `page/[page].astro`** — already uses `fetchBlogMaxPages`/`fetchBlogPage`; verify only.

- [ ] **Step 3: Rewrite `[slug].astro`** to render the entry via `render()`:

```astro
---
import isNil from "lodash/isNil.js";
import { render } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Heading from "../../components/ui/Heading.astro";
import Page from "../../components/ui/Page.astro";
import { fetchBlogPost, fetchBlogSlugs } from "../../lib/blog.ts";

export const prerender = true;

export const getStaticPaths = async () => {
  const slugs = await fetchBlogSlugs();
  return slugs.map((slug) => ({ params: { slug } }));
};

const { slug } = Astro.params;
const post = isNil(slug) ? null : await fetchBlogPost(slug);
const rendered = isNil(post) ? null : await render(post);
const { Content } = rendered ?? { Content: () => null };
---

<BaseLayout title={post?.data.title ?? "Blog Post"}>
  <Page>
    <Heading as="h1" class="text-4xl mb-6">{post?.data.title ?? "Blog Post"}</Heading>
    {isNil(rendered) ? (
      <p class="text-night-owl-muted">No content available.</p>
    ) : (
      <article class="blog-prose"><Content /></article>
    )}
  </Page>
</BaseLayout>
```

- [ ] **Step 4: Rewrite `BlogList.astro`** for collection entries (`blog.slug.current`→`blog.data.slug`, `blogCategory?.title`→`blog.data.blogCategory`, `_updatedAt`→`blog.data.updatedDate`): add `import isNil from "lodash/isNil.js";`, change `formattedDate(date?: Date)` to guard `isNil(date)` returning `""`, render `blog.data.title`, link `/blog/${blog.data.slug}`, and `Updated: {formattedDate(blog.data.updatedDate)}` when present.

- [ ] **Step 5: Build** — `node_modules/.bin/astro build`. Expected: succeeds; `/blog`, `/blog/page/…`, each `/blog/<slug>` prerendered with migrated content.

- [ ] **Step 6: Commit**

```bash
git add apps/ethang-astro/src/pages/blog apps/ethang-astro/src/components/BlogList.astro
git commit -m "feat(ethang-astro): render blog from content collections"
```

---

### Task 7: MDX support components + article styling

**Files:** Create `src/components/ui/VideoEmbed.astro`, `src/components/ui/PostImage.astro`; modify `src/styles/global.css`.

- [ ] **Step 1: `ui/VideoEmbed.astro`** — copy `portabletext/video.astro` body verbatim; rename component to `VideoEmbed`; keep `idFromUrl`/embed logic identical (MDX tags from Task 1 use `VideoEmbed`). The old file is deleted in Task 8.

- [ ] **Step 2: Create `ui/PostImage.astro`** (local `Image` + optional caption):

```astro
---
import { Image } from "astro:assets";
import isString from "lodash/isString.js";

interface Props {
  src: ImageMetadata;
  alt?: string;
  caption?: string;
}

const { src, alt, caption } = Astro.props;
const hasCaption = isString(caption) && caption.length > 0;
---

<figure class="my-4">
  <Image src={src} alt={alt ?? ""} loading="lazy" class="w-full rounded-lg object-cover" />
  {hasCaption ? <figcaption class="text-xs text-night-owl-muted text-center mt-1">{caption}</figcaption> : null}
</figure>
```

- [ ] **Step 3: Add `.blog-prose` CSS** in `src/styles/global.css` (scope headings, links, inline code, blockquotes, pre blocks to the site palette; re-use `--color-night-owl-*` tokens):

```css
.blog-prose { line-height: 1.7; }
.blog-prose h1 { font-size: 1.875rem; margin: 1.5rem 0 .75rem; }
.blog-prose h2 { font-size: 1.5rem; margin: 1.5rem 0 .75rem; }
.blog-prose h3 { font-size: 1.25rem; margin: 1.25rem 0 .5rem; }
.blog-prose h4 { font-size: 1.125rem; margin: 1rem 0 .5rem; }
.blog-prose p { color: var(--color-night-owl-fg); margin: .75rem 0; line-height: 1.7; }
.blog-prose a { color: var(--color-primary); text-decoration: underline; }
.blog-prose a:hover { text-decoration: none; }
.blog-prose code { color: var(--color-night-owl-green); background: var(--color-night-owl-bg); padding: .1em .3em; border-radius: .25rem; }
.blog-prose pre { background: var(--color-night-owl-bg); border: 1px solid var(--color-night-owl-border); border-radius: .5rem; padding: 1rem; overflow-x: auto; }
.blog-prose pre code { background: transparent; padding: 0; }
.blog-prose blockquote { border-color: var(--color-primary); }
```

> If Astro emits fenced-code class names like `.astro-code`, target those too so the night-owl shiki theme renders fully.

- [ ] **Step 4: Build** — `node_modules/.bin/astro build` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/ethang-astro/src/components/ui/VideoEmbed.astro apps/ethang-astro/src/components/ui/PostImage.astro apps/ethang-astro/src/styles/global.css
git commit -m "feat(ethang-astro): mdx support components + blog prose styles"
```

---

### Task 8: Remove Sanity + finalize coverage

**Files:** Delete `src/lib/sanity.ts`, `src/lib/image.ts`, `src/lib/image.test.ts`, `src/components/SanityText.astro`, `src/components/portabletext/`. Modify `package.json`, `vitest.config.ts`, `astro.config.mjs` (remove now-empty `image.remotePatterns` block).

- [ ] **Step 1: Delete Sanity-only files** — remove the listed files/dir. Grep to confirm nothing else imports `sanity|SanityText|portabletext|lib/image|resolveImageDimensions|IMAGE_MAX_WIDTH`.

- [ ] **Step 2: Remove deps** from `apps/ethang-astro/package.json`: `@sanity/client`, `@sanity/image-url`, `astro-portabletext`, `@portabletext/react`. Then `pnpm install` from repo root.

- [ ] **Step 3: Finalize `vitest.config.ts`** `coverage.include` — must list `scripts/lib/portableTextToMdx.ts` and `src/lib/blog-pagination.ts`; no deleted file referenced.

- [ ] **Step 4: Run full checks** — `node_modules/.bin/vitest run --coverage` (100% on include list); `node_modules/.bin/astro build` (blog renders); `tsc --noEmit` (no type errors).

- [ ] **Step 5: ESLint** — run `eslint .`; resolve issues by examining context (AGENTS.md) rather than blindly autofixing. Re-read the post-fix diff before committing (autofix strips return types / swappools for lodash/effect per `@ethang/eslint-config`).

- [ ] **Step 6: Commit**

```bash
git add -A apps/ethang-astro
# root lockfile if changed: git add pnpm-lock.yaml
git commit -m "chore(ethang-astro): remove sanity cms and finalize blog migration"
```

---

## Self-Review

- [x] **Spec coverage:** every spec section maps to a task (objective→1–8; collection config→3; migration+images→4; route rewire→6; MDX components+styling→7; Sanity removal→8; deps/config→3,8; URL/slug/pagination preservation→4,5,6,8; testing²→1,2,5).
- [x] **Placeholder scan:** none — all code steps have real content.
- [x] **Type consistency:** `portableTextToMdx` returns `{ body, images }` (Tasks 1,4); `img{variable}` import names match emission (Tasks 1,4,7); `BlogListPost.data.{...}` consistent (Tasks 5,6); `toMaxPages`/`toPageHref`/`BLOG_PAGE_SIZE` single source in `blog-pagination.ts` re-exported from `blog.ts` (Task 5).
