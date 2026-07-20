import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectCountByPattern } from "./prefer-lodash-count-by.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-lodash-count-by", () => {
  describe("detectCountByPattern", () => {
    it("detects reduce with acc[item.key] = (acc[item.key] || 0) + 1 pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {})"
      );
      expect(detectCountByPattern(call)).not.toBeNull();
    });

    it("detects reduce with acc[item.category] = (acc[item.category] || 0) + 1 pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc; }, {})"
      );
      expect(detectCountByPattern(call)).not.toBeNull();
    });

    it("does not detect reduce with keyBy pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {})"
      );
      expect(detectCountByPattern(call)).toBeNull();
    });

    it("does not detect reduce with groupBy pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {})"
      );
      expect(detectCountByPattern(call)).toBeNull();
    });

    it("does not detect reduce with different accumulator pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, [])"
      );
      expect(detectCountByPattern(call)).toBeNull();
    });

    it("does not detect non-reduce call", () => {
      const { call } = findCall("const x = arr.map(item => item * 2)");
      expect(detectCountByPattern(call)).toBeNull();
    });

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(
        program,
        (n): n is TSESTree.MemberExpression => n.type === "MemberExpression"
      );
      expect(member).not.toBeNull();
      if (member) {
        expect(detectCountByPattern(member)).toBeNull();
      }
    });
  });
});
