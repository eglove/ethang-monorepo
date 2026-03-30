import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { attemptAsync } from "../../src/functional/attempt-async.js";

describe("attemptAsync", () => {
  it("should return result with successful response", async () => {
    const request = new Request("http://example.com", {
      body: JSON.stringify({ name: "John" }),
      method: "POST",
    });
    const body = await attemptAsync(async () => {
      return request.json();
    });

    expect(isError(body)).toBe(false);
    expect(body).toStrictEqual({ name: "John" });
  });

  it("returns a new Error when a non-Error value is thrown", async () => {
    const fn = async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "string error";
    };
    const body = await attemptAsync(fn);

    expect(body).toBeInstanceOf(Error);
    if (body instanceof Error) {
      expect(body.message).toBe("fn failed");
    }
  });

  it("should return error with unsuccessful response", async () => {
    const request = new Request("http://example.com", {
      body: "",
      method: "POST",
    });
    const body = await attemptAsync(async () => {
      return request.json();
    });

    expect(isError(body)).toBe(true);
    expect(body).toBeInstanceOf(SyntaxError);

    if (body instanceof SyntaxError) {
      expect(body.message).toBe("Unexpected end of JSON input");
    }
  });
});
