import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import { LogQuerySchema } from "./log-query-schema.ts";

describe("log-query-schema.ts validation", () => {
  it("should validate a valid query object with all optional fields", () => {
    const queryParameters = {
      endDate: "2026-06-13T23:59:59.000Z",
      environment: "production",
      level: "error" as const,
      limit: "50",
      offset: "100",
      serviceName: "auth-service",
      startDate: "2026-06-13T00:00:00.000Z"
    };

    const result = Schema.decodeUnknownSync(LogQuerySchema)(queryParameters);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual({
      endDate: "2026-06-13T23:59:59.000Z",
      environment: "production",
      level: "error",
      limit: 50,
      offset: 100,
      serviceName: "auth-service",
      startDate: "2026-06-13T00:00:00.000Z"
    });
  });

  it("should validate a query object with no optional fields", () => {
    const queryParameters = {};

    const result = Schema.decodeUnknownSync(LogQuerySchema)(queryParameters);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual({});
  });

  it("should coerce numeric string fields", () => {
    const queryParameters = {
      limit: "100",
      offset: "200"
    };

    const result = Schema.decodeUnknownSync(LogQuerySchema)(queryParameters);

    // eslint-disable-next-line vitest/prefer-strict-equal
    expect(result).toEqual({
      limit: 100,
      offset: 200
    });
  });
});
