import constant from "lodash/constant.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Effect } from "../src/effect.js";

const initialState = {
  count: 0,
  nested: {
    value: "test",
  },
};

describe("Effect", () => {
  let effectFunction: (state: typeof initialState) => void;

  beforeEach(() => {
    effectFunction = vi.fn(constant(true));
  });

  it("should create an instance with effect function and dependency paths", () => {
    const effect = new Effect(effectFunction, ["count"]);

    expect(effect).toBeInstanceOf(Effect);
  });

  it("should execute the effect function when execute is called", () => {
    const effect = new Effect(effectFunction, ["count"]);
    effect.execute(initialState);
    expect(effectFunction).toHaveBeenCalledWith(initialState);
  });

  it("should track nested dependencies", () => {
    const effect = new Effect(effectFunction, ["nested", "value"]);
    effect.execute(initialState);
    expect(effectFunction).toHaveBeenCalledWith(initialState);
  });

  it("should track multiple dependencies", () => {
    const effect = new Effect(effectFunction, ["count"], ["nested", "value"]);
    effect.execute(initialState);
    expect(effectFunction).toHaveBeenCalledWith(initialState);
  });

  it("should reset the internal derived state when reset is called", () => {
    const effect = new Effect(effectFunction, ["count"]);
    effect.execute(initialState);
    effect.reset();
    effect.execute(initialState);
    expect(effectFunction).toHaveBeenCalledTimes(2);
  });

  it("should not execute effect if dependencies have not changed", () => {
    const effect = new Effect(effectFunction, ["count"]);
    effect.execute(initialState);
    effect.execute({
      ...initialState,
      nested: { value: "untracked" },
    });
    expect(effectFunction).toHaveBeenCalledTimes(1);
  });

  it("should execute effect if dependencies have changed", () => {
    const effect = new Effect(effectFunction, ["count"]);
    effect.execute(initialState);

    const newState = {
      ...initialState,
      count: 1,
    };

    effect.execute(newState);
    expect(effectFunction).toHaveBeenCalledTimes(2);
  });
});
