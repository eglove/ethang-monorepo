import { describe, expect, it } from "vitest";

import { decodeSessionCookie } from "./session.ts";

describe("decodeSessionCookie", () => {
  it("decodes a valid session cookie", () => {
    const user = decodeSessionCookie(
      JSON.stringify({
        email: "ada@example.com",
        sessionToken: "token-123",
        username: "ada"
      })
    );

    expect(user).toEqual({
      email: "ada@example.com",
      sessionToken: "token-123",
      username: "ada"
    });
  });

  it.each([
    { name: "empty string", value: "" },
    { name: "malformed JSON", value: "not-json" },
    { name: "a JSON array", value: "[]" },
    { name: "a JSON number", value: "42" }
  ])("returns null for $name", ({ value }) => {
    expect(decodeSessionCookie(value)).toBeNull();
  });

  it.each([
    {
      name: "missing sessionToken",
      value: JSON.stringify({ email: "a@b.c", username: "ada" })
    },
    {
      name: "missing email",
      value: JSON.stringify({ sessionToken: "t", username: "ada" })
    },
    {
      name: "missing username",
      value: JSON.stringify({ email: "a@b.c", sessionToken: "t" })
    },
    {
      name: "a non-string sessionToken",
      value: JSON.stringify({
        email: "a@b.c",
        sessionToken: 7,
        username: "ada"
      })
    }
  ])("returns null when $name", ({ value }) => {
    expect(decodeSessionCookie(value)).toBeNull();
  });

  it("returns null for null or undefined values", () => {
    expect(decodeSessionCookie(null)).toBeNull();
    expect(decodeSessionCookie(undefined)).toBeNull();
  });
});
