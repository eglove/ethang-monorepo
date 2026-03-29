vi.mock(import("../../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../../clients/sanity-client.ts"))["sterettSanityClient"],
}));

vi.mock(import("../../sanity/get-files.ts"), () => ({
  getFiles: vi.fn(),
}));

import { describe, expect, it, vi } from "vitest";

import { getFiles } from "../../sanity/get-files.ts";
import { renderFilesPage } from "../../test-utils/render.tsx";

const EMPTY_FILES = { covenants: [], general: [], meetingMinutes: [] };

describe("filesPage", () => {
  it("renders the page title", async () => {
    vi.clearAllMocks();
    vi.mocked(getFiles).mockResolvedValue(EMPTY_FILES);

    const html = await renderFilesPage();

    expect(html).toContain("Sterett Creek Village Trustee | Files");
  });

  it("renders file table sections", async () => {
    vi.clearAllMocks();
    vi.mocked(getFiles).mockResolvedValue({
      covenants: [
        {
          _id: "c1",
          _updatedAt: "2024-06-15T00:00:00Z",
          category: "Covenant",
          date: "2024-06-15",
          file: { asset: { url: "https://example.com/covenant.pdf" } },
          title: "Main Covenant",
        },
      ],
      general: [],
      meetingMinutes: [],
    });

    const html = await renderFilesPage();

    expect(html).toContain("Covenants");
    expect(html).toContain("Main Covenant");
  });
});
