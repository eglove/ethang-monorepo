/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../clients/sanity-client.ts", () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sterettSanityClient: { fetch: vi.fn() },
}));

import { sterettSanityClient } from "../clients/sanity-client.ts";
import {
  getCalendarEvents,
  getLatestCalendarEventUpdatedAt,
} from "./get-calendar-events.ts";

const RANGE_START = "2024-06-01";
const RANGE_END = "2024-06-30";
const LATEST_UPDATED_AT = "2024-06-15T00:00:00Z";

const makeEvent = (id: string) => ({
  _id: id,
  _updatedAt: "2024-06-01T00:00:00Z",
  description: null,
  endsAt: "2024-06-15T15:00:00Z",
  startsAt: "2024-06-15T13:00:00Z",
  title: `Event ${id}`,
});

describe("getLatestCalendarEventUpdatedAt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries ordered by _updatedAt descending", async () => {
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue(LATEST_UPDATED_AT);

    await getLatestCalendarEventUpdatedAt();

    const [query] = vi.mocked(sterettSanityClient.fetch).mock.calls[0] ?? [];
    expect(query).toContain("order(_updatedAt desc)");
  });

  it("returns the _updatedAt string of the most recent event", async () => {
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue(LATEST_UPDATED_AT);

    const result = await getLatestCalendarEventUpdatedAt();

    expect(result).toBe(LATEST_UPDATED_AT);
  });

  it("returns null when there are no calendar events", async () => {
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue(null);

    const result = await getLatestCalendarEventUpdatedAt();

    expect(result).toBeNull();
  });
});

describe("getCalendarEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fetch with the correct range params", async () => {
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    await getCalendarEvents(RANGE_START, RANGE_END);

    expect(sterettSanityClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining("$rangeStart"),
      expect.objectContaining({
        rangeEndExclusive: RANGE_END,
        rangeStart: RANGE_START,
      }),
    );
  });

  it("returns an empty array when there are no events", async () => {
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    const result = await getCalendarEvents(RANGE_START, RANGE_END);

    expect(result).toEqual([]);
  });

  it("returns events from the fetch result", async () => {
    const events = [makeEvent("evt-1"), makeEvent("evt-2")];
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue(events);

    const result = await getCalendarEvents(RANGE_START, RANGE_END);

    expect(result).toHaveLength(2);
    expect(result[0]?._id).toBe("evt-1");
    expect(result[1]?._id).toBe("evt-2");
  });

  it("query filters by rangeEndExclusive and rangeStart", async () => {
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue([]);

    await getCalendarEvents("2024-01-01", "2024-02-01");

    const [query] = vi.mocked(sterettSanityClient.fetch).mock.calls[0] ?? [];
    expect(query).toContain("startsAt < $rangeEndExclusive");
    expect(query).toContain("endsAt >= $rangeStart");
  });
});
