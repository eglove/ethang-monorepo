// Helper to decode HTML entities in the browser/jsdom
import { Effect } from "effect";
import isUndefined from "lodash/isUndefined";

export const decodeHtmlEntities = (text: string): string => {
  if (isUndefined(globalThis.window) || !text) {
    return text;
  }
  return Effect.try(() => {
    const parser = new DOMParser();
    const document = parser.parseFromString(text, "text/html");
    return document.documentElement.textContent;
  }).pipe(
    Effect.catchAll(() => {
      return Effect.succeed(text);
    }),
    Effect.runSync
  );
};

// Helper parser to default title and website URL from XML address
export const parseXmlUrl = (xmlUrl: string) => {
  return Effect.try(() => {
    const url = new URL(xmlUrl);
    return {
      title: url.hostname,
      website: url.origin,
      xmlAddress: xmlUrl
    };
  }).pipe(
    Effect.catchAll(() => {
      return Effect.succeed({
        title: "",
        website: "",
        xmlAddress: xmlUrl
      });
    }),
    Effect.runSync
  );
};
