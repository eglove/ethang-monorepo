import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { getAcceptLanguage } from "../../src/http/headers.ts";

describe("headers", () => {
  it.each([
    [
      "en-US,en;q=0.9",
      [
        {
          country: "US",
          language: "en",
          name: "en-US",
          quality: 1,
        },
        {
          country: undefined,
          language: "en",
          name: "en",
          quality: 0.9,
        },
      ],
    ],
    [
      "en-US,en;q=0.9,fr;q=0.8,de;q=0.7",
      [
        {
          country: "US",
          language: "en",
          name: "en-US",
          quality: 1,
        },
        {
          country: undefined,
          language: "en",
          name: "en",
          quality: 0.9,
        },
        {
          country: undefined,
          language: "fr",
          name: "fr",
          quality: 0.8,
        },
        {
          country: undefined,
          language: "de",
          name: "de",
          quality: 0.7,
        },
      ],
    ],
    [
      new Headers({ "accept-language": "en-US,en;q=0.9" }),
      [
        {
          country: "US",
          language: "en",
          name: "en-US",
          quality: 1,
        },
        {
          country: undefined,
          language: "en",
          name: "en",
          quality: 0.9,
        },
      ],
    ],
  ] as const)("should get accept language", (header, result) => {
    const value = getAcceptLanguage(header);

    expect(isError(value)).toBe(false);
    expect(value).not.toBeInstanceOf(Error);
    expect(value).toStrictEqual(result);
  });

  it("should return error if accept-language source is not found", () => {
    const headers = new Headers();
    const result = getAcceptLanguage(headers);

    expect(isError(result)).toBe(true);
    expect(result).toBeInstanceOf(Error);

    if (isError(result)) {
      expect(result.message).toBe("accept-language not found");
    }
  });
});
