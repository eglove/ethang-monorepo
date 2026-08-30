import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/the-model-is-the-easy-part/index.mdx",
  import.meta.url
);

const pubDate = "2026-08-30T18:06:00Z";
const updatedDate = "2026-08-30T18:38:02Z";

const imagePaths = {
  dbDiagram: new URL(
    "blog/the-model-is-the-easy-part/images/ethang-agent-db.png",
    import.meta.url
  ),
  execCalls: new URL(
    "blog/the-model-is-the-easy-part/images/exec-calls.png",
    import.meta.url
  ),
  statusLine: new URL(
    "blog/the-model-is-the-easy-part/images/statusline.png",
    import.meta.url
  )
};

const requiredSnippets = [
  "eThang Agent",
  "the scaffolding an AI model acts through",
  "one project per bounded context",
  "eThangAgent.Tool.Domain",
  "eThangAgent.Roslyn.ACL",
  "eThangAgent.Composition",
  "eThangAgent.Desktop",
  "anti-corruption layer",
  "mirror-image test projects",
  "fakes only",
  "mock provider server",
  "xUnit v3",
  "The harness exposes discrete tools",
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
  "<PostImage src={ExecCalls}",
  "<PostImage src={StatusLine}",
  'alt="The desktop transcript with exec tool calls rendered as expandable cards"',
  'alt="The status bar showing a live context utilization readout for the open session"',
  'import DbDiagram from "./images/ethang-agent-db.png";',
  "<PostImage src={DbDiagram}",
  'alt="Diagram of the eThang Agent SQLite database, grouped by bounded context with foreign-key relationships between tables"'
] as const;

describe("The Model Is the Easy Part blog post", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "the-model-is-the-easy-part"');
    expect(post).toContain(
      'title: "The Model Is the Easy Part: Inside the eThang Agent Harness"'
    );
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain(`updatedDate: "${updatedDate}"`);
    expect(post).not.toContain("featuredImage:");
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
