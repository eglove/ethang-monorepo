/* eslint-disable sonar/no-duplicate-string */
import { describe, expect, it } from "vitest";

import { HTTP_STATUS } from "../../src/constants/http.js";
import { createJsonResponse } from "../../src/fetch/create-json-response.js";

describe("createJsonResponse", () => {
  it("should create a JSON response with default header and OK status", async () => {
    const data = { message: "Success" };
    const response = createJsonResponse(data, "OK");

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toStrictEqual(data);

    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("should merge custom headers provided in responseInit", async () => {
    const data = { error: "Bad Request" };
    const customHeaders = {
      "Access-Control-Allow-Origin": "http://example.com",
      "X-Custom-Header": "Test",
    };
    const response = createJsonResponse(data, "BAD_REQUEST", {
      headers: customHeaders,
    });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(await response.json()).toStrictEqual(data);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("X-Custom-Header")).toBe("Test");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://example.com",
    );
  });

  it("should handle null data correctly", () => {
    const response = createJsonResponse(null, "NOT_FOUND");

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should handle undefined data correctly", () => {
    const response = createJsonResponse(undefined, "INTERNAL_SERVER_ERROR");

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should pass through other responseInit properties", async () => {
    const data = { status: "created" };
    const response = createJsonResponse(data, "CREATED", {
      statusText: "Resource Created",
    });

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(response.statusText).toBe("Resource Created");
    expect(await response.json()).toStrictEqual(data);
  });

  it("should remove invalid headers", () => {
    const data = { status: "created" };
    const response = createJsonResponse(data, "CREATED", {
      statusText: "Resource Created",
    });

    const publicKeyPins = response.headers.get("Public-Key-Pins");
    const aspNetVersion = response.headers.get("X-AspNet-Version");
    const poweredBy = response.headers.get("X-Powered-By");

    expect(publicKeyPins).toBe(null);
    expect(aspNetVersion).toBe(null);
    expect(poweredBy).toBe(null);
  });
});
