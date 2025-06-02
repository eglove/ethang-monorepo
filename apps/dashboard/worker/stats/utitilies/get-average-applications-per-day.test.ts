import { describe, expect, it } from "vitest";

import { getAverageApplicationsPerDay } from "./get-average-applications-per-day";

describe("getAverageApplicationsPerDay", () => {
  it("should return '0' when there are no applications", () => {
    const result = getAverageApplicationsPerDay([]);
    expect(result).toBe("0");
  });

  it("should correctly calculate average for fewer than 30 applications on different days", () => {
    const allUserApplications = [
      // eslint-disable-next-line sonar/no-duplicate-string
      { applied: new Date("2024-01-01T10:00:00Z") },
      { applied: new Date("2024-01-02T11:00:00Z") },
      { applied: new Date("2024-01-03T12:00:00Z") },
    ];

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(allUserApplications);
    expect(result).toBe("1");
  });

  it("should correctly calculate average for fewer than 30 applications on the same day", () => {
    const allUserApplications = [
      { applied: new Date("2024-01-01T10:00:00Z") },
      { applied: new Date("2024-01-01T11:00:00Z") },
      { applied: new Date("2024-01-01T12:00:00Z") },
    ];

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(allUserApplications);
    expect(result).toBe("3");
  });

  it("should correctly calculate average for mixed applications (same and different days)", () => {
    const allUserApplications = [
      { applied: new Date("2024-01-01T10:00:00Z") },
      { applied: new Date("2024-01-01T11:00:00Z") },
      { applied: new Date("2024-01-02T12:00:00Z") },
      { applied: new Date("2024-01-03T09:00:00Z") },
      { applied: new Date("2024-01-03T10:00:00Z") },
    ];

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(allUserApplications);
    expect(result).toBe("1.66666666666666666667");
  });

  it("should take only the latest 30 applications based on 'applied' date", () => {
    const applications = [];
    for (let index = 0; 35 > index; index += 1) {
      applications.push({
        applied: new Date(2024, 0, 35 - index, 10, 0, 0),
      });
    }

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(applications);
    expect(result).toBe("1");
  });

  it("should handle exactly 30 applications correctly", () => {
    const applications = [];
    for (let index = 0; 30 > index; index += 1) {
      applications.push({
        applied: new Date(2024, 0, index + 1, 10, 0, 0),
      });
    }

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(applications);
    expect(result).toBe("1");
  });

  it("should handle applications with different times on the same day correctly when taking 30", () => {
    const applications = [];

    for (let index = 0; 30 > index; index += 1) {
      applications.push({
        applied: new Date("2024-01-01T10:00:00Z"),
      });
    }
    for (let index = 0; 5 > index; index += 1) {
      applications.push({
        applied: new Date("2024-01-02T10:00:00Z"),
      });
    }

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(applications);
    expect(result).toBe("17.5");
  });

  it("should correctly handle `take` by original array order before `orderBy`", () => {
    const fullApplications = [];
    for (let index = 0; 15 > index; index += 1) {
      fullApplications.push({ applied: new Date("2024-01-01T10:00:00Z") });
    }
    for (let index = 0; 15 > index; index += 1) {
      fullApplications.push({ applied: new Date("2024-01-02T10:00:00Z") });
    }
    for (let index = 0; 5 > index; index += 1) {
      fullApplications.push({ applied: new Date("2024-01-03T10:00:00Z") });
    }

    // @ts-expect-error allow partial
    const result = getAverageApplicationsPerDay(fullApplications);
    expect(result).toBe("11.6666666666666666667");
  });
});
