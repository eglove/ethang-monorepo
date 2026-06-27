import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { writePlan } from "./write-plan.js";

const appOverview = "App overview goes here.";

describe("writePlan", () => {
  it("writes markdown and JSON plan files with sections", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "plan-test-"));
    const outputPath = path.join(directory, "test-plan.md");
    const jsonOutputPath = path.join(directory, "test-plan.json");

    const sections = [
      { content: appOverview, title: "Overview" },
      { content: "- Step 1\n- Step 2", title: "Delivery Plan" }
    ];

    const result = await writePlan(sections, outputPath);
    expect(result.markdownPath).toBe(outputPath);
    expect(result.jsonPath).toBe(jsonOutputPath);

    // Verify markdown output
    const markdownContent = await readFile(outputPath, "utf8");
    expect(markdownContent).toContain("# Plan");
    expect(markdownContent).toContain("## Overview");
    expect(markdownContent).toContain(appOverview);
    expect(markdownContent).toContain("## Delivery Plan");
    expect(markdownContent).toContain("- Step 1");

    // Verify JSON output
    const jsonContent = JSON.parse(await readFile(jsonOutputPath, "utf8"));
    expect(jsonContent).toHaveProperty("generatedAt");
    expect(jsonContent.sections).toHaveLength(2);
    expect(jsonContent.sections[0]).toEqual({
      content: appOverview,
      title: "Overview"
    });
    expect(jsonContent.sections[1]).toEqual({
      content: "- Step 1\n- Step 2",
      title: "Delivery Plan"
    });

    await rm(directory, { recursive: true });
  });

  it("uses default paths when none provided", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "plan-test-"));
    const originalCwd = process.cwd();
    process.chdir(directory);

    const sections = [{ content: "Test content", title: "Test" }];
    const result = await writePlan(sections);

    expect(result.markdownPath).toBe(path.join(directory, "plan.md"));
    expect(result.jsonPath).toBe(path.join(directory, "plan.json"));

    // Verify markdown output
    const markdownContent = await readFile(
      path.join(directory, "plan.md"),
      "utf8"
    );
    expect(markdownContent).toContain("# Plan");
    expect(markdownContent).toContain("## Test");

    // Verify JSON output
    const jsonContent = JSON.parse(
      await readFile(path.join(directory, "plan.json"), "utf8")
    );
    expect(jsonContent).toHaveProperty("generatedAt");
    expect(jsonContent.sections).toHaveLength(1);
    expect(jsonContent.sections[0]).toEqual({
      content: "Test content",
      title: "Test"
    });

    process.chdir(originalCwd);
    await rm(directory, { recursive: true });
  });
});
