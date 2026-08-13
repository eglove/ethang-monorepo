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