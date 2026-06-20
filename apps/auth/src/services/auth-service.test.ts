// eslint-disable-next-line sonar/no-wildcard-import
import type * as Jose from "jose";

import bcrypt from "bcryptjs";
import isError from "lodash/isError.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockState } from "./auth-mock-state.ts";
import { AuthService } from "./auth-service.ts";

const TEST_EMAIL = "user@test.com";
const TEST_PASSWORD = "password";

vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof Jose>();
  return {
    ...actual,
    SignJWT: class extends actual.SignJWT {
      public override async sign(secret: any, options?: any) {
        if (mockState.shouldSignFails) {
          throw new Error("JWT sign failed");
        }

        return super.sign(secret, options);
      }
    }
  };
});

const { mockHashedV } = vi.hoisted(() => {
  return { mockHashedV: "hashed-pass" };
});

vi.mock("bcryptjs", () => {
  return {
    default: {
      compare: vi.fn().mockResolvedValue(true),
      genSalt: vi.fn().mockResolvedValue("salt"),
      hash: vi.fn().mockResolvedValue(mockHashedV)
    }
  };
});

const mockUser = {
  email: TEST_EMAIL,
  id: "user-1",
  lastLoggedIn: null,
  password: mockHashedV,
  role: "user",
  sessionToken: null,
  username: "user1"
};

describe("AuthService", () => {
  const mockReturning = vi.fn();
  const mockDatabase = {
    insert: vi.fn().mockReturnThis(),
    query: {
      userTable: {
        findFirst: vi.fn()
      }
    },
    returning: mockReturning,
    set: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis()
  };

  let authService: AuthService;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockReturning.mockReset();
    mockDatabase.query.userTable.findFirst.mockReset();
    vi.mocked(bcrypt.compare).mockReset();
    // @ts-expect-error for test
    vi.mocked(bcrypt.compare).mockResolvedValue(true);
    mockState.shouldSignFails = false;
    authService = new AuthService(
      // @ts-expect-error for test
      mockDatabase,
      "test-secret-key-at-least-32-chars-long-12345"
    );
  });

  it("should initialize auth service and set auth cookie", () => {
    const response = new Response();
    authService.setAuthCookie(response, "test-token");
    expect(response.headers.get("Set-Cookie")).toBeDefined();
  });

  it("should fail to verify invalid token", async () => {
    const result = await authService.verifyToken("invalid-token");
    expect(isError(result)).toBe(true);
  });

  it("should verify a valid generated token", async () => {
    // @ts-expect-error calling private generateToken
    const tokenResult = await authService.generateToken(mockUser);
    expect(isError(tokenResult)).toBe(false);
    if (!isError(tokenResult)) {
      const verifyResult = await authService.verifyToken(tokenResult);
      expect(isError(verifyResult)).toBe(false);
      if (!isError(verifyResult)) {
        expect(verifyResult.payload["email"]).toBe(mockUser.email);
      }
    }
  });

  describe("createUser", () => {
    it("should hash password, insert user and update user token", async () => {
      mockReturning
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValueOnce([{ ...mockUser, sessionToken: "token" }]);

      const result = await authService.createUser(
        TEST_EMAIL,
        TEST_PASSWORD,
        "user1"
      );
      expect(isError(result)).toBe(false);
      expect(result).toEqual({ ...mockUser, sessionToken: "token" });
    });

    it("should return error if password hashing fails", async () => {
      vi.spyOn(bcrypt, "hash").mockRejectedValue(new Error("Hash failed"));

      const result = await authService.createUser(
        TEST_EMAIL,
        TEST_PASSWORD,
        "user1"
      );
      expect(isError(result)).toBe(true);
    });

    it("should return error if database insert fails", async () => {
      mockReturning.mockRejectedValue(new Error("Insert failed"));

      const result = await authService.createUser(
        TEST_EMAIL,
        TEST_PASSWORD,
        "user1"
      );
      expect(isError(result)).toBe(true);
    });
  });

  describe("validateCredentials", () => {
    it("should return error if user not found", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(null);

      const result = await authService.validateCredentials(
        TEST_EMAIL,
        TEST_PASSWORD
      );
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.message).toBe("Invalid Credentials");
      }
    });

    it("should return error if password comparison fails", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(mockUser);
      // @ts-expect-error for test
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);

      const result = await authService.validateCredentials(
        TEST_EMAIL,
        TEST_PASSWORD
      );
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.message).toBe("Invalid Credentials");
      }
    });
  });

  describe("signIn", () => {
    it("should return error if credentials validation fails", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(null);

      const result = await authService.signIn(TEST_EMAIL, TEST_PASSWORD);
      expect(isError(result)).toBe(true);
    });

    it("should return error if rehashing fails", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(mockUser);
      mockReturning.mockRejectedValue(new Error("Rehash update failed"));

      const result = await authService.signIn(TEST_EMAIL, TEST_PASSWORD);
      expect(isError(result)).toBe(true);
    });

    it("should return error if password hashing fails during rehashing", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.hash).mockRejectedValueOnce(new Error("Hash failed"));

      const result = await authService.signIn(TEST_EMAIL, TEST_PASSWORD);
      expect(isError(result)).toBe(true);
    });

    it("should return error if generating token fails", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(mockUser);
      mockReturning.mockResolvedValueOnce([
        { ...mockUser, lastLoggedIn: "now" }
      ]);
      mockState.shouldSignFails = true;

      const result = await authService.signIn(TEST_EMAIL, TEST_PASSWORD);
      expect(isError(result)).toBe(true);
    });

    it("should sign in if user already exists", async () => {
      mockDatabase.query.userTable.findFirst.mockResolvedValue(mockUser);
      // @ts-expect-error for test
      vi.mocked(bcrypt.hash).mockResolvedValue(mockHashedV);
      mockReturning
        .mockResolvedValueOnce([{ ...mockUser, lastLoggedIn: "now" }])
        .mockResolvedValueOnce([{ ...mockUser, sessionToken: "token" }]);

      const result = await authService.signUp(TEST_EMAIL, TEST_PASSWORD);
      expect(isError(result)).toBe(false);
      expect(result).toEqual({
        ...mockUser,
        lastLoggedIn: "now"
      });
    });
  });

  describe("updateUserToken", () => {
    it("should return error if updating user token fails", async () => {
      mockReturning.mockRejectedValue(new Error("Update token failed"));

      // @ts-expect-error calling private method
      const result = await authService.updateUserToken(mockUser);
      expect(isError(result)).toBe(true);
    });
  });

  describe("rehashPassword", () => {
    it("should successfully rehash password", async () => {
      // @ts-expect-error for test
      vi.mocked(bcrypt.hash).mockResolvedValueOnce(mockHashedV);
      mockReturning.mockResolvedValueOnce([
        { ...mockUser, lastLoggedIn: "now" }
      ]);

      // @ts-expect-error calling private method
      const result = await authService.rehashPassword(mockUser, TEST_PASSWORD);
      expect(isError(result)).toBe(false);
      expect(result).toEqual({ ...mockUser, lastLoggedIn: "now" });
    });
  });
});
