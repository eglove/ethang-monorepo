#!/usr/bin/env node
// @ts-check
/**
 * GitHub Copilot CLI `PostToolUse` hook that runs WebStorm MCP inspections
 * on the file the agent just edited or created.
 *
 * Wired up via `.github/hooks/post-tool-inspect.json`:
 *
 *   {
 *     "version": 1,
 *     "hooks": {
 *       "postToolUse": [
 *         {
 *           "type": "command",
 *           "matcher": "^(edit|create)$",
 *           "powershell": "node scripts/post-tool-inspect.mjs",
 *           "timeoutSec": 15
 *         }
 *       ]
 *     }
 *   }
 *
 * Input on stdin is a JSON document with shape:
 *
 *   {
 *     "sessionId": "...",
 *     "timestamp": 1700000000000,
 *     "cwd": "C:\\...\\ethang-monorepo",
 *     "toolName": "edit" | "create" | ...,
 *     "toolArgs": { "file_path": "apps/auth/src/db/schema.ts", ... },
 *     "toolResult": { "resultType": "success", "textResultForLlm": "..." }
 *   }
 *
 * Pipeline:
 *   1. Read the JSON input from stdin
 *   2. Filter to toolName ∈ {edit, create}
 *   3. Extract `file_path` from toolArgs and resolve to a repo-relative POSIX path
 *   4. Open an MCP SSE session against WebStorm's local MCP server
 *      (`http://127.0.0.1:64506`), call `tools/call` → `get_file_problems`,
 *      surface ERROR/WARNING/INFORMATION diagnostics
 *   5. Format the diagnostics and emit a PostToolUse output JSON envelope
 *      on stdout with `hookSpecificOutput.additionalContext`
 *
 * We do NOT filter by extension — if the MCP can't analyze a file, it just
 * returns `errors: []` and we emit an empty envelope (quiet success).
 *
 * Spelling inspections are intentionally suppressed here because cspell is
 * the source of truth for spelling in this repo.
 *
 * Output envelope (per https://docs.github.com/en/copilot/reference/hooks-reference#posttooluse-output):
 *
 *   {
 *     "hookSpecificOutput": {
 *       "hookEventName": "PostToolUse",
 *       "additionalContext": "...diagnostics..."
 *     }
 *   }
 *
 * Exit codes:
 *   - 0 = always (we must never block the agent; even on failure we emit an
 *     envelope that tells the model what we tried and what failed)
 *   - The hook is fire-and-forget by design.
 *
 * WebStorm MCP transport (WebStorm ≥ 2025.2 with MCP Server plugin):
 *   GET  /sse                       -> Server-Sent Events handshake
 *   POST /message?sessionId=<uuid>  -> JSON-RPC requests
 *   The SSE response must stay open after the handshake — do NOT destroy
 *   the underlying request; the response arrives as a subsequent SSE frame.
 */

import process from "node:process";
import http from "node:http";
import path from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// JetBrains MCP Server plugin listens on localhost only. Hardcoded per the
// repo's local-dev convention; if you change the port in WebStorm, update
// MCP_PORT here. See `.github/hooks/post-tool-inspect.json` for the wiring.
const MCP_HOST = "127.0.0.1";
const MCP_PORT = 64506;

// Tunable via env: POST_TOOL_INSPECT_TIMEOUT_MS (default 8000),
// POST_TOOL_MCP_HANDSHAKE_TIMEOUT_MS (default 5000).
const INSPECT_TIMEOUT_MS = Number.parseInt(
  process.env.POST_TOOL_INSPECT_TIMEOUT_MS ?? "8000",
  10,
) || 8000;
const MCP_HANDSHAKE_TIMEOUT_MS = Number.parseInt(
  process.env.POST_TOOL_MCP_HANDSHAKE_TIMEOUT_MS ?? "5000",
  10,
) || 5000;

const SPELLING_REGEX = /(Spelling|Typo|CheckSpelling|SpellChecker)/i;

