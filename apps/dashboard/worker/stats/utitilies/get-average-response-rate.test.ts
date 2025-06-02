import { describe, expect, it } from "vitest";

import { getAverageResponseRate } from "./get-average-response-rate.ts";

describe("getAverageResponseRate", () => {
  it("should return '0' when allUserApplications is empty", () => {
    const result = getAverageResponseRate([]);
    expect(result).toBe("0");
  });

  it("should return '0' when no applications have interviews", () => {
    // @ts-expect-error allow partial
    const result = getAverageResponseRate([{ interviewRounds: [] }]);

    expect(result).toBe("0");
  });

  it("should calculate and return the average response rate correctly", () => {
    const mockApplications = [
      { interviewRounds: [{ roundNumber: 1 }], rejected: null },
      { interviewRounds: [{ roundNumber: 2 }], rejected: new Date() },
      { interviewRounds: [], rejected: new Date() },
      { interviewRounds: [{ roundNumber: 1 }], rejected: null },
    ];

    // @ts-expect-error allow partial
    const result = getAverageResponseRate(mockApplications);
    expect(result).toBe("1");
  });

  it("should handle cases with a mix of rejected and interviewed applications", () => {
    const mockApplications = [
      { interviewRounds: [{ roundNumber: 1 }], rejected: null },
      { interviewRounds: [], rejected: new Date() },
      { interviewRounds: [{ roundNumber: 2 }], rejected: null },
      { interviewRounds: [], rejected: null },
    ];

    // @ts-expect-error allow partial
    const result = getAverageResponseRate(mockApplications);
    expect(result).toBe("0.75"); // (2 interviews + 1 rejection) / 4 applications
  });
});
