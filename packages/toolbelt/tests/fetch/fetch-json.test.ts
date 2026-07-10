import { Effect, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import { fetchJson } from "../../src/fetch/fetch-json.ts";

const FETCH_URL = "https://example.com";
const NAME_STRING_SCHEMA = Schema.Struct({ name: Schema.String });
const STRING_FAILURE = "string-failure";
const NETWORK_DOWN = "network down";

describe(fetchJson, () => {
  it("returns parsed data when response matches schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ name: "test" }))
    );

    const result = await Effect.runPromise(
      fetchJson(FETCH_URL, NAME_STRING_SCHEMA)
    );

    expect(result).toStrictEqual({ name: "test" });
    vi.unstubAllGlobals();
  });

  it("fails with Error when response does not match schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ wrong: 1 }))
    );

    const result = await Effect.runPromise(
      fetchJson(FETCH_URL, NAME_STRING_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    vi.unstubAllGlobals();
  });

  it("wraps non-Error fetch rejections in an Error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(STRING_FAILURE));

    const result = await Effect.runPromise(
      fetchJson(FETCH_URL, NAME_STRING_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(STRING_FAILURE);
    vi.unstubAllGlobals();
  });

  it("propagates Error fetch rejections unchanged", async () => {
    const originalError = new TypeError(NETWORK_DOWN);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(originalError));

    const result = await Effect.runPromise(
      fetchJson(FETCH_URL, NAME_STRING_SCHEMA).pipe(Effect.flip)
    );

    expect(result).toBe(originalError);
    vi.unstubAllGlobals();
  });
});
