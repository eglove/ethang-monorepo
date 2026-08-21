import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

const rssWorker = vi.hoisted(() => {
  return {
    allArticles: vi.fn(),
    subscriptions: vi.fn(),
  };
});

vi.mock("cloudflare:workers", () => {
  return {
    env: {
      ethang_courses: {
        coursesAll: vi.fn(async () => {
          return [];
        }),
      },
      ethang_rss: rssWorker,
    },
  };
});

import Rss from "../pages/rss.astro";

const SESSION = "session";
const FEED_TITLE = "Feed One";
const PUBLISHED_AT = "2024-01-01T00:00:00.000Z";
const FEED_ID = "f1";
const sessionUser = JSON.stringify({
  email: "ada@example.com",
  sessionToken: "token",
  username: "ada",
});

const render = async (request?: Request) => {
  const container = await AstroContainer.create();
  return container.renderToString(Rss as never, { request } as never);
};

const makeSubscription = (overrides: Record<string, unknown> = {}) => {
  return {
    cursor: "c1",
    node: {
      id: FEED_ID,
      title: FEED_TITLE,
      ...overrides,
    },
  };
};

const makeArticle = (overrides: Record<string, unknown> = {}) => {
  return {
    cursor: "a1",
    node: {
      id: "a1",
      link: "https://x/a1",
      title: "Article One",
      ...overrides,
    },
  };
};

const pageInfo = (hasNextPage = false) => {
  return {
    endCursor: null,
    hasNextPage,
    hasPreviousPage: false,
    startCursor: null,
  };
};

const sessionRequest = () => {
  return new Request("https://ethang.dev/rss", {
    headers: { cookie: `${SESSION}=${sessionUser}` },
  });
};

describe("rss page authenticated", () => {
  it("renders subscriptions and articles for an authenticated user", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [makeSubscription()],
      pageInfo: pageInfo(),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [makeArticle()],
      pageInfo: pageInfo(),
    });

    const html = await render(sessionRequest());

    expect(html).toContain(FEED_TITLE);
    expect(html).toContain("Article One");
    expect(html).toContain("Remove Feed One");
    expect(html).toContain("Mark as read");
  });

  it("shows the show-more link when pagination exists for feeds", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [makeSubscription()],
      pageInfo: pageInfo(true),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });

    const html = await render(sessionRequest());

    expect(html).toContain("Show more feeds");
  });

  it("shows the show-more link when pagination exists for articles", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [makeArticle()],
      pageInfo: pageInfo(true),
    });

    const html = await render(sessionRequest());

    expect(html).toContain("Show more articles");
  });

  it("renders the feed and published date on articles when present", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [
        makeArticle({
          feed: { iconUrl: null, id: FEED_ID, title: FEED_TITLE },
          publishedAt: PUBLISHED_AT,
        }),
      ],
      pageInfo: pageInfo(false),
    });

    const html = await render(sessionRequest());

    expect(html).toContain(FEED_TITLE);
  });

  it("renders the site icon image when the feed provides one", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [
        makeArticle({
          feed: {
            iconUrl: "https://example.com/favicon.ico",
            id: FEED_ID,
            title: FEED_TITLE,
          },
          publishedAt: PUBLISHED_AT,
        }),
      ],
      pageInfo: pageInfo(false),
    });

    const html = await render(sessionRequest());

    expect(html).toContain('src="https://example.com/favicon.ico"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });

  it("omits the icon image when the feed has none", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [
        makeArticle({
          feed: { iconUrl: null, id: FEED_ID, title: FEED_TITLE },
          publishedAt: PUBLISHED_AT,
        }),
      ],
      pageInfo: pageInfo(false),
    });

    const html = await render(sessionRequest());

    expect(html).not.toContain("<img");
    expect(html).toContain(FEED_TITLE);
  });

  it("omits the icon image when the article has no feed", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [makeArticle()],
      pageInfo: pageInfo(false),
    });

    const html = await render(sessionRequest());

    expect(html).not.toContain("<img");
  });

  it("shows the no-feeds message for an authenticated user with no feeds", async () => {
    rssWorker.subscriptions.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });
    rssWorker.allArticles.mockResolvedValue({
      edges: [],
      pageInfo: pageInfo(false),
    });

    const html = await render(sessionRequest());

    expect(html).toContain("No feeds subscribed.");
    expect(html).toContain("No unread articles.");
  });
});
