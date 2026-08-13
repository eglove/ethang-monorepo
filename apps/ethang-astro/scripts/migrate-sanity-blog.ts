import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { portableTextToMdx } from "./lib/portableTextToMdx.ts";






const PROJECT = "3rkvshhk";
const DATASET = "production";
const OUT = resolve(import.meta.dirname, "../src/content/blog");

const GROQ = `*[_type == "blog"] | order(_createdAt desc){
  _id, _createdAt, _updatedAt, title, blogCategory->{title},
  "slug": slug.current,
  "body": body[]{ ...,
    _type == "image" => { "asset": asset->{url, caption, metadata{dimensions{aspectRatio,height,width}}} },
    _type == "videoEmbed" => { ..., "url": url },
    _type == "blockquote" || _type == "quote" => { ... }
  }
}`;
const apiUrl = `https://${PROJECT}.api.sanity.io/v2023-01-01/data/query/${DATASET}?query=${encodeURIComponent(GROQ)}`;

const asString = (v: unknown) => {
  return "string" === typeof v ? v : undefined;
};
const esc = (v: string) => {
  return replace(v, /"/g, String.raw`\"`);
};

async function download(url: string, destination: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await writeFile(destination, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.error(
      `Sanity query failed: ${res.status} ${JSON.stringify(await res.text())}`
    );
    process.exit(1);
  }

  const json = await res.json();
  if (json.error) {
    console.error(`Sanity query returned error: ${JSON.stringify(json.error)}`);
    process.exit(1);
  }

  const result = json.result ?? [];
  if (isEmpty(result)) {
    console.error("Sanity query returned empty result[] (no posts found).");
    process.exit(1);
  }
  console.log(
    `Sanity query OK: ${result.length} doc(s) from ${PROJECT}/${DATASET}`
  );

  for (const document of result) {
    const slug = asString(document.slug);
    if (!slug) {
      console.warn("skip doc without slug", document._id);
      continue;
    }

    const dir = join(OUT, slug);
    const imgDir = join(dir, "images");
    await mkdir(imgDir, { recursive: true });

    // Ruling C: download ONLY images referenced by body image blocks.
    const bodies = Array.isArray(document.body)
      ? (document.body as object[])
      : [];
    const urls = new Set<string>();
    for (const b of bodies) {
      const u = asString((b as { asset?: { url?: unknown } })?.asset?.url);
      if (u) urls.add(u);
    }

    const toFile = new Map<string, string>();
    const extensionOf = (url: string) => {
      try {
        return (
          split(basename(new URL(url).pathname), ".").pop() ?? "jpg"
        ).toLowerCase();
      } catch {
        return "jpg";
      }
    };
    for (const url of urls) {
      const extension = extensionOf(url);
      const file = `image-${toFile.size}.${extension}`;
      try {
        await download(url, join(imgDir, file));
        toFile.set(url, `./images/${file}`);
      } catch (error) {
        console.warn(`failed ${url}:`, error);
      }
    }

    const resolveImage = (url: string | undefined) => {
      return url ? (toFile.get(url) ?? null) : null;
    };
    const { body, images } = portableTextToMdx(bodies, resolveImage);

    const imports = [
      `import Blockquote from "../../../components/ui/Blockquote.astro";`,
      `import PostImage from "../../../components/ui/PostImage.astro";`,
      `import VideoEmbed from "../../../components/ui/VideoEmbed.astro";`,
      ...map(images, (img) => {
        return `import ${img.variable} from ${JSON.stringify(img.src)};`;
      })
    ].join("\n");

    const fm = [
      `title: "${esc(asString(document.title) ?? "")}"`,
      `slug: "${esc(slug)}"`,
      `pubDate: "${asString(document._createdAt) ?? ""}"`,
      ...(asString(document._updatedAt)
        ? [`updatedDate: "${asString(document._updatedAt)}"`]
        : []),
      ...(asString((document.blogCategory as { title?: unknown } | null)?.title)
        ? [
            `blogCategory: "${esc(asString((document.blogCategory as { title: string }).title) ?? "")}"`
          ]
        : [])
    ].join("\n");

    await writeFile(
      join(dir, "index.mdx"),
      `---\n${fm}\n---\n\n${imports}\n\n${trim(body)}\n`
    );
    console.log(
      `wrote ${slug} (${body.length} chars, ${images.length} imgs, ${toFile.size}/${urls.size} downloaded)`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
