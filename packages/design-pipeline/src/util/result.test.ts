import keys from "lodash/keys.js";
import values from "lodash/values.js";
import { describe, expect, it } from "vitest";

import {
  ErrorKind,
  fromAttempt,
  fromAttemptAsync,
  isOk,
  isResultError,
  ok,
  type Result,
  resultError,
} from "./result.ts";

describe("Result type", () => {
  describe("ok", () => {
    it("returns ok result with value", () => {
      const result = ok(42);
      expect(result).toStrictEqual({ ok: true, value: 42 });
    });

    it("isOk returns true for ok result", () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
    });

    it("isResultError returns false for ok result", () => {
      const result = ok(42);
      expect(isResultError(result)).toBe(false);
    });
  });

  describe("resultError", () => {
    it("returns error result with error kind and message", () => {
      const result = resultError(ErrorKind.LlmError, "timeout");
      expect(result).toStrictEqual({
        error: ErrorKind.LlmError,
        message: "timeout",
        ok: false,
      });
    });

    it("isResultError returns true for error result", () => {
      const result = resultError(ErrorKind.LlmError, "timeout");
      expect(isResultError(result)).toBe(true);
    });

    it("isOk returns false for error result", () => {
      const result = resultError(ErrorKind.LlmError, "timeout");
      expect(isOk(result)).toBe(false);
    });
  });

  describe("fromAttempt", () => {
    it("converts Error to error result", () => {
      const result = fromAttempt(new Error("fail"));
      expect(result.ok).toBe(false);
      if (isResultError(result)) {
        expect(result.error).toBe(ErrorKind.InfrastructureError);
        expect(result.message).toBe("fail");
      }
    });

    it("converts success value to ok result", () => {
      const result = fromAttempt("success");
      expect(result.ok).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe("success");
      }
    });

    it("converts number value to ok result", () => {
      const result = fromAttempt(42);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe("fromAttemptAsync", () => {
    it("converts resolved promise to ok result", async () => {
      const result = await fromAttemptAsync(Promise.resolve("hello"));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe("hello");
      }
    });

    it("converts rejected promise to err result", async () => {
      const result = await fromAttemptAsync(
        Promise.reject(new Error("async fail")),
      );
      expect(isResultError(result)).toBe(true);
      if (isResultError(result)) {
        expect(result.error).toBe(ErrorKind.InfrastructureError);
        expect(result.message).toBe("async fail");
      }
    });

    it("handles non-Error rejection", async () => {
      const result = await fromAttemptAsync(
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        Promise.reject("string error"),
      );
      expect(isResultError(result)).toBe(true);
      if (isResultError(result)) {
        expect(result.error).toBe(ErrorKind.InfrastructureError);
      }
    });
  });

  describe("ErrorKind enum", () => {
    it("contains all expected members", () => {
      const expectedMembers = [
        "LlmError",
        "TimeoutError",
        "GitError",
        "FileSystemError",
        "AbortError",
        "RetryExhausted",
        "NotImplemented",
        "ValidationError",
        "InfrastructureError",
      ];

      for (const member of expectedMembers) {
        expect(values(ErrorKind)).toContain(member);
      }
    });

    it("has exactly 9 members", () => {
      expect(keys(ErrorKind)).toHaveLength(9);
    });
  });

  describe("type narrowing", () => {
    it("narrows ok result to access value", () => {
      const result: Result<number> = ok(42);
      if (isOk(result)) {
        const value: number = result.value;
        expect(value).toBe(42);
      }
    });

    it("narrows error result to access error and message", () => {
      const result: Result<number> = resultError(ErrorKind.LlmError, "fail");
      if (isResultError(result)) {
        const { error, message } = result;
        expect(error).toBe(ErrorKind.LlmError);
        expect(message).toBe("fail");
      }
    });
  });
});
