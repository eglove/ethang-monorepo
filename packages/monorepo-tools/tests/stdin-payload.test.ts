import { describe, expect, it } from "vitest";

import { parsePostToolUseFile } from "../src/domain/stdin-payload.ts";

const REPO_ROOT = "C:/repo";

describe(parsePostToolUseFile, () => {
  it("returns null when toolName is not edit/create", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { file_path: "src/a.ts" },
      toolName: "bash"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toBeNull();
  });

  it("decodes toolArgs provided as a JSON string", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: JSON.stringify({ file_path: "src/a.ts" }),
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/a.ts",
      relFilePath: "src/a.ts",
      repoRoot: "C:/repo"
    });
  });

  it("decodes toolArgs provided as an object", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { file_path: "src/a.ts" },
      toolName: "create"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/a.ts",
      relFilePath: "src/a.ts",
      repoRoot: "C:/repo"
    });
  });

  it("treats an absent toolArgs as null", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toBeNull();
  });

  it("returns null when toolArgs is neither a string nor a valid arguments object", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: 42,
      toolName: "edit"
    });

    expect(() => {
      parsePostToolUseFile(raw, REPO_ROOT);
    }).toThrow(/stdin-payload/u);
  });

  it("returns null when toolArgs JSON string is malformed", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: "{ not json",
      toolName: "edit"
    });

    expect(() => {
      parsePostToolUseFile(raw, REPO_ROOT);
    }).toThrow(/stdin-payload/u);
  });

  it("returns null when no file_path field is present in toolArgs", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { unrelated: "value" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toBeNull();
  });

  it("reads filePath alias when file_path is missing", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { filePath: "src/b.ts" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/b.ts",
      relFilePath: "src/b.ts",
      repoRoot: "C:/repo"
    });
  });

  it("reads path alias when file_path and filePath are missing", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { path: "src/c.ts" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/c.ts",
      relFilePath: "src/c.ts",
      repoRoot: "C:/repo"
    });
  });

  it("reads args.file_path nested alias when top-level aliases are missing", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { args: { file_path: "src/d.ts" } },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/d.ts",
      relFilePath: "src/d.ts",
      repoRoot: "C:/repo"
    });
  });

  it("ignores empty string file_path candidates", () => {
    const raw = JSON.stringify({
      cwd: REPO_ROOT,
      toolArgs: { file_path: "", filePath: "src/e.ts" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/e.ts",
      relFilePath: "src/e.ts",
      repoRoot: "C:/repo"
    });
  });

  it("uses fallbackCwd when cwd is absent", () => {
    const raw = JSON.stringify({
      toolArgs: { file_path: "src/f.ts" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/f.ts",
      relFilePath: "src/f.ts",
      repoRoot: "C:/repo"
    });
  });

  it("normalizes Windows backslashes to forward slashes", () => {
    const raw = JSON.stringify({
      cwd: String.raw`C:\repo`,
      toolArgs: { file_path: String.raw`src\g.ts` },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/g.ts",
      relFilePath: "src/g.ts",
      repoRoot: "C:/repo"
    });
  });

  it("strips trailing slashes from the repoRoot", () => {
    const raw = JSON.stringify({
      cwd: "C:/repo/",
      toolArgs: { file_path: "src/h.ts" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/h.ts",
      relFilePath: "src/h.ts",
      repoRoot: "C:/repo"
    });
  });

  it("returns abs path unchanged when filePath already starts with repoRoot", () => {
    const raw = JSON.stringify({
      cwd: "C:/repo",
      toolArgs: { file_path: "C:/repo/src/i.ts" },
      toolName: "edit"
    });

    expect(parsePostToolUseFile(raw, REPO_ROOT)).toStrictEqual({
      absFilePath: "C:/repo/src/i.ts",
      relFilePath: "src/i.ts",
      repoRoot: "C:/repo"
    });
  });

  it("throws when the payload itself is not valid JSON", () => {
    expect(() => {
      parsePostToolUseFile("not json at all", REPO_ROOT);
    }).toThrow(/stdin-payload/u);
  });

  it("throws when payload is missing required toolName", () => {
    const raw = JSON.stringify({ cwd: REPO_ROOT });

    expect(() => {
      parsePostToolUseFile(raw, REPO_ROOT);
    }).toThrow(/stdin-payload/u);
  });
});
