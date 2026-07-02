import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import { techType } from "./tech-type.ts";

describe("techType schema", () => {
  it("defines a document schema named tech", () => {
    expect(techType.name).toBe("tech");
    expect(techType.type).toBe("document");
    expect(techType.title).toBe("Tech");
  });

  it("requires the name field", () => {
    const nameField = find(techType.fields, (field) => {
      return "name" === field.name;
    });
    expect(nameField).toBeDefined();

    const mockRule = { required: vi.fn().mockReturnThis() };

    (
      nameField as unknown as { validation: (r: unknown) => unknown }
    ).validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });
});
