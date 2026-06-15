import noop from "lodash/noop.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockLoggerClient } from "../test-utilities/mock-logger-client.ts";
import { MockWorkflowEntrypoint } from "../test-utilities/mock-workflow-entrypoint.ts";
import {
  ALTERNATE,
  CONTENT_BODY,
  CONTENT_TEXT,
  DESC,
  ENVIRONMENT_TEST,
  EXAMPLE_ALTERNATE_URL,
  EXAMPLE_FIRST_URL,
  EXAMPLE_URL,
  FALLBACK,
  FEED_1,
  FEED_XML_URL,
  GUID_123,
  GUID_TEXT,
  HREF_ATTR,
  ID_123,
  MY_TITLE,
  NETWORK_ERROR,
  NO_TITLE,
  OBJECT_TITLE,
  REL_ATTR,
  SELF,
  SUMMARY_TEXT,
  TEST_LOGGER_KEY,
  TEXT_HTML,
  TEXT_KEY,
  TYPE_ATTR
} from "../test-utilities/test-constants.ts";
import {
  FetchFeedsWorkflow,
  normalizeContent,
  normalizeGuid,
  normalizeLink,
  normalizeTitle
} from "./fetch-feeds-workflow.ts";

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: () => {
      return {
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate
      };
    }
  };
});

vi.mock("@ethang/logger-sdk", () => {
  return {
    LoggerClient: MockLoggerClient
  };
});

vi.mock("cloudflare:workers", () => {
  return {
    WorkflowEntrypoint: MockWorkflowEntrypoint
  };
});

describe("normalizeLink", () => {
  it("returns string link directly", () => {
    expect(normalizeLink({ link: EXAMPLE_URL })).toBe(EXAMPLE_URL);
  });

  it("handles array of link objects with alternate relation", () => {
    const item = {
      link: [
        { [HREF_ATTR]: "https://example.com/feed", [REL_ATTR]: SELF },
        { [HREF_ATTR]: EXAMPLE_ALTERNATE_URL, [REL_ATTR]: ALTERNATE }
      ]
    };
    expect(normalizeLink(item)).toBe(EXAMPLE_ALTERNATE_URL);
  });

  it("handles array of link objects without alternate relation (falls back to first)", () => {
    const item = {
      link: [
        { [HREF_ATTR]: EXAMPLE_FIRST_URL, [REL_ATTR]: SELF },
        { [HREF_ATTR]: "https://example.com/second", [REL_ATTR]: "next" }
      ]
    };
    expect(normalizeLink(item)).toBe(EXAMPLE_FIRST_URL);
  });

  it("handles array link item with missing @_href", () => {
    const item = {
      link: [{ [REL_ATTR]: ALTERNATE }]
    };
    expect(normalizeLink(item)).toEqual({ [REL_ATTR]: ALTERNATE });
  });

  it("handles object link with @_href", () => {
    expect(normalizeLink({ link: { [HREF_ATTR]: EXAMPLE_URL } })).toBe(
      EXAMPLE_URL
    );
  });

  it("handles object link with missing @_href", () => {
    const item = { link: { [TYPE_ATTR]: TEXT_HTML } };
    // @ts-expect-error for test
    expect(normalizeLink(item)).toEqual({ [TYPE_ATTR]: TEXT_HTML });
  });

  it("handles empty link array", () => {
    expect(normalizeLink({ link: [] })).toBe("");
  });

  it("returns empty string if link is missing or nil", () => {
    expect(normalizeLink({})).toBe("");
    // @ts-expect-error for test
    expect(normalizeLink({ link: null })).toBe("");
  });
});

