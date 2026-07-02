import find from "lodash/find.js";
import map from "lodash/map.js";
import { describe, expect, it, vi } from "vitest";

import { validateUrlUniqueness } from "../util/validate-url-uniqueness.ts";
import { learningPathType } from "./learning-path-type.ts";

const getField = (name: string) => {
  const field = find(learningPathType.fields, (candidate) => {
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

describe("learningPathType schema", () => {
  it("requires the name field", () => {
    const mockRule = { required: vi.fn().mockReturnThis() };

    const result = callValidation("name", mockRule);

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
      false,
      "learningPath"
    );

    expect(mockRule.custom).toHaveBeenCalled();
  });

  it("requires the swebokFocus field", () => {
    const mockRule = { required: vi.fn().mockReturnThis() };

    const result = callValidation("swebokFocus", mockRule);

    expect(result).toBe(mockRule);
    expect(mockRule.required).toHaveBeenCalled();
  });

  it("exposes the SWEBOK focus options", () => {
    const field = getField("swebokFocus") as { options: { list: unknown[] } };
    const titles = map(field.options.list, (entry) => {
      return (entry as { title: string }).title;
    });

    expect(titles).toContain("Software Construction");
    expect(titles).toContain("Software Testing");
    expect(titles).toContain("Software Design");
    expect(titles).toContain("Computing Foundations");
    expect(titles).toContain("Mathematical Foundations");
    expect(titles).toContain("Engineering Foundations");
    expect(titles).toContain("Software Requirements");
    expect(titles).toContain("Software Architecture");
    expect(titles).toContain("Software Configuration Management");
    expect(titles).toContain("Software Engineering Operations");
    expect(titles).toContain("Software Maintenance");
    expect(titles).toContain("Software Quality");
    expect(titles).toContain("Software Security");
    expect(titles).toContain("Software Engineering Models and Methods");
    expect(titles).toContain("Software Engineering Process");
    expect(titles).toContain("Software Engineering Management");
    expect(titles).toContain("Software Engineering Economics");
    expect(titles).toContain("Software Engineering Professional Practice");
    expect(titles).toContain("Certification");
  });
});
