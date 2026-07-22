import { describe, expect, it } from "vitest";

import { isMemberExpression } from "./../utils/type-guards.ts";
import { findCall, findFirstNode, parseProgram } from "./.fixture.ts";
import { detectKeyByPattern } from "./prefer-lodash-key-by.ts";

describe("prefer-lodash-key-by", () => {
  describe("detectKeyByPattern", () => {
    it.each([
      ["acc[item.key] = item", true],
      ["acc[item.id] = item", true]
    ])("detects keyBy pattern for '%s'", (code) => {
      const { call } = findCall(
        `const x = arr.reduce((acc, item) => { ${code}; return acc; }, {})`
      );
      expect(detectKeyByPattern(call)).not.toBeNull();
    });

    it.each([
      ["acc.push(item)"],
      ["acc[item.key] = (acc[item.key] || 0) + 1"],
      ["(acc[item.category] ||= []).push(item)"]
    ])("does not detect non-keyBy reduce pattern for '%s", (code) => {
      const { call } = findCall(
        `const x = arr.reduce((acc, item) => { ${code}; return acc; }, {})`
      );
      expect(detectKeyByPattern(call)).toBeNull();
    });

    it("does not detect non-reduce call expression", () => {
      const { call } = findCall("const x = arr.map(item => item * 2)");
      expect(detectKeyByPattern(call)).toBeNull();
    });

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(program, isMemberExpression);
      expect(member).not.toBeNull();
      if (member) {
        expect(detectKeyByPattern(member)).toBeNull();
      }
    });
  });
});
