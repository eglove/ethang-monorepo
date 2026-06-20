import endsWith from "lodash/endsWith.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

const getCiYamlPath = (): string => {
  const cwd = process.cwd();
  const path1 = path.join(cwd, ".github", "workflows", "ci.yml");
  if (existsSync(path1)) {
    return path1;
  }
  const path2 = path.join(cwd, "..", "..", ".github", "workflows", "ci.yml");
  if (existsSync(path2)) {
    return path2;
  }
  throw new Error("Could not find .github/workflows/ci.yml");
};

const getJobNames = (lines: string[]): string[] => {
  const result: string[] = [];
  let isInJobs = false;

  for (const rawLine of lines) {
    const trimmed = trim(rawLine);
    const isEmptyOrComment = "" === trimmed || startsWith(trimmed, "#");
    const indent = rawLine.length - rawLine.trimStart().length;

    if (!isEmptyOrComment) {
      if ("jobs:" === trimmed) {
        isInJobs = true;
      } else if (isInJobs && 0 === indent) {
        isInJobs = false;
      } else if (isInJobs && 2 === indent && endsWith(trimmed, ":")) {
        result.push(trimmed.slice(0, -1));
      } else {
        // do nothing
      }
    }
  }

  return result;
};

const findJobStartLineIndex = (lines: string[], jobName: string): number => {
  let isInJobs = false;
  let index = 0;

  for (const rawLine of lines) {
    const trimmed = trim(rawLine);
    const isEmptyOrComment = "" === trimmed || startsWith(trimmed, "#");
    const indent = rawLine.length - rawLine.trimStart().length;

    if (!isEmptyOrComment) {
      if ("jobs:" === trimmed) {
        isInJobs = true;
      } else if (isInJobs && 0 === indent) {
        isInJobs = false;
      } else if (isInJobs && 2 === indent && trimmed === `${jobName}:`) {
        return index;
      } else {
        // do nothing
      }
    }
    index += 1;
  }

  return -1;
};

const getJobLines = (lines: string[], jobName: string): string[] => {
  const result: string[] = [];
  const startIndex = findJobStartLineIndex(lines, jobName);

  if (-1 === startIndex) {
    return result;
  }

  const subsequentLines = lines.slice(startIndex + 1);

  for (const rawLine of subsequentLines) {
    const trimmed = trim(rawLine);
    const isEmptyOrComment = "" === trimmed || startsWith(trimmed, "#");
    const indent = rawLine.length - rawLine.trimStart().length;

    if (!isEmptyOrComment) {
      if (2 >= indent) {
        break;
      }
      result.push(rawLine);
    }
  }

  return result;
};

type StepInfo = {
  fetchDepth?: string;
  hasGithubToken?: boolean;
  hasSonarToken?: boolean;
  run?: string;
  uses?: string;
};

const parseStep = (stepLines: string[]): StepInfo => {
  const step: StepInfo = {};

  for (const rawLine of stepLines) {
    const trimmed = trim(rawLine);
    const line = startsWith(trimmed, "-") ? trim(trimmed.slice(1)) : trimmed;

    if (startsWith(line, "uses:")) {
      step.uses = trim(line.slice(5));
    } else if (startsWith(line, "run:")) {
      step.run = trim(line.slice(4));
    } else if (startsWith(line, "fetch-depth:")) {
      step.fetchDepth = trim(line.slice(12));
    } else {
      if (includes(line, "SONAR_TOKEN")) {
        step.hasSonarToken = true;
      }
      if (includes(line, "GITHUB_TOKEN")) {
        step.hasGithubToken = true;
      }
    }
  }

  return step;
};

const getJobSteps = (jobLines: string[]): StepInfo[] => {
  const steps: StepInfo[] = [];
  let currentLines: string[] = [];
  let isSeenFirstStep = false;

  for (const rawLine of jobLines) {
    const trimmed = trim(rawLine);
    if (startsWith(trimmed, "-")) {
      isSeenFirstStep = true;
      if (0 < currentLines.length) {
        steps.push(parseStep(currentLines));
        currentLines = [];
      }
    }
    if (isSeenFirstStep) {
      currentLines.push(rawLine);
    }
  }

  if (0 < currentLines.length) {
    steps.push(parseStep(currentLines));
  }

  return steps;
};

const getStepLabel = (step: StepInfo): string => {
  const { uses } = step;
  const { run } = step;

  if (!isNil(uses)) {
    const usesMappings = [
      { key: "checkout", pattern: "actions/checkout" },
      { key: "pnpm-setup", pattern: "pnpm/action-setup" },
      { key: "setup-node", pattern: "actions/setup-node" },
      { key: "sonar", pattern: "SonarSource/sonarqube-scan-action" }
    ];
    for (const mapping of usesMappings) {
      if (includes(uses, mapping.pattern)) {
        return mapping.key;
      }
    }
  }

  if (!isNil(run)) {
    const runMappings = [
      { key: "install", pattern: "pnpm install" },
      { key: "lint", pattern: "pnpm lint" },
      { key: "git diff", pattern: "git diff" },
      { key: "test", pattern: "pnpm test" },
      { key: "build", pattern: "pnpm build" }
    ];
    for (const mapping of runMappings) {
      if (includes(run, mapping.pattern)) {
        return mapping.key;
      }
    }
  }

  return "unknown";
};

