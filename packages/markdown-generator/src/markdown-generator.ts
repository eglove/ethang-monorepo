import endsWith from "lodash/endsWith.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import repeat from "lodash/repeat.js";
import split from "lodash/split.js";

export type ListItem = {
  children?: ListItem[];
  text: string;
};

export type MarkdownBlock =
  | {
      alertType: "CAUTION" | "IMPORTANT" | "NOTE" | "TIP" | "WARNING";
      text: string;
      type: "alert";
    }
  | { code: string; language?: string; type: "codeBlock" }
  | { count?: number; type: "space" }
  | { headers: TableHeader[]; rows: string[][]; type: "table" }
  | { items: ListItem[]; type: "numberedList" }
  | { items: ListItem[]; type: "unorderedList" }
  | { items: TaskListItem[]; type: "taskList" }
  | { level: 1 | 2 | 3; text: string; type: "header" }
  | { text: string; type: "quote" }
  | { text: string; type: "text" };

export type MarkdownDocument = {
  blocks: MarkdownBlock[];
  frontmatter?: Record<string, boolean | number | string>;
};

export type TableHeader =
  | { align?: "center" | "left" | "right"; text: string }
  | string;

export type TaskListItem = {
  isComplete: boolean;
  label: string;
};

export const bold = (text: string): string => {
  return `**${text}**`;
};

export const image = (text: string, url: string): string => {
  return `![${text}](${url})`;
};

export const inlineCode = (text: string): string => {
  return `\`${text}\``;
};

export const italic = (text: string): string => {
  return `*${text}*`;
};

export const link = (text: string, url: string): string => {
  return `[${text}](${url})`;
};

export const mention = (text: string): string => {
  return `@${text}`;
};

export const strikeThrough = (text: string): string => {
  return `~~${text}~~`;
};

export const subscript = (text: string): string => {
  return `<sub>${text}</sub>`;
};

export const superscript = (text: string): string => {
  return `<sup>${text}</sup>`;
};

const assertNoNewline = (value: string, key: string): void => {
  if (includes(value, "\n")) {
    throw new Error(
      `Frontmatter value for "${key}" contains a newline; multi-line values are not allowed: ${JSON.stringify(value)}`
    );
  }
};

const yamlScalar = (value: string): string => {
  if (!/[:"#]/u.test(value)) {
    return value;
  }

  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', String.raw`\"`);
  return `"${escaped}"`;
};

const renderFrontmatter = (
  frontmatter: Record<string, boolean | number | string>
): string => {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(frontmatter)) {
    const valueString = String(value);
    assertNoNewline(valueString, key);
    lines.push(`${key}: ${yamlScalar(valueString)}`);
  }
  return `---\n${lines.join("\n")}\n---\n`;
};

const renderList = (
  items: ListItem[],
  listType: "numbered" | "unordered",
  level = 0
): string => {
  const lines: string[] = [];
  const prefix = "unordered" === listType ? "* " : "1. ";
  const indent = repeat("\t", level);

  for (const item of items) {
    lines.push(`${indent}${prefix}${item.text}`);
    if (item.children && 0 < item.children.length) {
      lines.push(renderList(item.children, listType, level + 1));
    }
  }
  return lines.join("\n");
};

const renderAlert = (block: { type: "alert" } & MarkdownBlock): string => {
  const lines = split(block.text, "\n");
  const formatted = map(lines, (line) => {
    return `> ${line}`;
  }).join("\n");
  return `> [!${block.alertType}]\n${formatted}`;
};

const renderTable = (block: { type: "table" } & MarkdownBlock): string => {
  const headerLength = block.headers.length;
  const rowLines: string[] = [];

  for (const row of block.rows) {
    if (row.length !== headerLength) {
      throw new Error(
        `Table row cell count (${String(row.length)}) does not match header count (${String(headerLength)})`
      );
    }
    rowLines.push(`| ${row.join(" | ")} |`);
  }

  const headerTexts = map(block.headers, (h) => {
    return isString(h) ? h : h.text;
  });
  const headerLine = `| ${headerTexts.join(" | ")} |`;

  const dividers = map(block.headers, (h) => {
    if (isString(h) || isNil(h.align)) {
      return "---";
    }
    if ("left" === h.align) {
      return ":---";
    }
    if ("center" === h.align) {
      return ":---:";
    }
    return "---:";
  });
  const dividerLine = `| ${dividers.join(" | ")} |`;

  return [headerLine, dividerLine, ...rowLines].join("\n");
};

/* eslint-disable sonar/cyclomatic-complexity */
const renderBlock = (
  block: Exclude<MarkdownBlock, { type: "space" }>
): string => {
  switch (block.type) {
    case "alert": {
      return renderAlert(block);
    }
    case "codeBlock": {
      const lang = block.language ?? "";
      return `\`\`\`${lang}\n${block.code}\n\`\`\``;
    }
    case "header": {
      const hashes = repeat("#", block.level);
      return `${hashes} ${block.text}`;
    }
    case "numberedList": {
      return renderList(block.items, "numbered");
    }
    case "quote": {
      return map(split(block.text, "\n"), (line) => {
        return `> ${line}`;
      }).join("\n");
    }

    case "table": {
      return renderTable(block);
    }
    case "taskList": {
      return map(block.items, (item) => {
        const checkbox = item.isComplete ? "X" : " ";
        return `[${checkbox}] ${item.label}`;
      }).join("\n");
    }
    case "text": {
      return block.text;
    }
    case "unorderedList": {
      return renderList(block.items, "unordered");
    }
  }
};
/* eslint-enable sonar/cyclomatic-complexity */

export const generateMarkdown = (document: MarkdownDocument): string => {
  let result = "";

  if (document.frontmatter) {
    result += renderFrontmatter(document.frontmatter);
  }

  let hasWrittenBlock = false;
  let lastBlockType: string | undefined;

  for (const block of document.blocks) {
    if ("space" === block.type) {
      const count = block.count ?? 1;
      result += repeat("\n", count + 1);
      lastBlockType = "space";
    } else {
      const rendered = renderBlock(block);
      if (hasWrittenBlock && "space" !== lastBlockType) {
        result += "\n\n";
      }
      result += rendered;
      hasWrittenBlock = true;
      lastBlockType = block.type;
    }
  }

  if (0 < result.length && !endsWith(result, "\n")) {
    result += "\n";
  }

  return result;
};
