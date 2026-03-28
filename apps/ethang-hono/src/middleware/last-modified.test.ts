import { describe, expect, it } from "vitest";

import { lastModifiedMiddleware } from "./last-modified.ts";

const noop = async () => {};

const makeContext = (html: string, contentType = "text/html") => {
  const ctx = {
    res: new Response(html, {
      headers: { "Content-Type": contentType },
    }),
  };
  return ctx;
};

describe("lastModifiedMiddleware", () => {
  it("sets Last-Modified header from meta tag content", async () => {
    const isoDate = "2024-06-15T12:00:00Z";
    const html = `<html><head><meta name="last-modified" content="${isoDate}"></head></html>`;
    const ctx = makeContext(html);

    await lastModifiedMiddleware(ctx as never, noop);

    const lastModified = ctx.res.headers.get("Last-Modified");
    expect(lastModified).toBe(new Date(isoDate).toUTCString());
  });

  it("leaves response unchanged when no meta last-modified tag", async () => {
    const html = "<html><head><title>No meta</title></head></html>";
    const ctx = makeContext(html);
    const originalRes = ctx.res;

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res).toBe(originalRes);
  });

  it("leaves response unchanged for non-HTML content type", async () => {
    const ctx = makeContext('{"key":"value"}', "application/json");
    const originalRes = ctx.res;

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res).toBe(originalRes);
  });

  it("leaves response unchanged when body is null", async () => {
    const ctx = {
      res: new Response(null, {
        headers: { "Content-Type": "text/html" },
      }),
    };
    const originalRes = ctx.res;

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res).toBe(originalRes);
  });

  it("leaves response unchanged when content attribute has invalid date", async () => {
    const html = `<html><head><meta name="last-modified" content="not-a-date"></head></html>`;
    const ctx = makeContext(html);
    const originalRes = ctx.res;

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res).toBe(originalRes);
  });

  it("leaves response unchanged when meta tag has no content attribute", async () => {
    const html = `<html><head><meta name="last-modified"></head></html>`;
    const ctx = makeContext(html);
    const originalRes = ctx.res;

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res).toBe(originalRes);
  });

  it("preserves original response status and statusText", async () => {
    const isoDate = "2024-01-01T00:00:00Z";
    const html = `<html><head><meta name="last-modified" content="${isoDate}"></head></html>`;
    const ctx = {
      res: new Response(html, {
        headers: { "Content-Type": "text/html" },
        status: 201,
        statusText: "Created",
      }),
    };

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res.status).toBe(201);
    expect(ctx.res.statusText).toBe("Created");
  });

  it("calls next before processing the response", async () => {
    let nextCalled = false;
    const trackingNext = async () => {
      nextCalled = true;
    };
    const html = `<html><head><meta name="last-modified" content="2024-01-01T00:00:00Z"></head></html>`;
    const ctx = makeContext(html);

    await lastModifiedMiddleware(ctx as never, trackingNext);

    expect(nextCalled).toBe(true);
  });

  it("leaves response unchanged when no Content-Type header is set", async () => {
    const ctx = {
      res: new Response("some body", { headers: {} }),
    };
    const originalRes = ctx.res;

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res).toBe(originalRes);
  });

  it("is case-insensitive for meta tag matching", async () => {
    const isoDate = "2024-03-20T08:00:00Z";
    const html = `<html><head><META NAME="Last-Modified" CONTENT="${isoDate}"></head></html>`;
    const ctx = makeContext(html);

    await lastModifiedMiddleware(ctx as never, noop);

    expect(ctx.res.headers.get("Last-Modified")).toBe(
      new Date(isoDate).toUTCString(),
    );
  });
});
