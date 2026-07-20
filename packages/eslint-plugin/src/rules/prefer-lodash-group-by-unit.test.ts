import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectGroupByPattern } from "./prefer-lodash-group-by.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";

describe("prefer-lodash-group-by", () => {
  describe("detectGroupByPattern", () => {
    it("detects reduce with (acc[item.category] ||= []).push(item) pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {})"
      );
      expect(detectGroupByPattern(call)).not.toBeNull();
    });

    it("detects reduce with (acc[item.key] ||= []).push(item) pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { (acc[item.key] ||= []).push(item); return acc; }, {})"
      );
      expect(detectGroupByPattern(call)).not.toBeNull();
    });

    it("does not detect reduce with keyBy pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.key] = item; return acc; }, {})"
      );
      expect(detectGroupByPattern(call)).toBeNull();
    });

    it("does not detect reduce with countBy pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc[item.key] = (acc[item.key] || 0) + 1; return acc; }, {})"
      );
      expect(detectGroupByPattern(call)).toBeNull();
    });

    it("does not detect reduce with different accumulator pattern", () => {
      const { call } = findCall(
        "const x = arr.reduce((acc, item) => { acc.push(item); return acc; }, [])"
      );
      expect(detectGroupByPattern(call)).toBeNull();
    });

    it("does not detect non-reduce call", () => {
      const { call } = findCall("const x = arr.map(item => item * 2)");
      expect(detectGroupByPattern(call)).toBeNull();
    });

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(
        program,
        (n): n is TSESTree.MemberExpression => n.type === "MemberExpression"
      );
      expect(member).not.toBeNull();
      if (member) {
        expect(detectGroupByPattern(member)).toBeNull();
      }
    });
  });
});
