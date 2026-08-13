import constant from "lodash/constant.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { portableTextToMdx } from "./portable-text-to-mdx.ts";

const IMG_SRC = "./images/x.png";
const resolveImage = (url?: string) => {
  return "" === url || isNil(url) ? null : IMG_SRC;
};
const block = (
  text: string,
  options: {
    listItem?: string;
    markDefs?: unknown[];
    marks?: string[];
    style?: string;
  } = {}
) => {
  return {
    _type: "block",
    ...(!isNil(options.listItem) && { listItem: options.listItem }),
    ...(!isNil(options.style) && { style: options.style }),
    children: [
      { text, ...(!isEmpty(options.marks) && { marks: options.marks }) }
    ],
    ...(!isNil(options.markDefs) && { markDefs: options.markDefs })
  };
};

// eslint-disable-next-line sonar/max-lines-per-function
describe("portableTextToMdx", () => {
  describe("block styles", () => {
    it.each([
      ["normal", "plain", "plain\n"],
      ["h1", "heading", "# heading\n"],
      ["h2", "heading", "## heading\n"],
      ["h3", "heading", "### heading\n"],
      ["h4", "heading", "#### heading\n"],
      ["blockquote", "quoted", "> quoted\n"]
    ])("%s with text -> %j", (style, text, expected) => {
      const { body, images } = portableTextToMdx(
        [block(text, { style })],
        resolveImage
      );
      expect(body).toBe(expected);
      expect(images).toEqual([]);
    });

    it("skips an empty normal block", () => {
      const { body } = portableTextToMdx(
        [{ _type: "block", children: [{ text: "" }], style: "normal" }],
        resolveImage
      );
      expect(body).toBe("");
    });

    it("skips an empty h2 block", () => {
      const { body } = portableTextToMdx(
        [{ _type: "block", children: [], style: "h2" }],
        resolveImage
      );
      expect(body).toBe("");
    });

    it("skips an empty blockquote", () => {
      const { body } = portableTextToMdx(
        [{ _type: "block", children: [{ text: "" }], style: "blockquote" }],
        resolveImage
      );
      expect(body).toBe("");
    });

    it("skips a block without a _type and a block without text", () => {
      const { body } = portableTextToMdx(
        [{ children: [{ text: "x" }], style: "h3" }, { _type: "block" }],
        resolveImage
      );
      expect(body).toBe("");
    });
  });

  describe("lists", () => {
    it.each([
      ["bullet", "bullet"],
      ["number", "number"]
    ])("%s single item", (listItem) => {
      const { body } = portableTextToMdx(
        [block("one", { listItem })],
        resolveImage
      );
      expect(body).toBe("number" === listItem ? "1. one\n" : "- one\n");
    });

    it.each([
      ["bullet", ["- a", "- b", "- c"].join("\n")],
      ["number", ["1. a", "2. b", "3. c"].join("\n")]
    ])("%s multiple items", (listItem, expected) => {
      const { body } = portableTextToMdx(
        map(["a", "b", "c"], (t) => {
          return block(t, { listItem });
        }),
        resolveImage
      );
      expect(body).toBe(`${expected}\n`);
    });

    it("flushes interleaved bullet -> number -> bullet", () => {
      const { body } = portableTextToMdx(
        [
          block("a", { listItem: "bullet" }),
          block("b", { listItem: "number" }),
          block("c", { listItem: "bullet" })
        ],
        resolveImage
      );
      expect(body).toBe("- a\n\n1. b\n\n- c\n");
    });

    it("keeps empty list items but renders non-empty groups", () => {
      const { body } = portableTextToMdx(
        [block("a", { listItem: "bullet" }), block("", { listItem: "bullet" })],
        resolveImage
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
      ["strike-through", ["strike-through"], "~~text~~"]
    ])("%s wraps text", (_, marks, expected) => {
      const { body } = portableTextToMdx(
        [block("text", { marks })],
        resolveImage
      );
      expect(body).toBe(`${expected}\n`);
    });

    it.each([
      ["code+strong", ["code", "strong"], "**`x`**"],
      ["em inside strong", ["em", "strong"], "***x***"],
      ["underline+em", ["underline", "em"], "*<u>x</u>*"]
    ])("%s nests", (_, marks, expected) => {
      const { body } = portableTextToMdx([block("x", { marks })], resolveImage);
      expect(body).toBe(`${expected}\n`);
    });

    it.each([
      ["external", "https://example.com", "[site](https://example.com)"],
      ["internal", "/about", "[site](/about)"]
    ])("links %s via markDefs", (_, href, expected) => {
      const { body } = portableTextToMdx(
        [
          {
            _type: "block",
            children: [{ marks: ["k1"], text: "site" }],
            markDefs: [{ _key: "k1", _type: "link", href }]
          }
        ],
        resolveImage
      );
      expect(body).toBe(`${expected}\n`);
    });

    it("escapes parens in link hrefs", () => {
      const { body } = portableTextToMdx(
        [
          {
            _type: "block",
            children: [{ marks: ["k1"], text: "site" }],
            markDefs: [
              { _key: "k1", _type: "link", href: "https://x.com/a(b)" }
            ]
          }
        ],
        resolveImage
      );
      expect(body).toBe("[site](https://x.com/a(b%29)\n");
    });

    it("renders a mark that references a missing markDef as plain text", () => {
      const { body } = portableTextToMdx(
        [{ _type: "block", children: [{ marks: ["gone"], text: "x" }] }],
        resolveImage
      );
      expect(body).toBe("x\n");
    });

    it("does not link when the annotation type is not link", () => {
      const { body } = portableTextToMdx(
        [
          {
            _type: "block",
            children: [{ marks: ["k1"], text: "x" }],
            markDefs: [{ _key: "k1", _type: "annotation", href: "/about" }]
          }
        ],
        resolveImage
      );
      expect(body).toBe("x\n");
    });

    it("does not link when href is not a string", () => {
      const { body } = portableTextToMdx(
        [
          {
            _type: "block",
            children: [{ marks: ["k1"], text: "x" }],
            markDefs: [{ _key: "k1", _type: "link", href: 123 }]
          }
        ],
        resolveImage
      );
      expect(body).toBe("x\n");
    });

    it("skips spans whose text is not a string", () => {
      const { body } = portableTextToMdx(
        [
          {
            _type: "block",
            children: [{ text: 42 }, null, { text: "ok" }]
          }
        ],
        resolveImage
      );
      expect(body).toBe("ok\n");
    });
  });

  describe("escaping", () => {
    it("escapes special prose characters to avoid accidental emphasis", () => {
      const { body } = portableTextToMdx(
        [block("a*b _c_ [d] <e> & f (g) `h` \\i")],
        resolveImage
      );
      expect(body).toBe(
        "a\\*b _c_ \\[d\\] \\<e\\> \\& f \\(g\\) \\`h\\` \\\\i\n"
      );
    });
  });

  describe("code", () => {
    it("renders code without a language with a 3-backtick fence", () => {
      const { body } = portableTextToMdx(
        [{ _type: "code", code: "const x = 1;" }],
        resolveImage
      );
      expect(body).toBe("```\nconst x = 1;\n```\n");
    });

    it("renders code with a language with a 3-backtick fence", () => {
      const { body } = portableTextToMdx(
        [{ _type: "code", code: "let x", language: "ts" }],
        resolveImage
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
        resolveImage
      );
      expect(body).toBe("````ts\n```\ncode\n```\n````\n");
    });

    it("skips empty code blocks", () => {
      const { body } = portableTextToMdx(
        [{ _type: "code", code: "" }],
        resolveImage
      );
      expect(body).toBe("");
    });
  });

  describe("image", () => {
    const imageNode = (asset: unknown, alt?: string) => {
      return {
        _type: "image",
        ...(!isNil(alt) && { alt }),
        asset
      } as const;
    };

    it.each([
      [
        "with caption",
        imageNode({ caption: "c", url: "img" }, "a"),
        '<PostImage src={img0} alt="a" caption="c" />\n',
        [{ alt: "a", caption: "c", src: IMG_SRC, variable: "img0" }]
      ],
      [
        "without caption",
        imageNode({ url: "img" }, "a"),
        `![a](${IMG_SRC})\n`,
        []
      ],
      [
        "missing alt",
        imageNode({ caption: "c", url: "img" }),
        '<PostImage src={img0} alt="" caption="c" />\n',
        [{ alt: "", caption: "c", src: IMG_SRC, variable: "img0" }]
      ]
    ])("%s", (_, node, expectedBody, expectedImages) => {
      const { body, images } = portableTextToMdx([node], resolveImage);
      expect(body).toBe(expectedBody);
      expect(images).toEqual(expectedImages);
    });

    it("escapes double quotes in caption and alt", () => {
      const { body } = portableTextToMdx(
        [imageNode({ caption: 'c"d', url: "img" }, 'a"b')],
        resolveImage
      );
      expect(body).toBe(
        '<PostImage src={img0} alt="a&quot;b" caption="c&quot;d" />\n'
      );
    });

    it("escapes closing brackets in alt for markdown images", () => {
      const { body } = portableTextToMdx(
        [imageNode({ url: "img" }, "a]b")],
        resolveImage
      );
      expect(body).toBe(`![a\\]b](${IMG_SRC})\n`);
    });

    it("uses an empty caption when asset caption is not a string", () => {
      const { body } = portableTextToMdx(
        [imageNode({ caption: null, url: "img" }, "a")],
        resolveImage
      );
      expect(body).toBe(`![a](${IMG_SRC})\n`);
    });

    it("skips an image when the resolver returns null", () => {
      const { body, images } = portableTextToMdx([imageNode({})], resolveImage);
      expect(body).toBe("");
      expect(images).toEqual([]);
    });

    it("skips an image without a resolvable url", () => {
      const { body, images } = portableTextToMdx(
        [imageNode({})],
        constant(null)
      );
      expect(body).toBe("");
      expect(images).toEqual([]);
    });
  });

  describe("video / videoEmbed", () => {
    it.each([
      ["video", "video"],
      ["videoEmbed", "videoEmbed"]
    ])("%s with all attrs", (type) => {
      const { body } = portableTextToMdx(
        [
          {
            _type: type,
            title: "t",
            url: "https://x",
            videoId: "v"
          }
        ],
        resolveImage
      );
      expect(body).toBe(
        '<VideoEmbed videoId="v" url="https://x" title="t" />\n'
      );
    });

    it("renders only the present attrs and escapes quotes", () => {
      const { body } = portableTextToMdx(
        [{ _type: "videoEmbed", title: 't"1' }],
        resolveImage
      );
      expect(body).toBe('<VideoEmbed title="t&quot;1" />\n');
    });

    it.each([
      ["video", "video"],
      ["videoEmbed", "videoEmbed"]
    ])("skips %s with no attrs", (type) => {
      const { body } = portableTextToMdx([{ _type: type }], resolveImage);
      expect(body).toBe("");
    });
  });

  describe("quote / blockquote", () => {
    it.each([
      [
        "with all attrs",
        { author: "a", quote: "q", source: "s", sourceUrl: "u" },
        '<Blockquote author="a" source="s" sourceUrl="u">q</Blockquote>\n'
      ],
      ["without attrs", { quote: "q" }, "<Blockquote>q</Blockquote>\n"]
    ])("%s", (_, node, expected) => {
      const { body } = portableTextToMdx(
        [{ _type: "quote", ...node }],
        resolveImage
      );
      expect(body).toBe(expected);
    });

    it("treats blockquote type as quote", () => {
      const { body } = portableTextToMdx(
        [{ _type: "blockquote", quote: "q" }],
        resolveImage
      );
      expect(body).toBe("<Blockquote>q</Blockquote>\n");
    });

    it("escapes quotes and special chars in the quote body", () => {
      const { body } = portableTextToMdx(
        [{ _type: "quote", author: 'a"1', quote: 'q"a *b*' }],
        resolveImage
      );
      expect(body).toBe(
        '<Blockquote author="a&quot;1">q"a \\*b\\*</Blockquote>\n'
      );
    });

    it("skips an empty quote", () => {
      const { body } = portableTextToMdx(
        [{ _type: "quote", quote: "" }],
        resolveImage
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
      const { body } = portableTextToMdx(null, resolveImage);
      expect(body).toBe("");
    });

    it("skips a null block entry", () => {
      const { body } = portableTextToMdx([null], resolveImage);
      expect(body).toBe("");
    });
  });
});
