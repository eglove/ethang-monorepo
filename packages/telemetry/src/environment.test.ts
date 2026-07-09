import { describe, expect, it } from "vitest";

import type { CloudflareObservability } from "./environment.js";

const isCloudflareObservability = (
  value: unknown
): value is CloudflareObservability => {
  return true === value;
};

describe("CloudflareObservability", () => {
  it("should narrow the literal true", () => {
    expect.assertions(2);
    const value: unknown = true;
    const isTrue = isCloudflareObservability(value);
    expect(isTrue).toBe(true);
    // CloudflareObservability is the literal `true` type, so the
    // narrowed variable can only be assigned the literal `true`.
    const narrowed: CloudflareObservability = isTrue ? value : true;
    expect(typeof narrowed).toBe("boolean");
  });

  it("should reject non-true values", () => {
    expect.assertions(2);
    expect(isCloudflareObservability(false)).toBe(false);
    expect(isCloudflareObservability("not-a-bool")).toBe(false);
  });
});
