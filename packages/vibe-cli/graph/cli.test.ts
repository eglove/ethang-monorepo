import trim from "lodash/trim.js";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDiscoveriesPath, runCli } from "./cli.js";
import { DedupStateMachine } from "./dedup.js";
import { replayDiscoveries } from "./index.js";

describe("graph/cli", () => {
  let temporaryDirectory: string;
  let discoveriesPath: string;
  const originalEnvironment = process.env["VIBE_CLI_GRAPH_DISCOVERIES"];

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "vibe-cli-graph-"));
    discoveriesPath = path.join(temporaryDirectory, "discoveries.jsonl");
    process.env["VIBE_CLI_GRAPH_DISCOVERIES"] = discoveriesPath;
  });

  afterEach(() => {
    if (originalEnvironment === undefined) {
      delete process.env["VIBE_CLI_GRAPH_DISCOVERIES"];
    } else {
      process.env["VIBE_CLI_GRAPH_DISCOVERIES"] = originalEnvironment;
    }
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it("resolves the env-override discoveries path", () => {
    expect(getDiscoveriesPath()).toBe(discoveriesPath);
  });

  it("add-node appends a JSON record", () => {
    const result = runCli(["add-node", "pkg/a.ts", "file"]);
    expect(result.code).toBe(0);
    const content = readFileSync(discoveriesPath, "utf8");
    expect(JSON.parse(trim(content))).toEqual({
      kind: "node",
      path: "pkg/a.ts",
      type: "file",
    });
  });

  it("add-edge appends a JSON record", () => {
    const result = runCli(["add-edge", "pkg/a.ts", "pkg/b.ts", "imports"]);
    expect(result.code).toBe(0);
    const content = readFileSync(discoveriesPath, "utf8");
    expect(JSON.parse(trim(content))).toEqual({
      from: "pkg/a.ts",
      kind: "edge",
      to: "pkg/b.ts",
      type: "imports",
    });
  });

  it("rejects unknown node type with exit 2", () => {
    const result = runCli(["add-node", "pkg/a.ts", "bogus"]);
    expect(result.code).toBe(2);
    expect(result.message).toContain("invalid node type");
    expect(existsSync(discoveriesPath)).toBe(false);
  });

  it("rejects unknown edge type with exit 2", () => {
    const result = runCli(["add-edge", "a", "b", "bogus"]);
    expect(result.code).toBe(2);
    expect(result.message).toContain("invalid edge type");
  });

  it("reset empties the discoveries file", () => {
    runCli(["add-node", "pkg/a.ts", "file"]);
    runCli(["reset"]);
    expect(readFileSync(discoveriesPath, "utf8")).toBe("");
  });

  it("unknown command returns exit 2 with usage", () => {
    const result = runCli(["nope"]);
    expect(result.code).toBe(2);
    expect(result.message).toContain("usage:");
  });

  it("missing args return exit 2", () => {
    expect(runCli(["add-node"]).code).toBe(2);
    expect(runCli(["add-node", "pkg/a.ts"]).code).toBe(2);
    expect(runCli(["add-edge", "a", "b"]).code).toBe(2);
  });

  it("round-trips through replay into a DedupStateMachine", () => {
    runCli(["add-node", "pkg/a.ts", "file"]);
    runCli(["add-node", "pkg/b.ts", "file"]);
    runCli(["add-edge", "pkg/a.ts", "pkg/b.ts", "imports"]);

    const machine = new DedupStateMachine();
    const applied = replayDiscoveries(machine, discoveriesPath);

    expect(applied).toBe(3);
    expect(machine.graph.nodeCount()).toBe(2);
    expect(machine.graph.edgeCount()).toBe(1);
    expect(machine.graph.hasNode("pkg/a.ts")).toBe(true);
    expect(machine.graph.hasEdge("pkg/a.ts", "pkg/b.ts")).toBe(true);
  });

  it("replay skips malformed JSON lines without crashing", () => {
    writeFileSync(
      discoveriesPath,
      '{"kind":"node","path":"pkg/a.ts","type":"file"}\n' +
        "not-json\n" +
        '{"kind":"node","path":"pkg/b.ts","type":"file"}\n',
      "utf8",
    );

    const machine = new DedupStateMachine();
    const applied = replayDiscoveries(machine, discoveriesPath);

    expect(applied).toBe(2);
    expect(machine.graph.hasNode("pkg/a.ts")).toBe(true);
    expect(machine.graph.hasNode("pkg/b.ts")).toBe(true);
  });
});
