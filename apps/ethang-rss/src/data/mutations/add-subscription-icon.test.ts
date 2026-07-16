import { Effect } from "effect";
import isString from "lodash/isString.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const WEBSITE = "https://feed-website.com";
const XML_ADDRESS = "https://feed-website.com/feed.xml";
const FALLBACK_WEBSITE = "https://feed-website.com";
const FALLBACK_TITLE = "feed-website.com";
const TITLE = "Feed Website";
const FAVICON_ICON_URL = "https://feed-website.com/favicon.ico";
const NETWORK_ERROR = "Network Error";
const INVALID_INPUT = "invalid";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: "user-1",
    username: "user1"
  }
};

type FetchInput = Request | string | URL;

const rssResponse = () => {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${TITLE}</title>
    <link>${WEBSITE}</link>
  </channel>
</rss>`,
    { status: 200 }
  );
};

const buildHtml = (linkTag: string) => {
  return `<!doctype html>
<html>
  <head>
    ${linkTag}
    <title>${TITLE}</title>
  </head>
  <body>Hello</body>
</html>`;
};

const inputToString = (input: FetchInput) => {
  if (isString(input)) {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

const buildFetchMock = (websiteHandler: (input: FetchInput) => Response) => {
  const fetchImplementation = async (input: FetchInput) => {
    const value = inputToString(input);
    if (value === XML_ADDRESS) {
      return rssResponse();
    }
    if (value === WEBSITE) {
      return websiteHandler(input);
    }
    return new Response("", { status: 404 });
  };
  return fetchImplementation;
};

const createMockDatabase = (returning: object[]) => {
  const mockFeedsInsertResult = {
    returning: vi.fn().mockResolvedValue(returning),
    values: vi.fn().mockReturnThis()
  };
  const mockSubscriptionsInsertResult = {
    onConflictDoNothing: vi.fn().mockResolvedValue({}),
    values: vi.fn().mockReturnThis()
  };
  return {
    insert: vi
      .fn()
      .mockReturnValueOnce(mockFeedsInsertResult)
      .mockReturnValueOnce(mockSubscriptionsInsertResult),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([])
    })
  };
};

const getValuesCall = (mockDatabase: {
  insert: { mock: { results: unknown[] } };
}) => {
  // @ts-expect-error test double
  return mockDatabase.insert.mock.results[0].value.values.mock.calls[0][0];
};

describe("addSubscriptionMutation - icon URL extraction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the website and extracts iconUrl from a <link rel='icon'>", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      buildFetchMock(() => {
        return new Response(
          buildHtml('<link rel="icon" href="/favicon.ico">'),
          {
            status: 200
          }
        );
      })
    );

    const mockDatabase = createMockDatabase([
      {
        iconUrl: FAVICON_ICON_URL,
        id: "feed-icon-1",
        title: TITLE,
        website: WEBSITE,
        xmlAddress: XML_ADDRESS
      }
    ]);

    await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { xmlAddress: XML_ADDRESS },
      mockContext
    );

    expect(fetchSpy).toHaveBeenCalledWith(WEBSITE);
    const valuesCall = getValuesCall(mockDatabase);
    expect(valuesCall).toEqual({
      iconUrl: FAVICON_ICON_URL,
      title: TITLE,
      website: WEBSITE,
      xmlAddress: XML_ADDRESS
    });
  });

  it("falls back to /favicon.ico when the website has no link tag", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      buildFetchMock(() => {
        return new Response(buildHtml(""), { status: 200 });
      })
    );

    const mockDatabase = createMockDatabase([
      {
        iconUrl: FAVICON_ICON_URL,
        id: "feed-icon-2",
        title: TITLE,
        website: WEBSITE,
        xmlAddress: XML_ADDRESS
      }
    ]);

    await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { xmlAddress: XML_ADDRESS },
      mockContext
    );

    const valuesCall = getValuesCall(mockDatabase);
    expect(valuesCall.iconUrl).toBe(FAVICON_ICON_URL);
  });

  it("stores iconUrl=null when the website fetch fails (XML succeeds)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input: FetchInput) => {
        const value = inputToString(input);
        if (value === XML_ADDRESS) {
          return rssResponse();
        }
        if (value === WEBSITE) {
          Effect.runSync(Effect.die(new Error(NETWORK_ERROR)));
        }
        return new Response("", { status: 404 });
      });

    const mockDatabase = createMockDatabase([
      {
        iconUrl: null,
        id: "feed-icon-3",
        title: TITLE,
        website: WEBSITE,
        xmlAddress: XML_ADDRESS
      }
    ]);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { xmlAddress: XML_ADDRESS },
      mockContext
    );

    expect(result.title).toBe(TITLE);
    const valuesCall = getValuesCall(mockDatabase);
    expect(valuesCall.iconUrl).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(WEBSITE);
  });

  it("stores iconUrl=null when the website returns non-OK (XML succeeds)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: FetchInput) => {
        const value = inputToString(input);
        if (value === XML_ADDRESS) {
          return rssResponse();
        }
        if (value === WEBSITE) {
          return new Response("", { status: 500 });
        }
        return new Response("", { status: 404 });
      }
    );

    const mockDatabase = createMockDatabase([
      {
        iconUrl: null,
        id: "feed-icon-4",
        title: TITLE,
        website: WEBSITE,
        xmlAddress: XML_ADDRESS
      }
    ]);

    const result = await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { xmlAddress: XML_ADDRESS },
      mockContext
    );

    expect(result.title).toBe(TITLE);
    const valuesCall = getValuesCall(mockDatabase);
    expect(valuesCall.iconUrl).toBeNull();
  });

  it("stores iconUrl=null when XML parsing also fails (website fetch fails too)", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error(NETWORK_ERROR));

    const mockDatabase = createMockDatabase([
      {
        iconUrl: null,
        id: "feed-icon-5",
        title: FALLBACK_TITLE,
        website: FALLBACK_WEBSITE,
        xmlAddress: XML_ADDRESS
      }
    ]);

    await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { xmlAddress: XML_ADDRESS },
      mockContext
    );

    const valuesCall = getValuesCall(mockDatabase);
    expect(valuesCall.iconUrl).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(WEBSITE);
  });

  it("skips website fetch when derivedWebsite is empty after URL fallback", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error(NETWORK_ERROR));

    const mockDatabase = createMockDatabase([
      {
        iconUrl: null,
        id: "feed-icon-6",
        title: INVALID_INPUT,
        website: INVALID_INPUT,
        xmlAddress: INVALID_INPUT
      }
    ]);

    await addSubscriptionMutation(
      // @ts-expect-error test double
      mockDatabase,
      { xmlAddress: INVALID_INPUT },
      mockContext
    );

    const valuesCall = getValuesCall(mockDatabase);
    expect(valuesCall.iconUrl).toBeNull();
    // Only one fetch call (for the xmlAddress itself) — the website fetch
    // was skipped because derivedWebsite stayed empty.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
