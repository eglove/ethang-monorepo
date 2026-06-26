import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import { TokenSignError } from "../../errors/token-sign-error.ts";
import { TokenVerifyError } from "../../errors/token-verify-error.ts";
import { createTokenService } from "./token-service.ts";

const TEST_SECRET = "test-secret-key-at-least-32-chars!";
const TEST_TOKEN = "test.jwt.token";
const TEST_PAYLOAD = { email: "test@test.com", sub: "user-1" };

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
  const tokenService = createTokenService(TEST_SECRET);

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
