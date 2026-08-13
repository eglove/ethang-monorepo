import { describe, expect, it } from "vitest";
import { portableTextToMdx } from "./portableTextToMdx.ts";

const resolveImage = (url: string | undefined) =>
	url ? "./images/x.png" : null;
const block = (
	text: string,
	opts: {
		listItem?: string;
		style?: string;
		marks?: string[];
		markDefs?: unknown[];
	} = {},
) => ({
	_type: "block",
	...(opts.listItem ? { listItem: opts.listItem } : {}),
	...(opts.style ? { style: opts.style } : {}),
	children: [{ text, ...(opts.marks?.length ? { marks: opts.marks } : {}) }],
	...(opts.markDefs ? { markDefs: opts.markDefs } : {}),
});

describe("portableTextToMdx", () => {
	describe("block styles", () => {
		it.each([
			["normal", "plain", "plain\n"],
			["h1", "heading", "# heading\n"],
			["h2", "heading", "## heading\n"],
			["h3", "heading", "### heading\n"],
			["h4", "heading", "#### heading\n"],
			["blockquote", "quoted", "> quoted\n"],
		])("%s with text -> %j", (style, text, expected) => {
			const { body, images } = portableTextToMdx(
				[block(text, { style })],
				resolveImage,
			);
			expect(body).toBe(expected);
			expect(images).toEqual([]);
		});

		it("skips an empty normal block", () => {
			const { body } = portableTextToMdx(
				[{ _type: "block", style: "normal", children: [{ text: "" }] }],
				resolveImage,
			);
			expect(body).toBe("");
		});

		it("skips an empty h2 block", () => {
			const { body } = portableTextToMdx(
				[{ _type: "block", style: "h2", children: [] }],
				resolveImage,
			);
			expect(body).toBe("");
		});

		it("skips an empty blockquote", () => {
			const { body } = portableTextToMdx(
				[{ _type: "block", style: "blockquote", children: [{ text: "" }] }],
				resolveImage,
			);
			expect(body).toBe("");
		});

		it("skips a block without a _type and a block without text", () => {
			const { body } = portableTextToMdx(
				[{ style: "h3", children: [{ text: "x" }] }, { _type: "block" }],
				resolveImage,
			);
			expect(body).toBe("");
		});
	});

	describe("lists", () => {
		it.each([
			["bullet", "bullet"],
			["number", "number"],
		])("%s single item", (listItem) => {
			const { body } = portableTextToMdx(
				[block("one", { listItem })],
				resolveImage,
			);
			expect(body).toBe(listItem === "number" ? "1. one\n" : "- one\n");
		});

		it.each([
			["bullet", ["- a", "- b", "- c"].join("\n")],
			["number", ["1. a", "2. b", "3. c"].join("\n")],
		])("%s multiple items", (listItem, expected) => {
			const { body } = portableTextToMdx(
				["a", "b", "c"].map((t) => block(t, { listItem })),
				resolveImage,
			);
			expect(body).toBe(`${expected}\n`);
		});

		it("flushes interleaved bullet -> number -> bullet", () => {
			const { body } = portableTextToMdx(
				[
					block("a", { listItem: "bullet" }),
					block("b", { listItem: "number" }),
					block("c", { listItem: "bullet" }),
				],
				resolveImage,
			);
			expect(body).toBe("- a\n\n1. b\n\n- c\n");
		});

		it("keeps empty list items but renders non-empty groups", () => {
			const { body } = portableTextToMdx(
				[block("a", { listItem: "bullet" }), block("", { listItem: "bullet" })],
				resolveImage,
			);
			expect(body).toBe("- a\n- \n");
		});
	});

	describe("inline decorators", () => {
		it.each([
			["strong", ["strong"], "**text**"],
			["em", ["em"], "*text*"],
			["code", ["code"], "`text`"],
			["underline", ["underline"], "<u>text</u>"],
			["strike-through", ["strike-through"], "~~text~~"],
		])("%s wraps text", (_, marks, expected) => {
			const { body } = portableTextToMdx(
				[block("text", { marks })],
				resolveImage,
			);
			expect(body).toBe(`${expected}\n`);
		});

		it.each([
			["code+strong", ["code", "strong"], "**`x`**"],
			["em inside strong", ["em", "strong"], "***x***"],
			["underline+em", ["underline", "em"], "*<u>x</u>*"],
		])("%s nests", (_, marks, expected) => {
			const { body } = portableTextToMdx([block("x", { marks })], resolveImage);
			expect(body).toBe(`${expected}\n`);
		});

		it.each([
			["external", "https://example.com", "[site](https://example.com)"],
			["internal", "/about", "[site](/about)"],
		])("links %s via markDefs", (_, href, expected) => {
			const { body } = portableTextToMdx(
				[
					{
						_type: "block",
						children: [{ text: "site", marks: ["k1"] }],
						markDefs: [{ _key: "k1", _type: "link", href }],
					},
				],
				resolveImage,
			);
			expect(body).toBe(`${expected}\n`);
		});

		it("escapes parens in link hrefs", () => {
			const { body } = portableTextToMdx(
				[
					{
						_type: "block",
						children: [{ text: "site", marks: ["k1"] }],
						markDefs: [
							{ _key: "k1", _type: "link", href: "https://x.com/a(b)" },
						],
					},
				],
				resolveImage,
			);
			expect(body).toBe("[site](https://x.com/a(b%29)\n");
		});

		it("renders a mark that references a missing markDef as plain text", () => {
			const { body } = portableTextToMdx(
				[{ _type: "block", children: [{ text: "x", marks: ["gone"] }] }],
				resolveImage,
			);
			expect(body).toBe("x\n");
		});

		it("does not link when the annotation type is not link", () => {
			const { body } = portableTextToMdx(
				[
					{
						_type: "block",
						children: [{ text: "x", marks: ["k1"] }],
						markDefs: [{ _key: "k1", _type: "annotation", href: "/about" }],
					},
				],
				resolveImage,
			);
			expect(body).toBe("x\n");
		});

		it("does not link when href is not a string", () => {
			const { body } = portableTextToMdx(
				[
					{
						_type: "block",
						children: [{ text: "x", marks: ["k1"] }],
						markDefs: [{ _key: "k1", _type: "link", href: 123 }],
					},
				],
				resolveImage,
			);
			expect(body).toBe("x\n");
		});

		it("skips spans whose text is not a string", () => {
			const { body } = portableTextToMdx(
				[
					{
						_type: "block",
						children: [{ text: 42 }, null, { text: "ok" }],
					},
				],
				resolveImage,
			);
			expect(body).toBe("ok\n");
		});
	});

	describe("escaping", () => {
		it("escapes special prose characters to avoid accidental emphasis", () => {
			const { body } = portableTextToMdx(
				[block("a*b _c_ [d] <e> & f (g) `h` \\i")],
				resolveImage,
			);
			expect(body).toBe(
				"a\\*b _c_ \\[d\\] \\<e\\> \\& f \\(g\\) \\`h\\` \\\\i\n",
			);
		});
	});

	describe("code", () => {
		it("renders code without a language with a 3-backtick fence", () => {
			const { body } = portableTextToMdx(
				[{ _type: "code", code: "const x = 1;" }],
				resolveImage,
			);
			expect(body).toBe("```\nconst x = 1;\n```\n");
		});

		it("renders code with a language with a 3-backtick fence", () => {
			const { body } = portableTextToMdx(
				[{ _type: "code", code: "let x", language: "ts" }],
				resolveImage,
			);
			expect(body).toBe("```ts\nlet x\n```\n");
		});

		it("skips a code block without a code field", () => {
			const { body } = portableTextToMdx([{ _type: "code" }], resolveImage);
			expect(body).toBe("");
		});

		it("grows the fence when code contains triple backticks", () => {
			const { body } = portableTextToMdx(
				[{ _type: "code", code: "```\ncode\n```", language: "ts" }],
				resolveImage,
			);
			expect(body).toBe("````ts\n```\ncode\n```\n````\n");
		});

		it("skips empty code blocks", () => {
			const { body } = portableTextToMdx(
				[{ _type: "code", code: "" }],
				resolveImage,
			);
			expect(body).toBe("");
		});
	});

	describe("image", () => {
		const imageNode = (asset: unknown, alt?: string) =>
			({
				_type: "image",
				...(alt !== undefined ? { alt } : {}),
				asset,
			}) as const;

		it.each([
			[
				"with caption",
				imageNode({ url: "img", caption: "c" }, "a"),
				'<PostImage src={img0} alt="a" caption="c" />\n',
				[{ variable: "img0", src: "./images/x.png", alt: "a", caption: "c" }],
			],
			[
				"without caption",
				imageNode({ url: "img" }, "a"),
				"![a](./images/x.png)\n",
				[],
			],
			[
				"missing alt",
				imageNode({ url: "img", caption: "c" }),
				'<PostImage src={img0} alt="" caption="c" />\n',
				[{ variable: "img0", src: "./images/x.png", alt: "", caption: "c" }],
			],
		])("%s", (_, node, expectedBody, expectedImages) => {
			const { body, images } = portableTextToMdx([node], resolveImage);
			expect(body).toBe(expectedBody);
			expect(images).toEqual(expectedImages);
		});

		it("escapes double quotes in caption and alt", () => {
			const { body } = portableTextToMdx(
				[imageNode({ url: "img", caption: 'c"d' }, 'a"b')],
				resolveImage,
			);
			expect(body).toBe(
				'<PostImage src={img0} alt="a&quot;b" caption="c&quot;d" />\n',
			);
		});

		it("escapes closing brackets in alt for markdown images", () => {
			const { body } = portableTextToMdx(
				[imageNode({ url: "img" }, "a]b")],
				resolveImage,
			);
			expect(body).toBe("![a\\]b](./images/x.png)\n");
		});

		it("uses an empty caption when asset caption is not a string", () => {
			const { body } = portableTextToMdx(
				[imageNode({ url: "img", caption: null }, "a")],
				resolveImage,
			);
			expect(body).toBe("![a](./images/x.png)\n");
		});

		it("skips an image when the resolver returns null", () => {
			const { body, images } = portableTextToMdx([imageNode({})], resolveImage);
			expect(body).toBe("");
			expect(images).toEqual([]);
		});

		it("skips an image without a resolvable url", () => {
			const { body, images } = portableTextToMdx([imageNode({})], () => null);
			expect(body).toBe("");
			expect(images).toEqual([]);
		});
	});

	describe("video / videoEmbed", () => {
		it.each([
			["video", "video"],
			["videoEmbed", "videoEmbed"],
		])("%s with all attrs", (type) => {
			const { body } = portableTextToMdx(
				[
					{
						_type: type,
						videoId: "v",
						url: "https://x",
						title: "t",
					},
				],
				resolveImage,
			);
			expect(body).toBe(
				'<VideoEmbed videoId="v" url="https://x" title="t" />\n',
			);
		});

		it("renders only the present attrs and escapes quotes", () => {
			const { body } = portableTextToMdx(
				[{ _type: "videoEmbed", title: 't"1' }],
				resolveImage,
			);
			expect(body).toBe('<VideoEmbed title="t&quot;1" />\n');
		});

		it.each([
			["video", "video"],
			["videoEmbed", "videoEmbed"],
		])("skips %s with no attrs", (type) => {
			const { body } = portableTextToMdx([{ _type: type }], resolveImage);
			expect(body).toBe("");
		});
	});

	describe("quote / blockquote", () => {
		it.each([
			[
				"with all attrs",
				{ quote: "q", author: "a", source: "s", sourceUrl: "u" },
				'<Blockquote author="a" source="s" sourceUrl="u">q</Blockquote>\n',
			],
			["without attrs", { quote: "q" }, "<Blockquote>q</Blockquote>\n"],
		])("%s", (_, node, expected) => {
			const { body } = portableTextToMdx(
				[{ _type: "quote", ...node }],
				resolveImage,
			);
			expect(body).toBe(expected);
		});

		it("treats blockquote type as quote", () => {
			const { body } = portableTextToMdx(
				[{ _type: "blockquote", quote: "q" }],
				resolveImage,
			);
			expect(body).toBe("<Blockquote>q</Blockquote>\n");
		});

		it("escapes quotes and special chars in the quote body", () => {
			const { body } = portableTextToMdx(
				[{ _type: "quote", quote: 'q"a *b*', author: 'a"1' }],
				resolveImage,
			);
			expect(body).toBe(
				'<Blockquote author="a&quot;1">q"a \\*b\\*</Blockquote>\n',
			);
		});

		it("skips an empty quote", () => {
			const { body } = portableTextToMdx(
				[{ _type: "quote", quote: "" }],
				resolveImage,
			);
			expect(body).toBe("");
		});

		it("skips a quote without a quote field", () => {
			const { body } = portableTextToMdx([{ _type: "quote" }], resolveImage);
			expect(body).toBe("");
		});
	});

	describe("empty input", () => {
		it("returns an empty body and no images for empty blocks", () => {
			const { body, images } = portableTextToMdx([], resolveImage);
			expect(body).toBe("");
			expect(images).toEqual([]);
		});

		it("handles null blocks", () => {
			const { body } = portableTextToMdx(
				null as unknown as unknown[],
				resolveImage,
			);
			expect(body).toBe("");
		});

		it("skips a null block entry", () => {
			const { body } = portableTextToMdx([null], resolveImage);
			expect(body).toBe("");
		});
	});
});
