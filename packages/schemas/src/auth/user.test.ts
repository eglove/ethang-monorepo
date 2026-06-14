import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  TEST_DATE,
  TEST_EMAIL,
  TEST_PASS,
  TEST_USERNAME
} from "../test-constants.ts";
import {
  signInSchema,
  signUpSchema,
  userSchema,
  verifySchema
} from "./user.ts";

describe("user.ts schema validation", () => {
  describe("sign-up-schema", () => {
    it("should validate a valid sign up payload", () => {
      const payload = {
        email: TEST_EMAIL,
        password: TEST_PASS,
        username: TEST_USERNAME
      };
      const result = signUpSchema.parse(payload);

      expect(result).toStrictEqual({
        email: TEST_EMAIL,
        password: TEST_PASS,
        username: TEST_USERNAME
      });
    });

    it("should allow optional username", () => {
      const payload = {
        email: TEST_EMAIL,
        password: TEST_PASS
      };
      const result = signUpSchema.parse(payload);

      expect(result).toStrictEqual({
        email: TEST_EMAIL,
        password: TEST_PASS
      });
    });

    it("should throw for invalid email", () => {
      const payload = {
        email: "not-an-email",
        password: TEST_PASS
      };

      expect(() => {
        return signUpSchema.parse(payload);
      }).toThrow(ZodError);
    });

    it("should throw for short password", () => {
      const payload = {
        email: TEST_EMAIL,
        password: "short"
      };

      expect(() => {
        return signUpSchema.parse(payload);
      }).toThrow(ZodError);
    });
  });

  describe("sing-in-schema", () => {
    it("should validate a valid sign in payload", () => {
      const payload = {
        email: TEST_EMAIL,
        password: TEST_PASS
      };
      const result = signInSchema.parse(payload);

      expect(result).toStrictEqual({
        email: TEST_EMAIL,
        password: TEST_PASS
      });
    });
  });

  describe("verify-schema", () => {
    it("should validate a valid verify payload", () => {
      const payload = {
        email: TEST_EMAIL,
        password: TEST_PASS
      };
      const result = verifySchema.parse(payload);

      expect(result).toStrictEqual({
        email: TEST_EMAIL,
        password: TEST_PASS
      });
    });
  });

  describe("user-schema", () => {
    it("should validate a valid user payload", () => {
      const payload = {
        createdAt: TEST_DATE,
        email: TEST_EMAIL,
        lastLoggedIn: null,
        password: TEST_PASS,
        role: "admin",
        updatedAt: TEST_DATE,
        username: TEST_USERNAME
      };
      const result = userSchema.parse(payload);

      expect(result).toStrictEqual(payload);
    });
  });
});
