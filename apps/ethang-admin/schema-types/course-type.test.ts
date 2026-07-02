import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import { validateUrlUniqueness } from "../util/validate-url-uniqueness.ts";
import { courseType } from "./course-type.ts";

const getField = (name: string) => {
  const field = find(courseType.fields, (candidate) => {
    return candidate.name === name;
  });
  if (!field) {
    throw new Error(`field ${name} not found`);
  }
  return field;
};

const callValidation = (fieldName: string, rule: unknown) => {
  const field = getField(fieldName);
  return (field.validation as (r: unknown) => unknown)(rule);
};

describe("courseType schema", () => {
  it("requires the name field", () => {
    const mockRule = { required: vi.fn().mockReturnThis() };

    const result = callValidation("name", mockRule);

    expect(result).toBe(mockRule);
    expect(mockRule.required).toHaveBeenCalled();
  });

  it("requires the author field", () => {
    const mockRule = { required: vi.fn().mockReturnThis() };

    const result = callValidation("author", mockRule);

    expect(result).toBe(mockRule);
    expect(mockRule.required).toHaveBeenCalled();
  });

  it("wires the url field validation to validateUrlUniqueness", () => {
    const mockRule = { custom: vi.fn() };

    const { validation } = getField("url") as unknown as {
      validation: typeof validateUrlUniqueness;
    };
    validation(
      mockRule as unknown as Parameters<typeof validateUrlUniqueness>[0],
      true,
      "course"
    );

    expect(mockRule.custom).toHaveBeenCalled();
  });
});
