import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { attemptAsync } from "../../src/functional/attempt-async.js";

describe("attemptAsync", () => {
  it("should return result with successful response", async () => {
    const request = new Request("https://example.com", {
      body: JSON.stringify({ name: "John" }),
      method: "POST"
    });
    const body = await Effect.runPromise(
      attemptAsync(() => request.json())
    );

    expect(body).toStrictEqual({ name: "John" });
  });

  it("fails with Error when a non-Error value is thrown", async () => {
    const fn = async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "string error";
    };
    const result = await Effect.runPromise(
      attemptAsync(fn).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("fn failed");
  });

  it("should fail with error on unsuccessful response", async () => {
    const request = new Request("https://example.com", {
      body: "",
      method: "POST"
    });
    const result = await Effect.runPromise(
      attemptAsync(() => request.json()).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(SyntaxError);
    expect(result.message).toBe("Unexpected end of JSON input");
  });
});
