import { describe, expect, it } from "vitest";

import { createConnection } from "./pagination.ts";

describe("createConnection", () => {
  it("should create a connection object with correct edges and pageInfo", () => {
    const items = [
      { id: "1", value: "item-1" },
      { id: "2", value: "item-2" }
    ];

    const result = createConnection(items, true);

    expect(result).toStrictEqual({
      edges: [
        { cursor: "1", node: { id: "1", value: "item-1" } },
        { cursor: "2", node: { id: "2", value: "item-2" } }
      ],
      pageInfo: {
        endCursor: "2",
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: "1"
      }
    });
  });

  it("should handle empty items array", () => {
    const result = createConnection([], false);

    expect(result).toStrictEqual({
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null
      }
    });
  });
});
