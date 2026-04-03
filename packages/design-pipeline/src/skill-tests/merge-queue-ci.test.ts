import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CI_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".github",
  "workflows",
  "ci.yml",
);

const content = readFileSync(CI_PATH, "utf8").replaceAll("\r\n", "\n");

const PULL_REQUEST_TRIGGER = "pull_request:";
const MERGE_GROUP_TRIGGER = "merge_group:";
const BRANCHES_MASTER = "branches: [master]";

describe("CI workflow merge queue support", () => {
  it("contains pull_request trigger", () => {
    expect(content).toContain(PULL_REQUEST_TRIGGER);
  });

  it("contains merge_group trigger", () => {
    expect(content).toContain(MERGE_GROUP_TRIGGER);
  });

  it("pull_request trigger still targets master branch", () => {
    expect(content).toContain(BRANCHES_MASTER);
  });

  it("parses as valid YAML (on: block structure)", () => {
    const onBlock = /^on:\s*\n([\S\s]*?)(?=\n\S|\n$)/mu.exec(content);
    expect(onBlock).not.toBeNull();
    expect(onBlock?.[1]).toContain(PULL_REQUEST_TRIGGER);
    expect(onBlock?.[1]).toContain(MERGE_GROUP_TRIGGER);
  });

  it("uses LF line endings only", () => {
    expect(content).not.toContain("\r\n");
  });
});
