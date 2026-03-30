import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { fetchJson } from "../../src/fetch/fetch-json.ts";

describe(fetchJson, () => {
  it("returns parsed data when response matches schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ name: "test" }))),
    );

    const result = await fetchJson(
      "http://example.com",
      z.object({ name: z.string() }),
    );

    expect(result).toStrictEqual({ name: "test" });
    vi.unstubAllGlobals();
  });

  it("returns Error when response does not match schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ wrong: 1 }))),
    );

    const result = await fetchJson(
      "http://example.com",
      z.object({ name: z.string() }),
    );

    expect(result).toBeInstanceOf(Error);
    vi.unstubAllGlobals();
  });
});
