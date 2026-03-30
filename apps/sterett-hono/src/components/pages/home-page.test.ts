// @ts-expect-error mock
vi.mock(import("../../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  sanityImage: { image: () => ({}) },
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../../clients/sanity-client.ts"))["sterettSanityClient"],
}));

vi.mock(import("../../sanity/get-page.ts"), () => ({
  getPage: vi.fn(),
}));

import { describe, expect, it, vi } from "vitest";

import { getPage } from "../../sanity/get-page.ts";
import { renderHomePage } from "../../test-utils/render.tsx";

describe("homePage", () => {
  it("renders the page title in a title tag", async () => {
    vi.clearAllMocks();
    vi.mocked(getPage).mockResolvedValue({
      _id: "p1",
      _updatedAt: "2024-06-15T00:00:00Z",
      content: [],
      title: "Home",
    });

    const html = await renderHomePage();

    expect(html).toContain("Sterett Creek Village Trustee | Home");
  });

  it("renders without crashing when page data is undefined", async () => {
    vi.clearAllMocks();
    vi.mocked(getPage).mockResolvedValue(undefined);

    const html = await renderHomePage();

    expect(html).toContain("Sterett Creek Village Trustee | Home");
  });
});
