import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { fn as function_ } from "./spans.js";

describe("fn (Effect.fn re-export)", () => {
  it("should produce a traced function that returns an Effect", async () => {
    const tracedAdd = function_("tracedAdd")(function* (a: number, b: number) {
      return yield* Effect.succeed(a + b);
    });

    const result = await Effect.runPromise(tracedAdd(2, 3));
    expect(result).toBe(5);
  });

  it("should propagate failures through the traced function", async () => {
    const tracedBoom = function_("tracedBoom")(function* () {
      return yield* Effect.fail(new Error("boom"));
    });

    const exit = await Effect.runPromiseExit(tracedBoom());
    expect(exit._tag).toBe("Failure");
  });
});
