import { describe, expect, it } from "vitest";

import { waterfallStreams } from "./waterfall-streams.js";

const stream = [
  [0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0],
];

describe("waterfallStreams", () => {
  it("should work", () => {
    expect(waterfallStreams(stream, 3)).toStrictEqual([0, 0, 0, 25, 25, 0, 0]);
  });
});
