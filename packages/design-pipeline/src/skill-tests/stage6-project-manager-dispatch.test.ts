import findIndex from "lodash/findIndex.js";
import includes from "lodash/includes.js";
import some from "lodash/some.js";
import split from "lodash/split.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".claude",
  "skills",
  "design-pipeline",
  "SKILL.md",
);

const content = readFileSync(SKILL_PATH, "utf8");
const lines = split(content, "\n");

describe("design-pipeline SKILL.md — Stage 6 project-manager dispatch", () => {
  it("contains a dispatch instruction referencing project-manager", () => {
    expect(content).toMatch(/dispatch.*project.manager|project.manager.*dispatch/iu);
  });

  it("references the project-manager AGENT.md path", () => {
    expect(content).toContain(
      ".claude/skills/project-manager/AGENT.md",
    );
  });

  it("passes implementation plan to the dispatch", () => {
    const dispatchIndex = findIndex(lines, (line) => {
      return (
        includes(line.toLowerCase(), "project-manager") ||
        includes(line.toLowerCase(), "project manager")
      );
    });

    expect(dispatchIndex).toBeGreaterThan(-1);

    const dispatchSlice = lines.slice(dispatchIndex, dispatchIndex + 30);
    const hasImplementationPlan = some(dispatchSlice, (line) => {
      return includes(line.toLowerCase(), "implementation plan");
    });

    expect(hasImplementationPlan).toBe(true);
  });

  it("passes accumulated pipeline context to the dispatch", () => {
    const dispatchIndex = findIndex(lines, (line) => {
      return (
        includes(line.toLowerCase(), "project-manager") ||
        includes(line.toLowerCase(), "project manager")
      );
    });

    expect(dispatchIndex).toBeGreaterThan(-1);

    const dispatchSlice = lines.slice(dispatchIndex, dispatchIndex + 30);
    const dispatchText = dispatchSlice.join("\n").toLowerCase();

    expect(dispatchText).toMatch(/accumulated.*pipeline.*context|pipeline.*context/iu);
  });

  it("passes integration branch to the dispatch", () => {
    const dispatchIndex = findIndex(lines, (line) => {
      return (
        includes(line.toLowerCase(), "project-manager") ||
        includes(line.toLowerCase(), "project manager")
      );
    });

    expect(dispatchIndex).toBeGreaterThan(-1);

    const dispatchSlice = lines.slice(dispatchIndex, dispatchIndex + 30);
    const hasIntegrationBranch = some(dispatchSlice, (line) => {
      return includes(line.toLowerCase(), "integration branch");
    });

    expect(hasIntegrationBranch).toBe(true);
  });

  it("dispatch occurs after the confirmation gate", () => {
    const confirmationGateIndex = findIndex(lines, (line) => {
      return (
        includes(line, "STAGE_6_CONFIRMATION_GATE") ||
        includes(line, "Confirmation Gate")
      );
    });

    const dispatchIndex = findIndex(lines, (line) => {
      return (
        includes(line.toLowerCase(), "dispatch") &&
        (includes(line.toLowerCase(), "project-manager") ||
          includes(line.toLowerCase(), "project manager"))
      );
    });

    expect(confirmationGateIndex).toBeGreaterThan(-1);
    expect(dispatchIndex).toBeGreaterThan(-1);
    expect(dispatchIndex).toBeGreaterThan(confirmationGateIndex);
  });
});
