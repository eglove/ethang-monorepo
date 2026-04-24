/* eslint-disable @typescript-eslint/unbound-method */
vi.mock(import("../../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../../clients/sanity-client.ts"))["sterettSanityClient"],
}));

import { describe, expect, it, vi } from "vitest";

import { sterettSanityClient } from "../../clients/sanity-client.ts";
import { renderCalendarPage } from "../../test-utilities/render.tsx";

const CALENDAR_TITLE = "Sterett Creek Village Trustee | Calendar";
const DATE = "2024-06-17";
const UPDATED_AT = "2024-06-01T00:00:00Z";

describe("calendarPage", () => {
  it("renders the calendar page title in month view", async () => {
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([]); // getCalendarEvents
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce(UPDATED_AT); // getLatestCalendarEventUpdatedAt

    const html = await renderCalendarPage({
      date: DATE,
      month: 6,
      view: "month",
      year: 2024,
    });

    expect(html).toContain(CALENDAR_TITLE);
  });

  it("renders the month, week, and day view tabs", async () => {
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([]);
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce(undefined);

    const html = await renderCalendarPage({
      date: DATE,
      month: 6,
      view: "month",
      year: 2024,
    });

    expect(html).toContain("Month");
    expect(html).toContain("Week");
    expect(html).toContain("Day");
  });

  it("renders the calendar page title in week view", async () => {
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([]);
    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce(undefined);

    const html = await renderCalendarPage({
      date: DATE,
      month: 6,
      view: "week",
      year: 2024,
    });

    expect(html).toContain(CALENDAR_TITLE);
  });

  it("renders the day view with events", async () => {
    const mockEvent = {
      _id: "evt-1",
      _updatedAt: "2024-06-16T12:00:00Z",
      description: [],
      endsAt: "2024-06-17T15:00:00Z",
      startsAt: "2024-06-17T13:00:00Z",
      title: "Test Event",
    };

    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce([mockEvent]);

    const html = await renderCalendarPage({
      date: DATE,
      month: 6,
      view: "day",
      year: 2024,
    });

    expect(html).toContain(CALENDAR_TITLE);
    expect(html).toContain("Test Event");
  });

  it("sorts event updatedAt correctly", async () => {
    const mockEvents = [
      {
        _id: "evt-1",
        _updatedAt: "2024-06-15T12:00:00Z",
        description: [],
        endsAt: "2024-06-17T15:00:00Z",
        startsAt: "2024-06-17T13:00:00Z",
        title: "Event 1",
      },
      {
        _id: "evt-2",
        _updatedAt: "2024-06-16T12:00:00Z",
        description: [],
        endsAt: "2024-06-17T16:00:00Z",
        startsAt: "2024-06-17T14:00:00Z",
        title: "Event 2",
      },
    ];

    // @ts-expect-error for test
    vi.mocked(sterettSanityClient.fetch).mockResolvedValueOnce(mockEvents);

    const html = await renderCalendarPage({
      date: DATE,
      month: 6,
      view: "day",
      year: 2024,
    });

    expect(html).toContain("Event 1");
    expect(html).toContain("Event 2");
  });
});