describe("normalizeGuid", () => {
  it("returns string guid directly", () => {
    expect(normalizeGuid({ guid: GUID_123 }, FALLBACK)).toBe(GUID_123);
  });

  it("handles object guid with #text", () => {
    expect(normalizeGuid({ guid: { [TEXT_KEY]: GUID_TEXT } }, FALLBACK)).toBe(
      GUID_TEXT
    );
  });

  it("falls back to link if guid object is missing #text", () => {
    expect(normalizeGuid({ guid: {} }, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back to id if guid is missing", () => {
    expect(normalizeGuid({ id: ID_123 }, FALLBACK)).toBe(ID_123);
  });

  it("falls back to link if guid and id are missing", () => {
    expect(normalizeGuid({}, FALLBACK)).toBe(FALLBACK);
  });
});

describe("normalizeContent", () => {
  it("returns description if it is a string", () => {
    expect(normalizeContent({ description: DESC })).toBe(DESC);
  });

  it("returns content if description is missing and content is a string", () => {
    expect(normalizeContent({ content: CONTENT_BODY })).toBe(CONTENT_BODY);
  });

  it("handles content object with #text", () => {
    expect(normalizeContent({ content: { [TEXT_KEY]: CONTENT_TEXT } })).toBe(
      CONTENT_TEXT
    );
  });

  it("handles content object with missing #text", () => {
    expect(normalizeContent({ content: {} })).toBe("");
  });

  it("returns summary if content and description are missing", () => {
    expect(normalizeContent({ summary: SUMMARY_TEXT })).toBe(SUMMARY_TEXT);
  });

  it("returns empty string if all content fields are missing", () => {
    expect(normalizeContent({})).toBe("");
  });
});

describe("normalizeTitle", () => {
  it("returns string title directly", () => {
    expect(normalizeTitle({ title: MY_TITLE })).toBe(MY_TITLE);
  });

  it("handles title object with #text", () => {
    expect(normalizeTitle({ title: { [TEXT_KEY]: OBJECT_TITLE } })).toBe(
      OBJECT_TITLE
    );
  });

  it("handles title object with missing #text", () => {
    expect(normalizeTitle({ title: {} })).toBe(NO_TITLE);
  });

  it("returns 'No Title' if title is missing", () => {
    expect(normalizeTitle({})).toBe(NO_TITLE);
  });
});

describe("FetchFeedsWorkflow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
  });

  it("runs the workflow successfully, fetches feed and inserts into DB", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockFeeds)
    });

    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({})
      })
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {},
      LOGGER_API_KEY: TEST_LOGGER_KEY
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <link>https://example.com</link>
            <item>
              <title>Article 1</title>
              <link>https://example.com/art1</link>
              <guid>guid-1</guid>
              <description>Description 1</description>
              <pubDate>2026-06-14T00:00:00Z</pubDate>
            </item>
            <item>
              <title>Article 2 (empty guid)</title>
              <link>https://example.com/art2</link>
              <description>Description 2</description>
              <pubDate>2026-06-14T00:00:00Z</pubDate>
            </item>
            <item>
              <title>Article 3 (no link or guid)</title>
            </item>
          </channel>
        </rss>
      `;
      }
    } as Response);

    const step = {
      do: vi.fn().mockImplementation(async (_name, _function) => {
        return _function();
      })
    };

    const context = {
      waitUntil: noop
    };

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      context,
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).resolves.not.toThrow();
    expect(mockSelect).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("runs the workflow with default environment and single atom feed item", async () => {
    const mockFeeds = [
      { id: "feed-2", xmlAddress: "https://example.com/atom.xml" }
    ];

    mockSelect.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockFeeds)
    });

    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({})
      })
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    const mockEnvironment = {
      ethang_rss: {},
      LOGGER_API_KEY: TEST_LOGGER_KEY
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return `
        <?xml version="1.0" encoding="UTF-8" ?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed</title>
          <entry>
            <title>Single Entry</title>
            <link href="https://example.com/entry1"/>
            <id>entry-1</id>
            <summary>Summary 1</summary>
            <updated>2026-06-14T00:00:00Z</updated>
          </entry>
        </feed>
      `;
      }
    } as Response);

    const step = {
      do: vi.fn().mockImplementation(async (_name, _function) => {
        return _function();
      })
    };

    const context = {
      waitUntil: noop
    };

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      context,
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).resolves.not.toThrow();
  });

  it("runs the workflow with empty feed items", async () => {
    const mockFeeds = [
      { id: "feed-3", xmlAddress: "https://example.com/empty.xml" }
    ];

    mockSelect.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockFeeds)
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    const mockEnvironment = {
      ethang_rss: {},
      LOGGER_API_KEY: TEST_LOGGER_KEY
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>Empty Feed</title>
          </channel>
        </rss>
      `;
      }
    } as Response);

    const step = {
      do: vi.fn().mockImplementation(async (_name, _function) => {
        return _function();
      })
    };

    const context = {
      waitUntil: noop
    };

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      context,
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).resolves.not.toThrow();
  });
});

describe("FetchFeedsWorkflow - error and normalization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
  });

  it("handles fetch error and throws inside step.do", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockFeeds)
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {},
      LOGGER_API_KEY: TEST_LOGGER_KEY
    };

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(NETWORK_ERROR));

    const step = {
      do: vi.fn().mockImplementation(async (_name, _function) => {
        return _function();
      })
    };

    const context = {
      waitUntil: noop
    };

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      context,
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).rejects.toThrow(NETWORK_ERROR);
  });

  it("calls normalizeDate and inserts normalized ISO string into database", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockResolvedValue(mockFeeds)
    });

    const mockValues = vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockResolvedValue({})
    });

    mockInsert.mockReturnValue({
      values: mockValues
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {},
      LOGGER_API_KEY: TEST_LOGGER_KEY
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <link>https://example.com</link>
            <item>
              <title>Article 1</title>
              <link>https://example.com/art1</link>
              <guid>guid-1</guid>
              <description>Description 1</description>
              <pubDate>Tue, 17 Feb 2026 17:58:47 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;
      }
    } as Response);

    const step = {
      do: vi.fn().mockImplementation(async (_name, _function) => {
        return _function();
      })
    };

    const context = {
      waitUntil: noop
    };

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      context,
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await workflow.run({}, step);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        publishedAt: "2026-02-17T17:58:47.000Z"
      })
    );
  });
});
