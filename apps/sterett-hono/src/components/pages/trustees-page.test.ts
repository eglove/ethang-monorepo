// @ts-expect-error mock
vi.mock(import("../../clients/sanity-client.ts"), () => {
  // eslint-disable-next-line lodash/prefer-constant,unicorn/consistent-function-scoping
  const mockUrl = () => "https://example.com/mock-128x128.webp";
  const mockFormat = () => ({ url: mockUrl });
  const mockWidth = () => ({ format: mockFormat });
  const mockHeight = () => ({ width: mockWidth });
  return {
    NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
    sanityImage: { image: () => ({ height: mockHeight }) },
    sterettSanityClient: {
      fetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    } as unknown as (typeof import("../../clients/sanity-client.ts"))["sterettSanityClient"],
  };
});

vi.mock(import("../../sanity/get-trustees.ts"), () => ({
  getTrustees: vi.fn(),
}));

import { describe, expect, it, vi } from "vitest";

import { getTrustees } from "../../sanity/get-trustees.ts";
import { renderTrusteesPage } from "../../test-utils/render.tsx";

const makeTrustee = (id: string, name: string) => ({
  _id: id,
  _updatedAt: "2024-06-15T00:00:00Z",
  duties: "Trustee",
  image: {
    asset: {
      metadata: { dimensions: { height: 400, width: 400 } },
      url: `https://cdn.sanity.io/images/test/${id}-400x400.jpg`,
    },
  },
  name,
  phoneNumber: "555-000-0000",
});

describe("trusteesPage", () => {
  it("renders the page title", async () => {
    vi.clearAllMocks();
    vi.mocked(getTrustees).mockResolvedValue([]);

    const html = await renderTrusteesPage();

    expect(html).toContain("Sterett Creek Village Trustee | Trustees");
  });

  it("renders trustee names", async () => {
    vi.clearAllMocks();
    vi.mocked(getTrustees).mockResolvedValue([
      makeTrustee("t1", "Alice Smith"),
      makeTrustee("t2", "Bob Jones"),
    ]);

    const html = await renderTrusteesPage();

    expect(html).toContain("Alice Smith");
    expect(html).toContain("Bob Jones");
  });
});
