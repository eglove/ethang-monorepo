import isError from "lodash/isError.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { autoAuthenticate } from "./auto-authenticate.ts";

const TEST_URL = "https://localhost/api/graphql";

const mockEnvironment = {
  ADMIN_PASS: "adminpass",
  ADMIN_USER: "admin@test.com",
  LOGGER_CLIENT_API_KEY: {
    // eslint-disable-next-line lodash/prefer-constant
    get: async () => {
      return "test-api-key";
    }
  }
};

describe("worker/auto-authenticate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Service Worker Auth Bypass", () => {
    it("should forward X-Token header directly if present in client request", async () => {
      const mockRequest = new Request(TEST_URL, {
        headers: {
          "X-Token": "client-provided-token"
        }
      });
      const url = new URL(mockRequest.url);

      const result = await autoAuthenticate(mockRequest, url, mockEnvironment);

      // Verify the result is not an Error
      expect(result).not.toBeInstanceOf(Error);

      const successResult = result as { destinationUrl: URL; headers: Headers };
      expect(successResult.destinationUrl.href).toBe(
        "https://graphql.ethang.dev/"
      );
      expect(successResult.headers.get("X-Token")).toBe(
        "client-provided-token"
      );
    });

    it("should fallback to admin authentication flow if X-Token is missing", async () => {
      const mockRequest = new Request(TEST_URL, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const url = new URL(mockRequest.url);

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(
          Response.json(
            { sessionToken: "admin-session-token" },
            { status: 200 }
          )
        );

      const result = await autoAuthenticate(mockRequest, url, mockEnvironment);

      expect(result).not.toBeInstanceOf(Error);

      const successResult = result as { destinationUrl: URL; headers: Headers };
      expect(successResult.destinationUrl.href).toBe(
        "https://graphql.ethang.dev/"
      );
      expect(successResult.headers.get("X-Token")).toBe("admin-session-token");
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://auth.ethang.dev/verify",
        expect.any(Object)
      );
    });

    it("should fallback to sign-in if verify fails", async () => {
      const mockRequest = new Request(TEST_URL, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const url = new URL(mockRequest.url);

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(
          Response.json(
            { sessionToken: "signin-session-token" },
            { status: 200 }
          )
        );

      const result = await autoAuthenticate(mockRequest, url, mockEnvironment);

      expect(result).not.toBeInstanceOf(Error);

      const successResult = result as { destinationUrl: URL; headers: Headers };
      expect(successResult.headers.get("X-Token")).toBe("signin-session-token");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("should return Error if both verify and sign-in fail", async () => {
      const mockRequest = new Request(TEST_URL, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const url = new URL(mockRequest.url);

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(new Response(null, { status: 401 }));

      const result = await autoAuthenticate(mockRequest, url, mockEnvironment);

      expect(result).toBeInstanceOf(Error);
      if (isError(result)) {
        expect(result.message).toBe("Unauthorized");
      }
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
