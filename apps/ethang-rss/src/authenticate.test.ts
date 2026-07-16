import { urls } from "@ethang/intl/en/urls.ts";
import { DateTime, Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { authenticate, UnauthorizedError } from "./authenticate.ts";

const UNAUTHORIZED = "Unauthorized";
const { EXAMPLE_URL } = urls;

describe("authenticate", () => {
  it("should fail if X-Token is missing", async () => {
    const request = new Request(EXAMPLE_URL);
    const exit = await Effect.runPromiseExit(authenticate(request));
    expect(exit._tag).toBe("Failure");
    if ("Failure" === exit._tag) {
      expect(exit.cause._tag).toBe("Fail");
      if ("Fail" === exit.cause._tag) {
        expect(exit.cause.error).toBeInstanceOf(UnauthorizedError);
        expect(exit.cause.error.message).toBe(UNAUTHORIZED);
      }
    }
  });

  it("should fail if auth response is not ok", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "invalid" }
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const exit = await Effect.runPromiseExit(authenticate(request));
    expect(exit._tag).toBe("Failure");
    if ("Failure" === exit._tag) {
      expect(exit.cause._tag).toBe("Fail");
      if ("Fail" === exit.cause._tag) {
        expect(exit.cause.error).toBeInstanceOf(UnauthorizedError);
        expect(exit.cause.error.message).toBe(UNAUTHORIZED);
      }
    }
  });

  it("should fail if token is expired", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "expired" }
    });

    const expiredUser = {
      email: "test@test.com",
      exp:
        Math.floor(DateTime.toEpochMillis(DateTime.unsafeNow()) / 1000) - 3600,
      iat:
        Math.floor(DateTime.toEpochMillis(DateTime.unsafeNow()) / 1000) - 7200,
      sub: "123",
      username: "testuser"
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(expiredUser),
        ok: true
      })
    );

    const exit = await Effect.runPromiseExit(authenticate(request));
    expect(exit._tag).toBe("Failure");
    if ("Failure" === exit._tag) {
      expect(exit.cause._tag).toBe("Fail");
      if ("Fail" === exit.cause._tag) {
        expect(exit.cause.error).toBeInstanceOf(UnauthorizedError);
        expect(exit.cause.error.message).toBe(UNAUTHORIZED);
      }
    }
  });

  it("should fail if fetch throws", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "valid" }
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));

    const exit = await Effect.runPromiseExit(authenticate(request));
    expect(exit._tag).toBe("Failure");
    if ("Failure" === exit._tag) {
      expect(exit.cause._tag).toBe("Fail");
      if ("Fail" === exit.cause._tag) {
        expect(exit.cause.error).toBeInstanceOf(UnauthorizedError);
        expect(exit.cause.error.message).toBe(UNAUTHORIZED);
      }
    }
  });

  it("should fail if response.json throws", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "valid" }
    });
    const jsonError = new Error("Invalid JSON");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockRejectedValue(jsonError),
        ok: true
      })
    );

    const exit = await Effect.runPromiseExit(authenticate(request));
    expect(exit._tag).toBe("Failure");
    if ("Failure" === exit._tag) {
      expect(exit.cause._tag).toBe("Fail");
      if ("Fail" === exit.cause._tag) {
        expect(exit.cause.error).toBeInstanceOf(UnauthorizedError);
        expect(exit.cause.error.message).toBe(UNAUTHORIZED);
      }
    }
  });

  it("should return user if token is valid", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "valid" }
    });

    const validUser = {
      email: "test@test.com",
      exp:
        Math.floor(DateTime.toEpochMillis(DateTime.unsafeNow()) / 1000) + 3600,
      iat:
        Math.floor(DateTime.toEpochMillis(DateTime.unsafeNow()) / 1000) - 3600,
      sub: "123",
      username: "testuser"
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(validUser),
        ok: true
      })
    );

    const result = await Effect.runPromise(authenticate(request));
    expect(result).toEqual(validUser);
  });
});
