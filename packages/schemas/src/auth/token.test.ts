import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  TEST_DATE,
  TEST_EMAIL,
  TEST_USER_ID,
  TEST_USERNAME
} from "../test-constants.ts";
import { signInResponseToken, tokenSchema } from "./token.ts";

describe("token.ts schema validation", () => {
  describe("token-schema", () => {
    it("should validate a valid token", () => {
      const payload = {
        email: TEST_EMAIL,
        role: "admin",
        sub: TEST_USER_ID,
        username: TEST_USERNAME
      };
      const result = tokenSchema.parse(payload);

      expect(result).toStrictEqual({
        email: TEST_EMAIL,
        role: "admin",
        sub: TEST_USER_ID,
        username: TEST_USERNAME
      });
    });

    it("should throw for missing or invalid values", () => {
      const payload = {
        email: TEST_EMAIL,
        role: "admin"
      };

      expect(() => {
        return tokenSchema.parse(payload);
      }).toThrow(ZodError);
    });
  });

  describe("sign-in-response-token", () => {
    it("should validate a valid signInResponseToken payload", () => {
      const payload = {
        email: TEST_EMAIL,
        id: TEST_USER_ID,
        lastLoggedIn: TEST_DATE,
        role: "user",
        sessionToken: "some-jwt-token",
        updatedAt: TEST_DATE,
        username: TEST_USERNAME
      };
      const result = signInResponseToken.parse(payload);

      expect(result).toStrictEqual(payload);
    });

    it("should throw for missing fields", () => {
      const payload = {
        email: TEST_EMAIL,
        username: TEST_USERNAME
      };

      expect(() => {
        return signInResponseToken.parse(payload);
      }).toThrow(ZodError);
    });
  });
});
