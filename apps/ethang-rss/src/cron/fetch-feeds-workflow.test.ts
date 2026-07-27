import noop from "lodash/noop.js";
import repeat from "lodash/repeat.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
const mockDelete = vi.fn();

vi.mock("drizzle-orm/d1", () => {
  return {
    drizzle: () => {
      const mockDatabase = {
        delete: mockDelete,
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate
      };

      return {
        ...mockDatabase,
        transaction: vi.fn().mockImplementation(async (callback) => {
          return callback(mockDatabase);
        })
      };
    }
  };
});

vi.mock("cloudflare:workers", () => {
  return {
    WorkflowEntrypoint: MockWorkflowEntrypoint
  };
});

// Returns a Promise augmented with .where() so both the workflow's await
// select().from() and cleanupOldArticles' select().from().where() work.
const makeThenableFrom = (feeds: unknown[]) => {
  const mockWhere = vi.fn().mockResolvedValue([]);

  /* eslint-disable unicorn/no-thenable -- augmented Promise needed for drizzle mock chain */
  return {
    then: (resolve: (v: unknown) => void) => {
      resolve(feeds);
    },
    where: mockWhere
  };
  /* eslint-enable unicorn/no-thenable */
};

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
    expect(normalizeLink(item)).toBe("");
  });

  it("handles array link item with string element and no href", () => {
    const item = {
      link: ["https://example.com/string-link"]
    };
    expect(normalizeLink(item as never)).toBe(
      "https://example.com/string-link"
    );
  });

  it("handles object link with @_href", () => {
    expect(normalizeLink({ link: { [HREF_ATTR]: EXAMPLE_URL } })).toBe(
      EXAMPLE_URL
    );
  });

  it("returns an empty string for a link object with no href", () => {
    const item = { link: { [TYPE_ATTR]: TEXT_HTML } };
    // @ts-expect-error for test
    expect(normalizeLink(item)).toBe("");
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

// eslint-disable-next-line sonar/max-lines-per-function
describe("FetchFeedsWorkflow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
  });

  it("runs the workflow successfully, fetches feed and inserts into DB", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
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

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {}
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
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
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

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ethang_rss: {}
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
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ethang_rss: {}
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

  it("runs the workflow with invalid feed XML, updating lastFetchedAt without modifying title and website", async () => {
    const mockFeeds = [
      { id: "feed-invalid", xmlAddress: "https://example.com/invalid.xml" }
    ];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ethang_rss: {}
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return `
        <root>${repeat("<div>", 150)}${repeat("</div>", 150)}</root>
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

// eslint-disable-next-line sonar/max-lines-per-function
describe("FetchFeedsWorkflow - error and normalization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
  });

  it("handles fetch error and throws inside step.do", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {}
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

  it("handles fetch rejection with non-Error object", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {}
    };

    vi.spyOn(globalThis, "fetch").mockRejectedValue("network failure");

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
    await expect(workflow.run({}, step)).rejects.toThrow("network failure");
  });

  it("should propagate error when feed update fails after inserts", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
    });

    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({})
      })
    });

    let updateCallCount = 0;
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(async () => {
          updateCallCount += 1;
          if (1 === updateCallCount) {
            throw new Error("Database connection lost");
          }
          return {};
        })
      })
    });

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ethang_rss: {}
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

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      { waitUntil: noop },
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).rejects.toThrow(
      "Database connection lost"
    );
  });

  it("calls normalizeDate and inserts normalized ISO string into database", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
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

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {}
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
              <pubDate>Tue, 17 Jun 2026 17:58:47 GMT</pubDate>
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
        publishedAt: "2026-06-17T17:58:47.000Z"
      })
    );
  });

  it("excludes YouTube Shorts and includes other feed items", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
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

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ENVIRONMENT: ENVIRONMENT_TEST,
      ethang_rss: {}
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
              <title>Regular Video</title>
              <link>https://www.youtube.com/watch?v=regular123</link>
              <guid>guid-regular</guid>
              <pubDate>2026-06-14T00:00:00Z</pubDate>
            </item>
            <item>
              <title>YouTube Short</title>
              <link>https://www.youtube.com/shorts/short456</link>
              <guid>guid-short</guid>
              <pubDate>2026-06-14T00:00:00Z</pubDate>
            </item>
            <item>
              <title>Regular Article</title>
              <link>https://example.com/art1</link>
              <guid>guid-art1</guid>
              <pubDate>2026-06-14T00:00:00Z</pubDate>
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

    expect(mockValues).toHaveBeenCalledTimes(2);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        link: "https://www.youtube.com/watch?v=regular123",
        title: "Regular Video"
      })
    );
    expect(mockValues).not.toHaveBeenCalledWith(
      expect.objectContaining({
        link: "https://www.youtube.com/shorts/short456",
        title: "YouTube Short"
      })
    );
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        link: "https://example.com/art1",
        title: "Regular Article"
      })
    );
  });

  it("should not insert articles older than 90 days", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
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

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = {
      ethang_rss: {}
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
              <title>Recent Article</title>
              <link>https://example.com/recent</link>
              <guid>guid-recent</guid>
              <description>Recent</description>
              <pubDate>2026-07-01T00:00:00Z</pubDate>
            </item>
            <item>
              <title>Old Article</title>
              <link>https://example.com/old</link>
              <guid>guid-old</guid>
              <description>Old</description>
              <pubDate>2025-01-01T00:00:00Z</pubDate>
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

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      { waitUntil: noop },
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).resolves.not.toThrow();

    // Only the recent article should be inserted
    expect(mockValues).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        guid: "guid-recent",
        title: "Recent Article"
      })
    );
    expect(mockValues).not.toHaveBeenCalledWith(
      expect.objectContaining({
        guid: "guid-old",
        title: "Old Article"
      })
    );
  });

  it("should roll back transaction when insert fails mid-batch", async () => {
    const mockFeeds = [{ id: FEED_1, xmlAddress: FEED_XML_URL }];

    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeThenableFrom(mockFeeds))
    });

    let insertIndex = 0;
    mockInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockImplementation(async () => {
          insertIndex += 1;
          if (2 === insertIndex) {
            throw new Error("Constraint violation");
          }
          return {};
        })
      })
    });

    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    });

    mockDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({})
    });

    const mockEnvironment = { ethang_rss: {} };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => {
        return `<?xml version="1.0"?><rss version="2.0"><channel>
          <title>T</title><link>https://example.com</link>
          <item><title>A1</title><link>https://example.com/1</link><guid>g1</guid><pubDate>2026-07-01</pubDate></item>
          <item><title>A2</title><link>https://example.com/2</link><guid>g2</guid><pubDate>2026-07-01</pubDate></item>
        </channel></rss>`;
      }
    } as Response);

    const step = {
      do: vi.fn().mockImplementation(async (_name, function_) => {
        return function_();
      })
    };

    const workflow = new FetchFeedsWorkflow(
      // @ts-expect-error for test
      { waitUntil: noop },
      mockEnvironment as unknown as Env
    );

    // @ts-expect-error for test
    await expect(workflow.run({}, step)).rejects.toThrow(
      "Constraint violation"
    );

    // The update should NOT have been called because the transaction rolled back
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
