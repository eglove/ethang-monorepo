import type { env } from "cloudflare:workers";

import { Effect, Number as EffectNumber, Option } from "effect";
import isNil from "lodash/isNil.js";

export const RSS_PAGE_SIZE = 20;
export const MAX_PAGE = 100;
export const FEEDS_PAGE_PARAM = "feedsPage";
export const ARTICLES_PAGE_PARAM = "articlesPage";
export const ACTION_PARAM = "_action";

export const EMPTY_PAGE_INFO = {
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null
};

// @ts-expect-error partial
export const EMPTY_SUBSCRIPTIONS: Awaited<
  ReturnType<typeof env.ethang_rss.subscriptions>
> = {
  edges: [],
  pageInfo: EMPTY_PAGE_INFO
};

// @ts-expect-error partial
export const EMPTY_ARTICLES: Awaited<
  ReturnType<typeof env.ethang_rss.allArticles>
> = {
  edges: [],
  pageInfo: EMPTY_PAGE_INFO
};

export type MutationResult = { error: string } | { success: true };

const toErrorMessage = (error: unknown) => {
  return Error.isError(error) ? error.message : String(error);
};

/**
Parse a 1-based page number from the query string, clamped to a safe range.
Anything missing, non-positive, non-integer, or above MAX_PAGE collapses to a
valid default so the worker is never queried with garbage.
*/
export const getPageNumber = (
  searchParameters: URLSearchParams,
  key: string
) => {
  const raw = searchParameters.get(key);
  if (isNil(raw)) {
    return 1;
  }
  const parsed = EffectNumber.parse(raw);
  if (Option.isNone(parsed) || !Number.isSafeInteger(parsed.value)) {
    return 1;
  }
  return EffectNumber.clamp({ maximum: MAX_PAGE, minimum: 1 })(parsed.value);
};

export const getFirst = (page: number) => {
  return RSS_PAGE_SIZE * page;
};

/**
Build the action URL for a mutation form. Astro's form-action server handler
dispatches on a `_action` query param and re-renders the page at that exact
URL, so we preserve the existing pagination params here to keep the sidebar
and article list stable across removes / mark-as-read.
*/
export const buildFormHref = (currentUrl: URL, actionName: string) => {
  const searchParameters = new URLSearchParams(currentUrl.search);
  searchParameters.set(ACTION_PARAM, actionName);
  return `${currentUrl.pathname}?${searchParameters.toString()}`;
};

export const buildLoadMoreHref = (currentUrl: URL, pageParameter: string) => {
  const searchParameters = new URLSearchParams(currentUrl.search);
  const current = getPageNumber(searchParameters, pageParameter);
  searchParameters.set(pageParameter, String(Math.min(current + 1, MAX_PAGE)));
  return `${currentUrl.pathname}?${searchParameters.toString()}`;
};

export const getSubscriptions = async (
  worker: typeof env.ethang_rss,
  sessionToken: string,
  page: number
) => {
  return Effect.runPromise(
    Effect.tryPromise({
      catch: () => {
        return new Error("Failed to load subscriptions");
      },
      try: async () => {
        return worker.subscriptions({
          first: getFirst(page),
          sessionToken,
          sortBy: { direction: "ASC", field: "TITLE" }
        });
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(EMPTY_SUBSCRIPTIONS);
      })
    )
  );
};

export const getArticles = async (
  worker: typeof env.ethang_rss,
  sessionToken: string,
  page: number
) => {
  return Effect.runPromise(
    Effect.tryPromise({
      catch: () => {
        return new Error("Failed to load articles");
      },
      try: async () => {
        return worker.allArticles({
          first: getFirst(page),
          isRead: false,
          sessionToken
        });
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(EMPTY_ARTICLES);
      })
    )
  );
};

export const addFeed = async (
  worker: typeof env.ethang_rss,
  parameters: { sessionToken: string; xmlAddress: string }
) => {
  return Effect.runPromise(
    Effect.tryPromise({
      catch: toErrorMessage,
      try: async () => {
        await worker.addSubscription(parameters);
        return { success: true as const };
      }
    }).pipe(
      Effect.catchAll((message) => {
        return Effect.succeed({ error: message });
      })
    )
  );
};

export const removeFeed = async (
  worker: typeof env.ethang_rss,
  parameters: { feedId: string; sessionToken: string }
) => {
  return Effect.runPromise(
    Effect.tryPromise({
      catch: toErrorMessage,
      try: async () => {
        await worker.removeSubscription(parameters);
        return { success: true as const };
      }
    }).pipe(
      Effect.catchAll((message) => {
        return Effect.succeed({ error: message });
      })
    )
  );
};

export const markArticleRead = async (
  worker: typeof env.ethang_rss,
  parameters: { articleId: string; isRead: boolean; sessionToken: string }
) => {
  return Effect.runPromise(
    Effect.tryPromise({
      catch: toErrorMessage,
      try: async () => {
        await worker.markArticleRead(parameters);
        return { success: true as const };
      }
    }).pipe(
      Effect.catchAll((message) => {
        return Effect.succeed({ error: message });
      })
    )
  );
};
