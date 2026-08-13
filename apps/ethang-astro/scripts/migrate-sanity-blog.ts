import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portableTextToMdx } from "./lib/portableTextToMdx.ts";

const PROJECT = "3rkvshhk";
const DATASET = "production";
const OUT = resolve(
	fileURLToPath(new URL(".", import.meta.url)),
	"../src/content/blog",
);

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

const asString = (v: unknown) => (typeof v === "string" ? v : undefined);
const esc = (v: string) => v.replace(/"/g, '\\"');

async function download(url: string, dest: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
	const res = await fetch(apiUrl);
	if (!res.ok) {
		console.error(
			`Sanity query failed: ${res.status} ${JSON.stringify(await res.text())}`,
		);
		process.exit(1);
	}

	const json = (await res.json()) as {
		result?: Array<Record<string, unknown>>;
		error?: { description?: string };
	};
	if (json.error) {
		console.error(`Sanity query returned error: ${JSON.stringify(json.error)}`);
		process.exit(1);
	}

	const result = json.result ?? [];
	if (result.length === 0) {
		console.error("Sanity query returned empty result[] (no posts found).");
		process.exit(1);
	}
	console.log(
		`Sanity query OK: ${result.length} doc(s) from ${PROJECT}/${DATASET}`,
	);

	for (const doc of result) {
		const slug = asString(doc["slug"]);
		if (!slug) {
			console.warn("skip doc without slug", doc["_id"]);
			continue;
		}

		const dir = join(OUT, slug);
		const imgDir = join(dir, "images");
		await mkdir(imgDir, { recursive: true });

		// Ruling C: download ONLY images referenced by body image blocks.
		const bodies = Array.isArray(doc["body"]) ? (doc["body"] as object[]) : [];
		const urls = new Set<string>();
		for (const b of bodies) {
			const u = asString((b as { asset?: { url?: unknown } })?.asset?.url);
			if (u) urls.add(u);
		}

		const toFile = new Map<string, string>();
		let extOf = (url: string) => {
			try {
				return (
					basename(new URL(url).pathname).split(".").pop() ?? "jpg"
				).toLowerCase();
			} catch {
				return "jpg";
			}
		};
		for (const url of urls) {
			const ext = extOf(url);
			const file = `image-${toFile.size}.${ext}`;
			try {
				await download(url, join(imgDir, file));
				toFile.set(url, `./images/${file}`);
			} catch (e) {
				console.warn(`failed ${url}:`, e);
			}
		}

		const resolveImage = (url: string | undefined) =>
			url ? (toFile.get(url) ?? null) : null;
		const { body, images } = portableTextToMdx(bodies, resolveImage);

		const imports = [
			`import Blockquote from "../../../components/ui/Blockquote.astro";`,
			`import PostImage from "../../../components/ui/PostImage.astro";`,
			`import VideoEmbed from "../../../components/ui/VideoEmbed.astro";`,
			...images.map(
				(img) => `import ${img.variable} from ${JSON.stringify(img.src)};`,
			),
		].join("\n");

		const fm = [
			`title: "${esc(asString(doc["title"]) ?? "")}"`,
			`slug: "${esc(slug)}"`,
			`pubDate: "${asString(doc["_createdAt"]) ?? ""}"`,
			...(asString(doc["_updatedAt"])
				? [`updatedDate: "${asString(doc["_updatedAt"])}"`]
				: []),
			...(asString((doc["blogCategory"] as { title?: unknown } | null)?.title)
				? [
						`blogCategory: "${esc(asString((doc["blogCategory"] as { title: string }).title) ?? "")}"`,
					]
				: []),
		].join("\n");

		await writeFile(
			join(dir, "index.mdx"),
			`---\n${fm}\n---\n\n${imports}\n\n${body.trim()}\n`,
		);
		console.log(
			`wrote ${slug} (${body.length} chars, ${images.length} imgs, ${toFile.size}/${urls.size} downloaded)`,
		);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
