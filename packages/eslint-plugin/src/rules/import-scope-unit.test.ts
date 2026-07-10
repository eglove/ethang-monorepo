import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  getNameFromCjsRequire,
  importScopeRule,
  isFullLodashImport,
  isMethodImport,
  isMethodPackageImport
} from "./import-scope.ts";

const mockNode = <T extends TSESTree.Node>(
  type: T["type"],
  properties: Partial<T> = {}
): T => {
  return { type, ...properties } as unknown as T;
};

const LODASH = "lodash";
const LODASH_MAP = "lodash/map";
const LODASH_DOT_MAP = "lodash.map";
const LODASH_ES = "lodash-es";
const REQUIRE_FN = "require";

describe("isFullLodashImport", () => {
  it("returns true for lodash", () => {
    expect(isFullLodashImport(LODASH)).toBe(true);
  });

  it("returns true for lodash-es", () => {
    expect(isFullLodashImport(LODASH_ES)).toBe(true);
  });

  it("returns true for lodash with trailing slash", () => {
    expect(isFullLodashImport("lodash/")).toBe(true);
  });

  it("returns false for lodash/map", () => {
    expect(isFullLodashImport(LODASH_MAP)).toBe(false);
  });

  it("returns false for lodash.map", () => {
    expect(isFullLodashImport(LODASH_DOT_MAP)).toBe(false);
  });

  it("returns false for react", () => {
    expect(isFullLodashImport("react")).toBe(false);
  });
});

describe("isMethodImport", () => {
  it("returns true for lodash/map", () => {
    expect(isMethodImport(LODASH_MAP)).toBe(true);
  });

  it("returns true for lodash-es/map", () => {
    expect(isMethodImport("lodash-es/map")).toBe(true);
  });

  it("returns false for lodash.map (that is method-package)", () => {
    expect(isMethodImport(LODASH_DOT_MAP)).toBe(false);
  });

  it("returns false for lodash (that is full import)", () => {
    expect(isMethodImport(LODASH)).toBe(false);
  });

  it("returns false for lodash-es/fp (fp is excluded)", () => {
    expect(isMethodImport("lodash-es/fp")).toBe(false);
  });
});

describe("isMethodPackageImport", () => {
  it("returns true for lodash.map", () => {
    expect(isMethodPackageImport(LODASH_DOT_MAP)).toBe(true);
  });

  it("returns false for lodash/map (that is method import)", () => {
    expect(isMethodPackageImport(LODASH_MAP)).toBe(false);
  });

  it("returns false for lodash (that is full import)", () => {
    expect(isMethodPackageImport(LODASH)).toBe(false);
  });
});

describe("getNameFromCjsRequire", () => {
  it("returns the module name for a require call with string literal", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
            value: LODASH
          })
        ],
        callee: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: REQUIRE_FN
        })
      }
    );
    expect(getNameFromCjsRequire(node)).toBe(LODASH);
  });

  it("returns undefined when init is null", () => {
    expect(getNameFromCjsRequire(null)).toBeUndefined();
  });

  it("returns undefined when init is not a CallExpression", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "foo"
    });
    expect(getNameFromCjsRequire(node)).toBeUndefined();
  });

  it("returns undefined when callee is not an Identifier", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: LODASH })
        ],
        callee: mockNode<TSESTree.MemberExpression>(
          AST_NODE_TYPES.MemberExpression,
          {
            computed: false,
            object: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
              name: "foo"
            }),
            optional: false,
            property: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
              name: "bar"
            })
          }
        )
      }
    );
    expect(getNameFromCjsRequire(node)).toBeUndefined();
  });

  it("returns undefined when callee name is not require", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: LODASH })
        ],
        callee: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "notRequire"
        })
      }
    );
    expect(getNameFromCjsRequire(node)).toBeUndefined();
  });

  it("returns undefined when arguments length is not 1", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [],
        callee: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: REQUIRE_FN
        })
      }
    );
    expect(getNameFromCjsRequire(node)).toBeUndefined();
  });

  it("returns undefined when argument is not a Literal", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [
          mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
            name: "foo"
          })
        ],
        callee: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: REQUIRE_FN
        })
      }
    );
    expect(getNameFromCjsRequire(node)).toBeUndefined();
  });

  it("returns undefined when literal value is not a string", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        arguments: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: 42 })
        ],
        callee: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: REQUIRE_FN
        })
      }
    );
    expect(getNameFromCjsRequire(node)).toBeUndefined();
  });
});

describe("importScopeRule metadata", () => {
  it("has correct type", () => {
    expect(importScopeRule.meta.type).toBe("problem");
  });
});
