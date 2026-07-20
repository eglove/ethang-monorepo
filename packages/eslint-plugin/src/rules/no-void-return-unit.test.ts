import { type TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { detectVoidReturn } from "./no-void-return.ts";
import { findFirstNode, parseProgram } from "./.fixture.ts";

describe("no-void-return", () => {
  describe("detectVoidReturn", () => {
    it("detects 'return void 0'", () => {
      const program = parseProgram("return void 0;");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(true);
      }
    });

    it("detects 'return void(0)'", () => {
      const program = parseProgram("return void(0);");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(true);
      }
    });

    it("detects 'return void expr'", () => {
      const program = parseProgram("return void foo();");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(true);
      }
    });

    it("does not detect 'return undefined'", () => {
      const program = parseProgram("return undefined;");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(false);
      }
    });

    it("does not detect 'return'", () => {
      const program = parseProgram("return;");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(false);
      }
    });

    it("does not detect 'return 0'", () => {
      const program = parseProgram("return 0;");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(false);
      }
    });

    it("does not detect 'return voidExpr' where voidExpr is not a void expression", () => {
      const program = parseProgram("return someVar;");
      const stmt = findFirstNode(program, (n): n is TSESTree.ReturnStatement => n.type === "ReturnStatement");
      expect(stmt).not.toBeNull();
      if (stmt) {
        expect(detectVoidReturn(stmt)).toBe(false);
      }
    });
  });
});
