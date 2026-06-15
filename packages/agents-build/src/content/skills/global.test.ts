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
});
