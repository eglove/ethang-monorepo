import { describe, expect, it } from "vitest";

import { getAverageTimeToInterview } from "./get-average-time-to-interview.ts";

describe("getAverageTimeToInterview", () => {
  it("should return '0' when there are no applications with active interviews", () => {
    const result = getAverageTimeToInterview([]);
    expect(result).toBe("0");
  });

  it("should calculate the average time to interview correctly when there are applications with active interviews", () => {
    // Mock data with some applications having active interviews and different applied/interview dates
    const mockApplications = [
      {
        applied: new Date("2024-01-01"),
        interviewRounds: [{ dateTime: new Date("2024-01-10") }],
      },
      {
        applied: new Date("2024-02-01"),
        interviewRounds: [{ dateTime: new Date("2024-02-15") }],
      },
    ];

    // @ts-expect-error allow partial
    const result = getAverageTimeToInterview(mockApplications);
    expect(result).toBe("11.5");
  });

  it("should handle cases where some applications have no interview rounds", () => {
    const mockApplications = [
      { applied: new Date("2024-01-01"), interviewRounds: [] },
      {
        applied: new Date("2024-02-01"),
        interviewRounds: [{ dateTime: new Date("2024-02-15") }],
      },
    ];

    // @ts-expect-error allow partials
    const result = getAverageTimeToInterview(mockApplications);
    expect(result).toBe("14");
  });
});
