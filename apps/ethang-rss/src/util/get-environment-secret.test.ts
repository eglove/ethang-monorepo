import { describe, expect, it } from "vitest";

import { getEnvironmentString } from "./get-environment-secret.ts";

describe("getEnvironmentString", () => {
  it("returns value if key exists and is a string", () => {
    const object = { ENVIRONMENT: "production" };
    expect(getEnvironmentString(object, "ENVIRONMENT")).toBe("production");
  });

  it("returns undefined if key does not exist", () => {
    const object = { OTHER: "value" };
    expect(getEnvironmentString(object, "ENVIRONMENT")).toBeUndefined();
  });

  it("returns undefined if key value is not a string", () => {
    const object = { ENVIRONMENT: 123 };
    expect(getEnvironmentString(object, "ENVIRONMENT")).toBeUndefined();
  });

  it("returns undefined if input is not an object", () => {
    expect(getEnvironmentString(null, "ENVIRONMENT")).toBeUndefined();
    expect(getEnvironmentString("string", "ENVIRONMENT")).toBeUndefined();
  });
});
