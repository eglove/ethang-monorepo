import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import { newsType } from "./news-type.ts";

const getField = (name: string) => {
  const field = find(newsType.fields, (candidate) => {
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

describe("newsType schema", () => {
  it("defines a document schema named news", () => {
    expect(newsType.name).toBe("news");
    expect(newsType.type).toBe("document");
    expect(newsType.title).toBe("News");
  });

  it.each(["title", "url", "published", "quote"])(
    "requires the %s field",
    (fieldName) => {
      const mockRule = { required: vi.fn().mockReturnThis() };

      const result = callValidation(fieldName, mockRule);

      expect(result).toBe(mockRule);
      expect(mockRule.required).toHaveBeenCalled();
    }
  );

  it("exposes the optional youtubeVideoId field without a validation rule", () => {
    const field = getField("youtubeVideoId");
    expect(field.validation).toBeUndefined();
  });
});
