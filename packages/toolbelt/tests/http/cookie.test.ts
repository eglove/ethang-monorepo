import constant from "lodash/constant.js";
import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { getCookieValue, setCookieValue } from "../../src/http/cookie.ts";

describe("get cookie", () => {
  it("should get cookie from string", () => {
    // @ts-expect-error allow for test
    globalThis.document = { cookie: "token=123; Secure;" };

    const value = getCookieValue("token", globalThis.document.cookie);

    expect(isError(value)).toBe(false);
    expect(value).toBe("123");
  });

  it("should get cookies from headers", () => {
    const headers = new Headers();
    headers.append("Cookie", "token=123; Secure; HttpOnly;");

    const value = getCookieValue("token", headers);

    expect(isError(value)).toBe(false);
    expect(value).toBe("123");
  });

  it("should set cookie", () => {
    const cookieName = "test-cookie";
    const cookieValue = "test-val";
    const mockResponse = new Response();

    setCookieValue({
      cookieName,
      cookieValue,
      response: mockResponse,
    });

    expect(mockResponse.headers.get("Set-Cookie")).toBe(
      `${cookieName}=${cookieValue}`,
    );
  });

  it("should set cookie with options", () => {
    const cookieName = "test-cookie";
    const cookieValue = "test-val";
    const expires = new Date();
    const config = {
      Expires: expires,
      HttpOnly: true,
      Path: "/some-path",
    };
    const mockResponse = new Response();

    setCookieValue({
      config,
      cookieName,
      cookieValue,
      response: mockResponse,
    });

    expect(mockResponse.headers.get("Set-Cookie")).toBe(
      `${cookieName}=${cookieValue}; Expires=${expires.toUTCString()}; HttpOnly; Path=${config.Path}`,
    );
  });

  it("should return error if cookie source is not found", () => {
    globalThis.document = {
      // @ts-expect-error allow for test
      cookie: {
        get: constant(null),
      },
    };
    const value = getCookieValue("nonexistent", globalThis.document.cookie);

    expect(isError(value)).toBe(true);
    expect(value).toBeInstanceOf(Error);
    if (isError(value)) {
      expect(value.message).toBe("cookies not found");
    }
  });

  it("should return error if the cookie is not found", () => {
    const value = getCookieValue("nope", "");

    expect(isError(value)).toBe(true);
    expect(value).toBeInstanceOf(Error);
    if (isError(value)) {
      expect(value.message).toBe("failed to get cookie");
    }
  });

  // eslint-disable-next-line no-sparse-arrays
  it.each([null, undefined, {}, [], , Number.NaN])(
    "shouldn't crash with bad inputs",
    (value) => {
      // @ts-expect-error allow for test
      const result1 = getCookieValue(value, "cookie=mmm");
      // @ts-expect-error allow for test
      const result2 = getCookieValue("cookieName", value);

      expect(isError(result1)).toBe(true);
      expect(isError(result2)).toBe(true);
    },
  );

  it("should return an empty string for a cookie with an empty value", () => {
    const value = getCookieValue("emptyCookie", "emptyCookie=; other=value");
    expect(isError(value)).toBe(false);
    expect(value).toBe("");
  });

  it("should return an empty string for a cookie name with no equals sign", () => {
    const value = getCookieValue("noValue", "noValue; other=value");
    expect(isError(value)).toBe(false);
    expect(value).toBe("");
  });
});
