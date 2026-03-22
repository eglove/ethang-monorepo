import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../clients/sanity-client.ts", () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sterettSanityClient: { fetch: vi.fn() },
}));

import { sterettSanityClient } from "../clients/sanity-client.ts";
import { getFiles } from "./get-files.ts";

const makeFile = (id: string, category: string) => ({
  _id: id,
  _updatedAt: "2024-01-01T00:00:00Z",
  category,
  date: "2024-01-01",
  file: { asset: { url: `https://example.com/${id}.pdf` } },
  title: `File ${id}`,
});

describe("getFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("splits covenant and general files into separate buckets", async () => {
    const generalCovenant = [
      makeFile("1", "Covenant"),
      makeFile("2", "General"),
      makeFile("3", "Covenant"),
    ];
    const meetingMinutes = [makeFile("4", "Meeting Minute")];

    vi.mocked(sterettSanityClient.fetch)
      .mockResolvedValueOnce(generalCovenant)
      .mockResolvedValueOnce(meetingMinutes);

    const result = await getFiles();

    expect(result.covenants).toHaveLength(2);
    expect(result.general).toHaveLength(1);
    expect(result.meetingMinutes).toHaveLength(1);
  });

  it("returns empty arrays when no files exist", async () => {
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    const result = await getFiles();

    expect(result.covenants).toHaveLength(0);
    expect(result.general).toHaveLength(0);
    expect(result.meetingMinutes).toHaveLength(0);
  });

  it("correctly identifies covenant files", async () => {
    const generalCovenant = [
      makeFile("c1", "Covenant"),
      makeFile("c2", "Covenant"),
    ];
    vi.mocked(sterettSanityClient.fetch)
      .mockResolvedValueOnce(generalCovenant)
      .mockResolvedValueOnce([]);

    const result = await getFiles();

    expect(result.covenants.every((f) => "Covenant" === f.category)).toBe(true);
    expect(result.general).toHaveLength(0);
  });

  it("correctly identifies general files", async () => {
    const generalCovenant = [
      makeFile("g1", "General"),
      makeFile("g2", "General"),
    ];
    vi.mocked(sterettSanityClient.fetch)
      .mockResolvedValueOnce(generalCovenant)
      .mockResolvedValueOnce([]);

    const result = await getFiles();

    expect(result.general.every((f) => "General" === f.category)).toBe(true);
    expect(result.covenants).toHaveLength(0);
  });
});
