/* eslint-disable sonar/no-duplicate-string */
import { describe, expect, it } from "vitest";

import { parseFeedMetadata } from "./parse-feed-metadata.ts";

// eslint-disable-next-line sonar/max-lines-per-function
describe("parseFeedMetadata", () => {
  it.each([
    {
      expectedTitle: "RSS Feed Title",
      expectedWebsite: "https://rsswebsite.com",
      name: "should parse RSS 2.0 metadata with simple title and link",
      xml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>RSS Feed Title</title>
            <link>https://rsswebsite.com</link>
          </channel>
        </rss>
      `
    },
    {
      expectedTitle: "Nested Title",
      expectedWebsite: "",
      name: "should parse RSS channel title and link from nested objects",
      xml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title type="html">Nested Title</title>
            <link @_href="https://nested.com"></link>
          </channel>
        </rss>
      `
    },
    {
      expectedTitle: "Atom Feed Title",
      expectedWebsite: "https://atomwebsite.com",
      name: "should parse Atom feed metadata with simple link",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed Title</title>
          <link href="https://atomwebsite.com"/>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Title Object",
      expectedWebsite: "https://atom-href.com",
      name: "should parse Atom feed title/link as objects",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title type="text">Atom Title Object</title>
          <link rel="alternate" href="https://atom-href.com"/>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Array Link",
      expectedWebsite: "https://atom-alternate.com",
      name: "should parse Atom feed links array prioritizing alternate",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Array Link</title>
          <link rel="self" href="https://atom-self.com"/>
          <link rel="alternate" href="https://atom-alternate.com"/>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Array Link No Alternate",
      expectedWebsite: "https://atom-not-self.com",
      name: "should parse Atom feed links array falling back to non-self link",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Array Link No Alternate</title>
          <link rel="self" href="https://atom-self.com"/>
          <link href="https://atom-not-self.com"/>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Feed Title String Link",
      expectedWebsite: "https://atom-string-link.com",
      name: "should parse Atom feed with link as string",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed Title String Link</title>
          <link>https://atom-string-link.com</link>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Feed Title Link Array String",
      expectedWebsite: "https://atom-link1.com",
      name: "should parse Atom feed links array of strings by choosing first one",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Feed Title Link Array String</title>
          <link>https://atom-link1.com</link>
          <link>https://atom-link2.com</link>
        </feed>
      `
    },
    {
      expectedTitle: "",
      expectedWebsite: "",
      name: "should handle RSS feed missing channel",
      xml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
        </rss>
      `
    },
    {
      expectedTitle: "",
      expectedWebsite: "https://rsswebsite.com",
      name: "should handle RSS channel title object with no text",
      xml: `
        <?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title type="html"></title>
            <link>https://rsswebsite.com</link>
          </channel>
        </rss>
      `
    },
    {
      expectedTitle: "",
      expectedWebsite: "https://atomwebsite.com",
      name: "should handle Atom feed title object with no text",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title type="text"></title>
          <link href="https://atomwebsite.com"/>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Title",
      expectedWebsite: "https://atom-text.com",
      name: "should handle Atom link object with no href but having text",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Title</title>
          <link type="text/html">https://atom-text.com</link>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Title",
      expectedWebsite: "",
      name: "should handle Atom link array containing alternate object with no href",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Title</title>
          <link rel="self" href="https://atom-self.com"/>
          <link rel="alternate" type="text/html"/>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Title",
      expectedWebsite: "",
      name: "should handle Atom link object with neither href nor text",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Title</title>
          <link type="text/html"></link>
        </feed>
      `
    },
    {
      expectedTitle: "Atom Title",
      expectedWebsite: "https://atom-text.com",
      name: "should handle Atom link object with no href but having text",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Atom Title</title>
          <link type="text/html">https://atom-text.com</link>
        </feed>
      `
    },
    {
      expectedTitle: "",
      expectedWebsite: "",
      name: "should handle XML with neither RSS nor Atom feed",
      xml: `
        <?xml version="1.0" encoding="utf-8"?>
        <notfeed>
          <title>Invalid Feed</title>
        </notfeed>
      `
    }
  ])("$name", ({ expectedTitle, expectedWebsite, xml }) => {
    const result = parseFeedMetadata(xml);
    expect(result.title).toBe(expectedTitle);
    expect(result.website).toBe(expectedWebsite);
  });
});
