// Helper to decode HTML entities in the browser/jsdom
import isUndefined from "lodash/isUndefined";

export const decodeHtmlEntities = (text: string): string => {
  if (isUndefined(globalThis.window) || !text) {
    return text;
  }
  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(text, "text/html");
    return document.documentElement.textContent;
  } catch {
    return text;
  }
};

// Helper parser to default title and website URL from XML address
export const parseXmlUrl = (xmlUrl: string) => {
  try {
    const url = new URL(xmlUrl);
    return {
      title: url.hostname,
      website: url.origin,
      xmlAddress: xmlUrl
    };
  } catch {
    return {
      title: "",
      website: "",
      xmlAddress: xmlUrl
    };
  }
};
