import { describe, expect, it } from "vitest";

import { extractIconUrl } from "./extract-icon-url.ts";

const BASE_URL = "https://example.com/path/";
const FAVICON_URL = "https://example.com/favicon.ico";

describe("extractIconUrl - empty input", () => {
  it("returns null for an empty string", () => {
    expect(extractIconUrl("", BASE_URL)).toBeNull();
  });
});

describe("extractIconUrl - link tag parsing", () => {
  it.each([
    {
      expected: FAVICON_URL,
      html: '<link rel="icon" href="https://example.com/favicon.ico">',
      name: "absolute URL with rel=icon"
    },
    {
      expected: FAVICON_URL,
      html: '<link rel="icon" href="/favicon.ico">',
      name: "root-relative href with rel=icon"
    },
    {
      expected: "https://example.com/path/favicon.ico",
      html: '<link rel="icon" href="favicon.ico">',
      name: "relative href with rel=icon"
    },
    {
      expected: FAVICON_URL,
      html: '<link rel="shortcut icon" href="/favicon.ico">',
      name: "rel=shortcut icon"
    },
    {
      expected: "https://example.com/apple-touch-icon.png",
      html: '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
      name: "rel=apple-touch-icon"
    },
    {
      expected: "https://example.com/icon.png",
      html: '<HTML><HEAD><LINK REL="ICON" HREF="/icon.png"></HEAD></HTML>',
      name: "uppercase attributes"
    }
  ])("$name", ({ expected, html }) => {
    expect(extractIconUrl(html, BASE_URL)).toBe(expected);
  });
});

describe("extractIconUrl - sizes preference", () => {
  it("picks the highest sizes value when multiple icons are present", () => {
    const html = `
      <link rel="icon" sizes="16x16" href="/icon-16.png">
      <link rel="icon" sizes="32x32" href="/icon-32.png">
      <link rel="icon" sizes="48x48" href="/icon-48.png">
    `;
    expect(extractIconUrl(html, BASE_URL)).toBe(
      "https://example.com/icon-48.png"
    );
  });

  it("uses the first icon when no sizes attribute is present", () => {
    const html = `
      <link rel="icon" href="/first.png">
      <link rel="icon" href="/second.png">
    `;
    expect(extractIconUrl(html, BASE_URL)).toBe(
      "https://example.com/first.png"
    );
  });

  it("prefers an icon with sizes over an icon without sizes", () => {
    const html = `
      <link rel="icon" href="/no-sizes.png">
      <link rel="icon" sizes="64x64" href="/big.png">
    `;
    expect(extractIconUrl(html, BASE_URL)).toBe("https://example.com/big.png");
  });

  it("returns null when pickBestIcon finds no icon link tags", () => {
    const html = '<link rel="stylesheet" href="/style.css">';
    expect(extractIconUrl(html, BASE_URL)).toBe(FAVICON_URL);
  });

  it("ignores link tags without a rel attribute", () => {
    const html = '<link href="/preconnect.css">';
    expect(extractIconUrl(html, BASE_URL)).toBe(FAVICON_URL);
  });

  it("ignores link tags with an empty rel attribute", () => {
    const html = '<link rel="" href="/empty.png">';
    expect(extractIconUrl(html, BASE_URL)).toBe(FAVICON_URL);
  });

  it("ignores link tags whose sizes attribute has no parseable dimensions", () => {
    const html = `
      <link rel="icon" sizes="any" href="/any.png">
      <link rel="icon" href="/second.png">
    `;
    expect(extractIconUrl(html, BASE_URL)).toBe(
      "https://example.com/any.png"
    );
  });

  it("matches rel values with extra descriptors (suffix match)", () => {
    const html = '<link rel="foo apple-touch-icon" href="/suffix.png">';
    expect(extractIconUrl(html, BASE_URL)).toBe(
      "https://example.com/suffix.png"
    );
  });

  it("matches rel values with extra descriptors (prefix match)", () => {
    const html = '<link rel="apple-touch-icon bar" href="/prefix.png">';
    expect(extractIconUrl(html, BASE_URL)).toBe(
      "https://example.com/prefix.png"
    );
  });

  it("falls back to /favicon.ico when resolveHref throws on bad base", () => {
    const html = '<link rel="icon" href="/favicon.ico">';
    expect(extractIconUrl(html, "\\\\")).toBeNull();
  });

  it("handles apple-touch-icon with high sizes", () => {
    const html = `
      <link rel="icon" sizes="16x16" href="/icon-16.png">
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-180.png">
    `;
    expect(extractIconUrl(html, BASE_URL)).toBe(
      "https://example.com/apple-180.png"
    );
  });
});

describe("extractIconUrl - fallback to /favicon.ico", () => {
  it("falls back to /favicon.ico when no link tag is present", () => {
    const html = "<html><head><title>No icon</title></head></html>";
    expect(extractIconUrl(html, BASE_URL)).toBe(FAVICON_URL);
  });

  it("falls back to /favicon.ico when link tag has no href", () => {
    const html = '<link rel="icon">';
    expect(extractIconUrl(html, BASE_URL)).toBe(FAVICON_URL);
  });
});

describe("extractIconUrl - invalid baseUrl", () => {
  it("returns null when baseUrl cannot produce /favicon.ico", () => {
    expect(extractIconUrl("no html", "not a url")).toBeNull();
  });
});
