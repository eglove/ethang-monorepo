import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

import { requireAuth } from "./require-auth.js";

vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

const PROTECTED_ROUTE = "/protected";
const LOCALHOST_URL = "http://localhost/protected";
const SUCCESS_TEXT = "Success";
const VALID_TOKEN_COOKIE = "ethang-auth-token=valid-token";

describe("requireAuth Middleware", () => {
  it("should return 401 if no token is provided", async () => {
    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      return c.text(SUCCESS_TEXT);
    });

    const response = await app.fetch(new Request(LOCALHOST_URL));

    expect(response.status).toBe(401);
  });

  it("should return 401 if verification fails", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false
    });

    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      return c.text(SUCCESS_TEXT);
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set("Cookie", "ethang-auth-token=invalid-token");

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });

  it("should proceed if verification succeeds", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      json: async () => {
        return { id: "123" };
      },
      ok: true
    });

    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      const user = c.get("user");
      return c.json({ user });
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set("Cookie", VALID_TOKEN_COOKIE);

    const response = await app.fetch(request);

    expect(response.status).toBe(200);

    const body = (await response.json()) as { user: { id: string } };

    expect(body.user).toStrictEqual({ id: "123" });
  });

  it("should return 401 if fetch throws", async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      return c.text(SUCCESS_TEXT);
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set("Cookie", VALID_TOKEN_COOKIE);

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });

  it("should return 401 if fetch throws non-Error value", async () => {
    (globalThis.fetch as any).mockRejectedValueOnce("string error");

    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      return c.text(SUCCESS_TEXT);
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set("Cookie", VALID_TOKEN_COOKIE);

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });

  it("should return 401 if json parsing throws", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      json: async () => {
        // eslint-disable-next-line @ethang/no-try-catch -- simulating fetch rejection for test
        throw new Error("Invalid JSON");
      },
      ok: true
    });

    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      return c.text(SUCCESS_TEXT);
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set("Cookie", VALID_TOKEN_COOKIE);

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });

  it("should return 401 if json parsing throws non-Error value", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      json: async () => {
        // eslint-disable-next-line @ethang/no-try-catch, @typescript-eslint/only-throw-error -- simulating non-Error throw for test
        throw "not an error";
      },
      ok: true
    });

    const app = new Hono<{ Variables: { user: unknown } }>();

    app.get(PROTECTED_ROUTE, requireAuth(), (c) => {
      return c.text(SUCCESS_TEXT);
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set("Cookie", VALID_TOKEN_COOKIE);

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });
});
