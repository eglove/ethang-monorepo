vi.mock(import("../../clients/sanity-client.ts"), () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))" as const,
  sterettSanityClient: {
    fetch: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  } as unknown as (typeof import("../../clients/sanity-client.ts"))["sterettSanityClient"],
}));

import { describe, expect, it, vi } from "vitest";

import type {
  CalendarEventReturn,
  NewsUpdateReturn,
} from "../../sanity/get-news-and-events.ts";

import { sterettSanityClient } from "../../clients/sanity-client.ts";
import { renderNewsPage } from "../../test-utils/render.tsx";

const mockEvent: CalendarEventReturn = {
  _id: "evt-1",
  _updatedAt: "2024-06-15T00:00:00Z",
  description: null as unknown as CalendarEventReturn["description"],
  endsAt: "2024-06-15T15:00:00Z",
  startsAt: "2024-06-15T13:00:00Z",
  title: "Board Meeting",
};

const mockUpdate: NewsUpdateReturn = {
  _id: "upd-1",
  _updatedAt: "2024-06-14T00:00:00Z",
  date: "2024-06-14",
  description: null as unknown as NewsUpdateReturn["description"],
  title: "News Update",
};

describe("newsPage", () => {
  it("renders the page title", async () => {
    const html = await renderNewsPage([]);

    expect(html).toContain("Sterett Creek Village Trustee | News");
  });

  it("renders empty state when no items", async () => {
    const html = await renderNewsPage([]);

    expect(html).toContain("No upcoming news or events");
  });

  it("renders a calendar event item", async () => {
    const html = await renderNewsPage([mockEvent]);

    expect(html).toContain("Board Meeting");
  });

  it("renders a news update item", async () => {
    const html = await renderNewsPage([mockUpdate]);

    expect(html).toContain("News Update");
  });

  it("renders both event and update items together", async () => {
    const html = await renderNewsPage([mockEvent, mockUpdate]);

    expect(html).toContain("Board Meeting");
    expect(html).toContain("News Update");
  });

  it("fetches news from sanity when no items are provided", async () => {
    vi.clearAllMocks();
    vi.mocked(sterettSanityClient.fetch).mockResolvedValue(
      [] as unknown as never,
    );
    const html = await renderNewsPage();

    expect(html).toContain("No upcoming news or events");
  });
});
