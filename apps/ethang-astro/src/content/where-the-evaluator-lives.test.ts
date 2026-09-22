import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/where-the-evaluator-lives/index.mdx",
  import.meta.url
);

const featuredImagePath = new URL(
  "blog/where-the-evaluator-lives/images/featured.jpg",
  import.meta.url
);

const pubDate = "2026-09-22T19:30:00Z";

const requiredSnippets = [
  'slug: "where-the-evaluator-lives"',
  'title: "Where the Evaluator Lives"',
  'blogCategory: "Blog"',
  `pubDate: "${pubDate}"`,
  "description:",
  "featuredImage: ./images/featured.jpg",
  "featuredImageAlt:",
  "September 18, 2026",
  "Gemini",
  "seven weeks",
  "Pattern Labs",
  "November 2023",
  "Unit 81",
  "Unit 8200",
  "RAND",
  "Sequoia",
  "Redpoint",
  "$80 million",
  "$450 million",
  "SOLVE",
  "system cards",
  "Dario Amodei",
  "No regulator with jurisdiction",
  "no accreditation to suspend",
  "no disclosure obligation",
  "zeitenwende",
  "Katherine Thomas",
  "The Record",
  "total incident count",
  "University of Surrey",
  "falsifiable by an outside reader",
  "believed they were in simulated environments",
  "AI Evaluator Forum",
  "structurally hollow",
  "Government Decision 173",
  "Policy Principles for Regulation and Ethics of AI",
  "TheMarker",
  "White & Case",
  "label election content",
  "National AI Program",
  "NATAN",
  "1,000 NVIDIA B200s",
  "100,000-GPU",
  "Bletchley",
  "Paris summit",
  "Israel Democracy Institute",
  "Adam, Machine, State",
  "State Comptroller",
  "107/2024",
  "CTech",
  "Lutnick",
  "suspend all access to Fable 5 and Mythos 5 by any foreign national",
  "June 30",
  "RUSI",
  "Louise Marie Hurel",
  "least able",
  "NSO Group",
  "Candiru",
  "Pegasus",
  "102 countries to 37",
  "encryption export order",
  "March 2026",
  "an observation, not a sourced claim",
  "an analogy rather than a sourced claim",
  "\u{00A3}459,000",
  "Pattern Labs Tech Inc",
  "USAspending",
  "Brussels",
  "load-bearing for multiple competitors' safety claims at once",
  "name the evaluator in contracts",
  "our evaluation partner",
  "September 1",
  "September 19",
  "internet-connected testing",
  "Bloomberg",
  "California requires disclosure",
  "EU AI Act",
  "```mermaid",
  "accTitle: Who answers for the evaluation layer",
  "no edges into the layer it would oversee",
  "the sandbox belonged to the vendor",
  "[the Wall Street Journal reported](http",
  "[Google confirmed it the same day](https://www.cnbc.com/2026/09/18/",
  "[the fictional target shared its name with a real domain](https://www.axios.com/2026/09/19/",
  "[Irregular](https://thenextweb.com/news/irregular-four-labs-one-issue-disclosure-timeline-gemini)",
  String.raw`[The company raised \$80 million](https://www.calcalistech.com/ctechnews/article/h1g4zg00igg)`,
  "[Lahav served in Unit 81](https://www.ynetnews.com/magazine/article/syber7xg11g)",
  "[Anthropic disclosed three incidents on July 30](https://www.anthropic.com/news/investigating-incidents-cybersecurity-evals)",
  "[A fourth Anthropic incident surfaced on September 9](https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents)",
  "[OpenAI disclosed on August 4](https://openai.com/index/third-party-cyber-evaluations-involving-openai-models/)",
  "[blamed an Irregular misconfiguration](https://thenextweb.com/news/irregular-ai-testing-vendor-openai-anthropic-meta-breaches)",
  "[The vendor's postmortem](https://irregular.com/research/addressing-recent-incidents-ongoing-findings-and-path-forward)",
  "[the OpenAI breach at Hugging Face](https://huggingface.co/blog/agent-intrusion-technical-timeline)",
  "[The UK AI Safety Institute](https://www.aisi.gov.uk/)",
  "[no regulator with jurisdiction, no accreditation to suspend, and no disclosure obligation](https://zeitenwendegroup.com/p/the-layer-nobody-certified)",
  "[BERI's proposal](https://www.beri.net/article/irregular-shared-evaluation-vendor-three-labs-ai-assurance-concentration)",
  "[TMLS's analysis](https://tmls.nyc)",
  "[EFF's proposal](https://www.eff.org/deeplinks/2026/09/eff-lawmakers-ground-ai-cybersecurity-rules-best-practices)",
  "[RUSI's Louise Marie Hurel](https://www.rusi.org/explore-our-research/publications/commentary/gatekeeping-frontier-when-ai-access-becomes-national-security-concern)",
  "nowhere"
] as const;

describe("Where the Evaluator Lives", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "where-the-evaluator-lives"');
    expect(post).toContain('title: "Where the Evaluator Lives"');
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain("description:");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("renders exactly one mermaid diagram", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post.match(/```mermaid/gu) ?? []).toHaveLength(1);
  });

  it("presents the verdict claims as scannable labeled paragraphs", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain("**Whose law reaches the vendor:**");
    expect(post).toContain("**What reacted:**");
    expect(post).toContain("**Who is moving:**");
  });

  it("marks both original connections as unsourced", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain("an observation, not a sourced claim");
    expect(post).toContain("an analogy rather than a sourced claim");
  });

  it("ships the featured image as a valid JPEG", async () => {
    const image = await readFile(featuredImagePath);

    expect(image.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  it("escapes currency dollars so the math pipeline leaves them literal", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toMatch(/(?<!\\)\$[1-9]/u);
    expect(post).toContain(String.raw`\$80 million`);
    expect(post).toContain(String.raw`\$450 million`);
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain(String.raw`C:\Users`);
    expect(post).not.toContain("personal-vault");
  });
});
