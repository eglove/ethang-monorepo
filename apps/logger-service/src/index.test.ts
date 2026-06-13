import { describe, expect, it, vi } from "vitest";

import { app } from "./index.ts";

const ADMIN_SECRET_KEY = "admin-secret-key";
const CLIENT_KEY_1 = "client-key-1";
const SERVER_KEY_1 = "server-key-1";
const SERVER_KEY_2 = "server-key-2";
const PRODUCTION_ENV = "production";
const INFO_LEVEL = "info";
const ERROR_LEVEL = "error";
const SERVICE_NAME = "service";
const TEST_MESSAGE = "test";
const TRUSTED_CLIENT_ORIGIN = "https://trusted-client.com";
const ANOTHER_CLIENT_ORIGIN = "https://another-client.com";
const D1_QUERY_FAILED = "D1 query failed";
const D1_WRITE_FAILED = "D1 write failed";

const createMockEnvironment = () => {
  const prepareMock = vi.fn().mockReturnValue({
    all: vi.fn().mockResolvedValue({ results: [] }),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    raw: vi.fn().mockResolvedValue([]),
    run: vi.fn().mockResolvedValue({ success: true })
  });

  const mockD1 = {
    prepare: prepareMock
  };

  const mockEnvironment = {
    ADMIN_KEY: ADMIN_SECRET_KEY,
    ALLOWED_ORIGINS: `${TRUSTED_CLIENT_ORIGIN},${ANOTHER_CLIENT_ORIGIN}`,
    CLIENT_API_KEYS: `${CLIENT_KEY_1},client-key-2`,
    DB: mockD1 as unknown as D1Database,
    SERVER_API_KEYS: `${SERVER_KEY_1},${SERVER_KEY_2}`
  };

  return { mockD1, mockEnvironment };
};

