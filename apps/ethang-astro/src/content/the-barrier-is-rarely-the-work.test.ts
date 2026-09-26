import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/the-barrier-is-rarely-the-work/index.mdx",
  import.meta.url
);

const featuredImagePath = new URL(
  "blog/the-barrier-is-rarely-the-work/images/featured.jpg",
  import.meta.url
);

const pubDate = "2026-09-20T12:00:00Z";

const requiredSnippets = [
  "10-second",
  "214",
  "style, not substance",
  "awkwardness",
  "2-4 second",
  "a relational one",
  "DeBrabander",
  "Morrison",
  "double empathy problem",
  "Damian Milton",
  "social deficit",
  "Crompton",
  "telephone",
  "clarity is kindness",
  "Orion Kelly",
  "Autistic people see kindness as honesty",
  "culture fit",
  "Lauren Rivera",
  "looking-glass merit",
  "discrimination with better manners",
  "LaFawn Davis",
  "beer with you",
  "Austin and Pisano",
  "Neurodiversity as a Competitive Advantage",
  "22%",
  "$8.10",
  "53.4%",
  "Roux",
  "Putting on My Best Normal",
  "to know and be known",
  "eye contact",
  "stims",
  "Hull",
  "Cassidy",
  "72%",
  "cross-sectional",
  "Raymaker",
  "psychic plaque",
  "skill regression",
  "autistic burnout",
  "3+ months",
  "Higgins",
  "occupational burnout",
  "Norris",
  "Lindsay",
  "Tomas",
  "61%",
  "$300",
  "85%",
  "interactive process",
  "undue hardship",
  "I need X to do my job",
  "EEOC",
  "in an autistic way",
  "the rater is the variable",
  "```mermaid",
  "accTitle: Thin-slice experiment ratings",
  "accTitle: Information transfer chains",
  "accTitle: The masking burnout loop",
  "accTitle: Five defaults and their adjustments",
  "Same 10-second introductions",
  "watched the video",
  "read the transcript",
  "all-autistic chain",
  "most detail lost, worst rapport",
  "masking: suppress traits, perform normal",
  "the default instinct",
  "work samples instead of rapport",
  "The 2017 thin-slice experiment: the rating gap exists only in the video condition.",
  "Crompton et al. 2020: mixed chains lost the most detail and reported the worst rapport.",
  "The masking burnout loop: each pass through the cycle deepens the next, and years of it exits into burnout.",
  "The five defaults from this section, and the adjustment each one calls for.",
  "featuredImage: ./images/featured.jpg",
  'featuredImageAlt: "A man pressing his palm against a glass pane etched with a maze pattern, meeting his own reflection on the other side."',
  'updatedDate: "2026-09-25T12:00:00Z"',
  "Update, September 25, 2026",
  "](/blog/graded-as-morals)"
] as const;

describe("The Barrier Is Rarely the Work", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "the-barrier-is-rarely-the-work"');
    expect(post).toContain('title: "The Barrier Is Rarely the Work"');
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain("description:");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("renders exactly four mermaid diagrams", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post.match(/```mermaid/gu) ?? []).toHaveLength(4);
  });

  it("ships the featured image as a valid JPEG", async () => {
    const image = await readFile(featuredImagePath);

    expect(image.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain(String.raw`C:\Users`);
    expect(post).not.toContain("personal-vault");
  });
});
