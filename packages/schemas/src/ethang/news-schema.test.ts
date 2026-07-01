import { Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { describe, expect, it } from "vitest";

import { TEST_DATE } from "../test-constants.ts";
import { NewsSchema } from "./news-schema.ts";

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
    const result = Schema.decodeUnknownSync(NewsSchema)(payload);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual(payload);
  });

  it("should validate a valid news object with optional fields as null or missing", () => {
    const payload1 = {
      href: "https://example.com/news/1",
      id: "news-123",
      published: TEST_DATE,
      quote: null,
      title: "Monorepo Updates"
    };
    const result1 = Schema.decodeUnknownSync(NewsSchema)(payload1);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result1).toEqual(payload1);

    const payload2 = {
      href: "https://example.com/news/2",
      id: "news-456",
      published: TEST_DATE,
      title: "Another update"
    };
    const result2 = Schema.decodeUnknownSync(NewsSchema)(payload2);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result2).toEqual(payload2);
  });

  it("should throw for missing required fields", () => {
    const payload = {
      id: "news-123",
      title: "Missing fields"
    };

    expect(() => {
      return Schema.decodeUnknownSync(NewsSchema)(payload);
    }).toThrow(ParseError);
  });
});
