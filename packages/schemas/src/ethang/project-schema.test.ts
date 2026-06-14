import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { projectSchema } from "./project-schema.ts";

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
    const result = projectSchema.parse(payload);

    expect(result).toStrictEqual(payload);
  });

  it("should validate a valid project object with optional fields as null or missing", () => {
    const payload = {
      code: "print('hello')",
      description: "Simple python project",
      id: "project-456",
      techs: [],
      title: "Python App"
    };
    const result = projectSchema.parse(payload);

    expect(result).toStrictEqual(payload);
  });

  it("should throw for invalid types or missing required fields", () => {
    const payload = {
      description: "Invalid because missing title and code",
      id: "project-invalid",
      techs: "not-an-array"
    };

    expect(() => {
      return projectSchema.parse(payload);
    }).toThrow(ZodError);
  });
});
