import { Effect } from "effect";
import endsWith from "lodash/endsWith.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import trimStart from "lodash/trimStart.js";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const getCiYamlPath = () => {
  const cwd = process.cwd();
  const path1 = path.join(cwd, ".github", "workflows", "ci.yml");
  if (existsSync(path1)) {
    return path1;
  }
  const path2 = path.join(cwd, "..", "..", ".github", "workflows", "ci.yml");
  return existsSync(path2)
    ? path2
    : Effect.runSync(
        Effect.die(new Error("Could not find .github/workflows/ci.yml"))
      );
};

const getJobNames = (lines: string[]) => {
  const result: string[] = [];
  let isInJobs = false;

  for (const rawLine of lines) {
    const trimmed = trim(rawLine);
    const isEmptyOrComment = "" === trimmed || startsWith(trimmed, "#");
    const indent = rawLine.length - trimStart(rawLine).length;

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

const findJobStartLineIndex = (lines: string[], jobName: string) => {
  let isInJobs = false;
  let index = 0;

  for (const rawLine of lines) {
    const trimmed = trim(rawLine);
    const isEmptyOrComment = "" === trimmed || startsWith(trimmed, "#");
    const indent = rawLine.length - trimStart(rawLine).length;

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

const getJobLines = (lines: string[], jobName: string) => {
  const result: string[] = [];
  const startIndex = findJobStartLineIndex(lines, jobName);

  if (-1 === startIndex) {
    return result;
  }

  const subsequentLines = lines.slice(startIndex + 1);

  for (const rawLine of subsequentLines) {
    const trimmed = trim(rawLine);
    const isEmptyOrComment = "" === trimmed || startsWith(trimmed, "#");
    const indent = rawLine.length - trimStart(rawLine).length;

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

const parseStep = (stepLines: string[]) => {
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

const getJobSteps = (jobLines: string[]) => {
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

const getStepLabel = (step: StepInfo) => {
  const { uses } = step;
  const { run } = step;

  if (!isNil(uses)) {
    const usesMappings = [
      { key: "checkout", pattern: CHECKOUT_ACTION },
      { key: "pnpm-setup", pattern: "pnpm/action-setup" },
      { key: "setup-node", pattern: "actions/setup-node" },
      { key: "cache", pattern: "actions/cache" },
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
      { key: "build", pattern: "pnpm build" },
      { key: "playwright-install", pattern: "playwright install" }
    ];
    for (const mapping of runMappings) {
      if (includes(run, mapping.pattern)) {
        return mapping.key;
      }
    }
  }

  return "unknown";
};

type ActionPin = {
  action: string;
  sha: string;
  tag: string;
};

const TEST_SHA = "3d3c42e5aac5ba805825da76410c181273ba90b1";
const OTHER_SHA = "0ebf47130e4866e96fce0953f49152a61190b271";
const TEST_TAG = "v6.1.0";
const TAG_REF = "refs/tags/v6.1.0";
const PEELED_TAG_REF = "refs/tags/v6.1.0^{}";
const CHECKOUT_ACTION = "actions/checkout";
const refLine = (sha: string, ref: string) => {
  return `${sha}\t${ref}`;
};
const commonStepLabels = [
  "checkout",
  "pnpm-setup",
  "setup-node",
  "install",
  "cache",
  "playwright-install",
  "build"
];

const parseActionPin = (usesValue: string) => {
  const pinRegex = /^(\S+)@([a-fA-F0-9]{40})\s*#\s*(v\d+\.\d+\.\d+)/u;
  const match = pinRegex.exec(usesValue);

  if (isNil(match)) {
    return Effect.runSync(
      Effect.die(new Error(`Invalid action pin: ${usesValue}`))
    );
  }

  return {
    action: match[1] ?? "",
    sha: match[2] ?? "",
    tag: match[3] ?? ""
  };
};

const getActionPins = (rawLines: string[]) => {
  const pins: ActionPin[] = [];

  for (const rawLine of rawLines) {
    const trimmed = trim(rawLine);
    let usesValue: string | undefined;

    if (startsWith(trimmed, "uses:")) {
      usesValue = trim(trimmed.slice(5));
    } else if (includes(trimmed, " uses:")) {
      usesValue = trim(trimmed.slice(trimmed.indexOf(":") + 1));
    } else {
      // do nothing
    }

    if (!isNil(usesValue) && !startsWith(usesValue, "./")) {
      pins.push(parseActionPin(usesValue));
    } else {
      // do nothing
    }
  }

  return pins;
};

const pickCommitSha = (refLines: string[], tag: string) => {
  const peeledRef = `refs/tags/${tag}^{}`;
  const tagRef = `refs/tags/${tag}`;
  let peeledSha: string | undefined;
  let tagSha: string | undefined;

  for (const rawLine of refLines) {
    const line = trim(rawLine);
    if ("" === line) {
      // do nothing
    } else {
      const [sha, ref] = split(line, "\t");
      if (ref === peeledRef) {
        peeledSha = sha;
      } else if (ref === tagRef) {
        tagSha = sha;
      } else {
        // do nothing
      }
    }
  }

  if (!isNil(peeledSha)) {
    return peeledSha;
  }
  return isNil(tagSha)
    ? Effect.runSync(
        Effect.die(new Error(`Tag ${tag} not found in git ls-remote output`))
      )
    : tagSha;
};

const execFileAsync = promisify(execFile);

const lsRemoteRefs = async (action: string, tag: string) => {
  const pathParts = split(action, "/");
  const repoUrl = `https://github.com/${pathParts[0]}/${pathParts[1]}`;
  const result = await execFileAsync(
    "git",
    ["ls-remote", repoUrl, `refs/tags/${tag}`, `refs/tags/${tag}^{}`],
    { timeout: 30_000 }
  ).catch((error: unknown) => {
    return Effect.runSync(
      Effect.die(
        new Error(`git ls-remote failed for ${action}@${tag}: ${String(error)}`)
      )
    );
  });

  return split(result.stdout, /\r?\n/u);
};

const checkNoSecretsInEnvironment = (lines: string[], startIndent: number) => {
  let isInEnvironment = false;
  let environmentIndent = -1;

  for (const rawLine of lines) {
    const trimmed = trim(rawLine);
    const indent = rawLine.length - trimStart(rawLine).length;

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
      const indent = rawLine.length - trimStart(rawLine).length;

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

  it.each([
    {
      expected: [...commonStepLabels, "lint", "git diff"],
      jobName: "lint"
    },
    {
      expected: commonStepLabels,
      jobName: "build"
    },
    {
      expected: [...commonStepLabels, "test", "sonar"],
      jobName: "test"
    }
  ])(
    "should run $jobName job steps in the correct order",
    ({ expected, jobName }) => {
      const steps = getJobSteps(getJobLines(yamlLines, jobName));
      const labels = map(steps, (step) => {
        return getStepLabel(step);
      });

      expect(labels).toEqual(expected);
    }
  );

  it("should configure test checkout step with fetch-depth: 0", () => {
    const testLines = getJobLines(yamlLines, "test");
    const steps = getJobSteps(testLines);
    let isCheckoutFetchDepthZero = false;

    for (const step of steps) {
      if (
        !isNil(step.uses) &&
        includes(step.uses, CHECKOUT_ACTION) &&
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

describe("CI Action Pin Validation", () => {
  const actionPins = getActionPins(
    split(readFileSync(getCiYamlPath(), "utf8"), /\r?\n/u)
  );

  it.each([
    {
      expected: { action: "actions/cache", sha: TEST_SHA, tag: TEST_TAG },
      usesValue: `actions/cache@${TEST_SHA} #v6.1.0`
    },
    {
      expected: { action: CHECKOUT_ACTION, sha: TEST_SHA, tag: "v7.0.1" },
      usesValue: `actions/checkout@${TEST_SHA} #v7.0.1 v6`
    },
    {
      expected: {
        action: "github/codeql-action/init",
        sha: TEST_SHA,
        tag: "v4.37.3"
      },
      usesValue: `github/codeql-action/init@${TEST_SHA} #v4.37.3`
    }
  ])("should parse valid action pin: $usesValue", ({ expected, usesValue }) => {
    expect(parseActionPin(usesValue)).toEqual(expected);
  });

  it.each([
    {
      description: "missing version comment",
      usesValue: `actions/cache@${TEST_SHA}`
    },
    {
      description: "branch name instead of sha",
      usesValue: "actions/cache@v6.1.0"
    },
    { description: "short sha", usesValue: "actions/cache@abc123 #v6.1.0" },
    {
      description: "non-semver comment",
      usesValue: `actions/cache@${TEST_SHA} #main`
    },
    { description: "empty value", usesValue: "" }
  ])("should die on invalid action pin: $description", ({ usesValue }) => {
    expect(() => {
      return parseActionPin(usesValue);
    }).toThrow();
  });

  it.each([
    {
      expected: TEST_SHA,
      name: "lightweight tag",
      refLines: [refLine(TEST_SHA, TAG_REF)],
      tag: TEST_TAG
    },
    {
      expected: OTHER_SHA,
      name: "annotated tag prefers peeled commit",
      refLines: [
        refLine(TEST_SHA, TAG_REF),
        refLine(OTHER_SHA, PEELED_TAG_REF)
      ],
      tag: TEST_TAG
    },
    {
      expected: TEST_SHA,
      name: "ignores unrelated refs",
      refLines: [
        refLine(OTHER_SHA, "refs/heads/main"),
        refLine(TEST_SHA, TAG_REF)
      ],
      tag: TEST_TAG
    }
  ])("should pick the commit sha for $name", ({ expected, refLines, tag }) => {
    expect(pickCommitSha(refLines, tag)).toBe(expected);
  });

  it.each([
    { name: "empty output", refLines: [], tag: TEST_TAG },
    {
      name: "tag absent from output",
      refLines: [refLine(TEST_SHA, "refs/tags/v6.0.0")],
      tag: TEST_TAG
    }
  ])("should die when the tag is not found: $name", ({ refLines, tag }) => {
    expect(() => {
      return pickCommitSha(refLines, tag);
    }).toThrow();
  });

  it("should find pinned actions in the workflow", () => {
    expect(actionPins.length).toBeGreaterThanOrEqual(7);
  });

  it.each(actionPins)(
    "$action@$tag should resolve to the pinned commit sha",
    async (pin) => {
      const refLines = await lsRemoteRefs(pin.action, pin.tag);
      expect(pickCommitSha(refLines, pin.tag)).toBe(pin.sha);
    },
    60_000
  );
});
