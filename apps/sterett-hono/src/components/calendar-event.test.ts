import { DateTime } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { CalendarEventReturn } from "../sanity/get-news-and-events.ts";

import { renderCalendarEvent } from "../test-utilities/render.tsx";

const NOW_MS = DateTime.toEpochMillis(
  DateTime.unsafeMake("2024-06-15T12:00:00.000Z")
);

const makeEvent = (overrides: Partial<CalendarEventReturn> = {}) => {
  return {
    _id: "e1",

    description: null as never,
    endsAt: "2024-06-15T14:00:00.000Z",
    startsAt: "2024-06-15T13:00:00.000Z",
    title: "Board Meeting",
    ...overrides
  } as CalendarEventReturn;
};

describe("calendarEvent", () => {
  it.each([
    {
      assertion: "Happening Now!",
      endsAt: "2024-06-15T13:00:00.000Z",
      startsAt: "2024-06-15T11:00:00.000Z"
    },
    {
      assertion: "in 3 days",
      endsAt: "2024-06-18T14:00:00.000Z",
      startsAt: "2024-06-18T11:00:00.000Z"
    },
    {
      assertion: "3 days ago",
      endsAt: "2024-06-12T14:00:00.000Z",
      startsAt: "2024-06-12T11:00:00.000Z"
    }
  ])(
    "shows the correct label for a $assertion event",
    async ({ assertion, endsAt, startsAt }) => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW_MS);

      const html = await renderCalendarEvent(makeEvent({ endsAt, startsAt }));

      vi.useRealTimers();

      expect(html).toContain(assertion);
    }
  );

  it("renders the event title", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    const html = await renderCalendarEvent(
      makeEvent({ title: "Annual Trustee Meeting" })
    );

    vi.useRealTimers();

    expect(html).toContain("Annual Trustee Meeting");
  });

  it("renders the event date range separator", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    const html = await renderCalendarEvent(makeEvent());

    vi.useRealTimers();

    expect(html).toContain("–");
  });

  it("renders description text when provided", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    const description = {
      _key: "b1",
      _type: "block",
      children: [
        { _key: "s1", _type: "span", marks: [], text: "Bring your agenda" }
      ],
      markDefs: [],
      style: "normal"
    };
    const html = await renderCalendarEvent(makeEvent({ description }));

    vi.useRealTimers();

    expect(html).toContain("Bring your agenda");
  });

  it("renders without crashing when description is undefined", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW_MS);

    const html = await renderCalendarEvent(
      makeEvent({ description: null as never })
    );

    vi.useRealTimers();

    expect(html).toContain("Board Meeting");
  });
});
