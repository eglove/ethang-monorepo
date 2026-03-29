import { describe, expect, it, vi } from "vitest";

import type { TrusteeRecord } from "../sanity/get-trustees.ts";

// @ts-expect-error mock
vi.mock(import("../clients/sanity-client.ts"), () => {
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
    } as unknown as (typeof import("../clients/sanity-client.ts"))["sterettSanityClient"],
  };
});

import { renderTrusteeCard } from "../test-utils/render.tsx";

const makeTrustee = (overrides: Partial<TrusteeRecord> = {}): TrusteeRecord =>
  ({
    _id: "t1",
    duties: "Secretary",
    image: {
      asset: {
        metadata: { dimensions: { height: 400, width: 400 } },
        url: "https://cdn.sanity.io/images/540gjnt8/production/abc123-400x400.jpg",
      },
    },
    name: "Jane Smith",
    phoneNumber: "555-123-4567",
    ...overrides,
  }) as TrusteeRecord;

describe("trusteeCard", () => {
  it("renders the trustee name", async () => {
    const html = await renderTrusteeCard(makeTrustee());

    expect(html).toContain("Jane Smith");
  });

  it("renders phone number as a tel: link", async () => {
    const html = await renderTrusteeCard(makeTrustee());

    expect(html).toContain('href="tel:555-123-4567"');
    expect(html).toContain("555-123-4567");
  });

  it("renders the trustee duties", async () => {
    const html = await renderTrusteeCard(makeTrustee());

    expect(html).toContain("Secretary");
  });

  it("renders an img with the trustee name as alt text", async () => {
    const html = await renderTrusteeCard(makeTrustee());

    expect(html).toContain('alt="Jane Smith"');
  });

  it("renders different trustees independently", async () => {
    const [htmlA, htmlB] = await Promise.all([
      renderTrusteeCard(makeTrustee({ name: "Alice" })),
      renderTrusteeCard(makeTrustee({ name: "Bob" })),
    ]);

    expect(htmlA).toContain("Alice");
    expect(htmlB).toContain("Bob");
    expect(htmlA).not.toContain("Bob");
    expect(htmlB).not.toContain("Alice");
  });
});
