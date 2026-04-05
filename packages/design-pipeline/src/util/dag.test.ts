import { describe, expect, it } from "vitest";

import { isDAG } from "./dag.ts";
import { isOk, isResultError } from "./result.ts";

describe("isDAG", () => {
  it("empty edge set is a DAG", () => {
    const result = isDAG([]);
    expect(isOk(result)).toBe(true);
  });

  it("linear chain is a DAG", () => {
    const result = isDAG([
      [1, 2],
      [2, 3],
    ]);
    expect(isOk(result)).toBe(true);
  });

  it("cycle is not a DAG", () => {
    const result = isDAG([
      [1, 2],
      [2, 1],
    ]);
    expect(isResultError(result)).toBe(true);
    if (isResultError(result)) {
      expect(result.message).toBe("Circular subscription detected");
    }
  });

  it("self-loop is not a DAG", () => {
    const result = isDAG([[1, 1]]);
    expect(isResultError(result)).toBe(true);
    if (isResultError(result)) {
      expect(result.message).toBe("Self-loop detected");
    }
  });

  it("complex DAG with multiple paths is valid", () => {
    const result = isDAG([
      [1, 3],
      [1, 4],
      [2, 4],
      [2, 5],
      [3, 6],
      [4, 6],
      [5, 6],
    ]);
    expect(isOk(result)).toBe(true);
  });

  it("diamond is a DAG", () => {
    const result = isDAG([
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
    ]);
    expect(isOk(result)).toBe(true);
  });

  it("three-node cycle is not a DAG", () => {
    const result = isDAG([
      [1, 2],
      [2, 3],
      [3, 1],
    ]);
    expect(isResultError(result)).toBe(true);
    if (isResultError(result)) {
      expect(result.message).toBe("Circular subscription detected");
    }
  });

  it("single edge is a DAG", () => {
    const result = isDAG([[1, 2]]);
    expect(isOk(result)).toBe(true);
  });
});
