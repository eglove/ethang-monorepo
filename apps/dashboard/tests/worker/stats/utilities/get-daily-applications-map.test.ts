import { describe, expect, it } from "vitest";

import { getDailyApplicationsMap } from "../../../../worker/stats/utitilies/get-daily-applications-map.ts";

describe("getDailyApplicationsMap", () => {
  it("should return an empty array when given an empty applications array", () => {
    const result = getDailyApplicationsMap([]);
    expect(result).toEqual([]);
  });

  it("should correctly map daily applications for a single user with multiple applications on different dates", () => {
    const mockApplications = [
      // eslint-disable-next-line sonar/no-duplicate-string
      { applied: new Date("2024-01-01T12:00:00.000Z") },
      { applied: new Date("2024-01-01T18:00:00.000Z") },
      { applied: new Date("2024-01-02T09:00:00.000Z") },
    ];

    // @ts-expect-error allow partial
    const result = getDailyApplicationsMap(mockApplications);
    expect(result).toEqual([
      // eslint-disable-next-line sonar/no-duplicate-string
      { date: "2024-01-01", totalApplications: 2 },
      { date: "2024-01-02", totalApplications: 1 },
    ]);
  });

  it("should handle applications on the same date correctly", () => {
    const mockApplications = [
      { applied: new Date("2024-01-01T12:00:00.000Z") },
      { applied: new Date("2024-01-01T18:00:00.000Z") },
      { applied: new Date("2024-01-01T23:59:59.999Z") },
    ];

    // @ts-expect-error allow partial
    const result = getDailyApplicationsMap(mockApplications);
    expect(result).toEqual([{ date: "2024-01-01", totalApplications: 3 }]);
  });

  it("should handle a mix of dates correctly", () => {
    const mockApplications = [
      { applied: new Date("2024-01-01T12:00:00.000Z") },
      { applied: new Date("2024-01-03T18:00:00.000Z") },
      { applied: new Date("2024-01-01T09:00:00.000Z") },
      { applied: new Date("2024-01-02T09:00:00.000Z") },
      { applied: new Date("2024-01-03T15:00:00.000Z") },
    ];

    // @ts-expect-error allow partial
    const result = getDailyApplicationsMap(mockApplications);
    expect(result).toEqual([
      { date: "2024-01-01", totalApplications: 2 },
      { date: "2024-01-03", totalApplications: 2 },
      { date: "2024-01-02", totalApplications: 1 },
    ]);
  });

  it("should handle dates with different timezones correctly", () => {
    const mockApplications = [
      { applied: new Date("2024-01-01T12:00:00.000+05:30") },
      { applied: new Date("2024-01-01T18:00:00.000-08:00") },
    ];

    // @ts-expect-error allow partial
    const result = getDailyApplicationsMap(mockApplications);
    expect(result).toEqual([{ date: "2024-01-01", totalApplications: 2 }]);
  });
});
