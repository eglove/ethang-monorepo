import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_SKILLS } from "./global.ts";

describe("GLOBAL_SKILLS verification", () => {
  it("should contain the sdlc-1 skill with valid properties", () => {
    const sdlc1 = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc-1" === skill.name;
    });

    expect(sdlc1).toBeDefined();
    expect(sdlc1?.name).toBe("sdlc-1");
    expect(sdlc1?.description).toContain("interview");
    expect(sdlc1?.content).toContain("Given-When-Then");
    expect(sdlc1?.content).toContain("sara");
  });

  it("should contain the sdlc-2 skill with valid properties", () => {
    const sdlc2 = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc-2" === skill.name;
    });

    expect(sdlc2).toBeDefined();
    expect(sdlc2?.name).toBe("sdlc-2");
    expect(sdlc2?.description).toContain("architecture");
    expect(sdlc2?.content).toContain("ddd-strategic");
    expect(sdlc2?.content).toContain("satisfies");
    expect(sdlc2?.content).toContain("Mermaid");
  });

  it("should contain the sdlc-3 skill with valid properties", () => {
    const sdlc3 = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc-3" === skill.name;
    });

    expect(sdlc3).toBeDefined();
    expect(sdlc3?.name).toBe("sdlc-3");
    expect(sdlc3?.description).toContain("TDD");
    expect(sdlc3?.content).toContain("Red-Green-Refactor");
    expect(sdlc3?.content).toContain("ESLint");
  });

  it("should contain the sdlc-4 skill with valid properties", () => {
    const sdlc4 = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc-4" === skill.name;
    });

    expect(sdlc4).toBeDefined();
    expect(sdlc4?.name).toBe("sdlc-4");
    expect(sdlc4?.description).toContain("Verification");
    expect(sdlc4?.content).toContain("FSM");
    expect(sdlc4?.content).toContain("coverage");
  });

  it("should contain the sdlc-5 skill with valid properties", () => {
    const sdlc5 = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc-5" === skill.name;
    });

    expect(sdlc5).toBeDefined();
    expect(sdlc5?.name).toBe("sdlc-5");
    expect(sdlc5?.description).toContain("Release");
    expect(sdlc5?.content).toContain("Conventional Commit");
    expect(sdlc5?.content).toContain("FSM");
  });

  it("should contain the sdlc-6 skill with valid properties", () => {
    const sdlc6 = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc-6" === skill.name;
    });

    expect(sdlc6).toBeDefined();
    expect(sdlc6?.name).toBe("sdlc-6");
    expect(sdlc6?.description).toContain("Troubleshooting");
    expect(sdlc6?.content).toContain("FSM");
    expect(sdlc6?.content).toContain("corrective");
  });
});
