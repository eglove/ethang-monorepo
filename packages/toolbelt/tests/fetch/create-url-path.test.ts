import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";

import { createUrlPath } from "../../src/fetch/create-url-path.ts";

describe("createUrlPath", () => {
  it("should build path with correct variables", () => {
    const result = createUrlPath(
      "user/:userId",
      { userId: "2" },
      z.object({ userId: z.string() }),
    );

    expect(result).toBe("user/2");
  });

  it("should build path with optional variables", () => {
    const result = createUrlPath(
      "user/:userId/dashboard(/:dashboardId)",
      {
        userId: "2",
      },
      z.object({
        dashboardId: z.string().optional(),
        userId: z.string(),
      }),
    );

    expect(result).toBe("user/2/dashboard");
  });

  it("should be a type error when missing userId", () => {
    const result = createUrlPath(
      "user/:userId/dashboard(/:dashboardId)",
      // @ts-expect-error allow for test
      { dashboardId: "2" },
      z.object({
        dashboardId: z.string().optional(),
        userId: z.string(),
      }),
    );

    expect(result).toBeInstanceOf(ZodError);
  });

  it("should return error if not path variable schema is provided", () => {
    const result = createUrlPath("user/:userId", { userId: "2" });

    expect(result).toBeInstanceOf(Error);

    if (isError(result)) {
      expect(result.message).toBe("must provide path variables schema");
    }
  });
});
