import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { promiseAllSettled } from "../../src/fetch/promise.ts";

const promiseFunction = async (value: number) => {
  return new Promise<string>((resolve, reject) => {
    if (0 === value) {
      setTimeout(() => {
        reject(new Error("wrong number"));
      }, 3);
    } else {
      setTimeout(() => {
        resolve("good!");
      }, 3);
    }
  });
};

describe("promiseAllSettled", () => {
  it("should work with proper types", async () => {
    const results = await promiseAllSettled({
      fail: promiseFunction(0),
      success: promiseFunction(1),
    });

    expect(isError(results.success)).toBe(false);
    expect(isError(results.fail)).toBe(true);
    expect(results.fail).toBeInstanceOf(Error);

    expect(results.success).toBe("good!");

    if (isError(results.fail)) {
      expect(results.fail.message).toBe("wrong number");
    }
  });

  it("should be faster than sequential promises", async () => {
    const startSequential = performance.now();
    await promiseFunction(1);
    await promiseFunction(2);
    await promiseFunction(3);
    const sequential = performance.now() - startSequential;
    const startAll = performance.now();
    await promiseAllSettled({
      promise1: promiseFunction(1),
      promise2: promiseFunction(2),
      promise3: promiseFunction(3),
    });
    const all = performance.now() - startAll;

    expect(all).toBeLessThan(sequential);
  });
});
