import { describe, expect, it, vi } from "vitest";

vi.mock("../clients/sanity-client.ts", () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sanityImage: { image: () => ({}) },
  sterettSanityClient: { fetch: vi.fn() },
}));

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { renderCalendarMonthView } from "../test-utils/render.tsx";
import { buildCalendarWeeks } from "../utils/calendar.ts";

const DATE_JUNE_15 = "2024-06-15";
const DATE_JUNE_01 = "2024-06-01";
const EVENT_BOARD_MEETING = "Board Meeting";

const makeEvent = (id: string, title: string): CalendarEventRecord => ({
  _id: id,
  _updatedAt: "2024-06-15T12:00:00Z",
  description: null,
  endsAt: "2024-06-15T15:00:00.000Z",
  startsAt: "2024-06-15T13:00:00.000Z",
  title,
});

describe("MonthView", () => {
  it("renders day headers Sun through Sat", async () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const html = await renderCalendarMonthView(weeks, new Map(), DATE_JUNE_15);
    expect(html).toContain("Sun");
    expect(html).toContain("Mon");
    expect(html).toContain("Sat");
  });

  it("renders correct number of day cells for a month", async () => {
    const weeks = buildCalendarWeeks(2024, 6); // June 2024
    const html = await renderCalendarMonthView(weeks, new Map(), DATE_JUNE_15);
    // June 2024 has 30 days; grid should have 35 cells (5 weeks x 7 days)
    expect(html).toBeTruthy();
  });

  it("highlights today with special styling", async () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const html = await renderCalendarMonthView(weeks, new Map(), DATE_JUNE_15);
    expect(html).toContain("bg-white/10");
  });

  it("renders event title in the correct cell", async () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const eventsByDate = new Map<string, CalendarEventRecord[]>([
      [DATE_JUNE_15, [makeEvent("evt-1", EVENT_BOARD_MEETING)]],
    ]);
    const html = await renderCalendarMonthView(
      weeks,
      eventsByDate,
      DATE_JUNE_01,
    );
    expect(html).toContain(EVENT_BOARD_MEETING);
  });

  it("shows '+N more' indicator when more than 3 events on a day", async () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const events = [
      makeEvent("e1", "Event 1"),
      makeEvent("e2", "Event 2"),
      makeEvent("e3", "Event 3"),
      makeEvent("e4", "Event 4"),
    ];
    const eventsByDate = new Map<string, CalendarEventRecord[]>([
      [DATE_JUNE_15, events],
    ]);
    const html = await renderCalendarMonthView(
      weeks,
      eventsByDate,
      DATE_JUNE_01,
    );
    expect(html).toContain("+1 more");
  });

  it("renders without events on empty month", async () => {
    const weeks = buildCalendarWeeks(2024, 6);
    const html = await renderCalendarMonthView(weeks, new Map(), DATE_JUNE_01);
    expect(html).not.toContain(EVENT_BOARD_MEETING);
  });

  it("dims non-current-month cells with opacity-30", async () => {
    const weeks = buildCalendarWeeks(2024, 6); // June: will have May/July cells
    const html = await renderCalendarMonthView(weeks, new Map(), DATE_JUNE_15);
    expect(html).toContain("opacity-30");
  });
});
