import { XMLParser } from "fast-xml-parser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const PROVIDED_TITLE = "Provided Title";
const RSS_TITLE = "RSS Feed Title";
const RSS_WEBSITE = "https://rsswebsite.com";
const RSS_XML = "https://rsswebsite.com/feed.xml";
const PROVIDED_WEBSITE_2 = "https://provided-website.com";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: "user-1",
    username: "user1"
  }
};

// eslint-disable-next-line sonar/max-lines-per-function
describe("addSubscriptionMutation - RSS parsing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      expectedTitle: RSS_TITLE,
      expectedWebsite: RSS_WEBSITE,
      name: "should fetch and parse RSS 2.0 metadata when title and website are omitted",
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>${RSS_TITLE}</title>
            <link>${RSS_WEBSITE}</link>
          </channel>
        </rss>
      `,
      xmlAddress: RSS_XML
    },
    {
      expectedTitle: "Nested Title",
      expectedWebsite: "https://nested.com",
      name: "should parse RSS channel title and link from nested objects",
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title type="html">Nested Title</title>
            <link @_href="https://nested.com"></link>
          </channel>
        </rss>
      `,
      xmlAddress: "https://nested.com/feed.xml"
    },
    {
      expectedTitle: PROVIDED_TITLE,
      expectedWebsite: RSS_WEBSITE,
      name: "should fetch metadata and only update missing website if title is already provided",
      providedTitle: PROVIDED_TITLE,
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>${RSS_TITLE}</title>
            <link>${RSS_WEBSITE}</link>
          </channel>
        </rss>
      `,
      xmlAddress: RSS_XML
    },
    {
      expectedTitle: RSS_TITLE,
      expectedWebsite: PROVIDED_WEBSITE_2,
      name: "should fetch metadata and only update missing title if website is already provided",
      providedWebsite: PROVIDED_WEBSITE_2,
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>${RSS_TITLE}</title>
            <link>${RSS_WEBSITE}</link>
          </channel>
        </rss>
      `,
      xmlAddress: RSS_XML
    },
    {
      expectedTitle: "RSS Title",
      expectedWebsite: "https://nestedrss.com",
      name: "should parse RSS channel link as object with #text",
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>RSS Title</title>
            <link type="text/html">https://nestedrss.com</link>
          </channel>
        </rss>
      `,
      xmlAddress: "https://nestedrss.com/feed.xml"
    },
    {
      expectedTitle: "norsstitle.com",
      expectedWebsite: "https://norsstitle.com",
      name: "should handle completely missing RSS title",
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <link>https://norsstitle.com</link>
          </channel>
        </rss>
      `,
      xmlAddress: "https://norsstitle.com/feed.xml"
    },
    {
      expectedTitle: "rssemptytext.com",
      expectedWebsite: "https://rssemptytext.com",
      name: "should handle RSS channel title/link objects without #text",
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title type="html"></title>
            <link type="text/html"></link>
          </channel>
        </rss>
      `,
      xmlAddress: "https://rssemptytext.com/feed.xml"
    },
    {
      expectedTitle: "rssnochannel.com",
      expectedWebsite: "https://rssnochannel.com",
      name: "should handle RSS without channel",
      rssXml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <!-- no channel -->
        </rss>
      `,
      xmlAddress: "https://rssnochannel.com/feed.xml"
    },
    {
      expectedTitle: "RSS Title",
      expectedWebsite: "https://rssnumlink.com",
      name: "should handle RSS channel link that is non-string and non-object",
      parserMock: {
        rss: {
          channel: {
            link: 123,
            title: "RSS Title"
          }
        }
      },
      rssXml: "",
      xmlAddress: "https://rssnumlink.com/feed.xml"
    },
    {
      expectedTitle: "RSS Title",
      expectedWebsite: "https://rssnolinktext.com",
      name: "should fallback to empty string if RSS channel link object has no #text",
      parserMock: {
        rss: {
          channel: {
            link: {
              "@_type": "text/html"
            },
            title: "RSS Title"
          }
        }
      },
      rssXml: "",
      xmlAddress: "https://rssnolinktext.com/feed.xml"
    }
  ])(
    "$name",
    async ({
      expectedTitle,
      expectedWebsite,
      parserMock,
      providedTitle,
      providedWebsite,
      rssXml,
      xmlAddress
    }) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        text: async () => {
          return rssXml;
        }
      } as Response);

      if (parserMock) {
        vi.spyOn(XMLParser.prototype, "parse").mockReturnValue(parserMock);
      }

      const mockFeedsInsertResult = {
        returning: vi.fn().mockResolvedValue([
          {
            id: "feed-rss-id",
            title: expectedTitle,
            website: expectedWebsite,
            xmlAddress
          }
        ]),
        values: vi.fn().mockReturnThis()
      };

      const mockDatabase = {
        insert: vi
          .fn()
          .mockReturnValueOnce(mockFeedsInsertResult)
          .mockReturnValueOnce({
            onConflictDoNothing: vi.fn().mockResolvedValue({}),
            values: vi.fn().mockReturnThis()
          }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([])
        })
      };

      // @ts-expect-error test double
      const resolver = addSubscriptionMutation(mockDatabase);
      const parameters: {
        title?: string;
        website?: string;
        xmlAddress: string;
      } = {
        xmlAddress
      };
      if (providedTitle !== undefined) {
        parameters.title = providedTitle;
      }
      if (providedWebsite !== undefined) {
        parameters.website = providedWebsite;
      }

      const result = await resolver(undefined, parameters, mockContext);

      expect(result.title).toBe(expectedTitle);
      expect(result.website).toBe(expectedWebsite);
      expect(mockFeedsInsertResult.values).toHaveBeenCalledWith({
        title: expectedTitle,
        website: expectedWebsite,
        xmlAddress
      });
    }
  );
});
