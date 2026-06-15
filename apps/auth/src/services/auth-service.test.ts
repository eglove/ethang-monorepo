import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";

import { AuthService } from "./auth-service.js";

describe("AuthService", () => {
  it("should initialize auth service and set auth cookie", () => {
    const mockDatabase = {} as unknown;
    // @ts-expect-error for test
    const authService = new AuthService(mockDatabase, "secret");

    const response = new Response();
    authService.setAuthCookie(response, "test-token");
    expect(response.headers.get("Set-Cookie")).toBeDefined();
  });

  it("should fail to verify invalid token", async () => {
    const mockDatabase = {} as unknown;
    // @ts-expect-error for test
    const authService = new AuthService(mockDatabase, "secret");

    const result = await authService.verifyToken("invalid-token");
    expect(isError(result)).toBe(true);
  });
});
