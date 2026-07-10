import find from "lodash/find.js";
import matches from "lodash/matches.js";
import { describe, expect, it } from "vitest";

import { GLOBAL_SKILLS } from "./global.ts";

describe("GLOBAL_SKILLS verification", () => {
  it("should contain the swebok skill with resources", () => {
    const swebok = find(GLOBAL_SKILLS, matches({ name: "swebok" }));

    expect(swebok).toBeDefined();
    expect(swebok?.name).toBe("swebok");
    expect(swebok?.resources).toBeDefined();
    expect(swebok?.resources?.length).toBe(110);
  });

  it("should contain the ddd skill with resources", () => {
    const dddSkill = find(GLOBAL_SKILLS, matches({ name: "ddd" }));

    expect(dddSkill).toBeDefined();
    expect(dddSkill?.name).toBe("ddd");
    expect(dddSkill?.resources).toBeDefined();
    expect(dddSkill?.resources?.length).toBe(6);
  });

  it("should have seven registered skills", () => {
    expect(GLOBAL_SKILLS).toHaveLength(7);
  });
});
