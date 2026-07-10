import { Effect } from "effect";
import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import { blogType } from "./blog-type.ts";

const getField = (name: string) => {
  const field = find(blogType.fields, { name });
  if (!field) {
    return Effect.runSync(Effect.die(new Error(`field ${name} not found`)));
  }
  return field;
};

const callValidation = (fieldName: string, rule: unknown) => {
  const field = getField(fieldName);
  return (field.validation as (r: unknown) => unknown)(rule);
};

describe("blogType schema", () => {
  it("defines a document schema named blog", () => {
    expect(blogType.name).toBe("blog");
    expect(blogType.type).toBe("document");
    expect(blogType.title).toBe("Blog");
  });

  it.each(["title", "slug", "author"])("requires the %s field", (fieldName) => {
    const mockRule = { required: vi.fn().mockReturnThis() };

    const result = callValidation(fieldName, mockRule);

    expect(result).toBe(mockRule);
    expect(mockRule.required).toHaveBeenCalled();
  });

  it("requires the alt text on the featured image", () => {
    const featuredImage = getField("featuredImage");
    const [altField] = (
      featuredImage as {
        fields: { name: string; validation?: (r: unknown) => unknown }[];
      }
    ).fields;

    expect(altField).toBeDefined();
    if (!altField) {
      return;
    }
    expect(altField.name).toBe("alt");

    const mockRule = { required: vi.fn().mockReturnThis() };
    if (altField.validation) {
      altField.validation(mockRule);
    }

    expect(mockRule.required).toHaveBeenCalled();
  });

  it("defaults the publishedAt field to the current ISO timestamp", () => {
    const publishedAt = getField("publishedAt") as {
      initialValue: string;
      name: string;
      type: string;
    };
    expect(publishedAt.name).toBe("publishedAt");
    expect(publishedAt.type).toBe("datetime");
    expect(publishedAt.initialValue).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u
    );
  });

  it("references the blogCategory type for the category field", () => {
    const category = getField("blogCategory") as {
      name: string;
      to: { type: string };
      type: string;
    };
    expect(category.name).toBe("blogCategory");
    expect(category.type).toBe("reference");
    expect(category.to.type).toBe("blogCategory");
  });

  it("uses blockContent as the body field type", () => {
    const body = getField("body") as { name: string; type: string };
    expect(body.name).toBe("body");
    expect(body.type).toBe("blockContent");
  });
});