// ---------------------------------------------------------------------------
// Stdin
// ---------------------------------------------------------------------------

/** Read all of stdin as a UTF-8 string. */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
  }
  return chunks.join("");
}

// ---------------------------------------------------------------------------
// Hook input parsing
// ---------------------------------------------------------------------------

/** True if `toolName` matches the hook's matcher (`edit` or `create`). */
function isEditOrCreateTool(toolName) {
  return toolName === "edit" || toolName === "create";
}

/** Extract `file_path` / `filePath` / `path` from the toolArgs object. */
function extractFilePath(toolArgs) {
  if (!toolArgs || typeof toolArgs !== "object") return null;
  const candidates = ["file_path", "filePath", "path"];
  for (const k of candidates) {
    const v = toolArgs[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  if (toolArgs.args && typeof toolArgs.args === "object") {
    return extractFilePath(toolArgs.args);
  }
  return null;
}

/**
 * Resolve an absolute or repo-relative file path to a repo-relative POSIX
 * path. Returns null if the file is not inside `repoRoot` (e.g. the user
 * edited something outside the repo).
 */
function resolveRepoPath(filePath, repoRoot) {
  if (!filePath) return null;
  let abs = filePath;
  if (!path.isAbsolute(abs)) {
    abs = path.join(repoRoot, abs);
  }
  abs = path.resolve(abs);
  const rel = path.relative(repoRoot, abs).split(path.sep).join("/");
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return rel;
}

// ---------------------------------------------------------------------------
// WebStorm MCP transport
// ---------------------------------------------------------------------------

/**
 * Open the JetBrains MCP SSE stream at http://127.0.0.1:64506/sse and resolve
 * with `{ sseRes, messagePath, host, port }` once the initial endpoint frame
 * arrives. Rejects on connect failure / timeout.
 *
 * The SSE response must stay open after this resolves — `mcpCall` reuses it
 * to read MCP responses. Do NOT `destroy(req)` in the success path; doing so
 * closes the underlying socket and the agent hits a 3-second handshake
 * timeout when the first tool call arrives.
 */
function connectMcp(timeoutMs) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finishErr = (err) => {
      if (done) return;
      done = true;
      reject(err);
    };
    const onData = (chunk) => {
      const m = String(chunk).match(/data:\s*(\/\S+)/);
      if (m) {
        if (done) return;
        done = true;
        sseRes.off("data", onData);
        sseRes.off("error", onErr);
        resolve({ sseRes, messagePath: m[1].trim(), host: MCP_HOST, port: MCP_PORT });
      }
    };
    const onErr = (err) => finishErr(err);
    let sseRes = null;
    const req = http.request(
      {
        host: MCP_HOST,
        port: MCP_PORT,
        path: "/sse",
        method: "GET",
        headers: { Accept: "text/event-stream" },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          finishErr(new Error(`GET /sse -> HTTP ${res.statusCode}`));
          return;
        }
        res.setEncoding("utf8");
        sseRes = res;
        res.on("data", onData);
        res.on("error", onErr);
      },
    );
    req.on("error", finishErr);
    req.setTimeout(timeoutMs, () => {
      try {
        req.destroy();
      } catch {
        /* ignore */
      }
      finishErr(
        new Error(
          `GET /sse timed out after ${timeoutMs}ms (is WebStorm running with the MCP Server plugin enabled?)`,
        ),
      );
    });
    req.end();
  });
}

/**
 * Send a JSON-RPC request over the SSE session POST endpoint and read the
 * matching response off the SSE stream. Returns the parsed response, or
 * rejects on timeout/error.
 */
