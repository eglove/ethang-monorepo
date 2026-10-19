import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/skills-that-teach-the-scientific-method/index.mdx",
  import.meta.url
);

const postDate = "2026-10-19T12:00:00Z";

const imagePaths = {
  skillLoop: new URL(
    "blog/skills-that-teach-the-scientific-method/images/skill-loop.svg",
    import.meta.url
  )
};

const requiredSnippets = [
  // Intro
  "the scaffolding an AI model acts through",
  "[eThang Agent](https://github.com/eglove/ethang-agent)",
  "the decision to make the procedures inside it look like a scientific loop",

  // A prompt is a paragraph
  "I never bought prompt engineering",
  "A prompt is a paragraph; a procedure is a sequence with branches",
  "[agentskills.io](https://agentskills.io/specification)",
  "progressive disclosure",
  "a few hundred tokens of Markdown against tens of thousands of tokens of tool schemas",

  // What the agent actually sees
  "SkillsListingPromptProvider",
  "## Built-in",
  "## Global directory skills",
  "## Workspace directory skills",
  "## Learned",
  "8,000 characters",
  "60 characters",
  "Error [NameCollision]",
  "Error [BuiltInImmutable]",
  "showed 42 of 61 skills",
  "never silent",

  // Loading a body
  "skill_view",
  "[skill systematic-debugging | builtin | v1]",
  "verbatim",

  // Making the method a skill
  "gate, don't mandate",
  "A prediction states what you expect to see and names the exact check that would",
  "systematic-debugging",
  "experiment-driven-development",
  "every claim states its evidence",
  "It's the skill being followed, by me, on this post",

  // The ledger
  "sci.<slug>/ledger",
  "record-prediction",
  "falsifiedBy",
  "Error [PredictionAlreadyJudged]",
  "An open prediction is an untested claim",

  // Where it breaks
  "keyword matching",
  "Activation, not selection, is the failure",
  "WhenClauses",
  "tools/SkillActivationEval",
  "expectNone",

  // Why procedures are worth having
  "SkillsBench",
  "16.2 percentage points",
  "self-generated skills provide no benefit on average",
  "26.7 to 36.0 percentage points",

  // What I'm still unsure about
  "Whether the loop earns its cost",
  "Whether the ledger changes behavior or just records it",
  "Whether the Learned group survives",
  "inspectable",

  // Sources
  "https://arxiv.org/abs/2602.12670",
  "https://arxiv.org/abs/2605.31408",
  "https://metr.org/blog/2025-06-05-recent-reward-hacking/",
  "https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals",
  "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills",
  "https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/"
] as const;

const forbiddenSnippets = [
  // The post speaks as the builder, not to a stakeholder audience
  "stakeholder",
  "if you are the",
  "you can hold the system to"
] as const;

describe("Skills That Teach the Scientific Method", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "skills-that-teach-the-scientific-method"');
    expect(post).toContain('title: "Skills That Teach the Scientific Method"');
    expect(post).toContain('blogCategory: "Engineering"');
    expect(post).toContain(`pubDate: "${postDate}"`);
    expect(post).toContain(`updatedDate: "${postDate}"`);
    expect(post).toContain("featuredImage: ./images/featured.jpg");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it.each(forbiddenSnippets)(
    "does not address the reader as %s",
    async (snippet) => {
      const post = await readFile(postPath, "utf8");

      expect(post.toLowerCase()).not.toContain(snippet);
    }
  );

  it("embeds the featured diagram", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain("featuredImage: ./images/featured.jpg");
    expect(post).toContain('import SkillLoop from "./images/skill-loop.svg";');
    expect(post).toContain("<PostImage src={SkillLoop}");
  });

  it("ships a featured image with descriptive alt text", async () => {
    const post = await readFile(postPath, "utf8");
    const featured = await readFile(
      new URL(
        "blog/skills-that-teach-the-scientific-method/images/featured.jpg",
        import.meta.url
      )
    );

    expect(featured.length).toBeGreaterThan(10_000);
    // JPEG magic bytes
    expect(featured[0]).toBe(0xff);
    expect(featured[1]).toBe(0xd8);
    expect(post).toContain(
      'featuredImageAlt: "A dark circuit-board illustration'
    );
  });

  it("ships the diagram as a complete, accessible SVG", async () => {
    const svg = await readFile(imagePaths.skillLoop, "utf8");

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<title id=");
    expect(svg).toContain("<desc id=");
    expect(svg).toContain('role="img"');
  });

  it("keeps the public copy byte-identical to the source diagram", async () => {
    const source = await readFile(imagePaths.skillLoop, "utf8");
    const published = await readFile(
      new URL(
        "../../public/images/blog/skills-that-teach-the-scientific-method/skill-loop.svg",
        import.meta.url
      ),
      "utf8"
    );

    expect(published).toEqual(source);
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain(String.raw`C:\Users`);
  });
});
