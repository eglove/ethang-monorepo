import { describe, expect, it } from "vitest";

import { createCounter } from "./create-counter.ts";

describe("createCounter", () => {
  it("starts at 1 by default", () => {
    const counter = createCounter();
    expect(counter.next().value).toBe(1);
  });

  it("increments by 1 on each call", () => {
    const counter = createCounter();
    expect(counter.next().value).toBe(1);
    expect(counter.next().value).toBe(2);
    expect(counter.next().value).toBe(3);
  });

  it("starts at a custom value when provided", () => {
    const counter = createCounter(10);
    expect(counter.next().value).toBe(10);
    expect(counter.next().value).toBe(11);
  });

  it("starts at 0 when given 0", () => {
    const counter = createCounter(0);
    expect(counter.next().value).toBe(0);
    expect(counter.next().value).toBe(1);
  });

  it("yields many values before stopping", () => {
    const counter = createCounter();
    let count = 0;

    for (const value of counter) {
      count += 1;
      if (count === 1000) {
        expect(value).toBe(1000);
        break;
      }
    }
  });

  it("each counter instance is independent", () => {
    const a = createCounter(1);
    const b = createCounter(100);

    expect(a.next().value).toBe(1);
    expect(b.next().value).toBe(100);
    expect(a.next().value).toBe(2);
    expect(b.next().value).toBe(101);
  });
});
