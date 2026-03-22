import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CalendarEventReturn } from "../sanity/get-news-and-events.ts";

import { renderCalendarEvent } from "../test-utils/render.tsx";

const NOW = new Date("2024-06-15T12:00:00.000Z");

const makeEvent = (
  overrides: Partial<CalendarEventReturn> = {},
): CalendarEventReturn => ({
  _id: "e1",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  description: undefined as never,
  endsAt: "2024-06-15T14:00:00.000Z",
  startsAt: "2024-06-15T13:00:00.000Z",
  title: "Board Meeting",
  ...overrides,
});

describe("CalendarEvent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "Happening Now!" for an active event', async () => {
    const html = await renderCalendarEvent(
      makeEvent({
        endsAt: "2024-06-15T13:00:00.000Z",
        startsAt: "2024-06-15T11:00:00.000Z",
      }),
    );
    expect(html).toContain("Happening Now!");
  });

  it("shows relative date for a future event", async () => {
    const html = await renderCalendarEvent(
      makeEvent({
        endsAt: "2024-06-18T14:00:00.000Z",
        startsAt: "2024-06-18T11:00:00.000Z",
      }),
    );
    expect(html).toContain("in 3 days");
  });

  it("shows relative date for a past event", async () => {
    const html = await renderCalendarEvent(
      makeEvent({
        endsAt: "2024-06-12T14:00:00.000Z",
        startsAt: "2024-06-12T11:00:00.000Z",
      }),
    );
    expect(html).toContain("3 days ago");
  });

  it("renders the event title", async () => {
    const html = await renderCalendarEvent(
      makeEvent({ title: "Annual Trustee Meeting" }),
    );
    expect(html).toContain("Annual Trustee Meeting");
  });

  it("renders the event date range separator", async () => {
    const html = await renderCalendarEvent(makeEvent());
    expect(html).toContain("–");
  });

  it("renders description text when provided", async () => {
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      makeEvent({ description: description as never }),
    );
    expect(html).toContain("Bring your agenda");
  });

  it("renders without crashing when description is undefined", async () => {
    const html = await renderCalendarEvent(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      makeEvent({ description: undefined as never }),
    );
    expect(html).toContain("Board Meeting");
  });
});
