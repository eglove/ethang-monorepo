import { describe, expect, it, vi } from "vitest";

import type { TrusteeRecord } from "../sanity/get-trustees.ts";

// @ts-expect-error mock
vi.mock(import("../clients/sanity-client.ts"), () => {
  const mockUrl = () => {
    return "https://example.com/mock-128x128.webp";
  };
  const mockFormat = () => {
    return { url: mockUrl };
  };
  const mockWidth = () => {
    return { format: mockFormat };
  };
  const mockHeight = () => {
    return { width: mockWidth };
  };
  return {
    NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
    sanityImage: {
      image: () => {
        return { height: mockHeight };
      }
    },
    sterettSanityClient: {
      fetch: vi.fn()
    } as unknown as (typeof import("../clients/sanity-client.ts"))["sterettSanityClient"]
  };
});

import { renderTrusteeCard } from "../test-utilities/render.tsx";

const makeTrustee = (overrides: Partial<TrusteeRecord> = {}) => {
  return {
    _id: "t1",
    duties: "Secretary",
    image: {
      asset: {
        metadata: { dimensions: { height: 400, width: 400 } },
        url: "https://cdn.sanity.io/images/540gjnt8/production/abc123-400x400.jpg"
      }
    },
    name: "Jane Smith",
    phoneNumber: "555-123-4567",
    ...overrides
  } as TrusteeRecord;
};

describe("trusteeCard", () => {
  it.each([
    { assertion: "Jane Smith", label: "name" },
    { assertion: 'href="tel:555-123-4567"', label: "phone number tel link" },
    { assertion: "Secretary", label: "duties" }
  ])("renders the trustee $label", async ({ assertion }) => {
    const html = await renderTrusteeCard(makeTrustee());

    expect(html).toContain(assertion);
  });

  it("renders an img with the trustee name as alt text", async () => {
    const html = await renderTrusteeCard(makeTrustee());

    expect(html).toContain('alt="Jane Smith"');
  });

  it("renders different trustees independently", async () => {
    const [htmlA, htmlB] = await Promise.all([
      renderTrusteeCard(makeTrustee({ name: "Alice" })),
      renderTrusteeCard(makeTrustee({ name: "Bob" }))
    ]);

    expect(htmlA).toContain("Alice");
    expect(htmlB).toContain("Bob");
    expect(htmlA).not.toContain("Bob");
    expect(htmlB).not.toContain("Alice");
  });
});
