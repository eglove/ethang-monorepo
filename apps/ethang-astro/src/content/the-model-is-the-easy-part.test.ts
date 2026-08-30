import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/the-model-is-the-easy-part/index.mdx",
  import.meta.url
);

const pubDate = "2026-08-30T18:06:00Z";

const imagePaths = {
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
  "timeoutSeconds",
  "Error [ToolTimeout]",
  "Roslyn",
  "OpenRouter",
  "z.ai",
  "80%",
  "SQLite",
  "DPAPI",
  "depth limit",
  "ToolCallEnvelopeParser",
  "Minimum: 1",
  "overwrite is exactly true",
  "in the project's own words: a fullscreen IDE",
  "JetBrains",
  "MCP",
  "Ollama",
  "TLA+",
  "https://openrouter.ai/",
  "https://z.ai/"
] as const;

const requiredImageSnippets = [
  'import PostImage from "../../../components/ui/PostImage.astro";',
  'import ExecCalls from "./images/exec-calls.png";',
  'import StatusLine from "./images/statusline.png";',
  "<PostImage src={ExecCalls}",
  "<PostImage src={StatusLine}",
  'alt="The desktop transcript with exec tool calls rendered as expandable cards"',
  'alt="The status bar showing a live context utilization readout for the open session"'
] as const;

const firstPerson = /\b(I|me|my|we|us|our)\b/u;

describe("The Model Is the Easy Part blog post", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "the-model-is-the-easy-part"');
    expect(post).toContain('title: "The Model Is the Easy Part"');
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain(`updatedDate: "${pubDate}"`);
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
    const [execCalls, statusLine] = await Promise.all([
      readFile(imagePaths.execCalls),
      readFile(imagePaths.statusLine)
    ]);

    expect(execCalls.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47])
    );
    expect(statusLine.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47])
    );
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain("do not use it as a guide");
    expect(post).not.toContain("grand-plan.md");
    expect(post).not.toContain(String.raw`C:\Users`);
  });

  it("keeps the reader-centric voice with no first-person framing", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toMatch(firstPerson);
  });
});
