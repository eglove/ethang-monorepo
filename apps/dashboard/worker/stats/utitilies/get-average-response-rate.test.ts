import { describe, expect, it } from "vitest";

import { getAverageResponseRate } from "./get-average-response-rate.ts";

describe("getAverageResponseRate", () => {
  it("should return '0' when allUserApplications is empty", () => {
    const result = getAverageResponseRate([]);
    expect(result).toBe("0");
  });

  it("should calculate and return the average response rate correctly", () => {
    const mockApplications = [
      { rejected: null },
      { rejected: new Date() },
      { rejected: new Date() },
      { rejected: null },
    ];

    // @ts-expect-error allow partial
    const result = getAverageResponseRate(mockApplications);
    expect(result).toBe("0.5");
  });
});
