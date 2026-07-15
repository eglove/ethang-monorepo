import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  getFirstParameterName,
  getValueReturnedInFirstStatement,
  isExplicitPropertyFunction,
  isLodashPropertyCall,
  isMemberExpressionOf,
  isStringLiteral
} from "./property-shorthand.ts";

const mockNode = <T extends TSESTree.Node>(
  type: AST_NODE_TYPES | T["type"],
  properties: Partial<T> = {}
) => {
  return { type, ...properties } as unknown as T;
};

describe("getValueReturnedInFirstStatement", () => {
  it("returns body for arrow with expression body", () => {
    const body = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      { body }
    );
    expect(getValueReturnedInFirstStatement(node)).toBe(body);
  });

  it("returns null for arrow with empty block", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        body: mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
          body: []
        })
      }
    );
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns argument for arrow with return statement", () => {
    const argument = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        body: mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
          body: [
            mockNode<TSESTree.ReturnStatement>(AST_NODE_TYPES.ReturnStatement, {
              argument
            })
          ]
        })
      }
    );
    expect(getValueReturnedInFirstStatement(node)).toBe(argument);
  });

  it("returns null for arrow with bare return", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        body: mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
          body: [
            mockNode<TSESTree.ReturnStatement>(AST_NODE_TYPES.ReturnStatement, {
              argument: null
            })
          ]
        })
      }
    );
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns null for arrow block with non-return first statement", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        body: mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
          body: [
            mockNode<TSESTree.ExpressionStatement>(
              AST_NODE_TYPES.ExpressionStatement,
              {}
            )
          ]
        })
      }
    );
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns null for function expression with non-return first statement", () => {
    const node = mockNode<TSESTree.FunctionExpression>(
      AST_NODE_TYPES.FunctionExpression,
      {
        body: mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
          body: [
            mockNode<TSESTree.ExpressionStatement>(
              AST_NODE_TYPES.ExpressionStatement,
              {}
            )
          ]
        })
      }
    );
    expect(getValueReturnedInFirstStatement(node)).toBeNull();
  });

  it("returns argument for function expression with return statement", () => {
    const argument = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    const node = mockNode<TSESTree.FunctionExpression>(
      AST_NODE_TYPES.FunctionExpression,
      {
        body: mockNode<TSESTree.BlockStatement>(AST_NODE_TYPES.BlockStatement, {
          body: [
            mockNode<TSESTree.ReturnStatement>(AST_NODE_TYPES.ReturnStatement, {
              argument
            })
          ]
        })
      }
    );
    expect(getValueReturnedInFirstStatement(node)).toBe(argument);
  });
});

describe("getFirstParameterName", () => {
  it("returns null for null node", () => {
    expect(getFirstParameterName(null)).toBeNull();
  });

  it("returns null for non-function node", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(getFirstParameterName(node)).toBeNull();
  });

  it("returns null for function with no params", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      { params: [] }
    );
    expect(getFirstParameterName(node)).toBeNull();
  });

  it("returns null for function with non-identifier first param", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        params: [
          mockNode<TSESTree.ObjectPattern>(AST_NODE_TYPES.ObjectPattern, {})
        ]
      }
    );
    expect(getFirstParameterName(node)).toBeNull();
  });

  it("returns name for function with identifier first param", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        params: [
          mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
            name: "x"
          })
        ]
      }
    );
    expect(getFirstParameterName(node)).toBe("x");
  });
});

