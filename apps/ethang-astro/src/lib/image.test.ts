import { describe, expect, it } from "vitest";

import { resolveImageDimensions } from "./image.ts";

describe("resolveImageDimensions", () => {
  it.each([
    {
      dimensions: {},
      expected: { height: 675, width: 1200 },
      name: "empty dimensions falls back to max width and 16:9"
    },
    {
      dimensions: { width: 800 },
      expected: { height: 450, width: 800 },
      name: "width alone keeps the intrinsic aspect ratio"
    },
    {
      dimensions: { width: 2000 },
      expected: { height: 675, width: 1200 },
      name: "width larger than the max is capped"
    },
    {
      dimensions: { height: 600, width: 800 },
      expected: { height: 600, width: 800 },
      name: "explicit width and height are preserved"
    },
    {
      dimensions: { aspectRatio: 2 },
      expected: { height: 600, width: 1200 },
      name: "aspect ratio alone sizes the max width"
    },
    {
      dimensions: { aspectRatio: 2, width: 800 },
      expected: { height: 400, width: 800 },
      name: "aspect ratio derives the height from the capped width"
    },
    {
      dimensions: { aspectRatio: 2, height: 600 },
      expected: { height: 600, width: 1200 },
      name: "explicit height wins over the aspect ratio"
    },
    {
      dimensions: { width: 0 },
      expected: { height: 0, width: 0 },
      name: "zero width edge"
    }
  ])("$name", ({ dimensions, expected }) => {
    expect(resolveImageDimensions(dimensions)).toEqual(expected);
  });

  it("defaults when dimensions are missing entirely", () => {
    expect(resolveImageDimensions()).toEqual({ height: 675, width: 1200 });
  });

  it("respects a custom max width", () => {
    expect(resolveImageDimensions({ width: 600 }, 800)).toEqual({
      height: 338,
      width: 600
    });
  });
});
