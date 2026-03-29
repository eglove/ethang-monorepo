import { describe, expect, it, vi } from "vitest";

import type { CalendarEventReturn } from "../sanity/get-news-and-events.ts";

import { renderCalendarEvent } from "../test-utils/render.tsx";

const NOW = new Date("2024-06-15T12:00:00.000Z");

const makeEvent = (
  overrides: Partial<CalendarEventReturn> = {},
): CalendarEventReturn =>
  ({
    _id: "e1",

    description: undefined as never,
    endsAt: "2024-06-15T14:00:00.000Z",
    startsAt: "2024-06-15T13:00:00.000Z",
    title: "Board Meeting",
    ...overrides,
  }) as CalendarEventReturn;

describe("calendarEvent", () => {
  it('shows "Happening Now!" for an active event', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const html = await renderCalendarEvent(
      makeEvent({
        endsAt: "2024-06-15T13:00:00.000Z",
        startsAt: "2024-06-15T11:00:00.000Z",
      }),
    );

    vi.useRealTimers();

    expect(html).toContain("Happening Now!");
  });

  it("shows relative date for a future event", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const html = await renderCalendarEvent(
      makeEvent({
        endsAt: "2024-06-18T14:00:00.000Z",
        startsAt: "2024-06-18T11:00:00.000Z",
      }),
    );

    vi.useRealTimers();

    expect(html).toContain("in 3 days");
  });

  it("shows relative date for a past event", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const html = await renderCalendarEvent(
      makeEvent({
        endsAt: "2024-06-12T14:00:00.000Z",
        startsAt: "2024-06-12T11:00:00.000Z",
      }),
    );

    vi.useRealTimers();

    expect(html).toContain("3 days ago");
  });

  it("renders the event title", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const html = await renderCalendarEvent(
      makeEvent({ title: "Annual Trustee Meeting" }),
    );

    vi.useRealTimers();

    expect(html).toContain("Annual Trustee Meeting");
  });

  it("renders the event date range separator", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const html = await renderCalendarEvent(makeEvent());

    vi.useRealTimers();

    expect(html).toContain("–");
  });

  it("renders description text when provided", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const description = {
      _key: "b1",
      _type: "block",
      children: [
        { _key: "s1", _type: "span", marks: [], text: "Bring your agenda" },
      ],
      markDefs: [],
      style: "normal",
    };
    const html = await renderCalendarEvent(
      makeEvent({ description: description as never }),
    );

    vi.useRealTimers();

    expect(html).toContain("Bring your agenda");
  });

  it("renders without crashing when description is undefined", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    const html = await renderCalendarEvent(
      makeEvent({ description: undefined as never }),
    );

    vi.useRealTimers();

    expect(html).toContain("Board Meeting");
  });
});
