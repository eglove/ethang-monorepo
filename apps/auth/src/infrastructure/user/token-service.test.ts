import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { TokenSignError } from "../../errors/token-sign-error.ts";
import { TokenVerifyError } from "../../errors/token-verify-error.ts";
import { createTokenService } from "./token-service.ts";

const { EMAIL, SECRET, TEST_TOKEN } = auth;

const TEST_PAYLOAD = { email: EMAIL, sub: "user-1" };

const { mockJwtVerify, mockSignJWT } = vi.hoisted(() => {
  return {
    mockJwtVerify: vi.fn(),
    mockSignJWT: vi.fn()
  };
});

vi.mock("jose", () => {
  return {
    jwtVerify: mockJwtVerify,
    SignJWT: class {
      public setExpirationTime = vi.fn().mockReturnThis();
      public setIssuedAt = vi.fn().mockReturnThis();
      public setProtectedHeader = vi.fn().mockReturnThis();
      public readonly sign = mockSignJWT;
    }
  };
});

describe("createTokenService", () => {
  const tokenService = createTokenService(SECRET);

  describe("sign", () => {
    it("signs a payload successfully", async () => {
      mockSignJWT.mockResolvedValue(TEST_TOKEN);

      const result = await Effect.runPromise(tokenService.sign(TEST_PAYLOAD));

      expect(result).toBe(TEST_TOKEN);
    });

    it("fails with TokenSignError when signing fails", async () => {
      mockSignJWT.mockRejectedValue(new Error("Signing failed"));

      const result = await Effect.runPromise(
        tokenService.sign(TEST_PAYLOAD).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(TokenSignError);
      expect(result.message).toContain("Signing failed");
    });
  });

  describe("verify", () => {
    it("verifies a token successfully", async () => {
      const verifyResult = { payload: TEST_PAYLOAD };
      mockJwtVerify.mockResolvedValue(verifyResult);

      const result = await Effect.runPromise(tokenService.verify(TEST_TOKEN));

      expect(result).toStrictEqual(verifyResult);
    });

    it("handles nil and non-string values in the payload", async () => {
      const mixedPayload = {
        email: EMAIL,
        nilValue: null,
        numValue: 123,
        sub: "user-1"
      };
      mockJwtVerify.mockResolvedValue({ payload: mixedPayload });

      const result = await Effect.runPromise(tokenService.verify(TEST_TOKEN));

      expect(result.payload["nilValue"]).toBe("");
      expect(result.payload["numValue"]).toBe("123");
      expect(result.payload["email"]).toBe("test@test.com");
      expect(result.payload["sub"]).toBe("user-1");
    });

    it("fails with TokenVerifyError when verification fails", async () => {
      mockJwtVerify.mockRejectedValue(new Error("Verification failed"));

      const result = await Effect.runPromise(
        tokenService.verify(TEST_TOKEN).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(TokenVerifyError);
      expect(result.message).toContain("Verification failed");
    });
  });
});
