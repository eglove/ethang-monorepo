import repeat from "lodash/repeat.js";
import replace from "lodash/replace.js";

const escapeMarkdown = (text: string) => {
  return replace(text, /[\\`*\[\]<>&\(\)]/g, (c) => {
    return `\\${c}`;
  });
};
const isString = (v: unknown): v is string => {
  return "string" === typeof v;
};

const inline = (spans: unknown, markDefs: unknown) => {
  const out: string[] = [];
  for (const raw of (spans as undefined | unknown[]) ?? []) {
    const span = (raw ?? {}) as { marks?: string[]; text?: string };
    if (!isString(span.text)) continue;
    const marks = span.marks ?? [];
    const annotKey = marks.find((m) => {
      return !["code", "em", "strike-through", "strong", "underline"].includes(
        m
      );
    });
    const annot = (
      (markDefs ?? []) as {
        _key?: string;
        _type?: string;
        href?: string;
      }[]
    ).find((d) => {
      return d._key === annotKey;
    });
    const href =
      "link" === annot?._type && isString(annot.href) ? annot.href : undefined;
    let inner = escapeMarkdown(span.text);
    if (marks.includes("code")) inner = `\`${inner}\``;
    if (marks.includes("strike-through")) inner = `~~${inner}~~`;
    if (marks.includes("underline")) inner = `<u>${inner}</u>`;
    if (marks.includes("em")) inner = `*${inner}*`;
    if (marks.includes("strong")) inner = `**${inner}**`;
    if (href) inner = `[${inner}](${replace(href, /\)/g, "%29")})`;
    out.push(inner);
  }
  return out.join("");
};

export const portableTextToMdx = (
  blocks: unknown[],
  resolveImage: (imageUrl: string | undefined) => null | string
) => {
  const body: string[] = [];
  const images: {
    alt: string;
    caption: string;
    src: string;
    variable: string;
  }[] = [];
  const asObject = (b: unknown) => {
    return (b ?? {}) as Record<string, unknown>;
  };
  const groups: { items: string[]; listItem: string }[] = [];

  const flushList = () => {
    for (const g of groups) {
      for (const [index, item] of g.items.entries())
        body.push(
          "number" === g.listItem ? `${index + 1}. ${item}` : `- ${item}`
        );
      body.push("");
    }
    groups.length = 0;
  };

  for (const blockRaw of blocks ?? []) {
    const block = asObject(blockRaw);
    const type = block["_type"];

    if ("block" === type) {
      const listItem = isString(block["listItem"]) ? block["listItem"] : null;
      const text = inline(block["children"], block["markDefs"]);
      const last = groups.at(-1);
      if (listItem) {
        if (last && last.listItem === listItem) last.items.push(text);
        else groups.push({ items: [text], listItem });
        continue;
      }
      flushList();
      const style = block["style"];
      if (!text && "normal" !== style) continue;
      switch (style) {
        case "blockquote": {
          body.push(`> ${text}`);
          break;
        }
        case "h1": {
          body.push(`# ${text}`);
          break;
        }
        case "h2": {
          body.push(`## ${text}`);
          break;
        }
        case "h3": {
          body.push(`### ${text}`);
          break;
        }
        case "h4": {
          body.push(`#### ${text}`);
          break;
        }
        default: {
          if (text) body.push(text);
          else continue;
        }
      }
      body.push("");
      continue;
    }

    flushList();

    switch (type) {
      case "blockquote":
      case "quote": {
        const quote = isString(block["quote"]) ? block["quote"] : "";
        if (!quote) continue;
        const attributes: string[] = [];
        for (const key of ["author", "source", "sourceUrl"]) {
          if (isString(block[key]) && block[key])
            attributes.push(`${key}="${replace(block[key], /"/g, "&quot;")}"`);
        }
        body.push(
          `<Blockquote${attributes.length ? ` ${attributes.join(" ")}` : ""}>${escapeMarkdown(quote)}</Blockquote>`,
          ""
        );

        break;
      }
      case "code": {
        const code = isString(block["code"]) ? block["code"] : "";
        if (!code) continue;
        const lang = isString(block["language"]) ? block["language"] : null;
        const longestBacktickRun = Math.max(
          ...(code.match(/`+/g)?.map((f) => {
            return f.length;
          }) ?? [0])
        );
        const fences = Math.max(3, longestBacktickRun + 1);
        const fence = repeat("`", fences);
        body.push(`${fence}${lang ?? ""}\n${code}\n${fence}`, "");

        break;
      }
      case "image": {
        const asset = asObject(block["asset"]);
        const relative = resolveImage(
          isString(asset["url"]) ? asset["url"] : undefined
        );
        if (!relative) continue;
        const alt = isString(block["alt"]) ? block["alt"] : "";
        const caption = isString(asset["caption"]) ? asset["caption"] : "";
        if (caption) {
          const variable = `img${images.length}`;
          images.push({ alt, caption, src: relative, variable });
          body.push(
            `<PostImage src={${variable}} alt="${replace(alt, /"/g, "&quot;")}" caption="${replace(caption, /"/g, "&quot;")}" />`
          );
        } else {
          body.push(`![${alt.replaceAll("]", String.raw`\]`)}](${relative})`);
        }
        body.push("");

        break;
      }
      case "video":
      case "videoEmbed": {
        const attributes: string[] = [];
        for (const key of ["videoId", "url", "title"]) {
          if (isString(block[key]) && block[key])
            attributes.push(`${key}="${replace(block[key], /"/g, "&quot;")}"`);
        }
        if (attributes.length) {
          body.push(`<VideoEmbed ${attributes.join(" ")} />`, "");
        }

        break;
      }
      // No default
    }
  }
  flushList();
  return { body: body.join("\n"), images };
};
