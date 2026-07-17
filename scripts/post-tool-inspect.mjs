#!/usr/bin/env node
// PostToolUse hook: read JSON from stdin, apply eslint --fix to the file the
// agent just edited/created (Node API + flat-config auto-discovery picks up
// the right workspace's `eslint.config.*`), then call WebStorm MCP
// `get_file_problems` and return diagnostics envelope.
//
//   stdin  = PostToolUse payload
//            { toolName: "edit"|"create", toolArgs: <JSON string>, cwd, ... }
//   stdout = { additionalContext }  (see hooks-reference#posttooluse-output)

import http from "node:http";
import path from "node:path";
import process from "node:process";
import { Buffer } from "node:buffer";

const MCP_HOST = "127.0.0.1";
const MCP_PORT = 64506;
const MCP_PATH = "/sse";
const TOOL_TIMEOUT_MS = 15_000;
const SSE_DEADLINE_MS = 20_000;
// eslint --fix is best-effort inside the hook; the parent hook budget is 15s.
const ESLINT_TIMEOUT_MS = 10_000;

async function applyEslintFix(repoRoot, absFilePath) {
  // ESLint's flat-config resolver walks up from each target file looking for
  // the nearest eslint.config.{js,ts,mjs,cjs}, so passing the repo root as
  // `cwd` plus the absolute file path is enough to land in the right
  // workspace's config without us resolving the workspace manually.
  let ESLint;
  try {
    const mod = await import("eslint");
    ESLint = mod.ESLint ?? mod.default?.ESLint;
  } catch {
    return 0;
  }
  if (!ESLint) return 0;

  let eslint;
  try {
    eslint = new ESLint({ cwd: repoRoot, fix: true });
  } catch {
    return 0;
  }

  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve("timeout"), ESLINT_TIMEOUT_MS);
  });
  const work = (async () => {
    const results = await eslint.lintFiles([absFilePath]);
    await ESLint.outputFixes(results);
    return results.reduce(
      (acc, r) => acc + (r.output ? 1 : 0),
      0,
    );
  })().catch(() => 0);

  try {
    const fixed = await Promise.race([work, timeout]);
    return typeof fixed === "number" ? fixed : 0;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const emit = (context) =>
    process.stdout.write(
      JSON.stringify({ additionalContext: context ?? "" }),
    );

  const raw = await new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf8")),
    );
    process.stdin.on("error", reject);
  });

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return emit();
  }
  if (payload?.toolName !== "edit" && payload?.toolName !== "create") {
    return emit();
  }

  // toolArgs is a JSON-encoded STRING. Decode once.
  let args = payload?.toolArgs;
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      return emit();
    }
  }
  const argPath =
    args?.file_path ?? args?.filePath ?? args?.path ?? args?.args?.file_path;
  if (typeof argPath !== "string" || argPath.length === 0) return emit();

  const repoRoot = String(payload?.cwd ?? process.cwd()).replace(/\\/g, "/");
  const filePath = argPath.replace(/\\/g, "/");
  const rel = filePath.startsWith(repoRoot)
    ? filePath.slice(repoRoot.length).replace(/^\/+/, "")
    : filePath;
    const absFilePath = path.resolve(
      filePath.startsWith(repoRoot) ? filePath : path.join(repoRoot, filePath),
    );
    await applyEslintFix(repoRoot, absFilePath);

  // SSE: attach listener BEFORE the request goes out.
  const sseRes = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: MCP_HOST,
        port: MCP_PORT,
        path: MCP_PATH,
        method: "GET",
        headers: { Accept: "text/event-stream" },
      },
      (res) => {
        res.setEncoding("utf8");
        resolve(res);
      },
    );
    req.on("error", reject);
    req.end();
  });

  let messagePath;
  const responses = new Map();
  const endpointSeen = new Promise((resolve) => {
    let buf = "";
    const onData = (chunk) => {
      buf += chunk;
      const frames = buf.split(/\r?\n\r?\n/);
      for (const frame of frames.slice(0, -1)) {
        const dataLines = frame
          .split(/\r?\n/)
          .filter((l) => l.startsWith("data:"));
        if (dataLines.length === 0) continue;
        const text = dataLines.map((l) => l.slice(5).trim()).join("\n");
        if (!messagePath) {
          const m = text.match(/^(\/\S+)$/);
          if (m) {
            messagePath = m[1];
            resolve();
          }
          continue;
        }
        try {
          const obj = JSON.parse(text);
          if (obj?.id != null) responses.set(obj.id, obj);
        } catch {
          /* partial frame; wait for next */
        }
      }
      buf = frames.at(-1) ?? "";
    };
    sseRes.on("data", onData);
  });
  await endpointSeen;

  const post = (body) =>
    new Promise((resolve) => {
      const json = JSON.stringify(body);
      const req = http.request(
        {
          host: MCP_HOST,
          port: MCP_PORT,
          path: messagePath,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(json),
            Connection: "close",
          },
        },
        (res) => {
          res.resume();
          res.on("end", resolve);
        },
      );
      req.on("error", () => resolve());
      req.write(json);
      req.end();
    });

  await post({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "post-tool-inspect", version: "1.0.0" },
    },
  });
  await post({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  });
  await post({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "get_file_problems",
      arguments: {
        filePath: rel,
        errorsOnly: false,
        projectPath: repoRoot,
        timeout: TOOL_TIMEOUT_MS,
      },
    },
  });

  const deadline = Date.now() + SSE_DEADLINE_MS;
  while (Date.now() < deadline && !responses.has(2)) {
    await new Promise((r) => setTimeout(r, 100));
  }
  sseRes.destroy();

  const toolResult = responses.get(2);
  if (!toolResult?.result?.content) return emit();

  const errors = toolResult.result.content
    .filter((c) => c?.type === "text" && typeof c.text === "string")
    .map((c) => {
      try {
        return JSON.parse(c.text).errors ?? [];
      } catch {
        return [];
      }
    })
    .flat();

  if (errors.length === 0) return emit();

  const lines = [`WebStorm MCP inspections for \`${rel}\`:`];
  for (const e of errors) {
    const sev = String(e.severity ?? "WARNING").toUpperCase();
    const insp = String(e.inspectionId ?? "WebStormInspection");
    const loc = `L${e.line ?? "?"}:C${e.column ?? "?"}`;
    const desc = String(e.description ?? "").replace(/\s+/g, " ").trim();
    lines.push(`- [${sev}] \`${insp}\` at ${loc} — ${desc}`);
  }
  emit(lines.join("\n"));
}

await main();
