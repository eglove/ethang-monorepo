import { describe, expect, it } from "vitest";

import { getSessionToken } from "./auth.ts";

describe("getSessionToken", () => {
  it("returns the ethang-auth-token value when present in cookie header", () => {
    const cookies = "ethang-auth-token=abc123; other=val";
    expect(getSessionToken(cookies)).toBe("abc123");
  });

  it("returns null when no auth token is present", () => {
    expect(getSessionToken("other=val")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getSessionToken("")).toBeNull();
  });

  it("returns null when cookie header contains only the auth token with no value", () => {
    expect(getSessionToken("ethang-auth-token=")).toBeNull();
  });

  it("handles multiple cookies including the auth token in the middle", () => {
    const cookies = "session=xyz; ethang-auth-token=tok456; theme=dark";
    expect(getSessionToken(cookies)).toBe("tok456");
  });
});
