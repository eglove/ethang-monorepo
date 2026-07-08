import { Effect } from "effect";
import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import { fetchJson } from "../../src/fetch/fetch-json.ts";

describe(fetchJson, () => {
  it("returns parsed data when response matches schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ name: "test" }))
    );

    const result = await Effect.runPromise(
      fetchJson("https://example.com", Schema.Struct({ name: Schema.String }))
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
      fetchJson(
        "https://example.com",
        Schema.Struct({ name: Schema.String })
      ).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    vi.unstubAllGlobals();
  });

  it("wraps non-Error fetch rejections in an Error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("string-failure"));

    const result = await Effect.runPromise(
      fetchJson("https://example.com", Schema.Struct({ name: Schema.String })).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("string-failure");
    vi.unstubAllGlobals();
  });

  it("wraps non-Error fetch rejections in an Error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("string-failure"));

    const result = await Effect.runPromise(
      fetchJson("https://example.com", Schema.Struct({ name: Schema.String })).pipe(
        Effect.flip
      )
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("string-failure");
    vi.unstubAllGlobals();
  });

  it("propagates Error fetch rejections unchanged", async () => {
    const originalError = new TypeError("network down");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(originalError));

    const result = await Effect.runPromise(
      fetchJson("https://example.com", Schema.Struct({ name: Schema.String })).pipe(
        Effect.flip
      )
    );

    expect(result).toBe(originalError);
    vi.unstubAllGlobals();
  });
});
