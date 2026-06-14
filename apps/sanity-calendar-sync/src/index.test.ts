import constant from "lodash/constant.js";
import { generateIcsCalendar } from "ts-ics";
import { describe, expect, it, vi } from "vitest";

import worker from "./index.ts";

const mockSanityFetch = vi.fn().mockResolvedValue([]);

vi.mock("@sanity/client", () => {
  return {
    createClient: vi.fn(() => {
      return {
        fetch: mockSanityFetch
      };
    })
  };
});

vi.mock("@portabletext/react", () => {
  return {
    toPlainText: vi.fn(constant("plain-text-desc"))
  };
});

vi.mock("ts-ics", () => {
  return {
    generateIcsCalendar: vi.fn(constant("mock-ics"))
  };
});

describe("sanity-calendar-sync worker", () => {
  it("should fetch events, sanitize inputs, and return calendar response", async () => {
    const mockEvents = [
      {
        _id: "id-1",
        description: [
          {
            _type: "block",
            children: [{ _type: "span", text: "Hello\r\nWorld" }]
          }
        ],
        endsAt: "2026-06-14T13:00:00Z",
        startsAt: "2026-06-14T12:00:00Z",
        title: "Event\\ \r\nTitle"
      }
    ];

    mockSanityFetch.mockResolvedValueOnce(mockEvents);

    const response = await worker.fetch();
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("text/calendar");

    const body = await response.text();
    expect(body).toBe("mock-ics");

    expect(generateIcsCalendar).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [
          {
            description: "plain-text-desc",
            end: expect.any(Object) as unknown,
            stamp: expect.any(Object) as unknown,
            start: expect.any(Object) as unknown,
            summary: "Event  Title",
            uid: "id-1"
          }
        ]
      })
    );
  });

  it("should handle event without end date and missing description", async () => {
    const mockEvents = [
      {
        _id: "id-2",
        description: undefined,
        endsAt: "invalid-date",
        startsAt: "2026-06-14T12:00:00Z",
        title: "Event 2"
      }
    ];

    mockSanityFetch.mockResolvedValueOnce(mockEvents);

    const response = await worker.fetch();
    expect(response).toBeInstanceOf(Response);

    expect(generateIcsCalendar).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [
          {
            description: "",
            stamp: expect.any(Object) as unknown,
            start: expect.any(Object) as unknown,
            summary: "Event 2",
            uid: "id-2"
          }
        ]
      })
    );
  });
});
