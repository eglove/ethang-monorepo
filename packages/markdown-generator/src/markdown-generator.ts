import endsWith from "lodash/endsWith.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import keys from "lodash/keys.js";
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
  blocks: (MarkdownBlock | null | undefined)[];
  frontmatter?: Record<string, boolean | number | string>;
};

export type TableHeader =
  | { align?: "center" | "left" | "right"; text: string }
  | string;

export type TaskListItem = {
  isComplete: boolean;
  label: string;
};

type AlertBlock = Extract<MarkdownBlock, { type: "alert" }>;
type CodeBlock = Extract<MarkdownBlock, { type: "codeBlock" }>;
type HeaderBlock = Extract<MarkdownBlock, { type: "header" }>;
type NumberedListBlock = Extract<MarkdownBlock, { type: "numberedList" }>;
type QuoteBlock = Extract<MarkdownBlock, { type: "quote" }>;
type TableBlock = Extract<MarkdownBlock, { type: "table" }>;
type TaskListBlock = Extract<MarkdownBlock, { type: "taskList" }>;
type TextBlock = Extract<MarkdownBlock, { type: "text" }>;
type UnorderedListBlock = Extract<MarkdownBlock, { type: "unorderedList" }>;

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
  const sortedKeys = keys(frontmatter).toSorted((a, b) => {
    if ("title" === a) {
      return -1;
    }
    if ("title" === b) {
      return 1;
    }
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const value = frontmatter[key];
    if (!isNil(value)) {
      const valueString = String(value);
      assertNoNewline(valueString, key);
      lines.push(`${key}: ${yamlScalar(valueString)}`);
    }
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

const renderAlert = (block: AlertBlock): string => {
  const lines = split(block.text, "\n");
  const formatted = map(lines, (line) => {
    return `> ${line}`;
  }).join("\n");
  return `> [!${block.alertType}]\n${formatted}`;
};

const renderTable = (block: TableBlock): string => {
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

const renderers = {
  alert: (block: AlertBlock) => {
    return renderAlert(block);
  },
  codeBlock: (block: CodeBlock) => {
    const lang = block.language ?? "";
    return `\`\`\`${lang}\n${block.code}\n\`\`\``;
  },
  header: (block: HeaderBlock) => {
    const hashes = repeat("#", block.level);
    return `${hashes} ${block.text}`;
  },
  numberedList: (block: NumberedListBlock) => {
    return renderList(block.items, "numbered");
  },
  quote: (block: QuoteBlock) => {
    return map(split(block.text, "\n"), (line) => {
      return `> ${line}`;
    }).join("\n");
  },
  table: (block: TableBlock) => {
    return renderTable(block);
  },
  taskList: (block: TaskListBlock) => {
    return map(block.items, (item) => {
      const checkbox = item.isComplete ? "X" : " ";
      return `[${checkbox}] ${item.label}`;
    }).join("\n");
  },
  text: (block: TextBlock) => {
    return block.text;
  },
  unorderedList: (block: UnorderedListBlock) => {
    return renderList(block.items, "unordered");
  }
};

const renderBlock = (
  block: Exclude<MarkdownBlock, { type: "space" }>
): string => {
  const { type } = block;
  switch (type) {
    case "alert": {
      return renderers.alert(block);
    }
    case "codeBlock": {
      return renderers.codeBlock(block);
    }
    case "header": {
      return renderers.header(block);
    }
    case "numberedList": {
      return renderers.numberedList(block);
    }
    case "quote": {
      return renderers.quote(block);
    }
    case "table": {
      return renderers.table(block);
    }
    case "taskList": {
      return renderers.taskList(block);
    }
    case "text": {
      return renderers.text(block);
    }
    case "unorderedList": {
      return renderers.unorderedList(block);
    }
    default: {
      return "";
    }
  }
};

const processBlock = (
  block: MarkdownBlock,
  state: {
    hasWrittenBlock: boolean;
    lastBlockType: string | undefined;
    result: string;
  }
) => {
  if ("space" === block.type) {
    const count = block.count ?? 1;
    state.result += repeat("\n", count + 1);
    state.lastBlockType = "space";
  } else {
    const rendered = renderBlock(block);
    if (state.hasWrittenBlock && "space" !== state.lastBlockType) {
      state.result += "\n\n";
    }
    state.result += rendered;
    state.hasWrittenBlock = true;
    state.lastBlockType = block.type;
  }
};

export const generateMarkdown = (document: MarkdownDocument): string => {
  let result = "";

  if (document.frontmatter) {
    result += renderFrontmatter(document.frontmatter);
  }

  const state = {
    hasWrittenBlock: false,
    lastBlockType: undefined as string | undefined,
    result: ""
  };

  for (const block of document.blocks) {
    if (!isNil(block)) {
      processBlock(block, state);
    }
  }

  result += state.result;

  if (0 < result.length && !endsWith(result, "\n")) {
    result += "\n";
  }

  return result;
};
