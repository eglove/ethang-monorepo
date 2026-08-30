import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/the-model-is-the-easy-part/index.mdx",
  import.meta.url
);

const pubDate = "2026-08-30T18:06:00Z";

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
  "grand-plan.md",
  "JetBrains",
  "MCP",
  "Ollama",
  "TLA+",
  "https://openrouter.ai/",
  "https://z.ai/"
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

  it("keeps the reader-centric voice with no first-person framing", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toMatch(firstPerson);
  });
});
