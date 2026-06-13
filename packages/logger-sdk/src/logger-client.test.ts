import isUndefined from "lodash/isUndefined.js";
import { describe, expect, it, type Mock, onTestFinished, vi } from "vitest";

import { LoggerClient } from "./logger-client.ts";

const TEST_API_KEY = "test-api-key";
const LOG_API_ENDPOINT = "https://log-api.example.com";
const TEST_SERVICE = "test-service";
const PRODUCTION_ENV = "production";
const OVERRIDE_URL = "override-url";
const USER_AGENT_STRING = "Mozilla/5.0 TestBrowser";
const APP_URL = "https://example.com/page";
const FETCH_NOT_CALLED = "fetch was not called";
const FETCH_OPTIONS_UNDEFINED = "fetch options or body is undefined";

const setupFetchMock = (status = 202) => {
  const fetchMock: Mock<
    (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  > = vi.fn().mockResolvedValue({
    json: async () => {
      await Promise.resolve();
      return { success: true };
    },
    ok: 200 <= status && 300 > status,
    status
  });

  vi.stubGlobal("fetch", fetchMock);

  onTestFinished(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  return {
    fetchMock
  };
};

const getRequestBody = (
  fetchMock: Mock<
    (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  >
): Record<string, unknown> => {
  const [fetchCall] = fetchMock.mock.calls;
  if (isUndefined(fetchCall)) {
    throw new Error(FETCH_NOT_CALLED);
  }
  const [, requestOptions] = fetchCall;
  if (isUndefined(requestOptions) || isUndefined(requestOptions.body)) {
    throw new Error(FETCH_OPTIONS_UNDEFINED);
  }
  return JSON.parse(requestOptions.body as string) as Record<string, unknown>;
};

describe("loggerClient - SDK Client library", () => {
  it("sets internal config properties when initialized", () => {
    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      endpoint: LOG_API_ENDPOINT,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    const clientAny = client as unknown as Record<string, unknown>;

    expect(clientAny["endpoint"]).toBe(LOG_API_ENDPOINT);
    expect(clientAny["apiKey"]).toBe(TEST_API_KEY);
    expect(clientAny["serviceName"]).toBe(TEST_SERVICE);
    expect(clientAny["environment"]).toBe(PRODUCTION_ENV);
  });

  it("defaults to the production logger domain if endpoint is omitted", () => {
    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    const clientAny = client as unknown as Record<string, unknown>;

    expect(clientAny["endpoint"]).toBe(
      "https://logger-service.hello-a8f.workers.dev"
    );
  });

  it("sends a POST request with correct headers and body when a log method is called", async () => {
    const { fetchMock } = setupFetchMock();

    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      endpoint: LOG_API_ENDPOINT,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    await client.info("hello world");
    await client.debug("hello debug");
    await client.warn("hello warn");
    await client.error("hello error", undefined, "some stack");
    await client.fatal("hello fatal", undefined, "some stack");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://log-api.example.com/log",
      expect.objectContaining({
        body: expect.stringContaining(
          '"message":"hello world"'
        ) as unknown as string,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEST_API_KEY
        },
        method: "POST"
      })
    );
  });

  it("automatically attaches browser metadata when running in a browser environment", async () => {
    const { fetchMock } = setupFetchMock();

    vi.stubGlobal("window", {
      location: { href: APP_URL },
      screen: { height: 1080, width: 1920 }
    });
    vi.stubGlobal("navigator", {
      userAgent: USER_AGENT_STRING
    });

    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      endpoint: LOG_API_ENDPOINT,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    await client.info("in browser");

    const requestBody = getRequestBody(fetchMock);

    expect(requestBody["metadata"]).toStrictEqual(
      expect.objectContaining({
        screenHeight: 1080,
        screenWidth: 1920,
        url: APP_URL,
        userAgent: USER_AGENT_STRING
      })
    );
  });

  it("does not attach browser metadata when running in a non-browser environment", async () => {
    const { fetchMock } = setupFetchMock();

    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      endpoint: LOG_API_ENDPOINT,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    await client.info("in node");

    const requestBody = getRequestBody(fetchMock);

    expect(requestBody["metadata"]).not.toHaveProperty("userAgent");
    expect(requestBody["metadata"]).not.toHaveProperty("url");
  });

  it("merges custom metadata with enriched metadata when a log method is called with custom metadata", async () => {
    const { fetchMock } = setupFetchMock();

    vi.stubGlobal("window", {
      location: { href: APP_URL },
      screen: { height: 1080, width: 1920 }
    });
    vi.stubGlobal("navigator", {
      userAgent: USER_AGENT_STRING
    });

    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      endpoint: LOG_API_ENDPOINT,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    await client.info("custom meta", {
      customField: "value",
      url: OVERRIDE_URL
    });

    const requestBody = getRequestBody(fetchMock);

    expect(requestBody["metadata"]).toStrictEqual(
      expect.objectContaining({
        customField: "value",
        screenHeight: 1080,
        screenWidth: 1920,
        url: OVERRIDE_URL,
        userAgent: USER_AGENT_STRING
      })
    );
  });

  it("catches network errors and does not throw an exception when a log method fails", async () => {
    const { fetchMock } = setupFetchMock();

    fetchMock.mockRejectedValue(new Error("Network failure"));

    const client = new LoggerClient({
      apiKey: TEST_API_KEY,
      endpoint: LOG_API_ENDPOINT,
      environment: PRODUCTION_ENV,
      serviceName: TEST_SERVICE
    });

    await expect(client.info("error test")).resolves.not.toThrow();
  });
});
