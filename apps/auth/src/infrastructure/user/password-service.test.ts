import { auth } from "@ethang/intl/en/auth.ts";
import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HashError } from "../../errors/hash-error.ts";
import { createPasswordService } from "./password-service.ts";

const TEST_PASSWORD = auth.PASSWORD;
const TEST_HASH = "hashed-value";

const { mockCompare, mockGenSalt, mockHash } = vi.hoisted(() => {
  return {
    mockCompare: vi.fn(),
    mockGenSalt: vi.fn(),
    mockHash: vi.fn()
  };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      compare: mockCompare,
      genSalt: mockGenSalt,
      hash: mockHash
    }
  };
});

describe("createPasswordService", () => {
  let passwordService: ReturnType<typeof createPasswordService>;

  beforeEach(() => {
    vi.clearAllMocks();
    passwordService = createPasswordService();
  });

  describe("hash", () => {
    it("hashes a password successfully", async () => {
      mockGenSalt.mockResolvedValue("salt");
      mockHash.mockResolvedValue(TEST_HASH);

      const result = await Effect.runPromise(
        passwordService.hash(TEST_PASSWORD)
      );

      expect(result).toBe(TEST_HASH);
      expect(mockGenSalt).toHaveBeenCalledOnce();
      expect(mockHash).toHaveBeenCalledWith(TEST_PASSWORD, "salt");
    });

    it("fails with HashError when genSalt fails", async () => {
      mockGenSalt.mockRejectedValue(new Error("Salt generation failed"));

      const result = await Effect.runPromise(
        passwordService.hash(TEST_PASSWORD).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(HashError);
      expect(result.message).toContain("Salt generation failed");
    });

    it("fails with HashError when hash fails", async () => {
      mockGenSalt.mockResolvedValue("salt");
      mockHash.mockRejectedValue(new Error("Hash operation failed"));

      const result = await Effect.runPromise(
        passwordService.hash(TEST_PASSWORD).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(HashError);
      expect(result.message).toContain("Hash operation failed");
    });
  });

  describe("compare", () => {
    it("returns true when password matches hash", async () => {
      mockCompare.mockResolvedValue(true);

      const isResult = await Effect.runPromise(
        passwordService.compare(TEST_PASSWORD, TEST_HASH)
      );

      expect(isResult).toBe(true);
      expect(mockCompare).toHaveBeenCalledWith(TEST_PASSWORD, TEST_HASH);
    });

    it("returns false when password does not match hash", async () => {
      mockCompare.mockResolvedValue(false);

      const isResult = await Effect.runPromise(
        passwordService.compare(TEST_PASSWORD, TEST_HASH)
      );

      expect(isResult).toBe(false);
    });

    it("fails with HashError when compare throws", async () => {
      mockCompare.mockRejectedValue(new Error("Compare failed"));

      const result = await Effect.runPromise(
        passwordService.compare(TEST_PASSWORD, TEST_HASH).pipe(Effect.flip)
      );

      expect(result).toBeInstanceOf(HashError);
      expect(result.message).toContain("Compare failed");
    });
  });
});
