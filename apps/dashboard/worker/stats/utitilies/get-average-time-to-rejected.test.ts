import { describe, expect, it } from "vitest";

import { getAverageTimeToRejected } from "./get-average-time-to-rejected.ts";

describe("getAverageTimeToRejected", () => {
  it("should return '0' when there are no applications in the last 30 days", () => {
    const result = getAverageTimeToRejected([]);
    expect(result).toBe("0");
  });

  it("should return '0' when all applications have a null rejected date", () => {
    const allUserApplications = [
      { applied: new Date(), rejected: null },
      { applied: new Date(), rejected: null },
    ];

    // @ts-expect-error allow partial
    const result = getAverageTimeToRejected(allUserApplications);
    expect(result).toBe("0");
  });

  it("should calculate the average time to rejection correctly", () => {
    const allUserApplications = [
      { applied: new Date("2024-01-01"), rejected: new Date("2024-01-05") },
      { applied: new Date("2024-01-10"), rejected: new Date("2024-01-12") },
    ];

    // @ts-expect-error allow partial
    const result = getAverageTimeToRejected(allUserApplications);
    expect(result).toBe("3");
  });

  it("should handle applications with different applied and rejected dates", () => {
    const allUserApplications = [
      { applied: new Date("2024-01-15"), rejected: new Date("2024-01-20") },
      { applied: new Date("2024-02-01"), rejected: new Date("2024-02-05") },
      { applied: new Date("2024-02-10"), rejected: null },
    ];

    // @ts-expect-error allow partial
    const result = getAverageTimeToRejected(allUserApplications);
    expect(result).toBe("4.5");
  });

  it("should return '0' when the average is NaN", () => {
    const allUserApplications = [
      { applied: new Date(), rejected: null },
      { applied: new Date(), rejected: null },
    ];

    // @ts-expect-error allow partial
    const result = getAverageTimeToRejected(allUserApplications);
    expect(result).toBe("0");
  });
});
