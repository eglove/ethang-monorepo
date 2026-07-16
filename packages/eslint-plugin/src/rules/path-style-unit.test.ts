import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  convertToArrayStyle,
  convertToStringStyle,
  findQuasiAfterIndex,
  getPathArgumentIndex,
  isAdjacentToPropertyAccessInTemplate,
  isArrayOfLiterals,
  isStringConcatWithVariableProperties,
  isTemplateLiteralWithVariableProperties,
  pathStyleRule
} from "./path-style.ts";

const mockNode = <T extends TSESTree.Node>(
  type: T["type"],
  properties: Partial<T> = {}
) => {
  return { type, ...properties } as unknown as T;
};

describe("getPathArgumentIndex", () => {
  it("returns 1 for regular path methods", () => {
    expect(getPathArgumentIndex("get")).toBe(1);
  });

  it("returns 1 for has", () => {
    expect(getPathArgumentIndex("has")).toBe(1);
  });

  it("returns 1 for set", () => {
    expect(getPathArgumentIndex("set")).toBe(1);
  });

  it("returns 0 for property", () => {
    expect(getPathArgumentIndex("property")).toBe(0);
  });

  it("returns 0 for matchesProperty", () => {
    expect(getPathArgumentIndex("matchesProperty")).toBe(0);
  });

  it("returns -1 for non-path methods", () => {
    expect(getPathArgumentIndex("map")).toBe(-1);
  });

  it("returns -1 for unknown methods", () => {
    expect(getPathArgumentIndex("unknownMethod")).toBe(-1);
  });
});

describe("isArrayOfLiterals", () => {
  it("returns true for array of string literals", () => {
    const node = mockNode<TSESTree.ArrayExpression>(
      AST_NODE_TYPES.ArrayExpression,
      {
        elements: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "a" }),
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "b" })
        ]
      }
    );
    expect(isArrayOfLiterals(node)).toBe(true);
  });

  it("returns false for non-array node", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "a"
    });
    expect(isArrayOfLiterals(node)).toBe(false);
  });

  it("returns false for array with non-literal elements", () => {
    const node = mockNode<TSESTree.ArrayExpression>(
      AST_NODE_TYPES.ArrayExpression,
      {
        elements: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "a" }),
          mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
            name: "x"
          })
        ]
      }
    );
    expect(isArrayOfLiterals(node)).toBe(false);
  });
});

describe("isStringConcatWithVariableProperties", () => {
  it("returns false for non-binary expression", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "a"
    });
    expect(isStringConcatWithVariableProperties(node)).toBe(false);
  });

  it("returns false for binary expression with wrong operator", () => {
    const node = mockNode<TSESTree.BinaryExpression>(
      AST_NODE_TYPES.BinaryExpression,
      {
        left: mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
          value: "a."
        }),
        operator: "-",
        right: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "x"
        })
      }
    );
    expect(isStringConcatWithVariableProperties(node)).toBe(false);
  });

  it("returns false for binary expression with neither side ending/starting with property access", () => {
    const node = mockNode<TSESTree.BinaryExpression>(
      AST_NODE_TYPES.BinaryExpression,
      {
        left: mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
          value: "a"
        }),
        operator: "+",
        right: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "x"
        })
      }
    );
    expect(isStringConcatWithVariableProperties(node)).toBe(false);
  });

  it("returns false for binary expression with empty string literal left side", () => {
    const node = mockNode<TSESTree.BinaryExpression>(
      AST_NODE_TYPES.BinaryExpression,
      {
        left: mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "" }),
        operator: "+",
        right: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "x"
        })
      }
    );
    expect(isStringConcatWithVariableProperties(node)).toBe(false);
  });

  it("returns false for binary expression with empty string literal right side", () => {
    const node = mockNode<TSESTree.BinaryExpression>(
      AST_NODE_TYPES.BinaryExpression,
      {
        left: mockNode<TSESTree.Identifier>(AST_NODE_TYPES.Identifier, {
          name: "x"
        }),
        operator: "+",
        right: mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "" })
      }
    );
    expect(isStringConcatWithVariableProperties(node)).toBe(false);
  });
});

describe("isTemplateLiteralWithVariableProperties", () => {
  it("returns false for non-template literal", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "a"
    });
    expect(isTemplateLiteralWithVariableProperties(node)).toBe(false);
  });
});

