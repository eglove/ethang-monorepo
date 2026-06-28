import { Schema } from "effect";
import noop from "lodash/noop.js";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { PlanOutputSchema, type PlanSection, writePlan } from "./write-plan.js";

describe("writePlan", () => {
  const outputDirectory = tmpdir();

  afterAll(async () => {
    // Safety net: clean up any plan.md/plan.json left at the project root
    await unlink(path.resolve("plan.md")).catch(noop);
    await unlink(path.resolve("plan.json")).catch(noop);
  });

  it("writes both markdown and JSON files", async () => {
    const sections: PlanSection[] = [
      { content: "Intro content.", title: "Intro" },
      { content: "Details content.", title: "Details" }
    ];
    const result = await writePlan(
      sections,
      path.join(outputDirectory, "test.md")
    );

    expect(result.markdownPath).toBe(path.join(outputDirectory, "test.md"));
    expect(result.jsonPath).toBe(path.join(outputDirectory, "test.json"));
  });

  it("writes markdown with correct structure", async () => {
    const sections: PlanSection[] = [
      { content: "This is the overview.", title: "Overview" }
    ];
    const result = await writePlan(
      sections,
      path.join(outputDirectory, "plan.md")
    );

    const markdown = await readFile(result.markdownPath);
    expect(markdown).toContain("# Plan");
    expect(markdown).toContain("## Overview");
    expect(markdown).toContain("This is the overview.");
  });

  it("writes JSON that conforms to PlanOutputSchema", async () => {
    const sections: PlanSection[] = [
      { content: "Do the thing.", title: "Step 1" }
    ];
    const result = await writePlan(
      sections,
      path.join(outputDirectory, "plan.md")
    );

    const json = await readFile(result.jsonPath);
    const parsed = JSON.parse(json);
    const decoded = Schema.decodeUnknownSync(PlanOutputSchema)(parsed);

    expect(decoded.sections).toHaveLength(1);
    expect(decoded.sections[0]?.title).toBe("Step 1");
    expect(decoded.generatedAt).toBeDefined();
  });

  it("uses default path when outputPath is undefined", async () => {
    const sections: PlanSection[] = [
      { content: "Test content.", title: "Test" }
    ];
    const result = await writePlan(sections);

    expect(result.markdownPath).toBe(path.resolve("plan.md"));
    expect(result.jsonPath).toBe(path.resolve("plan.json"));

    // Clean up files written to the project root
    await unlink(result.markdownPath);
    await unlink(result.jsonPath);
  });

  it("handles empty sections array", async () => {
    const result = await writePlan([], path.join(outputDirectory, "empty.md"));

    const markdown = await readFile(result.markdownPath);
    expect(markdown).toContain("# Plan");
    expect(markdown).not.toContain("## ");
  });
});

async function readFile(filePath: string): Promise<string> {
  const { readFile: fsReadFile } = await import("node:fs/promises");
  return fsReadFile(filePath, "utf8");
}
