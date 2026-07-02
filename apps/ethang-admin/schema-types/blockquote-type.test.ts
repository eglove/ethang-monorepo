import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import { blockquoteType } from "./blockquote-type.ts";

describe("blockquoteType schema", () => {
  it("defines an object schema named blockquote", () => {
    expect(blockquoteType.name).toBe("blockquote");
    expect(blockquoteType.type).toBe("object");
    expect(blockquoteType.title).toBe("Blockquote");
  });

  it.each(["sourceUrl", "source", "author", "quote"])(
    "exposes the %s field with the expected type",
    (fieldName) => {
      const field = find(blockquoteType.fields, (candidate) => {
        return candidate.name === fieldName;
      });
      expect(field).toBeDefined();
    }
  );
});
