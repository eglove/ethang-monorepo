import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import { blogCategoryType } from "./blog-category-type.ts";

describe("blogCategoryType schema", () => {
  it("defines an object schema named blogCategory", () => {
    expect(blogCategoryType.name).toBe("blogCategory");
    expect(blogCategoryType.type).toBe("object");
    expect(blogCategoryType.title).toBe("Blog Category");
  });

  it("requires the title field", () => {
    const titleField = find(blogCategoryType.fields, { name: "title" });
    expect(titleField).toBeDefined();

    const mockRule = { required: vi.fn().mockReturnThis() };

    (
      titleField as unknown as { validation: (r: unknown) => unknown }
    ).validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });
});
