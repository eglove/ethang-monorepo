import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { logIngestSchema, logQuerySchema } from "./log-schema.ts";

const TEST_SERVICE = "auth-service";

describe("log-schema.ts - Shared Schemas Validation", () => {
  describe("logIngestSchema validation", () => {
    it("given a valid ingest payload, parsing it returns a clean log object", () => {
      const validPayload = {
        environment: "production",
        level: "info" as const,
        message: "Application started successfully",
        metadata: { action: "login", userId: "user-123" },
        serviceName: TEST_SERVICE,
        stack: "Error: start\n  at main"
      };

      const result = logIngestSchema.parse(validPayload);

      expect(result).toStrictEqual(validPayload);
    });

    it("given an invalid log level, parsing it throws a validation error", () => {
      const invalidPayload = {
        environment: "production",
        level: "super-critical", // Invalid log level
        message: "Application crashed",
        serviceName: TEST_SERVICE
      };

      expect(() => {
        logIngestSchema.parse(invalidPayload);
      }).toThrow(ZodError);
    });

    it("given a missing message, environment, or serviceName, parsing it throws a validation error", () => {
      const invalidPayload = {
        level: "error"
      };

      expect(() => {
        logIngestSchema.parse(invalidPayload);
      }).toThrow(ZodError);
    });
  });

  describe("logQuerySchema validation", () => {
    it("given valid query params, parsing it coerces types and returns the query object", () => {
      const queryParameters = {
        endDate: "2026-06-13T23:59:59.000Z",
        environment: "production",
        level: "error" as const,
        limit: "50",
        offset: "100",
        serviceName: TEST_SERVICE,
        startDate: "2026-06-13T00:00:00.000Z"
      };

      const result = logQuerySchema.parse(queryParameters);

      expect(result).toStrictEqual({
        endDate: DateTime.fromISO("2026-06-13T23:59:59.000Z").toJSDate(),
        environment: "production",
        level: "error",
        limit: 50,
        offset: 100,
        serviceName: TEST_SERVICE,
        startDate: DateTime.fromISO("2026-06-13T00:00:00.000Z").toJSDate()
      });
    });

    it("given an invalid date format in query params, parsing it throws a validation error", () => {
      const invalidParameters = {
        startDate: "not-a-date"
      };

      expect(() => {
        logQuerySchema.parse(invalidParameters);
      }).toThrow(ZodError);
    });

    it("given an invalid endDate format, parsing it sets it to undefined instead of throwing", () => {
      const queryParameters = {
        endDate: "not-a-date"
      };

      const result = logQuerySchema.parse(queryParameters);

      expect(result.endDate).toBeUndefined();
    });
  });
});
