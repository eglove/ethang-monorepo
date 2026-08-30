import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/ethang-agent-vs-the-field/index.mdx",
  import.meta.url
);

const pubDate = "2026-08-30T18:06:00Z";
const updatedDate = "2026-08-30T18:38:02Z";

const imagePaths = {
  dbDiagram: new URL(
    "blog/ethang-agent-vs-the-field/images/ethang-agent-db.png",
    import.meta.url
  ),
  execCalls: new URL(
    "blog/ethang-agent-vs-the-field/images/exec-calls.png",
    import.meta.url
  ),
  statusLine: new URL(
    "blog/ethang-agent-vs-the-field/images/statusline.png",
    import.meta.url
  )
};

const requiredSnippets = [
  "ethang-agent-vs-the-field",
  "the scaffolding an AI model acts through",
  "Claude Code",
  "OpenAI Codex",
  "Gemini CLI",
  "Cursor",
  "Windsurf",
  "OpenCode",
  "one project per bounded context",
  "eThangAgent.Tool.Domain",
  "eThangAgent.Roslyn.ACL",
  "eThangAgent.Composition",
  "eThangAgent.Desktop",
  "anti-corruption layer",
  "eThang Agent exposes discrete tools",
  "working_diff",
  "sub-agent spawning",
  "timeoutSeconds",
  "Error [ToolTimeout]",
  "Roslyn",
  "depth limit",
  "80%",
  "SQLite",
  "DPAPI",
  "ToolCallEnvelopeParser",
  "Minimum: 1",
  "overwrite is exactly true",
  "file explorer",
  "diffing",
  "static analysis",
  "kanban",
  "database view",
  "debug port",
  "Debug Adapter Protocol",
  "JetBrains",
  "MCP",
  "Ollama",
  "TLA+",
  "[eThang Agent](https://github.com/eglove/ethang-agent)",
  "[OpenRouter](https://openrouter.ai/)",
  "[z.ai](https://z.ai/)"
] as const;

const requiredImageSnippets = [
  'import PostImage from "../../../components/ui/PostImage.astro";',
  'import ExecCalls from "./images/exec-calls.png";',
  'import StatusLine from "./images/statusline.png";',
  'import DbDiagram from "./images/ethang-agent-db.png";',
  "<PostImage src={ExecCalls}",
  "<PostImage src={StatusLine}",
  "<PostImage src={DbDiagram}",
  'alt="The desktop transcript with exec tool calls rendered as expandable cards"',
  'alt="The status bar showing a live context utilization readout for the open session"',
  'alt="Diagram of the eThang Agent SQLite database, grouped by bounded context with foreign-key relationships between tables"',
  '<div className="rounded-lg"',
  'style={{ backgroundColor: "#ffffff", padding: "0.5rem" }}'
] as const;

describe("eThang Agent vs the field", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "ethang-agent-vs-the-field"');
    expect(post).toContain(
      'title: "eThang Agent vs the Field: How a Windows-Native Harness Compares"'
    );
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain(`updatedDate: "${updatedDate}"`);
    expect(post).toContain("featuredImage: ./images/exec-calls.png");
    expect(post).toContain(
      'featuredImageAlt: "The eThang Agent desktop transcript with exec tool calls rendered as expandable cards, the program on the call and the full result below."'
    );
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it.each(requiredImageSnippets)(
    "embeds the screenshot %s",
    async (snippet) => {
      const post = await readFile(postPath, "utf8");

      expect(post).toContain(snippet);
    }
  );

  it("ships the screenshots as valid PNGs", async () => {
    const [execCalls, statusLine, dbDiagram] = await Promise.all([
      readFile(imagePaths.execCalls),
      readFile(imagePaths.statusLine),
      readFile(imagePaths.dbDiagram)
    ]);

    expect(execCalls.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47])
    );
    expect(statusLine.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47])
    );
    expect(dbDiagram.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47])
    );
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain("do not use it as a guide");
    expect(post).not.toContain("grand-plan.md");
    expect(post).not.toContain(String.raw`C:\Users`);
  });
});
