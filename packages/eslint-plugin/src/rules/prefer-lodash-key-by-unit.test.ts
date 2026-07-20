import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectKeyByPattern } from "./prefer-lodash-key-by.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-lodash-key-by", () => {
  describe("detectKeyByPattern", () => {
    it("detects reduce with acc[item.key] = item pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {})"
      );
      expect(detectKeyByPattern(call)).not.toBeNull();
    });

    it("detects reduce with acc[item.id] = item pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.id] = item; return acc; }, {})"
      );
      expect(detectKeyByPattern(call)).not.toBeNull();
    });

    it("does not detect reduce with different accumulator pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, [])"
      );
      expect(detectKeyByPattern(call)).toBeNull();
    });

    it("does not detect reduce with countBy pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {})"
      );
      expect(detectKeyByPattern(call)).toBeNull();
    });

    it("does not detect reduce with groupBy pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {})"
      );
      expect(detectKeyByPattern(call)).toBeNull();
    });

    it("does not detect non-reduce call", () => {
      const { call } = findCall("const x = arr.map(item => item * 2)");
      expect(detectKeyByPattern(call)).toBeNull();
    });

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(
        program,
        (n): n is TSESTree.MemberExpression => n.type === "MemberExpression"
      );
      expect(member).not.toBeNull();
      if (member) {
        expect(detectKeyByPattern(member)).toBeNull();
      }
    });
  });
});
