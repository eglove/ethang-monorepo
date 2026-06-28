import constant from "lodash/constant.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import repeat from "lodash/repeat.js";
import replace from "lodash/replace.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { marked, type Renderer, type Tokens } from "marked";

// Night Owl–inspired palette (dark background assumed)
// True-color hex codes – works in all modern terminals (2024+)
const NIGHT_OWL = {
  blockquoteBorder: "#5f7e97",
  blockquoteFg: "#d6deeb",
  bold: "#78dce8", // cyan bold
  codeBlockBorder: "#5f7e97", // muted gray border
  codeBlockFg: "#d6deeb", // off-white text
  heading1: "#78dce8", // cyan
  heading2: "#addb67", // green
  heading3: "#c792ea", // pink / purple
  heading4: "#82aaff", // blue
  inlineCodeBg: "#0b2942", // deep blue background for inline code
  inlineCodeFg: "#fad430", // yellow foreground for inline code
  italic: "#d6deeb", // off-white italic
  link: "#78dce8", // cyan underlined
  linkUrl: "#5f7e97", // gray URL label
  listBullet: "#5f7e97"
};

const RESET = "[0m";
const BOLD = "[1m";
const ITALIC = "[3m";
const UNDERLINE = "[4m";
const DIM = "[2m";

const EMPTY_STRING = "";

function bg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (rgb === undefined) return EMPTY_STRING;
  return `[48;2;${rgb}m`;
}

function fg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (rgb === undefined) return EMPTY_STRING;
  return `[38;2;${rgb}m`;
}

function hexToRgb(hex: string): string | undefined {
  const h = replace(hex, "#", "");
  if (6 !== h.length) return undefined;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined;
  return `${r};${g};${b}`;
}

const HLINE = repeat("─", 60);

function assertToken<T extends { type: string }>(
  value: { type: string },
  expectedType: T["type"]
): asserts value is T {
  if (value.type !== expectedType) throw new TypeError("Invalid token type");
}

function createNightOwlRenderer(): Partial<Renderer> {
  return {
    blockquote: ({ tokens }: Tokens.Blockquote): string => {
      return `${fg(NIGHT_OWL.blockquoteBorder)}${DIM}＞ ${RESET}${DIM}${fg(NIGHT_OWL.blockquoteFg)}${renderInlineTokens(tokens)}${RESET}\n`;
    },
    br: (): string => {
      return `\n`;
    },
    checkbox: ({ checked }: Tokens.Checkbox): string => {
      return checked ? "[x]" : "[ ]";
    },
    code({ text }: Tokens.Code): string {
      const borderColor = fg(NIGHT_OWL.codeBlockBorder);
      const fgColor = fg(NIGHT_OWL.codeBlockFg);
      const border = `${borderColor}${DIM}${HLINE}${RESET}`;
      const lines = map(split(text, "\n"), (line) => {
        return `${DIM}│${RESET}${fgColor}${line}${RESET}`;
      });
      return `${border}\n${lines.join("\n")}\n${border}\n`;
    },
    codespan: ({ text }: Tokens.Codespan): string => {
      return `${bg(NIGHT_OWL.inlineCodeBg)}${fg(NIGHT_OWL.inlineCodeFg)} ${text} ${RESET}`;
    },
    del({ text, tokens }: Tokens.Del): string {
      if (0 < tokens.length) {
        return `${DIM}${renderInlineTokens(tokens)}${RESET}`;
      }
      return `${DIM}${text}${RESET}`;
    },
    em: ({ text }: Tokens.Em): string => {
      return `${ITALIC}${fg(NIGHT_OWL.italic)}${text}${RESET}`;
    },
    heading({ depth, tokens }: Tokens.Heading): string {
      const prefix = repeat("  ", depth - 1);
      const text = renderInlineTokens(tokens);
      return `${prefix}${fg(headingColor(depth))}${BOLD}${text}${RESET}\n`;
    },
    hr: (): string => {
      return `${DIM}${HLINE}${RESET}\n`;
    },
    html: ({ text }: Tokens.HTML | Tokens.Tag): string => {
      return text;
    },
    image: ({ href, text }: Tokens.Image): string => {
      return `${fg(NIGHT_OWL.link)}[${text}](${href})${RESET}`;
    },
    link({ href, text, tokens }: Tokens.Link): string {
      const linkText = 0 < tokens.length ? renderInlineTokens(tokens) : text;
      return `${UNDERLINE}${fg(NIGHT_OWL.link)}${linkText}${RESET} ${DIM}${fg(NIGHT_OWL.linkUrl)}(${href})${RESET}`;
    },
    list(token: Tokens.List): string {
      let body = "";
      for (const item of token.items) {
        body += renderListItem(item);
      }
      return body;
    },
    listitem: renderListItem,
    paragraph: ({ tokens }: Tokens.Paragraph): string => {
      return `${renderInlineTokens(tokens)}\n`;
    },
    space: constant("\n"),
    strong: ({ text }: Tokens.Strong): string => {
      return `${fg(NIGHT_OWL.bold)}${BOLD}${text}${RESET}`;
    },
    table(token: Tokens.Table): string {
      let result = "";
      const headerCells = map(token.header, (cell) => {
        return cell.text;
      });
      result += `${headerCells.join("")}\n`;
      for (const row of token.rows) {
        const rowCells = map(row, (cell) => {
          return cell.text;
        });
        result += `${rowCells.join("")}\n`;
      }
      return result;
    },
    tablecell({ text, tokens }: Tokens.TableCell): string {
      if (0 < tokens.length) {
        return renderInlineTokens(tokens);
      }
      return text;
    },
    text(token: Tokens.Escape | Tokens.Text): string {
      if ("text" === token.type && token.tokens && 0 < token.tokens.length) {
        return renderInlineTokens(token.tokens);
      }
      return token.text;
    }
  };
}

