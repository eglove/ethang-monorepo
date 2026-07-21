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

    it("does not detect non-call expression", () => {
      const program = parseProgram("const x = arr.length;");
      const member = findFirstNode(program, isMemberExpression);
      expect(member).not.toBeNull();
      if (member) {
        expect(detectGroupByPattern(member)).toBeNull();
      }
    });

    // Additional branch coverage
    it.each([
      {
        code: "const x = arr.map(item => item * 2)",
        label: "non-reduce call expression"
      },
      {
        code: "const x = arr.reduce((acc, item) => { (acc[other.key] ||= []).push(item); return acc; }, {})",
        label:
          "member expression object is not the item parameter (isItemProperty name mismatch)"
      },
      {
        code: "const x = arr.reduce((acc, item) => acc, {})",
        label:
          "callback body is not a BlockStatement (validateCallbackStructure early return)"
      },
      {
        code: "const x = arr.reduce(someVar, {})",
        label: "first argument is not a callback (callbackInfo null)"
      },
      {
        code: "const x = arr.reduce((acc, item) => { const temp = 1; return acc; }, {})",
        label: "first statement is not an ExpressionStatement"
      },
      {
        code: "const x = arr.reduce((acc, { key }) => { (acc[item.key] ||= []).push(item); return acc; }, {})",
        label:
          "callback params include destructured param (covers validateCallbackStructure hasTwoIdentifierParameters fail)"
      },
      {
        code: "const x = arr.reduce((acc, item) => { (acc[item.key] ||= []).push(other); return acc; }, {})",
        label: "push argument is not the item identifier"
      },
      {
        code: "const x = arr.reduce((acc, item) => { acc[item.key] = []; return acc; }, {})",
        label:
          "assignment operator is not ||= (covers getAssignmentKey operator check)"
      },
      {
        code: "const x = arr.reduce((acc, item) => { (acc[item.key] ||= [1]).push(item); return acc; }, {})",
        label:
          "right side of ||= is not an empty array (covers isEmptyArray fail)"
      }
    ])("returns null when $label", ({ code }) => {
      const { call } = findCall(code);
      expect(detectGroupByPattern(call)).toBeNull();
    });
  });
});
