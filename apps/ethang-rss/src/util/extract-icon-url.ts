import endsWith from "lodash/endsWith.js";
import isNil from "lodash/isNil.js";
import some from "lodash/some.js";
import startsWith from "lodash/startsWith.js";
import toLower from "lodash/toLower.js";

const REL_PATTERN = /rel\s*=\s*"([^"]*)"/iu;
const HREF_PATTERN = /href\s*=\s*"([^"]*)"/iu;
const SIZES_PATTERN = /sizes\s*=\s*"([^"]*)"/iu;
const LINK_TAG_PATTERN = /<link\b[^>]*>/giu;
const SIZE_DIMENSION_PATTERN = /^(\d+)[xX](\d+)$/u;

const ICON_REL_ALTERNATIVES = [
  "icon",
  "shortcut icon",
  "apple-touch-icon"
] as const;

const isIconRelationship = (relationshipValue: string) => {
  const normalized = toLower(relationshipValue);
  return some(ICON_REL_ALTERNATIVES, (alt) => {
    if (normalized === alt) {
      return true;
    }
    if (startsWith(normalized, `${alt} `)) {
      return true;
    }
    return endsWith(normalized, ` ${alt}`);
  });
};

const parseSizeValue = (sizes: string | undefined) => {
  if (isNil(sizes)) {
    return 0;
  }
  const match = SIZE_DIMENSION_PATTERN.exec(sizes);
  if (isNil(match)) {
    return 0;
  }
  return Number(match[1]) * Number(match[2]);
};

const resolveHref = (href: string, baseUrl: string) => {
  let resolvedHref: string | undefined;
  try {
    const resolved = new URL(href, baseUrl);
    resolvedHref = resolved.href;
  } catch {
    /* invalid href or baseUrl */
  }
  return resolvedHref;
};

const buildFaviconFallback = (baseUrl: string) => {
  let originValue: string | undefined;
  try {
    const parsedBase = new URL(baseUrl);
    originValue = parsedBase.origin;
  } catch {
    /* invalid baseUrl */
  }
  if (isNil(originValue)) {
    return;
  }
  return `${originValue}/favicon.ico`;
};

const readLinkTag = (tag: string) => {
  const relationshipMatch = REL_PATTERN.exec(tag);
  if (isNil(relationshipMatch)) {
    return;
  }
  const [, linkRelationship = ""] = relationshipMatch;
  if (!isIconRelationship(linkRelationship)) {
    return;
  }
  const hrefMatch = HREF_PATTERN.exec(tag);
  const href = hrefMatch?.[1] ?? "";
  if ("" === href) {
    return;
  }
  const sizesMatch = SIZES_PATTERN.exec(tag);
  const sizes = sizesMatch?.[1];
  return {
    href,
    sizes
  };
};

const pickBestIcon = (
  matches: string[]
): { href: string; index: number } | undefined => {
  let bestIndex = -1;
  let bestArea = 0;
  let bestHref: string | undefined;

  for (const [index, tag] of matches.entries()) {
    const parsed = readLinkTag(tag);
    if (isNil(parsed)) {
      // skip non-icon link tags
    } else {
      const area = parseSizeValue(parsed.sizes);
      if (-1 === bestIndex || area > bestArea) {
        bestIndex = index;
        bestArea = area;
        bestHref = parsed.href;
      }
    }
  }

  if (-1 === bestIndex || isNil(bestHref)) {
    return;
  }
  return { href: bestHref, index: bestIndex };
};

export const extractIconUrl = (html: string, baseUrl: string) => {
  if ("" === html) {
    return null;
  }

  const matches = html.match(LINK_TAG_PATTERN) ?? [];
  const best = pickBestIcon(matches);

  if (!isNil(best)) {
    const resolved = resolveHref(best.href, baseUrl);
    if (!isNil(resolved)) {
      return resolved;
    }
  }

  const fallback = buildFaviconFallback(baseUrl);
  if (isNil(fallback)) {
    return null;
  }
  return fallback;
};
