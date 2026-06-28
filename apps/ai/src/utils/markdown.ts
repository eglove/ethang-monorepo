import map from "lodash/map.js";
import replace from "lodash/repeat.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { marked } from "marked";
import type { Tokens } from "marked";

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

const RESET = "\u{1B}[0m";
const BOLD = "\u{1B}[1m";
const ITALIC = "\u{1B}[3m";
const UNDERLINE = "\u{1B}[4m";
const DIM = "\u{1B}[2m";

const EMPTY_STRING = "";

function bg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (rgb === undefined) return EMPTY_STRING;
  return `\u{1B}[48;2;${rgb}m`;
}

function fg(hex: string): string {
  const rgb = hexToRgb(hex);
  if (rgb === undefined) return EMPTY_STRING;
  return `\u{1B}[38;2;${rgb}m`;
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

const HLINE = "─".repeat(60);

function renderInlineTokens(tokens: Tokens.Generic[]): string {
  let result = "";
  for (const token of tokens) {
    const t = token as Tokens.Generic;
    if (t.type === "strong") {
      const strongToken = t as Tokens.Strong;
      result += `${fg(NIGHT_OWL.bold)}${BOLD}${strongToken.text}${RESET}`;
    } else if (t.type === "em") {
      const emToken = t as Tokens.Em;
      result += `${ITALIC}${fg(NIGHT_OWL.italic)}${emToken.text}${RESET}`;
    } else if (t.type === "codespan") {
      const codespanToken = t as Tokens.Codespan;
      result += `${bg(NIGHT_OWL.inlineCodeBg)}${fg(NIGHT_OWL.inlineCodeFg)} ${codespanToken.text} ${RESET}`;
    } else if (t.type === "text") {
      const textToken = t as Tokens.Text;
      if (textToken.tokens && textToken.tokens.length > 0) {
        result += renderInlineTokens(textToken.tokens);
      } else {
        result += textToken.text;
      }
    } else if (t.type === "link") {
      const linkToken = t as Tokens.Link;
      result += `${UNDERLINE}${fg(NIGHT_OWL.link)}${linkToken.text}${RESET} ${DIM}${fg(NIGHT_OWL.linkUrl)}(${linkToken.href})${RESET}`;
    } else if (t.type === "image") {
      const imageToken = t as Tokens.Image;
      result += `${fg(NIGHT_OWL.link)}[${imageToken.text ?? "image"}](${imageToken.href})${RESET}`;
    } else if (t.type === "del") {
      const delToken = t as Tokens.Del;
      result += `${DIM}${delToken.text}${RESET}`;
    } else if (t.type === "br") {
      result += "\n";
    } else if (t.type === "escape") {
      result += (t as Tokens.Escape).text;
    } else if (t.type === "checkbox") {
      const checkboxToken = t as Tokens.Checkbox;
      result += checkboxToken.checked ? "[x]" : "[ ]";
    } else if (t.type === "paragraph") {
      const paraToken = t as Tokens.Paragraph;
      result += renderInlineTokens(paraToken.tokens ?? []);
    } else if (t.type === "codespan") {
      // handled above
    } else if (t.type === "space") {
      result += " ";
    } else if (t.type === "html") {
      result += (t as Tokens.HTML).raw;
    } else if (t.type === "blockquote") {
      const bqToken = t as Tokens.Blockquote;
      result += `${fg(NIGHT_OWL.blockquoteBorder)}${DIM}＞ ${RESET}${DIM}${fg(NIGHT_OWL.blockquoteFg)}${bqToken.text}${RESET}`;
    } else if ((t as { type: string }).type === "list") {
      const listToken = t as Tokens.List;
      result += listToken.body;
    }
  }
  return result;
}

function createNightOwlRenderer(): marked.Renderer {
  return {
    blockquote({ tokens }: marked.Tokens.Blockquote): string {
      return `${fg(NIGHT_OWL.blockquoteBorder)}${DIM}＞ ${RESET}${DIM}${fg(NIGHT_OWL.blockquoteFg)}${renderInlineTokens(tokens)}${RESET}\n`;
    },

    br(): string {
      return `\n`;
    },

    code({ text }: marked.Tokens.Code): string {
      const borderColor = fg(NIGHT_OWL.codeBlockBorder);
      const fgColor = fg(NIGHT_OWL.codeBlockFg);
      const border = `${borderColor}${DIM}${HLINE}${RESET}`;
      const lines = map(split(text, "\n"), (line) => {
        return `${DIM}│${RESET}${fgColor}${line}${RESET}`;
      });
      return `${border}\n${lines.join("\n")}\n${border}\n`;
    },

    codespan({ text }: marked.Tokens.Codespan): string {
      return `${bg(NIGHT_OWL.inlineCodeBg)}${fg(NIGHT_OWL.inlineCodeFg)} ${text} ${RESET}`;
    },

    em({ text }: marked.Tokens.Em): string {
      return `${ITALIC}${fg(NIGHT_OWL.italic)}${text}${RESET}`;
    },

    heading({ depth, text }: marked.Tokens.Heading): string {
      const prefix = replace("  ", "", depth - 1);
      return `${prefix}${fg(headingColor(depth))}${BOLD}${text}${RESET}\n`;
    },

    hr(): string {
      return `${DIM}${HLINE}${RESET}\n`;
    },

    link({ href, text }: marked.Tokens.Link): string {
      return `${UNDERLINE}${fg(NIGHT_OWL.link)}${text}${RESET} ${DIM}${fg(NIGHT_OWL.linkUrl)}(${href})${RESET}`;
    },

    list(token: marked.Tokens.List): string {
      const renderer = this as unknown as marked.Renderer;
      let body = "";
      for (const item of token.items) {
        body += renderer.listitem(item);
      }
      return body;
    },

    listitem({ tokens }: marked.Tokens.ListItem): string {
      return `  ${fg(NIGHT_OWL.listBullet)}•${RESET} ${renderInlineTokens(tokens)}\n`;
    },

    paragraph({ tokens }: marked.Tokens.Paragraph): string {
      return `${renderInlineTokens(tokens)}\n`;
    },

    strong({ text }: marked.Tokens.Strong): string {
      return `${fg(NIGHT_OWL.bold)}${BOLD}${text}${RESET}`;
    },

    space(): string {
      return "\n";
    },

    html({ text }: marked.Tokens.HTML): string {
      return text;
    },

    del({ text }: marked.Tokens.Del): string {
      return `${DIM}${text}${RESET}`;
    },

    image({ href, text }: marked.Tokens.Image): string {
      return `${fg(NIGHT_OWL.link)}[${text}](${href})${RESET}`;
    },

    text({ text, tokens }: marked.Tokens.Text): string {
      if (tokens && tokens.length > 0) {
        return renderInlineTokens(tokens);
      }
      return text;
    },

    checkbox({ checked }: marked.Tokens.Checkbox): string {
      return checked ? "[x]" : "[ ]";
    },

    table({ header, body }: marked.Tokens.Table): string {
      return `${header}\n${body}`;
    },

    tablerow({ text }: marked.Tokens.TableRow): string {
      return text;
    },

    tablecell({ text }: marked.Tokens.TableCell): string {
      return text;
    }
  };
}

function headingColor(depth: number): string {
  if (1 === depth) return NIGHT_OWL.heading1;
  if (2 === depth) return NIGHT_OWL.heading2;
  if (3 === depth) return NIGHT_OWL.heading3;
  return NIGHT_OWL.heading4;
}

const nightOwlRenderer = createNightOwlRenderer();

/**
Convert markdown text to terminal-native colored text.
Returns a plain string with ANSI color escapes — no HTML tags.
*/
export function renderMarkdown(text: string): string {
  const result = marked.parse(text, {
    breaks: false,
    gfm: true,
    renderer: nightOwlRenderer
  });
  return trim(stripHtmlTags(result));
}

function stripHtmlTags(input: string): string {
  return input.replaceAll(/<[^>]*>/gu, "");
}
