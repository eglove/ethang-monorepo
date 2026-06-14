import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";

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

  describe("bracket notation trim", () => {
    it("should validate and trim token email/username/role/sub correctly using bracket notation ['trim']()", () => {
      const trimKey = "trim";
      const emailSchema = z.string()[trimKey]();
      const usernameSchema = z.string()[trimKey]();
      const roleSchema = z.string()[trimKey]();
      const subSchema = z.string()[trimKey]();

      const emailResult = emailSchema.parse(`  ${TEST_EMAIL}  `);
      const usernameResult = usernameSchema.parse(`  ${TEST_USERNAME}  `);
      const roleResult = roleSchema.parse("  admin  ");
      const subResult = subSchema.parse(`  ${TEST_USER_ID}  `);

      expect(emailResult).toBe(TEST_EMAIL);
      expect(usernameResult).toBe(TEST_USERNAME);
      expect(roleResult).toBe("admin");
      expect(subResult).toBe(TEST_USER_ID);
    });
  });
});
