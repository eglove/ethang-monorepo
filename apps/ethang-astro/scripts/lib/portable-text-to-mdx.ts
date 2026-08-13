import filter from "lodash/filter.js";
import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import repeat from "lodash/repeat.js";
import replace from "lodash/replace.js";

const MARKDOWN_SPECIALS = /[\\`*[\]<>&()]/gu;
const DOUBLE_QUOTE = /"/gu;
const HREF_PAREN = /\)/gu;
const BACKTICK_RUN = /`+/gu;
const QUOTE_ESCAPE = "&quot;";
const DECORATOR_KEYS = new Set([
  "code",
  "em",
  "strike-through",
  "strong",
  "underline"
]);

type Block = Record<string, unknown>;
type ListGroup = { items: string[]; listItem: string };
type PostImage = {
  alt: string;
  caption: string;
  src: string;
  variable: string;
};

const EMPTY_BLOCK: Block = { _type: "" };

const escapeMarkdown = (text: string) => {
  return replace(text, MARKDOWN_SPECIALS, (c) => {
    return `\\${c}`;
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !isNil(value);
};

const toBlock = (value: unknown) => {
  return isRecord(value) ? value : EMPTY_BLOCK;
};

const toString = (value: unknown) => {
  return isString(value) ? value : null;
};

const applyDecorators = (text: string, marks: string[]) => {
  let inner = text;
  if (marks.includes("code")) inner = `\`${inner}\``;
  if (marks.includes("strike-through")) inner = `~~${inner}~~`;
  if (marks.includes("underline")) inner = `<u>${inner}</u>`;
  if (marks.includes("em")) inner = `*${inner}*`;
  if (marks.includes("strong")) inner = `**${inner}**`;
  return inner;
};

const linkHref = (defs: unknown[], marks: string[]) => {
  const annotKey =
    marks.find((m) => {
      return !DECORATOR_KEYS.has(m);
    }) ?? null;
  if (isNil(annotKey)) return null;
  const entry =
    find(
      map(defs, (raw) => {
        return toBlock(raw);
      }),
      (candidate) => {
        return candidate["_key"] === annotKey;
      }
    ) ?? null;
  if (isNil(entry)) return null;
  return "link" === entry["_type"] && isString(entry["href"])
    ? entry["href"]
    : null;
};

const toInlineMdx = (spans: unknown, markDefs: unknown) => {
  if (!isArray(spans)) return "";
  const out: string[] = [];
  for (const raw of spans) {
    const span = toBlock(raw);
    const text = span["text"];
    if (isString(text)) {
      const marks = isArray(span["marks"])
        ? filter(span["marks"], isString)
        : [];
      const defs = isArray(markDefs) ? markDefs : [];
      const inner = applyDecorators(escapeMarkdown(text), marks);
      const href = linkHref(defs, marks);
      out.push(
        isNil(href) ? inner : `[${inner}](${replace(href, HREF_PAREN, "%29")})`
      );
    }
  }
  return out.join("");
};

const buildAttributes = (node: Block, keys: string[]) => {
  const attributes: string[] = [];
  for (const key of keys) {
    const value = node[key];
    if ("" !== value && isString(value)) {
      attributes.push(`${key}="${replace(value, DOUBLE_QUOTE, QUOTE_ESCAPE)}"`);
    }
  }
  return attributes;
};

const styleLine = (style: string, text: string) => {
  if ("blockquote" === style) return `> ${text}`;
  if ("h1" === style) return `# ${text}`;
  if ("h2" === style) return `## ${text}`;
  if ("h3" === style) return `### ${text}`;
  if ("h4" === style) return `#### ${text}`;
  return "" === text ? null : text;
};

const renderTextBlock = (
  node: Block,
  body: string[],
  groups: ListGroup[],
  flushList: () => void
) => {
  const kind = toString(node["listItem"]);
  const text = toInlineMdx(node["children"], node["markDefs"]);
  if (!isNil(kind)) {
    const last = groups.at(-1);
    if (!isNil(last) && last.listItem === kind) {
      last.items.push(text);
    } else {
      groups.push({ items: [text], listItem: kind });
    }
    return;
  }
  flushList();
  const style = toString(node["style"]) ?? "";
  if ("" === text && "normal" !== style) return;
  const line = styleLine(style, text);
  if (!isNil(line)) body.push(line, "");
};

const renderQuote = (node: Block, body: string[]) => {
  const quote = toString(node["quote"]);
  if ("" === quote || isNil(quote)) return;
  const attributes = buildAttributes(node, ["author", "source", "sourceUrl"]);
  const attributeText = isEmpty(attributes) ? "" : ` ${attributes.join(" ")}`;
  body.push(
    `<Blockquote${attributeText}>${escapeMarkdown(quote)}</Blockquote>`,
    ""
  );
};

const renderCode = (node: Block, body: string[]) => {
  const code = toString(node["code"]);
  if ("" === code || isNil(code)) return;
  const lang = toString(node["language"]);
  const longestRun = Math.max(
    ...(code.match(BACKTICK_RUN)?.map((f) => {
      return f.length;
    }) ?? [0])
  );
  const fences = Math.max(3, longestRun + 1);
  const langText = isNil(lang) ? "" : lang;
  body.push(
    `${repeat("`", fences)}${langText}\n${code}\n${repeat("`", fences)}`,
    ""
  );
};

const renderImage = (
  node: Block,
  resolveImage: (imageUrl: string) => null | string,
  body: string[],
  images: PostImage[]
) => {
  const asset = toBlock(node["asset"]);
  const url = isString(asset["url"]) ? asset["url"] : "";
  const relative = resolveImage(url);
  if (isNil(relative)) return;
  const alt = isString(node["alt"]) ? node["alt"] : "";
  const caption = isString(asset["caption"]) ? asset["caption"] : "";
  if ("" === caption) {
    const altEscaped = alt.replaceAll("]", String.raw`\]`);
    body.push(`![${altEscaped}](${relative})`);
  } else {
    const variable = `img${images.length}`;
    images.push({ alt, caption, src: relative, variable });
    body.push(
      `<PostImage src={${variable}} alt="${replace(alt, DOUBLE_QUOTE, QUOTE_ESCAPE)}" caption="${replace(caption, DOUBLE_QUOTE, QUOTE_ESCAPE)}" />`
    );
  }
  body.push("");
};

const renderVideo = (node: Block, body: string[]) => {
  const attributes = buildAttributes(node, ["videoId", "url", "title"]);
  if (!isEmpty(attributes)) {
    body.push(`<VideoEmbed ${attributes.join(" ")} />`, "");
  }
};

const renderNode = (
  node: Block,
  resolveImage: (imageUrl: string) => null | string,
  body: string[],
  images: PostImage[]
) => {
  switch (node["_type"]) {
    case "blockquote":
    case "quote": {
      renderQuote(node, body);
      break;
    }
    case "code": {
      renderCode(node, body);
      break;
    }
    case "image": {
      renderImage(node, resolveImage, body, images);
      break;
    }
    case "video":
    case "videoEmbed": {
      renderVideo(node, body);
      break;
    }
  }
};

export const portableTextToMdx = (
  blocks: unknown,
  resolveImage: (imageUrl: string) => null | string
) => {
  const body: string[] = [];
  const images: PostImage[] = [];
  const groups: ListGroup[] = [];
  const flushList = () => {
    for (const list of groups) {
      for (const [index, item] of list.items.entries()) {
        body.push(
          "number" === list.listItem ? `${index + 1}. ${item}` : `- ${item}`
        );
      }
      body.push("");
    }
    groups.length = 0;
  };

  if (isArray(blocks)) {
    for (const raw of blocks) {
      const node = toBlock(raw);
      if ("block" === node["_type"]) {
        renderTextBlock(node, body, groups, flushList);
      } else {
        flushList();
        renderNode(node, resolveImage, body, images);
      }
    }
  }
  flushList();
  return { body: body.join("\n"), images };
};
