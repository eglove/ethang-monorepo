import { Effect } from "effect";
import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import { projectType } from "./project-type.ts";

const getField = (name: string) => {
  const field = find(projectType.fields, { name });
  if (!field) {
    return Effect.runSync(Effect.die(new Error(`field ${name} not found`)));
  }
  return field;
};

const callValidation = (fieldName: string, rule: unknown) => {
  const field = getField(fieldName);
  return (field.validation as (r: unknown) => unknown)(rule);
};

describe("projectType schema", () => {
  it("defines a document schema named project", () => {
    expect(projectType.name).toBe("project");
    expect(projectType.type).toBe("document");
    expect(projectType.title).toBe("Project");
  });

  it.each(["title", "githubUrl", "description"])(
    "requires the %s field",
    (fieldName) => {
      const mockRule = { required: vi.fn().mockReturnThis() };

      const result = callValidation(fieldName, mockRule);

      expect(result).toBe(mockRule);
      expect(mockRule.required).toHaveBeenCalled();
    }
  );

  it("exposes the optional publicUrl field without a validation rule", () => {
    const field = getField("publicUrl");
    expect(field.validation).toBeUndefined();
  });

  it("exposes the techs array field with reference to tech type", () => {
    const field = getField("techs");
    expect(field.type).toBe("array");
  });
});
