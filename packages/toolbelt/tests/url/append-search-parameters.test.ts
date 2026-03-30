import { describe, expect, it } from "vitest";

import { appendSearchParameters } from "../../src/url/append-search-parameters.ts";

describe(appendSearchParameters, () => {
  it("appends all parameters to the url", () => {
    const url = new URL("http://example.com");
    const params = new URLSearchParams({ a: "1", b: "2" });

    appendSearchParameters(url, params);

    expect(url.searchParams.get("a")).toBe("1");
    expect(url.searchParams.get("b")).toBe("2");
  });

  it("does nothing when parameters is nil", () => {
    const url = new URL("http://example.com");

    // @ts-expect-error testing nil guard
    appendSearchParameters(url, null);

    expect(url.search).toBe("");
  });
});
