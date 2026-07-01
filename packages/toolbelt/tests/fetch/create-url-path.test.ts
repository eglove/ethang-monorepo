import isError from "lodash/isError.js";
import { describe, expect, it } from "vitest";
import { Schema } from "effect";

import { createUrlPath } from "../../src/fetch/create-url-path.ts";

describe("createUrlPath", () => {
  it("should build path with correct variables", () => {
    const result = createUrlPath(
      "user/:userId",
      { userId: "2" },
      Schema.Struct({ userId: Schema.String }),
    );

    expect(result).toBe("user/2");
  });

  it("should build path with optional variables", () => {
    const result = createUrlPath(
      "user/:userId/dashboard(/:dashboardId)",
      {
        userId: "2",
      },
      Schema.Struct({
        dashboardId: Schema.optional(Schema.String),
        userId: Schema.String,
      }),
    );

    expect(result).toBe("user/2/dashboard");
  });

  it("should be a type error when missing userId", () => {
    const result = createUrlPath(
      "user/:userId/dashboard(/:dashboardId)",
      // @ts-expect-error allow for test
      { dashboardId: "2" },
      Schema.Struct({
        dashboardId: Schema.optional(Schema.String),
        userId: Schema.String,
      }),
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should return error if not path variable schema is provided", () => {
    const result = createUrlPath("user/:userId", { userId: "2" });

    expect(result).toBeInstanceOf(Error);

    if (isError(result)) {
      expect(result.message).toBe("must provide path variables schema");
    }
  });

  it("returns the path unchanged when parameters is empty and no schema is provided", () => {
    const result = createUrlPath("user/profile", {});

    expect(result).toBe("user/profile");
  });

  it("should replace multiple variables in path correctly", () => {
    const result = createUrlPath(
      "user/:userId/dashboard/:dashboardId",
      {
        dashboardId: "4",
        userId: "2",
      },
      Schema.Struct({
        dashboardId: Schema.String,
        userId: Schema.String,
      }),
    );

    expect(result).toBe("user/2/dashboard/4");
  });

  it("should skip nil values in parameters", () => {
    const parameters = {
      userId: "2",
    };
    Reflect.set(parameters, "dashboardId", undefined);

    const result = createUrlPath(
      "user/:userId/dashboard(/:dashboardId)",
      parameters,
      Schema.Struct({
        dashboardId: Schema.optional(Schema.String),
        userId: Schema.String,
      }),
    );

    expect(result).toBe("user/2/dashboard");
  });
});