function mcpCall(conn, id, method, params, timeoutMs) {
  const { sseRes, messagePath, port, host } = conn;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        postReq.destroy();
      } catch {
        /* ignore */
      }
      reject(new Error(`mcpCall(${method}) timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    let buf = "";
    const onData = (chunk) => {
      buf += chunk;
      // SSE frames are separated by blank lines. A frame is one or more
      // `data: ...` lines plus an optional `event: ...` line.
      const frames = buf.split(/\r?\n\r?\n/);
      while (frames.length > 1) {
        const frame = frames.shift();
        buf = frames.join("\n\n");
        const dataLines = frame.split(/\r?\n/).filter((l) => l.startsWith("data:"));
        if (dataLines.length === 0) continue;
        const payload = dataLines.map((l) => l.slice(5).trim()).join("\n");
        try {
          const obj = JSON.parse(payload);
          if (obj && obj.id === id) {
            clearTimeout(timer);
            sseRes.off("data", onData);
            sseRes.off("end", onEnd);
            resolve(obj);
            return;
          }
        } catch {
          // Non-JSON SSE keepalive/comment; ignore and wait for next frame.
        }
      }
    };
    const onEnd = () => {
      clearTimeout(timer);
      sseRes.off("data", onData);
      reject(new Error("SSE stream ended before response"));
    };
    sseRes.on("data", onData);
    sseRes.on("end", onEnd);

    const postReq = http.request(
      {
        host,
        port,
        path: messagePath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        // POST /message replies 202 Accepted (delivered via SSE). Drain and forget.
        res.resume();
        if (res.statusCode >= 400) {
          clearTimeout(timer);
          sseRes.off("data", onData);
          reject(new Error(`POST ${messagePath} -> HTTP ${res.statusCode}`));
        }
      },
    );
    postReq.on("error", (err) => {
      clearTimeout(timer);
      sseRes.off("data", onData);
      reject(err);
    });
    postReq.write(body);
    postReq.end();
  });
}

/** Fire-and-forget POST for notifications (no JSON-RPC id, no response). */
function mcpNotify(conn, method, params) {
  const { messagePath, port, host } = conn;
  const body = JSON.stringify({ jsonrpc: "2.0", method, params });
  const req = http.request(
    {
      host,
      port,
      path: messagePath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    (r) => r.resume(),
  );
  req.on("error", () => {
    /* ignore */
  });
  req.write(body);
  req.end();
}

// ---------------------------------------------------------------------------
// Inspection driver
// ---------------------------------------------------------------------------

/**
 * Run a single MCP `get_file_problems` call against the IDE and return
 * `{ ran, diagnostics, suppressedSpellings, description? }`.
 * On any failure `ran` is `false` and `description` explains the failure.
 */
async function runInspect(repoRel, repoRoot) {
  let conn;
  try {
    conn = await connectMcp(MCP_HANDSHAKE_TIMEOUT_MS);
  } catch (err) {
    return { ran: false, description: String(err.message ?? err), diagnostics: [] };
  }

  const out = { ran: true, diagnostics: [], suppressedSpellings: 0 };
  try {
    const handshakeMs = Math.min(5000, Math.max(1500, Math.floor(INSPECT_TIMEOUT_MS / 6)));
    let nextId = 1;
    await mcpCall(
      conn,
      nextId++,
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "post-tool-inspect", version: "1.0.0" },
      },
      handshakeMs,
    );
    mcpNotify(conn, "notifications/initialized", {});

    const toolResult = await mcpCall(
      conn,
      nextId++,
      "tools/call",
      {
        name: "get_file_problems",
        arguments: {
          filePath: repoRel,
          errorsOnly: false,
          projectPath: repoRoot,
          timeout: INSPECT_TIMEOUT_MS,
        },
      },
      INSPECT_TIMEOUT_MS,
    );
    if (toolResult.error) {
      throw new Error(toolResult.error.message ?? JSON.stringify(toolResult.error));
    }
    const payload = toolResult.result ?? {};
    let errors = [];
    if (Array.isArray(payload.content)) {
      for (const c of payload.content) {
        if (c && c.type === "text" && typeof c.text === "string") {
          try {
            const inner = JSON.parse(c.text);
            if (Array.isArray(inner.errors)) errors = inner.errors;
          } catch {
            /* ignore non-JSON text */
          }
        }
      }
    }
    for (const e of errors) {
      const sev = String(e.severity ?? "WARNING").toUpperCase();
      const desc = String(e.description ?? "");
      const insp = e.inspectionId ? String(e.inspectionId) : "";
      if (SPELLING_REGEX.test(desc) || SPELLING_REGEX.test(insp)) {
        out.suppressedSpellings++;
        continue;
      }
      out.diagnostics.push({
        severity: sev,
        line: e.line ?? null,
        column: e.column ?? null,
        description: desc,
        inspectionId: insp || "WebStormInspection",
      });
    }
    return out;
  } catch (err) {
    return { ran: false, description: String(err.message ?? err), diagnostics: [] };
  } finally {
    try {
      conn.sseRes.destroy();
    } catch {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

/** Format diagnostics for the model. Returns null if there is nothing useful to surface. */
function formatDiagnostics(file, diagnostics, suppressedSpellings) {
  if (!diagnostics || diagnostics.length === 0) return null;
  const lines = [`WebStorm MCP inspections for \`${file}\`:`];
  for (const d of diagnostics) {
    const sev = String(d.severity ?? "WARNING").toUpperCase();
    const insp = d.inspectionId || "WebStormInspection";
    const loc = `L${d.line ?? "?"}:C${d.column ?? "?"}`;
    const desc = String(d.description ?? "").replace(/\s+/g, " ").trim();
    lines.push(`- [${sev}] \`${insp}\` at ${loc} — ${desc}`);
  }
  if (suppressedSpellings > 0) {
    lines.push(
      `(${suppressedSpellings} spelling warning(s) suppressed — cspell is the source of truth)`,
    );
  }
  return lines.join("\n");
}

