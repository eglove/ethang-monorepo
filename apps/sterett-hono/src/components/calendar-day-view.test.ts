import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sanityImage: { image: () => ({}) },
  sterettSanityClient: { fetch: vi.fn() },
}));

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { renderCalendarDayView } from "../test-utils/render.tsx";

const makeEvent = (
  overrides: Partial<CalendarEventRecord> = {},
): CalendarEventRecord => ({
  _id: "event-1",
  _updatedAt: "2024-06-15T12:00:00Z",
  description: null,
  endsAt: "2024-06-15T15:00:00.000Z",
  startsAt: "2024-06-15T13:00:00.000Z",
  title: "Test Event",
  ...overrides,
});

describe("dayView", () => {
  it("renders 'No events scheduled' when events array is empty", async () => {
    const html = await renderCalendarDayView([]);

    expect(html).toContain("No events scheduled");
  });

  it("renders event title", async () => {
    const html = await renderCalendarDayView([
      makeEvent({ title: "Board Meeting" }),
    ]);

    expect(html).toContain("Board Meeting");
  });

  it("renders formatted start and end times", async () => {
    const html = await renderCalendarDayView([
      makeEvent({
        endsAt: "2024-06-15T15:00:00.000Z",
        startsAt: "2024-06-15T13:00:00.000Z",
      }),
    ]);

    // Should contain formatted times (Chicago timezone)
    expect(html).toMatch(/AM|PM/u);
  });

  it("renders a Details button for each event", async () => {
    const html = await renderCalendarDayView([makeEvent()]);

    expect(html).toContain("Details");
  });

  it("renders multiple events", async () => {
    const events = [
      makeEvent({ _id: "evt-1", title: "Morning Meeting" }),
      makeEvent({ _id: "evt-2", title: "Afternoon Call" }),
    ];
    const html = await renderCalendarDayView(events);

    expect(html).toContain("Morning Meeting");
    expect(html).toContain("Afternoon Call");
  });

  it("renders button with correct dialog id for event", async () => {
    const html = await renderCalendarDayView([makeEvent({ _id: "abc123" })]);

    expect(html).toContain("cal-abc123");
  });
});
