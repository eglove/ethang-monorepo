import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { TechSchema } from "./tech-schema.ts";

describe("tech-schema.ts validation", () => {
  it("should validate a valid tech object", () => {
    const payload = {
      id: "tech-1",
      name: "TypeScript"
    };
    const result = Schema.decodeUnknownSync(TechSchema)(payload);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual(payload);
  });

  it("should throw for missing required fields", () => {
    const payload = {
      id: "tech-1"
    };

    expect(() => {
      return Schema.decodeUnknownSync(TechSchema)(payload);
    }).toThrow();
  });
});