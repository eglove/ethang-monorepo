import { describe, expect, it, vi } from "vitest";

vi.mock(import("../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sanityImage: { image: () => ({}) },
  sterettSanityClient: { fetch: vi.fn() },
}));

import type { CalendarEventRecord } from "../sanity/get-calendar-events.ts";

import { renderCalendarEventDialog } from "../test-utils/render.tsx";

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

describe("calendarEventDialog", () => {
  it("renders dialog with correct id", async () => {
    const html = await renderCalendarEventDialog(
      makeEvent({ _id: "my-event" }),
    );

    expect(html).toContain("cal-my-event");
  });

  it("renders event title", async () => {
    const html = await renderCalendarEventDialog(
      makeEvent({ title: "Annual Meeting" }),
    );

    expect(html).toContain("Annual Meeting");
  });

  it("renders formatted start and end times", async () => {
    const html = await renderCalendarEventDialog(makeEvent());

    expect(html).toContain("Starts:");
    expect(html).toContain("Ends:");
  });

  it("renders calendar service links", async () => {
    const html = await renderCalendarEventDialog(makeEvent());

    expect(html).toContain("Google");
    expect(html).toContain("Apple / ICS");
    expect(html).toContain("Outlook");
    expect(html).toContain("Office 365");
    expect(html).toContain("Yahoo");
  });

  it("renders 'Add to my Calendar' section", async () => {
    const html = await renderCalendarEventDialog(makeEvent());

    expect(html).toContain("Add to my Calendar");
  });

  it("renders close button", async () => {
    const html = await renderCalendarEventDialog(makeEvent());

    expect(html).toContain("Close");
  });

  it("renders description when provided", async () => {
    const event = makeEvent({
      description: [
        {
          _key: "block1",
          _type: "block",
          children: [
            {
              _key: "span1",
              _type: "span",
              marks: [],
              text: "Event description text",
            },
          ],
          markDefs: [],
          style: "normal",
        },
      ],
    });
    const html = await renderCalendarEventDialog(event);

    expect(html).toContain("Event description text");
  });

  it("does not render description section when description is null", async () => {
    const html = await renderCalendarEventDialog(
      makeEvent({ description: null }),
    );

    expect(html).not.toContain("prose");
  });
});
