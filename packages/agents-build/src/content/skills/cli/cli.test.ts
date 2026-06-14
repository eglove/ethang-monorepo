import { describe, expect, it } from "vitest";

import { SKILLS } from "../index.ts";
import { esSkill } from "./es.ts";
import { jqSkill } from "./jq.ts";
import { rgSkill } from "./rg.ts";

const FORBIDDEN_WORD_TEST_NAME = "does not contain forbidden word 'Angular'";
const CONTENT_LENGTH_TEST_NAME =
  "does not exceed 12,000 characters in content length";
const VALID_NAME_TEST_NAME = "has valid name and description";

describe("CLI skills content and configuration", () => {
  describe("integration", () => {
    it("is present in SKILLS array", () => {
      expect(SKILLS).toContain(esSkill);
      expect(SKILLS).toContain(jqSkill);
      expect(SKILLS).toContain(rgSkill);
    });
  });

  describe("esSkill", () => {
    it(VALID_NAME_TEST_NAME, () => {
      expect(esSkill.name).toBe("es-cli");
      expect(esSkill.description).toContain("Everything Search CLI");
    });

    it(CONTENT_LENGTH_TEST_NAME, () => {
      expect(esSkill.content.length).toBeLessThanOrEqual(12_000);
    });

    it(FORBIDDEN_WORD_TEST_NAME, () => {
      expect(/angular/iu.test(esSkill.content)).toBe(false);
    });

    it("contains key CLI parameters", () => {
      expect(esSkill.content).toContain("es [options]");
      expect(esSkill.content).toContain("/ad");
      expect(esSkill.content).toContain("-json");
    });
  });

  describe("jqSkill", () => {
    it(VALID_NAME_TEST_NAME, () => {
      expect(jqSkill.name).toBe("jq-cli");
      expect(jqSkill.description).toContain(
        "Process, filter, and format JSON data using jq"
      );
    });

    it(CONTENT_LENGTH_TEST_NAME, () => {
      expect(jqSkill.content.length).toBeLessThanOrEqual(12_000);
    });

    it(FORBIDDEN_WORD_TEST_NAME, () => {
      expect(/angular/iu.test(jqSkill.content)).toBe(false);
    });

    it("contains key CLI options and examples", () => {
      expect(jqSkill.content).toContain("jq [options] <jq filter>");
      expect(jqSkill.content).toContain("--null-input");
      expect(jqSkill.content).toContain("pnpm-workspace.yaml");
    });
  });

  describe("rgSkill", () => {
    it(VALID_NAME_TEST_NAME, () => {
      expect(rgSkill.name).toBe("rg-cli");
      expect(rgSkill.description).toContain(
        "Recursively search files and directories using ripgrep"
      );
    });

    it(CONTENT_LENGTH_TEST_NAME, () => {
      expect(rgSkill.content.length).toBeLessThanOrEqual(12_000);
    });

    it(FORBIDDEN_WORD_TEST_NAME, () => {
      expect(/angular/iu.test(rgSkill.content)).toBe(false);
    });

    it("contains key CLI patterns and examples", () => {
      expect(rgSkill.content).toContain("rg [options] PATTERN");
      expect(rgSkill.content).toContain("--ignore-case");
      expect(rgSkill.content).toContain("antigravity");
    });
  });
});
