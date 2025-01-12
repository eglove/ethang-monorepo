import { describe, expect, it } from "vitest";

import { countSquares } from "./count-squares.js";

describe(
  "countSquares", () => {
    it(
      "should work", () => {
        expect(countSquares([
          [1, 1],
          [0, 0],
          [-4, 2],
          [-2, -1],
          [0, 1],
          [1, 0],
          [-1, 4],
        ])).toBe(2);
      },
    );
  },
);
