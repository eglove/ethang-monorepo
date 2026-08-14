import join from "lodash/join.js";
import lastIndexOf from "lodash/lastIndexOf.js";
import reject from "lodash/reject.js";
import replace from "lodash/replace.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import trimEnd from "lodash/trimEnd.js";
import trimStart from "lodash/trimStart.js";

export const DEFAULT_EXCERPT_LENGTH = 155;

export const excerptFromMarkdown = (
  markdown: string,
  maxLength = DEFAULT_EXCERPT_LENGTH
) => {
  const text = stripMarkdown(markdown);

  if (text.length <= maxLength) {
    return text;
  }

  const head = text.slice(0, maxLength);
  const lastSpace = lastIndexOf(head, " ");

  return `${0 < lastSpace ? head.slice(0, lastSpace) : trimEnd(head)}…`;
};

const stripMarkdown = (markdown: string) => {
  const withoutFrontmatter = replace(markdown, /^---[\s\S]*?---/u, "");
  const withoutImports = join(
    reject(split(withoutFrontmatter, "\n"), (line) => {
      return trimStart(line).startsWith("import ");
    }),
    "\n"
  );

  return trim(
    withoutImports
      .replaceAll(/```[\s\S]*?```/gu, " ")
      .replaceAll(/!\[[^\]]*\]\([^)]*\)/gu, " ")
      .replaceAll(/\[([\w\s.-]*)\]\(([\w\s./?=&%-]*)\)/gu, "$1")
      .replaceAll(/^ *#{1,6} +/gmu, "")
      .replaceAll(/^> ?/gmu, "")
      .replaceAll(/^ *[-*+] +/gmu, "")
      .replaceAll(/^ *\d+\. +/gmu, "")
      .replaceAll(/\s+/gu, " ")
      .replaceAll(/[`*_~]/gu, "")
      .replaceAll(/<[\w\s/="':.-]*>/gu, " ")
      .replaceAll(/\s+/gu, " ")
  );
};

export const canonicalUrl = (pathname: string, site: string | URL) => {
  const url = new URL(pathname, site);

  return url.href;
};

export const imageUrl = (source: string, site: string | URL) => {
  const url = new URL(source, site);

  return url.href;
};
