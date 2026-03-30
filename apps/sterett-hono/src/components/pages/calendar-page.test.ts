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
import { renderCalendarPage } from "../../test-utils/render.tsx";

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
});
