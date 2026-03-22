import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { lastModifiedMiddleware } from "./last-modified.ts";

const VALID_ISO = "2024-06-01T12:00:00Z";
const VALID_HTTP = new Date(VALID_ISO).toUTCString();
const LAST_MODIFIED_HEADER = "last-modified";

const metaTag = (content: string) =>
  `<meta content="${content}" name="last-modified">`;

const htmlWith = (meta: string) =>
  `<html><head>${meta}</head><body>Hello</body></html>`;

describe("lastModifiedMiddleware", () => {
  it("sets Last-Modified header from a valid meta tag", async () => {
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => c.html(htmlWith(metaTag(VALID_ISO))));

    const response = await app.request("/");

    expect(response.headers.get(LAST_MODIFIED_HEADER)).toBe(VALID_HTTP);
  });

  it("does not set Last-Modified for a non-HTML response", async () => {
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => c.json({ key: "value" }));

    const response = await app.request("/");

    expect(response.headers.get(LAST_MODIFIED_HEADER)).toBeNull();
  });

  it("does not set Last-Modified when the meta tag is absent", async () => {
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) =>
      c.html("<html><head><title>No meta</title></head></html>"),
    );

    const response = await app.request("/");

    expect(response.headers.get(LAST_MODIFIED_HEADER)).toBeNull();
  });

  it("does not set Last-Modified when the meta tag has no content attribute", async () => {
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => c.html(htmlWith('<meta name="last-modified">')));

    const response = await app.request("/");

    expect(response.headers.get(LAST_MODIFIED_HEADER)).toBeNull();
  });

  it("does not set Last-Modified when the content attribute is not a valid date", async () => {
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => c.html(htmlWith(metaTag("not-a-date"))));

    const response = await app.request("/");

    expect(response.headers.get(LAST_MODIFIED_HEADER)).toBeNull();
  });

  it("preserves the full response body", async () => {
    const originalHtml = htmlWith(metaTag(VALID_ISO));
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => c.html(originalHtml));

    const response = await app.request("/");

    expect(await response.text()).toBe(originalHtml);
  });

  it("preserves existing response headers", async () => {
    const app = new Hono();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => {
      c.header("X-Custom", "preserved");
      return c.html(htmlWith(metaTag(VALID_ISO)));
    });

    const response = await app.request("/");

    expect(response.headers.get("x-custom")).toBe("preserved");
    expect(response.headers.get(LAST_MODIFIED_HEADER)).toBe(VALID_HTTP);
  });
});
