import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { findFirstNode, parseProgram } from "./.fixture.ts";
import {
  detectDecodeBase64Pattern,
  detectEncodeBase64Pattern,
  detectEncodingBase64Pattern,
  getBase64BufferFromDataArgument,
  getFirstBufferFromArgument
} from "./prefer-effect-encoding-base64.ts";

const encodeSamples = [
  'Buffer.from(s).toString("base64")',
  'Buffer.from(name + "!").toString("base64")',
  'Buffer.from(getRaw()).toString("base64")'
];

const decodeSamples = [
  'Buffer.from(s, "base64").toString()',
  'Buffer.from(s, "base64").toString("utf8")'
];

const encodeNegatives = [
  { code: 'Buffer.from(s).toString("hex")', label: "a non-base64 toString" },
  {
    code: "Buffer.from(s).toString()",
    label: "Buffer.from with no toString arg"
  },
  {
    code: 'foo.toString("base64")',
    label: "toString on a non-Buffer receiver"
  },
  {
    code: 'new Buffer(s).toString("base64")',
    label: "new Buffer (not Buffer.from)"
  },
  {
    code: 'Buffer.from(s, "utf8").toString("base64")',
    label: "Buffer.from with two args (not a plain encode)"
  },
  {
    code: 'Buffer["from"](s).toString("base64")',
    label: "computed .from property"
  },
  {
    code: 'obj.from(s).toString("base64")',
    label: "non-Identifier callee.object"
  }
];

const decodeNegatives = [
  {
    code: 'Buffer.from(s, "utf8").toString()',
    label: "the inner encoding arg is not base64"
  },
  {
    code: 'Buffer.from(s, "base64").toString("hex")',
    label: "toString receives a non-utf8 encoding arg"
  },
  {
    code: 'Buffer.from(s).toString("base64")',
    label: "a bare Buffer.from encode call"
  }
];

const findCall = (code: string) => {
  const program = parseProgram(code);
  const call = findFirstNode(program, (n) => {
    return n.type === AST_NODE_TYPES.CallExpression;
  });
  if (!call) {
    throw new Error(`no call expression found in: ${code}`);
  }
  return { call, program };
};

describe("prefer-effect-encoding-base64", () => {
  describe("detectEncodeBase64Pattern", () => {
    it.each(encodeSamples)("detects encode shape %s", (code) => {
      const { call } = findCall(code);
      const result = detectEncodeBase64Pattern(call);
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("encode");
    });

    it.each(encodeNegatives)("returns null for $label", ({ code }) => {
      const { call } = findCall(code);
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });
  });

  describe("detectDecodeBase64Pattern", () => {
    it.each(decodeSamples)("detects decode shape %s", (code) => {
      const { call } = findCall(code);
      const result = detectDecodeBase64Pattern(call);
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("decode");
    });

    it.each(decodeNegatives)("returns null when $label", ({ code }) => {
      const { call } = findCall(code);
      expect(detectDecodeBase64Pattern(call)).toBeNull();
    });

    it("returns null for non-CallExpression in detectDecodeBase64Pattern (line 135)", () => {
      const program = parseProgram("x in y;");
      const binary = findFirstNode(program, (n) => {
        return n.type === AST_NODE_TYPES.BinaryExpression;
      });
      expect(binary).not.toBeNull();
      expect(binary && detectDecodeBase64Pattern(binary)).toBeNull();
    });
  });

  describe("detectEncodingBase64Pattern (combined)", () => {
    it.each(encodeSamples)("classifies encode %s", (code) => {
      const { call } = findCall(code);
      expect(detectEncodingBase64Pattern(call)?.kind).toBe("encode");
    });

    it.each(decodeSamples)("classifies decode %s", (code) => {
      const { call } = findCall(code);
      expect(detectEncodingBase64Pattern(call)?.kind).toBe("decode");
    });

    it("returns null for an unrelated call", () => {
      const { call } = findCall("arr.map((x) => x * 2)");
      expect(detectEncodingBase64Pattern(call)).toBeNull();
    });
  });

  describe("getFirstBufferFromArgument edge cases", () => {
    it("returns null when argument is a SpreadElement", () => {
      const spreadElement = {
        argument: {
          name: "arr",
          type: AST_NODE_TYPES.Identifier
        },
        type: AST_NODE_TYPES.SpreadElement
      } as unknown as TSESTree.SpreadElement;
      const arguments_ = [
        spreadElement
      ] as unknown as TSESTree.CallExpressionArgument[];
      expect(getFirstBufferFromArgument(arguments_)).toBeNull();
    });
  });

  describe("getBase64BufferFromDataArgument edge cases", () => {
    it("returns null when input is a SpreadElement", () => {
      const spreadElement = {
        argument: {
          name: "arr",
          type: AST_NODE_TYPES.Identifier
        },
        type: AST_NODE_TYPES.SpreadElement
      } as unknown as TSESTree.SpreadElement;
      const innerEncoding = {
        type: AST_NODE_TYPES.Literal,
        value: "base64"
      } as unknown as TSESTree.Literal;
      const arguments_ = [
        spreadElement,
        innerEncoding
      ] as unknown as TSESTree.CallExpressionArgument[];
      expect(getBase64BufferFromDataArgument(arguments_)).toBeNull();
    });

    it("returns null when innerEncoding is not 'base64'", () => {
      const input = {
        name: "s",
        type: AST_NODE_TYPES.Identifier
      } as unknown as TSESTree.Identifier;
      const innerEncoding = {
        type: AST_NODE_TYPES.Literal,
        value: "utf8"
      } as unknown as TSESTree.Literal;
      const arguments_ = [
        input,
        innerEncoding
      ] as unknown as TSESTree.CallExpressionArgument[];
      expect(getBase64BufferFromDataArgument(arguments_)).toBeNull();
    });
  });
});
