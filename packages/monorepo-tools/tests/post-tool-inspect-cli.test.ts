import { describe, expect, it } from "vitest";

import { buildTransformedResult } from "../src/cli/post-tool-inspect.cli.ts";

describe("buildTransformedResult", () => {
  it("returns originalResult when diagnostics is empty", () => {
    const original = "original tool output";
    const diagnostics = "";
    const result = buildTransformedResult(original, diagnostics);
    expect(result).toBe(original);
  });

  it("returns originalResult when diagnostics is falsy", () => {
    const original = "test output";
    const result = buildTransformedResult(original, "");
    expect(result).toBe(original);
  });

  it("appends diagnostics after double newline when diagnostics is non-empty", () => {
    const original = "original tool output";
    const diagnostics = "error on line 42";
    const result = buildTransformedResult(original, diagnostics);
    expect(result).toBe(`${original}\n\n${diagnostics}`);
  });

  it("handles multiline diagnostics", () => {
    const original = "file written";
    const diagnostics = "error 1\nerror 2\nerror 3";
    const result = buildTransformedResult(original, diagnostics);
    expect(result).toBe(`${original}\n\n${diagnostics}`);
  });

  it("handles empty originalResult with non-empty diagnostics", () => {
    const original = "";
    const diagnostics = "diagnostic info";
    const result = buildTransformedResult(original, diagnostics);
    expect(result).toBe(`\n\n${diagnostics}`);
  });
});
