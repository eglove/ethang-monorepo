import { describe, expect, it } from "vitest";

import { isMemberExpression } from "./../utils/type-guards.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";
import { detectGroupByPattern } from "./prefer-lodash-group-by.ts";

describe("prefer-lodash-group-by", () => {
  describe("detectGroupByPattern", () => {
    it.each([
      ["(acc[item.category] ||= []).push(item)", true],
      ["(acc[item.key] ||= []).push(item)", true]
    ])("detects groupBy pattern for '%s'", (code) => {
      const { call } = findCall(
        `const x = arr.reduce((acc, item) => { ${code}; return acc; }, {})`
      );
      expect(detectGroupByPattern(call)).not.toBeNull();
    });

    it.each([
      ["acc[item.key] = item"],
      ["acc[item.key] = (acc[item.key] || 0) + 1"],
      ["acc.push(item)"]
    ])("does not detect non-groupBy reduce pattern for '%s", (code) => {
      const { call } = findCall(
        `const x = arr.reduce((acc, item) => { ${code}; return acc; }, {})`
      );
      expect(detectGroupByPattern(call)).toBeNull();
    });

    it("does not detect non-reduce call expression", () => {
      const { call } = findCall("const x = arr.map(item => item * 2)");
      expect(detectGroupByPattern(call)).toBeNull();
    });

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(program, isMemberExpression);
      expect(member).not.toBeNull();
      if (member) {
        expect(detectGroupByPattern(member)).toBeNull();
      }
    });
  });
});
