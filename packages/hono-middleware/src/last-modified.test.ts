import type { BlankEnv } from "hono/types";

import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { lastModifiedMiddleware } from "./last-modified.js";

const LOCAL_HOST = "http://localhost/";
const LAST_MODIFIED = "Last-Modified";

describe(lastModifiedMiddleware, () => {
  it("should set Last-Modified header from meta tag", async () => {
    const app = new Hono<BlankEnv>();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => {
      const html = `
        <html>
          <head>
            <meta name="last-modified" content="2023-01-01T12:00:00.000Z" />
          </head>
          <body>Hello</body>
        </html>
      `;
      return c.html(html);
    });

    const response = await app.request(LOCAL_HOST);

    expect(response.headers.get(LAST_MODIFIED)).toBe(
      "Sun, 01 Jan 2023 12:00:00 GMT"
    );
  });

  it("should not set Last-Modified header if meta tag is missing", async () => {
    const app = new Hono<BlankEnv>();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => {
      return c.html("<html><body>Hello</body></html>");
    });

    const response = await app.request(LOCAL_HOST);

    expect(response.headers.get(LAST_MODIFIED)).toBeNull();
  });

  it("should set Last-Modified header from HTTP format meta tag", async () => {
    const app = new Hono<BlankEnv>();
    app.use(lastModifiedMiddleware);
    app.get("/", (c) => {
      const html = `
        <html>
          <head>
            <meta name="last-modified" content="Sun, 01 Jan 2023 12:00:00 GMT" />
          </head>
          <body>Hello</body>
        </html>
      `;
      return c.html(html);
    });

    const response = await app.request(LOCAL_HOST);

    expect(response.headers.get(LAST_MODIFIED)).toBe(
      "Sun, 01 Jan 2023 12:00:00 GMT"
    );
  });
});
