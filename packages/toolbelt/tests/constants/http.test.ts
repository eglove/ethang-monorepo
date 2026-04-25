import { describe, expect, it } from "vitest";

import { HTTP_STATUS } from "../../src/constants/http.ts";

describe("http_status", () => {
  it.each([
    ["ACCEPTED", 202],
    ["CONFLICT", 409],
    ["PAYMENT_REQUIRED", 402],
  ])("should return correct values", (key, value) => {
    // @ts-expect-error allow for tests
    expect(HTTP_STATUS[key]).toBe(value);
  });
});
