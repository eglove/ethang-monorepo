import { describe, expect, it } from "vitest";

import { Derived } from "../src/derived.js";

describe("Derived", () => {
  it("should compute initial value correctly", () => {
    const source = { age: 30, name: "John" };
    const derived = new Derived(
      (s: typeof source) => `${s.name} is ${s.age}`,
      ["name"],
      ["age"],
    );

    expect(derived.compute(source)).toBe("John is 30");
  });

  it("should return memoized value when dependencies have not changed", () => {
    const source = { value: 1 };
    let computeCount = 0;

    const derived = new Derived(
      (s: typeof source) => {
        computeCount += 1;
        return s.value * 2;
      },
      ["value"],
    );

    expect(derived.compute(source)).toBe(2);
    expect(computeCount).toBe(1);

    expect(derived.compute(source)).toBe(2);
    expect(computeCount).toBe(1);
  });

  it("should recompute when dependencies change", () => {
    const source = { value: 1 };
    const derived = new Derived((s: typeof source) => s.value * 2, ["value"]);

    expect(derived.compute(source)).toBe(2);

    source.value = 2;
    expect(derived.compute(source)).toBe(4);
  });

  it("should handle multiple dependencies correctly", () => {
    const source = { a: 1, b: 2 };
    const derived = new Derived((s: typeof source) => s.a + s.b, ["a"], ["b"]);

    expect(derived.compute(source)).toBe(3);

    source.a = 2;
    expect(derived.compute(source)).toBe(4);

    source.b = 3;
    expect(derived.compute(source)).toBe(5);
  });

  it("should handle nested dependency paths", () => {
    const source = { user: { details: { age: 25 } } };
    const derived = new Derived(
      (s: typeof source) => s.user.details.age * 2,
      ["user", "details", "age"],
    );

    expect(derived.compute(source)).toBe(50);

    source.user.details.age = 30;
    expect(derived.compute(source)).toBe(60);
  });

  it("should reset memoization when reset is called", () => {
    const source = { value: 1 };
    let computeCount = 0;

    const derived = new Derived((s: typeof source) => {
      computeCount += 1;
      return s.value * 2;
    }, "value");

    expect(derived.compute(source)).toBe(2);
    expect(computeCount).toBe(1);

    derived.reset();

    expect(derived.compute(source)).toBe(2);
    expect(computeCount).toBe(2);
  });

  it("should handle computation with no dependencies", () => {
    const source = { value: 1 };
    const derived = new Derived((s: typeof source) => s.value * 2);

    expect(derived.compute(source)).toBe(2);
  });

  it("should use Object.is for dependency comparison", () => {
    const source = { obj: { value: 1 } };
    let computeCount = 0;

    const derived = new Derived((s: typeof source) => {
      computeCount += 1;
      return s.obj.value;
    }, "obj");

    expect(derived.compute(source)).toBe(1);
    expect(computeCount).toBe(1);

    source.obj.value = 2;
    expect(derived.compute(source)).toBe(1);
    expect(computeCount).toBe(1);

    source.obj = { value: 2 };
    expect(derived.compute(source)).toBe(2);
    expect(computeCount).toBe(2);
  });
});
