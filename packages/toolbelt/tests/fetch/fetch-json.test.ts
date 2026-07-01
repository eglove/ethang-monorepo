import { Schema } from "effect";
import { describe, expect, it, vi } from "vitest";

import { fetchJson } from "../../src/fetch/fetch-json.ts";

describe(fetchJson, () => {
  it("returns parsed data when response matches schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ name: "test" }))
    );

    const result = await fetchJson(
      "https://example.com",
      Schema.Struct({ name: Schema.String })
    );

    expect(result).toStrictEqual({ name: "test" });
    vi.unstubAllGlobals();
  });

  it("returns Error when response does not match schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ wrong: 1 }))
    );

    const result = await fetchJson(
      "https://example.com",
      Schema.Struct({ name: Schema.String })
    );

    expect(result).toBeInstanceOf(Error);
    vi.unstubAllGlobals();
  });
});