describe("apps/logger-service - GET /logs", () => {
  it("returns 401 Unauthorized when requesting GET /logs with missing or invalid x-admin-key", async () => {
    const { mockEnvironment } = createMockEnvironment();

    const responseMissing = await app.request("/logs", {}, mockEnvironment);

    expect(responseMissing.status).toBe(401);

    const responseInvalid = await app.request(
      "/logs",
      {
        headers: { "x-admin-key": "wrong-key" }
      },
      mockEnvironment
    );

    expect(responseInvalid.status).toBe(401);
  });

  it("returns 200 OK with paginated logs from D1 when requesting GET /logs with valid x-admin-key", async () => {
    const { mockD1, mockEnvironment } = createMockEnvironment();

    const mockLogs = [
      {
        environment: PRODUCTION_ENV,
        id: "1",
        level: INFO_LEVEL,
        message: "hello",
        serviceName: "auth-service",
        timestamp: "2026-06-13T14:00:00Z"
      }
    ];

    const mockLogsRaw = [
      [
        PRODUCTION_ENV,
        "1",
        INFO_LEVEL,
        "hello",
        null,
        "auth-service",
        null,
        "2026-06-13T14:00:00Z"
      ]
    ];

    mockD1.prepare.mockReturnValue({
      all: vi.fn().mockResolvedValue({ results: mockLogs }),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      raw: vi.fn().mockResolvedValue(mockLogsRaw),
      run: vi.fn().mockResolvedValue({ success: true })
    });

    const response = await app.request(
      `/logs?level=info&serviceName=auth-service&environment=production&startDate=2026-06-13T00:00:00.000Z&endDate=2026-06-13T23:59:59.000Z&limit=50&offset=0`,
      {
        headers: { "x-admin-key": ADMIN_SECRET_KEY }
      },
      mockEnvironment
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toStrictEqual({ logs: mockLogs });

    // Test DB failure on GET /logs
    mockD1.prepare.mockReturnValue({
      all: vi.fn().mockRejectedValue(new Error(D1_QUERY_FAILED)),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockRejectedValue(new Error(D1_QUERY_FAILED)),
      raw: vi.fn().mockRejectedValue(new Error(D1_QUERY_FAILED)),
      run: vi.fn().mockRejectedValue(new Error(D1_QUERY_FAILED))
    });

    const responseFail = await app.request(
      "/logs",
      {
        headers: { "x-admin-key": ADMIN_SECRET_KEY }
      },
      mockEnvironment
    );

    expect(responseFail.status).toBe(500);
  });

  it("returns 400 Bad Request when requesting GET /logs with invalid query params", async () => {
    const { mockEnvironment } = createMockEnvironment();

    const response = await app.request(
      "/logs?limit=invalid-number",
      {
        headers: { "x-admin-key": ADMIN_SECRET_KEY }
      },
      mockEnvironment
    );

    expect(response.status).toBe(400);
  });
});

describe("apps/logger-service - POST /log Auth", () => {
  it("returns 401 Unauthorized when requesting POST /log with missing or invalid x-api-key", async () => {
    const { mockEnvironment } = createMockEnvironment();

    const responseMissing = await app.request(
      "/log",
      {
        body: JSON.stringify({ message: TEST_MESSAGE }),
        method: "POST"
      },
      mockEnvironment
    );

    expect(responseMissing.status).toBe(401);

    const responseInvalid = await app.request(
      "/log",
      {
        body: JSON.stringify({ message: TEST_MESSAGE }),
        headers: { "x-api-key": "wrong-key" },
        method: "POST"
      },
      mockEnvironment
    );

    expect(responseInvalid.status).toBe(401);
  });

  it("returns 403 Forbidden when requesting POST /log using a client write key with an invalid or missing Origin header", async () => {
    const { mockEnvironment } = createMockEnvironment();

    const responseMissingOrigin = await app.request(
      "/log",
      {
        body: JSON.stringify({
          environment: PRODUCTION_ENV,
          level: INFO_LEVEL,
          message: TEST_MESSAGE,
          serviceName: SERVICE_NAME
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CLIENT_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(responseMissingOrigin.status).toBe(403);

    const responseWrongOrigin = await app.request(
      "/log",
      {
        body: JSON.stringify({
          environment: PRODUCTION_ENV,
          level: INFO_LEVEL,
          message: TEST_MESSAGE,
          serviceName: SERVICE_NAME
        }),
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.com",
          "x-api-key": CLIENT_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(responseWrongOrigin.status).toBe(403);
  });
});

describe("apps/logger-service - POST /log Ingestion", () => {
  it("returns 202 Accepted and inserts into D1 when requesting POST /log using a client write key with a valid Origin header", async () => {
    const { mockD1, mockEnvironment } = createMockEnvironment();
    const payload = {
      environment: PRODUCTION_ENV,
      level: INFO_LEVEL,
      message: "hello from browser",
      serviceName: "web-app"
    };

    const response = await app.request(
      "/log",
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Origin: TRUSTED_CLIENT_ORIGIN,
          "x-api-key": CLIENT_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(response.status).toBe(202);
    expect(mockD1.prepare).toHaveBeenCalledWith(expect.any(String));
  });

  it("returns 202 Accepted and inserts into D1 when requesting POST /log using a server write key without Origin header", async () => {
    const { mockD1, mockEnvironment } = createMockEnvironment();
    const payload = {
      environment: PRODUCTION_ENV,
      level: ERROR_LEVEL,
      message: "hello from server",
      serviceName: "backend"
    };

    const response = await app.request(
      "/log",
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SERVER_KEY_2
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(response.status).toBe(202);
    expect(mockD1.prepare).toHaveBeenCalledWith(expect.any(String));
  });

  it("returns 400 Bad Request when requesting POST /log with an invalid body", async () => {
    const { mockEnvironment } = createMockEnvironment();
    const invalidPayload = {
      level: "invalid-level",
      message: ""
    };

    const response = await app.request(
      "/log",
      {
        body: JSON.stringify(invalidPayload),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SERVER_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(response.status).toBe(400);

    const responseMalformed = await app.request(
      "/log",
      {
        body: "{malformed-json",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SERVER_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(responseMalformed.status).toBe(400);

    // Test Rate Limiter triggering 429
    const requests = Array.from({ length: 101 }, async (_, index) => {
      return app.request(
        "/log",
        {
          body: JSON.stringify({
            environment: PRODUCTION_ENV,
            level: INFO_LEVEL,
            message: `rate-limit-test-${index}`,
            serviceName: SERVICE_NAME
          }),
          headers: {
            // eslint-disable-next-line sonar/no-hardcoded-ip
            "CF-Connecting-IP": "1.2.3.4",
            "Content-Type": "application/json",
            "x-api-key": SERVER_KEY_1
          },
          method: "POST"
        },
        mockEnvironment
      );
    });
    await Promise.all(requests);

    const responseRateLimited = await app.request(
      "/log",
      {
        body: JSON.stringify({
          environment: PRODUCTION_ENV,
          level: INFO_LEVEL,
          message: "should fail",
          serviceName: SERVICE_NAME
        }),
        headers: {
          // eslint-disable-next-line sonar/no-hardcoded-ip
          "CF-Connecting-IP": "1.2.3.4",
          "Content-Type": "application/json",
          "x-api-key": SERVER_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(responseRateLimited.status).toBe(429);
  });

  it("returns 500 Internal Server Error when requesting POST /log and database insert fails", async () => {
    const { mockD1, mockEnvironment } = createMockEnvironment();

    mockD1.prepare.mockReturnValue({
      all: vi.fn().mockRejectedValue(new Error(D1_WRITE_FAILED)),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockRejectedValue(new Error(D1_WRITE_FAILED)),
      raw: vi.fn().mockRejectedValue(new Error(D1_WRITE_FAILED)),
      run: vi.fn().mockRejectedValue(new Error(D1_WRITE_FAILED))
    });

    const payload = {
      environment: PRODUCTION_ENV,
      level: INFO_LEVEL,
      message: "db fail test",
      serviceName: SERVICE_NAME
    };

    const response = await app.request(
      "/log",
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": SERVER_KEY_1
        },
        method: "POST"
      },
      mockEnvironment
    );

    expect(response.status).toBe(500);
  });
});

describe("apps/logger-service - OPTIONS /log CORS", () => {
  it("returns 204 No Content with appropriate headers when OPTIONS /log CORS preflight is sent", async () => {
    const { mockEnvironment } = createMockEnvironment();

    const response = await app.request(
      "/log",
      {
        headers: {
          "Access-Control-Request-Headers": "x-api-key, content-type",
          "Access-Control-Request-Method": "POST",
          Origin: TRUSTED_CLIENT_ORIGIN
        },
        method: "OPTIONS"
      },
      mockEnvironment
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      TRUSTED_CLIENT_ORIGIN
    );

    const allowedMethods = response.headers.get("Access-Control-Allow-Methods");

    expect(allowedMethods).toBeTypeOf("string");
    expect(allowedMethods).toContain("POST");
  });
});
