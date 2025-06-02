/* eslint-disable sonar/no-duplicate-string */
import includes from "lodash/includes.js";
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

  it("should add content security policy (CSP)", () => {
    const data = { status: "created" };
    const response = createJsonResponse(data, "CREATED", {
      statusText: "Resource Created",
    });

    const cspHeaders = response.headers.get("Content-Security-Policy");

    expect(includes(cspHeaders, "default-src 'self'")).toBe(true);
    expect(includes(cspHeaders, "script-src 'self' 'nonce-")).toBe(true);
    expect(
      includes(cspHeaders, "'strict-dynamic' 'unsafe-inline' https: http:"),
    ).toBe(true);
    expect(includes(cspHeaders, "style-src 'self' 'nonce")).toBe(true);
    expect(includes(cspHeaders, "img-src 'self' data: https:")).toBe(true);
    expect(includes(cspHeaders, "font-src 'self' data: https:")).toBe(true);
    expect(
      includes(cspHeaders, "connect-src 'self' https://clerk.ethang.dev/"),
    ).toBe(true);
    expect(includes(cspHeaders, "object-src 'none'")).toBe(true);
    expect(includes(cspHeaders, "base-uri 'none'")).toBe(true);
    expect(includes(cspHeaders, "frame-ancestors 'self'")).toBe(true);
    expect(includes(cspHeaders, "form-action 'self'")).toBe(true);
    expect(includes(cspHeaders, "require-trusted-types-for 'script'")).toBe(
      true,
    );
  });
});