function emptyEnvelope() {
  return { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "" } };
}

function contextEnvelope(context) {
  return { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context } };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let payload;
  try {
    const raw = await readStdin();
    payload = JSON.parse(raw);
  } catch {
    process.stdout.write(JSON.stringify(emptyEnvelope()) + "\n");
    return;
  }

  const toolName = String(payload?.toolName ?? "");
  if (!isEditOrCreateTool(toolName)) {
    process.stdout.write(JSON.stringify(emptyEnvelope()) + "\n");
    return;
  }

  const toolArgs = payload?.toolArgs;
  const rawPath = extractFilePath(toolArgs);
  if (!rawPath) {
    process.stdout.write(JSON.stringify(emptyEnvelope()) + "\n");
    return;
  }

  const repoRoot = String(payload?.cwd ?? process.cwd());
  const repoRel = resolveRepoPath(rawPath, repoRoot);
  if (!repoRel) {
    // File lives outside the repo (e.g. /tmp scratch file). Skip silently.
    process.stdout.write(JSON.stringify(emptyEnvelope()) + "\n");
    return;
  }

  const result = await runInspect(repoRel, repoRoot);
  if (!result.ran) {
    const reason = result.description ?? "WebStorm MCP unavailable";
    process.stdout.write(
      JSON.stringify(
        contextEnvelope(
          `WebStorm MCP inspection skipped for \`${repoRel}\` (${reason}). ` +
            `This is informational; the edit still applied.`,
        ),
      ) + "\n",
    );
    return;
  }

  const text = formatDiagnostics(repoRel, result.diagnostics, result.suppressedSpellings ?? 0);
  if (!text) {
    // Clean file — don't surface noise. Just emit empty envelope.
    process.stdout.write(JSON.stringify(emptyEnvelope()) + "\n");
    return;
  }
  process.stdout.write(JSON.stringify(contextEnvelope(text)) + "\n");
}

main().catch((err) => {
  process.stderr.write(`post-tool-inspect: unexpected error: ${err.stack ?? err.message}\n`);
  process.stdout.write(JSON.stringify(emptyEnvelope()) + "\n");
});