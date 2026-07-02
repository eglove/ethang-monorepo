import constant from "lodash/constant.js";
import isError from "lodash/isError.js";
import { DateTime } from "effect";
import { describe, expect, it } from "vitest";

import {
  deleteCookieValue,
  getCookieValue,
  setCookieValue
} from "../../src/http/cookie.ts";

const TEST_COOKIE = "test-cookie";
const SET_COOKIE = "Set-Cookie";

describe("get cookie", () => {
  it("should get cookie from string", () => {
    const value = getCookieValue("token", "token=123; Secure;");

    expect(isError(value)).toBe(false);
    expect(value).toBe("123");
  });

  it("should get cookie with equals sign in value", () => {
    const value = getCookieValue("token", "token=abc=123; Secure;");

    expect(isError(value)).toBe(false);
    expect(value).toBe("abc=123");
  });

  it("should get cookies from headers", () => {
    const headers = new Headers();
    headers.append("Cookie", "token=123; Secure; HttpOnly;");

    const value = getCookieValue("token", headers);

    expect(isError(value)).toBe(false);
    expect(value).toBe("123");
  });

  it("should set cookie", () => {
    const cookieName = TEST_COOKIE;
    const cookieValue = "test-val";
    const mockResponse = new Response();

    setCookieValue({
      cookieName,
      cookieValue,
      response: mockResponse
    });

    expect(mockResponse.headers.get(SET_COOKIE)).toBe(
      `${cookieName}=${cookieValue}`
    );
  });

  it("should set cookie with options", () => {
    const cookieName = TEST_COOKIE;
    const cookieValue = "test-val";
    const expires = DateTime.toDateUtc(DateTime.unsafeNow());
    const config = {
      Expires: expires,
      HttpOnly: true,
      Path: "/some-path"
    };
    const mockResponse = new Response();

    setCookieValue({
      config,
      cookieName,
      cookieValue,
      response: mockResponse
    });

    expect(mockResponse.headers.get(SET_COOKIE)).toBe(
      `${cookieName}=${cookieValue}; Expires=${expires.toUTCString()}; HttpOnly; Path=${config.Path}`
    );
  });

  it("should delete cookie", () => {
    const cookieName = TEST_COOKIE;
    const mockResponse = new Response();

    deleteCookieValue(cookieName, mockResponse);

    const expiresDate = DateTime.toDateUtc(DateTime.unsafeMake(0));
    expect(mockResponse.headers.get(SET_COOKIE)).toBe(
      `${cookieName}=; Expires=${expiresDate.toUTCString()}; Max-Age=0`
    );
  });

  it("should delete cookie with config", () => {
    const cookieName = TEST_COOKIE;
    const mockResponse = new Response();

    deleteCookieValue(cookieName, mockResponse, {
      Path: "/",
      SameSite: "Lax"
    });

    const expiresDate = DateTime.toDateUtc(DateTime.unsafeMake(0));
    expect(mockResponse.headers.get(SET_COOKIE)).toBe(
      `${cookieName}=; Path=/; SameSite=Lax; Expires=${expiresDate.toUTCString()}; Max-Age=0`
    );
  });

  it("should return error if cookie source is not found", () => {
    // @ts-expect-error allow for test
    const value = getCookieValue("nonexistent", {
      get: constant(null)
    });

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
  it.each([null, undefined, {}, [], , NaN])(
    "shouldn't crash with bad inputs",
    (value) => {
      // @ts-expect-error allow for test
      const result1 = getCookieValue(value, "cookie=mmm");
      // @ts-expect-error allow for test
      const result2 = getCookieValue("cookieName", value);

      expect(isError(result1)).toBe(true);
      expect(isError(result2)).toBe(true);
    }
  );

  it("should return an empty string for a cookie with an empty value", () => {
    const value = getCookieValue("emptyCookie", "emptyCookie=; other=value");
    expect(isError(value)).toBe(false);
    expect(value).toBe("");
  });

  it("should skip config keys with a false boolean value", () => {
    const cookieName = TEST_COOKIE;
    const cookieValue = "test-val";
    const mockResponse = new Response();

    setCookieValue({
      config: { Secure: false },
      cookieName,
      cookieValue,
      response: mockResponse
    });

    expect(mockResponse.headers.get(SET_COOKIE)).toBe(
      `${cookieName}=${cookieValue}`
    );
  });

  it("should return an empty string for a cookie name with no equals sign", () => {
    const value = getCookieValue("noValue", "noValue; other=value");
    expect(isError(value)).toBe(false);
    expect(value).toBe("");
  });
});
