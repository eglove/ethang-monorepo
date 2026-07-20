import { describe, expect, it } from "vitest";

import { isMemberExpression } from "./../utils/type-guards.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";
import { detectCountByPattern } from "./prefer-lodash-count-by.ts";

describe("prefer-lodash-count-by", () => {
  describe("detectCountByPattern", () => {
    it.each([
      ["acc[item.key] = (acc[item.key] || 0) + 1", true],
      ["acc[item.category] = (acc[item.category] || 0) + 1", true]
    ])("detects countBy pattern for '%s", (code) => {
      const { call } = findCall(
        `const x = arr.reduce((acc, item) => { ${code}; return acc; }, {})`
      );
      expect(detectCountByPattern(call)).not.toBeNull();
    });

    it.each([
      ["acc[item.key] = item"],
      ["(acc[item.category] ||= []).push(item)"],
      ["acc.push(item)"]
    ])("does not detect non-countBy reduce pattern for '%s", (code) => {
      const { call } = findCall(
        `const x = arr.reduce((acc, item) => { ${code}; return acc; }, {})`
      );
      expect(detectCountByPattern(call)).toBeNull();
    });

    it("does not detect non-reduce call expression", () => {
      const { call } = findCall("const x = arr.map(item => item * 2)");
      expect(detectCountByPattern(call)).toBeNull();
    });

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(program, isMemberExpression);
      expect(member).not.toBeNull();
      if (member) {
        expect(detectCountByPattern(member)).toBeNull();
      }
    });
  });
});
