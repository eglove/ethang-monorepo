import { Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { describe, expect, it } from "vitest";

import {
  TEST_DATE,
  TEST_EMAIL,
  TEST_USER_ID,
  TEST_USERNAME
} from "../test-constants.ts";
import { TokenSchema } from "./token-schema.ts";
import { SignInResponseToken } from "./token.ts";

describe("token.ts schema validation", () => {
  describe("token-schema", () => {
    it("should validate a valid token", () => {
      const payload = {
        email: TEST_EMAIL,
        role: "admin",
        sub: TEST_USER_ID,
        username: TEST_USERNAME
      };
      const result = Schema.decodeUnknownSync(TokenSchema)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual({
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
        return Schema.decodeUnknownSync(TokenSchema)(payload);
      }).toThrow(ParseError);
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
      const result = Schema.decodeUnknownSync(SignInResponseToken)(payload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual(payload);
    });

    it("should throw for missing fields", () => {
      const payload = {
        email: TEST_EMAIL,
        username: TEST_USERNAME
      };

      expect(() => {
        return Schema.decodeUnknownSync(SignInResponseToken)(payload);
      }).toThrow(ParseError);
    });
  });
});
