export const DEFAULT_EXCERPT_LENGTH = 155;

export const excerptFromMarkdown = (markdown: string, maxLength = DEFAULT_EXCERPT_LENGTH) => {
  const text = stripMarkdown(markdown);
  if (text.length <= maxLength) {
    return text;
  }
  const head = text.slice(0, maxLength);
  const lastSpace = head.lastIndexOf(" ");
  return `${lastSpace > 0 ? head.slice(0, lastSpace) : head.trimEnd()}…`;
};

const stripMarkdown = (markdown: string) => {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---/, "");
  const withoutImports = withoutFrontmatter
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("import "))
    .join("\n");
  return (
    withoutImports
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}[-*+]\s+/gm, "")
      .replace(/^\s{0,3}\d+\.\s+/gm, "")
      .replace(/\s+/g, " ")
      .replace(/[`*_~]/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
};

export const canonicalUrl = (pathname: string, site: string | URL) => new URL(pathname, site).href;

export const imageUrl = (src: string, site: string | URL) => new URL(src, site).href;