import { describe, expect, it } from "vitest";

import {
  buildCacheControlHeader,
  buildCacheTagHeader,
  CACHE_CONTROL_HEADER,
  CACHE_TAG_HEADER,
  createCachedJsonResponse,
  DEFAULT_MAX_AGE_SECONDS,
  DEFAULT_STALE_WHILE_REVALIDATE_SECONDS,
  withCacheHeaders
} from "./cache-control.ts";

const DEFAULT_CACHE_CONTROL = `public, max-age=${DEFAULT_MAX_AGE_SECONDS}, stale-while-revalidate=${DEFAULT_STALE_WHILE_REVALIDATE_SECONDS}`;
const PRIVATE_60_120 = "private, max-age=60, stale-while-revalidate=120";
const PUBLIC_MAX_AGE_0 = "public, max-age=0";
const PUBLIC_10_20 = "public, max-age=10, stale-while-revalidate=20";
const PUBLIC_30_60 = "public, max-age=30, stale-while-revalidate=60";
const USERS_USER_42_TAG = "users, user:42";
const VARY_ACCEPT_ENCODING = "Accept-Encoding";

describe("buildCacheControlHeader", () => {
  it.each([
    { expected: DEFAULT_CACHE_CONTROL, options: {} },
    {
      expected: PRIVATE_60_120,
      options: { maxAge: 60, scope: "private" as const, swr: 120 }
    },
    { expected: PUBLIC_MAX_AGE_0, options: { maxAge: 0, swr: 0 } },
    { expected: "no-store", options: { scope: "no-store" as const } },
    {
      expected: "private, no-store",
      options: { maxAge: 0, scope: "private" as const }
    },
    {
      expected: "private, no-store",
      options: { scope: "private" as const }
    },
    {
      expected: "public, max-age=1, stale-while-revalidate=1",
      options: { maxAge: 1, swr: 1 }
    },
    {
      expected: "public, max-age=10",
      options: { maxAge: 10, swr: 0 }
    }
  ])("builds '$expected'", ({ expected, options }) => {
    expect(buildCacheControlHeader(options)).toBe(expected);
  });
});

describe("buildCacheTagHeader", () => {
  it.each([
    { expected: null, input: [] },
    { expected: "courses", input: ["courses"] },
    { expected: "course:1, course:2", input: [" course:1 ", "course:2"] },
    { expected: "tag1, tag2", input: ["  tag1  ", "tag2"] },
    { expected: null, input: ["", "  "] }
  ])("returns '$expected'", ({ expected, input }) => {
    expect(buildCacheTagHeader(input)).toBe(expected);
  });
});

describe("withCacheHeaders", () => {
  it(`sets ${CACHE_TAG_HEADER} and does not mutate the input`, async () => {
    const original = Response.json(
      { ok: true },
      {
        headers: { "X-Custom": "1" }
      }
    );
    const updated = withCacheHeaders(original, {
      cacheControl: { maxAge: 30, scope: "public", swr: 60 },
      tags: ["users", "user:42"]
    });

    expect(updated.headers.get(CACHE_CONTROL_HEADER)).toBe(PUBLIC_30_60);
    expect(updated.headers.get(CACHE_TAG_HEADER)).toBe(USERS_USER_42_TAG);
    expect(updated.headers.get("X-Custom")).toBe("1");
    expect(updated.status).toBe(200);
    expect(original.headers.get(CACHE_CONTROL_HEADER)).toBeNull();
    expect(await updated.json()).toEqual({ ok: true });
  });

  it(`omits ${CACHE_TAG_HEADER} when no tags are provided`, () => {
    const response = withCacheHeaders(new Response("hi"));
    expect(response.headers.get(CACHE_TAG_HEADER)).toBeNull();
    expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
      DEFAULT_CACHE_CONTROL
    );
  });

  it("merges Vary headers without duplicates", () => {
    const response = withCacheHeaders(
      new Response("hi", { headers: { Vary: VARY_ACCEPT_ENCODING } }),
      { vary: [VARY_ACCEPT_ENCODING, "Accept-Language"] }
    );
    expect(response.headers.get("Vary")).toBe(
      `${VARY_ACCEPT_ENCODING}, Accept-Language`
    );
  });

  it("appends Vary values when response has no Vary header", () => {
    const response = withCacheHeaders(new Response("hi"), {
      vary: [VARY_ACCEPT_ENCODING]
    });
    expect(response.headers.get("Vary")).toBe(VARY_ACCEPT_ENCODING);
  });
});

describe("createCachedJsonResponse", () => {
  it("serializes data, sets Cache-Control, and preserves status", async () => {
    const response = createCachedJsonResponse(
      { hello: "world" },
      {
        cacheControl: { maxAge: 10, scope: "public", swr: 20 },
        init: { status: 201 },
        tags: ["widget"]
      }
    );

    expect(response.status).toBe(201);
    expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(PUBLIC_10_20);
    expect(response.headers.get(CACHE_TAG_HEADER)).toBe("widget");
    expect(await response.json()).toEqual({ hello: "world" });
  });

  it("handles null data with no-store scope and 'null' body", async () => {
    const response = createCachedJsonResponse(null, {
      cacheControl: { scope: "no-store" as const }
    });
    expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe("no-store");
    expect(await response.json()).toBeNull();
  });

  it("uses defaults when no options are provided", async () => {
    const response = createCachedJsonResponse({ ok: 1 });
    expect(response.status).toBe(200);
    expect(response.headers.get(CACHE_CONTROL_HEADER)).toBe(
      DEFAULT_CACHE_CONTROL
    );
    expect(response.headers.get(CACHE_TAG_HEADER)).toBeNull();
    expect(await response.json()).toEqual({ ok: 1 });
  });
});