describe("convertToStringStyle", () => {
  it("converts array of string literals to dot notation", () => {
    const node = mockNode<TSESTree.ArrayExpression>(
      AST_NODE_TYPES.ArrayExpression,
      {
        elements: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "a" }),
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "b" })
        ]
      }
    );
    expect(convertToStringStyle(node)).toBe("'a.b'");
  });

  it("converts array with numeric index to bracket notation", () => {
    const node = mockNode<TSESTree.ArrayExpression>(
      AST_NODE_TYPES.ArrayExpression,
      {
        elements: [
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "a" }),
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: 0 }),
          mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, { value: "b" })
        ]
      }
    );
    expect(convertToStringStyle(node)).toBe("'a[0].b'");
  });

  it("returns empty string for null elements", () => {
    const node = mockNode<TSESTree.ArrayExpression>(
      AST_NODE_TYPES.ArrayExpression,
      {
        elements: [null]
      }
    );
    expect(convertToStringStyle(node)).toBe("''");
  });
});

describe("convertToArrayStyle", () => {
  it("converts string path to array", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "a.b"
    });
    expect(convertToArrayStyle(node)).toBe("['a', 'b']");
  });

  it("converts string path with bracket notation", () => {
    const node = mockNode<TSESTree.Literal>(AST_NODE_TYPES.Literal, {
      value: "a[0].b"
    });
    expect(convertToArrayStyle(node)).toBe("['a', '0', 'b']");
  });
});

describe("pathStyleRule metadata", () => {
  it("has correct type and fixable", () => {
    expect(pathStyleRule.meta.type).toBe("suggestion");
    expect(pathStyleRule.meta.fixable).toBe("code");
  });
});

describe("findQuasiAfterIndex", () => {
  it("returns -1 when no quasi is after expressionEnd", () => {
    const quasis = [
      mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
        range: [0, 2]
      }),
      mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
        range: [3, 5]
      })
    ];
    expect(findQuasiAfterIndex(10, quasis)).toBe(-1);
  });

  it("returns index of first quasi after expressionEnd", () => {
    const quasis = [
      mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
        range: [0, 2]
      }),
      mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
        range: [5, 8]
      })
    ];
    expect(findQuasiAfterIndex(3, quasis)).toBe(1);
  });

  it("returns 0 when first quasi is after expressionEnd", () => {
    const quasis = [
      mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
        range: [10, 12]
      })
    ];
    expect(findQuasiAfterIndex(5, quasis)).toBe(0);
  });
});

describe("isAdjacentToPropertyAccessInTemplate", () => {
  it("returns false when no quasi is after expression", () => {
    const expression = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        range: [10, 11]
      }
    );
    const literal = mockNode<TSESTree.TemplateLiteral>(
      AST_NODE_TYPES.TemplateLiteral,
      {
        expressions: [expression],
        quasis: [
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [0, 2],
            value: { cooked: "a.", raw: "a." }
          })
        ]
      }
    );
    expect(isAdjacentToPropertyAccessInTemplate(expression, literal)).toBe(
      false
    );
  });

  it("returns true when quasi before expression ends with property access", () => {
    const expression = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        range: [3, 4]
      }
    );
    const literal = mockNode<TSESTree.TemplateLiteral>(
      AST_NODE_TYPES.TemplateLiteral,
      {
        expressions: [expression],
        quasis: [
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [0, 2],
            value: { cooked: "a.", raw: "a." }
          }),
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [5, 8],
            value: { cooked: "b", raw: "b" }
          })
        ]
      }
    );
    expect(isAdjacentToPropertyAccessInTemplate(expression, literal)).toBe(
      true
    );
  });

  it("returns true when quasi after expression starts with property access", () => {
    const expression = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        range: [3, 4]
      }
    );
    const literal = mockNode<TSESTree.TemplateLiteral>(
      AST_NODE_TYPES.TemplateLiteral,
      {
        expressions: [expression],
        quasis: [
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [0, 2],
            value: { cooked: "a", raw: "a" }
          }),
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [5, 8],
            value: { cooked: ".b", raw: ".b" }
          })
        ]
      }
    );
    expect(isAdjacentToPropertyAccessInTemplate(expression, literal)).toBe(
      true
    );
  });

  it("returns false when neither quasi matches property access pattern", () => {
    const expression = mockNode<TSESTree.Identifier>(
      AST_NODE_TYPES.Identifier,
      {
        range: [3, 4]
      }
    );
    const literal = mockNode<TSESTree.TemplateLiteral>(
      AST_NODE_TYPES.TemplateLiteral,
      {
        expressions: [expression],
        quasis: [
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [0, 2],
            value: { cooked: "a", raw: "a" }
          }),
          mockNode<TSESTree.TemplateElement>(AST_NODE_TYPES.TemplateElement, {
            range: [5, 8],
            value: { cooked: "b", raw: "b" }
          })
        ]
      }
    );
    expect(isAdjacentToPropertyAccessInTemplate(expression, literal)).toBe(
      false
    );
  });
});
