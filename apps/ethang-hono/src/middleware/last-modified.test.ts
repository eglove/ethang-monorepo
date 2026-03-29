import { describe, expect, it, vi } from "vitest";

import { lastModifiedMiddleware } from "./last-modified.ts";

const noop: () => Promise<void> = vi.fn().mockResolvedValue(undefined);

const makeContext = (html: string, contentType = "text/html") => {
  return {
    res: new Response(html, {
      headers: { "Content-Type": contentType },
    }),
  };
};

describe(lastModifiedMiddleware, () => {
  it("sets Last-Modified header from meta tag content", async () => {
    const isoDate = "2024-06-15T12:00:00Z";
    const html = `<html><head><meta name="last-modified" content="${isoDate}"></head></html>`;
    const context = makeContext(html);

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    const lastModified = context.res.headers.get("Last-Modified");

    expect(lastModified).toBe(new Date(isoDate).toUTCString());
  });

  it("leaves response unchanged when no meta last-modified tag", async () => {
    const html = "<html><head><title>No meta</title></head></html>";
    const context = makeContext(html);
    const originalResponse = context.res;

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res).toBe(originalResponse);
  });

  it("leaves response unchanged for non-HTML content type", async () => {
    const context = makeContext('{"key":"value"}', "application/json");
    const originalResponse = context.res;

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res).toBe(originalResponse);
  });

  it("leaves response unchanged when body is null", async () => {
    const context = {
      res: new Response(null, {
        headers: { "Content-Type": "text/html" },
      }),
    };
    const originalResponse = context.res;

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res).toBe(originalResponse);
  });

  it("leaves response unchanged when content attribute has invalid date", async () => {
    const html = `<html><head><meta name="last-modified" content="not-a-date"></head></html>`;
    const context = makeContext(html);
    const originalResponse = context.res;

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res).toBe(originalResponse);
  });

  it("leaves response unchanged when meta tag has no content attribute", async () => {
    const html = `<html><head><meta name="last-modified"></head></html>`;
    const context = makeContext(html);
    const originalResponse = context.res;

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res).toBe(originalResponse);
  });

  it("preserves original response status and statusText", async () => {
    const isoDate = "2024-01-01T00:00:00Z";
    const html = `<html><head><meta name="last-modified" content="${isoDate}"></head></html>`;
    const context = {
      res: new Response(html, {
        headers: { "Content-Type": "text/html" },
        status: 201,
        statusText: "Created",
      }),
    };

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res.status).toBe(201);
    expect(context.res.statusText).toBe("Created");
  });

  it("calls next before processing the response", async () => {
    let nextCalled = false;
    const trackingNext = vi.fn().mockImplementation(() => {
      nextCalled = true;
    });
    const html = `<html><head><meta name="last-modified" content="2024-01-01T00:00:00Z"></head></html>`;
    const context = makeContext(html);

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      trackingNext,
    );

    expect(nextCalled).toBe(true);
  });

  it("leaves response unchanged when no Content-Type header is set", async () => {
    // String bodies auto-set "text/plain" per Fetch spec — use a ReadableStream
    // to get a body with no auto-detected MIME type, making get("content-type") null.
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("body content"));
        controller.close();
      },
    });
    const context = {
      res: new Response(stream, { headers: {} }),
    };
    const originalResponse = context.res;

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res).toBe(originalResponse);
  });

  it("is case-insensitive for meta tag matching", async () => {
    const isoDate = "2024-03-20T08:00:00Z";
    const html = `<html><head><META NAME="Last-Modified" CONTENT="${isoDate}"></head></html>`;
    const context = makeContext(html);

    await lastModifiedMiddleware(
      context as unknown as Parameters<typeof lastModifiedMiddleware>[0],
      noop,
    );

    expect(context.res.headers.get("Last-Modified")).toBe(
      new Date(isoDate).toUTCString(),
    );
  });
});
