import { Schema } from "effect";
import { ParseError } from "effect/ParseResult";
import { describe, expect, it } from "vitest";

import { LogQuerySchema } from "./log-query-schema.ts";
import { LogIngestSchema } from "./log-schema.ts";

const TEST_SERVICE = "auth-service";

describe("log-schema.ts - Shared Schemas Validation", () => {
  describe("logIngestSchema validation", () => {
    it("given a valid ingest payload, decoding it returns a clean log object", () => {
      const validPayload = {
        environment: "production",
        level: "info" as const,
        message: "Application started successfully",
        metadata: { action: "login", userId: "user-123" },
        serviceName: TEST_SERVICE,
        stack: "Error: start\n  at main"
      };

      const result = Schema.decodeUnknownSync(LogIngestSchema)(validPayload);

      // eslint-disable-next-line vitest/prefer-strict-equal
      expect(result).toEqual(validPayload);
    });

    it("given an invalid log level, decoding it throws a validation error", () => {
      const invalidPayload = {
        environment: "production",
        level: "super-critical",
        message: "Application crashed",
        serviceName: TEST_SERVICE
      };

      expect(() => {
        Schema.decodeUnknownSync(LogIngestSchema)(invalidPayload);
      }).toThrow(ParseError);
    });

    it("given a missing message, environment, or serviceName, decoding it throws a validation error", () => {
      const invalidPayload = {
        level: "error"
      };

      expect(() => {
        Schema.decodeUnknownSync(LogIngestSchema)(invalidPayload);
      }).toThrow(ParseError);
    });
  });

  describe("logQuerySchema validation", () => {
    it("given valid query params, decoding it coerces types and returns the query object", () => {
      const queryParameters = {
        endDate: "2026-06-13T23:59:59.000Z",
        environment: "production",
        level: "error" as const,
        limit: "50",
        offset: "100",
        serviceName: TEST_SERVICE,
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
        serviceName: TEST_SERVICE,
        startDate: "2026-06-13T00:00:00.000Z"
      });
    });
  });
});
