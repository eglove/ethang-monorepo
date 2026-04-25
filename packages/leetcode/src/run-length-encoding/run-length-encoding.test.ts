import { describe, expect, it } from "vitest";

import { runLengthEncoding } from "./run-length-encoding.js";

describe("runLengthEncoding", () => {
  it("should work", () => {
    // cspell:disable-next-line
    expect(runLengthEncoding("AAAAAAAAAAAAABBCCCCDD")).toBe("9A4A2B4C2D");
  });
});