describe("isMemberExpressionOf", () => {
  it("returns false for null node", () => {
    expect(isMemberExpressionOf(null, "x")).toBeFalsy();
  });

  it("returns false for null parameterName", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(isMemberExpressionOf(node, null)).toBeFalsy();
  });

  it("returns false for non-member-expression node", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(isMemberExpressionOf(node, "x")).toBeFalsy();
  });

  it("returns false for computed member expression", () => {
    const object = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    const property = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "key"
    });
    const node = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: true,
        object,
        property
      }
    );
    expect(isMemberExpressionOf(node, "x")).toBeFalsy();
  });

  it("returns true for simple member expression matching parameter", () => {
    const object = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    const property = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "name"
    });
    const node = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object,
        property
      }
    );
    expect(isMemberExpressionOf(node, "x")).toBeTruthy();
  });

  it("returns false for simple member expression with non-matching object", () => {
    const object = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "y"
    });
    const property = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "name"
    });
    const node = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object,
        property
      }
    );
    expect(isMemberExpressionOf(node, "x")).toBeFalsy();
  });

  it("returns true for nested member expression", () => {
    const innerObject = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        name: "x"
      }
    );
    const innerProperty = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        name: "user"
      }
    );
    const inner = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object: innerObject,
        property: innerProperty
      }
    );
    const outerProperty = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        name: "name"
      }
    );
    const outer = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object: inner,
        property: outerProperty
      }
    );
    expect(isMemberExpressionOf(outer, "x")).toBeTruthy();
  });
});

describe("isExplicitPropertyFunction", () => {
  it("returns false for null iteratee", () => {
    expect(isExplicitPropertyFunction(null)).toBeFalsy();
  });

  it("returns false for non-function iteratee", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(isExplicitPropertyFunction(node)).toBeFalsy();
  });

  it("returns false for function with no params", () => {
    const node = mockNode<TSESTree.ArrowFunctionExpression>(
      AST_NODE_TYPES.ArrowFunctionExpression,
      {
        body: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "x"
        }),
        params: []
      }
    );
    expect(isExplicitPropertyFunction(node)).toBeFalsy();
  });
});

describe("isLodashPropertyCall", () => {
  it("returns false for null iteratee", () => {
    expect(isLodashPropertyCall(null)).toBeFalsy();
  });

  it("returns false for non-call expression", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(isLodashPropertyCall(node)).toBeFalsy();
  });

  it("returns false for call with non-member callee", () => {
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        callee: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "foo"
        })
      }
    );
    expect(isLodashPropertyCall(node)).toBeFalsy();
  });

  it("returns false for member call with non-identifier object", () => {
    const innerObject = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        name: "bar"
      }
    );
    const innerProperty = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        name: "baz"
      }
    );
    const object = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object: innerObject,
        property: innerProperty
      }
    );
    const property = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "property"
    });
    const callee = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object,
        property
      }
    );
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        callee
      }
    );
    expect(isLodashPropertyCall(node)).toBeFalsy();
  });

  it("returns false for member call with non-identifier property", () => {
    const object = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "_"
    });
    const propertyLiteral = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "property"
    });
    const callee = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: true,
        object,
        property: propertyLiteral
      }
    );
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        callee
      }
    );
    expect(isLodashPropertyCall(node)).toBeFalsy();
  });

  it("returns false for non-lodash member call", () => {
    const object = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "foo"
    });
    const property = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "property"
    });
    const callee = mockNode<TSESTree.MemberExpression>(
      AST_NODE_TYPES.MemberExpression,
      {
        computed: false as const,
        object,
        property
      }
    );
    const node = mockNode<TSESTree.CallExpression>(
      AST_NODE_TYPES.CallExpression,
      {
        callee
      }
    );
    expect(isLodashPropertyCall(node)).toBeFalsy();
  });
});

describe("isStringLiteral", () => {
  it("returns true for string literal", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "name"
    });
    expect(isStringLiteral(node)).toBeTruthy();
  });

  it("returns false for non-string literal", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: 42
    });
    expect(isStringLiteral(node)).toBeFalsy();
  });

  it("returns false for null", () => {
    expect(isStringLiteral(null)).toBeFalsy();
  });

  it("returns false for non-literal node", () => {
    const node = mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
      name: "x"
    });
    expect(isStringLiteral(node)).toBeFalsy();
  });
});
