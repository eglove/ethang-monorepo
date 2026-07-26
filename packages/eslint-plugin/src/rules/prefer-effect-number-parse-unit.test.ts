import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";
import {
  detectNumberCoercion,
  detectParseFloat
} from "./prefer-effect-number-parse.ts";

const numberCoercionSamples = [
  "Number(s)",
  "Number(value)",
  'Number(str + "")',
  "Number(getValue())"
];

const parseFloatSamples = [
  "parseFloat(s)",
  "parseFloat(input)",
  "parseFloat(getValue())"
];

const numberCoercionNegatives = [
  {
    code: "Number.isNaN(s)",
    label: "Number.isNaN static method"
  },
  {
    code: "Number.isFinite(s)",
    label: "Number.isFinite static method"
  },
  {
    code: "Number.isInteger(s)",
    label: "Number.isInteger static method"
  },
  {
    code: "Number.isSafeInteger(s)",
    label: "Number.isSafeInteger static method"
  },
  {
    code: "Number.parse(s)",
    label: "Number.parse already"
  },
  {
    code: "String(5)",
    label: "String coercion"
  },
  {
    code: "Boolean(1)",
    label: "Boolean coercion"
  },
  {
    code: "Number()",
    label: "Number with no arguments"
  },
  {
    code: "Number(...args)",
    label: "Number with spread"
  },
  {
    code: "obj.Number(s)",
    label: "non-Identifier callee"
  },
  {
    code: "new Number(s)",
    label: "new Number constructor"
  }
];

const parseFloatNegatives = [
  {
    code: "parseInt(s)",
    label: "parseInt"
  },
  {
    code: "parseInt(s, 10)",
    label: "parseInt with radix"
  },
  {
    code: "parseFloat()",
    label: "parseFloat with no arguments"
  },
  {
    code: "parseFloat(...args)",
    label: "parseFloat with spread"
  },
  {
    code: "obj.parseFloat(s)",
    label: "non-Identifier callee"
  }
];

describe("prefer-effect-number-parse", () => {
  describe("detectNumberCoercion", () => {
    it.each(numberCoercionSamples)("detects Number coercion in %s", (code) => {
      const { call } = findCall(code);
      const result = detectNumberCoercion(call);
      expect(result).not.toBeNull();
    });

    it.each(numberCoercionNegatives)("returns null for $label", ({ code }) => {
      // For "new Number(s)" there's no CallExpression, so test directly
      if (code.startsWith("new Number")) {
        const program = parseProgram(code);
        const newExpression = findFirstNode(
          program,
          (n): n is TSESTree.NewExpression => {
            return AST_NODE_TYPES.NewExpression === n.type;
          }
        );
        expect(newExpression).not.toBeNull();
        expect(newExpression && detectNumberCoercion(newExpression)).toBeNull();
        return;
      }
      const { call } = findCall(code);
      expect(detectNumberCoercion(call)).toBeNull();
    });
  });

  describe("detectParseFloat", () => {
    it.each(parseFloatSamples)("detects parseFloat in %s", (code) => {
      const { call } = findCall(code);
      const result = detectParseFloat(call);
      expect(result).not.toBeNull();
    });

    it.each(parseFloatNegatives)("returns null for $label", ({ code }) => {
      const { call } = findCall(code);
      expect(detectParseFloat(call)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("returns null for non-CallExpression", () => {
      const program = parseProgram("x in y;");
      const binary = program.body[0];
      if (!binary) {
        return;
      }
      expect(detectNumberCoercion(binary)).toBeNull();
      expect(detectParseFloat(binary)).toBeNull();
    });

    it("returns null when argument is a SpreadElement", () => {
      const spreadElement = {
        argument: {
          name: "arr",
          type: AST_NODE_TYPES.Identifier
        },
        type: AST_NODE_TYPES.SpreadElement
      } as unknown as TSESTree.SpreadElement;
      const callWithSpread = {
        arguments: [spreadElement],
        callee: {
          name: "Number",
          type: AST_NODE_TYPES.Identifier
        },
        optional: false,
        type: AST_NODE_TYPES.CallExpression
      } as unknown as TSESTree.CallExpression;
      expect(detectNumberCoercion(callWithSpread)).toBeNull();
      expect(detectParseFloat(callWithSpread)).toBeNull();
    });
  });
});
