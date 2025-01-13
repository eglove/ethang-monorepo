import { describe, expect, it } from "vitest";

import { calendarMatching } from "./calendar-matching.js";

describe("calendarMatching", () => {
  it("should work", () => {
    expect(calendarMatching(
      [
        ["9:00", "10:30"],
        ["12:00", "13:00"],
        ["16:00", "18:00"],
      ],
      ["9:00", "20:00"],
      [
        ["10:00", "11:30"],
        ["12:30", "14:30"],
        ["14:30", "15:00"],
        ["16:00", "17:00"],
      ],
      ["10:00", "18:30"],
      30,
    )).toStrictEqual([["11:30", "12:00"], ["15:00", "16:00"], ["18:00", "18:30"]]);
  });
});
