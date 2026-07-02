import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import {
  TEST_DATE,
  TEST_EMAIL,
  TEST_PASS,
  TEST_USERNAME
} from "../test-constants.ts";
import { signInSchema } from "./sign-in-schema.ts";
import { signUpSchema } from "./sign-up-schema.ts";
import { userSchema } from "./user.ts";
import { verifySchema } from "./verify-schema.ts";

describe("user.ts schema validation", () => {
  describe("sign-up-schema", () => {
    it("should validate a valid sign up payload", () => {
      const payload = {
        email: TEST_EMAIL,
        password: TEST_PASS,
        username: TEST_USERNAME
      };
      const result = Schema.decodeUnknownSync(signUpSchema)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual({
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
      const result = Schema.decodeUnknownSync(signUpSchema)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual({
        email: TEST_EMAIL,
        password: TEST_PASS
      });
    });

    it("should throw for short password", () => {
      const payload = {
        email: TEST_EMAIL,
        password: "short"
      };

      expect(() => {
        return Schema.decodeUnknownSync(signUpSchema)(payload);
      }).toThrow(/Password must be at least eight characters long/u);
    });
  });

  describe("sing-in-schema", () => {
    it("should validate a valid sign in payload", () => {
      const payload = {
        email: TEST_EMAIL,
        password: TEST_PASS
      };
      const result = Schema.decodeUnknownSync(signInSchema)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual({
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
      const result = Schema.decodeUnknownSync(verifySchema)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual({
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
        role: null,
        updatedAt: TEST_DATE,
        username: TEST_USERNAME
      };
      const result = Schema.decodeUnknownSync(userSchema)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual(payload);
    });
  });
});
