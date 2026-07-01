import { urls } from "@ethang/intl/en/urls.ts";
import { describe, expect, it, vi } from "vitest";

import { authenticate } from "./authenticate.ts";

const UNAUTHORIZED = "Unauthorized";
const { EXAMPLE_URL } = urls;

describe("authenticate", () => {
  it("should throw if X-Token is missing", async () => {
    const request = new Request(EXAMPLE_URL);
    await expect(authenticate(request)).rejects.toThrow(UNAUTHORIZED);
  });

  it("should throw if auth response is not ok", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "invalid" }
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(authenticate(request)).rejects.toThrow(UNAUTHORIZED);
  });

  it("should throw if token is expired", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "expired" }
    });

    const expiredUser = {
      email: "test@test.com",
      exp: Math.floor(Date.now() / 1000) - 3600,
      iat: Math.floor(Date.now() / 1000) - 7200,
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

    await expect(authenticate(request)).rejects.toThrow(UNAUTHORIZED);
  });

  it("should return user if token is valid", async () => {
    const request = new Request(EXAMPLE_URL, {
      headers: { "X-Token": "valid" }
    });

    const validUser = {
      email: "test@test.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000) - 3600,
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

    const result = await authenticate(request);
    expect(result).toEqual(validUser);
  });
});
