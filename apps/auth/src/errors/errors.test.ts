import { describe, expect, it } from "vitest";

import { FetchError } from "./fetch-error.ts";
import { HashError } from "./hash-error.ts";
import { InvalidCredentialsError } from "./invalid-credentials-error.ts";
import { NotFoundError } from "./not-found-error.ts";
import { SaveError } from "./save-error.ts";
import { TokenSignError } from "./token-sign-error.ts";
import { TokenVerifyError } from "./token-verify-error.ts";
import { ValidationError } from "./validation-error.ts";

const EMPTY = "";
const TEST_MESSAGE = "test message";

type ErrorConstructor = new (message: string) => {
  readonly _tag: string;
  readonly message: string;
};

const errorClasses: {
  ErrorClass: ErrorConstructor;
  name: string;
}[] = [
  { ErrorClass: FetchError, name: "FetchError" },
  { ErrorClass: HashError, name: "HashError" },
  { ErrorClass: InvalidCredentialsError, name: "InvalidCredentialsError" },
  { ErrorClass: NotFoundError, name: "NotFoundError" },
  { ErrorClass: SaveError, name: "SaveError" },
  { ErrorClass: TokenSignError, name: "TokenSignError" },
  { ErrorClass: TokenVerifyError, name: "TokenVerifyError" },
  { ErrorClass: ValidationError, name: "ValidationError" }
];

for (const { ErrorClass, name } of errorClasses) {
  describe(name, () => {
    it("has correct _tag", () => {
      const error = new ErrorClass(EMPTY);
      expect(error._tag).toBe(name);
    });

    it("stores the message", () => {
      const error = new ErrorClass(TEST_MESSAGE);
      expect(error.message).toBe(TEST_MESSAGE);
    });

    it("is an instance", () => {
      expect(new ErrorClass(EMPTY)).toBeInstanceOf(ErrorClass);
    });
  });
}
