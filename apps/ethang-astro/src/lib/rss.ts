import { Effect, Number as EffectNumber, Option } from "effect";
import isNil from "lodash/isNil.js";

export const RSS_PAGE_SIZE = 20;
export const MAX_PAGE = 100;
export const FEEDS_PAGE_PARAM = "feedsPage";
export const ARTICLES_PAGE_PARAM = "articlesPage";
export const ACTION_PARAM = "_action";

export type ArticleEdge = {
  cursor: string;
  node: ArticleNode;
};

export type ArticleNode = {
  content: null | string;
  feed: { iconUrl: null | string; id: string; title: string } | null;
  guid: string;
  id: string;
  isRead: boolean;
  link: string;
  publishedAt: null | string;
  title: string;
};

export type ArticlesResult = {
  edges: ArticleEdge[];
  pageInfo: PageInfo;
};

export type FeedNode = {
  iconUrl: null | string;
  id: string;
  title: string;
  website: null | string;
};

export type PageInfo = {
  endCursor: null | string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: null | string;
};

/**
Structural subset of the `ethang_rss` worker surface used by the astro app.
Declaring the dependency as an interface keeps the helpers unit-testable
with a mock worker instead of the real Cloudflare binding.
*/
export type RssWorker = {
  addSubscription: (parameters: {
    sessionToken: string;
    xmlAddress: string;
  }) => Promise<unknown>;
  allArticles: (parameters: {
    after?: null | string;
    first?: number;
    isRead?: boolean;
    sessionToken: string;
  }) => Promise<ArticlesResult>;
  markArticleRead: (parameters: {
    articleId: string;
    isRead: boolean;
    sessionToken: string;
  }) => Promise<unknown>;
  removeSubscription: (parameters: {
    feedId: string;
    sessionToken: string;
  }) => Promise<unknown>;
  subscriptions: (parameters: {
    after?: null | string;
    first?: number;
    sessionToken: string;
  }) => Promise<SubscriptionsResult>;
};

export type SubscriptionEdge = {
  cursor: string;
  node: FeedNode;
};

export type SubscriptionsResult = {
  edges: SubscriptionEdge[];
  pageInfo: PageInfo;
};

export const EMPTY_PAGE_INFO: PageInfo = {
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null
};

export const EMPTY_SUBSCRIPTIONS: SubscriptionsResult = {
  edges: [],
  pageInfo: EMPTY_PAGE_INFO
};

export const EMPTY_ARTICLES: ArticlesResult = {
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
  worker: RssWorker,
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
          sessionToken
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
  worker: RssWorker,
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
  worker: RssWorker,
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
  worker: RssWorker,
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
  worker: RssWorker,
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
