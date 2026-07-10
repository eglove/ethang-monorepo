import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { createUrlPath } from "../../src/fetch/create-url-path.ts";

const USER_ID = "2";
const DASHBOARD_ID = "4";
const DASHBOARD_PATH = "user/:userId/dashboard(/:dashboardId)";
const DOUBLE_DASHBOARD_PATH = "user/:userId/dashboard/:dashboardId";
const PROFILE_PATH = "user/profile";

describe("createUrlPath", () => {
  it("should build path with correct variables", async () => {
    const result = await Effect.runPromise(
      createUrlPath(
        "user/:userId",
        { userId: USER_ID },
        Schema.Struct({ userId: Schema.String })
      )
    );

    expect(result).toBe(`user/${USER_ID}`);
  });

  it("should build path with optional variables", async () => {
    const result = await Effect.runPromise(
      createUrlPath(
        DASHBOARD_PATH,
        { userId: USER_ID },
        Schema.Struct({
          dashboardId: Schema.optional(Schema.String),
          userId: Schema.String
        })
      )
    );

    expect(result).toBe(`user/${USER_ID}/dashboard`);
  });

  it("should be a type error when missing userId", async () => {
    const result = await Effect.runPromise(
      createUrlPath(
        DASHBOARD_PATH,
        // @ts-expect-error allow for test
        { dashboardId: USER_ID },
        Schema.Struct({
          dashboardId: Schema.optional(Schema.String),
          userId: Schema.String
        })
      ).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
  });

  it("should return error if not path variable schema is provided", async () => {
    const result = await Effect.runPromise(
      createUrlPath("user/:userId", { userId: USER_ID }).pipe(Effect.flip)
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("must provide path variables schema");
  });

  it("returns the path unchanged when parameters is empty and no schema is provided", async () => {
    const result = await Effect.runPromise(createUrlPath(PROFILE_PATH, {}));

    expect(result).toBe(PROFILE_PATH);
  });

  it("should replace multiple variables in path correctly", async () => {
    const result = await Effect.runPromise(
      createUrlPath(
        DOUBLE_DASHBOARD_PATH,
        {
          dashboardId: DASHBOARD_ID,
          userId: USER_ID
        },
        Schema.Struct({
          dashboardId: Schema.String,
          userId: Schema.String
        })
      )
    );

    expect(result).toBe(`user/${USER_ID}/dashboard/${DASHBOARD_ID}`);
  });

  it("should skip nil values in parameters", async () => {
    const parameters: Record<string, string> = {
      userId: USER_ID
    };

    Reflect.set(parameters, "dashboardId", undefined);

    const result = await Effect.runPromise(
      createUrlPath(
        DASHBOARD_PATH,
        // @ts-expect-error testing nil values in path
        parameters,
        Schema.Struct({
          dashboardId: Schema.optional(Schema.String),
          userId: Schema.String
        })
      )
    );

    expect(result).toBe(`user/${USER_ID}/dashboard`);
  });
});
