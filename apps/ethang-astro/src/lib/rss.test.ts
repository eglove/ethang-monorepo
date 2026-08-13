import isNil from "lodash/isNil.js";
import { describe, expect, it, vi } from "vitest";

import {
  addFeed,
  ARTICLES_PAGE_PARAM,
  buildFormHref,
  buildLoadMoreHref,
  EMPTY_ARTICLES,
  EMPTY_SUBSCRIPTIONS,
  FEEDS_PAGE_PARAM,
  getArticles,
  getFirst,
  getPageNumber,
  getSubscriptions,
  markArticleRead,
  MAX_PAGE,
  removeFeed,
  RSS_PAGE_SIZE,
  type RssWorker
} from "./rss.ts";

const FEED_ID = "feed-1";
const ARTICLE_ID = "article-1";
const SESSION_TOKEN = "token";
const XML_ADDRESS = "https://x/rss";
const BOOM = "boom";
const NOPE = "nope";
const STRING_FAILURE = "string failure";
const REMOVE_FEED_PARAMS = { feedId: FEED_ID, sessionToken: SESSION_TOKEN };
const ADD_FEED_PARAMS = {
  sessionToken: SESSION_TOKEN,
  xmlAddress: XML_ADDRESS
};
const MARK_READ_PARAMS = {
  articleId: ARTICLE_ID,
  isRead: true,
  sessionToken: SESSION_TOKEN
};

const resolveNull = async () => {
  return null;
};
const resolveEmptyArticles = async () => {
  return EMPTY_ARTICLES;
};
const resolveEmptySubscriptions = async () => {
  return EMPTY_SUBSCRIPTIONS;
};

const makeWorker = (overrides: Partial<RssWorker> = {}) => {
  return {
    addSubscription: vi.fn(resolveNull),
    allArticles: vi.fn(resolveEmptyArticles),
    markArticleRead: vi.fn(resolveNull),
    removeSubscription: vi.fn(resolveNull),
    subscriptions: vi.fn(resolveEmptySubscriptions),
    ...overrides
  };
};

describe("getPageNumber", () => {
  it.each([
    { expected: 1, name: "missing", raw: null },
    { expected: 1, name: "zero", raw: "0" },
    { expected: 1, name: "negative", raw: "-3" },
    { expected: 1, name: "non-numeric", raw: "abc" },
    { expected: 1, name: "decimal", raw: "1.5" },
    { expected: 2, name: "plus sign", raw: "+2" },
    { expected: 1, name: "empty", raw: "" },
    { expected: 12, name: "valid", raw: "12" },
    { expected: 7, name: "leading zeros", raw: "007" },
    { expected: 100, name: "at max", raw: "100" },
    { expected: MAX_PAGE, name: "above max", raw: "999" },
    { expected: MAX_PAGE, name: "one above max", raw: "101" }
  ])("returns $expected for $name ($raw)", ({ expected, raw }) => {
    const searchParameters = new URLSearchParams();
    if (!isNil(raw)) {
      searchParameters.set("feedsPage", raw);
    }
    expect(getPageNumber(searchParameters, "feedsPage")).toBe(expected);
  });

  it("reads the requested parameter name", () => {
    const searchParameters = new URLSearchParams("articlesPage=5");
    expect(getPageNumber(searchParameters, ARTICLES_PAGE_PARAM)).toBe(5);
  });
});

describe("getFirst", () => {
  it.each([
    { expected: RSS_PAGE_SIZE, page: 1 },
    { expected: RSS_PAGE_SIZE * 3, page: 3 },
    { expected: RSS_PAGE_SIZE * MAX_PAGE, page: MAX_PAGE }
  ])("returns $expected for page $page", ({ expected, page }) => {
    expect(getFirst(page)).toBe(expected);
  });
});

describe("buildFormHref", () => {
  it("appends the action param and preserves existing params", () => {
    const url = new URL("https://ethang.dev/rss?feedsPage=2&articlesPage=1");
    const href = buildFormHref(url, "removeFeed");
    expect(href).toBe("/rss?feedsPage=2&articlesPage=1&_action=removeFeed");
  });

  it("works without any existing query params", () => {
    const url = new URL("https://ethang.dev/rss");
    expect(buildFormHref(url, "markArticleRead")).toBe(
      "/rss?_action=markArticleRead"
    );
  });

  it("keeps the pathname", () => {
    const url = new URL("https://ethang.dev/foo/bar?x=1");
    expect(buildFormHref(url, "removeFeed").startsWith("/foo/bar?")).toBe(true);
  });
});

describe("buildLoadMoreHref", () => {
  it("increments the target page and preserves the other", () => {
    const url = new URL("https://ethang.dev/rss?feedsPage=2&articlesPage=3");
    expect(buildLoadMoreHref(url, FEEDS_PAGE_PARAM)).toBe(
      "/rss?feedsPage=3&articlesPage=3"
    );
  });

  it("starts at page 2 when the param is absent", () => {
    const url = new URL("https://ethang.dev/rss");
    expect(buildLoadMoreHref(url, FEEDS_PAGE_PARAM)).toBe("/rss?feedsPage=2");
  });

  it("clamps the page at the maximum", () => {
    const url = new URL(`https://ethang.dev/rss?feedsPage=${MAX_PAGE}`);
    expect(buildLoadMoreHref(url, FEEDS_PAGE_PARAM)).toBe(
      `/rss?feedsPage=${MAX_PAGE}`
    );
  });
});

