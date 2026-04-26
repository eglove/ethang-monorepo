import { vi } from "vitest";

vi.mock(import("../../clients/sanity-client.ts"), () => {return {
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../../clients/sanity-client.ts"))["sterettSanityClient"],
}});
