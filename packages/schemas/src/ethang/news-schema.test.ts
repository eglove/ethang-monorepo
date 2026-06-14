import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { TEST_DATE } from "../test-constants.ts";
import { newsSchema } from "./news-schema.ts";

describe("news-schema.ts validation", () => {
  it("should validate a valid news object with all fields", () => {
    const payload = {
      href: "https://example.com/news/1",
      id: "news-123",
      published: TEST_DATE,
      quote: "Some interesting quote",
      title: "Monorepo Updates",
      youtubeVideoId: "dQw4w9WgXcQ"
    };
    const result = newsSchema.parse(payload);

    expect(result).toStrictEqual(payload);
  });

  it("should validate a valid news object with optional fields as null or missing", () => {
    const payload1 = {
      href: "https://example.com/news/1",
      id: "news-123",
      published: TEST_DATE,
      quote: null,
      title: "Monorepo Updates",
      youtubeVideoId: undefined
    };
    const result1 = newsSchema.parse(payload1);

    expect(result1).toStrictEqual(payload1);

    const payload2 = {
      href: "https://example.com/news/2",
      id: "news-456",
      published: TEST_DATE,
      title: "Another update"
    };
    const result2 = newsSchema.parse(payload2);

    expect(result2).toStrictEqual(payload2);
  });

  it("should throw for missing required fields", () => {
    const payload = {
      id: "news-123",
      title: "Missing fields"
    };

    expect(() => {
      return newsSchema.parse(payload);
    }).toThrow(ZodError);
  });
});
