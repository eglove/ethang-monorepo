import { describe, expect, it } from "vitest";

import { caesarCipherEncrypt } from "./caesar-cipher-encrypt.js";

describe("caesarCipherEncrypt", () => {
  it("should work", () => {
    expect(caesarCipherEncrypt("xyz", 2)).toBe("zab");
  });
});
