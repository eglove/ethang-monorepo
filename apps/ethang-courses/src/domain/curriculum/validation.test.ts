import { describe, expect, it } from "vitest";

import type { Curriculum } from "./state.ts";

describe("Curriculum aggregate invariants", () => {
  it("creates a valid curriculum with name and url", () => {
    const curriculum: Curriculum = {
      curriculumId: "cur-1",
      learningPathIds: ["lp-1", "lp-2"],
      name: "Test Curriculum",
      url: "https://example.com/curriculum"
    };

    expect(curriculum.curriculumId).toBe("cur-1");
    expect(curriculum.learningPathIds).toStrictEqual(["lp-1", "lp-2"]);
    expect(curriculum.name).toBe("Test Curriculum");
    expect(curriculum.url).toBe("https://example.com/curriculum");
  });

  it("handles null url and empty learning paths", () => {
    const curriculum: Curriculum = {
      curriculumId: "cur-2",
      learningPathIds: [],
      name: "Empty Curriculum",
      url: null
    };

    expect(curriculum.curriculumId).toBe("cur-2");
    expect(curriculum.learningPathIds).toStrictEqual([]);
    expect(curriculum.name).toBe("Empty Curriculum");
    expect(curriculum.url).toBeNull();
  });
});
