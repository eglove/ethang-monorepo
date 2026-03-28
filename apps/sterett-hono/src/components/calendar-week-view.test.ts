import { describe, expect, it, vi } from "vitest";

// @ts-expect-error ignore
vi.mock(import("../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sanityImage: { image: () => ({}) },
  sterettSanityClient: { fetch: vi.fn() },
}));

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { renderCalendarWeekView } from "../test-utils/render.tsx";
import { getWeekDays } from "../utils/calendar.ts";

const DATE_JUNE_15 = "2024-06-15";
const DATE_JUNE_01 = "2024-06-01";

const makeEvent = (id: string, title: string): CalendarEventRecord => ({
  _id: id,
  _updatedAt: "2024-06-15T12:00:00Z",
  description: [],
  endsAt: "2024-06-15T15:00:00.000Z",
  startsAt: "2024-06-15T13:00:00.000Z",
  title,
});

describe("weekView", () => {
  it("renders day headers Sun through Sat", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const html = await renderCalendarWeekView(
      weekDays,
      new Map(),
      DATE_JUNE_15,
    );

    // Desktop headers
    expect(html).toContain("Sun");
    expect(html).toContain("Sat");
  });

  it("renders 7 days in the week", () => {
    const weekDays = getWeekDays(DATE_JUNE_15); // week of June 15, 2024

    // Should contain all 7 day links
    expect(weekDays).toHaveLength(7);
  });

  it("highlights today cell", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const html = await renderCalendarWeekView(
      weekDays,
      new Map(),
      DATE_JUNE_15,
    );

    expect(html).toContain("bg-white/10");
  });

  it("renders event title in day column", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const eventsByDate = new Map<string, CalendarEventRecord[]>([
      [DATE_JUNE_15, [makeEvent("evt-1", "Team Standup")]],
    ]);
    const html = await renderCalendarWeekView(
      weekDays,
      eventsByDate,
      DATE_JUNE_01,
    );

    expect(html).toContain("Team Standup");
  });

  it("shows 'No events' for empty days", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const html = await renderCalendarWeekView(
      weekDays,
      new Map(),
      DATE_JUNE_01,
    );

    expect(html).toContain("No events");
  });

  it("shows 'Today' badge on today's column in mobile view", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const html = await renderCalendarWeekView(
      weekDays,
      new Map(),
      DATE_JUNE_15,
    );

    expect(html).toContain("Today");
  });

  it("shows '+N more' indicator when more than 3 events on a day", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const events = [
      makeEvent("e1", "Event 1"),
      makeEvent("e2", "Event 2"),
      makeEvent("e3", "Event 3"),
      makeEvent("e4", "Event 4"),
    ];
    const eventsByDate = new Map<string, CalendarEventRecord[]>([
      [DATE_JUNE_15, events],
    ]);
    const html = await renderCalendarWeekView(
      weekDays,
      eventsByDate,
      DATE_JUNE_01,
    );

    expect(html).toContain("+1 more");
  });

  it("renders links to day view for each day", async () => {
    const weekDays = getWeekDays(DATE_JUNE_15);
    const html = await renderCalendarWeekView(
      weekDays,
      new Map(),
      DATE_JUNE_01,
    );

    expect(html).toContain("view=day");
  });
});
