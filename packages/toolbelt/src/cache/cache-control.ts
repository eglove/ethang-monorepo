import filter from "lodash/filter.js";
import forEach from "lodash/forEach.js";
import includes from "lodash/includes.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";

export const CACHE_CONTROL_HEADER = "Cache-Control";
export const CACHE_TAG_HEADER = "Cache-Tag";
export const VARY_HEADER = "Vary";

export type CacheControlOptions = {
  maxAge?: number;
  scope?: CacheScope;
  swr?: number;
};

export type CacheScope = "no-store" | "private" | "public";

export const DEFAULT_MAX_AGE_SECONDS = 300;
export const DEFAULT_STALE_WHILE_REVALIDATE_SECONDS = 3600;

export const buildCacheControlHeader = (
  options: CacheControlOptions = {}
): string => {
  if ("no-store" === (options.scope ?? "public")) {
    return "no-store";
  }

  const scope = options.scope ?? "public";
  if (isPrivateNoStore(scope, options.maxAge ?? null)) {
    return join([scope, "no-store"], ", ");
  }

  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE_SECONDS;
  const swr = options.swr ?? DEFAULT_STALE_WHILE_REVALIDATE_SECONDS;

  const parts: string[] = [scope, `max-age=${maxAge}`];
  if (0 < maxAge && 0 < swr) {
    parts.push(`stale-while-revalidate=${swr}`);
  }
  return join(parts, ", ");
};

const isPrivateNoStore = (scope: CacheScope, maxAge: null | number) => {
  return "private" === scope && 0 === (maxAge ?? 0);
};

export const buildCacheTagHeader = (tags: readonly string[]): null | string => {
  const cleaned = filter(
    map(tags, (tag) => {
      return trim(tag);
    }),
    (tag) => {
      return "" !== tag;
    }
  );
  if (isEmpty(cleaned)) {
    return null;
  }
  return join(cleaned, ", ");
};

const appendVaryValues = (
  existing: null | string,
  incoming: string
): string => {
  if (isNil(existing) || "" === existing) {
    return incoming;
  }

  const existingParts = filter(
    map(split(existing, ","), (part) => {
      return trim(part);
    }),
    (part) => {
      return "" !== part;
    }
  );
  const merged: string[] = [...existingParts];
  forEach(split(incoming, ","), (part) => {
    const trimmed = trim(part);
    if ("" !== trimmed && !includes(merged, trimmed)) {
      merged.push(trimmed);
    }
  });
  return join(merged, ", ");
};

export const withCacheHeaders = (
  response: Response,
  options: {
    cacheControl?: CacheControlOptions;
    tags?: readonly string[];
    vary?: readonly string[];
  } = {}
): Response => {
  const headers = new Headers(response.headers);
  headers.set(
    CACHE_CONTROL_HEADER,
    buildCacheControlHeader(options.cacheControl ?? {})
  );

  const tagHeader = buildCacheTagHeader(options.tags ?? []);
  if (!isNil(tagHeader)) {
    headers.set(CACHE_TAG_HEADER, tagHeader);
  }

  if (!isNil(options.vary) && !isEmpty(options.vary)) {
    const incoming = join(
      map(options.vary, (v) => {
        return trim(v);
      }),
      ", "
    );
    headers.set(
      VARY_HEADER,
      appendVaryValues(headers.get(VARY_HEADER), incoming)
    );
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });
};

export const createCachedJsonResponse = <T>(
  data: T,
  options: {
    cacheControl?: CacheControlOptions;
    init?: ResponseInit;
    tags?: readonly string[];
    vary?: readonly string[];
  } = {}
): Response => {
  const init = options.init ?? {};
  const body = null === data ? "null" : JSON.stringify(data);
  const base = new Response(body, init);
  return withCacheHeaders(base, {
    cacheControl: options.cacheControl ?? {},
    tags: options.tags ?? [],
    vary: options.vary ?? []
  });
};
