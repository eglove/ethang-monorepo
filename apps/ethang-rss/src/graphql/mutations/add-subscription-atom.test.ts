import { XMLParser } from "fast-xml-parser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addSubscriptionMutation } from "./add-subscription.ts";

const ATOM_TITLE = "Atom Feed Title";
const ATOM_WEBSITE = "https://atomwebsite.com";
const ATOM_XML = "https://atomwebsite.com/feed.xml";
const ATOM_TITLE_SHORT = "Atom Title";
const ATOM_SELF_XML = "https://atomself1.com/feed.xml";

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
describe("addSubscriptionMutation - Atom parsing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE}</title>
          <link rel="alternate" type="text/html" href="https://atomwebsite.com"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE,
      expectedWebsite: ATOM_WEBSITE,
      name: "should fetch and parse Atom metadata when title and website are omitted",
      xmlAddress: ATOM_XML
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title type="text">Atom Nested Title</title>
          <link>https://atomstring.com</link>
        </feed>
      `,
      expectedTitle: "Atom Nested Title",
      expectedWebsite: "https://atomstring.com",
      name: "should parse Atom link as string, single object, and nested title object",
      xmlAddress: "https://atomstring.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link href="https://atomsingleobj.com"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://atomsingleobj.com",
      name: "should parse Atom link from single object link without array",
      xmlAddress: "https://atomsingleobj.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link rel="self" href="https://atomself.com/feed.xml"/>
          <link rel="alternate" href="https://atomalt.com"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://atomalt.com",
      name: "should parse Atom link from multiple links with fallback",
      xmlAddress: "https://atomalt.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link rel="self" href="https://atomself.com/feed.xml"/>
          <link href="https://atomfallback.com"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://atomfallback.com",
      name: "should parse Atom link from array using alternate rel check fallback",
      xmlAddress: "https://atomfallback.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link rel="self" href="https://atomself1.com/feed.xml"/>
          <link rel="self" href="https://atomself2.com/feed.xml"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: ATOM_SELF_XML,
      name: "should parse Atom link from array fallback to first item if no specific rel matches",
      xmlAddress: ATOM_SELF_XML
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link>https://atomstring1.com</link>
          <link>https://atomstring2.com</link>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://atomstring1.com",
      name: "should parse Atom link from array of strings",
      xmlAddress: "https://atomstring1.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link rel="alternate"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://nohref.com",
      name: "should fallback to empty string if alternate link object has no @_href",
      xmlAddress: "https://nohref.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title type="html"></title>
          <link href="https://notext.com"/>
        </feed>
      `,
      expectedTitle: "notext.com",
      expectedWebsite: "https://notext.com",
      name: "should fallback to empty string if title object has no #text",
      xmlAddress: "https://notext.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://nolink.com",
      name: "should handle completely missing Atom link",
      xmlAddress: "https://nolink.com/feed.xml"
    },
    {
      atomXml: "",
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://emptyarr.com",
      name: "should handle empty Atom link array",
      parserMock: {
        feed: {
          link: [],
          title: ATOM_TITLE_SHORT
        }
      },
      xmlAddress: "https://emptyarr.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <link href="https://notitle.com"/>
        </feed>
      `,
      expectedTitle: "notitle.com",
      expectedWebsite: "https://notitle.com",
      name: "should handle completely missing Atom title",
      xmlAddress: "https://notitle.com/feed.xml"
    },
    {
      atomXml: "",
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://atomnonstrobj.com",
      name: "should handle non-string non-object alternate Atom link",
      parserMock: {
        feed: {
          link: [123],
          title: ATOM_TITLE_SHORT
        }
      },
      xmlAddress: "https://atomnonstrobj.com/feed.xml"
    },
    {
      atomXml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>${ATOM_TITLE_SHORT}</title>
          <link rel="self" href="https://atomself.com/feed.xml"/>
          <link rel="alternate"/>
        </feed>
      `,
      expectedTitle: ATOM_TITLE_SHORT,
      expectedWebsite: "https://nohrefarr.com",
      name: "should fallback to empty string if Atom alternate link array item has no @_href",
      xmlAddress: "https://nohrefarr.com/feed.xml"
    }
  ])(
    "$name",
    async ({
      atomXml,
      expectedTitle,
      expectedWebsite,
      parserMock,
      xmlAddress
    }) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        text: async () => {
          return atomXml;
        }
      } as Response);

      if (parserMock) {
        vi.spyOn(XMLParser.prototype, "parse").mockReturnValue(parserMock);
      }

      const mockFeedsInsertResult = {
        returning: vi.fn().mockResolvedValue([
          {
            id: "feed-atom-id",
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
      const result = await resolver(
        undefined,
        {
          xmlAddress
        },
        mockContext
      );

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
