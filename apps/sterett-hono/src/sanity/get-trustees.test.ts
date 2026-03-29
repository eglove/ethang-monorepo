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
import { getTrustees } from "./get-trustees.ts";

describe(getTrustees, () => {
  it("queries for trustees ordered by rank", async () => {
    vi.clearAllMocks();
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    await getTrustees();

    expect(sterettSanityClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining("trustee"),
    );
  });

  it("returns the trustees array from the fetch result", async () => {
    vi.clearAllMocks();
    const mockTrustees = [
      {
        _id: "t1",
        _updatedAt: "2024-06-15T00:00:00Z",
        duties: "Secretary",
        image: {
          asset: {
            metadata: { dimensions: { height: 400, width: 400 } },
            url: "https://cdn.sanity.io/images/test/abc123-400x400.jpg",
          },
        },
        name: "Jane Smith",
        phoneNumber: "555-123-4567",
      },
    ];
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue(mockTrustees);

    const result = await getTrustees();

    expect(result).toBe(mockTrustees);
  });
});
