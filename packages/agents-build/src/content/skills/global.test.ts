import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_SKILLS } from "./global.ts";

describe("GLOBAL_SKILLS verification", () => {
  it("should contain only the sdlc skill with all 6 merged phases and subagent instructions", () => {
    const sdlc = find(GLOBAL_SKILLS, (skill) => {
      return "sdlc" === skill.name;
    });

    expect(sdlc).toBeDefined();
    expect(sdlc?.name).toBe("sdlc");
    expect(GLOBAL_SKILLS.length).toBe(1);

    const content = sdlc?.content ?? "";
    expect(content).toContain("Phase 1: Requirements & Analysis");
    expect(content).toContain("Phase 2: Architecture & Design");
    expect(content).toContain("Phase 3: Implementation & Development");
    expect(content).toContain("Phase 4: Verification & Testing");
    expect(content).toContain("Phase 5: Release & Deployment");
    expect(content).toContain("Phase 6: Maintenance & Operations");

    expect(content).toContain("execute all phases in the main window");
  });
});
