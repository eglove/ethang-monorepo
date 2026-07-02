import { Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { describe, expect, it } from "vitest";

import { Project } from "./project-schema.ts";

describe("project-schema.ts validation", () => {
  it("should validate a valid project object with all fields", () => {
    const payload = {
      code: "const x = 1;",
      description: "My cool project",
      id: "project-123",
      publicUrl: "https://example.com/project",
      techs: [
        { id: "tech-1", name: "React" },
        { id: "tech-2", name: "TypeScript" }
      ],
      title: "Antigravity Project"
    };
    const result = Schema.decodeUnknownSync(Project)(payload);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual(payload);
  });

  it("should validate a valid project object with optional fields as null or missing", () => {
    const payload = {
      code: "print('hello')",
      description: "Simple python project",
      id: "project-456",
      techs: [],
      title: "Python App"
    };
    const result = Schema.decodeUnknownSync(Project)(payload);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual(payload);
  });

  it("should throw for invalid types or missing required fields", () => {
    const payload = {
      description: "Invalid because missing title and code",
      id: "project-invalid",
      techs: "not-an-array"
    };

    expect(() => {
      return Schema.decodeUnknownSync(Project)(payload);
    }).toThrow(ParseError);
  });
});