describe("getSubscriptions", () => {
  it("returns the worker result", async () => {
    const result = {
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null
      }
    };
    const worker = makeWorker({
      subscriptions: vi.fn(async () => {
        return result;
      })
    });
    await expect(getSubscriptions(worker, SESSION_TOKEN, 2)).resolves.toBe(
      result
    );
  });

  it("passes the growing first limit and the session token", async () => {
    const subscriptions = vi.fn(resolveEmptySubscriptions);
    const worker = makeWorker({ subscriptions });
    await getSubscriptions(worker, SESSION_TOKEN, 3);
    expect(subscriptions).toHaveBeenCalledWith({
      first: getFirst(3),
      sessionToken: SESSION_TOKEN
    });
  });

  it("falls back to empty on failure", async () => {
    const worker = makeWorker({
      subscriptions: vi.fn(async () => {
        throw new Error(BOOM);
      })
    });
    await expect(getSubscriptions(worker, SESSION_TOKEN, 1)).resolves.toBe(
      EMPTY_SUBSCRIPTIONS
    );
  });
});

describe("getArticles", () => {
  it("requests unread articles with the growing limit", async () => {
    const allArticles = vi.fn(resolveEmptyArticles);
    const worker = makeWorker({ allArticles });
    await getArticles(worker, SESSION_TOKEN, 2);
    expect(allArticles).toHaveBeenCalledWith({
      first: getFirst(2),
      isRead: false,
      sessionToken: SESSION_TOKEN
    });
  });

  it("falls back to empty on failure", async () => {
    const worker = makeWorker({
      allArticles: vi.fn(async () => {
        throw new Error(BOOM);
      })
    });
    await expect(getArticles(worker, SESSION_TOKEN, 1)).resolves.toBe(
      EMPTY_ARTICLES
    );
  });
});

describe("removeFeed", () => {
  it("calls removeSubscription and returns success", async () => {
    const removeSubscription = vi.fn(resolveNull);
    const worker = makeWorker({ removeSubscription });
    await expect(removeFeed(worker, REMOVE_FEED_PARAMS)).resolves.toEqual({
      success: true
    });
    expect(removeSubscription).toHaveBeenCalledWith({
      feedId: FEED_ID,
      sessionToken: SESSION_TOKEN
    });
  });

  it("returns the remove error message on failure", async () => {
    const worker = makeWorker({
      removeSubscription: vi.fn(async () => {
        throw new Error(NOPE);
      })
    });
    await expect(removeFeed(worker, REMOVE_FEED_PARAMS)).resolves.toEqual({
      error: NOPE
    });
  });

  it("stringifies non-error rejections", async () => {
    const worker = makeWorker({
      removeSubscription: vi.fn(async () => {
        throw STRING_FAILURE;
      })
    });
    await expect(removeFeed(worker, REMOVE_FEED_PARAMS)).resolves.toEqual({
      error: STRING_FAILURE
    });
  });
});

describe("addFeed", () => {
  it("calls addSubscription and returns success", async () => {
    const addSubscription = vi.fn(resolveNull);
    const worker = makeWorker({ addSubscription });
    await expect(addFeed(worker, ADD_FEED_PARAMS)).resolves.toEqual({
      success: true
    });
    expect(addSubscription).toHaveBeenCalledWith({
      sessionToken: SESSION_TOKEN,
      xmlAddress: XML_ADDRESS
    });
  });

  it("returns the add error message on failure", async () => {
    const worker = makeWorker({
      addSubscription: vi.fn(async () => {
        throw new Error(NOPE);
      })
    });
    await expect(addFeed(worker, ADD_FEED_PARAMS)).resolves.toEqual({
      error: NOPE
    });
  });
});

describe("markArticleRead", () => {
  it("calls markArticleRead with isRead true and returns success", async () => {
    const markArticleReadMock = vi.fn(resolveNull);
    const worker = makeWorker({ markArticleRead: markArticleReadMock });
    await expect(markArticleRead(worker, MARK_READ_PARAMS)).resolves.toEqual({
      success: true
    });
    expect(markArticleReadMock).toHaveBeenCalledWith({
      articleId: ARTICLE_ID,
      isRead: true,
      sessionToken: SESSION_TOKEN
    });
  });

  it("returns the mark-read error message on failure", async () => {
    const worker = makeWorker({
      markArticleRead: vi.fn(async () => {
        throw new Error(NOPE);
      })
    });
    await expect(
      markArticleRead(worker, {
        articleId: ARTICLE_ID,
        isRead: true,
        sessionToken: SESSION_TOKEN
      })
    ).resolves.toEqual({ error: NOPE });
  });
});