function headingColor(depth: number): string {
  if (1 === depth) return NIGHT_OWL.heading1;
  if (2 === depth) return NIGHT_OWL.heading2;
  if (3 === depth) return NIGHT_OWL.heading3;
  return NIGHT_OWL.heading4;
}

function renderBlockquote(token: Tokens.Generic): string {
  assertToken<Tokens.Blockquote>(token, "blockquote");
  return `${fg(NIGHT_OWL.blockquoteBorder)}${DIM}＞ ${RESET}${DIM}${fg(NIGHT_OWL.blockquoteFg)}${token.text}${RESET}`;
}

function renderBr(): string {
  return "\n";
}

function renderCheckbox(token: Tokens.Generic): string {
  assertToken<Tokens.Checkbox>(token, "checkbox");
  return token.checked ? "[x]" : "[ ]";
}

function renderCodespan(token: Tokens.Generic): string {
  assertToken<Tokens.Codespan>(token, "codespan");
  return `${bg(NIGHT_OWL.inlineCodeBg)}${fg(NIGHT_OWL.inlineCodeFg)} ${token.text} ${RESET}`;
}

function renderDel(token: Tokens.Generic): string {
  assertToken<Tokens.Del>(token, "del");
  return `${DIM}${token.text}${RESET}`;
}

function renderEm(token: Tokens.Generic): string {
  assertToken<Tokens.Em>(token, "em");
  return `${ITALIC}${fg(NIGHT_OWL.italic)}${token.text}${RESET}`;
}

function renderEscape(token: Tokens.Generic): string {
  assertToken<Tokens.Escape>(token, "escape");
  return token.text;
}

function renderHtml(token: Tokens.Generic): string {
  assertToken<Tokens.HTML>(token, "html");
  return token.raw;
}

function renderImage(token: Tokens.Generic): string {
  assertToken<Tokens.Image>(token, "image");
  const altText =
    0 < token.tokens.length
      ? renderInlineTokens(token.tokens)
      : token.text || "image";
  return `${fg(NIGHT_OWL.link)}[${altText}](${token.href})${RESET}`;
}

function renderLink(token: Tokens.Generic): string {
  assertToken<Tokens.Link>(token, "link");
  const linkText =
    0 < token.tokens.length ? renderInlineTokens(token.tokens) : token.text;
  return `${UNDERLINE}${fg(NIGHT_OWL.link)}${linkText}${RESET} ${DIM}${fg(NIGHT_OWL.linkUrl)}(${token.href})${RESET}`;
}

function renderList(token: Tokens.Generic): string {
  assertToken<Tokens.List>(token, "list");
  return map(token.items, (item) => {
    return `  ${fg(NIGHT_OWL.listBullet)}• ${renderInlineTokens(item.tokens)}\n`;
  }).join("");
}

function renderParagraph(token: Tokens.Generic): string {
  assertToken<Tokens.Paragraph>(token, "paragraph");
  return renderInlineTokens(token.tokens);
}

function renderSpace(): string {
  return " ";
}

function renderStrong(token: Tokens.Generic): string {
  assertToken<Tokens.Strong>(token, "strong");
  return `${fg(NIGHT_OWL.bold)}${BOLD}${token.text}${RESET}`;
}

function renderText(token: Tokens.Generic): string {
  assertToken<Tokens.Text>(token, "text");
  return token.tokens && 0 < token.tokens.length
    ? renderInlineTokens(token.tokens)
    : token.text;
}

const RENDERERS: Record<string, (token: Tokens.Generic) => string> = {
  blockquote: renderBlockquote,
  br: renderBr,
  checkbox: renderCheckbox,
  codespan: renderCodespan,
  del: renderDel,
  em: renderEm,
  escape: renderEscape,
  html: renderHtml,
  image: renderImage,
  link: renderLink,
  list: renderList,
  paragraph: renderParagraph,
  space: renderSpace,
  strong: renderStrong,
  text: renderText
};

function renderInlineToken(token: Tokens.Generic): string {
  const renderer = RENDERERS[token.type];
  if (renderer) {
    return renderer(token);
  }
  return "";
}

function renderInlineTokens(tokens: Tokens.Generic[]): string {
  return map(tokens, renderInlineToken).join("");
}

function renderListItem(item: Tokens.ListItem): string {
  return `  ${fg(NIGHT_OWL.listBullet)}•${RESET} ${renderInlineTokens(item.tokens)}\n`;
}

marked.use({ renderer: createNightOwlRenderer() });

/**
Convert markdown text to terminal-native colored text.
Returns a plain string with ANSI color escapes — no HTML tags.
*/
export function renderMarkdown(text: string): string {
  const parsed = marked.parse(text, {
    breaks: false,
    gfm: true
  });
  const result = isString(parsed) ? parsed : "";
  return trim(stripHtmlTags(result));
}

function stripHtmlTags(input: string): string {
  return input.replaceAll(/<[^<>]*>/gu, "");
}