const checkNoSecretsInEnvironment = (
  lines: string[],
  startIndent: number
): void => {
  let isInEnvironment = false;
  let environmentIndent = -1;

  for (const rawLine of lines) {
    const trimmed = trim(rawLine);
    const indent = rawLine.length - rawLine.trimStart().length;

    if ("env:" === trimmed && indent === startIndent) {
      isInEnvironment = true;
      environmentIndent = indent;
    } else if (isInEnvironment) {
      if (indent <= environmentIndent) {
        isInEnvironment = false;
      } else {
        expect(includes(trimmed, "SONAR_TOKEN")).toBe(false);
        expect(includes(trimmed, "GITHUB_TOKEN")).toBe(false);
      }
    } else {
      // do nothing
    }
  }
};

describe("CI Workflow Validation", () => {
  const yamlContent = readFileSync(getCiYamlPath(), "utf8");
  const yamlLines = map(split(yamlContent, /\r?\n/u), (rawLine) => {
    const commentIndex = rawLine.indexOf("#");
    return -1 === commentIndex ? rawLine : rawLine.slice(0, commentIndex);
  });

  it("should have global permissions locked to contents: read", () => {
    let hasContentsRead = false;
    let isInPermissions = false;

    for (const rawLine of yamlLines) {
      const line = trim(rawLine);
      const indent = rawLine.length - rawLine.trimStart().length;

      if ("permissions:" === line) {
        isInPermissions = true;
      } else if (isInPermissions && 0 === indent && "" !== line) {
        isInPermissions = false;
      } else if (
        isInPermissions &&
        startsWith(line, "contents:") &&
        includes(line, "read")
      ) {
        hasContentsRead = true;
      } else {
        // do nothing
      }
    }

    expect(hasContentsRead).toBe(true);
  });

  it("should have exactly 5 jobs: lint, build, test, codeql, megalinter", () => {
    const jobNames = getJobNames(yamlLines);
    expect(jobNames).toContain("lint");
    expect(jobNames).toContain("build");
    expect(jobNames).toContain("test");
    expect(jobNames).toContain("codeql");
    expect(jobNames).toContain("megalinter");
    expect(jobNames).toHaveLength(5);
  });

  it("should configure the parallel jobs correctly (runs-on, timeout-minutes)", () => {
    const targetJobs = ["lint", "build", "test"];
    for (const jobName of targetJobs) {
      const jobLines = getJobLines(yamlLines, jobName);
      let isRunsOnUbuntu = false;
      let isTimeout15 = false;

      for (const rawLine of jobLines) {
        const line = trim(rawLine);
        if (startsWith(line, "runs-on:") && includes(line, "ubuntu-latest")) {
          isRunsOnUbuntu = true;
        } else if (
          startsWith(line, "timeout-minutes:") &&
          includes(line, "15")
        ) {
          isTimeout15 = true;
        } else {
          // do nothing
        }
      }

      expect(isRunsOnUbuntu).toBe(true);
      expect(isTimeout15).toBe(true);
    }
  });

  it("should run test job steps in the correct order", () => {
    const testLines = getJobLines(yamlLines, "test");
    const steps = getJobSteps(testLines);
    const labels = map(steps, (step) => {
      return getStepLabel(step);
    });

    expect(labels).toEqual([
      "checkout",
      "pnpm-setup",
      "setup-node",
      "install",
      "test",
      "sonar"
    ]);
  });

  it("should configure test checkout step with fetch-depth: 0", () => {
    const testLines = getJobLines(yamlLines, "test");
    const steps = getJobSteps(testLines);
    let isCheckoutFetchDepthZero = false;

    for (const step of steps) {
      if (
        !isNil(step.uses) &&
        includes(step.uses, "actions/checkout") &&
        "0" === step.fetchDepth
      ) {
        isCheckoutFetchDepthZero = true;
      }
    }

    expect(isCheckoutFetchDepthZero).toBe(true);
  });

  it("should pin all external action references to 40-character SHAs", () => {
    const shaRegex = /@[a-fA-F0-9]{40}$/u;
    let checkedCount = 0;

    for (const rawLine of yamlLines) {
      const trimmed = trim(rawLine);
      if (startsWith(trimmed, "uses:") || includes(trimmed, " uses:")) {
        const colonIndex = trimmed.indexOf(":");
        const usesValue = trim(trimmed.slice(colonIndex + 1));
        if (!startsWith(usesValue, "./")) {
          expect(usesValue).toMatch(shaRegex);
          checkedCount += 1;
        }
      }
    }

    expect(checkedCount).toBeGreaterThan(0);
  });

  it("should scope secrets (SONAR_TOKEN, GITHUB_TOKEN) to step levels only", () => {
    checkNoSecretsInEnvironment(yamlLines, 0);

    const jobs = ["lint", "build", "test", "codeql", "megalinter"];
    for (const jobName of jobs) {
      const jobLines = getJobLines(yamlLines, jobName);
      checkNoSecretsInEnvironment(jobLines, 4);
    }

    const testLines = getJobLines(yamlLines, "test");
    const steps = getJobSteps(testLines);

    for (const step of steps) {
      const label = getStepLabel(step);
      if ("sonar" !== label) {
        expect(step.hasSonarToken).toBeUndefined();
        expect(step.hasGithubToken).toBeUndefined();
      }
    }
  });
});
