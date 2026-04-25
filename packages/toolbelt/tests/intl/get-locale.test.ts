import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { getLocale } from "../../src/intl/get-locale.ts";

const ACCEPT_LANGUAGE = "accept-language";

describe("getLocale", () => {
  it("should return the correct locale when sourceType is accept-language and language is not null", () => {
    const source = new Headers({ "accept-language": "en-US" });
    const locale = getLocale([ACCEPT_LANGUAGE], source);
    expect(locale).toEqual("en-US");
  });

  it("should return null if value is not on headers", () => {
    const source = new Headers();
    const locale = getLocale([ACCEPT_LANGUAGE], source);
    expect(locale).toEqual(null);
  });

  it("should return the correct locale when sourceType is cookie and cookie value is success", () => {
    const source = "locale=en-US; test=test";
    const locale = getLocale(["cookie"], source, "locale");
    expect(locale).toEqual("en-US");
  });

  it("should return null when sourceType is cookie and cookie value is not success", () => {
    const source = "test=test";
    const locale = getLocale(["cookie"], source, "locale");
    expect(locale).toBeNull();
  });

  it("should return null when sourceType is localStorage and localStorage is null", () => {
    const locale = getLocale(["localStorage"], "locale");
    expect(locale).toBeNull();
  });

  it("should get value from localStorage", () => {
    // @ts-expect-error set for test
    globalThis.localStorage = {
      getItem: constant("value"),
    };

    const locale = getLocale(["localStorage"], undefined, "key");

    expect(locale).toBe("value");
  });

  it("should return null if pulling from localStorage and no name provided", () => {
    // @ts-expect-error set for test
    globalThis.localStorage = {
      getItem: constant("value"),
    };

    const locale = getLocale(["localStorage"]);

    expect(locale).toBe(null);
  });

  it("should return null when localStorage key does not exist", () => {
    // @ts-expect-error set for test
    globalThis.localStorage = {
      getItem: constant(null),
    };

    const locale = getLocale(["localStorage"], undefined, "missing-key");

    expect(locale).toBeNull();
  });

  it("should return null when language is nil", () => {
    const source = new Headers({ ACCEPT_LANGUAGE: "" });
    const locale = getLocale([ACCEPT_LANGUAGE], source);
    expect(locale).toBeNull();
  });
});
