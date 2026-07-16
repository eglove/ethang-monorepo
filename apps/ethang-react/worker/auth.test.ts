import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionToken } from "./auth.ts";

const TEST_ENV = {
  ADMIN_PASS: "admin-pass",
  ADMIN_USER: "admin@test.com",
  ethang_courses: {} as any,
  ethang_rss: {} as any
};

const BASE_URL = "https://worker.test/api/graphql" as const;
const CLIENT_TOKEN = "client-token" as const;
const ADMIN_TOKEN = "admin-session-token" as const;

const buildRequest = (headers: Record<string, string> = {}) => {
  return new Request(BASE_URL, { headers });
};

describe("worker/auth getSessionToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the client-provided X-Token without calling fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const token = await Effect.runPromise(
      getSessionToken(buildRequest({ "X-Token": CLIENT_TOKEN }), TEST_ENV)
    );
    expect(token).toBe(CLIENT_TOKEN);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats an empty X-Token header as missing and falls back to verify", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json({ sessionToken: ADMIN_TOKEN }, { status: 200 })
      );

    const token = await Effect.runPromise(
      getSessionToken(buildRequest({ "X-Token": "" }), TEST_ENV)
    );
    expect(token).toBe(ADMIN_TOKEN);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://auth.ethang.dev/verify",
      expect.any(Object)
    );
  });

  it("falls back to sign-in when verify returns a non-ok response", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        Response.json({ sessionToken: ADMIN_TOKEN }, { status: 200 })
      );

    const token = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV)
    );
    expect(token).toBe(ADMIN_TOKEN);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://auth.ethang.dev/sign-in",
      expect.any(Object)
    );
  });

  it("returns UnauthorizedError when verify fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("network boom")
    );

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });

  it("returns UnauthorizedError when verify fetch rejects with a non-Error value", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("not-an-error");

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });

  it("returns UnauthorizedError when the sign-in path throws", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(new Error("signin boom"));

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });

  it("returns UnauthorizedError when sign-in rejects with a non-Error value", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce("signin-string");

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });

  it("returns UnauthorizedError when the final sign-in response is non-ok", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });

  it("returns UnauthorizedError when decoded session has no string sessionToken", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json({}, { status: 200 }));

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });

  it("returns UnauthorizedError when decoding JSON throws", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 }));

    const result = await Effect.runPromise(
      getSessionToken(buildRequest(), TEST_ENV).pipe(Effect.flip)
    );
    expect(result.name).toBe("UnauthorizedError");
  });
});
