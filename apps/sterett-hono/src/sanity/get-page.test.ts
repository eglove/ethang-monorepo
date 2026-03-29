/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../clients/sanity-client.ts"))["sterettSanityClient"],
}));

import { sterettSanityClient } from "../clients/sanity-client.ts";
import { getPage } from "./get-page.ts";

describe(getPage, () => {
  it("fetches a page by slug and returns the first result", async () => {
    vi.clearAllMocks();
    const mockPage = {
      _id: "abc",
      _updatedAt: "2024-01-01T00:00:00Z",
      content: [],
      title: "Home",
    };
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([mockPage]);

    const result = await getPage("home");

    expect(sterettSanityClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining("$slug"),
      { slug: "home" },
    );
    expect(result).toStrictEqual(mockPage);
  });

  it("returns undefined when no page matches the slug", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    const result = await getPage("nonexistent");

    expect(result).toBeUndefined();
  });

  it("passes the slug parameter to the query", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    await getPage("about");

    expect(sterettSanityClient.fetch).toHaveBeenCalledWith(expect.any(String), {
      slug: "about",
    });
  });
});
