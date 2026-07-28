import { Effect, Number, Option } from "effect";
import constant from "lodash/constant.js";
import endsWith from "lodash/endsWith.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
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

const parseSizeValue = (sizes: null | string) => {
  if (isNil(sizes)) {
    return 0;
  }
  const match = SIZE_DIMENSION_PATTERN.exec(sizes);
  if (isNil(match)) {
    return 0;
  }
  const [, width, height] = match;

  if (!isString(width) || !isString(height)) {
    return 0;
  }
  return (
    Option.getOrElse(Number.parse(width), constant(0)) *
    Option.getOrElse(Number.parse(height), constant(0))
  );
};

const returnNull = constant(null);

const resolveHref = (href: string, baseUrl: string) => {
  return Effect.runSync(
    Effect.try({
      catch: returnNull,
      try: () => {
        const resolved = new URL(href, baseUrl);
        return resolved.href;
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    )
  );
};

const buildFaviconFallback = (baseUrl: string) => {
  const originValue = Effect.runSync(
    Effect.try({
      catch: returnNull,
      try: () => {
        const parsedBase = new URL(baseUrl);
        return parsedBase.origin;
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    )
  );
  if (isNil(originValue)) {
    return null;
  }
  return `${originValue}/favicon.ico`;
};

const readLinkTag = (tag: string) => {
  const relationshipMatch = REL_PATTERN.exec(tag);
  if (isNil(relationshipMatch)) {
    return null;
  }
  const [, linkRelationship = ""] = relationshipMatch;
  if (!isIconRelationship(linkRelationship)) {
    return null;
  }
  const hrefMatch = HREF_PATTERN.exec(tag);
  const href = hrefMatch?.[1] ?? "";
  if ("" === href) {
    return null;
  }
  const sizesMatch = SIZES_PATTERN.exec(tag);
  const sizes = sizesMatch?.[1] ?? null;
  return {
    href,
    sizes
  };
};

const pickBestIcon = (matches: string[]) => {
  let bestIndex = -1;
  let bestArea = 0;
  let bestHref: null | string = null;

  for (const [index, tag] of matches.entries()) {
    const parsed = readLinkTag(tag);
    if (!isNil(parsed)) {
      const area = parseSizeValue(parsed.sizes);
      if (-1 === bestIndex || area > bestArea) {
        bestIndex = index;
        bestArea = area;
        bestHref = parsed.href;
      }
    }
  }

  if (-1 === bestIndex || isNil(bestHref)) {
    return null;
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
