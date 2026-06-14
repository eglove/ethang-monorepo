import { describe, expect, it, vi } from "vitest";

import {
  getEnvironmentString,
  getSecretValue
} from "./get-environment-secret.ts";

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

describe("getSecretValue", () => {
  it("returns string value if secret has get function", async () => {
    const secret = {
      get: vi.fn().mockResolvedValue("my-secret-key")
    };
    await expect(getSecretValue(secret)).resolves.toBe("my-secret-key");
  });

  it("returns undefined if secret.get throws an error", async () => {
    const secret = {
      get: vi.fn().mockRejectedValue(new Error("Failed to get secret"))
    };
    await expect(getSecretValue(secret)).resolves.toBeUndefined();
  });

  it("returns string directly if secret is a string", async () => {
    await expect(getSecretValue("my-raw-string")).resolves.toBe(
      "my-raw-string"
    );
  });

  it("returns undefined if secret is not a string and has no get method", async () => {
    await expect(getSecretValue(123)).resolves.toBeUndefined();
    await expect(getSecretValue(null)).resolves.toBeUndefined();
  });
});
